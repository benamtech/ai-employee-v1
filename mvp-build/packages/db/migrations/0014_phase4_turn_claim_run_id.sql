-- AMTECH AI Employee MVP — Phase 4 completion: turn-claim run_id propagation
--
-- The Phase 6 run_id column on employee_turn_jobs must survive the real
-- claim_employee_turn_job RPC boundary so the Phase 4 drain lane can persist and
-- route queued owner-turn replies under the original work run.

drop function if exists claim_employee_turn_job(text, integer);
drop function if exists claim_employee_turn_job_for_employee(text, text, integer);

create function claim_employee_turn_job(p_worker_id text, p_lease_seconds integer default 180)
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
      v_job.idempotency_key, v_job.input, v_job.attempts + 1, v_token, v_job.run_id;
end;
$$;

create function claim_employee_turn_job_for_employee(p_employee_id text, p_worker_id text, p_lease_seconds integer default 180)
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
      v_job.idempotency_key, v_job.input, v_job.attempts + 1, v_token, v_job.run_id;
end;
$$;
