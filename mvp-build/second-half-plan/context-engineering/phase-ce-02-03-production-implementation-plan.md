# CE-2 / CE-3 Production Implementation Plan

Status: planned (production plan) · Date: 2026-07-12 · Depends: CE-1 (`source-wired`), the [CE README](README.md)

This is the production-level implementation plan for **CE-2** (compression policy, tool-output/hooks
hygiene, turn routing, background work) and **CE-3** (session rotation before lossy compaction, with a
Manager-state-derived handoff), plus **CE-1 loose ends** found by auditing the merged source. It supersedes
the design sketches in [`phase-ce-02-compression-hooks-and-turn-concurrency.md`](phase-ce-02-compression-hooks-and-turn-concurrency.md)
and [`phase-ce-03-session-rotation-and-handoff.md`](phase-ce-03-session-rotation-and-handoff.md) for
implementation purposes; those files are the earlier phase sketches and are updated to point here.

It is written to the design constraints in the [CE-2/CE-3 planning handoff](ce-02-03-production-planning-handoff-prompt.md)
and the doctrine in the [CE README](README.md). No backwards compatibility is required (unlaunched
software). Nothing here claims live Hermes/provider/runtime acceptance — every such gate stays `pending`
until proven against a real Hermes v0.18.x instance (Realness Rule).

---

## 0. Design constraints carried forward (do not violate)

- The **business brain is the whole integrated system** (Hermes + multi-connector event ingress + turns +
  Manager + onboarding + learned state, assembled in `buildEmployeeSnapshot`). Not a facts table, not
  `get_business_brain`.
- `get_business_brain` / `business-brain` stays an **index/resource map**; facts are one explicit resource
  (`business-facts`).
- **Never inject a per-turn digest.** Prime with references once per session; re-prime only on rotation.
- CE-1's live-state primer cap is **2000 estimated tokens**; overall **session target ≤ 400k tokens**.
- **Model-agnostic.** No per-model tuning. Model metadata may be used only as a **capability / context-window
  input**, never as bespoke behavior branches. Must hold across Opus 4.5, Sonnet 5, GLM 5.2, GPT-5.5.
- Keep Hermes **compression enabled as a safety net**; production **rotates before** lossy compaction.
- **Money/customer-facing connector actions stay Manager-mediated.** Direct MCP access must not bypass the
  approval gate or egress controls.
- **Hooks are delivery + hygiene tools, not the security boundary.** Manager owns the once-per-session /
  rotation priming gates; hook-local markers are optimizations only.

---

## 1. Current-state audit

### 1.1 What CE-1 actually merged (verified against source)

| Seam | State after CE-1 |
|---|---|
| `apps/manager/src/lib/agent-context.ts` | Reference-shaped, once-per-session primer. Hard cap **`MAX_ESTIMATED_TOKENS = 2000`** (char/4 heuristic, enforced per-line in `pushLine` + final slice), `SESSION_TARGET_TOKENS = 400000`. Emits brain/facts resource pointers, `session_search` recall hint, profile package + slot keys, proof counts, ≤4 connection surfaces / resurface items / tasks, ≤3 approvals, and a "do not paste raw payloads/secrets" guard. Already carries a placeholder line: "rotate before compaction in CE-3". |
| `apps/manager/src/lib/business-brain.ts` + `lib/mcp-server.ts` | `business-brain` = index/resource map (`buildBusinessBrainIndex`: package, status, context-slot summaries, native-memory pointers, live-state pointers, proof **counts** — no raw facts). `business-facts` = `readBusinessFactsResource` (actual `business_brain_facts` rows, ≤100). Tool descriptions steer the model to `business-facts` "only for explicit fact details." Semantics correct. |
| `apps/manager/src/lib/mcp-server.ts` | Manager exposed as native MCP server over the existing tool registry. Identity injected server-side; account/employee id stripped from advertised schemas. `CallToolRequest` dispatches through `runManagerTool(actor:"employee")`, so **the approval gate is not bypassed**; `business-facts` is a read-only, account-scoped read. |
| `apps/manager/src/server.ts` | `GET /manager/agent-context` hook endpoint; `mcp_`-scoped bearer via `verifyEmployeeMcpCredential`; once-per-session claim; returns primer with `estimated_token_cap: 2000`, `session_target_tokens: 400000`. |
| `packages/agent-template/config.yaml` | Renders scoped MCP bearer; `hooks_auto_accept: true`; `hooks.pre_llm_call → node hooks/pre-session-context.mjs`. **No compression block** (only `models.compression: claude-haiku-4-5`, the aux model). Hooks block is **hardcoded, not tokenized**. |
| `packages/agent-template/hooks/pre-session-context.mjs` | Fail-open shell hook; POSTs to `/manager/agent-context` with the scoped bearer; emits `{context}` or `{}`. |
| `packages/agent-template/memories/MEMORY.md` / `USER.md` | Seeded from `buildNativeMemoryFiles` (caps 2200 / 1375 chars ≈ Hermes native MEMORY/USER caps). |
| Migration `0029_ce1_agent_context_primer_sessions.sql` | Table `agent_context_primer_sessions`, PK `(employee_id, session_key)`, RLS on, grants revoked from anon/authenticated. Auto-applied by the glob runner `packages/db/migrate.mjs` (no hardcoded list). |
| Provisioning `apps/manager/src/lib/profile-renderer.ts` | `profileTokenMap` renders **all five**: profile context markdown + per-slot tokens, `MEMORY_SEED` / `USER_SEED`, the hooks block (template), and the per-employee `MANAGER_MCP_TOKEN` (minted via `mintEmployeeMcpCredential`; render throws if missing). |

