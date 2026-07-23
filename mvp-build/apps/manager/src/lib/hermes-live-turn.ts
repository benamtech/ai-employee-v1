import type { HermesCapabilities } from "@amtech/shared";
import {
  executeHermesTurnStreaming,
  getRuntimeCapabilities,
  parseSseFrames,
  supportsRuns,
  supportsSessionKey,
  type HermesTurnInput,
  type HermesTurnResult,
  type RuntimeApi,
} from "./hermes-client.js";
import { workVerbForTool } from "./work-verbs.js";

export type HermesLiveEvent =
  | { kind: "work_progress"; verb: string; state: "started" | "step" | "completed" }
  | { kind: "assistant_delta"; sequence: number; delta: string };

export type HermesLiveSink = (event: HermesLiveEvent) => void;

type RunResponse = {
  id?: string;
  run_id?: string;
  status?: string;
  state?: string;
  output?: string;
  text?: string;
  message?: string;
  response?: string;
  usage?: Record<string, unknown>;
  error?: string;
  result?: RunResponse;
};

const RUN_POLL_INTERVAL_MS = Math.max(50, Number(process.env.HERMES_RUN_POLL_INTERVAL_MS ?? 250));
const RUN_MAX_POLLS = Math.max(1, Number(process.env.HERMES_RUN_MAX_POLLS ?? 480));
const TURN_TIMEOUT_MS = Math.max(1_000, Number(process.env.HERMES_TURN_TIMEOUT_MS ?? 120_000));

function terminal(status: unknown): boolean {
  return ["succeeded", "completed", "complete", "failed", "cancelled", "canceled", "stopped", "error"]
    .includes(String(status ?? "").toLowerCase());
}

function successful(status: unknown): boolean {
  return ["succeeded", "completed", "complete"].includes(String(status ?? "").toLowerCase());
}

function textFrom(value: RunResponse): string {
  const nested = value.result;
  return String(value.output ?? value.text ?? value.message ?? value.response
    ?? nested?.output ?? nested?.text ?? nested?.message ?? nested?.response ?? "");
}

function usageFrom(value: RunResponse): Record<string, unknown> | undefined {
  return value.usage ?? value.result?.usage;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function advertisedFeature(capabilities: HermesCapabilities | null, names: readonly string[]): boolean {
  const features = record(capabilities?.features);
  return names.some((name) => {
    const value = features[name];
    return value === true || (typeof value === "string" && value.trim().length > 0) || (typeof value === "number" && value > 0);
  });
}

function endpointPath(value: unknown): string {
  if (typeof value === "string") return value;
  const descriptor = record(value);
  return typeof descriptor.path === "string" ? descriptor.path : "";
}

function advertisedEndpoint(capabilities: HermesCapabilities | null, keys: readonly string[], paths: readonly string[]): boolean {
  const endpoints = record(capabilities?.endpoints);
  return Object.entries(endpoints).some(([key, value]) => {
    if (keys.includes(key)) return true;
    const path = endpointPath(value);
    return paths.some((candidate) => path === candidate || path.includes(candidate));
  });
}

/** Current Hermes advertises `run_submission` and an object-valued `runs` endpoint. */
export function supportsLiveRuns(capabilities: HermesCapabilities | null): boolean {
  return supportsRuns(capabilities)
    || advertisedFeature(capabilities, ["run_submission", "run_status"])
    || advertisedEndpoint(capabilities, ["runs", "run_status"], ["/v1/runs"]);
}

/**
 * Current Hermes advertises `run_events_sse` and `{ path: ... }` endpoint
 * descriptors. Older AMTECH detection only recognized `run_events`, which made a
 * streaming runtime look poll-only and delayed the owner until terminal output.
 */
export function supportsLiveRunEvents(capabilities: HermesCapabilities | null): boolean {
  return advertisedFeature(capabilities, ["run_events_sse", "run_events", "runs_events", "run_stream"])
    || advertisedEndpoint(capabilities, ["run_events", "run_events_sse"], ["/v1/runs/{run_id}/events", "/v1/runs/{id}/events"]);
}

function supportsLiveSessionKey(capabilities: HermesCapabilities | null): boolean {
  return supportsSessionKey(capabilities)
    || advertisedFeature(capabilities, ["session_key_header", "session_continuity_header"]);
}

function sessionHeaders(api: RuntimeApi, capabilities: HermesCapabilities | null): Record<string, string> {
  return supportsLiveSessionKey(capabilities) ? { "X-Hermes-Session-Key": api.sessionKey } : {};
}

async function runtimeFetch(api: RuntimeApi, path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TURN_TIMEOUT_MS);
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
  } catch (error) {
    if ((error as Error).name === "AbortError") throw new Error("runtime_timeout");
    throw new Error("runtime_unreachable");
  } finally {
    clearTimeout(timer);
  }
}

function eventType(frame: { event?: string }, json: Record<string, unknown> | null): string {
  return String(frame.event ?? json?.type ?? json?.event ?? "").toLowerCase();
}

function deltaFrom(json: Record<string, unknown> | null): string {
  if (!json) return "";
  const value = json.delta ?? json.text ?? json.content ?? json.output_text;
  return typeof value === "string" ? value : "";
}

function toolNameFrom(json: Record<string, unknown> | null): string | undefined {
  if (!json) return undefined;
  const call = json.tool_call as { name?: unknown } | undefined;
  const value = json.tool_name ?? json.tool ?? json.name ?? call?.name;
  return typeof value === "string" ? value : undefined;
}

