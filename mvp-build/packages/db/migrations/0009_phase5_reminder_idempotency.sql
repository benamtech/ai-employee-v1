-- ============================================================================
-- AMTECH AI Employee MVP — Phase 5 reminder idempotency (additive only)
-- set_internal_reminder checks "already a scheduled reminder for this employee +
-- time?" in app code, but a select-then-insert can race two concurrent callers
-- into duplicate scheduled reminders. This partial unique index makes the database
-- the source of truth: at most one *scheduled* reminder per (employee, time). The
-- predicate is on status='scheduled' so a reminder can legitimately move to
-- dispatching/sent/failed and a new one be scheduled for the same slot later.
-- ============================================================================

create unique index if not exists reminders_one_scheduled_per_employee_time
  on reminders(employee_id, scheduled_at)
  where status = 'scheduled';
