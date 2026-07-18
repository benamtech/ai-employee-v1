begin;

-- Durable worker context contains only non-secret values and sealed secret refs.
alter table provisioning_jobs
  add column if not exists worker_context jsonb not null default '{}'::jsonb,
  add column if not exists max_attempts integer not null default 12,
  add column if not exists last_error jsonb,
  add column if not exists completed_at timestamptz;

alter table provisioning_commands
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 12,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

alter table ambient_event_inbox
  add column if not exists max_attempts integer not null default 12,
  add column if not exists last_error jsonb,
  add column if not exists replay_count integer not null default 0;

-- The initial MCP token used to render a profile must survive a Manager restart
-- without being stored in plaintext. Existing rows remain readable but require a
-- rotate/reprovision before the reconciler can reconstruct them.
alter table employee_mcp_credentials
  add column if not exists token_secret_ref text;

create table if not exists ambient_event_dead_letters (
  id text primary key,
  inbox_id text not null references ambient_event_inbox(inbox_id) on delete cascade,
  provider text not null,
  external_event_id text not null,
  failure jsonb not null,
  replay_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_replayed_at timestamptz,
  unique (inbox_id)
);

create index if not exists provisioning_commands_worker_claim_idx
  on provisioning_commands (status, next_attempt_at, lease_expires_at, created_at)
  where status in ('requested','claimed','failed');

create index if not exists ambient_event_dead_letters_provider_idx
  on ambient_event_dead_letters (provider, created_at desc);

alter table ambient_event_dead_letters enable row level security;
revoke all on ambient_event_dead_letters from anon, authenticated;

create or replace function claim_next_provisioning_job(
  p_lease_token text,
  p_lease_seconds integer default 120
)
returns setof provisioning_jobs
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidate as (
    select id
    from provisioning_jobs
    where state not in ('ready','success','failed','compensated')
      and next_attempt_at <= now()
      and attempt_count < max_attempts
      and (lease_expires_at is null or lease_expires_at < now())
    order by created_at
    for update skip locked
    limit 1
  )
  update provisioning_jobs as job
  set lease_token = p_lease_token,
      lease_expires_at = now() + make_interval(secs => greatest(10, p_lease_seconds)),
      attempt_count = job.attempt_count + 1,
      updated_at = now()
  from candidate
  where job.id = candidate.id
  returning job.*;
end;
$$;

create or replace function claim_next_provisioning_command(
  p_lease_token text,
  p_lease_seconds integer default 120
)
returns setof provisioning_commands
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidate as (
    select id
    from provisioning_commands
    where status in ('requested','claimed','failed')
      and next_attempt_at <= now()
      and attempt_count < max_attempts
      and (lease_expires_at is null or lease_expires_at < now())
    order by created_at
    for update skip locked
    limit 1
  )
  update provisioning_commands as command
  set status = 'claimed',
      lease_token = p_lease_token,
      lease_expires_at = now() + make_interval(secs => greatest(10, p_lease_seconds)),
      attempt_count = command.attempt_count + 1,
      updated_at = now()
  from candidate
  where command.id = candidate.id
  returning command.*;
end;
$$;

create or replace function claim_next_ambient_event(
  p_lease_token text,
  p_lease_seconds integer default 120
)
returns setof ambient_event_inbox
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidate as (
    select inbox_id
    from ambient_event_inbox
    where processing_state in ('received','retryable_failed','waiting_for_binding','processing')
      and next_attempt_at <= now()
      and attempt_count < max_attempts
      and (lease_expires_at is null or lease_expires_at < now())
    order by received_at
    for update skip locked
    limit 1
  )
  update ambient_event_inbox as inbox
  set processing_state = 'processing',
      lease_token = p_lease_token,
      lease_expires_at = now() + make_interval(secs => greatest(10, p_lease_seconds)),
      attempt_count = inbox.attempt_count + 1
  from candidate
  where inbox.inbox_id = candidate.inbox_id
  returning inbox.*;
end;
$$;

revoke all on function claim_next_provisioning_job(text, integer) from public, anon, authenticated;
revoke all on function claim_next_provisioning_command(text, integer) from public, anon, authenticated;
revoke all on function claim_next_ambient_event(text, integer) from public, anon, authenticated;

grant execute on function claim_next_provisioning_job(text, integer) to service_role;
grant execute on function claim_next_provisioning_command(text, integer) to service_role;
grant execute on function claim_next_ambient_event(text, integer) to service_role;

commit;
