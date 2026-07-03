# Phase 13 — 1000-User Operations

Status: planned

## Goal / Module

Operate accounts **by queues and summaries**, not raw tables: one operator can find and act on the
top account/provider/runtime issues across ~1000 users, with incident, lifecycle, and load coverage.

## Depends on

- Phase 10 (admin surfaces), Phase 11 (billing), Phase 12 (provider registry).
- Design detail: [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) (1000-User Operating Model).

## Surface (code + schema)

Tables (additive):

- `ops_tasks`, `incidents`, `incident_events`, `admin_notifications`, `diagnostic_bundles`.

Plus a severity/age queue dashboard, lifecycle workflows, and bulk-safe actions.

## Build tasks

- Add ops/incident/notification/diagnostic-bundle schema.
- Build the **queue dashboard by severity/age** (scan health, not raw tables).
- Add account **export / cancellation / retention** workflows.
- Add **bulk-safe** actions for health checks and provider reauth requests.
- Load-test owner messages, provider webhooks, scheduler, admin list, and the Work Surface event stream.
- Document support runbooks.

## Acceptance proof

- One operator can identify and act on the top account/provider/runtime issues **without direct SQL**.
- Load tests pass at target concurrency for the listed paths.
- Export/cancellation/retention workflows complete with audit.

## Seam handed forward

A scalable operating model — the era's exit criterion: paid pilots managed safely toward ~1000 users.

## Status

`planned`.
