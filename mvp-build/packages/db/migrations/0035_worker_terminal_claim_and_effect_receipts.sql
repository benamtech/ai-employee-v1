begin;

create table if not exists ambient_effect_receipts (
  id text primary key,
  inbox_id text not null references ambient_event_inbox(inbox_id) on delete cascade,
  effect_key text not null unique,
  provider text not null,
  state text not null default 'claimed' check (state in ('claimed','applied','failed','ambiguous')),
  provider_id text,
  evidence jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default now(),
  applied_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (inbox_id, effect_key)
);

create index if not exists ambient_effect_receipts_inbox_idx
  on ambient_effect_receipts (inbox_id, state);

alter table ambient_effect_receipts enable row level security;
revoke all on ambient_effect_receipts from anon, authenticated;

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
      and completed_at is null
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

revoke all on function claim_next_provisioning_command(text, integer) from public, anon, authenticated;
grant execute on function claim_next_provisioning_command(text, integer) to service_role;

commit;
