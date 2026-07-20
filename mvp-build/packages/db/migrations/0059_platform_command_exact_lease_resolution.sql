-- ============================================================================
-- AMTECH Phase 2 — S8 exact platform command lease resolution
--
-- Forward-only correction to 0058. The runtime already signs the command with a
-- durable session id and carries account, employee, assignment, action, and the
-- immutable lease reason. Resolve exactly one current lease from those durable
-- dimensions; zero or multiple matches block the command.
-- ============================================================================

begin;

create or replace function amtech_assert_platform_command_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id text;
  v_account_id text;
  v_employee_id text;
  v_payload_assignment_id text;
  v_action text;
  v_expected_action text;
  v_reason text;
  v_matching_leases integer;
begin
  if new.actor_class <> 'platform' then
    return new;
  end if;

  if new.policy_version <> 'platform-admin-v1'
     or new.command_type <> 'platform.admin.support_action' then
    raise exception 'platform_command_contract_invalid';
  end if;

  if new.authenticated_by !~ '^platform_admin_session:[A-Za-z0-9_]+$' then
    raise exception 'platform_command_authentication_context_invalid';
  end if;
  v_session_id := substring(new.authenticated_by from '^platform_admin_session:(.+)$');
  v_account_id := nullif(new.payload ->> 'account_id', '');
  v_employee_id := nullif(new.payload ->> 'employee_id', '');
  v_payload_assignment_id := nullif(new.payload ->> 'assignment_id', '');
  v_action := nullif(new.payload ->> 'action', '');
  v_expected_action := case when v_action is null then null else 'admin:' || v_action end;
  v_reason := nullif(btrim(new.payload ->> 'reason'), '');

  if v_session_id is null
     or v_account_id is null
     or v_employee_id is null
     or v_payload_assignment_id is null
     or v_action is null
     or v_reason is null
     or length(v_reason) < 8
     or new.assignment_id <> v_payload_assignment_id then
    raise exception 'platform_command_context_missing_or_mismatched';
  end if;

  if not exists (
    select 1
      from platform_admin_sessions pas
      join platform_principals pp on pp.id = pas.principal_id
     where pas.id = v_session_id
       and pas.principal_id = new.actor_principal_id
       and pas.audience = 'manager-admin'
       and pas.session_version = pp.session_version
       and pas.revoked_at is null
       and pas.expires_at > now()
       and pas.step_up_at is not null
       and pas.step_up_at <= now()
       and pas.step_up_at >= now() - interval '15 minutes'
       and pas.step_up_expires_at is not null
       and pas.step_up_expires_at > now()
       and pp.status = 'active'
       and pp.starts_at <= now()
       and (pp.ends_at is null or pp.ends_at > now())
  ) then
    raise exception 'platform_command_session_not_current';
  end if;

  select count(*)::integer
    into v_matching_leases
    from platform_support_leases psl
   where psl.principal_id = new.actor_principal_id
     and psl.issued_by_session_id = v_session_id
     and psl.account_id = v_account_id
     and psl.employee_id = v_employee_id
     and psl.assignment_id = new.assignment_id
     and psl.revoked_at is null
     and psl.starts_at <= now()
     and psl.expires_at > now()
     and btrim(psl.reason) = v_reason
     and v_expected_action = any(psl.allowed_actions);

  if v_matching_leases = 0 then
    raise exception 'platform_command_support_lease_not_current';
  elsif v_matching_leases > 1 then
    raise exception 'platform_command_support_lease_ambiguous';
  end if;

  if not exists (
    select 1
      from employee_assignments ea
      join employee_principals ep on ep.id = ea.employee_principal_id
     where ea.id = new.assignment_id
       and ea.account_id = v_account_id
       and ep.employee_id = v_employee_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
  ) then
    raise exception 'platform_command_assignment_scope_mismatch';
  end if;

  return new;
end
$$;

revoke all on function amtech_assert_platform_command_context()
  from public, anon, authenticated;

commit;
