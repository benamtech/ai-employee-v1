-- ============================================================================
-- AMTECH Phase 2 — S8 production platform admin/support authority activation
--
-- Forward-only. Builds on 0055 groundwork. Platform identity is a durable,
-- audience-bound bearer session; customer access requires an exact expiring
-- support lease; consequential writes remain assignment-scoped and execute
-- through the canonical C3 command/effect kernel.
-- ============================================================================

begin;

alter table platform_admin_sessions
  add column if not exists authenticated_by text not null default 'service_role_operator',
  add column if not exists step_up_method text,
  add column if not exists step_up_expires_at timestamptz;

alter table platform_support_leases
  add column if not exists issued_by_session_id text references platform_admin_sessions(id) on delete restrict,
  add column if not exists policy_version text not null default 'platform-admin-v1';

alter table admin_action_events
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict,
  add column if not exists platform_principal_id text references platform_principals(id) on delete restrict,
  add column if not exists platform_session_id text references platform_admin_sessions(id) on delete restrict,
  add column if not exists support_lease_id text references platform_support_leases(id) on delete restrict,
  add column if not exists command_id text references durable_commands(id) on delete restrict,
  add column if not exists effect_receipt_id text references effect_receipts(id) on delete restrict;

create index if not exists admin_action_events_s8_scope_idx
  on admin_action_events(platform_principal_id, account_id, assignment_id, created_at desc);

create or replace function amtech_platform_role_rank(p_role text)
returns integer
language sql
immutable
security invoker
set search_path = public
as $$
  select case p_role
    when 'support_readonly' then 1
    when 'security_reviewer' then 2
    when 'billing_operator' then 3
    when 'platform_operator' then 4
    when 'platform_owner' then 5
    else 0
  end
$$;

create or replace function mint_platform_admin_session(
  p_session_id text,
  p_user_id text,
  p_audience text,
  p_token_hash text,
  p_ttl_seconds integer,
  p_authenticated_by text
)
returns platform_admin_sessions
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_principal platform_principals%rowtype;
  v_session platform_admin_sessions%rowtype;
  v_ttl integer := greatest(300, least(coalesce(p_ttl_seconds, 3600), 43200));
begin
  if coalesce(p_session_id, '') = ''
     or coalesce(p_user_id, '') = ''
     or coalesce(p_audience, '') = ''
     or coalesce(p_authenticated_by, '') = ''
     or coalesce(p_token_hash, '') !~ '^[0-9a-f]{64}$' then
    raise exception 'platform_session_identity_invalid';
  end if;

  select pp.* into v_principal
    from platform_principals pp
   where pp.user_id = p_user_id
     and pp.status = 'active'
     and pp.starts_at <= now()
     and (pp.ends_at is null or pp.ends_at > now())
   for update;
  if v_principal.id is null then
    raise exception 'platform_principal_not_current';
  end if;
  if not exists (
    select 1 from platform_principal_roles ppr
     where ppr.principal_id = v_principal.id
       and ppr.status = 'active'
       and ppr.starts_at <= now()
       and (ppr.ends_at is null or ppr.ends_at > now())
  ) then
    raise exception 'platform_role_required';
  end if;

  insert into platform_admin_sessions(
    id, principal_id, audience, session_version, token_hash,
    authenticated_at, expires_at, authenticated_by
  ) values (
    p_session_id, v_principal.id, p_audience, v_principal.session_version,
    p_token_hash, now(), now() + make_interval(secs => v_ttl), p_authenticated_by
  ) returning * into v_session;

  return v_session;
end
$$;

create or replace function step_up_platform_admin_session(
  p_token_hash text,
  p_method text,
  p_ttl_seconds integer default 900
)
returns platform_admin_sessions
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_session platform_admin_sessions%rowtype;
  v_ttl integer := greatest(60, least(coalesce(p_ttl_seconds, 900), 1800));
begin
  if coalesce(p_method, '') = '' then raise exception 'platform_step_up_method_required'; end if;
  update platform_admin_sessions pas
     set step_up_at = now(),
         step_up_expires_at = now() + make_interval(secs => v_ttl),
         step_up_method = p_method,
         last_seen_at = now()
   where pas.token_hash = p_token_hash
     and pas.revoked_at is null
     and pas.expires_at > now()
     and exists (
       select 1 from platform_principals pp
        where pp.id = pas.principal_id
          and pp.status = 'active'
          and pp.session_version = pas.session_version
          and pp.starts_at <= now()
          and (pp.ends_at is null or pp.ends_at > now())
     )
  returning * into v_session;
  if v_session.id is null then raise exception 'platform_session_not_current'; end if;
  return v_session;
end
$$;

create or replace function issue_platform_support_lease(
  p_lease_id text,
  p_session_token_hash text,
  p_account_id text,
  p_employee_id text,
  p_assignment_id text,
  p_allowed_actions text[],
  p_reason text,
  p_ttl_seconds integer default 1800
)
returns platform_support_leases
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_session platform_admin_sessions%rowtype;
  v_principal platform_principals%rowtype;
  v_role text;
  v_lease platform_support_leases%rowtype;
  v_ttl integer := greatest(60, least(coalesce(p_ttl_seconds, 1800), 3600));
