# Phase 8 — Metering Rollups, Budgets & Safe Summaries

Status: planned

## Goal / Module

The metering **read/aggregation** layer: daily rollups, budget alerts, and the safe summaries that
operator and owner surfaces read (raw meter rows never reach the browser).

## Depends on

- Phase 7 (populated `meter_events` / `tool_invocations`).

## Surface (code + schema)

- `usage_rollups_daily` population jobs (per account/run/workload).
- `budget_policies` evaluation + alerting.
- Operator-facing cost/margin summaries and owner-safe usage summaries (views/read models only).

## Build tasks

- Build rollup jobs that aggregate ledgers into `usage_rollups_daily`.
- Evaluate `budget_policies` and raise budget alerts.
- Expose **operator** cost/margin summaries and **owner-safe** usage summaries; no raw meter rows in
  browser-readable surfaces.

## Acceptance proof

- Rollups reconcile to the underlying ledgers for a sample period.
- A budget threshold raises an alert.
- An owner **cannot** read another account's summaries (RLS verified).

## Seam handed forward

Cost/usage truth that Phase 10 (admin usage views), Phase 11 (billing), and Phase 12 (LLM provider
cost) consume.

## Status

`planned`.
