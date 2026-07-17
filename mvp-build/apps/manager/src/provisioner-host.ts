import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ProvisionerOperation, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import {
  failureResult,
  renderProfilePackage,
  runRuntimeStart,
  writeAndActivateCaddySnippet,
} from "./lib/profile-renderer.js";
import { runCommandString } from "./lib/command-runner.js";

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_TTL_MS = 60_000;
const ALLOWED_OPERATIONS = new Set<ProvisionerOperation>(["ensure_runtime", "remove_runtime", "inspect_runtime"]);

type HostProvisionerRequest = ProvisionerRequest & Required<Pick<
  ProvisionerRequest,
  "request_id" | "operation" | "issued_at" | "expires_at" | "nonce" | "idempotency_key"
>>;

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

function safeId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9:_-]{8,200}$/.test(value)) {
    throw new Error("invalid_identifier");
  }
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
  return { ...req, request_id, nonce, idempotency_key } as HostProvisionerRequest;
}

async function claimOnce(kind: "nonce" | "idempotency", key: string): Promise<boolean> {
  const dir = join(stateRoot(), kind);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const path = join(dir, encodeURIComponent(key));
  try {
    await writeFile(path, new Date().toISOString(), { flag: "wx", mode: 0o600 });
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw err;
  }
}

async function cachedResult(key: string): Promise<ProvisionerResult | null> {
  try {
    return JSON.parse(await readFile(join(stateRoot(), "results", encodeURIComponent(key) + ".json"), "utf8"));
  } catch {
    return null;
  }
}

async function storeResult(key: string, result: ProvisionerResult): Promise<void> {
  const dir = join(stateRoot(), "results");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(join(dir, encodeURIComponent(key) + ".json"), JSON.stringify(result), { mode: 0o600 });
}

async function audit(entry: Record<string, unknown>): Promise<void> {
  const path = auditPath();
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n", { mode: 0o600 });
}

async function execute(req: HostProvisionerRequest): Promise<ProvisionerResult> {
  if (req.operation === "inspect_runtime") {
    return {
      status: "ok",
      request_id: req.request_id,
      operation: req.operation,
      gateway_port: req.params.gateway_port,
      api_base_url: `http://127.0.0.1:${req.params.gateway_port}`,
      logs: ["inspect_contract_only"],
    };
  }
  if (req.operation === "remove_runtime") {
    const container = `amtech-hermes-${req.employee_id}`;
    const network = `amtech-employee-${req.employee_id}`;
    await runCommandString(`docker rm -f ${container} >/dev/null 2>&1 || true`, process.cwd(), "remove runtime");
    await runCommandString(`docker network rm ${network} >/dev/null 2>&1 || true`, process.cwd(), "remove runtime network");
    return { status: "ok", request_id: req.request_id, operation: req.operation, container_name: container, network_name: network };
  }

  const rendered = await renderProfilePackage(req);
  const runtime = await runRuntimeStart(rendered.generated_path);
  const caddy = await writeAndActivateCaddySnippet(req.params);
  return {
    status: "ok",
    request_id: req.request_id,
    operation: req.operation,
    profile_id: rendered.profile_id,
    profile_checksum: rendered.profile_checksum,
    generated_path: rendered.generated_path,
    workspace_dir: rendered.workspace_dir,
    network_name: `amtech-employee-${req.employee_id}`,
    container_name: `amtech-hermes-${req.employee_id}`,
    webchat_api_url: `http://127.0.0.1:${req.params.gateway_port}`,
    api_base_url: `http://127.0.0.1:${req.params.gateway_port}`,
    api_session_id: "amtech-owner-thread",
    public_web_route: `/agent/${req.employee_id}`,
    gateway_port: req.params.gateway_port,
    validation_status: "passed",
    validation_output: rendered.validation_output,
    smoke_output: runtime,
    logs: [`runtime:${runtime}`, `caddy:${caddy}`],
  };
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
    await audit({ request_id: parsed.request_id, account_id: parsed.account_id, employee_id: parsed.employee_id, operation: parsed.operation, result: result.status });
    return send(res, 200, result);
  } catch (err) {
    const result = failureResult("host_provisioner_failed", err);
    await audit({ request_id: parsed?.request_id ?? null, account_id: parsed?.account_id ?? null, employee_id: parsed?.employee_id ?? null, operation: parsed?.operation ?? null, result: "failed", error: String((err as Error).message ?? err) });
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
