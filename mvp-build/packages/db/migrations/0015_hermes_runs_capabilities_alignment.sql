-- AMTECH AI Employee MVP — Hermes API Server alignment
--
-- Stable Hermes memory scope and explicit external runtime-run proof.

alter table runtime_endpoints add column if not exists api_session_key text;

alter table work_runs add column if not exists runtime_provider text;
alter table work_runs add column if not exists external_runtime_run_id text;

create index if not exists idx_work_runs_external_runtime
  on work_runs(runtime_provider, external_runtime_run_id)
  where external_runtime_run_id is not null;
