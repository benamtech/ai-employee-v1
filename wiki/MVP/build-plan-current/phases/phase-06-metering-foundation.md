# Phase 6 — Metering Foundation

Status: source-wired; Supabase accepted

## Goal / Module

The metering **core**: immutable usage ledgers, shared metering vocabulary, and a `run_id` that
correlates a chain of work. Metering records facts; it is **not** billing (Phase 11 derives invoices).

## Depends on

- Phase 1 (RLS posture / live Supabase) for new exposed tables.
- Design detail: [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) (Metering System).

## Surface (code + schema)

New ledgers (additive; existing `usage_events`/`feature_checks`/`audit_log` remain until intentionally moved):

- `work_runs`
- `meter_events`
- `tool_invocations`
- `meter_pricing_versions`
- `usage_rollups_daily`
- `budget_policies`

Plus `apps/manager/src/lib/metering.ts` (shared vocabulary + write helpers) and **`run_id`
propagation** through the Manager/runtime call path.

## Build tasks

- Add the shared metering vocabulary and `metering.ts`.
- Add the six ledger tables with RLS/grants reviewed for Data API exposure (raw meter rows stay
  Manager-only; no `user_metadata` authorization).
- Thread `run_id` so a chain of tool calls/events shares one correlation id.

## Acceptance proof

- Schema applied; `metering.ts` exists; a single `run_id` threads a multi-step chain in local and live
  integration tests.
- New tables reviewed: no owner-facing exposure of raw meter rows; RLS enabled and proven against live
  Supabase.

## Seam handed forward

The ledger + `run_id` spine that Phase 7 instruments at every chokepoint and Phase 8 rolls up.

## Status

`source-wired` (2026-07-03) with live Supabase proof refreshed on 2026-07-04. Migration `0013` adds the six ledgers (all RLS-on/no-policy, Manager-only)
plus additive `run_id` columns on `inbound_events`/`delivery_decisions`/`employee_turn_jobs`.
`apps/manager/src/lib/metering.ts` provides best-effort `startWorkRun`/`finishWorkRun`/`recordMeterEvent`/
`recordToolInvocation`. A single `run_id` threads ingress → deliver → wake → turn-queue → router →
owner-turn, proven in `tests/unit/run-id-chain.test.ts`; migration `0014` keeps `run_id` crossing the real
turn-claim RPC boundary for the drain lane. Live proof command:
`set -a && source .env && set +a && npm run test:integration -- tests/integration/new-tables-rls.integration.test.ts tests/integration/turn-claim.integration.test.ts`
passed on 2026-07-04 (2 files / 5 tests), proving owner-denied/service-role-allowed RLS for the
Manager-only ledgers and real Postgres turn-claim serialization with `run_id`. Phase 7 instrumentation /
Phase 8 rollups remain `planned`. See
`../../implementation-records/2026-07-03-phase-04-hardening-and-phase-06-record.md`.
