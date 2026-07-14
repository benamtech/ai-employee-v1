# Phase CE-3 — Session rotation + handoff

Status: source-wired (2026-07-12; migration `0030` applied live) · live rotation proof `pending`

> Implemented per the [CE-2/CE-3 production implementation plan](phase-ce-02-03-production-implementation-plan.md) §4
> (the authoritative spec). This sketch is retained as the original design rationale. What shipped:
> `employee_sessions` (migration `0030`), `lib/session-rotation.ts` with a **pre-turn** `rotateSessionIfNeeded`
> (rotate before the turn runs, so it executes fresh and re-primes) + a **post-turn** `recordSessionOccupancy`,
> occupancy captured at all three turn sites (`runtime.ts`/`wake.ts`/`turn-drain.ts`) under the turn lock,
> `memory_session_key` preserved while the `transcript_session_id` rotates, and carryover via
> `buildAgentContext` + `deriveNextAction`.

> **Implementation lives in the production plan:**
> [`phase-ce-02-03-production-implementation-plan.md`](phase-ce-02-03-production-implementation-plan.md).
> That doc is the authoritative build plan (occupancy capture, `employee_sessions` schema,
> rotate-before-compaction under the turn lock, `buildAgentContext`-reuse carryover, files/gates/rollout).
> This file is the earlier design sketch; where they differ, the production plan wins. Note the terminology
> fix: `transcript_session_id` (rotates) vs `memory_session_key` = `X-Hermes-Session-Key` (preserved).

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
