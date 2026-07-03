-- AMTECH AI Employee MVP — Phase 6 repair surface + Hermes Jobs/event-bus seams
--
-- Additive only. Existing Gmail/Stripe/reminder tables stay source of truth.

alter table inbound_events add column if not exists account_id text references accounts(id) on delete set null;
alter table inbound_events add column if not exists employee_id text references employees(id) on delete set null;
alter table inbound_events add column if not exists routing_mode text not null default 'deliver_only';
alter table inbound_events add column if not exists triage_decision text;
alter table inbound_events add column if not exists batch_key text;

create table if not exists event_repair_queue (
  id              text primary key,
  account_id      text references accounts(id) on delete set null,
  employee_id     text references employees(id) on delete set null,
  source          text not null,
  event_type      text,
  provider_id     text,
  inbound_event_id text references inbound_events(id) on delete set null,
  reason          text not null,
  status          text not null default 'open',
  details         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

create table if not exists event_source_suppressions (
  id          text primary key,
  account_id  text references accounts(id) on delete cascade,
  source      text not null,
  event_type  text,
  reason      text not null,
  active      boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists event_batches (
  id          text primary key,
  account_id  text references accounts(id) on delete cascade,
  employee_id text references employees(id) on delete cascade,
  batch_key   text not null,
  status      text not null default 'open',
  event_count integer not null default 0,
  digest_event_id text references inbound_events(id) on delete set null,
  created_at  timestamptz not null default now(),
  flushed_at  timestamptz,
  unique (account_id, batch_key, status)
);

create table if not exists hermes_job_runs (
  id          text primary key,
  job_key     text not null,
  account_id  text references accounts(id) on delete set null,
  employee_id text references employees(id) on delete set null,
  status      text not null default 'started',
  proof       jsonb not null default '{}'::jsonb,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_inbound_events_account_employee
  on inbound_events(account_id, employee_id, created_at desc);

create index if not exists idx_repair_queue_status
  on event_repair_queue(status, created_at);

create index if not exists idx_source_suppressions_active
  on event_source_suppressions(source, event_type, active);

create index if not exists idx_event_batches_lookup
  on event_batches(account_id, batch_key, status);
