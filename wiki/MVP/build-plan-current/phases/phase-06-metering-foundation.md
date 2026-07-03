# Phase 6 — Metering Foundation

Status: planned

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

- Schema applied; `metering.ts` exists; a single `run_id` threads a multi-step chain in a local test.
- New tables reviewed: no owner-facing exposure of raw meter rows; RLS enabled.

## Seam handed forward

The ledger + `run_id` spine that Phase 7 instruments at every chokepoint and Phase 8 rolls up.

## Status

`planned`.
