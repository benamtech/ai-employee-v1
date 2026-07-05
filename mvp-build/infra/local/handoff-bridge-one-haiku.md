# Handoff — one-Haiku model bridge, then headed live test

Status: active handoff

Paste the block below into a fresh session. It is self-contained.

---

```
You are picking up AMTECH AI Employee MVP work in an isolated git worktree. Work only
in this directory; do not cd to the main checkout.

WORKTREE: /home/georgej/AMTECH/GTM-RESEARCH/.claude/worktrees/mcp-server-toolsets-descriptor
BUILD HOME: that path + /mvp-build   (run all npm/node from mvp-build/)

=== STEP 0: ORIENT (read these first, in order) ===
1. <worktree>/identity.md         — required operating self-image/voice for all AMTECH work.
2. <worktree>/CODEGRAPH.md        — root GTM brain map + canonical facts.
3. <worktree>/mvp-build/CODEGRAPH.md — the MVP build's own codegraph (architecture map).
4. <worktree>/mvp-build/CLAUDE.md  — build-home agent guide + in-repo durable memory protocol
   (mvp-build/memory/MEMORY.md). Skim mvp-build/memory/ for the latest dated handoff.
5. <worktree>/mvp-build/infra/local/agent-model-bridge.md — the model-bridge design doc you'll be
   fixing. Note it is the "set-in-stone" local no-key model provider.

House rules that matter: no emojis anywhere. Acceptance vocabulary is honest
(source-wired / provider-accepted / runtime-accepted / planned / pending) — never fake proof.
Secrets by reference only; .env is gitignored, never print or commit its values.

=== THE TASK (in two parts) ===

PART 1 — Make the LLM-provider bridge use ONE persistent Claude Code Haiku session/agent.

Background: an LLM call is just POST /v1/chat/completions. The bridge (infra/scripts/local/
model-bridge.mjs, port 8091) stands up that endpoint but calls NO model — it parks each request
as a JSON file under infra/.local/model-bridge/pending/ and long-polls infra/.local/model-bridge/
answers/ until a completion appears. A Claude Code Haiku instance is "the model": it reads the
parked prompt and writes the answer. This lets us drive the real onboarding -> manifest ->
provisioning -> Hermes chain locally with no funded key. Model tier is a NON-NEGOTIABLE invariant:
always the latest Haiku (claude-haiku-4-5), hard-pinned, never Opus/Sonnet.

THE BUG TO FIX: the current worker (infra/scripts/local/model-bridge-worker.mjs) answers each
parked request by spawning a FRESH `claude -p` process per input (runHaiku() -> spawn claude -p
--model claude-haiku-4-5). The founder explicitly rejected this: it must be ONE persistent Haiku
instance that loops and answers ALL parked inputs, reusing a single warm session — NOT a new
process per input. (We originally had this working as a single Haiku SUBAGENT spawned off the
session; the automated headless version is preferred, but it must still be one instance.)

Two valid approaches — pick the one that actually holds a single warm instance:
  (A) Persistent headless stream-json process. Hold ONE long-lived:
        claude --print --verbose --input-format stream-json --output-format stream-json
               --model claude-haiku-4-5
      (Probed already: with --print, --output-format stream-json REQUIRES --verbose.)
      Feed each parked request as a new user message (stream-json line on stdin); read stdout
      events until that turn's `result` event; extract the result text; write the answer; loop —
      same process reused across all inputs. Sequential (one prompt out, wait for its result,
      then next) makes request/response matching trivial. Keep the model hard-pinned; no override.
  (B) One Haiku Agent-tool subagent (model: "haiku") spawned once off the session that loops using
      the existing CLI: `node infra/scripts/local/model-bridge-agent.mjs next --raw --wait`, produce
      exactly what the parked system prompt asks for (onboarding JSON or Hermes turn — no extra
      commentary), then `answer <id> --file <path>`; repeat until stopped. One instance, many inputs.

Preserve the pure helpers already extracted in infra/scripts/local/model-bridge-lib.mjs
(BRIDGE_WORKER_MODEL = "claude-haiku-4-5", toMessage, buildWorkerPrompt, stripCodeFences) and their
tests in tests/unit/model-bridge.test.ts. Keep/repair the double-answer guard (the bridge deletes
the pending file only after consuming the answer, which can lag the next loop). Update
infra/local/agent-model-bridge.md so its "always Haiku" section describes the single-instance
worker (drop the "spawn a Haiku instance per parked request" wording). Add/adjust unit tests as
needed and run `npm run test:unit` (from mvp-build/).

PART 2 — Live test with a HEADED browser on the webchat client (founder will drive it).

Only after Part 1 is verified. Bring up the whole local stack and open a real headed browser
pointed at the web chat client so the founder can test the AI employee by hand:
  - Bridge:  `npm run local:model-bridge`            (port 8091)
  - Worker:  the fixed single-instance Haiku worker  (starts answering parked requests)
  - Manager: the Manager control plane               (port 8080)
  - Web:     `npm run web:dev`                         (port 3000; portal + /agent/<id> webchat)
  .env (gitignored, already set) repoints ORCHESTRATOR_API_BASE_URL -> http://localhost:8091/v1
  so onboarding/agent LLM calls flow through the bridge to the Haiku worker.
  Launch the browser HEADED (playwright chromium with LOCAL_BROWSER_HEADLESS=0, or just open a
  normal browser) at http://localhost:3000 — onboarding at /create-ai-employee, the employee
  webchat at /agent/<employeeId>. Confirm each service is healthy (bridge GET / , manager /health,
  web 200) and that a parked request gets answered by the single warm Haiku instance before
  handing the browser to the founder. Report the URLs and what's live; the founder will then test
  the AI employee interactively.

Run background servers as background jobs; use $CLAUDE_JOB_DIR/tmp for scratch files. When Part 1
is verified and the stack is up, commit the model-bridge fix + tests, then stop and let the
founder test — do NOT merge or push to main.
```
