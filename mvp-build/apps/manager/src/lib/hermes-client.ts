import type { SupabaseClient } from "@amtech/db";
import type {
  HermesCapabilities,
  HermesChatResponse,
  HermesHealth,
  HermesSessionCreateResponse,
} from "@amtech/shared";
import { openSecret } from "./secrets.js";
import { orThrow } from "./db.js";

export interface RuntimeApi {
  runtime_endpoint_id: string;
  baseUrl: string;
  sessionId: string;
  sessionKey: string;
  accountId?: string | null;
  employeeId: string;
  bearer: string;
}

export interface HermesTurnInput {
  input: string;
  system_message?: string;
  work_run_id?: string | null;
}

export interface HermesTurnResult {
  text: string;
  usage?: Record<string, unknown>;
  external_run_id?: string;
  mode: "runs" | "sessions";
}

type CapabilityEntry = { capabilities: HermesCapabilities | null; checkedAt: number };

interface HermesRunCreateResponse {
  id?: string;
  run_id?: string;
  status?: string;
  state?: string;
  output?: string;
  text?: string;
  message?: string;
  response?: string;
  usage?: HermesChatResponse["usage"];
  error?: string;
}

interface HermesRunStatusResponse extends HermesRunCreateResponse {
  result?: {
    output?: string;
    text?: string;
    message?: string;
    response?: string;
    usage?: HermesChatResponse["usage"];
  };
}

const capabilityCache = new Map<string, CapabilityEntry>();
const CAPABILITY_CACHE_MS = Number(process.env.HERMES_CAPABILITY_CACHE_MS ?? 5 * 60_000);
const RUN_POLL_INTERVAL_MS = Number(process.env.HERMES_RUN_POLL_INTERVAL_MS ?? 1_000);
const RUN_MAX_POLLS = Number(process.env.HERMES_RUN_MAX_POLLS ?? 120);

function cleanBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

function timeoutMs(): number {
  return Number(process.env.HERMES_TURN_TIMEOUT_MS ?? 120_000);
}

function classifyRuntimeError(status: number): string {
  if (status === 401 || status === 403) return "runtime_auth";
  return `runtime_${status}`;
}

function sanitizeSessionKey(value: string): string {
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error("runtime_session_key_invalid");
  if (value.length <= 256) return value;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
  return `${value.slice(0, 220)}:h${Math.abs(hash).toString(36)}`;
}

function defaultSessionKey(accountId: string | null | undefined, employeeId: string): string {
  return sanitizeSessionKey(`amtech:v1:account:${accountId ?? "unknown"}:employee:${employeeId}`);
}

function featureEnabled(capabilities: HermesCapabilities | null, names: string[]): boolean {
  const features = capabilities?.features ?? {};
  const endpoints = capabilities?.endpoints ?? {};
  return names.some((name) =>
    features[name] === true ||
    Boolean(endpoints[name]) ||
    Boolean(endpoints[`/${name}`]) ||
    Object.values(endpoints).some((value) => typeof value === "string" && value.includes(name)),
  );
}

export function supportsSessionChat(capabilities: HermesCapabilities | null): boolean {
  return featureEnabled(capabilities, ["session_chat", "sessions", "chat", "/api/sessions/{id}/chat"]);
}

export function supportsRuns(capabilities: HermesCapabilities | null): boolean {
  return featureEnabled(capabilities, ["run_submission", "run_status", "runs", "run", "/v1/runs"]);
}

export function supportsSessionKey(capabilities: HermesCapabilities | null): boolean {
  // Real Hermes advertises the session-key header as a string value
  // (features.session_key_header === "X-Hermes-Session-Key"), not a boolean flag.
  const features = capabilities?.features ?? {};
  const header = features["session_key_header"];
  if (typeof header === "string" && header.length > 0) return true;
  return featureEnabled(capabilities, ["session_key", "x_hermes_session_key", "X-Hermes-Session-Key"]);
}

