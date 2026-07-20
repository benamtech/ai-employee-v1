begin;

-- Forward-only correction for PL/pgSQL output-column namespace collisions.
create or replace function amtech_activate_verified_employee(
  p_identity_id text,
  p_account_id text,
  p_owner_principal_id text,
  p_employee_name text,
  p_profile_package_key text,
  p_manifest jsonb,
  p_raw_answers jsonb,
  p_transcript_ref text,
  p_worker_context jsonb,
  p_resource_graph jsonb,
  p_facts jsonb,
  p_idempotency_key text,
  p_policy_version text,
  p_correlation_id text
)
returns table (
  activation_id text,
  employee_id text,
  employee_principal_id text,
  assignment_id text,
  provisioning_job_id text,
  command_id text,
  receipt_id text,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_identity onboarding_identities%rowtype;
  v_existing onboarding_identity_activations%rowtype;
  v_org_account organization_accounts%rowtype;
  v_org_id text;
  v_org_account_id text;
  v_activation_id text;
  v_employee_id text;
  v_employee_principal_id text;
  v_assignment_id text;
  v_employment_id text;
  v_assignment_principal_id text;
  v_read_grant_id text;
  v_message_grant_id text;
  v_policy_id text;
  v_payer_id text;
  v_beneficiary_id text;
  v_manifest_id text;
  v_build_id text;
  v_job_id text;
  v_intent_id text;
  v_command_id text;
  v_effect_id text;
  v_receipt_id text;
  v_replay_id text;
  v_lease_token text;
  v_seed text;
  v_payload jsonb;
  v_payload_hash text;
  v_response jsonb;
  v_response_hash text;
  v_profile_package profile_packages%rowtype;
begin
  if p_manifest is null or jsonb_typeof(p_manifest) <> 'object'
     or p_raw_answers is null or jsonb_typeof(p_raw_answers) <> 'object'
     or p_worker_context is null or jsonb_typeof(p_worker_context) <> 'object'
     or p_resource_graph is null or jsonb_typeof(p_resource_graph) <> 'array'
     or p_facts is null or jsonb_typeof(p_facts) <> 'array' then
    raise exception 'invalid_activation_payload';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_account_id || E'\x1f' || p_idempotency_key, 0));

  select * into v_existing
  from onboarding_identity_activations a
  where a.account_id = p_account_id and a.idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    return query select v_existing.id, v_existing.employee_id, v_existing.employee_principal_id,
      v_existing.assignment_id, v_existing.provisioning_job_id, v_existing.command_id,
      v_existing.receipt_id, true;
    return;
  end if;

  select * into v_identity
  from onboarding_identities oi
  where oi.id = p_identity_id
    and oi.account_id = p_account_id
    and oi.owner_principal_id = p_owner_principal_id
  for update;
  if v_identity.id is null or v_identity.status <> 'verified'
     or not amtech_verify_onboarding_identity_snapshot(v_identity.id) then
    raise exception 'identity_unverified';
  end if;
  if v_identity.employee_principal_id is not null then
    raise exception 'identity_already_activated';
  end if;
  if not exists (
    select 1 from human_principals hp
    join account_memberships am on am.user_id = hp.user_id
    where hp.id = p_owner_principal_id and hp.status = 'active'
      and am.account_id = p_account_id and am.role in ('owner','admin')
  ) then
    raise exception 'owner_principal_account_mismatch';
  end if;

  select * into v_profile_package
  from profile_packages pp
  where pp.package_key = p_profile_package_key and pp.status = 'active';
  if v_profile_package.id is null then raise exception 'profile_package_not_active'; end if;

  select * into v_org_account
  from organization_accounts oa
  where oa.account_id = p_account_id and oa.status = 'active'
  order by oa.created_at asc limit 1
  for update;
  if v_org_account.id is null then
    v_org_id := amtech_stable_activation_id('org', 'onboarding-org:' || p_account_id);
    v_org_account_id := amtech_stable_activation_id('rel', 'onboarding-org-account:' || p_account_id);
    insert into organizations(id, display_name, status)
    select v_org_id, a.display_name, 'active' from accounts a where a.id = p_account_id
    on conflict (id) do nothing;
    insert into organization_accounts(id, organization_id, account_id, status, provenance)
    values (v_org_account_id, v_org_id, p_account_id, 'active', jsonb_build_object(
      'source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now()
    )) on conflict (organization_id, account_id) do nothing;
  else
    v_org_id := v_org_account.organization_id;
  end if;

  v_seed := p_account_id || E'\x1f' || p_idempotency_key;
  v_activation_id := amtech_stable_activation_id('oact', 'activation:' || v_seed);
  v_employee_id := amtech_stable_activation_id('emp', 'employee:' || v_seed);
  v_employee_principal_id := amtech_stable_activation_id('epr', 'employee-principal:' || v_seed);
  v_assignment_id := amtech_stable_activation_id('asn', 'assignment:' || v_seed);
  v_employment_id := amtech_stable_activation_id('rel', 'employment:' || v_seed);
  v_assignment_principal_id := amtech_stable_activation_id('aspr', 'owner-assignment:' || v_seed);
  v_read_grant_id := amtech_stable_activation_id('grant', 'employee-read:' || v_seed);
  v_message_grant_id := amtech_stable_activation_id('grant', 'employee-message:' || v_seed);
  v_policy_id := amtech_stable_activation_id('apol', 'approval-policy:' || v_seed);
  v_payer_id := amtech_stable_activation_id('crel', 'payer:' || v_seed);
  v_beneficiary_id := amtech_stable_activation_id('crel', 'beneficiary:' || v_seed);
  v_manifest_id := amtech_stable_activation_id('man', 'manifest:' || v_seed);
  v_build_id := amtech_stable_activation_id('build', 'profile-build:' || v_seed);
  v_job_id := amtech_stable_activation_id('pjob', 'provisioning-job:' || v_seed);
  v_intent_id := amtech_stable_activation_id('intent', 'intent:' || v_seed);
  v_command_id := amtech_stable_activation_id('cmd', 'command:' || v_seed);
  v_effect_id := amtech_stable_activation_id('eff', 'effect:' || v_seed);
  v_receipt_id := amtech_stable_activation_id('erec', 'receipt:' || v_seed);
  v_replay_id := amtech_stable_activation_id('replay', 'replay:' || v_seed);
  v_lease_token := amtech_stable_activation_id('lease', 'lease:' || v_seed);

  insert into employees(id, account_id, name, status, profile_package_key, web_route)
  values (v_employee_id, p_account_id, p_employee_name, 'provisioning', p_profile_package_key, '/agent/' || v_employee_id);
  insert into employee_principals(id, employee_id, status)
  values (v_employee_principal_id, v_employee_id, 'active');
  insert into employee_assignments(
    id, organization_id, account_id, employee_principal_id, status, starts_at,
    policy_version, provenance
  ) values (
    v_assignment_id, v_org_id, p_account_id, v_employee_principal_id, 'active', now(),
    p_policy_version, jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())
  );
  insert into labor_relationships(
    id, relationship_type, subject_principal_id, subject_principal_class,
    organization_id, account_id, assignment_id, role, status, starts_at,
    policy_version, provenance
  ) values (
    v_employment_id, 'employment', v_employee_principal_id, 'employee',
    v_org_id, p_account_id, v_assignment_id, 'employee', 'active', now(),
    p_policy_version, jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())
  );
  insert into assignment_principals(
    id, assignment_id, principal_id, principal_class, role, status, starts_at,
    policy_version, provenance
  ) values (
    v_assignment_principal_id, v_assignment_id, p_owner_principal_id, 'human', 'owner',
    'active', now(), p_policy_version,
    jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())
  );
  insert into assignment_resource_grants(
    id, assignment_id, principal_id, resource_class, resource_id, actions,
    status, starts_at, policy_version, provenance
  ) values
    (v_read_grant_id, v_assignment_id, p_owner_principal_id, 'employee', v_employee_id,
     array['read'], 'active', now(), p_policy_version,
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())),
    (v_message_grant_id, v_assignment_id, p_owner_principal_id, 'employee', v_employee_id,
     array['message:create'], 'active', now(), p_policy_version,
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now()));
  insert into assignment_authority_policies(
    id, assignment_id, policy_version, action, required_roles, risk_class,
    step_up_required, status
  ) values (
    v_policy_id, v_assignment_id, p_policy_version, 'approve_consequential_action',
    array['owner','manager','approver'], 'high', true, 'active'
  );
  insert into commercial_relationships(
    id, assignment_id, relationship_type, organization_id, account_id, status,
    starts_at, provenance
  ) values
    (v_payer_id, v_assignment_id, 'payer', v_org_id, p_account_id, 'active', now(),
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())),
    (v_beneficiary_id, v_assignment_id, 'beneficiary', v_org_id, p_account_id, 'active', now(),
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now()));

  v_payload := jsonb_build_object(
    'schema_version','onboarding-create-employee-v1',
    'onboarding_identity_id',p_identity_id,
    'employee_id',v_employee_id,
    'assignment_id',v_assignment_id,
    'provisioning_job_id',v_job_id,
    'manifest_hash','sha256:' || encode(digest(p_manifest::text,'sha256'),'hex')
  );
  v_payload_hash := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');

  perform register_durable_command(
    v_intent_id, v_assignment_id, p_owner_principal_id, 'human',
    'onboarding_identity:' || p_identity_id,
    'onboarding:create_employee:' || p_idempotency_key,
    v_command_id, 'onboarding.create_employee', '1.0.0', p_policy_version,
    v_payload, v_payload_hash, p_correlation_id, null
  );
  if not exists (select 1 from claim_durable_command(v_command_id, v_lease_token, 120)) then
    raise exception 'onboarding_activation_command_not_claimable';
  end if;
  perform reserve_effect_attempt(
    v_effect_id, v_command_id, 'onboarding-activation:' || p_idempotency_key,
    'manager-control-plane', 'persist_employee_activation', 'native_idempotency',
    v_payload_hash, p_idempotency_key, v_lease_token, 120
  );

  insert into employee_manifests(
    id, employee_id, manifest, raw_answers, transcript_ref, profile_package_key
  ) values (
    v_manifest_id, v_employee_id, p_manifest, p_raw_answers, p_transcript_ref, p_profile_package_key
  );

  insert into business_brain_facts(
    id, employee_id, account_id, fact_key, fact_value, category, source, source_ref, confidence
  )
  select
    amtech_stable_activation_id('fact', v_employee_id || ':' || (fact ->> 'key')),
    v_employee_id,
    p_account_id,
    fact ->> 'key',
    fact ->> 'value',
    fact ->> 'category',
    'onboarding',
    fact ->> 'source_ref',
    coalesce(fact ->> 'confidence', 'medium')
  from jsonb_array_elements(p_facts) fact
  where coalesce(fact ->> 'key','') <> '' and coalesce(fact ->> 'value','') <> '';

  insert into employee_profile_builds(
    id, employee_id, account_id, profile_package_id, package_key, package_version,
    params, install_status
  ) values (
    v_build_id, v_employee_id, p_account_id, v_profile_package.id, p_profile_package_key,
    v_profile_package.version, p_manifest, 'queued'
  );

  insert into provisioning_jobs(
    id, account_id, employee_id, idempotency_key, command_type, operation_key,
    state, desired_state, desired_resource_graph, worker_context, logs
  ) values (
    v_job_id, p_account_id, v_employee_id, p_idempotency_key, 'ensure_runtime',
    'ensure_runtime:' || p_account_id || ':' || v_employee_id,
    'requested', 'ready', p_resource_graph,
    p_worker_context || jsonb_build_object(
      'onboarding_identity_id', p_identity_id,
      'onboarding_command_id', v_command_id,
      'assignment_id', v_assignment_id,
      'manifest_id', v_manifest_id,
      'build_id', v_build_id
    ),
    jsonb_build_array(jsonb_build_object(
      'at',now(),
      'message','Verified onboarding activation committed through C3; Hermes reconciler owns runtime effects.',
      'command_id',v_command_id,
      'identity_id',p_identity_id
    ))
  );

  insert into provisioning_resource_states(
    id, provisioning_job_id, account_id, employee_id, resource_key, resource_type,
    desired_state, observed_state, idempotency_key
  )
  select
    amtech_stable_activation_id('prs', v_job_id || ':' || (resource ->> 'resource_key')),
    v_job_id, p_account_id, v_employee_id,
    resource ->> 'resource_key', resource ->> 'resource_type', resource ->> 'desired_state',
    case when resource ->> 'resource_key' in ('account','employee_record') then 'present' else 'unknown' end,
    resource ->> 'idempotency_key'
  from jsonb_array_elements(p_resource_graph) resource;

  perform record_effect_receipt(
    v_receipt_id, v_effect_id, 'accepted', 'postgres-activation:' || v_job_id,
    null, null, v_payload_hash, v_lease_token,
    jsonb_build_object(
      'onboarding_identity_id',p_identity_id,
      'employee_id',v_employee_id,
      'assignment_id',v_assignment_id,
      'provisioning_job_id',v_job_id
    )
  );

  v_response := jsonb_build_object('result', jsonb_build_object(
    'onboarding_identity_id',p_identity_id,
    'employee_id',v_employee_id,
    'employee_principal_id',v_employee_principal_id,
    'assignment_id',v_assignment_id,
    'provisioning_job_id',v_job_id,
    'receipt_id',v_receipt_id
  ));
  v_response_hash := 'sha256:' || encode(digest(v_response::text, 'sha256'), 'hex');
  perform complete_durable_command(
    v_command_id, v_lease_token, v_receipt_id, v_replay_id, v_response_hash, v_response
  );

  update onboarding_identities as oi
     set employee_principal_id = v_employee_principal_id, updated_at = now()
   where oi.id = p_identity_id and oi.employee_principal_id is null;
  if not found then raise exception 'identity_activation_binding_conflict'; end if;

  insert into onboarding_identity_activations(
    id, onboarding_identity_id, account_id, owner_principal_id, employee_id,
    employee_principal_id, assignment_id, provisioning_job_id, command_id,
    receipt_id, idempotency_key, activation_snapshot_hash
  ) values (
    v_activation_id, p_identity_id, p_account_id, p_owner_principal_id, v_employee_id,
    v_employee_principal_id, v_assignment_id, v_job_id, v_command_id,
    v_receipt_id, p_idempotency_key,
    'sha256:' || encode(digest(v_payload::text || E'\x1f' || v_response::text, 'sha256'), 'hex')
  );

  return query select v_activation_id, v_employee_id, v_employee_principal_id,
    v_assignment_id, v_job_id, v_command_id, v_receipt_id, false;
end
$$;

revoke all on function amtech_activate_verified_employee(
  text,text,text,text,text,jsonb,jsonb,text,jsonb,jsonb,jsonb,text,text,text
) from public, anon, authenticated;

grant execute on function amtech_activate_verified_employee(
  text,text,text,text,text,jsonb,jsonb,text,jsonb,jsonb,jsonb,text,text,text
) to service_role;

commit;
