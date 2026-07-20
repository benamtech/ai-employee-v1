import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { appendFile, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import type { ProvisionerOperation, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import {
  inspectRenderedProfile,
  renderProfilePackage,
  rotateRenderedModelGatewayCredential,
  runRuntimeStart,
  writeAndActivateCaddySnippet,
} from "./lib/profile-renderer.js";
import { runCommandString } from "./lib/command-runner.js";
import {
  runDestructiveDockerStep,
  type DestructiveDockerEvidence,
} from "./lib/destructive-docker.js";
import { createProvisionerIdempotencyStore } from "./lib/provisioner-idempotency.js";

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_TTL_MS = 60_000;
const ALLOWED_OPERATIONS = new Set<ProvisionerOperation>([
  "render_profile",
  "start_runtime",
  "activate_routing",
  "ensure_runtime",
  "remove_runtime",
  "inspect_runtime",
  "inspect_drift",
  "repair_drift",
  "rotate_model_gateway_credential",
  "suspend_runtime",
  "restart_runtime",
  "replace_runtime",
  "restore_runtime",
]);

type HostProvisionerRequest = ProvisionerRequest & Required<Pick<ProvisionerRequest, "request_id" | "operation" | "issued_at" | "expires_at" | "nonce" | "idempotency_key">>;

type StructuredProvisionerError = Error & {
  outcome?: "failed" | "ambiguous";
  failure_state?: string;
  evidence?: Record<string, unknown>;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function socketPath(): string {
  return process.env.PROVISIONER_SOCKET_PATH ?? "/run/amtech-provisioner/provisioner.sock";
}

function auditPath(): string {
  return process.env.PROVISIONER_AUDIT_LOG ?? "/var/lib/amtech/audit/host-provisioner.jsonl";
}

function stateRoot(): string {
  return process.env.PROVISIONER_STATE_DIR ?? "/var/lib/amtech/provisioner";
}

function destructiveTimeoutMs(): number {
  return Math.max(1_000, Number(process.env.PROVISIONER_DOCKER_DESTRUCTIVE_TIMEOUT_MS ?? 30_000));
}

function safeId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9:_-]{8,220}$/.test(value)) throw new Error("invalid_identifier");
  return value;
}

