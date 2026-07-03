-- ============================================================================
-- AMTECH AI Employee MVP — Phase 5 reminder firing (additive only)
-- The reminders/job_commitments tables already exist in 0001_init.sql. This
-- migration adds the firing-loop columns: the owner-facing reminder text the
-- employee writes (04-manager-tools.md set_internal_reminder `message`), and the
-- send proof/state the scheduler records when dispatch_due_reminders fires it.
-- ============================================================================

-- Owner-facing reminder text (the employee writes it; the scheduler sends it).
alter table reminders add column if not exists message text;

-- Firing proof/state (set by dispatch_due_reminders): scheduled -> sent | failed.
alter table reminders add column if not exists sent_at timestamptz;
alter table reminders add column if not exists provider_id text;        -- Twilio MessageSid
alter table reminders add column if not exists last_error text;

-- Due-reminder scan index (status + time).
create index if not exists idx_reminders_due
  on reminders(status, scheduled_at);
