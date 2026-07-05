import type { SupabaseClient } from "@amtech/db";
import type {
  HermesCapabilities,
  HermesChatResponse,
  HermesHealth,
} from "@amtech/shared";
import { openSecret } from "./secrets.js";
import { orThrow } from "./db.js";
import { workVerbForTool } from "./work-verbs.js";

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
  return featureEnabled(capabilities, ["runs", "run", "/v1/runs"]);
}

export function supportsSessionKey(capabilities: HermesCapabilities | null): boolean {
  return featureEnabled(capabilities, ["session_key", "session_key_header", "x_hermes_session_key", "X-Hermes-Session-Key"]);
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
  return json.output ?? json.text ?? json.message ?? json.response ??
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
  const json = (await res.json().catch(() => ({}))) as { id?: string; session_id?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? classifyRuntimeError(res.status));
  return json.session_id ?? json.id ?? api.sessionId;
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

/** Owner-safe live progress from a streaming run. `verb` is already mapped through
 *  the work-verb allowlist — a raw tool name never reaches this callback. */
export type HermesProgress = (p: { verb: string; state: "started" | "step" | "completed" }) => void;

export const HERMES_RUN_EVENT_FIELDS = {
  event: "event",
  runId: "run_id",
  timestamp: "timestamp",
  delta: "delta",
  output: "output",
  usage: "usage",
  error: "error",
  tool: "tool",
  preview: "preview",
  duration: "duration",
  choices: "choices",
} as const;

export const HERMES_RUN_EVENT_TYPES = {
  messageDelta: "message.delta",
  toolStarted: "tool.started",
  toolCompleted: "tool.completed",
  reasoningAvailable: "reasoning.available",
  approvalRequest: "approval.request",
  runCompleted: "run.completed",
  runFailed: "run.failed",
  runCancelled: "run.cancelled",
} as const;

/** Create the run. Returns the run id and, when the runtime answered terminally in
 *  the create response, the finished result (so no poll/stream is needed). */
async function createRun(api: RuntimeApi, input: HermesTurnInput, capabilities: HermesCapabilities | null): Promise<{ runId: string; terminal?: HermesTurnResult }> {
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
    return { runId, terminal: { text: text?.trim() || "I received it.", usage: usageFromJson(created), external_run_id: runId, mode: "runs" } };
  }
  return { runId };
}