function optionalContainerName(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value)) throw new Error(`${name}_invalid`);
  return value;
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("request_body_too_large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function verifySignature(raw: Buffer, signature: string | undefined): void {
  if (!signature?.startsWith("sha256=")) throw new Error("signature_missing");
  const expected = createHmac("sha256", requiredEnv("PROVISIONER_SIGNING_SECRET")).update(raw).digest("hex");
  const supplied = signature.slice("sha256=".length);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(supplied, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("signature_invalid");
}

function validateRequest(input: unknown): HostProvisionerRequest {
  const req = input as ProvisionerRequest;
  if (!req || typeof req !== "object" || !req.params) throw new Error("request_invalid");
  if (!req.operation || !ALLOWED_OPERATIONS.has(req.operation)) throw new Error("operation_not_allowed");
  const request_id = safeId(req.request_id);
  const nonce = safeId(req.nonce);
  const idempotency_key = safeId(req.idempotency_key);
  safeId(req.account_id);
  safeId(req.employee_id);
  if (typeof req.issued_at !== "string" || typeof req.expires_at !== "string") throw new Error("request_time_invalid");
  const issued = Date.parse(req.issued_at);
  const expires = Date.parse(req.expires_at);
  const now = Date.now();
  if (!Number.isFinite(issued) || !Number.isFinite(expires)) throw new Error("request_time_invalid");
  if (issued > now + 5_000 || expires <= now || expires - issued > MAX_TTL_MS) throw new Error("request_expired");
  if (req.params.account_id !== req.account_id || req.params.employee_id !== req.employee_id) throw new Error("binding_mismatch");
  if (req.params.runtime_backend !== "docker") throw new Error("runtime_backend_not_allowed");
  if (["render_profile", "ensure_runtime", "replace_runtime", "restore_runtime", "rotate_model_gateway_credential"].includes(req.operation) && !req.render_secrets?.model_gateway_token) {
    throw new Error("model_gateway_token_required");
  }
  return { ...req, request_id, nonce, idempotency_key } as HostProvisionerRequest;
}

function idempotencyStore() {
  return createProvisionerIdempotencyStore({
    root: stateRoot(),
    staleMs: Math.max(30_000, Number(process.env.PROVISIONER_IDEMPOTENCY_STALE_MS ?? 10 * 60_000)),
  });
}

async function cachedResult(key: string): Promise<ProvisionerResult | null> {
  return idempotencyStore().cachedResult(key);
}

async function claimOnce(kind: "nonce" | "idempotency", key: string): Promise<boolean> {
  return idempotencyStore().claim(kind, key);
}

async function releaseFailedIdempotencyClaim(key: string): Promise<void> {
  return idempotencyStore().releaseFailedIdempotencyClaim(key);
}

async function storeResult(key: string, result: ProvisionerResult): Promise<void> {
  return idempotencyStore().storeResult(key, result);
}

async function audit(entry: Record<string, unknown>): Promise<void> {
  const path = auditPath();
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n", { mode: 0o600 });
}

async function bestEffortCommand(command: string, label: string): Promise<string> {
  try {
    return (await runCommandString(command, process.cwd(), label)).output;
  } catch (err) {
    return `failed:${String((err as Error).message ?? err)}`;
  }
}

async function destructiveStep(input: {
  action: string;
  args: string[];
  expected_stdout?: string;
  allow_empty_stdout?: boolean;
}): Promise<DestructiveDockerEvidence> {
  return runDestructiveDockerStep({ ...input, timeout_ms: destructiveTimeoutMs() });
}

function hostFailureResult(err: unknown): ProvisionerResult {
  const structured = err as StructuredProvisionerError;
  return {
    status: "failed",
    outcome: structured.outcome ?? "failed",
    failure_state: structured.failure_state ?? "host_provisioner_failed",
    evidence: structured.evidence ?? { error_type: structured.name ?? "Error" },
    logs: [String(structured.message ?? err).slice(0, 2_000)],
  };
}

async function inspectRuntime(req: HostProvisionerRequest): Promise<Record<string, unknown>> {
  const container = `amtech-hermes-${req.employee_id}`;
  const network = `amtech-employee-${req.employee_id}`;
  const profile = await inspectRenderedProfile(req.params);
  const containerInspect = await bestEffortCommand(`docker container inspect ${container}`, "inspect runtime container");
  const networkInspect = await bestEffortCommand(`docker network inspect ${network}`, "inspect runtime network");
  return {
    profile,
    container_name: container,
    network_name: network,
    container_present: !containerInspect.startsWith("failed:"),
    network_present: !networkInspect.startsWith("failed:"),
    container_inspect: containerInspect.slice(0, 800),
    network_inspect: networkInspect.slice(0, 800),
  };
}

async function renderProfile(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  const rendered = await renderProfilePackage(req);
  return {
    status: "ok",
    request_id: req.request_id,
    operation: req.operation,
    profile_id: rendered.profile_id,
    profile_checksum: rendered.profile_checksum,
    generated_path: rendered.generated_path,
    workspace_dir: rendered.workspace_dir,
    validation_status: "passed",
    validation_output: rendered.validation_output,
    model_gateway_credential_version: req.params.model_gateway.credential_version,
    logs: [`profile_checksum:${rendered.profile_checksum}`],
  };
}

async function startRuntime(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  const profile = await inspectRenderedProfile(req.params);
  if (!profile.exists) throw new Error("rendered_profile_missing");
  const runtime = await runRuntimeStart(profile.generated_path);
  return {
    status: "ok",
    request_id: req.request_id,
    operation: req.operation,
    profile_id: profile.profile_id,
    profile_checksum: profile.profile_checksum ?? undefined,
    generated_path: profile.generated_path,
    network_name: `amtech-employee-${req.employee_id}`,
    container_name: `amtech-hermes-${req.employee_id}`,
    gateway_port: req.params.gateway_port,
    smoke_output: runtime,
    logs: [`runtime:${runtime}`],
  };
}

async function activateRouting(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  const caddy = await writeAndActivateCaddySnippet(req.params);
  return {
    status: "ok",
    request_id: req.request_id,
    operation: req.operation,
    webchat_api_url: `http://127.0.0.1:${req.params.gateway_port}`,
    api_base_url: `http://127.0.0.1:${req.params.gateway_port}`,
    api_session_id: "amtech-owner-thread",
    public_web_route: `/agent/${req.employee_id}`,
    gateway_port: req.params.gateway_port,
    logs: [`caddy:${caddy}`],
  };
}

async function removeRuntime(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  const container = `amtech-hermes-${req.employee_id}`;
  const network = `amtech-employee-${req.employee_id}`;
  const managerContainer = optionalContainerName("MANAGER_CONTAINER_NAME");
  const modelGatewayContainer = optionalContainerName("MODEL_GATEWAY_CONTAINER_NAME");
  const steps: DestructiveDockerEvidence[] = [];

  steps.push(await destructiveStep({ action: "remove_runtime_container", args: ["rm", "-f", container], expected_stdout: container }));
  if (managerContainer) {
    steps.push(await destructiveStep({ action: "detach_manager_runtime_network", args: ["network", "disconnect", "-f", network, managerContainer], allow_empty_stdout: true }));
  }
  if (modelGatewayContainer) {
    steps.push(await destructiveStep({ action: "detach_model_gateway_runtime_network", args: ["network", "disconnect", "-f", network, modelGatewayContainer], allow_empty_stdout: true }));
  }
  steps.push(await destructiveStep({ action: "remove_runtime_network", args: ["network", "rm", network], expected_stdout: network }));

  return {
    status: "ok",
    outcome: "accepted",
    request_id: req.request_id,
    operation: req.operation,
    container_name: container,
    network_name: network,
    evidence: { destructive_steps: steps },
    logs: steps.map((step) => `${step.action}:${step.outcome}`),
  };
}

async function ensureRuntime(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  const rendered = await renderProfile(req);
  const runtime = await startRuntime(req);
  const routing = await activateRouting(req);
  return {
    ...rendered,
    ...runtime,
    ...routing,
    operation: req.operation,
    logs: [...(rendered.logs ?? []), ...(runtime.logs ?? []), ...(routing.logs ?? [])],
  };
}

async function execute(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  if (req.operation === "render_profile") return renderProfile(req);
  if (req.operation === "start_runtime") return startRuntime(req);
  if (req.operation === "activate_routing") return activateRouting(req);
  if (req.operation === "inspect_runtime" || req.operation === "inspect_drift") {
    const drift = await inspectRuntime(req);
    return { status: "ok", request_id: req.request_id, operation: req.operation, gateway_port: req.params.gateway_port, api_base_url: `http://127.0.0.1:${req.params.gateway_port}`, drift, logs: ["inspect_runtime_completed"] };
  }
  if (req.operation === "remove_runtime") return removeRuntime(req);
  if (req.operation === "suspend_runtime") {
    const container = `amtech-hermes-${req.employee_id}`;
    const stopped = await destructiveStep({ action: "suspend_runtime", args: ["stop", container], expected_stdout: container });
    return { status: "ok", outcome: "accepted", request_id: req.request_id, operation: req.operation, container_name: container, evidence: { destructive_steps: [stopped] }, logs: [`stop:${stopped.outcome}`] };
  }
  if (req.operation === "restart_runtime") {
    const container = `amtech-hermes-${req.employee_id}`;
    const restarted = await destructiveStep({ action: "restart_runtime", args: ["restart", container], expected_stdout: container });
    return { status: "ok", outcome: "accepted", request_id: req.request_id, operation: req.operation, container_name: container, drift: await inspectRuntime(req), smoke_output: restarted.stdout.trim(), evidence: { destructive_steps: [restarted] }, logs: [`restart:${restarted.outcome}`] };
  }
  if (req.operation === "rotate_model_gateway_credential") {
    const rotated = await rotateRenderedModelGatewayCredential(req);
    const container = `amtech-hermes-${req.employee_id}`;
    const drift = await inspectRuntime(req);
    return {
      status: "ok",
      request_id: req.request_id,
      operation: req.operation,
      profile_id: rotated.profile_id,
      generated_path: rotated.generated_path,
      profile_checksum: rotated.profile_checksum,
      container_name: container,
      model_gateway_credential_version: req.params.model_gateway.credential_version,
      smoke_output: rotated.runtime_reload_output,
      drift,
      logs: [`rotated_model_gateway_credential:${req.params.model_gateway.credential_version}`, `recreate:${rotated.runtime_reload_output}`],
    };
  }
  if (req.operation === "repair_drift") {
    const before = await inspectRuntime(req);
    const ensured = await ensureRuntime(req);
    return { ...ensured, operation: req.operation, drift: { before, after: await inspectRuntime(req) }, logs: [...(ensured.logs ?? []), "repair_drift_reconciled_via_ensure_runtime"] };
  }
  if (req.operation === "replace_runtime" || req.operation === "restore_runtime") {
    const removed = await removeRuntime(req);
    const ensured = await ensureRuntime(req);
    return {
      ...ensured,
      outcome: "accepted",
      operation: req.operation,
      evidence: { destructive_steps: (removed.evidence ?? {})["destructive_steps"] ?? [] },
      logs: [...(removed.logs ?? []), ...(ensured.logs ?? [])],
    };
  }
  return ensureRuntime(req);
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { status: "ok" });
  if (req.method !== "POST" || req.url !== "/v1/runtime") return send(res, 404, { error: "not_found" });
  let parsed: HostProvisionerRequest | null = null;
  try {
    const raw = await readBody(req);
    verifySignature(raw, req.headers["x-amtech-signature"] as string | undefined);
    parsed = validateRequest(JSON.parse(raw.toString("utf8")));
    if (!(await claimOnce("nonce", parsed.nonce))) throw new Error("nonce_replayed");
    if (!(await claimOnce("idempotency", parsed.idempotency_key))) {
      const existing = await cachedResult(parsed.idempotency_key);
      if (!existing) throw new Error("idempotency_in_progress");
      return send(res, 200, { ...existing, idempotent_replay: true });
    }
    const result = await execute(parsed);
    await storeResult(parsed.idempotency_key, result);
    await audit({
      request_id: parsed.request_id,
      idempotency_key: parsed.idempotency_key,
      nonce: parsed.nonce,
      account_id: parsed.account_id,
      employee_id: parsed.employee_id,
      operation: parsed.operation,
      result: result.status,
      outcome: result.outcome ?? "accepted",
      evidence: { profile_checksum: result.profile_checksum ?? null, drift: result.drift ?? null, operation: result.evidence ?? null },
    });
    return send(res, 200, result);
  } catch (err) {
    if (parsed?.idempotency_key) await releaseFailedIdempotencyClaim(parsed.idempotency_key).catch(() => {});
    const result = hostFailureResult(err);
    await audit({
      request_id: parsed?.request_id ?? null,
      account_id: parsed?.account_id ?? null,
      employee_id: parsed?.employee_id ?? null,
      operation: parsed?.operation ?? null,
      result: "failed",
      outcome: result.outcome ?? "failed",
      failure_state: result.failure_state ?? "host_provisioner_failed",
      evidence: result.evidence ?? null,
      error: String((err as Error).message ?? err),
    });
    return send(res, 400, result);
  }
}

async function main(): Promise<void> {
  const path = socketPath();
  await mkdir(dirname(path), { recursive: true });
  await rm(path, { force: true });
  const server = createServer((req, res) => void handle(req, res));
  server.listen(path, () => console.log(`[host-provisioner] listening on unix:${path}`));
}

void main();