begin
  if coalesce(p_lease_id, '') = ''
     or coalesce(p_account_id, '') = ''
     or cardinality(p_allowed_actions) is null
     or cardinality(p_allowed_actions) = 0
     or length(btrim(coalesce(p_reason, ''))) < 8 then
    raise exception 'support_lease_input_invalid';
  end if;
  if (p_employee_id is null) <> (p_assignment_id is null) then
    raise exception 'support_lease_employee_assignment_pair_required';
  end if;

  select pas.* into v_session
    from platform_admin_sessions pas
   where pas.token_hash = p_session_token_hash
     and pas.revoked_at is null
     and pas.expires_at > now()
     and pas.step_up_at is not null
     and pas.step_up_expires_at > now()
   for update;
  if v_session.id is null then raise exception 'platform_step_up_required'; end if;

  select pp.* into v_principal
    from platform_principals pp
   where pp.id = v_session.principal_id
     and pp.status = 'active'
     and pp.session_version = v_session.session_version
     and pp.starts_at <= now()
     and (pp.ends_at is null or pp.ends_at > now());
  if v_principal.id is null then raise exception 'platform_principal_not_current'; end if;

  select ppr.role into v_role
    from platform_principal_roles ppr
   where ppr.principal_id = v_principal.id
     and ppr.status = 'active'
     and ppr.starts_at <= now()
     and (ppr.ends_at is null or ppr.ends_at > now())
   order by amtech_platform_role_rank(ppr.role) desc
   limit 1;
  if amtech_platform_role_rank(v_role) < amtech_platform_role_rank('platform_operator') then
    raise exception 'platform_operator_required';
  end if;

  if not exists (select 1 from accounts a where a.id = p_account_id) then
    raise exception 'support_lease_account_not_found';
  end if;
  if p_assignment_id is not null and not exists (
    select 1
      from employee_assignments ea
      join employee_principals ep on ep.id = ea.employee_principal_id
     where ea.id = p_assignment_id
       and ea.account_id = p_account_id
       and ep.employee_id = p_employee_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
  ) then
    raise exception 'support_lease_assignment_scope_mismatch';
  end if;

  insert into platform_support_leases(
    id, principal_id, account_id, employee_id, assignment_id, allowed_actions,
    reason, starts_at, expires_at, issued_by_session_id, policy_version
  ) values (
    p_lease_id, v_principal.id, p_account_id, p_employee_id, p_assignment_id,
    p_allowed_actions, btrim(p_reason), now(), now() + make_interval(secs => v_ttl),
    v_session.id, 'platform-admin-v1'
  ) returning * into v_lease;
  return v_lease;
end
$$;

create or replace function revoke_platform_admin_session(
  p_session_id text,
  p_reason text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update platform_admin_sessions
     set revoked_at = coalesce(revoked_at, now()),
         revocation_reason = coalesce(nullif(btrim(p_reason), ''), 'operator_revoked')
   where id = p_session_id and revoked_at is null;
  return found;
end
$$;

create or replace function revoke_platform_support_lease(
  p_lease_id text,
  p_revoked_by_principal_id text,
  p_reason text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update platform_support_leases
     set revoked_at = coalesce(revoked_at, now()),
         revoked_by_principal_id = p_revoked_by_principal_id,
         revocation_reason = coalesce(nullif(btrim(p_reason), ''), 'operator_revoked')
   where id = p_lease_id and revoked_at is null;
  return found;
end
$$;

-- The live route adapter still performs shared-contract evaluation and appends
-- an allow/deny record. These tables are readable only to the service role.
grant select, insert, update on platform_principals to service_role;
grant select, insert, update on platform_principal_roles to service_role;
grant select, insert, update on platform_admin_sessions to service_role;
grant select, insert, update on platform_support_leases to service_role;
grant select on platform_admin_audit_chain to service_role;
grant select, insert, update on admin_action_events to service_role;

revoke all on function amtech_platform_role_rank(text) from public, anon, authenticated;
revoke all on function mint_platform_admin_session(text,text,text,text,integer,text) from public, anon, authenticated;
revoke all on function step_up_platform_admin_session(text,text,integer) from public, anon, authenticated;
revoke all on function issue_platform_support_lease(text,text,text,text,text,text[],text,integer) from public, anon, authenticated;
revoke all on function revoke_platform_admin_session(text,text) from public, anon, authenticated;
revoke all on function revoke_platform_support_lease(text,text,text) from public, anon, authenticated;
grant execute on function amtech_platform_role_rank(text) to service_role;
grant execute on function mint_platform_admin_session(text,text,text,text,integer,text) to service_role;
grant execute on function step_up_platform_admin_session(text,text,integer) to service_role;
grant execute on function issue_platform_support_lease(text,text,text,text,text,text[],text,integer) to service_role;
grant execute on function revoke_platform_admin_session(text,text) to service_role;
grant execute on function revoke_platform_support_lease(text,text,text) to service_role;

update assignment_scope_registry
   set enabled = true,
       source_ref = 'packages/db/migrations/0056_platform_admin_authority_activation.sql',
       notes = 'S8 live authority: versioned bearer session, recent step-up, exact expiring support lease, C3 writes, append-only audit.',
       updated_at = now()
 where key = 'platform:admin-support-groundwork';

commit;
