import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import type { Hono } from "hono";
import type { ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { queueProvisioningCommand, PROVISIONING_COMMAND_TYPES, type ProvisioningCommandType } from "./lib/provisioning-state-machine.js";
import { startProvisioningReconciler } from "./lib/provisioning-reconciler.js";
import { replayAmbientDeadLetter, startAmbientInboxWorker } from "./lib/ambient-inbox.js";

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
          body = JSON.parse(text || "{}") as ProvisionerResult;
        } catch {
          body = { status: "failed", failure_state: "host_provisioner_invalid_json", logs: [text.slice(0, 500)] };
        }
        resolve({ status: res.statusCode ?? 500, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("host_provisioner_timeout")));
    req.on("error", reject);
    req.end(raw);
  });
}

export async function requireHostProvisioner(input: ProvisionerRequest): Promise<ProvisionerResult> {
  const result = await callHostProvisioner(input);
  if (result.status >= 400 || result.body.status !== "ok") {
    const err = new Error(result.body.failure_state ?? `host_provisioner_${result.status}`);
    Object.assign(err, { provisioner_result: result.body, http_status: result.status });
    throw err;
  }
  return result.body;
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
      return c.json({ status: "failed", failure_state: "unauthorized" }, 401);
    }
    try {
      const req = (await c.req.json()) as ProvisionerRequest;
      const result = await callHostProvisioner(req);
      return c.json(result.body, result.status as 200 | 400 | 500);
    } catch (err) {
      return c.json({
        status: "failed",
        failure_state: "host_provisioner_unavailable",
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
