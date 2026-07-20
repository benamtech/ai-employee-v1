import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import type { Hono } from "hono";
import type { ProvisionerOperation, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { queueProvisioningCommand, PROVISIONING_COMMAND_TYPES, type ProvisioningCommandType } from "./lib/provisioning-state-machine.js";
import { startProvisioningReconciler } from "./lib/provisioning-reconciler.js";
import { replayAmbientDeadLetter, startAmbientInboxWorker } from "./lib/ambient-inbox.js";

const DESTRUCTIVE_PROVISIONER_OPERATIONS = new Set<ProvisionerOperation>([
  "remove_runtime",
  "suspend_runtime",
  "restart_runtime",
  "replace_runtime",
  "restore_runtime",
]);

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function expectedToken(): string {
  return requiredEnv("PROVISIONER_TOKEN");
}

function authorized(header: string | undefined | null): boolean {
  return header === `Bearer ${expectedToken()}`;
}

function managerAuthorized(header: string | undefined | null): boolean {
  const token = process.env.MANAGER_INTERNAL_TOKEN;
  return Boolean(token && header === `Bearer ${token}`);
}

function socketPath(): string {
  return process.env.PROVISIONER_SOCKET_PATH ?? "/run/amtech-provisioner/provisioner.sock";
}

export function isDestructiveProvisionerOperation(operation: ProvisionerOperation | undefined): boolean {
  return Boolean(operation && DESTRUCTIVE_PROVISIONER_OPERATIONS.has(operation));
}

export function signedProvisionerEnvelope(req: ProvisionerRequest): ProvisionerRequest {
  const issued = new Date();
  const expires = new Date(issued.getTime() + 30_000);
  return {
    ...req,
    request_id: req.request_id ?? randomUUID(),
    operation: req.operation ?? "ensure_runtime",
    issued_at: issued.toISOString(),
    expires_at: expires.toISOString(),
    nonce: randomBytes(24).toString("base64url"),
    idempotency_key: req.idempotency_key ?? `runtime:${req.employee_id}:${req.manifest_id}`,
  };
}

function ambiguousProvisionerBody(failureState: string, evidence: Record<string, unknown>, logs: string[] = []): ProvisionerResult {
  return { status: "failed", outcome: "ambiguous", failure_state: failureState, evidence, logs };
}

export async function callHostProvisioner(input: ProvisionerRequest): Promise<{ status: number; body: ProvisionerResult }> {
  const envelope = signedProvisionerEnvelope(input);
  const raw = Buffer.from(JSON.stringify(envelope));
  const signature = createHmac("sha256", requiredEnv("PROVISIONER_SIGNING_SECRET")).update(raw).digest("hex");

  return await new Promise((resolve, reject) => {
    const req = httpRequest({
      socketPath: socketPath(),
      path: "/v1/runtime",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(raw.length),
        "x-amtech-signature": `sha256=${signature}`,
      },
      timeout: Number(process.env.PROVISIONER_REQUEST_TIMEOUT_MS ?? 120_000),
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body: ProvisionerResult;
        try {
          const parsed = JSON.parse(text || "{}") as Partial<ProvisionerResult>;
          if (!parsed || (parsed.status !== "ok" && parsed.status !== "failed")) {
            body = ambiguousProvisionerBody("host_provisioner_malformed_result", { raw_body: text.slice(0, 500) });
          } else {
            body = parsed as ProvisionerResult;
          }
        } catch (err) {
          body = ambiguousProvisionerBody("host_provisioner_invalid_json", {
            raw_body: text.slice(0, 500),
            parse_error: String((err as Error).message ?? err),
          });
        }
        resolve({ status: res.statusCode ?? 500, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("host_provisioner_timeout")));
    req.on("error", reject);
    req.end(raw);
  });
}

async function markDestructiveProjectionUnhealthy(input: ProvisionerRequest): Promise<Record<string, unknown>> {
  if (!isDestructiveProvisionerOperation(input.operation)) return { applied: false, reason: "operation_not_destructive" };
  try {
    const updated = await serviceClient()
      .from("employees")
      .update({ status: "failed", needs_reprovision: true })
      .eq("id", input.employee_id)
      .eq("account_id", input.account_id);
    if (updated.error) {
      return { applied: false, reason: "projection_update_failed", error: String(updated.error.message ?? updated.error) };
    }
    return { applied: true, status: "failed", needs_reprovision: true };
  } catch (err) {
    return { applied: false, reason: "projection_update_exception", error: String((err as Error).message ?? err) };
  }
}

export async function requireHostProvisioner(input: ProvisionerRequest): Promise<ProvisionerResult> {
  let result: { status: number; body: ProvisionerResult };
  try {
    result = await callHostProvisioner(input);
  } catch (err) {
    const message = String((err as Error).message ?? err);
    result = {
      status: 503,
      body: ambiguousProvisionerBody(
        message.includes("timeout") ? "host_provisioner_timeout" : "host_provisioner_unavailable",
        { transport_error: message, socket_path: socketPath() },
        [message],
      ),
    };
  }

  let body = result.body;
  if (isDestructiveProvisionerOperation(input.operation) && body.status === "ok" && body.outcome !== "accepted") {
    body = ambiguousProvisionerBody("host_provisioner_destructive_success_unverified", {
      received_status: body.status,
      received_outcome: body.outcome ?? null,
      received_evidence: body.evidence ?? null,
    }, body.logs ?? []);
  }

  if (result.status >= 400 || body.status !== "ok") {
    const projectionGuard = await markDestructiveProjectionUnhealthy(input);
    body = {
      ...body,
      evidence: { ...(body.evidence ?? {}), manager_projection_guard: projectionGuard },
    };
    const durableSummary = {
      failure_state: body.failure_state ?? `host_provisioner_${result.status}`,
      outcome: body.outcome ?? "failed",
      http_status: result.status,
      evidence: body.evidence ?? {},
    };
    const err = new Error(`host_provisioner_failure:${JSON.stringify(durableSummary)}`);
    Object.assign(err, { provisioner_result: body, http_status: result.status });
    throw err;
  }
  return body;
}

function startWorkersWhenServing(): void {
  if (process.env.NODE_ENV === "test" || process.env.START_MANAGER_WORKERS === "0") return;
  startProvisioningReconciler();
  startAmbientInboxWorker();
}

export function registerProvisionerRoutes(app: Hono): void {
  startWorkersWhenServing();

  app.get("/provision/health", async (c) => {
    try {
      const probe = await new Promise<boolean>((resolve) => {
        const req = httpRequest({ socketPath: socketPath(), path: "/health", method: "GET", timeout: 2_000 }, (res) => {
          res.resume();
          resolve((res.statusCode ?? 500) < 500);
        });
        req.on("error", () => resolve(false));
        req.on("timeout", () => { req.destroy(); resolve(false); });
        req.end();
      });
      return c.json({ status: probe ? "ok" : "unavailable", boundary: "unix-socket" }, probe ? 200 : 503);
    } catch {
      return c.json({ status: "unavailable", boundary: "unix-socket" }, 503);
    }
  });

  app.post("/provision", async (c) => {
    if (!authorized(c.req.header("Authorization"))) {
      return c.json({ status: "failed", outcome: "failed", failure_state: "unauthorized" }, 401);
    }
    try {
      const req = (await c.req.json()) as ProvisionerRequest;
      const result = await callHostProvisioner(req);
      return c.json(result.body, result.status as 200 | 400 | 500);
    } catch (err) {
      return c.json({
        status: "failed",
        outcome: "ambiguous",
        failure_state: "host_provisioner_unavailable",
        evidence: { transport_error: String((err as Error).message ?? err) },
        logs: [String((err as Error).message ?? err)],
      }, 503);
    }
  });

  app.post("/manager/provisioning/commands", async (c) => {
    if (!managerAuthorized(c.req.header("Authorization"))) return c.json({ error: "unauthorized" }, 401);
    const input = await c.req.json().catch(() => ({})) as {
      account_id?: string;
      employee_id?: string;
      command_type?: ProvisioningCommandType;
      idempotency_key?: string;
      requested_by?: string;
      payload?: Record<string, unknown>;
    };
    if (!input.account_id || !input.employee_id || !input.command_type || !PROVISIONING_COMMAND_TYPES.includes(input.command_type)) {
      return c.json({ error: "account_id_employee_id_command_type_required" }, 400);
    }
    const queued = await queueProvisioningCommand(serviceClient(), {
      account_id: input.account_id,
      employee_id: input.employee_id,
      command_type: input.command_type,
      requested_by: input.requested_by ?? "manager-api",
      idempotency_key: input.idempotency_key,
      payload: input.payload ?? {},
    });
    return c.json({ status: "queued", ...queued }, queued.duplicate ? 200 : 202);
  });

  app.post("/manager/ambient-events/:inboxId/replay", async (c) => {
    if (!managerAuthorized(c.req.header("Authorization"))) return c.json({ error: "unauthorized" }, 401);
    await replayAmbientDeadLetter(serviceClient(), c.req.param("inboxId"));
    return c.json({ status: "queued_for_replay", inbox_id: c.req.param("inboxId") }, 202);
  });
}
