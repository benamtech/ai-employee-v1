-- AMTECH AI Employee MVP — Phase 6: metering foundation
--
-- Additive only. Metering RECORDS FACTS; it is not billing (Phase 11 derives
-- invoices). Existing usage_events/feature_checks/audit_log remain. All ledgers are
-- Manager-only control-plane tables: RLS enabled with NO select policy (the
-- artifact_links convention), so the owner/anon Data API is default-denied and only
-- the service-role Manager client can read raw meter rows.

-- One logical unit of correlated work; run_id threads a chain of tool calls/events.
create table if not exists work_runs (
  id            text primary key,
  account_id    text references accounts(id) on delete set null,
  employee_id   text references employees(id) on delete set null,
  trigger_type  text not null,   -- owner_message | provider_event | scheduled_job | repair | provision | system
  trigger_ref   text,            -- message id, inbound event id, job run id, etc.
  status        text not null default 'started',  -- started | succeeded | failed | cancelled | needs_approval
  summary_safe  text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Immutable raw usage facts.
create table if not exists meter_events (
  id            text primary key,
  run_id        text references work_runs(id) on delete set null,
  account_id    text references accounts(id) on delete set null,
  employee_id   text references employees(id) on delete set null,
  category      text not null,   -- model | hermes_runtime | manager_tool | provider_api | sms | storage | artifact | scheduler
  provider      text,            -- openai | anthropic | xai | hermes | twilio | gmail | stripe | supabase | manager
  feature_key   text not null,
  quantity      numeric not null default 0,
  unit          text not null,   -- input_tokens | output_tokens | cached_tokens | tool_call | sms_segment | api_call | byte | second | cent
  cost_micros   bigint not null default 0,
  request_id    text,
  provider_id   text,
  status        text,
  latency_ms    integer,
  metadata_safe jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- Structured execution trace for Manager/Hermes tools (perf/cost companion to audit_log).
create table if not exists tool_invocations (
  id               text primary key,
  run_id           text references work_runs(id) on delete set null,
  account_id       text references accounts(id) on delete set null,
  employee_id      text references employees(id) on delete set null,
  tool_name        text not null,
  actor            text,
  input_hash       text,
  output_hash      text,
  approval_id      text,
  status           text,
  latency_ms       integer,
  provider_proof_id text,
  error_code       text,
  created_at       timestamptz not null default now()
);

-- Versioned pricing used to estimate cost_micros; never mutate a published version.
create table if not exists meter_pricing_versions (
  id               text primary key,
  provider         text not null,
  feature_key      text,
  unit             text not null,
  unit_cost_micros bigint not null default 0,
  version          integer not null default 1,
  effective_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Derived, replaceable daily totals (Phase 8 populates; table defined now).
create table if not exists usage_rollups_daily (
  id             text primary key,
  day            date not null,
  account_id     text references accounts(id) on delete cascade,
  employee_id    text references employees(id) on delete set null,
  category       text not null,
  provider       text,
  feature_key    text not null,
  unit           text not null,
  quantity       numeric not null default 0,
  cost_micros    bigint not null default 0,
  succeeded      integer not null default 0,
  failed         integer not null default 0,
  p50_latency_ms integer,
  p95_latency_ms integer,
  created_at     timestamptz not null default now(),
  unique(day, account_id, employee_id, category, provider, feature_key, unit)
);

-- Operational budget controls (MVP defaults allow-all; Phase 8+ enforces).
create table if not exists budget_policies (
  id                     text primary key,
  account_id             text references accounts(id) on delete cascade,
  scope                  text not null,   -- feature_key or category/provider wildcard
  period                 text not null,   -- day | month
  included_quantity      numeric,
  hard_limit_cost_micros bigint,
  soft_limit_cost_micros bigint,
  action                 text not null default 'allow',  -- allow | alert | batch | degrade_model | require_approval | block_noncritical
  created_at             timestamptz not null default now()
);

create index if not exists idx_meter_events_run on meter_events(run_id);
create index if not exists idx_meter_events_account_created on meter_events(account_id, created_at desc);
create index if not exists idx_tool_invocations_run on tool_invocations(run_id);
create index if not exists idx_work_runs_account_started on work_runs(account_id, started_at desc);

-- run_id correlation on the event/turn/delivery seams (additive, nullable).
alter table inbound_events     add column if not exists run_id text;
alter table delivery_decisions add column if not exists run_id text;
alter table employee_turn_jobs add column if not exists run_id text;

alter table work_runs             enable row level security;
alter table meter_events          enable row level security;
alter table tool_invocations      enable row level security;
alter table meter_pricing_versions enable row level security;
alter table usage_rollups_daily   enable row level security;
alter table budget_policies       enable row level security;
