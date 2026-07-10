-- AMTECH AI Employee MVP — turn-claim lock-insert race fix
--
-- claim_employee_turn_job[_for_employee] (0011/0014): SELECT ... FOR UPDATE
-- SKIP LOCKED only serializes per JOB row, not per employee_id. Two callers
-- can each pick a DIFFERENT queued job row for the SAME employee_id in the
-- same instant (both pass the "no active lock" NOT EXISTS check before either
-- commits), then both attempt `INSERT INTO employee_turn_locks` (PK on
-- employee_id) — the loser gets 23505 and the RPC call throws uncaught
-- (apps/manager/src/lib/turn-queue.ts's orThrow has no code-specific handling),
-- crashing the caller instead of treating it as "nothing claimable now".
--
-- Fix: ON CONFLICT (employee_id) DO NOTHING RETURNING employee_id on the lock
-- insert; if no row comes back, behave exactly like the existing "not found"
-- branch (return zero rows, no throw). Signatures unchanged -> CREATE OR
-- REPLACE preserves the 0021 service_role-only grants; no re-grant needed.

create or replace function claim_employee_turn_job(p_worker_id text, p_lease_seconds integer default 180)
returns table (
  id text,
  account_id text,
  employee_id text,
  kind text,
  idempotency_key text,
  input jsonb,
  attempts integer,
  lease_token text,
  run_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job employee_turn_jobs%rowtype;
  v_token text := p_worker_id || ':' || gen_random_uuid()::text;
  v_locked_employee text;
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
  values (v_job.employee_id, v_job.id, v_token, now() + make_interval(secs => p_lease_seconds), now())
  on conflict (employee_id) do nothing
  returning employee_id into v_locked_employee;

  if v_locked_employee is null then
    -- Lost the per-employee lock race to a concurrent claim of a DIFFERENT
    -- queued job for the same employee (both passed the NOT EXISTS check
    -- before either committed). Behave exactly like "nothing claimable now".
    return;
  end if;

  update employee_turn_jobs j
  set status = 'running',
      attempts = j.attempts + 1,
      lease_token = v_token,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where j.id = v_job.id;

  return query
    select v_job.id, v_job.account_id, v_job.employee_id, v_job.kind,
      v_job.idempotency_key, v_job.input, v_job.attempts + 1, v_token, v_job.run_id;
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
  lease_token text,
  run_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job employee_turn_jobs%rowtype;
  v_token text := p_worker_id || ':' || gen_random_uuid()::text;
  v_locked_employee text;
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
  values (v_job.employee_id, v_job.id, v_token, now() + make_interval(secs => p_lease_seconds), now())
  on conflict (employee_id) do nothing
  returning employee_id into v_locked_employee;

  if v_locked_employee is null then
    return;
  end if;

  update employee_turn_jobs j
  set status = 'running',
      attempts = j.attempts + 1,
      lease_token = v_token,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where j.id = v_job.id;

  return query
    select v_job.id, v_job.account_id, v_job.employee_id, v_job.kind,
      v_job.idempotency_key, v_job.input, v_job.attempts + 1, v_token, v_job.run_id;
end;
$$;
