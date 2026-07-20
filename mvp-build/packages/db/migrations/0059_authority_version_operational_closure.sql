-- ============================================================================
-- AMTECH Phase 2 — S9 authority-version operational closure
--
-- Seeds authority rows for identities created after 0058 and preserves precise
-- approval denial semantics for role/grant/policy changes. Full assignment
-- revocation still revokes pending approvals synchronously.
-- ============================================================================

begin;

create or replace function amtech_seed_human_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into authority_versions(
    scope_type, scope_id, current_version, revoked_at, reason, updated_at
  ) values (
    'human_principal',
    new.id,
    greatest(1, coalesce(new.session_version, 1))::bigint,
    case
      when new.status not in ('active','current') or new.credentials_revoked_at is not null
        then coalesce(new.credentials_revoked_at, now())
      else null
    end,
    'insert:human_principal',
    now()
  ) on conflict (scope_type, scope_id) do nothing;
  return new;
end
$$;

create or replace function amtech_seed_employee_assignment_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into authority_versions(
    scope_type, scope_id, current_version, revoked_at, reason, updated_at
  ) values (
    'employee_assignment',
    new.id,
    1,
    case when amtech_relationship_current(new.status, new.starts_at, new.ends_at) then null else now() end,
    'insert:employee_assignment',
    now()
  ) on conflict (scope_type, scope_id) do nothing;
  return new;
end
$$;

drop trigger if exists human_principal_authority_seed on human_principals;
create trigger human_principal_authority_seed
  after insert on human_principals
  for each row execute function amtech_seed_human_authority();

drop trigger if exists employee_assignment_authority_seed on employee_assignments;
create trigger employee_assignment_authority_seed
  after insert on employee_assignments
  for each row execute function amtech_seed_employee_assignment_authority();

create or replace function amtech_revoke_stale_assignment_consumers(
  p_assignment_id text,
  p_current_version bigint,
  p_reason text,
  p_assignment_revoked boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update employee_mcp_credentials
     set status = 'revoked',
         revoked_at = coalesce(revoked_at, now()),
         updated_at = now()
   where assignment_id = p_assignment_id
     and status = 'active'
     and revoked_at is null
     and coalesce(assignment_authority_version, 0) < p_current_version;

  update preview_links
     set revoked_at = coalesce(revoked_at, now())
   where assignment_id = p_assignment_id
     and revoked_at is null
     and consumed_at is null
     and coalesce(assignment_authority_version, 0) < p_current_version;

  if p_assignment_revoked then
    update approvals
       set status = 'revoked',
           revoked_at = coalesce(revoked_at, now()),
           revocation_reason = p_reason,
           updated_at = now()
     where assignment_id = p_assignment_id
       and status = 'pending'
       and coalesce(assignment_authority_version, 0) < p_current_version;

    update connector_bindings
       set status = 'revoked',
           revoked_at = coalesce(revoked_at, now()),
           updated_at = now()
     where assignment_id = p_assignment_id
       and status in ('active','current')
       and revoked_at is null;
  end if;
end
$$;

-- Explicit claim/ack protocol for operations agents. Enforcement is synchronous
-- in 0058; this queue exists for cache invalidation, runtime teardown, alerts, and
-- evidence delivery without making authorization depend on an in-process bus.
alter table authority_revocation_outbox
  add column if not exists lease_token text,
  add column if not exists lease_expires_at timestamptz;

create index if not exists authority_revocation_outbox_claim_idx
  on authority_revocation_outbox(created_at, id)
  where dispatched_at is null;

create or replace function claim_authority_revocations(
  p_worker_id text,
  p_limit integer default 100,
  p_lease_seconds integer default 60
)
returns setof authority_revocation_outbox
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if coalesce(p_worker_id, '') = '' then raise exception 'authority_revocation_worker_required'; end if;
  if p_limit < 1 or p_limit > 1000 then raise exception 'authority_revocation_limit_invalid'; end if;

  return query
  with candidates as (
    select id
      from authority_revocation_outbox
     where dispatched_at is null
       and (lease_expires_at is null or lease_expires_at <= now())
     order by created_at, id
     for update skip locked
     limit p_limit
  )
  update authority_revocation_outbox outbox
     set lease_token = p_worker_id,
         lease_expires_at = now() + make_interval(secs => greatest(10, least(p_lease_seconds, 3600))),
         attempts = attempts + 1,
         last_error = null
    from candidates
   where outbox.id = candidates.id
  returning outbox.*;
end
$$;

create or replace function complete_authority_revocation(
  p_id bigint,
  p_worker_id text,
  p_error text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update authority_revocation_outbox
     set dispatched_at = case when p_error is null then now() else null end,
         lease_token = null,
         lease_expires_at = null,
         last_error = p_error
   where id = p_id
     and lease_token = p_worker_id
     and lease_expires_at > now();
  if not found then raise exception 'authority_revocation_lease_lost'; end if;
end
$$;

revoke all on function claim_authority_revocations(text,integer,integer) from public, anon, authenticated;
revoke all on function complete_authority_revocation(bigint,text,text) from public, anon, authenticated;
grant execute on function claim_authority_revocations(text,integer,integer) to service_role;
grant execute on function complete_authority_revocation(bigint,text,text) to service_role;

commit;
