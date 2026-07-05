# Implementation Record — Phase 4 Hardening + Phase 6 Metering Foundation

Status: source-wired; live runtime/provider proof pending

Date: 2026-07-03

Follows `2026-07-03-phase-03-03a-04-core-record.md`. This pass proves the Phase 3/3A/4-core modules
deterministically (no live creds) via TDD, fixes the bugs that coverage surfaced, and lays the Phase 6
metering foundation. Work done under the standing directive to work the project out locally before env
exists: everything is pushed to `source-wired`; `provider-accepted`/`runtime-accepted` stay `pending`.

## Local proof

- `npm run typecheck` — pass.
- `npm run test:unit` — **38 files / 216 tests** pass (was 26 / 128).
- `npm run build` — pass.
- `npm run lint` — pass.
- `npm run test:integration` — 4 files / 9 tests skip cleanly without creds (2 new env-gated files).

## Test harness capability (enables the rest)

`tests/unit/_helpers/fake-supabase.ts` upgraded so dedupe/concurrency/idempotency are actually falsifiable:

- **Unique-index enforcement** — declared unique-key sets return a Postgres `23505` on collision, so
  `insertDedup` conflict branches and "never double-deliver" guarantees are exercised. `SCHEMA_UNIQUES`
  mirrors migrations 0010–0012. NULL members treated as distinct (Postgres semantics).
- **`.rpc()` shim** — faithful in-JS `claim_employee_turn_job[_for_employee]` / `complete_employee_turn_job`
  over the in-memory tables, so `turn-queue`'s production RPC branch runs under unit tests. The plpgsql
  itself is proven by the env-gated integration test.
- **`.delete()`** support.

## Phase 4 — new unit coverage

Direct tests for every previously-untested new module: `turn-queue`, `hermes-client`, `wake`,
`channel-router`, `ingress`, `event-adapters`, `sms-sender`, `turn-drain`, `metering`, `fake-supabase`,
`run-id-chain`, plus an `event-adapter-contract` test that iterates the live registry so every current AND
future external adapter is held to `verify/normalize/dedupeKey` automatically. `event-bus` extended with
duplicate-delivery, internal direct-delivery, and malformed-descriptor→repair proofs.

## Architecture decision — two event doors (confirmed, kept)

The split is intentional and documented as an invariant:

- `ingestEvent` (`events/ingress.ts`) is the **untrusted external-source spine**: verify → normalize →
  `assertSafeFact` → dedupe → route. External providers (Gmail, Stripe) and employee-emitted intents
  (`send_employee_event`, `source:"manager"`) enter here via a registered `EventSourceAdapter`. This is the
  extension point: **to hook up a new external tool, register an adapter and call `ingestEvent` — nothing
  else.**
- `deliverEmployeeEvent` is the **internal delivery primitive** trusted Manager-authored events call
  directly once they hold a validated descriptor (`dispatch_due_reminders`, daily brief,
  `redeliver_employee_event`). No verify/normalize needed for control-plane-authored events.

## Fixes surfaced by the tests

- **ingress `assertSafeFact`** now matches forbidden raw-provider tokens against object **keys**
  (recursive), not arbitrary value substrings — a customer writing "authorization" in a reply no longer
  routes to repair; a key named `access_token` still does.
- **channel-router** SMS fallback stamps the message `channel:'sms'` (was left `web`); the
  silent / missing-phone / sms-failed delivery-decision writes use `mustWrite` (fail loud) like the web
  branch.
- **registry** — removed the duplicate inline `manager` adapter; strict `adapters/manager.ts` is the sole
  registration (behavior no longer depends on import order).
- **turn-queue orphan fix** — a newer request that claims an older queued turn no longer strands it in
  `running`; `releaseEmployeeTurn` returns it to the queue for the drain.
- Verified the Gmail ingress-resolution seam: `handle_gmail_pubsub` → `deliverReplies` resolves
  account/employee/thread before calling `ingestEvent`; non-estimate threads are skipped, connector-miss is
  audited. No throw is swallowed into a lost event.

## Phase 4 — turn drain lane (A6 decision)

Request-path draining is retained for MVP, hardened by a scheduler-driven drain so a queued owner turn is
never left unanswered: `claimAnyQueuedTurn` + `turn-drain.drainQueuedTurns` process straggler owner-chat
turns FIFO and deliver replies out-of-band via the channel router; event-wake turns fail closed (they
deliver inline within their own claim). Wired as opt-in scheduler job `drain_employee_turns`. Event-wake
contention already routes to repair (not silent queueing).

## Phase 4 — env-gated integration proofs

- `tests/integration/turn-claim.integration.test.ts` — real Postgres proof of the 0011 plpgsql: FIFO claim,
  per-employee lease serialization, lease-token-gated completion, release-then-reclaim.