export async function resolveRuntimeApi(db: SupabaseClient, employeeId: string): Promise<RuntimeApi> {
  const runtime = orThrow(
    await db
      .from("runtime_endpoints")
      .select("id,employee_id,api_base_url,webchat_api_url,api_session_id,api_session_key")
      .eq("employee_id", employeeId)
      .maybeSingle(),
    "runtime_endpoints.lookup",
  ) as {
    id: string;
    employee_id?: string | null;
    api_base_url?: string | null;
    webchat_api_url?: string | null;
    api_session_id?: string | null;
    api_session_key?: string | null;
  } | null;
  if (!runtime) throw new Error("employee runtime API missing");
  const base = runtime.api_base_url ?? runtime.webchat_api_url;
  if (!base) throw new Error("employee runtime API missing");
  const employee = orThrow(
    await db.from("employees").select("id,account_id").eq("id", employeeId).maybeSingle(),
    "employees.lookup.runtime",
  ) as { id?: string; account_id?: string | null } | null;
  if (!employee?.account_id) throw new Error("employee runtime identity missing");
  const accountId = employee.account_id;

  const secret = orThrow(
    await db
      .from("runtime_endpoint_secrets")
      .select("api_key_ref")
      .eq("runtime_endpoint_id", runtime.id)
      .maybeSingle(),
    "runtime_endpoint_secrets.lookup",
  ) as { api_key_ref?: string | null } | null;
  const bearer = secret?.api_key_ref ? openSecret(secret.api_key_ref) : (process.env.HERMES_API_TOKEN ?? "");
  if (!bearer) throw new Error("runtime_auth_missing");

  return {
    runtime_endpoint_id: runtime.id,
    baseUrl: cleanBaseUrl(base),
    sessionId: runtime.api_session_id ?? "amtech-owner-thread",
    sessionKey: sanitizeSessionKey(runtime.api_session_key ?? defaultSessionKey(accountId, employeeId)),
    accountId,
    employeeId,
    bearer,
  };
}