### 1.2 Stale / misleading docs (fix as CE-1 loose ends)

- `phase-ce-01-agent-brain-and-native-memory.md` — primer budget "≤ ~500 tokens" is **wrong; implemented cap
  is 2000**; `Status: planned` is stale (CE-1 is `source-wired`); the "render drops still present" section
  (`runtime.ts {input:body}` only, hardcoded PRICING/BRANDING, `get_business_brain` count-only) describes
  pre-CE-1 state — **all fixed in the merge**; "hook plumbing deferred to CE-2" is stale — **CE-1 merged the
  `pre_llm_call` path**.
- `README.md` (CE) — "All phases below are `planned`" (line ~115) is stale for CE-1; the "brain is not the
  `get_business_brain` stub" wording is fine but the stub is now fixed.
- `mvp-build/CODEGRAPH.md` — CE work described as "planned/docs-only"; CE pointer references a pre-CE handoff
  (`2026-07-10-1153`) instead of the 2026-07-12 CE-1 handoffs.

### 1.3 Runtime proofs still pending (no live Hermes proof exists)

1. Rendered `MEMORY.md` / `USER.md` load into Hermes's cached system prompt.
2. `pre_llm_call` fires **once per session** (and the primer endpoint's once-per-session gate matches a real
   per-session identifier — see 1.5 #2).
3. A second turn in the same session does **not** re-inject the primer.
4. Provider/model loop end-to-end.
5. Migration `0029` applied to a live/local DB.
6. Existing employees reprovisioned (current rendered profiles predate `profile_context`, native memory files,
   and hook wiring).

### 1.4 Migration / provisioning / resource-semantics status

- Migration `0029` **exists and is auto-wired** into the runner, but **not yet applied** to any live/local DB.
  The handoff carry-forward flags "apply `0029` before using the hook path."
- Provisioning **renders all five** artifacts (1.1). `business-brain` / `business-facts` semantics are correct.

### 1.5 Correctness / security gaps found in merged source

1. **Primer silently depends on `0029`.** `claimAgentContextPrimer` returns `!error`; if the table is absent
   (migration unapplied) or an insert errors transiently, `claimed = false` → `server.ts` returns empty
   context with `already_primed: true`. An unapplied migration makes the employee **never prime, failing as
   though already primed**, with no surfaced error. → Distinguish "claim failed" from "already primed" (e.g.
   detect PK-conflict vs other errors) and add a startup self-check that the table exists.
2. **`session_key` fallback degrades scoping.** `server.ts` sets `sessionKey = requestedSession ||
   runtime:${credential_id}`. If Hermes does not pass a per-session id to the hook, the gate keys on the
   credential → primes **once per credential lifetime, not per session**, and rotation would never re-prime.
   `proof.session_key_source` ("hermes" vs "runtime_credential") is the detector. → Live-proof gate.
3. **Naming collision (fix in code + docs).** The `agent_context_primer_sessions.session_key` column actually
   holds the **Hermes transcript/session id** (the thing that changes on rotation), which is **distinct** from
   the stable `X-Hermes-Session-Key` memory scope (`runtime_endpoints.api_session_key`). CE-3 depends on this
   distinction. Adopt unambiguous names everywhere: **`transcript_session_id`** (rotates) vs
   **`memory_session_key`** (preserved).
4. **Minor (non-blocking):** the primer path issues duplicate DB reads (`buildEmployeeSnapshot` +
   `buildBusinessBrainIndex`); the scoped bearer is written in plaintext into the rendered `.env` under
   `HERMES_HOME` (inherent to the callback design — the employee must authenticate back to Manager).

---

## 2. CE-1 loose ends (close before CE-2/CE-3)

**Docs (living-brain rule — rewrite/delete, no "we used to think" residue):**
- Fix the 500→2000 primer budget, `planned`→`source-wired`, drops-fixed, and hook-wired claims in
  `phase-ce-01-…md`, the CE `README.md`, and `mvp-build/CODEGRAPH.md`. Refresh the CODEGRAPH CE handoff
  pointer to the 2026-07-12 CE-1 handoffs.

**Source (only where the audit found a gap):**
- Distinguish primer-claim-failure from already-primed (1.5 #1) and surface it in `proof`.
- Rename `session_key` → `transcript_session_id` in the primer path + migration (allowed: unlaunched, no
  back-compat). Keep `proof.session_key_source` as the live detector.
- Add/confirm a unit test that provisioning renders all five artifacts.

**Live proof gates (stay `pending`):** the six items in 1.3, plus apply `0029` and reprovision existing
employees.

---

## 3. CE-2 design

### 3.1 Compression policy — safety net only; rotation trips first

Hermes compresses at `compression.threshold × context_length` (default **0.50**), with a gateway hygiene
backstop (~0.85) and a `hygiene_hard_message_limit` message-count valve; the summary is **lossy** (structured
goal/progress/decisions/files) and the system prompt survives compaction via `system_and_3` prompt caching
([Hermes compression docs][hermes-compression], [Hermes config][hermes-config]).

Plan:
- Add a **`{{COMPRESSION_CONFIG}}`** token to `config.yaml`, rendered by `profile-renderer.ts`. Always render
  **`compression.enabled: true`** (never disable the parachute). Set `threshold`, `protect_last_n`,
  `protect_first_n` (and `hygiene_hard_message_limit` if honored) so **CE-3 rotation trips before Hermes
  compresses** — i.e. Hermes's `threshold` stays at/above the default while CE-3's rotate ratio sits below it.
- `threshold` and rotate ratios derive from a **model→context-window map** in
  `packages/shared/src/model-context.ts`, keyed by model id, returning `{ context_length }` only. This is the
  **single place** model metadata enters CE — a capability input, never a behavior branch. Unknown models fall
  back to a conservative default window. Cross-checks: Opus 4.5 / Sonnet 5 (~200k class), GPT-5.5
  (long-context; stable-prefix + dynamic-suffix caching — [OpenAI prompt caching][openai-cache]), GLM 5.2
  (~1M context, context caching + MCP — [GLM-5 repo][glm5]). The 400k session target only binds for
  windows > ~800k; for ≤200k windows the rotate ratio binds first.

### 3.2 Tool-output hygiene hooks — deterministic, no auxiliary LLM

`transform_tool_result` rewrites **any** tool's result string before it re-enters context;
`transform_terminal_output` runs earlier inside the terminal pipeline. Both replace the string when they
return one and leave it unchanged on `None` ([Hermes hooks docs][hermes-hooks]).

Design a **deterministic** hygiene transform (no model call — keeps it model-agnostic and cheap):
- **Strip bulk** beyond a size budget: raw rfc822 / base64 blobs, large HTML dumps, big JSON arrays, terminal
  spew.
- **Preserve**: IDs, counts, error text, owner-visible fields, approval context, and `amtech://` resource
  pointers. Replace stripped bulk with a marker: `[trimmed N chars; M items; ids: …]`. This mirrors
  Anthropic's "tool-result clearing / context editing" (clear the bulk, keep the structure)
  ([Anthropic context engineering][anthropic-ce]).
- **Redact** secret-shaped keys reusing the `FORBIDDEN_FACT_KEYS` / `assertSafeFact` vocabulary already in
  `events/ingress.ts` (rfc822, tokens, client_secret, authorization, …).

**Open transport question (materially affects files-to-touch).** Hermes primary docs list
`transform_tool_result` / `transform_terminal_output` under **plugin hooks** (registered via
`ctx.register_hook()` in a Python plugin), while the config.yaml **shell-hook** stdout protocol documents only
`{decision}` / `{action}` / `{context}` — **not** result-string replacement ([Hermes hooks docs][hermes-hooks]).
So the result-rewrite path may require a small **Hermes plugin**, not a drop-in shell script. Plan for both:
probe `/v1/capabilities`; if a config.yaml shell hook can rewrite results, ship a Node script under
`packages/agent-template/hooks/`; otherwise ship a small plugin under a new
`packages/agent-template/plugins/` dir. Either way the transform is **deterministic and self-contained** (no
Manager round-trip; hygiene must not add per-tool latency). **`pending` live proof.**

Also tokenize the `hooks:` block (**`{{HOOKS}}`**) so compression/hooks/transforms render together instead of
the current hardcoded single entry.

### 3.3 `pre_tool_call` — defense-in-depth only

Optional. `pre_tool_call` can block a tool (`{action: block}`) ([Hermes hooks docs][hermes-hooks]) — use it
only for audit / rate-limit / obviously-dangerous blocks. **It is never the approval boundary.** The real
gate stays in Manager handlers (`resolve_approval`, money/customer egress in the tool stubs). Fail-open.

### 3.4 Hook transport / auth / failure behavior

- **All Hermes hooks are fail-open by design** — Hermes catches hook errors and never crashes the agent
  ([Hermes hooks docs][hermes-hooks]). Non-TTY gateway/cron runs skip un-consented shell hooks unless
  `hooks_auto_accept: true` / `HERMES_ACCEPT_HOOKS=1` — both already rendered; keep them.
- **Fail-open vs fail-closed by hook type:**
  - `pre_llm_call` primer — **fail-open** (already). Worst case: a session runs without the reference primer;
    the agent still has MEMORY.md/USER.md + `session_search` + MCP resources.
  - hygiene transforms — **fail-open**. Worst case: un-trimmed output, and Hermes compression still catches it.
  - `pre_tool_call` guardrail — **fail-open** (not the boundary).
- **The security boundary is Manager-side, never a hook:** approval gate, egress controls, credential
  scoping. Stated as an invariant so no future change treats a hook as the gate.

### 3.5 Turn routing — `deliver_only` vs `wake_employee`

The seam already exists: `events/ingress.ts:classifyRoute` returns `wake_employee` **only** for
`gmail.reply_received`; everything else is `deliver_only`, honored in `employee-events.ts` via
`routingMode = params.routing_mode ?? "deliver_only"`. No-double-delivery is layered: `inbound_events`
idempotency-key unique index + 23505 backstop; **atomic claim-before-wake** (`status:"claimed"` inserted
before the wake); turn idempotency `wake:${source_event_id}`; per-employee lock; `runEmployeeTurn` releases a
claimed-but-not-ours job.

Formalize a **routing policy table** over current `EVENT_TYPES` (defined in `packages/shared/src`):

| Route | Event kinds (examples from current types) | Rationale |
|---|---|---|
| `wake_employee` | owner-actionable / customer replies: `gmail.reply_received`; (future) inbound customer SMS, QBO write-needs-decision | Needs a reasoning turn to decide/act |
| `deliver_only` | informational / trivial / burst: connector-status changes, Stripe deposit confirmations, digest-eligible bursts | No turn; render owner text directly or batch to a digest |

Keep the table data-driven (a map keyed by event type), so adding a connector doesn't require touching the
router logic. Preserve FIFO ordering + per-employee serialization exactly as today.

### 3.6 Background work off the owner turn

Goal: constant trivial/long work must not occupy the owner's serialized turn lane; background work returns a
**bounded summary + a Manager event**, not an owner turn.

Two mechanisms, **capability-gated and verified-only**:
- **Hermes delegation** — `delegate_task` + `subagent_start` / `subagent_stop` hooks return a bounded
  `child_summary` ([Hermes hooks docs][hermes-hooks], matching Anthropic's sub-agent pattern:
  focused child, clean context, condensed summary back — [Anthropic multi-agent][anthropic-multiagent]).
  **Not** in the authoritative record → gate on `/v1/capabilities`; mark **unverified / `pending`**.
- **Hermes Jobs/cron** — **defer.** The authoritative record says "use `/api/jobs` only after a dedicated
  contract pass." AMTECH already owns a scheduler (`scheduler-runner.ts`, `hermes_job_runs` proof writes) for
  recurring work — prefer it for anything periodic.

CE-2 preserves owner-facing ordering (FIFO claim + per-employee lock) and no-double-delivery through all of
the above: background results re-enter as normal `deliver_only` / `wake_employee` events, subject to the same
idempotency + claim-before-wake machinery.

---

## 4. CE-3 design — rotation before lossy compaction

**Terminology (resolves the 1.5 #3 collision):**
- **`memory_session_key`** = the stable `X-Hermes-Session-Key` (`runtime_endpoints.api_session_key`, grammar
  `amtech:v1:account:…:employee:…`, ≤256 chars, control-chars rejected, echoed back on responses, advertised
  via `/v1/capabilities`) — **preserved across rotation** so Hermes memory scope is continuous.
- **`transcript_session_id`** = the Hermes run/session id (`runtime_endpoints.api_session_id`, sent as
  `session_id` in the run body) — **rotated** to start a fresh transcript.

Confirmed in source: `hermes-client.ts` mints both, sends `X-Hermes-Session-Key` only when
`supportsSessionKey(capabilities)`, and sends `session_id` in the run body. `resolveRuntimeApi` reads both
from `runtime_endpoints`.

### 4.1 Capture occupancy

`executeHermesTurn` / `executeHermesTurnStreaming` already parse `usage` (`usageFromJson`) and return it in
`HermesTurnResult.usage` on every path (terminal create, poll, SSE) — but `runtime.ts` puts it in the job
output and the caller **discards** it. Persist it.

- **Capture at the three turn sites** that run Hermes turns: `runtime.ts` (owner web/SMS), `wake.ts` (event
  wakes), `turn-drain.ts` (straggler owner turns). Missing any site under-counts occupancy.
- Occupancy ≈ the **last turn's prompt/input token count** (Hermes compresses on API-reported prompt tokens
  when available — [Hermes compression docs][hermes-compression]). Store the latest prompt-token count per
  `transcript_session_id` (not a running sum of deltas — the prompt-token count of the most recent turn *is*
  the current context occupancy).
- **`usage` field shape is unverified** across providers (`prompt_tokens` vs `input_tokens`, plus cache
  fields). Capture `usage` generically and extract the largest plausible prompt-token field; mark the exact
  key **`pending` live proof**. Fail-safe: if no token field is found, skip rotation for that turn (compression
  remains the parachute).

### 4.2 Rotation threshold + schema

- **New migration + table `employee_sessions`**: `employee_id`, `transcript_session_id`, `memory_session_key`,
  `context_tokens`, `turn_count`, `status` (`active` | `rotated`), `rotated_from` (nullable),
  `pending_carryover` (bool), `created_at`, `updated_at`. RLS Manager-only, grants revoked from
  anon/authenticated (same pattern as `0029`). This is **distinct** from `agent_context_primer_sessions`
  (which stays the once-per-session primer gate, now keyed by `transcript_session_id`).
- **Rotate when** `context_tokens ≥ rotate_ratio × context_length`, with `rotate_ratio` (~**0.40**) **below**
  CE-2's compression `threshold` (≥0.50), clamped so we stay ≤ 400k:
  `rotate_at = min(rotate_ratio × context_length, SESSION_TARGET_TOKENS × safety)`. `context_length` comes
  from the CE-2 `model-context.ts` map (capability input only).

### 4.3 Mint fresh session, preserve memory scope

- Rotation is a **post-turn Manager action, executed under the per-employee turn lock** (never mid-turn) — so
  serialization + no-double-delivery hold. After a turn completes and usage is captured, if over threshold:
  1. Mark the current `employee_sessions` row `rotated`.
  2. Mint a fresh `transcript_session_id`; **keep `memory_session_key` unchanged**; write the new `active` row
     with `rotated_from` set and `pending_carryover = true`.
  3. Update `runtime_endpoints.api_session_id` to the new transcript id (leave `api_session_key` untouched).
- The **next** turn (`resolveRuntimeApi`) starts a fresh transcript under the same Hermes memory scope. Because
  the primer gate keys on `transcript_session_id`, the new session **re-primes automatically** through the
  existing `pre_llm_call` hook — no new priming path needed. This is why CE-1's once-per-session gate must key
  on the transcript id (1.5 #2/#3).

### 4.4 Carryover — from Manager state, not the transcript

Reuse **`buildAgentContext`** (already Manager-state-derived, reference-shaped, 2k-capped): active work, open
approvals, in-flight threads, tasks, resource pointers. It already *is* the carryover for the common fields.
Add the two missing handoff fields, sourced from Manager state (not the transcript):
- **Last decision** — from the most recent routed intent / resolved approval / `work_runs` outcome.
- **Single next action** — the top open work item / pending approval.

When the new session row has `pending_carryover = true`, `buildAgentContext` adds one line:
*"Continuing from a rotated session; prior detail is in `session_search` + the brain/facts resources."* Then
Manager clears the flag. This matches Anthropic's structured-handoff guidance: carry state + next steps, not
the raw transcript ([Anthropic long-running harnesses][anthropic-harness]).

**Excluded by construction** (references over payloads): transcript summaries, raw provider payloads, secrets,
full connector objects. **MEMORY.md / USER.md are not duplicated** — Hermes re-injects them natively into the
new session's cached system prompt.

### 4.5 Invariants through rotation

Per-employee serialization (`employee_turn_locks` PK) and no-double-delivery (idempotency + atomic
claim-before-wake) hold because rotation runs inside the post-turn window under the same lock and mutates only
`runtime_endpoints` + `employee_sessions`. Tests (4c below) assert: rotation does not double-deliver; queued
turns after rotation use the new `transcript_session_id`; a concurrent event wake during rotation stays
serialized behind the lock.

---

## 5. Files to touch

**Code — CE-2**
- `packages/agent-template/config.yaml` — add `{{COMPRESSION_CONFIG}}` + tokenize `{{HOOKS}}`.
- `apps/manager/src/lib/profile-renderer.ts` — render both tokens.
- `packages/shared/src/model-context.ts` *(new)* — model→context-window map (capability input only).
- `packages/agent-template/hooks/*` *(new Node scripts)* and/or `packages/agent-template/plugins/*` *(new
  Hermes plugin)* — hygiene transform (transport decided by capability probe).
- `apps/manager/src/events/ingress.ts` — routing policy table (data-driven map).
- `apps/manager/src/lib/hermes-client.ts` — capability probes for transform hooks + delegation.

**Code — CE-3**
- `apps/manager/src/lib/session-rotation.ts` *(new)* — occupancy capture + rotate-under-lock.
- `packages/db/migrations/00NN_employee_sessions.sql` *(new)*.
- `apps/manager/src/lib/runtime.ts`, `lib/wake.ts`, `lib/turn-drain.ts` — persist `usage` post-turn + call the
  rotation check under the lock.
- `apps/manager/src/lib/agent-context.ts` — add last-decision / next-action + `pending_carryover` line.

**Code — CE-1 loose ends**
- `apps/manager/src/lib/agent-context.ts` + `server.ts` — distinguish claim-failure from already-primed;
  rename `session_key` → `transcript_session_id`.
- `packages/db/migrations/0029_…sql` — rename column (unlaunched; no back-compat).

**Tests** (`tests/unit/`): hygiene transform over fixtures (huge rfc822, base64, 500-item JSON → ids/counts/
errors/pointers survive, secrets redacted, size bounded); routing policy table; occupancy capture at all three
turn sites; rotation serialization + no-double-delivery + re-prime; `usage`-shape parse tolerance; primer
claim-failure vs already-primed.

**Docs**: this file; CE-1 staleness fixes in `phase-ce-01-…md`, CE `README.md`, `mvp-build/CODEGRAPH.md`;
update the CE-2/CE-3 phase sketch files to point here.

**Runtime / provisioning**: apply `0029` + the new `employee_sessions` migration; reprovision existing
employees for the compression + hooks blocks; live-proof gates (§6).

---

## 6. Acceptance gates

**Local (must pass):** `npm run typecheck && npm run test:unit && npm run build && npm run lint`; new unit
files green; `npm run test:integration` skips clean without creds.

**Integration (env-gated, skip clean):** Postgres RLS + per-employee serialization for `employee_sessions`;
rotation-under-lock; migration apply.

**Live Hermes (stay `pending` until real proof):**
- Transform-hook transport resolved (shell vs plugin) **and** it actually rewrites tool results.
- Compression block honored; rotation trips **before** compression.
- `usage` field shape confirmed (which key carries prompt tokens).
- Primer fires once per transcript session; re-fires on rotation; not on turn 2 of the same session.
- `X-Hermes-Session-Key` preserved while `session_id` changes preserves Hermes memory scope.
- Delegation capability (only if pursued): `delegate_task` advertised + returns bounded `child_summary`.

**Security:** scoped hook creds only; hooks never the approval boundary; MCP resources read-only +
account-scoped; egress stays Manager-mediated; no secrets survive the hygiene transform.

---

## 7. Rollout order

1. **CE-1 loose ends** — de-stale docs; rename `session_key`→`transcript_session_id`; claim-failure vs
   already-primed; apply `0029`; reprovision. CE-1 → `runtime-accepted` only after the §1.3 proofs; otherwise
   it stays `source-wired` / `pending`.
2. **CE-2** — `model-context.ts` + `{{COMPRESSION_CONFIG}}` (`source-wired`); routing policy table
   (`source-wired`); hygiene transform (transport probed; `pending` live); optional `pre_tool_call`. Background
   work capability-gated (`pending`).
3. **CE-3** — occupancy capture (`source-wired`) → `employee_sessions` migration → rotate-under-lock →
   carryover reuse. Live rotation behavior `pending`.

**Rollback / fail-open:** every hook fail-open; if rotation logic errors, **skip rotation** and let Hermes
compression catch it (the parachute) — never block a turn. Feature-flag rotation (env) so it can be disabled
without redeploying agents. The compression block is inert-safe: even if rotation is off, `compression.enabled:
true` bounds context.

**Status vocabulary:** `source-wired` for merged + locally-green code; `runtime-accepted` only with real
Hermes proof; `pending` for everything awaiting a live run. No status upgrade without proof (Realness Rule).

---

## 8. Open questions (materially affect implementation; unresolvable from repo + current docs)

1. **Transform-hook transport** — are `transform_tool_result` / `transform_terminal_output` available as
   config.yaml **shell hooks** (Node script) or only as Hermes **plugins** (Python)? Determines whether we add
   a `plugins/` dir to `agent-template`. (Resolve by live capability probe.)
2. **`usage` field shape** from `/v1/runs` per provider (which key carries prompt tokens; cache-token fields) —
   needed to compute occupancy. (Live proof.)
3. **Delegation** — is `delegate_task` capability-advertised on the running Hermes, and does it return a
   bounded `child_summary`? If not, background work stays on AMTECH's scheduler only. (Live proof.)

---

## Primary sources

- Hermes event hooks: <https://hermes-agent.nousresearch.com/docs/user-guide/features/hooks> [hermes-hooks]
- Hermes sessions: <https://hermes-agent.nousresearch.com/docs/user-guide/sessions>
- Hermes configuration (compression / context / sessions keys): <https://hermes-agent.nousresearch.com/docs/user-guide/configuration> [hermes-config]
- Hermes context compression & caching: <https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching> [hermes-compression]
- Hermes subagent delegation: <https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation>
- Anthropic, effective context engineering for agents: <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents> [anthropic-ce]
- Anthropic, effective harnesses for long-running agents: <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents> [anthropic-harness]
- Anthropic, multi-agent research system (subagent handoffs): <https://www.anthropic.com/engineering/multi-agent-research-system> [anthropic-multiagent]
- OpenAI, prompt caching (stable-prefix / dynamic-suffix, `cached_tokens`): <https://developers.openai.com/api/docs/guides/prompt-caching> [openai-cache]
- GLM-5 (zai-org) repo — 1M context, context caching, MCP: <https://github.com/zai-org/GLM-5> [glm5]

[hermes-hooks]: https://hermes-agent.nousresearch.com/docs/user-guide/features/hooks
[hermes-config]: https://hermes-agent.nousresearch.com/docs/user-guide/configuration
[hermes-compression]: https://hermes-agent.nousresearch.com/docs/developer-guide/context-compression-and-caching
[anthropic-ce]: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
[anthropic-harness]: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
[anthropic-multiagent]: https://www.anthropic.com/engineering/multi-agent-research-system
[openai-cache]: https://developers.openai.com/api/docs/guides/prompt-caching
[glm5]: https://github.com/zai-org/GLM-5
