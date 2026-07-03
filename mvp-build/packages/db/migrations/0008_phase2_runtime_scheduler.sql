-- AMTECH AI Employee MVP — Phase 2 runtime/scheduler productionization
--
-- Additive only. Docker is the first-pilot runtime backend; `local` remains
-- dev/demo only. Runtime health rows are Manager/admin read-model facts, not
-- owner-browser raw operational payloads.

alter table hermes_job_runs add column if not exists runner_type text not null default 'manager';
alter table hermes_job_runs add column if not exists external_job_id text;
alter table hermes_job_runs add column if not exists error text;

create table if not exists runtime_health_checks (
  id                  text primary key,
  runtime_endpoint_id  text not null references runtime_endpoints(id) on delete cascade,
  account_id           text references accounts(id) on delete set null,
  employee_id          text references employees(id) on delete cascade,
  backend_type         text not null,
  status               text not null,
  checked_at           timestamptz not null default now(),
  details              jsonb not null default '{}'::jsonb
);

create index if not exists idx_runtime_health_checks_employee
  on runtime_health_checks(employee_id, checked_at desc);

create index if not exists idx_runtime_health_checks_status
  on runtime_health_checks(status, checked_at desc);

create index if not exists idx_hermes_job_runs_job_started
  on hermes_job_runs(job_key, started_at desc);

alter table runtime_health_checks enable row level security;
