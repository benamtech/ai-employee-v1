# Phase CE-3 — Session rotation + handoff

Status: planned (depends on CE-1, CE-2)

Goal: in production, **rotate to a fresh session before Hermes must compact**, carrying an ultra-compact,
handoff-oriented note — so work quality never degrades from lossy in-place summarization and the owner
experience stays flawless.

## Why

Compaction is lossy: the model summarizes its own history and drops "subtle but critical context."
Anthropic, Amp, and Hermes's own issue #499 converge on **handoff-oriented context transfer** as the
higher-quality path for long-running work. AMTECH already has what it needs to own this: Manager captures
per-turn `usage` (`turn.usage` in `hermes-client.ts`, currently discarded) and owns `session_id` +
`X-Hermes-Session-Key`. And because MEMORY.md/USER.md are re-injected fresh every session (CE-1), most
durable context **carries across a rotation for free** — the carryover only needs the *active task state*.

## Scope

### 1. Track context occupancy

Persist cumulative context occupancy from `turn.usage.prompt_tokens` (the last turn's prompt size ≈ current
context size) per `session_id`, on `runtime_endpoints` or a new `employee_sessions` table (migration).

### 2. Rotate before compaction

When `prompt_tokens ≥ rotate_threshold × context_length` — with `rotate_threshold` set **below** CE-2's
compression threshold — Manager:

- mints a fresh `session_id`;
- **keeps the same `X-Hermes-Session-Key`** so Hermes's memory scope is preserved across the rotation;
- primes the new session (CE-1 `buildAgentContext` path) plus an **ultra-compact carryover note**.

### 3. The carryover note (handoff-oriented, deterministic)

Assemble the carryover from **Manager brain state**, not a transcript summary (deterministic, higher
fidelity, cheaper): active job(s) + status, open approvals awaiting the owner, in-flight customer threads,
the last decision made, and the single next action. Apply the **no-duplication rule** (never copy the
transcript) and, where useful, name the skill(s) the new session should lean on. MEMORY.md/USER.md are not
repeated in the carryover — they re-inject natively.

## Files / seams

- New `apps/manager/src/lib/session-rotation.ts`; migration for session/occupancy tracking; touch
  `apps/manager/src/lib/runtime.ts` / `lib/turn-queue.ts` (capture `usage` post-turn + rotation check),
  `lib/hermes-client.ts` (usage is already returned). Reuse `lib/agent-context.ts` (CE-1).

## Acceptance gates

- Rotation triggers at `rotate_threshold` from real `usage.prompt_tokens`, and always below the compression
  threshold.
- The carryover note is bounded, handoff-shaped (active work + open approvals + last decision + next
  action), and contains no transcript dump.
- `X-Hermes-Session-Key` is preserved across rotation (memory scope intact).
- Per-employee turn serialization and no-double-delivery invariants hold through a rotation.
- Local gates green. Live rotation proof (real Hermes usage numbers + a real cross-session memory check)
  stays `pending`.

## Tests

- Occupancy tracking from a fixture `usage`; rotation fires at threshold and below compression threshold.
- Carryover assembled from Manager state; bounded; no-duplication; required refs present.
- Session-key preserved; serialization/no-double-delivery intact across rotation.

## Carry-forward

- CE-4 may add per-operator-mode / per-business-type rotation thresholds and, if adopted, external memory
  providers (Mem0/Supermemory-class) for richer cross-session modeling.