async function pollCreatedRun(
  api: RuntimeApi,
  capabilities: HermesCapabilities | null,
  runId: string,
): Promise<HermesTurnResult> {
  for (let attempt = 0; attempt < RUN_MAX_POLLS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, RUN_POLL_INTERVAL_MS));
    const response = await runtimeFetch(api, `/v1/runs/${encodeURIComponent(runId)}`, {
      method: "GET",
      headers: sessionHeaders(api, capabilities),
    });
    const body = await response.json().catch(() => ({})) as RunResponse;
    if (!response.ok) throw new Error(body.error ?? `runtime_${response.status}`);
    const status = body.status ?? body.state;
    if (!terminal(status)) continue;
    if (!successful(status)) throw new Error(body.error ?? `runtime_run_${status}`);
    return {
      text: textFrom(body).trim() || "I received it.",
      usage: usageFrom(body),
      external_run_id: runId,
      mode: "runs",
    };
  }
  throw new Error("runtime_run_timeout");
}

async function executeFallback(
  api: RuntimeApi,
  input: HermesTurnInput,
  onEvent?: HermesLiveSink,
): Promise<HermesTurnResult> {
  const result = await executeHermesTurnStreaming(api, input, (progress) => {
    onEvent?.({ kind: "work_progress", verb: progress.verb, state: progress.state });
  });
  // Poll/session fallbacks cannot provide first-token latency, but the final text
  // still enters the same projection protocol instead of appearing only after a
  // separate resource refresh.
  if (result.text) onEvent?.({ kind: "assistant_delta", sequence: 0, delta: result.text });
  return result;
}

/**
 * Streaming-first Hermes execution for Web/AG-UI/MCP hosts. Harmless text and
 * owner-safe activity are forwarded as soon as Hermes emits them. A started run is
 * never silently recreated through another transport: if its event stream drops,
 * Manager polls that same run so tool/effect work cannot duplicate.
 */
export async function executeHermesTurnLive(
  api: RuntimeApi,
  input: HermesTurnInput,
  onEvent?: HermesLiveSink,
): Promise<HermesTurnResult> {
  const capabilities = await getRuntimeCapabilities(api);
  if (!supportsLiveRuns(capabilities) || !supportsLiveRunEvents(capabilities)) {
    return executeFallback(api, input, onEvent);
  }

  const create = await runtimeFetch(api, "/v1/runs", {
    method: "POST",
    headers: sessionHeaders(api, capabilities),
    body: JSON.stringify({
      input: input.input,
      session_id: api.sessionId,
      ...(input.system_message ? { instructions: input.system_message, system_message: input.system_message } : {}),
      ...(input.work_run_id ? { metadata: { amtech_work_run_id: input.work_run_id } } : {}),
    }),
  });
  const created = await create.json().catch(() => ({})) as RunResponse;
  if (!create.ok) {
    if ([404, 405, 501].includes(create.status)) return executeFallback(api, input, onEvent);
    throw new Error(created.error ?? `runtime_${create.status}`);
  }
  const runId = created.run_id ?? created.id;
  if (!runId) throw new Error("runtime_run_id_missing");

  if (terminal(created.status ?? created.state)) {
    if (!successful(created.status ?? created.state)) throw new Error(created.error ?? "runtime_run_failed");
    const text = textFrom(created).trim() || "I received it.";
    if (text) onEvent?.({ kind: "assistant_delta", sequence: 0, delta: text });
    onEvent?.({ kind: "work_progress", verb: "Wrapping up", state: "completed" });
    return { text, usage: usageFrom(created), external_run_id: runId, mode: "runs" };
  }

  let stream: Response;
  try {
    stream = await runtimeFetch(api, `/v1/runs/${encodeURIComponent(runId)}/events`, {
      method: "GET",
      headers: { ...sessionHeaders(api, capabilities), Accept: "text/event-stream" },
    });
  } catch {
    return pollCreatedRun(api, capabilities, runId);
  }
  if (!stream.ok || !stream.body) return pollCreatedRun(api, capabilities, runId);

  let sequence = 0;
  let assembled = "";
  let finalText = "";
  let usage: Record<string, unknown> | undefined;
  let sawTerminal = false;
  let failed = "";

  for await (const frame of parseSseFrames(stream.body)) {
    let json: Record<string, unknown> | null = null;
    try { json = frame.data ? JSON.parse(frame.data) as Record<string, unknown> : null; } catch { json = null; }
    const type = eventType(frame, json);
    if (type.includes("tool") && (type.includes("start") || type.endsWith(".started"))) {
      onEvent?.({ kind: "work_progress", verb: workVerbForTool(toolNameFrom(json)), state: "started" });
      continue;
    }
    if (type.includes("tool") && (type.includes("complete") || type.includes("end") || type.includes("result"))) {
      onEvent?.({ kind: "work_progress", verb: workVerbForTool(toolNameFrom(json)), state: "step" });
      continue;
    }
    if (type.includes("delta") || type.includes("output_text")) {
      const delta = deltaFrom(json);
      if (delta) {
        assembled += delta;
        onEvent?.({ kind: "assistant_delta", sequence, delta });
        sequence += 1;
      }
      continue;
    }
    if (type.includes("run.completed") || type.includes("response.completed") || type.includes("succeeded") || type === "done") {
      finalText = textFrom(json as RunResponse) || finalText;
      usage = usageFrom(json as RunResponse) ?? usage;
      sawTerminal = true;
      break;
    }
    if (type.includes("failed") || type.includes("error") || type.includes("cancel")) {
      failed = String(json?.error ?? `runtime_run_${type}`);
      sawTerminal = true;
      break;
    }
  }

  if (failed) throw new Error(failed);
  if (!sawTerminal) return pollCreatedRun(api, capabilities, runId);
  onEvent?.({ kind: "work_progress", verb: "Wrapping up", state: "completed" });
  return {
    text: (finalText || assembled).trim() || "I received it.",
    usage,
    external_run_id: runId,
    mode: "runs",
  };
}
