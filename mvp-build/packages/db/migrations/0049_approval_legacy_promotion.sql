-- S7 compatibility promotion for internally staged QuickBooks previews.
-- The preview tools historically inserted the approval row directly, then bound
-- its id to quickbooks_pending_writes. This function upgrades only an unresolved
-- legacy row in place, preserving that one-to-one durable reference.

begin;

create or replace function promote_legacy_approval_authority_request(
  p_approval_id text,
  p_account_id text,
  p_employee_id text,
  p_assignment_id text,
  p_requester_principal_id text,
  p_requester_principal_class text,
  p_action_key text,
  p_resource_class text,
  p_resource_id text,
  p_summary text,
  p_risk_level text,
  p_channel text,
  p_expires_at timestamptz,
  p_command_intent_id text,
  p_command_id text,
  p_effect_key text
)
returns setof approvals
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_approval approvals%rowtype;
  v_assignment employee_assignments%rowtype;
  v_employee_principal employee_principals%rowtype;
  v_policy assignment_authority_policies%rowtype;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_required_action text;
begin
  select * into v_approval from approvals where id = p_approval_id for update;
  if v_approval.id is null then raise exception 'legacy_approval_not_found'; end if;
  if v_approval.status <> 'legacy' or v_approval.resolution is not null then
    raise exception 'legacy_approval_not_promotable';
  end if;
  if v_approval.account_id <> p_account_id
     or v_approval.employee_id <> p_employee_id
     or v_approval.action_key <> p_action_key then
    raise exception 'legacy_approval_scope_mismatch';
  end if;

  select * into v_assignment from employee_assignments where id = p_assignment_id;
  if v_assignment.id is null
     or v_assignment.account_id <> p_account_id
     or not amtech_relationship_current(v_assignment.status, v_assignment.starts_at, v_assignment.ends_at) then
    raise exception 'approval_assignment_invalid';
  end if;
  select * into v_employee_principal from employee_principals where id = v_assignment.employee_principal_id;
  if v_employee_principal.id is null or v_employee_principal.employee_id <> p_employee_id then
    raise exception 'approval_employee_assignment_mismatch';
  end if;
  if p_requester_principal_class = 'employee' and p_requester_principal_id <> v_employee_principal.id then
    raise exception 'approval_requester_mismatch';
  end if;

  select * into v_policy
    from assignment_authority_policies
   where assignment_id = p_assignment_id
     and policy_version = v_assignment.policy_version
     and action = p_action_key
     and status = 'active'
   limit 1;
  if v_policy.id is null then raise exception 'approval_authority_policy_missing'; end if;

  v_snapshot := amtech_approval_snapshot(p_assignment_id, p_action_key, p_resource_class, p_resource_id);
  v_snapshot_hash := amtech_approval_snapshot_hash(v_snapshot);
  v_required_action := 'approval:resolve:' || p_action_key;

  update approvals
     set assignment_id = p_assignment_id,
         requester_principal_id = p_requester_principal_id,
         requester_principal_class = p_requester_principal_class,
         summary = p_summary,
         risk_level = p_risk_level,
         refs = jsonb_build_object('resource_class', p_resource_class, 'resource_id', p_resource_id),
         channel = p_channel,
         expires_at = p_expires_at,
         resource_class = p_resource_class,
         resource_id = p_resource_id,
         snapshot = v_snapshot,
         snapshot_hash = v_snapshot_hash,
         policy_version = v_assignment.policy_version,
         required_resolver_roles = v_policy.required_roles,
         required_resolver_action = v_required_action,
         status = 'pending',
         command_intent_id = p_command_intent_id,
         command_id = p_command_id,
         effect_key = p_effect_key,
         execution_state = 'not_started',
         approval_version = approval_version + 1,
         updated_at = now()
   where id = p_approval_id
  returning * into v_approval;

  insert into assignment_resource_grants(
    id, assignment_id, principal_id, resource_class, resource_id,
    actions, status, starts_at, policy_version, provenance
  ) values (
    'grant_' || substr(md5(p_approval_id || ':' || v_required_action), 1, 26),
    p_assignment_id, null, 'approval', p_approval_id,
    array[v_required_action], 'active', now(), v_assignment.policy_version,
    jsonb_build_object(
      'source', 'approval_legacy_promotion',
      'approval_id', p_approval_id,
      'action_key', p_action_key,
      'snapshot_hash', v_snapshot_hash
    )
  ) on conflict (id) do nothing;

  return next v_approval;
end
$$;

revoke all on function promote_legacy_approval_authority_request(text,text,text,text,text,text,text,text,text,text,text,text,timestamptz,text,text,text) from public, anon, authenticated;
grant execute on function promote_legacy_approval_authority_request(text,text,text,text,text,text,text,text,text,text,text,text,timestamptz,text,text,text) to service_role;

commit;
