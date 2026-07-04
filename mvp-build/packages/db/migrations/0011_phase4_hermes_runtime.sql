-- AMTECH AI Employee MVP — Phase 4 core: real Hermes runtime contract

alter table runtime_endpoints add column if not exists api_base_url text;
alter table runtime_endpoints add column if not exists api_session_id text;

create table if not exists runtime_endpoint_secrets (
  id                  text primary key,
  runtime_endpoint_id  text not null references runtime_endpoints(id) on delete cascade,
  employee_id          text not null references employees(id) on delete cascade,
  api_key_ref          text not null,
  created_at           timestamptz not null default now(),
  rotated_at           timestamptz
);

create unique index if not exists runtime_endpoint_secrets_runtime_uniq
  on runtime_endpoint_secrets(runtime_endpoint_id);

create table if not exists employee_turn_jobs (
  id              text primary key,
  account_id      text references accounts(id) on delete set null,
  employee_id     text not null references employees(id) on delete cascade,
  kind            text not null,
  idempotency_key text not null unique,
  status          text not null default 'queued',
  input           jsonb not null default '{}'::jsonb,
  output          jsonb not null default '{}'::jsonb,
  error           text,
  attempts        integer not null default 0,
  lease_token     text,
  lease_expires_at timestamptz,
  available_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_employee_turn_jobs_employee_status
  on employee_turn_jobs(employee_id, status, created_at);

create table if not exists employee_turn_locks (
  employee_id       text primary key references employees(id) on delete cascade,
  job_id            text references employee_turn_jobs(id) on delete set null,
  lease_token       text not null,
  lease_expires_at  timestamptz not null,
  updated_at        timestamptz not null default now()
);

create or replace function claim_employee_turn_job(p_worker_id text, p_lease_seconds integer default 180)
returns table (
  id text,
  account_id text,
  employee_id text,
  kind text,
  idempotency_key text,
  input jsonb,
  attempts integer,
  lease_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job employee_turn_jobs%rowtype;
  v_token text := p_worker_id || ':' || gen_random_uuid()::text;
begin
  delete from employee_turn_locks where lease_expires_at <= now();

  select j.* into v_job
  from employee_turn_jobs j
  where j.status = 'queued'
    and j.available_at <= now()
    and not exists (
      select 1 from employee_turn_locks l
      where l.employee_id = j.employee_id and l.lease_expires_at > now()
    )
  order by j.created_at asc
  limit 1
  for update skip locked;

  if not found then
    return;
  end if;

  insert into employee_turn_locks(employee_id, job_id, lease_token, lease_expires_at, updated_at)
  values (v_job.employee_id, v_job.id, v_token, now() + make_interval(secs => p_lease_seconds), now());

  update employee_turn_jobs j
  set status = 'running',
      attempts = j.attempts + 1,
      lease_token = v_token,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where j.id = v_job.id;

  return query
    select v_job.id, v_job.account_id, v_job.employee_id, v_job.kind,
      v_job.idempotency_key, v_job.input, v_job.attempts + 1, v_token;
end;
$$;

create or replace function claim_employee_turn_job_for_employee(p_employee_id text, p_worker_id text, p_lease_seconds integer default 180)
returns table (
  id text,
  account_id text,
  employee_id text,
  kind text,
  idempotency_key text,
  input jsonb,
  attempts integer,
  lease_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job employee_turn_jobs%rowtype;
  v_token text := p_worker_id || ':' || gen_random_uuid()::text;
begin
  delete from employee_turn_locks where lease_expires_at <= now();

  select j.* into v_job
  from employee_turn_jobs j
  where j.employee_id = p_employee_id
    and j.status = 'queued'
    and j.available_at <= now()
    and not exists (
      select 1 from employee_turn_locks l
      where l.employee_id = j.employee_id and l.lease_expires_at > now()
    )
  order by j.created_at asc
  limit 1
  for update skip locked;

  if not found then
    return;
  end if;

  insert into employee_turn_locks(employee_id, job_id, lease_token, lease_expires_at, updated_at)
  values (v_job.employee_id, v_job.id, v_token, now() + make_interval(secs => p_lease_seconds), now());

  update employee_turn_jobs j
  set status = 'running',
      attempts = j.attempts + 1,
      lease_token = v_token,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where j.id = v_job.id;

  return query
    select v_job.id, v_job.account_id, v_job.employee_id, v_job.kind,
      v_job.idempotency_key, v_job.input, v_job.attempts + 1, v_token;
end;
$$;

create or replace function complete_employee_turn_job(p_job_id text, p_lease_token text, p_status text, p_output jsonb default '{}'::jsonb, p_error text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id text;
begin
  update employee_turn_jobs
  set status = p_status,
      output = coalesce(p_output, '{}'::jsonb),
      error = p_error,
      lease_token = null,
      lease_expires_at = null,
      updated_at = now()
  where id = p_job_id
    and lease_token = p_lease_token
    and status = 'running'
  returning employee_id into v_employee_id;

  if not found then
    return false;
  end if;

  delete from employee_turn_locks
  where employee_id = v_employee_id and lease_token = p_lease_token;

  return true;
end;
$$;

alter table runtime_endpoint_secrets enable row level security;
alter table employee_turn_jobs enable row level security;
alter table employee_turn_locks enable row level security;
