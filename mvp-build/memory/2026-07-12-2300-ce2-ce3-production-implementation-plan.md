# CE-2/CE-3 production implementation plan authored (docs-only)

Date: 2026-07-12 23:00
Status: planned (production plan) — docs only; no source/config/runtime changed
Scope: Produce the production-level implementation plan for CE-2 + CE-3 (+ CE-1 loose ends) after
auditing the merged CE-1 source and doing primary-source Hermes/Anthropic/OpenAI/GLM research.

## What changed

- New doc: [`second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md`](../second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md)
  — the concrete build plan in the required shape: current-state audit, CE-1 loose ends, CE-2 design,
  CE-3 design, files-to-touch, acceptance gates, rollout order, open questions, primary sources.
- Propagation: CE [`README.md`](../second-half-plan/context-engineering/README.md) phase index now carries
  per-phase status + a plan pointer, and the status-vocabulary line no longer says "all phases planned";
  root [`CODEGRAPH.md`](../CODEGRAPH.md) §2 points at the new plan doc. This handoff + index.

## Why

CE-1 merged as `source-wired`, but the CE phase sketches still described a 500-token primer, "planned-only"
CE-1, unfixed render drops, and hook plumbing "deferred to CE-2" — all stale. The next pass needs one
authoritative, source-grounded build plan for CE-2/CE-3 before any implementation. No back-compat is
required (unlaunched).

## Key findings from the audit (grounded in source reads)

- CE-1 primer cap is **2000 est. tokens** (`lib/agent-context.ts` `MAX_ESTIMATED_TOKENS`), not 500;
  `SESSION_TARGET_TOKENS=400000`. `business-brain` = index/resource map, `business-facts` = fact rows —
  semantics correct. MCP calls dispatch through `runManagerTool(actor:"employee")`, so the approval gate is
  **not** bypassed. Provisioning renders all five (profile context, MEMORY.md, USER.md, hooks, scoped MCP token).
- **Three gaps to fix in CE-1 loose ends:** (1) `claimAgentContextPrimer` returns `!error`, so an unapplied
  `0029` makes the employee **never prime, failing as "already primed"** — distinguish claim-failure from
  already-primed; (2) `server.ts` session-key fallback `runtime:${credential_id}` degrades to once-per-credential
  if Hermes doesn't pass a per-session id (`proof.session_key_source` is the detector); (3) the
  `agent_context_primer_sessions.session_key` column actually holds the **Hermes transcript session id**
  (rotates), distinct from the stable **`X-Hermes-Session-Key`** memory scope — rename to
  `transcript_session_id` vs `memory_session_key` to avoid a CE-3 conflation bug.
- Migration `0029` exists + auto-wired into the glob runner but **not yet applied** anywhere.

## CE-2/CE-3 design headlines

- **CE-2 compression** = safety net only; render `compression.enabled: true` always, set thresholds so CE-3
  rotation trips first; thresholds derive from a new `packages/shared/src/model-context.ts` model→context-window
  map (the ONLY place model metadata enters CE — capability input, never a behavior branch; model-agnostic
  across Opus 4.5 / Sonnet 5 / GLM 5.2 / GPT-5.5).
- **CE-2 hooks** = deterministic (no aux LLM) `transform_tool_result` / `transform_terminal_output` that strip
  bulk but preserve ids/counts/errors/owner-fields/approval-context/resource-pointers and redact secrets
  (reuse `FORBIDDEN_FACT_KEYS`). **Open transport question:** these two are documented as Hermes **plugin**
  hooks (Python `ctx.register_hook`), while config.yaml **shell** hooks only document `{decision}/{action}/{context}`
  — so a small `agent-template/plugins/` Hermes plugin may be required instead of a `.mjs` shell script.
  Probe `/v1/capabilities`; `pending` live proof. `pre_tool_call` is defense-in-depth only, never the boundary.
  All hooks fail-open; security boundary stays Manager-side.
- **CE-2 routing** = formalize `events/ingress.ts:classifyRoute` into a data-driven `deliver_only` vs
  `wake_employee` policy table (today only `gmail.reply_received` wakes). Background work via Hermes
  `delegate_task` (capability-gated, unverified) and/or the existing AMTECH scheduler (prefer it; defer Hermes
  Jobs per the authoritative record). Bounded summaries + Manager events, never owner turns.
- **CE-3 rotation** = capture `turn.usage` (currently parsed by `hermes-client.ts` then **discarded** at
  `runtime.ts:40`) at all three turn sites (`runtime.ts`/`wake.ts`/`turn-drain.ts`); new `employee_sessions`
  table + migration; rotate when `context_tokens ≥ ~0.40 × context_length` (below Hermes 0.50), clamped ≤400k;
  mint a fresh `transcript_session_id` while preserving `memory_session_key`; the primer re-fires automatically
  because its gate keys on the transcript id. Carryover = **reuse `buildAgentContext`** (already Manager-state,
  reference-shaped, 2k-capped) + add last-decision / next-action + a `pending_carryover` line. No transcript
  dump; MEMORY.md/USER.md not duplicated. Rotation runs **under the per-employee turn lock** to preserve
  serialization + no-double-delivery.

## Files / seams named (for the eventual implementation)

- CE-2: `agent-template/config.yaml` (`{{COMPRESSION_CONFIG}}` + `{{HOOKS}}`), `lib/profile-renderer.ts`,
  new `packages/shared/src/model-context.ts`, new `agent-template/hooks/*` or `agent-template/plugins/*`,
  `events/ingress.ts`, `lib/hermes-client.ts`.
- CE-3: new `lib/session-rotation.ts`, new `packages/db/migrations/00NN_employee_sessions.sql`,
  `lib/runtime.ts`/`lib/wake.ts`/`lib/turn-drain.ts`, `lib/agent-context.ts`.
- CE-1 loose ends: `lib/agent-context.ts` + `server.ts` + `0029` rename; `phase-ce-01-…md` / CE `README.md` /
  `CODEGRAPH.md` de-staling.

## Current status

- Docs-only. `planned` (production plan). No local gates run (no code changed). CE-1 stays `source-wired`
  with the six live-proof gates `pending` (incl. apply `0029` + reprovision). CE-2/CE-3 `planned`.

## Carry-forward / next

1. Implement **CE-1 loose ends** first (docs de-staled; rename `session_key`→`transcript_session_id`;
   claim-failure vs already-primed; apply `0029`; reprovision).
2. Then **CE-2** (model-context map + compression block + routing table `source-wired`; hygiene transform
   transport probed, `pending`).
3. Then **CE-3** (occupancy capture → `employee_sessions` → rotate-under-lock → carryover reuse).
4. Resolve the three open questions on a live Hermes: transform-hook transport, `usage` field shape,
   delegation capability.

## Verification

- None run (docs-only, no code). The plan's own local gate is the standard
  `typecheck && test:unit && build && lint` once implementation begins.
