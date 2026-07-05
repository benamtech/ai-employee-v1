#!/usr/bin/env node
/**
 * Automated Haiku worker for the agent-in-the-loop model bridge.
 *
 * Loops over parked `/v1/chat/completions` requests and answers each by spawning
 * a headless Claude Code instance — ALWAYS pinned to the latest Haiku
 * (`claude-haiku-4-5`). This is the enforced version of the "the model is always
 * a Haiku 4.5 subagent" rule in infra/local/agent-model-bridge.md: the tier is
 * hard-coded here (BRIDGE_WORKER_MODEL), with no override path, so no run can
 * accidentally burn Opus/Sonnet on these simple completions.
 *
 *   npm run local:model-bridge-worker            # loop until stopped
 *   MODEL_BRIDGE_WORKER_ONCE=1 npm run local:model-bridge-worker   # answer one and exit
 *
 * Requires the `claude` CLI on PATH (Claude Code) and the bridge server running.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BRIDGE_WORKER_MODEL, buildWorkerPrompt, stripCodeFences } from "./model-bridge-lib.mjs";

const ROOT = join(process.cwd(), "infra", ".local", "model-bridge");
const PENDING = join(ROOT, "pending");
const ANSWERS = join(ROOT, "answers");
mkdirSync(ANSWERS, { recursive: true });

// Hard-pinned. Deliberately NOT read from env — "always Haiku" is the invariant.
const MODEL = BRIDGE_WORKER_MODEL;
const ONCE = process.env.MODEL_BRIDGE_WORKER_ONCE === "1";
const SPAWN_TIMEOUT_MS = Number(process.env.MODEL_BRIDGE_WORKER_TIMEOUT_MS ?? 120_000);

const log = (...a) => console.log(new Date().toISOString(), "[worker]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ids we've already answered this run. The bridge removes the pending file when
// it consumes our answer, but that can lag our next loop by a few hundred ms —
// without this guard the worker re-reads the same pending file and spawns a
// second (wasted) Haiku completion for a request already answered.
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

/** Run one headless Haiku completion for `prompt`, returning stdout text. */
function runHaiku(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      ["-p", "--model", MODEL, "--output-format", "text"],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let out = "";
    let err = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("worker_spawn_timeout")); }, SPAWN_TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`claude exited ${code}: ${err.slice(0, 200)}`));
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

async function answerOne(id) {
  const parked = JSON.parse(readFileSync(join(PENDING, `${id}.json`), "utf8"));
  const preview = (parked.body?.messages ?? []).map((m) => `${m.role}: ${String(m.content).slice(0, 60)}`).join(" | ");
  log(`ANSWERING ${id}  ${preview}`);
  const prompt = buildWorkerPrompt(parked.body);
  const raw = await runHaiku(prompt);
  const answer = stripCodeFences(raw);
  writeFileSync(join(ANSWERS, `${id}.json`), answer);
  answered.add(id);
  log(`DONE ${id}  (${answer.length} bytes) ${answer.slice(0, 80)}`);
}

async function main() {
  ensureClaude();
  log(`watching ${PENDING}${ONCE ? " (once)" : ""}`);
  for (;;) {
    const id = oldestPending();
    if (!id) {
      if (ONCE) { log("no parked requests"); return; }
      await sleep(400);
      continue;
    }
    try {
      await answerOne(id);
    } catch (e) {
      log(`FAILED ${id}: ${String(e?.message ?? e)}`);
      // Leave the parked request for a retry/manual answer; back off briefly.
      await sleep(1000);
    }
    if (ONCE) return;
  }
}

main().catch((e) => { log(`fatal: ${String(e?.message ?? e)}`); process.exit(1); });
