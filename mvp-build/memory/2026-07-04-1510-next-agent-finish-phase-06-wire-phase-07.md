# 2026-07-04 15:10 — NEXT AGENT: close Phase 6 metering, then wire Phase 7 instrumentation

Status: handoff prompt (paste into the next Claude Code session in `mvp-build/`).

Read first (orientation): `../identity.md`, `AGENTS.md`, `../CODEGRAPH.md`,
`../wiki/MVP/build-plan-current/phases/phase-06-metering-foundation.md` +
`phase-07-metering-instrumentation.md` + `phase-08-metering-rollups-budgets-summaries.md`,
`docs/metering-architecture.md`, and **`docs/metering-implementation-plan.md`** (the decision-complete
sequence — Phases 2/3/4 there map to this work). Then the metering source. Follow the Realness Rules:
no status upgrade without real proof ids; metering writes are **best-effort telemetry and must never
throw into an owner-critical path**; secrets by reference, no raw payloads in meter metadata.

**Live Supabase is reachable now** — creds are in the gitignored `.env` (project
`amtech-ai-employee-mvp` / `uxuruijrgghshfwnaagb`). Run integration with
`set -a && source .env && set +a && npm run test:integration`.

---

## Part A — Close Phase 6 (small; mostly recording proof)

The foundation is already built and, as of 2026-07-04, mostly proven:

- Six Manager-only ledgers (`work_runs`, `meter_events`, `tool_invocations`, `meter_pricing_versions`,
  `usage_rollups_daily`, `budget_policies`) — migrations `0013`/`0014`, **applied live** (`0001`-`0016`).
- `lib/metering.ts`: `startWorkRun`, `finishWorkRun`, `recordExternalRuntimeRun`, `recordMeterEvent`,
  `recordToolInvocation`.
- `run_id` threaded through the real chain today: `events/ingress.ts` (starts the run) →
  `lib/employee-events.ts` (`meterDelivered`) → `lib/wake.ts` (tool_invocation) → `lib/runtime.ts`
  (owner turn) → `lib/turn-drain.ts` (drain lane). Proven by `tests/unit/run-id-chain.test.ts`.
- **RLS on all six ledgers is now proven LIVE** — `tests/integration/new-tables-rls.integration.test.ts`
  passes 4/4 against live Supabase (owner denied, service-role allowed) after `0016`.

To formally close Phase 6:
1. Re-run live: `new-tables-rls` (6 ledgers) + `turn-claim.integration.test.ts` (confirms `run_id`
   crosses the real `claim_employee_turn_job` RPC, migration `0014`). Capture the run as proof.
2. Update `phase-06-metering-foundation.md` status note + the Phase 6 section of
   `../wiki/MVP/implementation-records/2026-07-03-phase-04-hardening-and-phase-06-record.md` (or a new
   dated record) to reflect the live RLS/`run_id`-chain proof. This moves the foundation to
   effectively `runtime-accepted` for the schema/RLS posture. Do NOT claim more than was proven.

## Part B — Phase 7: metering instrumentation (the real build)

Today only the runtime/event chokepoints are hand-instrumented. The **universal** chokepoints are NOT.
Build in this order (mirrors `metering-implementation-plan.md` §2-4):

1. **Add the wrapper helpers to `lib/metering.ts`** (they don't exist yet):
   - `withMeteredToolInvocation(input, fn)` — wraps a call, always records success AND failure
     (`tool_invocations` + `meter_events`) with latency/status/error/proof, keyed to `run_id`.
   - `withMeteredExternalCall(input, fn)` — same shape for provider/model calls.
   - `estimateCost(provider, modelOrService, unit, quantity, at)` — reads `meter_pricing_versions`
     (currently **unused**); returns cents + an `unknown` flag when no price row matches (never a
     silent zero). Unit tests: success, failure, unknown-pricing, and metadata redaction.
2. **Seed `meter_pricing_versions`** (migration `0017`) with initial model/provider prices; mark
   honestly-unknown where a price isn't known. `estimateCost` consumes these.
3. **Wrap the universal Manager tool route** — `apps/manager/src/server.ts:81`
   (`app.post("/manager/tools/:name", …)`). This is the single biggest win: every tool call should emit
   a `tool_invocation` + `meter_event` (latency, status, error_code, changed resources, approval id,
   proof ids). Thread `run_id` into `ToolContext` (`tools/types.ts`) so tool-emitted meter rows
   correlate — the ctx is built with `account_id`/`employee_id` but no `run_id` today.
4. **Instrument the model adapter** — `lib/orchestrator-model.ts` (`callOpenAiCompatibleModel`): parse
   the provider `usage` block → `recordMeterEvent(category:"model", unit: input/output/cached tokens,
   cost_micros via estimateCost, provider/model/request_id/latency)`.
5. **Provider wrappers** via `withMeteredExternalCall`: `lib/twilio.ts` (sms/verify), `lib/google-gmail.ts`
   + `lib/gmail-tokens.ts` (oauth/send/watch/history), Stripe (`webhooks/stripe.ts` + stripe tools:
   account/invoice/webhook-replay), `lib/artifacts.ts` (Supabase Storage upload/download/signed-link).
6. **Prove the acceptance**: a real **Gmail reply → Stripe invoice → reminder** chain is queryable as
   ONE work chain via `run_id`, with per-step costs present or explicitly `unknown` (no silent zeros).
   Add a test that queries `meter_events`/`tool_invocations` by a single `run_id`.

Keep it best-effort: a failed meter write must not abort the owner-facing action (mirror the existing
`try/catch` swallow in `metering.ts`). No raw email/payment bodies in `metadata_safe` — hash inputs,
store ids/safe metadata only; add a redaction test.

## Part C — if there's room: Phase 8 groundwork (don't over-reach)

Only after 7 is populating rows: `phase-08` = daily rollup job (`usage_rollups_daily`), account/
employee/provider/model summaries, `budget_policies` checks (soft alerts before hard blocks; never
block security/repair or owner-critical work), and operator/owner-safe surfaces. Lay the rollup job +
one budget-alert path if time allows; leave surfaces to their own phase. This is a separate plan — per
the one-phase-per-plan norm, write Phase 8 as its own plan rather than folding it in.

## Definition of done for this session
- Phase 6 closed with recorded live RLS + `run_id`-chain proof.
- Phase 7 wrapper helpers + universal tool-route metering + model token capture landed and unit-tested;
  provider wrappers as far as time allows; the single-`run_id` Gmail→Stripe→reminder chain proven.
- Baseline green (`typecheck && test:unit && build && lint`), integration re-run live where relevant.
- Update the implementation record + write a dated `memory/` handoff. Commit only when asked; branch off
  `main`, don't push without an explicit ask.
