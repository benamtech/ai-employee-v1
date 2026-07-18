-- ============================================================================
-- AMTECH Phase 2 — S8 platform command session/lease binding
--
-- Forward-only. A platform actor id is not sufficient command authority. Every
-- platform C3 intent/command must carry and prove the same current audience-bound
-- session, recent unexpired step-up, exact support lease, assignment, account,
-- employee, and allowed admin action that the Manager route evaluated.
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
  v_lease_id text;
  v_account_id text;
  v_employee_id text;
  v_payload_assignment_id text;
  v_action text;
  v_expected_action text;
begin
  if new.actor_class <> 'platform' then
    return new;
  end if;

  if new.policy_version <> 'platform-admin-v1'
     or new.command_type <> 'platform.admin.support_action' then
    raise exception 'platform_command_contract_invalid';
  end if;

  v_session_id := nullif(new.payload ->> 'platform_session_id', '');
  v_lease_id := nullif(new.payload ->> 'support_lease_id', '');
  v_account_id := nullif(new.payload ->> 'account_id', '');
  v_employee_id := nullif(new.payload ->> 'employee_id', '');
  v_payload_assignment_id := nullif(new.payload ->> 'assignment_id', '');
  v_action := nullif(new.payload ->> 'action', '');
  v_expected_action := case when v_action is null then null else 'admin:' || v_action end;

  if v_session_id is null
     or v_lease_id is null
     or v_account_id is null
     or v_employee_id is null
     or v_payload_assignment_id is null
     or v_action is null
     or new.authenticated_by <> 'platform_admin_session:' || v_session_id
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

  if not exists (
    select 1
      from platform_support_leases psl
     where psl.id = v_lease_id
       and psl.principal_id = new.actor_principal_id
       and psl.issued_by_session_id = v_session_id
       and psl.account_id = v_account_id
       and psl.employee_id = v_employee_id
       and psl.assignment_id = new.assignment_id
       and psl.revoked_at is null
       and psl.starts_at <= now()
       and psl.expires_at > now()
       and length(btrim(psl.reason)) >= 8
       and v_expected_action = any(psl.allowed_actions)
  ) then
    raise exception 'platform_command_support_lease_not_current';
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

-- Validate both canonical registration rows. The intent trigger blocks the RPC
-- before a durable command can be inserted; the command trigger also rejects any
-- direct service-role table insertion that attempts to bypass registration.
drop trigger if exists command_intents_platform_context on command_intents;
create trigger command_intents_platform_context
before insert or update on command_intents
for each row execute function amtech_assert_platform_command_context();

drop trigger if exists durable_commands_platform_context on durable_commands;
create trigger durable_commands_platform_context
before insert or update on durable_commands
for each row execute function amtech_assert_platform_command_context();

commit;
