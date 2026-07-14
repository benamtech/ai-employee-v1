# CE-2 / CE-3 Production Implementation Plan

Status: **implemented / `source-wired`** (2026-07-12; migrations `0029`/`0030` applied live) · live
Hermes hook/compression/rotation proof + live employee reprovision `pending` · Depends: CE-1

> This is the authoritative spec for **CE-2** (compression policy, tool-output/hooks hygiene, turn
> routing, in-turn background work) and **CE-3** (session rotation before lossy compaction, with a
> Manager-state-derived handoff), plus the **CE-1 loose ends** found by auditing the merged source. The
> §3/§4 designs below shipped; the earlier sketches
> [`phase-ce-02-…`](phase-ce-02-compression-hooks-and-turn-concurrency.md) and
> [`phase-ce-03-…`](phase-ce-03-session-rotation-and-handoff.md) point here.
>
> Three "open questions" the plan flagged were resolved from Hermes docs + GitHub (docs/repo are verified
> ground truth; `/v1/capabilities` is a per-instance health/version check, not a feature gate):
> **(1)** `transform_tool_result` / `transform_terminal_output` are **plugin-only** hooks (NousResearch
> PRs #12972, #12929) — shipped as a Python plugin, not a shell hook. **(2)** `delegate_task` is
> **synchronous / in-turn** (isolated child, bounded summary re-enters) — so it is in-turn context
> isolation, not a way to free the owner turn lane (that stays the routing table + scheduler).
> **(3)** `usage` prompt-token field varies by provider — handled by a tolerant parser.

No backwards compatibility is required (unlaunched). Nothing here claims live Hermes/provider/runtime
acceptance beyond the DB migration apply; those gates stay `pending` until proven against a real Hermes
v0.18.x instance (Realness Rule).

---

## 0. Design constraints carried forward (did not violate)

- The **business brain is the whole integrated system** (assembled in `buildEmployeeSnapshot`), not a
  facts table. `business-brain` stays an index/resource map; `business-facts` is the one explicit resource.
- **Never inject a per-turn digest.** Prime with references once per session; re-prime only on rotation.
- Primer cap **2000 estimated tokens**; session target **≤ 400k**.
- **Model-agnostic.** Model metadata enters CE in exactly one place (`model-context.ts`) as a
  context-window capability input, never a behavior branch. Holds across Opus 4.x / Sonnet 5 / GLM 5.2 /
  GPT-5.5.
- Keep Hermes **compression enabled as a safety net**; production **rotates before** lossy compaction.
- **Money/customer-facing connector actions stay Manager-mediated.** Hooks are hygiene/delivery, **never**
  the security boundary — the approval gate + egress stay Manager-side.
- **Add awareness, never nerf.** The management layer must not get in the way of the Hermes runtime's
  power (see the hygiene doctrine in §3.2).

---

## 1. CE-1 loose ends (closed)

Audit of the merged CE-1 found three real gaps, now fixed:

1. **Primer silently depended on `0029`.** `claimAgentContextPrimer` returned `!error`, so an unapplied
   migration (table absent) made the employee **never prime, failing as "already primed."** Fixed: the
   claim now returns a tri-state — `primed` / `already_primed` (23505 PK conflict) / `claim_failed` (any
   other error). `/manager/agent-context` primes anyway on `claim_failed` (fail-open) and surfaces
   `claim_failed: true` in `proof` so a never-priming employee is loud, not silent.
2. **Session-key fallback degraded scoping.** The endpoint keyed the gate on
   `runtime:${credential_id}` when no per-session id arrived, priming once per credential lifetime.
   Retained the `session_key_source` detector; the fallback now only triggers without a transcript id, and
   the `X-Hermes-Session-Key` (stable memory key) was **removed** from transcript-id resolution so it can
   never be mistaken for the transcript.
3. **Naming collision.** The `agent_context_primer_sessions.session_key` column actually held the Hermes
   **transcript** session id (which rotates), distinct from the stable `X-Hermes-Session-Key` memory
   scope. Renamed to **`transcript_session_id`** (code + migration `0029`, unlaunched so no back-compat).
   CE-3 rotation therefore re-primes automatically because the gate keys on the rotating id.

Docs de-staled (500→2000 primer budget, `planned`→`source-wired`, drops-fixed, hook-wired) in
`phase-ce-01-…md`, the CE `README.md`, and `mvp-build/CODEGRAPH.md`.

---

## 2. CE-2 (implemented)

### 2.1 Compression — safety net; rotation trips first
`profile-renderer.ts` renders `{{COMPRESSION_CONFIG}}` into `config.yaml` with Hermes' documented defaults
(`enabled: true`, `threshold: 0.50`, `target_ratio: 0.20`, `protect_last_n: 20`, `protect_first_n: 3`,
`hygiene_hard_message_limit: 5000`). Model-agnostic: `threshold` is a fraction Hermes applies to the
window, and CE-3 rotates at a smaller fraction (0.40), so rotation beats compression for every model with
no per-model tuning. Never disabled (the parachute).

### 2.2 Tool-output hygiene — a deterministic Hermes **plugin**
`transform_tool_result` / `transform_terminal_output` are plugin-only, so
`packages/agent-template/plugins/amtech-hygiene/` (`plugin.yaml` + `__init__.py` `register(ctx)`) is a
deterministic (no LLM, no network) plugin. **Doctrine — add awareness, never nerf:** secret redaction (by
forbidden key + secret-shaped text patterns) is precise and always on; **size-trimming is a last resort**
at a high budget (40k tool / 50k terminal, matching Hermes' own truncation) with generous head/tail — a
`read_file` / query result the agent asked for passes through untouched. Preserves ids, counts, error
text, and `amtech://` pointers when it does trim. `deployPlugins` (`profile-renderer.ts`) installs it into
`$HERMES_HOME/plugins`. Stdlib self-test: `npm run plugins:test` (10 tests).

### 2.3 Turn routing — `deliver_only` vs `wake_employee`
`routeForEventType` (`packages/shared/src/event-types.ts`) is a data-driven policy table replacing the
inline `classifyRoute`. Only owner-actionable / customer-reply events (`gmail.reply_received`) wake;
informational/trivial events stay `deliver_only`; unknown event types default to `deliver_only` so adding
a connector never wakes by accident. FIFO + per-employee serialization + no-double-delivery unchanged.

### 2.4 In-turn background work — `delegate_task`
`{{DELEGATION_CONFIG}}` renders a `delegation:` block (`max_concurrent_children`, `max_spawn_depth: 1`,
`orchestrator_enabled`) so the employee can run heavy sub-work in an isolated child context; only the
bounded child summary re-enters the parent. `delegate_task` is exposed by this block (there is no
`delegation` `platform_toolsets` name), so platform-toolsets is untouched. It is synchronous (in-turn
context isolation); recurring work off the lane stays with the AMTECH scheduler.

---

## 3. CE-3 (implemented) — rotation before lossy compaction

**Terminology:** `memory_session_key` = stable `X-Hermes-Session-Key` (`runtime_endpoints.api_session_key`)
— **preserved** across rotation; `transcript_session_id` = Hermes run/session id
(`runtime_endpoints.api_session_id`, run-body `session_id`) — **rotated**.

- **Schema:** migration `0030_employee_sessions` (Manager-only, RLS on, browser grants revoked;
  partial-unique one-active-per-employee). Tracks `context_tokens`, `turn_count`, `status`,
  `rotated_from`, `pending_carryover`.
- **Two phases under the turn lock** (`lib/session-rotation.ts`), wired at all three turn sites
  (`runtime.ts`, `wake.ts`, `turn-drain.ts`):
  - **`recordSessionOccupancy` (post-turn):** persist the turn's prompt-token occupancy. Tolerant `usage`
    parser: `prompt_tokens`/`input_tokens` (+ Anthropic cache tokens, which are additive; OpenAI
    `cached_tokens` is a subset and not added). No token field → skip (compression is the parachute).
  - **`rotateSessionIfNeeded` (pre-turn):** if the active transcript's recorded occupancy ≥
    `rotate_ratio(0.40) × context_window` (from `model-context.ts`, clamped ≤ 400k), rotate BEFORE the
    turn runs — so the turn executes on the fresh transcript and re-primes with carryover on the same
    turn. Marks the current row `rotated`, mints a fresh `transcript_session_id`, preserves
    `memory_session_key`, writes a new active row with `pending_carryover=true`, and repoints
    `runtime_endpoints.api_session_id`.
- **Carryover from Manager state, not the transcript:** the next primer (CE-1 gate keys on the transcript
  id, so it re-fires) adds a "Continuing from a rotated session…" line + `deriveNextAction(snapshot)` via
  `buildAgentContext`, then clears `pending_carryover`. No transcript dump; MEMORY.md/USER.md re-injected
  natively by Hermes.
- **Invariants:** rotation runs post-turn/pre-next-turn inside the per-employee lock and mutates only
  `runtime_endpoints` + `employee_sessions`, so serialization + no-double-delivery hold. Fail-open: any
  error skips rotation and lets compression catch it. Env kill-switch `AMTECH_SESSION_ROTATION_DISABLED`.

---

## 4. Files touched

- **New:** `packages/shared/src/model-context.ts`; `packages/agent-template/plugins/amtech-hygiene/`
  (`plugin.yaml`, `__init__.py`, `test_hygiene.py`); `apps/manager/src/lib/session-rotation.ts`;
  `packages/db/migrations/0030_employee_sessions.sql`.
- **CE-1:** `apps/manager/src/lib/agent-context.ts`, `apps/manager/src/server.ts`,
  `packages/db/migrations/0029_…sql` (column rename).
- **CE-2:** `packages/agent-template/config.yaml`, `apps/manager/src/lib/profile-renderer.ts`,
  `apps/manager/src/provisioner.ts`, `apps/manager/src/events/ingress.ts`,
  `packages/shared/src/event-types.ts`, `packages/shared/src/ids.ts`.
- **Tests:** `tests/unit/{model-context,event-routing,session-rotation}.test.ts`, extended
  `tests/unit/agent-context.test.ts`, `tests/unit/_helpers/fake-supabase.ts`; plugin `test_hygiene.py`.

---

## 5. Acceptance

- **Local (green):** `typecheck`, **87 unit files / 543 tests**, `plugins:test` 10/10, `build`, `lint`;
  integration skips clean.
- **Live DB (done):** migrations `0029` (renamed) + `0030` applied to the live Supabase; columns / RLS /
  no-anon-grants verified.
- **Live Hermes (`pending`, needs a running instance):** primer fires once per transcript and re-fires on
  rotation (not turn 2); `X-Hermes-Session-Key` preserved while `session_id` changes preserves memory
  scope; compression honored + rotation trips first; hygiene plugin actually rewrites tool results;
  `delegate_task` returns a bounded child summary; exact `usage` prompt-token field confirmed.
- **Reprovision (`pending`):** existing employees must be reprovisioned to pick up the compression /
  delegation / hooks blocks + the hygiene plugin — needs the running Docker/Hermes stack.

---

## Primary sources

- Hermes hooks: <https://hermes-agent.nousresearch.com/docs/user-guide/features/hooks> · transform hooks
  PRs: <https://github.com/NousResearch/hermes-agent/pull/12972>,
  <https://github.com/NousResearch/hermes-agent/pull/12929>
- Hermes delegation: <https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation>
- Hermes configuration / compression: <https://hermes-agent.nousresearch.com/docs/user-guide/configuration>,
  <https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching>
- Anthropic context engineering / long-running harnesses:
  <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents>,
  <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>
