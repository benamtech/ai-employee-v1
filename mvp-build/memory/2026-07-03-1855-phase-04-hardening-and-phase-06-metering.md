# Handoff — Phase 4 Hardening + Phase 6 Metering Foundation

Date: 2026-07-03 18:55
Status: source-wired; live runtime/provider proof pending
Scope: TDD-harden the Phase 3/3A/4-core live-employee spine before env/creds exist, fix the bugs coverage surfaced, then build the Phase 6 metering foundation (ledgers + metering.ts + run_id correlation).

## What changed

Three git commits on `fix/events-and-systemic-robustness` (local-only repo):
1. `9ddf972` — checkpoint of the inherited Phase 3/3A/4-core source (clean base).
2. `c75a17d` — Phase 4 hardening: harness upgrade + module tests + audit fixes + drain lane.
3. (metering) — Phase 6 metering foundation.
Plus an env-gated integration commit for turn-claim + new-table RLS.

- **Test harness upgrade** (`tests/unit/_helpers/fake-supabase.ts`): unique-index enforcement (23505 on
  collision) so `insertDedup` dedupe/idempotency paths actually bite; faithful `.rpc()` for the turn-queue
  claim/complete plpgsql; `.delete()`. `SCHEMA_UNIQUES` export mirrors 0010–0012. This is the reusable TDD
  capability that unlocked real dedupe/concurrency assertions.
- **New unit tests** for every previously-untested new module (turn-queue, hermes-client, wake,
  channel-router, ingress, event-adapters, sms-sender, turn-drain, metering, run-id-chain, fake-supabase)
  + an `event-adapter-contract` test that auto-covers any future adapter.
- **Audit fixes**: key-based (not value-substring) `assertSafeFact`; SMS-delivered message channel fix;
  `mustWrite` on all delivery-decision writes; removed duplicate `manager` adapter registration; fixed a
  real turn-queue orphan bug (claimed-but-not-mine turn was stranded in `running`).
- **Turn drain** (`turn-drain.ts` + `claimAnyQueuedTurn`): scheduler job `drain_employee_turns` processes
  straggler owner-chat turns FIFO and delivers via the router; event-wakes fail closed.
- **Phase 6**: migration `0013` (6 ledgers, all RLS-on/no-policy + additive `run_id` columns), `metering.ts`
  best-effort helpers, and `run_id` threaded ingress → deliver → wake → turn-queue → router → owner-turn.

## Why

Standing founder directive: work the whole MVP out locally with TDD before hooking up env variables; we
won't have live proof ids for a while, so maximize deterministic coverage and keep provider/runtime
acceptance `pending`. The Phase 3/3A/4-core modules were source-wired but essentially untested, and the
fake couldn't prove the dedupe/serialization guarantees the phase rests on. Phase 6 was pulled forward
(before Phase 5) so the `run_id` contract is stable before Phase 5 stream shapes adopt it.

## Key decision — two event doors (confirmed with founder)

`ingestEvent` = untrusted external-source spine (verify/normalize/safe-fact/dedupe/route); the source-adapter
contract (`registerEventSource` + `EventSourceAdapter`) is the extension point for new external tools.
`deliverEmployeeEvent` = internal delivery primitive for trusted Manager-authored events that already hold a
validated descriptor (reminders, daily brief, redeliver). The split is intentional; do NOT unify them.
An earlier plan to route everything through `ingestEvent` was rejected — external vs internal is the right
boundary. See [[ai-employee-mvp-source-and-resync]], [[agent-inbox-and-channel-architecture]].

## Current status

- Phase 3 / 3A / 4-core: `source-wired`, now deterministically proven up to the live socket. Live
  runtime/provider proof still `pending`.
- Phase 4 hardening + drain: `source-wired`.
- Phase 6 metering foundation: `source-wired`.
- Phase 5: `planned`.
Local truth: typecheck/build/lint pass; **38 unit files / 214 tests**; integration 7 skipped clean.

## Files / seams touched

- Harness: `tests/unit/_helpers/fake-supabase.ts`; many new `tests/unit/*.test.ts`; new
  `tests/integration/{turn-claim,new-tables-rls}.integration.test.ts`.
- Fixes: `events/ingress.ts`, `events/registry.ts`, `lib/channel-router.ts`, `lib/turn-queue.ts`.
- Drain: `lib/turn-drain.ts`, `lib/scheduler-runner.ts`.
- Metering: `packages/db/migrations/0013_phase6_metering.sql`, `lib/metering.ts`, `packages/shared/src/ids.ts`,
  `lib/employee-events.ts`, `lib/wake.ts`, `lib/runtime.ts`, `events/ingress.ts`,
  `packages/shared/src/channel-routing.ts`.

## Carry-forward / next

- Live acceptance when creds land: capture real Hermes/Twilio/Gmail/Stripe/Docker proof ids; then the
  live gate is the only unknown (design + deterministic paths already green).
- Phase 5 on the stable descriptor/router/`run_id` seams: real triage/batching, live Work Surface stream
  (replace one-shot SSE snapshot) with catch-up, approval cards bound from the same descriptor as SMS.
- Phase 7 instruments meter_events/tool_invocations at every chokepoint; Phase 8 rolls up
  `usage_rollups_daily`. Do not build rollups before Phase 7 populates the ledgers.
- Consider an always-on drain cadence for `drain_employee_turns` (currently opt-in via the scheduler
  entrypoint).

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — 38 files / 214 tests pass.
- `npm run build` — pass.
- `npm run lint` — pass.
- `npm run test:integration` — 7 skipped clean (no creds).