- `tests/integration/new-tables-rls.integration.test.ts` — proves the 0011/0012 control-plane tables are
  RLS default-deny for the authenticated owner and readable only by the service role. Migrations 0011/0012
  enable RLS with **no** select policy (the `artifact_links` convention); these Manager-only tables are
  correctly excluded from the `owner_scoped` list in 0002. No migration change required.

## Phase 6 — metering foundation

- Migration `0013_phase6_metering.sql`: `work_runs`, `meter_events`, `tool_invocations`,
  `meter_pricing_versions`, `usage_rollups_daily`, `budget_policies` (all RLS-on/no-policy, Manager-only),
  plus additive `run_id` columns on `inbound_events` / `delivery_decisions` / `employee_turn_jobs`.
- `apps/manager/src/lib/metering.ts`: `startWorkRun`/`finishWorkRun`, `recordMeterEvent`,
  `recordToolInvocation`. **Best-effort telemetry** — swallows its own errors, never aborts or throws into
  the owner-facing action (mirrors `audit_log`/`usage_events`; not `mustWrite`).
- **`run_id` correlation** threads a chain: `ingestEvent` opens the run at the true entry point and passes
  it down; `deliverEmployeeEvent` reuses it or opens its own for direct callers and finishes runs it owns;
  `wake`, `turn-queue`, `channel-router`, and the owner-turn path all carry `run_id`. Proven end-to-end in
  `run-id-chain.test.ts` (one id across inbound_events, employee_turn_jobs, tool_invocations, meter_events,
  delivery_decisions).

## Follow-up completion fixes (2026-07-03 19:25)

- **Run lifecycle fixed**: `ingestEvent` now finishes the `work_run` it starts. Normal, duplicate, and
  persisted pending deliveries finish `succeeded`; repair/throw paths finish `failed`. Direct-owned
  `deliverEmployeeEvent` runs now also finish on duplicate, suppression, repair, and normal delivery paths.
- **Drain-lane persistence fixed**: `drainQueuedTurns` now inserts the `to_owner` `employee_messages` row
  before routing, passes `message_id` to the Channel/Session router, and preserves the queued turn's
  `run_id` into `delivery_decisions`.
- **Real RPC run_id propagation fixed**: migration `0014_phase4_turn_claim_run_id.sql` recreates
  `claim_employee_turn_job[_for_employee]` so real Postgres claims return `run_id`; fake-supabase and the
  env-gated turn-claim integration proof now assert this.
- **Phase 6 RLS proof caught up**: `new-tables-rls.integration.test.ts` now covers all six 0013 metering
  ledgers as Manager-only/no-owner-read, in addition to the 0011/0012 control-plane tables.
- Local proof after this pass: `npm run typecheck`, `npm run test:unit` (38 files / 216 tests),
  `npm run test:integration` (9 skipped clean without creds), `npm run lint`, and `npm run build` all pass.

## Pending live proof (unchanged)

Real Hermes `/health`·`/v1/capabilities`·session/chat ids; real Twilio/Gmail-PubSub/Stripe ids through
generic ingress; real Docker/Hermes Jobs runtime. Metering rollups (Phase 8) and instrumentation at every
chokepoint (Phase 7) remain planned. Use `tests/golden-path/live-employee-wake.md` +
`npm run smoke:live-employee` as the live hook.

## Live proof refresh (2026-07-04)

- Phase 6 Supabase proof is now live, not merely env-gated: `set -a && source .env && set +a &&
  npm run test:integration -- tests/integration/new-tables-rls.integration.test.ts
  tests/integration/turn-claim.integration.test.ts` passed against the configured Supabase project
  (2 files / 5 tests). This proves owner-denied/service-role-allowed access for the Manager-only
  metering ledgers and real Postgres turn-claim serialization with `run_id`.
- Hermes runtime endpoint proof advanced but is not `runtime-accepted`: the fresh local employee
  `emp_vhz8kw3bhvh67zu292ukgl` exposed `/health` 200 (`status:"ok"`, `platform:"hermes-agent"`,
  `version:"0.18.0"`) and `/v1/capabilities` 200 with `features.run_events_sse`,
  `features.tool_progress_events`, `features.approval_events`, and `endpoints.run_events`.
  The first provider-backed chat/run stopped honestly at provider auth (`HTTP 401` from the
  OpenAI-compatible endpoint) because the local env has no funded provider key, so there is still no
  valid `/v1/runs/{id}/events` transcript or external runtime run id.

## Carry-forward — Phase 5

On the now-stable descriptor / router / `run_id` seams: real triage priority/grouping + per-account batch
digest flush through `delivery_decisions`; replace the one-shot SSE snapshot with a live Hermes→Work stream
(live-gated) with catch-up from persisted descriptors/messages; approval cards bound from the same
descriptor record used for SMS; one descriptor renders identically to web and SMS.
