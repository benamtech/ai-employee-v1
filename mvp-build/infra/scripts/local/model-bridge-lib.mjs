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
  // The OpenAI `tools` the caller (Hermes) offers this turn. Dropping these makes
  // the worker structurally unable to call a tool — every turn degrades to a text
  // reply (tool_turns=0) and no real work / MCP-UI view ever fires. `tool_choice:
  // "none"` means the caller does not want a tool call this turn.
  const rawTools = Array.isArray(parkedBody?.tools) ? parkedBody.tools : [];
  const toolChoice = parkedBody?.tool_choice;
  const toolsOffered = toolChoice === "none" ? [] : rawTools;
  const hasTools = toolsOffered.length > 0;

  const lines = [
    "You are the model behind a local OpenAI-compatible chat/completions endpoint.",
    "Read the conversation below (a system prompt followed by messages) and produce",
    "EXACTLY the assistant completion the system prompt requires — nothing else.",
  ];
  if (wantsJson) {
    lines.push(
      "The caller requires a JSON response. Output ONLY valid JSON: no markdown code fences, no prose, no leading/trailing text.",
    );
  } else if (hasTools) {
    lines.push(
      "You have TOOLS (listed below). When the conversation asks you to DO something a tool can accomplish (create an estimate, set a reminder, request approval, save a business fact, draft an email, etc.), CALL the tool rather than describing it — calling tools is how work actually happens here.",
      "To call tools, output ONLY a JSON object of EXACTLY this shape (no prose, no markdown fences):",
      '{"tool_calls":[{"id":"call_1","type":"function","function":{"name":"<tool name>","arguments":"<arguments as a JSON-ENCODED STRING>"}}]}',
      "`arguments` MUST be a string containing JSON, not a nested object. You may emit multiple tool_calls. After a tool runs you are called again with its result, so you can chain calls across turns (e.g. create the estimate, then render the PDF, then create the signed link).",
      "Only when NO tool is needed (a plain question, a confirmation, small talk) output the assistant's reply text instead — no fences, no meta-commentary.",
    );
  } else {
    lines.push("Output ONLY the assistant's reply text: no markdown fences, no meta-commentary.");
  }
  if (parkedBody?.response_format) {
    lines.push(`response_format: ${JSON.stringify(parkedBody.response_format)}`);
  }
  if (hasTools) {
    if (toolChoice && typeof toolChoice === "object" && toolChoice.function?.name) {
      lines.push(`You MUST call the tool "${toolChoice.function.name}" this turn.`);
    } else if (toolChoice === "required") {
      lines.push("You MUST call at least one tool this turn.");
    }
    lines.push("----- TOOLS -----");
    for (const t of toolsOffered) {
      const fn = t?.function ?? t;
      if (!fn?.name) continue;
      lines.push(`- ${fn.name}: ${fn.description ?? ""}`.trimEnd());
      lines.push(`  parameters (JSON Schema): ${fn.parameters ? JSON.stringify(fn.parameters) : "{}"}`);
    }
    lines.push("----- END TOOLS -----");
  }
  lines.push("----- CONVERSATION -----");
  for (const m of messages) {
    if (m.tool_calls) {
      // A prior assistant tool call — surface it so the worker can chain coherently.
      lines.push(`[${m.role}]`, `(tool_calls) ${JSON.stringify(m.tool_calls)}`, "");
    } else {
      const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      lines.push(`[${m.role}${m.name ? " " + m.name : ""}]`, content, "");
    }
  }
  lines.push(
    "----- END CONVERSATION -----",
    hasTools ? "Now output the completion (a tool_calls JSON object, or reply text):" : "Now output the completion:",
  );
  return lines.join("\n");
}

/**
 * Serialize one parked prompt into a stream-json input line for the persistent
 * worker process. The worker holds ONE warm `claude ... --input-format stream-json`
 * instance and feeds each parked request as a fresh user message on stdin; this is
 * that message. (Newline framing is added by the caller.)
 */
export function toStreamJsonInput(prompt) {
  return JSON.stringify({ type: "user", message: { role: "user", content: String(prompt) } });
}

/**
 * Given a parsed stream-json event from the worker process, return the terminal
 * completion for the current turn, or null if this event is not a turn result.
 * Claude Code emits one `result` event per user turn: `{type:"result",
 * subtype:"success"|..., is_error, result:"<text>"}`. We key on that to know a
 * turn finished and reuse the same warm process for the next parked request.
 */
export function resultTextFromEvent(evt) {
  if (!evt || evt.type !== "result") return null;
  return { text: typeof evt.result === "string" ? evt.result : "", isError: Boolean(evt.is_error) };
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
