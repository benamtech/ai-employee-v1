-- ============================================================================
-- AMTECH Phase 2 — S8 C3 platform-actor enforcement
--
-- Forward-only hardening. Platform commands may no longer rely on actor_class
-- alone; the actor must be a current durable platform principal with a current
-- role. Human and employee semantics remain unchanged. Service actors remain
-- reserved for approved internal workers under their existing contracts.
-- ============================================================================

begin;

create or replace function amtech_assert_command_actor(
  p_assignment_id text,
  p_actor_principal_id text,
  p_actor_class text,
  p_policy_version text
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not amtech_assignment_launch_allowed(p_assignment_id) then
    raise exception 'assignment_not_active: %', p_assignment_id;
  end if;

  if p_actor_class = 'human' then
    if not exists (
      select 1
        from assignment_principals ap
       where ap.assignment_id = p_assignment_id
         and ap.principal_id = p_actor_principal_id
         and ap.principal_class = 'human'
         and ap.policy_version = p_policy_version
         and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
    ) then
      raise exception 'unauthorized_command_actor: %', p_actor_principal_id;
    end if;
  elsif p_actor_class = 'employee' then
    if not exists (
      select 1
        from employee_assignments ea
       where ea.id = p_assignment_id
         and ea.employee_principal_id = p_actor_principal_id
         and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
    ) then
      raise exception 'unauthorized_command_actor: %', p_actor_principal_id;
    end if;
  elsif p_actor_class = 'platform' then
    if p_policy_version <> 'platform-admin-v1' then
      raise exception 'platform_command_policy_version_invalid: %', p_policy_version;
    end if;
    if not exists (
      select 1
        from platform_principals pp
       where pp.id = p_actor_principal_id
         and pp.status = 'active'
         and pp.starts_at <= now()
         and (pp.ends_at is null or pp.ends_at > now())
         and exists (
           select 1
             from platform_principal_roles ppr
            where ppr.principal_id = pp.id
              and ppr.status = 'active'
              and ppr.starts_at <= now()
              and (ppr.ends_at is null or ppr.ends_at > now())
         )
    ) then
      raise exception 'unauthorized_platform_command_actor: %', p_actor_principal_id;
    end if;
  elsif p_actor_class <> 'service' then
    raise exception 'unsupported_actor_class: %', p_actor_class;
  end if;
end
$$;

revoke all on function amtech_assert_command_actor(text,text,text,text)
  from public, anon, authenticated;
grant execute on function amtech_assert_command_actor(text,text,text,text)
  to service_role;

commit;