async function hermesFetch(api: RuntimeApi, path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    return await fetch(`${api.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${api.bearer}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new Error("runtime_timeout");
    throw new Error("runtime_unreachable");
  } finally {
    clearTimeout(timer);
  }
}

export async function getHealth(api: RuntimeApi): Promise<HermesHealth> {
  const res = await hermesFetch(api, "/health", { method: "GET" });
  if (!res.ok) throw new Error(classifyRuntimeError(res.status));
  return (await res.json().catch(() => ({ status: "unknown" }))) as HermesHealth;
}

export async function getCapabilities(api: RuntimeApi): Promise<HermesCapabilities | null> {
  const res = await hermesFetch(api, "/v1/capabilities", { method: "GET" });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as HermesCapabilities | null;
}

export async function getRuntimeCapabilities(api: RuntimeApi, opts: { force?: boolean } = {}): Promise<HermesCapabilities | null> {
  const cached = capabilityCache.get(api.runtime_endpoint_id);
  if (!opts.force && cached && Date.now() - cached.checkedAt < CAPABILITY_CACHE_MS) return cached.capabilities;
  const capabilities = await getCapabilities(api);
  capabilityCache.set(api.runtime_endpoint_id, { capabilities, checkedAt: Date.now() });
  return capabilities;
}

export function invalidateRuntimeCapabilities(api: Pick<RuntimeApi, "runtime_endpoint_id">): void {
  capabilityCache.delete(api.runtime_endpoint_id);
}

function textFromJson(json: HermesChatResponse | HermesRunCreateResponse | HermesRunStatusResponse): string | undefined {
  const nested = "result" in json ? json.result : undefined;
  // Real Hermes session-chat returns message as an object { role, content }; earlier
  // shapes returned a plain string. Handle both.
  const msg = json.message;
  const msgText = typeof msg === "string" ? msg
    : (msg && typeof msg === "object" ? (msg as { content?: string }).content : undefined);
  return json.output ?? json.text ?? msgText ?? json.response ??
    nested?.output ?? nested?.text ?? nested?.message ?? nested?.response;
}

function usageFromJson(json: HermesChatResponse | HermesRunCreateResponse | HermesRunStatusResponse): Record<string, unknown> | undefined {
  const nested = "result" in json ? json.result : undefined;
  return (json.usage ?? nested?.usage) as Record<string, unknown> | undefined;
}

function isTerminalRunStatus(value: string | undefined): boolean {
  return ["succeeded", "completed", "complete", "failed", "cancelled", "canceled", "stopped", "error"].includes(String(value ?? "").toLowerCase());
}

function isSuccessfulRunStatus(value: string | undefined): boolean {
  return ["succeeded", "completed", "complete"].includes(String(value ?? "").toLowerCase());
}

function sessionKeyHeaders(api: RuntimeApi, capabilities: HermesCapabilities | null): Record<string, string> {
  return supportsSessionKey(capabilities) ? { "X-Hermes-Session-Key": api.sessionKey } : {};
}

export async function ensureCanonicalSession(api: RuntimeApi): Promise<string> {
  const res = await hermesFetch(api, "/api/sessions", {
    method: "POST",
    body: JSON.stringify({ id: api.sessionId, title: "AMTECH owner thread" }),
  });
  if (res.status === 409) return api.sessionId;
  const json = (await res.json().catch(() => ({}))) as HermesSessionCreateResponse;
  if (!res.ok) throw new Error(json.error ?? classifyRuntimeError(res.status));
  // Real Hermes nests the id under `session`; keep the flat fallbacks for other shapes.
  return json.session?.id ?? json.session_id ?? json.id ?? api.sessionId;
}

export async function chatTurn(api: RuntimeApi, input: { input: string; system_message?: string }): Promise<{ text: string; usage?: Record<string, unknown> }> {
  const capabilities = await getRuntimeCapabilities(api);
  if (!supportsSessionChat(capabilities)) throw new Error("runtime_capability_missing:session_chat");
  await ensureCanonicalSession(api);
  const res = await hermesFetch(api, `/api/sessions/${encodeURIComponent(api.sessionId)}/chat`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => ({}))) as HermesChatResponse;
  if (!res.ok) throw new Error(json.error ?? classifyRuntimeError(res.status));
  const text = textFromJson(json);
  return { text: text?.trim() || "I received it.", usage: json.usage as Record<string, unknown> | undefined };
}

async function runTurn(api: RuntimeApi, input: HermesTurnInput, capabilities: HermesCapabilities | null): Promise<HermesTurnResult> {
  const body = {
    input: input.input,
    session_id: api.sessionId,
    ...(input.system_message ? { instructions: input.system_message, system_message: input.system_message } : {}),
    ...(input.work_run_id ? { metadata: { amtech_work_run_id: input.work_run_id } } : {}),
  };
  const create = await hermesFetch(api, "/v1/runs", {
    method: "POST",
    headers: sessionKeyHeaders(api, capabilities),
    body: JSON.stringify(body),
  });
  const created = (await create.json().catch(() => ({}))) as HermesRunCreateResponse;
  if (!create.ok) {
    if ([404, 405, 501].includes(create.status)) {
      invalidateRuntimeCapabilities(api);
      throw new Error(classifyRuntimeError(create.status));
    }
    throw new Error(created.error ?? classifyRuntimeError(create.status));
  }
  const runId = created.run_id ?? created.id;
  if (!runId) throw new Error("runtime_run_id_missing");
  if (isTerminalRunStatus(created.status ?? created.state)) {
    if (!isSuccessfulRunStatus(created.status ?? created.state)) throw new Error(created.error ?? `runtime_run_${created.status ?? created.state}`);
    const text = textFromJson(created);
    return { text: text?.trim() || "I received it.", usage: usageFromJson(created), external_run_id: runId, mode: "runs" };
  }

  for (let i = 0; i < RUN_MAX_POLLS; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, RUN_POLL_INTERVAL_MS));
    const statusRes = await hermesFetch(api, `/v1/runs/${encodeURIComponent(runId)}`, {
      method: "GET",
      headers: sessionKeyHeaders(api, capabilities),
    });
    const statusJson = (await statusRes.json().catch(() => ({}))) as HermesRunStatusResponse;
    if (!statusRes.ok) throw new Error(statusJson.error ?? classifyRuntimeError(statusRes.status));
    const status = statusJson.status ?? statusJson.state;
    if (!isTerminalRunStatus(status)) continue;
    if (!isSuccessfulRunStatus(status)) throw new Error(statusJson.error ?? `runtime_run_${status}`);
    const text = textFromJson(statusJson);
    return { text: text?.trim() || "I received it.", usage: usageFromJson(statusJson), external_run_id: runId, mode: "runs" };
  }
  throw new Error("runtime_run_timeout");
}

export async function executeHermesTurn(api: RuntimeApi, input: HermesTurnInput): Promise<HermesTurnResult> {
  const capabilities = await getRuntimeCapabilities(api);
  if (supportsRuns(capabilities)) {
    try {
      return await runTurn(api, input, capabilities);
    } catch (err) {
      if (!String((err as Error).message ?? err).startsWith("runtime_404") &&
        !String((err as Error).message ?? err).startsWith("runtime_405") &&
        !String((err as Error).message ?? err).startsWith("runtime_501")) {
        throw err;
      }
    }
  }
  const session = await chatTurn(api, input);
  return { ...session, mode: "sessions" };
}
