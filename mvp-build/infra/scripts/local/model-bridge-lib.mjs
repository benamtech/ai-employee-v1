/**
 * Shared pure helpers for the agent-in-the-loop model bridge. Kept dependency-free
 * and side-effect-free so both the server (`model-bridge.mjs`) and the automated
 * Haiku worker (`model-bridge-worker.mjs`) import them, and so they are unit-testable.
 */

/** The ONLY model the bridge worker may run as. The completions here are simple
 *  (structured onboarding JSON; Hermes setup turns); Haiku is fast and cheap and
 *  fixing the tier keeps runs comparable and inexpensive. This is hard-pinned —
 *  see infra/local/agent-model-bridge.md ("the model is always Haiku 4.5"). */
export const BRIDGE_WORKER_MODEL = "claude-haiku-4-5";

/**
 * Normalize a raw answer string into an OpenAI message object.
 * The answer file is either plain text (-> assistant content) or a JSON OpenAI
 * message object (role/content/tool_calls). Orchestrator answers are JSON strings
 * that must stay as `content` (the caller re-parses them), so only treat parsed
 * JSON as a message object when it actually looks like one.
 */
export function toMessage(raw) {
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object" && !Array.isArray(j) && ("content" in j || "tool_calls" in j || "role" in j)) {
      return { role: "assistant", content: j.content ?? null, ...(j.tool_calls ? { tool_calls: j.tool_calls } : {}) };
    }
  } catch { /* not JSON -> plain text */ }
  return { role: "assistant", content: raw };
}

/**
 * Build the prompt handed to the Haiku worker for one parked request. The worker
 * BECOMES the model: it must emit exactly the completion the caller's system
 * prompt asks for and nothing else (so the bridge can hand it straight back).
 */
export function buildWorkerPrompt(parkedBody) {
  const messages = Array.isArray(parkedBody?.messages) ? parkedBody.messages : [];
  const wantsJson =
    parkedBody?.response_format?.type === "json_schema" ||
    parkedBody?.response_format?.type === "json_object";
  const lines = [
    "You are the model behind a local OpenAI-compatible chat/completions endpoint.",
    "Read the conversation below (a system prompt followed by messages) and produce",
    "EXACTLY the assistant completion the system prompt requires — nothing else.",
    wantsJson
      ? "The caller requires a JSON response. Output ONLY valid JSON: no markdown code fences, no prose, no leading/trailing text."
      : "Output ONLY the assistant's reply text: no markdown fences, no meta-commentary.",
  ];
  if (parkedBody?.response_format) {
    lines.push(`response_format: ${JSON.stringify(parkedBody.response_format)}`);
  }
  lines.push("----- CONVERSATION -----");
  for (const m of messages) {
    const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    lines.push(`[${m.role}]`, content, "");
  }
  lines.push("----- END CONVERSATION -----", "Now output the completion:");
  return lines.join("\n");
}

/**
 * Strip accidental markdown fences a chat model sometimes wraps JSON in, so the
 * answer the bridge stores is the raw completion the caller expects.
 */
export function stripCodeFences(text) {
  const t = String(text ?? "").trim();
  const fence = t.match(/^```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?```$/i);
  return (fence ? fence[1] : t).trim();
}