async function pollRun(api: RuntimeApi, runId: string, capabilities: HermesCapabilities | null): Promise<HermesTurnResult> {
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

async function runTurn(api: RuntimeApi, input: HermesTurnInput, capabilities: HermesCapabilities | null): Promise<HermesTurnResult> {
  const { runId, terminal } = await createRun(api, input, capabilities);
  return terminal ?? pollRun(api, runId, capabilities);
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

// ---------------------------------------------------------------------------
// Streaming runs (Phase 5): consume GET /v1/runs/{id}/events (SSE) for live
// "doing it now" progress, falling back to polling when unsupported. The final
// text is assembled from assistant deltas or the terminal event — same result
// shape as the poll path, so callers are agnostic.
// ---------------------------------------------------------------------------

export interface SseFrame { event?: string; data: string; }

/** Parse a fetch SSE body into {event,data} frames. Defensive: tolerates CRLF,
 *  multi-line data, comments, and partial trailing chunks. */
export async function* parseSseFrames(body: ReadableStream<Uint8Array>): AsyncGenerator<SseFrame> {
  const decoder = new TextDecoder();
  let buffer = "";
  // Node/undici ReadableStream is async-iterable at runtime; the DOM lib type
  // doesn't advertise it, so iterate via the cast.
  const iterable = body as unknown as AsyncIterable<Uint8Array>;
  for await (const chunk of iterable) {
    buffer += decoder.decode(chunk, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event: string | undefined;
      const dataLines: string[] = [];
      for (const line of raw.split("\n")) {
        if (line.startsWith(":")) continue; // comment/keepalive
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
      }
      if (dataLines.length || event) yield { event, data: dataLines.join("\n") };
    }
  }
}

function eventType(frame: SseFrame, json: Record<string, unknown> | null): string {
  return String(frame.event ?? json?.type ?? json?.event ?? "").toLowerCase();
}

function toolNameFrom(json: Record<string, unknown> | null): string | undefined {
  if (!json) return undefined;
  const j = json as Record<string, unknown> & { tool?: unknown; name?: unknown; tool_name?: unknown; tool_call?: { name?: unknown } };
  return (j.tool_name ?? j.tool ?? j.name ?? j.tool_call?.name) as string | undefined;
}

function deltaTextFrom(json: Record<string, unknown> | null): string {
  if (!json) return "";
  const j = json as Record<string, unknown> & { delta?: unknown; text?: unknown; content?: unknown; output_text?: unknown };
  const v = j.delta ?? j.text ?? j.content ?? j.output_text;
  return typeof v === "string" ? v : "";
}

/** Try the SSE stream. Returns a result on terminal, or null if the stream is
 *  unusable (unsupported / ended without terminal) so the caller can poll. */
async function streamRun(api: RuntimeApi, runId: string, capabilities: HermesCapabilities | null, onProgress?: HermesProgress): Promise<HermesTurnResult | null> {
  let res: Response;
  try {
    res = await hermesFetch(api, `/v1/runs/${encodeURIComponent(runId)}/events`, {
      method: "GET",
      headers: { ...sessionKeyHeaders(api, capabilities), Accept: "text/event-stream" },
    });
  } catch {
    return null;
  }
  if (!res.ok || !res.body) {
    if ([404, 405, 501].includes(res.status)) return null;
    throw new Error(classifyRuntimeError(res.status));
  }
  let assembled = "";
  let finalText: string | undefined;
  let usage: Record<string, unknown> | undefined;
  let sawTerminal = false;
  let failed: string | undefined;
  for await (const frame of parseSseFrames(res.body)) {
    let json: Record<string, unknown> | null = null;
    try { json = frame.data ? JSON.parse(frame.data) as Record<string, unknown> : null; } catch { json = null; }
    const type = eventType(frame, json);
    if (type === HERMES_RUN_EVENT_TYPES.toolStarted || (type.includes("tool") && (type.includes("start") || type.endsWith(".started")))) {
      onProgress?.({ verb: workVerbForTool(toolNameFrom(json)), state: "started" });
    } else if (type === HERMES_RUN_EVENT_TYPES.toolCompleted || (type.includes("tool") && (type.includes("complete") || type.includes("end") || type.includes("result")))) {
      onProgress?.({ verb: workVerbForTool(toolNameFrom(json)), state: "step" });
    } else if (type === HERMES_RUN_EVENT_TYPES.approvalRequest) {
      onProgress?.({ verb: "Waiting for approval", state: "step" });
    } else if (type === HERMES_RUN_EVENT_TYPES.messageDelta || type.includes("delta") || type.includes("output_text")) {
      assembled += deltaTextFrom(json);
    } else if (type === HERMES_RUN_EVENT_TYPES.runCompleted || type.includes("run.completed") || type.includes("completed") || type.includes("succeeded") || type.includes("done")) {
      finalText = textFromJson(json as HermesRunStatusResponse) ?? finalText;
      usage = usageFromJson(json as HermesRunStatusResponse) ?? usage;
      sawTerminal = true;
      break;
    } else if (type === HERMES_RUN_EVENT_TYPES.runFailed || type === HERMES_RUN_EVENT_TYPES.runCancelled || type.includes("failed") || type.includes("error") || type.includes("cancel")) {
      failed = (json?.error as string) ?? `runtime_run_${type}`;
      sawTerminal = true;
      break;
    }
  }
  if (failed) throw new Error(failed);
  if (!sawTerminal) return null;
  onProgress?.({ verb: "Wrapping up", state: "completed" });
  const text = (finalText ?? assembled).trim();
  return { text: text || "I received it.", usage, external_run_id: runId, mode: "runs" };
}

export function supportsRunEvents(capabilities: HermesCapabilities | null): boolean {
  return featureEnabled(capabilities, [
    "run_events_sse",
    "run_events",
    "runs_events",
    "run_stream",
    "/v1/runs/{run_id}/events",
    "/v1/runs/{id}/events",
    "events",
  ]);
}

/**
 * Like executeHermesTurn, but streams live progress via SSE when the runtime
 * supports it. Always degrades safely: create -> stream -> poll -> sessions chat.
 */
export async function executeHermesTurnStreaming(api: RuntimeApi, input: HermesTurnInput, onProgress?: HermesProgress): Promise<HermesTurnResult> {
  const capabilities = await getRuntimeCapabilities(api);
  if (supportsRuns(capabilities)) {
    try {
      const { runId, terminal } = await createRun(api, input, capabilities);
      if (terminal) { onProgress?.({ verb: "Wrapping up", state: "completed" }); return terminal; }
      if (supportsRunEvents(capabilities)) {
        const streamed = await streamRun(api, runId, capabilities, onProgress);
        if (streamed) return streamed;
      }
      return await pollRun(api, runId, capabilities);
    } catch (err) {
      const msg = String((err as Error).message ?? err);
      if (!msg.startsWith("runtime_404") && !msg.startsWith("runtime_405") && !msg.startsWith("runtime_501")) throw err;
    }
  }
  const session = await chatTurn(api, input);
  return { ...session, mode: "sessions" };
}
