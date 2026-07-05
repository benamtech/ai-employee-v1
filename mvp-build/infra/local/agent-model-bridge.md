# Agent-in-the-loop Model Bridge (no-key local model provider)

Status: active

This is the **set-in-stone method** for driving the AMTECH stack's LLM call sites locally without a funded
provider key, so we can test the pieces that sit *around* the model — the onboarding form, provisioning,
and the Hermes agent's setup steps — before spending on Phase 7/8.

## The idea

An LLM call is just `POST /v1/chat/completions`. The bridge stands up that endpoint locally but **calls no
model**: it parks each request on disk and long-polls until an answer is written. A **Claude Code Haiku
subagent** reads the parked prompt, acts as the model, and writes the completion. Point any
OpenAI-compatible `base_url` at the bridge and a Claude agent becomes the model — for free, on the Claude
Code subscription, with no API key.

```
Manager orchestrator ─┐                        ┌─ node model-bridge-agent.mjs next   (read parked prompt)
Hermes employee ──────┼─→ POST /v1/chat/…  →  bridge  ├─ Haiku 4.5 subagent = the model
                      ┘   (parks, long-polls)          └─ node model-bridge-agent.mjs answer <id> --file …
```

## Non-negotiable: the model is always a **Haiku 4.5** subagent

The worker that answers parked requests **must** run on the **latest Haiku** (`claude-haiku-4-5`). Not
Opus, not Sonnet, not answered by hand. Haiku is fast and cheap, the completions here are simple
(structured onboarding JSON; Hermes setup turns), and fixing the tier keeps runs comparable and
inexpensive.

This is now **enforced in code**, not just by convention: `infra/scripts/local/model-bridge-worker.mjs`
holds **one persistent, warm** headless Claude Code instance with the model **hard-pinned** to
`claude-haiku-4-5` (`BRIDGE_WORKER_MODEL` in `model-bridge-lib.mjs`) — there is no env/flag override.
It is a single long-lived stream-json session, **not** a fresh `claude -p` process per request:

```bash
claude --print --verbose --input-format stream-json --output-format stream-json --model claude-haiku-4-5
```

Each parked request is fed as a new user message on stdin; the worker reads stdout events until that
turn's `result` event, extracts the completion, writes the answer, and loops — **the same instance
answers every parked input**. Requests are handled sequentially (one prompt out, wait for its `result`,
then the next), so request/response matching is trivial. The child self-restarts if it dies. Run it with:

```bash
npm run local:model-bridge-worker         # one warm Haiku instance; loops answering all parked inputs
MODEL_BRIDGE_WORKER_ONCE=1 npm run local:model-bridge-worker   # answer one and exit
```

If you instead answer by hand (or via an Agent-tool subagent), it still **must** be `model: "haiku"`,
and it is likewise **one instance** looping over inputs — never a new instance per request.

## Run it

```bash
# 1. Start the bridge (port 8091 by default)
npm run local:model-bridge

# 2. Point a call site at it (gitignored .env only):
#    Orchestrator onboarding:
ORCHESTRATOR_API_BASE_URL=http://localhost:8091/v1
ORCHESTRATOR_API_KEY=bridge-local            # any non-empty value
#    Hermes employee model (rendered into the profile at provision time):
HERMES_MODEL_PROVIDER=custom
HERMES_MODEL_BASE_URL=http://host.docker.internal:8091/v1   # container reaches host bridge
HERMES_MODEL_DEFAULT=bridge-agent
OPENAI_API_KEY=bridge-local                  # dummy; Hermes needs a value, never used

# 3. Bridge inspection / manual answer (normally a subagent does step 3):
node infra/scripts/local/model-bridge-agent.mjs peek
node infra/scripts/local/model-bridge-agent.mjs next [--raw]
node infra/scripts/local/model-bridge-agent.mjs answer <id> --file <completion.json>
```

Sibling Docker containers reach the host bridge via `host.docker.internal` (the start script adds
`--add-host=host.docker.internal:host-gateway` on Linux).

## The Haiku-subagent worker protocol

Spawn a Haiku subagent (Agent tool, `model: "haiku"`) with instructions equivalent to:

> You are the model behind a local OpenAI-compatible bridge. Loop: run
> `node infra/scripts/local/model-bridge-agent.mjs next --raw` from `mvp-build/`. If it prints `NONE`,
> wait ~2s and retry. Otherwise you are given a system prompt + messages — **produce exactly what that
> system prompt asks for** (e.g. the onboarding JSON schema, or the Hermes agent's next turn). Write your
> completion to a temp file and submit it with `answer <id> --file <path>`. Never add commentary the caller
> didn't ask for. Continue until told to stop.

For the **onboarding orchestrator**, the parked system prompt fully specifies the required JSON
(`assistant_message` / `state` / `manifest_patch` / `ready_for_phone_verification` / `missing_fields`); the
subagent returns only that object. For **Hermes**, the subagent answers whatever the Hermes runtime asks
during setup/turns.

## What this is and is not

- **Is:** a way to exercise the real front-door → manifest → provisioning → Hermes-setup chain locally
  with no key; a repeatable, cheap, non-deterministic tester where a Claude agent is the intelligence.
- **Is not:** proof that a production model behaves identically, and **never** a production path — the
  bridge is local-only. Real acceptance still requires real provider/runtime proof ids (Realness Rules).
