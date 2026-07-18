-- S7 forward repair: RETURNS TABLE output variables shadow unqualified column
-- names inside PL/pgSQL. Reinstall the resolver with every durable table column
-- explicitly qualified so concurrent resolution reaches the row lock and policy
-- checks instead of failing at function compilation/runtime.

begin;

create or replace function resolve_approval_authority(
  p_approval_id text,
  p_resolver_principal_id text,
  p_resolution text,
  p_channel text,
  p_current_snapshot_hash text,
  p_authenticated_by text
)
returns table(
  approval_id text,
  assignment_id text,
  resolution text,
  resolver_role text,
  command_intent_id text,
  command_id text,
  effect_key text,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_approval approvals%rowtype;
  v_policy assignment_authority_policies%rowtype;
  v_role text;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_registered record;
begin
  if p_resolution not in ('approved','rejected') then
    raise exception 'approval_resolution_invalid';
  end if;
  if coalesce(p_resolver_principal_id, '') = '' then
    raise exception 'approval_resolver_missing';
  end if;

  select a.*
    into v_approval
    from approvals a
   where a.id = p_approval_id
   for update;

  if v_approval.id is null or v_approval.status = 'legacy' then
    raise exception 'approval_not_promoted';
  end if;
  if v_approval.revoked_at is not null or v_approval.status = 'revoked' then
    raise exception 'approval_revoked';
  end if;
  if v_approval.expires_at <= now() or v_approval.status = 'expired' then
    raise exception 'approval_expired';
  end if;

  if v_approval.status in ('approved','rejected') then
    if v_approval.resolution = p_resolution
       and v_approval.resolved_by_principal_id = p_resolver_principal_id then
      return query select
        v_approval.id,
        v_approval.assignment_id,
        v_approval.resolution,
        v_approval.resolved_by_role,
        v_approval.command_intent_id,
        v_approval.command_id,
        v_approval.effect_key,
        true;
      return;
    end if;
    raise exception 'approval_already_resolved';
  end if;
  if v_approval.status <> 'pending' then
    raise exception 'approval_not_pending';
  end if;
  if v_approval.requester_principal_id = p_resolver_principal_id then
    raise exception 'approval_self_resolution_denied';
  end if;
  if not exists (
    select 1
      from human_principals hp
     where hp.id = p_resolver_principal_id
       and hp.status = 'active'
  ) then
    raise exception 'approval_resolver_not_current_human';
  end if;

  v_snapshot := amtech_approval_snapshot(
    v_approval.assignment_id,
    v_approval.action_key,
    v_approval.resource_class,
    v_approval.resource_id
  );
  v_snapshot_hash := amtech_approval_snapshot_hash(v_snapshot);
  if v_snapshot_hash <> v_approval.snapshot_hash
     or p_current_snapshot_hash <> v_approval.snapshot_hash then
    raise exception 'approval_snapshot_changed';
  end if;

  select aap.*
    into v_policy
    from assignment_authority_policies aap
   where aap.assignment_id = v_approval.assignment_id
     and aap.policy_version = v_approval.policy_version
     and aap.action = v_approval.action_key
     and aap.status = 'active'
   limit 1;
  if v_policy.id is null
     or v_policy.required_roles <> v_approval.required_resolver_roles then
    raise exception 'approval_policy_changed';
  end if;

  select ap.role
    into v_role
    from assignment_principals ap
   where ap.assignment_id = v_approval.assignment_id
     and ap.principal_id = p_resolver_principal_id
     and ap.principal_class = 'human'
     and ap.role = any(v_approval.required_resolver_roles)
     and ap.policy_version = v_approval.policy_version
     and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
   order by array_position(v_approval.required_resolver_roles, ap.role)
   limit 1;
  if v_role is null then
    raise exception 'approval_resolver_role_denied';
  end if;

  if not exists (
    select 1
      from assignment_resource_grants arg
     where arg.assignment_id = v_approval.assignment_id
       and (arg.principal_id is null or arg.principal_id = p_resolver_principal_id)
       and arg.resource_class = 'approval'
       and arg.resource_id = v_approval.id
       and v_approval.required_resolver_action = any(arg.actions)
       and arg.policy_version = v_approval.policy_version
       and amtech_relationship_current(arg.status, arg.starts_at, arg.ends_at)
  ) then
    raise exception 'approval_resolver_grant_denied';
  end if;

  if p_resolution = 'approved' then
    select registered.*
      into v_registered
      from register_durable_command(
        v_approval.command_intent_id,
        v_approval.assignment_id,
        p_resolver_principal_id,
        'human',
        p_authenticated_by,
        'approval:' || v_approval.id,
        v_approval.command_id,
        'approved.' || v_approval.action_key,
        '1.0.0',
        v_approval.policy_version,
        v_snapshot,
        v_snapshot_hash,
        v_approval.id,
        null
      ) registered;
  end if;

  update approvals a
     set status = p_resolution,
         resolution = p_resolution,
         resolved_by_principal_id = p_resolver_principal_id,
         resolved_by_role = v_role,
         resolution_channel = p_channel,
         resolved_at = now(),
         approval_version = a.approval_version + 1,
         execution_state = case when p_resolution = 'approved' then 'not_started' else 'cancelled' end,
         updated_at = now()
   where a.id = v_approval.id
  returning a.* into v_approval;

  return query select
    v_approval.id,
    v_approval.assignment_id,
    v_approval.resolution,
    v_approval.resolved_by_role,
    v_approval.command_intent_id,
    v_approval.command_id,
    v_approval.effect_key,
    false;
end;
$$;

revoke all on function resolve_approval_authority(text,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function resolve_approval_authority(text,text,text,text,text,text)
  to service_role;

commit;
