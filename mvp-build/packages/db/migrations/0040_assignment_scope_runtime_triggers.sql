begin;

create extension if not exists pgcrypto;

-- validation-vector((pass-vector: legacy production insert paths that still carry account_id+employee_id are upgraded into assignment-scoped rows by the database before constraints fire)-(fail-vector: current normal-employee deployment path breaks because callers have not yet been rewritten to submit assignment_id explicitly))

create or replace function ensure_employee_relationship_graph(p_employee_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_id_out text;
begin
  insert into organizations (id, display_name, status)
  select
    'org_' || substr(encode(digest(a.id, 'sha256'), 'hex'), 1, 22),
    a.display_name,
    case when a.status in ('active','suspended','retired') then a.status else 'active' end
  from accounts a
  join employees e on e.account_id = a.id
  where e.id = p_employee_id
  on conflict (id) do update set display_name = excluded.display_name, status = excluded.status, updated_at = now();

  insert into organization_accounts (id, organization_id, account_id, relationship_kind, status, provenance)
  select
    'orgacct_' || substr(encode(digest(a.id, 'sha256'), 'hex'), 1, 22),
    'org_' || substr(encode(digest(a.id, 'sha256'), 'hex'), 1, 22),
    a.id,
    'operating_account',
    'active',
    jsonb_build_object('source','0040_runtime_employee_graph_trigger','legacy_account_id',a.id)
  from accounts a
  join employees e on e.account_id = a.id
  where e.id = p_employee_id
  on conflict (organization_id, account_id, relationship_kind) do update set status = excluded.status;

  insert into employee_employment_relationships (id, organization_id, employee_principal_id, relationship_kind, status, provenance)
  select
    'emrel_' || substr(encode(digest(oa.organization_id || ':' || e.employee_principal_id, 'sha256'), 'hex'), 1, 22),
    oa.organization_id,
    e.employee_principal_id,
    'managed_employee',
    'active',
    jsonb_build_object('source','0040_runtime_employee_graph_trigger','legacy_employee_id',e.id,'legacy_account_id',e.account_id)
  from employees e
  join organization_accounts oa on oa.account_id = e.account_id and oa.status = 'active'
  where e.id = p_employee_id
  on conflict do nothing;

  insert into employee_assignments (id, organization_id, account_id, employee_id, employee_principal_id, display_name, legacy_default, status, provenance)
  select
    'asgn_' || substr(encode(digest(e.id, 'sha256'), 'hex'), 1, 22),
    oa.organization_id,
    e.account_id,
    e.id,
    e.employee_principal_id,
    e.name,
    true,
    case when e.status in ('live','provisioning') then 'active' when e.status = 'retired' then 'expired' else 'suspended' end,
    jsonb_build_object('source','0040_runtime_employee_graph_trigger','legacy_employee_id',e.id,'legacy_account_id',e.account_id)
  from employees e
  join organization_accounts oa on oa.account_id = e.account_id and oa.status = 'active'
  where e.id = p_employee_id
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    account_id = excluded.account_id,
    employee_id = excluded.employee_id,
    employee_principal_id = excluded.employee_principal_id,
    display_name = excluded.display_name,
    legacy_default = true,
    status = excluded.status,
    updated_at = now()
  returning id into assignment_id_out;

  if assignment_id_out is null then
    select id into assignment_id_out from employee_assignments where employee_id = p_employee_id and legacy_default = true;
  end if;

  insert into assignment_principals (id, assignment_id, principal_type, principal_id, role, status, provenance)
  select
    'asgp_' || substr(encode(digest(assignment_id_out || ':' || am.user_id || ':' || am.role, 'sha256'), 'hex'), 1, 22),
    assignment_id_out,
    'user',
    am.user_id,
    case when am.role in ('owner','admin') then 'owner' when am.role in ('manager','approver') then am.role else 'viewer' end,
    'active',
    jsonb_build_object('source','0040_runtime_membership_assignment_trigger','membership_id',am.id,'legacy_role',am.role)
  from employees e
  join account_memberships am on am.account_id = e.account_id
  where e.id = p_employee_id
  on conflict do nothing;

  insert into assignment_principals (id, assignment_id, principal_type, principal_id, role, status, provenance)
  select
    'asgp_' || substr(encode(digest(assignment_id_out || ':' || e.employee_principal_id || ':worker', 'sha256'), 'hex'), 1, 22),
    assignment_id_out,
    'employee',
    e.employee_principal_id,
    'worker',
    'active',
    jsonb_build_object('source','0040_runtime_employee_worker_trigger')
  from employees e
  where e.id = p_employee_id
  on conflict do nothing;

  insert into assignment_resource_grants (id, assignment_id, resource_type, resource_id, grant_type, status, provenance)
  select
    'asgr_' || substr(encode(digest(assignment_id_out || ':employee:' || e.id, 'sha256'), 'hex'), 1, 22),
    assignment_id_out,
    'employee',
    e.id,
    'custody',
    'active',
    jsonb_build_object('source','0040_runtime_employee_custody_trigger')
  from employees e
  where e.id = p_employee_id
  on conflict do nothing;

  insert into assignment_authority_policies (id, assignment_id, policy_version, action_key, risk_class, required_role, requires_step_up, status, provenance)
  select
    'asap_' || substr(encode(digest(assignment_id_out || ':' || v.action_key, 'sha256'), 'hex'), 1, 22),
    assignment_id_out,
    1,
    v.action_key,
    v.risk_class,
    v.required_role,
    v.requires_step_up,
    'active',
    jsonb_build_object('source','0040_runtime_default_authority_policy')
  from (values
    ('send_estimate_email','customer_send','owner',false),
    ('send_invoice','money','owner',true),
    ('stripe_charge','money','owner',true),
    ('quickbooks_write','accounting','owner',true),
    ('gmail_send','customer_send','owner',false)
  ) as v(action_key, risk_class, required_role, requires_step_up)
  on conflict (assignment_id, policy_version, action_key) do nothing;

  insert into assignment_commercial_relationships (id, assignment_id, relationship_type, principal_type, principal_id, status, provenance)
  select
    'ascr_' || substr(encode(digest(assignment_id_out || ':' || v.relationship_type, 'sha256'), 'hex'), 1, 22),
    assignment_id_out,
    v.relationship_type,
    case when v.relationship_type = 'employer' then 'organization' else 'account' end,
    case when v.relationship_type = 'employer' then ea.organization_id else ea.account_id end,
    'active',
    jsonb_build_object('source','0040_runtime_commercial_trigger')
  from employee_assignments ea
  cross join (values ('payer'),('beneficiary'),('custodian'),('employer')) as v(relationship_type)
  where ea.id = assignment_id_out
  on conflict do nothing;

  insert into assignment_memory_partitions (id, assignment_id, employee_principal_id)
  select 'asmp_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, employee_principal_id
  from employee_assignments where id = assignment_id_out
  on conflict (assignment_id) do nothing;

  insert into assignment_connector_partitions (id, assignment_id, employee_principal_id)
  select 'ascp_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, employee_principal_id
  from employee_assignments where id = assignment_id_out
  on conflict (assignment_id) do nothing;

  insert into assignment_billing_partitions (id, assignment_id, payer_principal_type, payer_principal_id)
  select 'asbp_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, 'account', account_id
  from employee_assignments where id = assignment_id_out
  on conflict (assignment_id) do nothing;

  insert into assignment_budget_accounts (id, assignment_id, payer_principal_type, payer_principal_id, policy_version, monthly_limit_cents)
  select 'asba_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, 'account', account_id, 1, 0
  from employee_assignments where id = assignment_id_out
  on conflict (assignment_id, payer_principal_type, payer_principal_id, policy_version) do nothing;

  return assignment_id_out;
end;
$$;

create or replace function prepare_employee_principal_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.employee_principal_id is null then
    insert into employee_principals (id, legacy_employee_id, display_name, status)
    values (
      'epr_' || substr(encode(digest(new.id, 'sha256'), 'hex'), 1, 22),
      new.id,
      new.name,
      case when new.status in ('live','provisioning') then 'active' when new.status = 'retired' then 'retired' else 'suspended' end
    )
    on conflict (legacy_employee_id) do update set display_name = excluded.display_name, status = excluded.status, updated_at = now()
    returning id into new.employee_principal_id;
  end if;
  return new;
end;
$$;

drop trigger if exists employees_prepare_principal_before_write on employees;
create trigger employees_prepare_principal_before_write
before insert or update of id, name, status, employee_principal_id on employees
for each row execute function prepare_employee_principal_before_write();

create or replace function ensure_employee_relationship_graph_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform ensure_employee_relationship_graph(new.id);
  return new;
end;
$$;

drop trigger if exists employees_relationship_graph_after_write on employees;
create trigger employees_relationship_graph_after_write
after insert or update of account_id, employee_principal_id, name, status on employees
for each row execute function ensure_employee_relationship_graph_after_write();

create or replace function fill_assignment_context_from_employee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignment_id is null and new.employee_id is not null then
    select id into new.assignment_id
    from employee_assignments
    where employee_id = new.employee_id
      and legacy_default = true
      and status = 'active'
      and revoked_at is null
      and (valid_until is null or valid_until > now())
    limit 1;
  end if;

  if new.assignment_id is null then
    new.execution_context_type := 'platform_system';
  else
    new.execution_context_type := 'assignment';
  end if;

  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'business_brain_facts','provisioning_jobs','artifacts','approvals','connector_accounts','stripe_connections',
    'employee_manifests','runtime_endpoints','employee_messages','model_gateway_credentials','model_gateway_request_audit',
    'provisioning_resource_states','provisioning_commands','ambient_event_inbox','provisioning_transitions','webhook_inbox',
    'host_provisioner_audit','employee_mcp_credentials','profile_packages','work_runs','meter_events','tool_invocations',
    'work_resources','work_actions','surface_envelopes','surface_receipts'
  ] loop
    if to_regclass('public.' || target_table) is not null
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = target_table and column_name = 'employee_id')
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = target_table and column_name = 'assignment_id') then
      execute format('drop trigger if exists %I on %I', target_table || '_fill_assignment_context', target_table);
      execute format('create trigger %I before insert or update of employee_id, assignment_id on %I for each row execute function fill_assignment_context_from_employee()', target_table || '_fill_assignment_context', target_table);
    end if;
  end loop;
end $$;

create or replace function fill_artifact_link_assignment_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignment_id is null and new.artifact_id is not null then
    select assignment_id into new.assignment_id
    from artifacts
    where id = new.artifact_id;
  end if;
  return new;
end;
$$;

drop trigger if exists artifact_links_fill_assignment_context on artifact_links;
create trigger artifact_links_fill_assignment_context
before insert or update of artifact_id, assignment_id on artifact_links
for each row execute function fill_artifact_link_assignment_context();

commit;
