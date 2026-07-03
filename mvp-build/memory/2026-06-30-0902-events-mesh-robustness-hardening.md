# Handoff — events/reminder mesh robustness hardening

Date: 2026-06-30 09:02
Status: `source-wired` (branch `fix/events-and-systemic-robustness`, **uncommitted**); live gates unchanged/`pending`
Scope: an aside between Phase 2 and the next phase — hardening the manager event/reminder/entitlement tools module (`events.stub.ts`) against a full code review before it carries Phases 3–6 load.

## What changed

Took `apps/manager/src/tools/events.stub.ts` (the `send_employee_event` / `set_internal_reminder` /
`get_reminders` / `dispatch_due_reminders` / `dispatch_daily_briefs` / `get_entitlements` /
`record_usage` module) from a happy-path implementation to a defensible one. A 10-point review drove
the changes; **all ten landed**:

1. **DB faults fail loud.** New helper `apps/manager/src/lib/db.ts` (`orThrow` for reads, `mustWrite`
   for consequential writes); applied at every consequential call site. Telemetry-style writes
   (audit_log, feature_checks, usage_events, health snapshots) deliberately stay non-fatal.
2. **Atomic reminder claim** in `dispatch_due_reminders`: conditional `scheduled → dispatching`
   update (`.eq("status","scheduled")`), only the winning worker delivers, then `sent`/`failed`.
3. **DB-level idempotency:** migration `0009_phase5_reminder_idempotency.sql` — partial unique index
   `reminders_one_scheduled_per_employee_time` on `(employee_id, scheduled_at) where status='scheduled'`.
4. **Actor guard** on scheduler-only tools (`ctx.actor !== "scheduler"` → denied).
5. **`get_reminders` ownership guard** added (`employeeBelongsToAccount`), consistent with siblings.
6. **Entitlements integrated, not passive:** `checkFeature` now gates `send_employee_event` and
   `set_internal_reminder` (default-allow, but the decision is real + audited); deny path returns
   `entitlement_denied`.
7. **Input validation tightened:** pinned enums (channel/routing_mode/event_type prefixes),
   `event_type` length cap, `MAX_SAFE_SUMMARY`, scheduled_at normalization.
8/10. **Timezone-aware rendering:** `loadAccountTimezone` (defaults ET) + render-in-tz helpers; daily
   brief local-date key and job times no longer use server locale / naive UTC `slice(0,10)`.
9. **Delivery semantics out of visible copy:** `[SILENT]` removed; uses `routing_mode: "silent"` with
   a real `safe_summary`.

## Why

This module is the spine that Phases 3–6 plug into (generic ingress → wake → triage/work-surface →
metering). Shipping it happy-path would bake races (double-dispatch, duplicate reminders), silent DB
failures, and an unprivileged scheduler trigger into the foundation. Cheaper to harden now than after
four phases sit on top of it.

## Files / seams touched

- `apps/manager/src/tools/events.stub.ts` (main), new `apps/manager/src/lib/db.ts`.
- `apps/manager/src/lib/employee-events.ts`, `event-triage.ts`, `audit.ts`, `server.ts`, `types.ts`.
- `packages/db/migrations/0009_phase5_reminder_idempotency.sql`; `packages/shared/src/ids.ts`.
- Tests: `tests/unit/reminders.test.ts`, `tests/unit/_helpers/fake-supabase.ts`.
- NOTE: this branch also still carries the **uncommitted Phase 2** runtime/scheduler files
  (`runtime-backend.ts`, `scheduler-runner.ts`, `runtime-health.ts`, `0008_*.sql`, etc.) — nothing
  has been committed since `b92e957`. Two logically separate bodies of work share one dirty tree.

## Carry-forward / next

- **Commit hygiene:** consider splitting into two commits (Phase 2 runtime vs. events hardening) on
  this branch before more work lands; the tree currently mixes both.
- Migration `0009` is additive but **unapplied** — live gate still needs it run with `0008`.
- Phase-mapping for the next session: this work is `source-wired` substrate for **Phase 3** (generic
  ingress/routing), **Phase 4** (wake path), **Phase 5** (triage/work-surface stream), with the
  entitlement gating seam for **Phase 6** (metering foundation). None of those phases are *built* —
  the tools they call are now just hardened.
- Live acceptance for everything (Phase 1) remains `pending` real creds/host.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — pass, **25 files / 125 tests** (was 124; +1 reminders/robustness).
- `npm run lint` — pass.
- Not run this pass: `build`, `test:integration` (env-gated skip), acceptance harness (no creds).
