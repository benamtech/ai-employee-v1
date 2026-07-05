#!/usr/bin/env node
/**
 * Agent-in-the-loop OpenAI-compatible model bridge.
 *
 * Stands up a local `/v1/chat/completions` endpoint that DOES NOT call any LLM.
 * Instead it parks each request on disk and long-polls until a human/agent (you,
 * the Claude Code agent) supplies the completion via `model-bridge-agent.mjs`.
 * Point ORCHESTRATOR_API_BASE_URL (or a Hermes model base_url) at it and you
 * become the model — driving the real onboarding/agent loop live, no funded key.
 *
 * Non-deterministic by design: the response is whatever intelligence answers the
 * parked prompt. Latency is irrelevant (the caller just waits).
 *
 *   PORT=8091 node infra/scripts/local/model-bridge.mjs
 *   GET  /            -> health
 *   GET  /v1/models   -> stub model list
 *   POST /v1/chat/completions (and /chat/completions) -> park + long-poll
 */
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.MODEL_BRIDGE_PORT ?? process.env.PORT ?? 8091);
const ROOT = join(process.cwd(), "infra", ".local", "model-bridge");
const PENDING = join(ROOT, "pending");
const ANSWERS = join(ROOT, "answers");
const POLL_MS = 200;
const TIMEOUT_MS = Number(process.env.MODEL_BRIDGE_TIMEOUT_MS ?? 20 * 60_000);
for (const d of [PENDING, ANSWERS]) mkdirSync(d, { recursive: true });

let counter = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString(), ...a);

async function waitForAnswer(id) {
  const answerPath = join(ANSWERS, `${id}.json`);
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (existsSync(answerPath)) {
      const content = readFileSync(answerPath, "utf8");
      rmSync(answerPath, { force: true });
      rmSync(join(PENDING, `${id}.json`), { force: true });
      return content;
    }
    await sleep(POLL_MS);
  }
  throw new Error("bridge_answer_timeout");
}

// The answer file is either plain text (-> assistant content) or a JSON OpenAI
// message object (role/content/tool_calls). Orchestrator answers are JSON strings
// that must stay as `content` (the caller re-parses them), so only treat parsed
// JSON as a message object when it actually looks like one.
function toMessage(raw) {
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object" && !Array.isArray(j) && ("content" in j || "tool_calls" in j || "role" in j)) {
      return { role: "assistant", content: j.content ?? null, ...(j.tool_calls ? { tool_calls: j.tool_calls } : {}) };
    }
  } catch { /* not JSON -> plain text */ }
  return { role: "assistant", content: raw };
}

function chatCompletion(id, model, message) {
  return {
    id: `chatcmpl-bridge-${id}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model ?? "bridge-agent",
    choices: [{ index: 0, message, finish_reason: message.tool_calls ? "tool_calls" : "stop" }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, note: "bridge:agent-in-the-loop" },
  };
}

// OpenAI-style SSE stream for clients that sent stream:true (Hermes does).
function streamCompletion(res, id, model, message) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const base = { id: `chatcmpl-bridge-${id}`, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: model ?? "bridge-agent" };
  const chunk = (delta, finish_reason = null) => res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
  chunk({ role: "assistant" });
  if (message.content) chunk({ content: message.content });
  if (message.tool_calls) chunk({ tool_calls: message.tool_calls });
  chunk({}, message.tool_calls ? "tool_calls" : "stop");
  res.write("data: [DONE]\n\n");
  res.end();
}

const server = createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  const url = (req.url ?? "").split("?")[0];

  if (req.method === "GET" && url === "/") return send(200, { status: "ok", bridge: "agent-in-the-loop", pending: readdirSync(PENDING).length });
  if (req.method === "GET" && url === "/v1/models") return send(200, { object: "list", data: [{ id: "bridge-agent", object: "model", owned_by: "amtech-local" }] });

  if (req.method === "POST" && (url === "/v1/chat/completions" || url === "/chat/completions")) {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      let body = {};
      try { body = JSON.parse(raw || "{}"); } catch { return send(400, { error: { message: "invalid_json" } }); }
      const id = `${Date.now()}-${++counter}`;
      writeFileSync(join(PENDING, `${id}.json`), JSON.stringify({ id, created_at: new Date().toISOString(), model: body.model, body }, null, 2));
      const preview = (body.messages ?? []).map((m) => `${m.role}: ${String(m.content).slice(0, 80)}`).join(" | ");
      log(`PARKED ${id}  ${preview}`);
      try {
        const content = await waitForAnswer(id);
        log(`ANSWERED ${id}  ${body.stream ? "[stream] " : ""}${content.slice(0, 80)}`);
        const message = toMessage(content);
        if (body.stream) streamCompletion(res, id, body.model, message);
        else send(200, chatCompletion(id, body.model, message));
      } catch (e) {
        log(`TIMEOUT ${id}`);
        send(504, { error: { message: String(e.message ?? e) } });
      }
    });
    return;
  }
  send(404, { error: { message: `no route ${req.method} ${url}` } });
});

server.listen(PORT, () => log(`model-bridge listening on http://localhost:${PORT}  (pending dir: ${PENDING})`));
