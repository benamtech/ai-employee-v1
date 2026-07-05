#!/usr/bin/env node
/**
 * Automated Haiku worker for the agent-in-the-loop model bridge.
 *
 * Holds ONE persistent, warm Claude Code instance and answers EVERY parked
 * `/v1/chat/completions` request through it — NOT a fresh `claude -p` process per
 * request. The instance is a single long-lived stream-json session:
 *
 *   claude --print --verbose --input-format stream-json --output-format stream-json
 *          --model claude-haiku-4-5
 *
 * Each parked request is fed as a new user message on stdin; we read stdout events
 * until that turn's `result` event, extract the completion, write the answer, and
 * loop — same process reused across all inputs. Requests are handled sequentially
 * (one prompt out, wait for its result, then the next), which makes request/response
 * matching trivial. The model tier is hard-pinned to the latest Haiku
 * (`claude-haiku-4-5`, BRIDGE_WORKER_MODEL) with no override path — "always Haiku"
 * is the invariant in infra/local/agent-model-bridge.md.
 *
 *   npm run local:model-bridge-worker            # loop until stopped
 *   MODEL_BRIDGE_WORKER_ONCE=1 npm run local:model-bridge-worker   # answer one and exit
 *
 * Requires the `claude` CLI on PATH (Claude Code) and the bridge server running.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BRIDGE_WORKER_MODEL,
  buildWorkerPrompt,
  stripCodeFences,
  toStreamJsonInput,
  resultTextFromEvent,
} from "./model-bridge-lib.mjs";

const ROOT = join(process.cwd(), "infra", ".local", "model-bridge");
const PENDING = join(ROOT, "pending");
const ANSWERS = join(ROOT, "answers");
mkdirSync(ANSWERS, { recursive: true });

// Hard-pinned. Deliberately NOT read from env — "always Haiku" is the invariant.
const MODEL = BRIDGE_WORKER_MODEL;
const ONCE = process.env.MODEL_BRIDGE_WORKER_ONCE === "1";
const TURN_TIMEOUT_MS = Number(process.env.MODEL_BRIDGE_WORKER_TIMEOUT_MS ?? 120_000);

const log = (...a) => console.log(new Date().toISOString(), "[worker]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ids we've already answered this run. The bridge removes the pending file when
// it consumes our answer, but that can lag our next loop by a few hundred ms —
// without this guard the worker re-reads the same pending file and sends a
// second (wasted) turn for a request already answered.
const answered = new Set();

function oldestPending() {
  if (!existsSync(PENDING)) return undefined;
  const ids = readdirSync(PENDING)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((id) => !answered.has(id))
    .sort();
  return ids.length ? ids[0] : undefined;
}

function ensureClaude() {
  const res = spawnSync("claude", ["--version"], { encoding: "utf8" });
  if (res.status !== 0) {
    log("claude CLI not found on PATH — install Claude Code. Aborting.");
    process.exit(1);
  }
  log(`claude ${String(res.stdout ?? "").trim()} — model pinned to ${MODEL}`);
}

/**
 * One persistent, warm Claude Code stream-json session. Send a prompt with
 * `ask()`; it resolves when this turn's `result` event arrives. Only one turn is
 * ever in flight (the worker loop awaits each answer before sending the next), so
 * the next `result` event is unambiguously this turn's. Restarts the child if it
 * dies so a single crash doesn't end the run.
 */
class HaikuSession {
  constructor() {
    this.child = null;
    this.buffer = "";
    this.pending = null; // { resolve, reject, timer }
  }

  start() {
    this.child = spawn(
      "claude",
      [
        "--print",
        "--verbose",
        "--input-format", "stream-json",
        "--output-format", "stream-json",
        "--model", MODEL,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    this.buffer = "";
    this.child.stdout.on("data", (d) => this._onData(d));
    this.child.stderr.on("data", (d) => {
      const s = d.toString().trim();
      if (s) log(`stderr: ${s.slice(0, 200)}`);
    });
    this.child.on("error", (e) => this._fail(new Error(`claude spawn error: ${String(e?.message ?? e)}`)));
    this.child.on("close", (code) => {
      this._fail(new Error(`claude exited (code ${code})`));
      this.child = null;
    });
    log(`persistent Haiku session started (pid ${this.child.pid})`);
  }

  _onData(d) {
    this.buffer += d.toString();
    let nl;
    while ((nl = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, nl).trim();
      this.buffer = this.buffer.slice(nl + 1);
      if (!line) continue;
      let evt;
      try { evt = JSON.parse(line); } catch { continue; }
      const result = resultTextFromEvent(evt);
      if (result && this.pending) {
        const { resolve, reject, timer } = this.pending;
        this.pending = null;
        clearTimeout(timer);
        if (result.isError) reject(new Error(`turn result error: ${result.text.slice(0, 200)}`));
        else resolve(result.text);
      }
    }
  }

  _fail(err) {
    if (this.pending) {
      const { reject, timer } = this.pending;
      this.pending = null;
      clearTimeout(timer);
      reject(err);
    }
  }

  ask(prompt) {
    if (!this.child || this.child.killed) this.start();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null;
        reject(new Error("worker_turn_timeout"));
      }, TURN_TIMEOUT_MS);
      this.pending = { resolve, reject, timer };
      try {
        this.child.stdin.write(toStreamJsonInput(prompt) + "\n");
      } catch (e) {
        this.pending = null;
        clearTimeout(timer);
        reject(new Error(`stdin write failed: ${String(e?.message ?? e)}`));
      }
    });
  }

  stop() {
    if (this.child) {
      try { this.child.stdin.end(); } catch { /* ignore */ }
      try { this.child.kill("SIGTERM"); } catch { /* ignore */ }
      this.child = null;
    }
  }
}

async function answerOne(session, id) {
  const parked = JSON.parse(readFileSync(join(PENDING, `${id}.json`), "utf8"));
  const preview = (parked.body?.messages ?? []).map((m) => `${m.role}: ${String(m.content).slice(0, 60)}`).join(" | ");
  log(`ANSWERING ${id}  ${preview}`);
  const prompt = buildWorkerPrompt(parked.body);
  const raw = await session.ask(prompt);
  const answer = stripCodeFences(raw);
  writeFileSync(join(ANSWERS, `${id}.json`), answer);
  answered.add(id);
  log(`DONE ${id}  (${answer.length} bytes) ${answer.slice(0, 80)}`);
}

async function main() {
  ensureClaude();
  const session = new HaikuSession();
  session.start();
  const shutdown = () => { session.stop(); process.exit(0); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  log(`watching ${PENDING}${ONCE ? " (once)" : ""}  — one warm Haiku instance answers all inputs`);
  for (;;) {
    const id = oldestPending();
    if (!id) {
      if (ONCE) { log("no parked requests"); session.stop(); return; }
      await sleep(400);
      continue;
    }
    try {
      await answerOne(session, id);
    } catch (e) {
      log(`FAILED ${id}: ${String(e?.message ?? e)}`);
      // Leave the parked request for a retry/manual answer; back off briefly. The
      // session self-restarts on the next ask() if the child died.
      await sleep(1000);
    }
    if (ONCE) { session.stop(); return; }
  }
}

main().catch((e) => { log(`fatal: ${String(e?.message ?? e)}`); process.exit(1); });
