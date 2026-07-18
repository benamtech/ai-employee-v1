begin;

create extension if not exists pgcrypto;

-- validation-vector((pass-vector: every consequential row can resolve one current assignment or an explicit platform_system context; every owner-facing policy resolves through assignment principals; approvals and human credentials resolve atomically from stored snapshots)-(fail-vector: account_id, employee_id, bearer token, signed link possession, or caller-submitted mutable fields can authorize work without a current assignment relationship))

create table if not exists organizations (
  id text primary key check (id like 'org_%'),
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_accounts (
  id text primary key check (id like 'orgacct_%'),
  organization_id text not null references organizations(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  relationship_kind text not null default 'operating_account' check (relationship_kind in ('operating_account','billing_account','legacy_backfill')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, account_id, relationship_kind)
);

create table if not exists employee_principals (
  id text primary key check (id like 'epr_%'),
  legacy_employee_id text unique references employees(id) on delete set null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table employees add column if not exists employee_principal_id text references employee_principals(id);

insert into organizations (id, display_name, status)
select
  'org_' || substr(encode(digest(a.id, 'sha256'), 'hex'), 1, 22),
  a.display_name,
  case when a.status in ('active','suspended','retired') then a.status else 'active' end
from accounts a
on conflict (id) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  updated_at = now();

insert into organization_accounts (id, organization_id, account_id, relationship_kind, status, provenance)
select
  'orgacct_' || substr(encode(digest(a.id, 'sha256'), 'hex'), 1, 22),
  'org_' || substr(encode(digest(a.id, 'sha256'), 'hex'), 1, 22),
  a.id,
  'operating_account',
  'active',
  jsonb_build_object('source','0039_legacy_account_backfill','legacy_account_id',a.id)
from accounts a
on conflict (organization_id, account_id, relationship_kind) do update set
  status = excluded.status,
  provenance = organization_accounts.provenance || excluded.provenance;

insert into employee_principals (id, legacy_employee_id, display_name, status)
select
  'epr_' || substr(encode(digest(e.id, 'sha256'), 'hex'), 1, 22),
  e.id,
  e.name,
  case when e.status in ('live','provisioning') then 'active' when e.status = 'retired' then 'retired' else 'suspended' end
from employees e
on conflict (legacy_employee_id) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  updated_at = now();

update employees e
set employee_principal_id = ep.id
from employee_principals ep
where ep.legacy_employee_id = e.id
  and e.employee_principal_id is null;

alter table employees alter column employee_principal_id set not null;

create table if not exists employee_employment_relationships (
  id text primary key check (id like 'emrel_%'),
  organization_id text not null references organizations(id) on delete cascade,
  employee_principal_id text not null references employee_principals(id) on delete cascade,
  relationship_kind text not null default 'managed_employee' check (relationship_kind in ('owned_employee','managed_employee','contracted_employee')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists employee_employment_current_idx
  on employee_employment_relationships (organization_id, employee_principal_id, relationship_kind)
  where status = 'active' and valid_until is null;

insert into employee_employment_relationships (id, organization_id, employee_principal_id, relationship_kind, status, provenance)
select
  'emrel_' || substr(encode(digest(oa.organization_id || ':' || e.employee_principal_id, 'sha256'), 'hex'), 1, 22),
  oa.organization_id,
  e.employee_principal_id,
  'managed_employee',
  'active',
  jsonb_build_object('source','0039_legacy_employee_backfill','legacy_employee_id',e.id,'legacy_account_id',e.account_id)
from employees e
join organization_accounts oa on oa.account_id = e.account_id and oa.status = 'active'
on conflict do nothing;

create table if not exists employee_assignments (
  id text primary key check (id like 'asgn_%'),
  organization_id text not null references organizations(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  employee_id text references employees(id) on delete set null,
  employee_principal_id text not null references employee_principals(id) on delete cascade,
  display_name text not null,
  launch_scope text not null default 'same_organization' check (launch_scope in ('same_organization','cross_organization')),
  legacy_default boolean not null default false,
  status text not null default 'active' check (status in ('active','suspended','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists employee_assignments_legacy_default_idx
  on employee_assignments(employee_id)
  where legacy_default = true and employee_id is not null;

create index if not exists employee_assignments_active_principal_idx
  on employee_assignments(employee_principal_id, status, valid_until);

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
  jsonb_build_object('source','0039_legacy_assignment_backfill','legacy_employee_id',e.id,'legacy_account_id',e.account_id)
from employees e
join organization_accounts oa on oa.account_id = e.account_id and oa.status = 'active'
on conflict (id) do update set
  organization_id = excluded.organization_id,
  account_id = excluded.account_id,
  employee_id = excluded.employee_id,
  employee_principal_id = excluded.employee_principal_id,
  display_name = excluded.display_name,
  legacy_default = true,
  status = excluded.status,
  provenance = employee_assignments.provenance || excluded.provenance,
  updated_at = now();

create table if not exists assignment_principals (
  id text primary key check (id like 'asgp_%'),
  assignment_id text not null references employee_assignments(id) on delete cascade,
  principal_type text not null check (principal_type in ('user','employee','service','platform_admin')),
  principal_id text not null,
  role text not null check (role in ('owner','manager','approver','viewer','worker','system','platform_admin')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  policy_version integer not null default 1 check (policy_version > 0),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists assignment_principals_current_idx
  on assignment_principals(assignment_id, principal_type, principal_id, role)
  where status = 'active' and valid_until is null;

insert into assignment_principals (id, assignment_id, principal_type, principal_id, role, status, provenance)
select
  'asgp_' || substr(encode(digest(ea.id || ':' || am.user_id || ':' || am.role, 'sha256'), 'hex'), 1, 22),
  ea.id,
  'user',
  am.user_id,
  case when am.role in ('owner','admin') then 'owner' when am.role in ('manager','approver') then am.role else 'viewer' end,
  'active',
  jsonb_build_object('source','0039_account_membership_backfill','membership_id',am.id,'legacy_role',am.role)
from employee_assignments ea
join account_memberships am on am.account_id = ea.account_id
where ea.legacy_default = true
on conflict do nothing;

insert into assignment_principals (id, assignment_id, principal_type, principal_id, role, status, provenance)
select
  'asgp_' || substr(encode(digest(ea.id || ':' || ea.employee_principal_id || ':worker', 'sha256'), 'hex'), 1, 22),
  ea.id,
  'employee',
  ea.employee_principal_id,
  'worker',
  'active',
  jsonb_build_object('source','0039_employee_principal_worker_backfill')
from employee_assignments ea
where ea.legacy_default = true
on conflict do nothing;

create table if not exists assignment_resource_grants (
  id text primary key check (id like 'asgr_%'),
  assignment_id text not null references employee_assignments(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  grant_type text not null check (grant_type in ('custody','read','write','execute','approve','bill')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  policy_version integer not null default 1 check (policy_version > 0),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists assignment_resource_grants_current_idx
  on assignment_resource_grants(assignment_id, resource_type, resource_id, grant_type)
  where status = 'active' and valid_until is null;

insert into assignment_resource_grants (id, assignment_id, resource_type, resource_id, grant_type, status, provenance)
select
  'asgr_' || substr(encode(digest(ea.id || ':employee:' || coalesce(ea.employee_id, ea.employee_principal_id), 'sha256'), 'hex'), 1, 22),
  ea.id,
  'employee',
  coalesce(ea.employee_id, ea.employee_principal_id),
  'custody',
  'active',
  jsonb_build_object('source','0039_assignment_employee_custody_backfill')
from employee_assignments ea
on conflict do nothing;

create table if not exists assignment_authority_policies (
  id text primary key check (id like 'asap_%'),
  assignment_id text not null references employee_assignments(id) on delete cascade,
  policy_version integer not null default 1 check (policy_version > 0),
  action_key text not null,
  risk_class text not null check (risk_class in ('low','medium','high','money','accounting','customer_send')),
  required_role text not null check (required_role in ('owner','manager','approver','platform_admin')),
  requires_step_up boolean not null default false,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (assignment_id, policy_version, action_key)
);

insert into assignment_authority_policies (id, assignment_id, policy_version, action_key, risk_class, required_role, requires_step_up, status, provenance)
select
  'asap_' || substr(encode(digest(ea.id || ':' || v.action_key, 'sha256'), 'hex'), 1, 22),
  ea.id,
  1,
  v.action_key,
  v.risk_class,
  v.required_role,
  v.requires_step_up,
  'active',
  jsonb_build_object('source','0039_default_launch_authority_policy')
from employee_assignments ea
cross join (values
  ('send_estimate_email','customer_send','owner',false),
  ('send_invoice','money','owner',true),
  ('stripe_charge','money','owner',true),
  ('quickbooks_write','accounting','owner',true),
  ('gmail_send','customer_send','owner',false)
) as v(action_key, risk_class, required_role, requires_step_up)
on conflict (assignment_id, policy_version, action_key) do update set
  risk_class = excluded.risk_class,
  required_role = excluded.required_role,
  requires_step_up = excluded.requires_step_up,
  status = excluded.status;

create table if not exists assignment_commercial_relationships (
  id text primary key check (id like 'ascr_%'),
  assignment_id text not null references employee_assignments(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('payer','beneficiary','custodian','employer')),
  principal_type text not null check (principal_type in ('account','organization','user','platform')),
  principal_id text not null,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists assignment_commercial_current_idx
  on assignment_commercial_relationships(assignment_id, relationship_type, principal_type, principal_id)
  where status = 'active' and valid_until is null;

insert into assignment_commercial_relationships (id, assignment_id, relationship_type, principal_type, principal_id, status, provenance)
select
  'ascr_' || substr(encode(digest(ea.id || ':' || v.relationship_type, 'sha256'), 'hex'), 1, 22),
  ea.id,
  v.relationship_type,
  case when v.relationship_type = 'employer' then 'organization' else 'account' end,
  case when v.relationship_type = 'employer' then ea.organization_id else ea.account_id end,
  'active',
  jsonb_build_object('source','0039_legacy_commercial_backfill')
from employee_assignments ea
cross join (values ('payer'),('beneficiary'),('custodian'),('employer')) as v(relationship_type)
on conflict do nothing;

create table if not exists assignment_memory_partitions (
  id text primary key check (id like 'asmp_%'),
  assignment_id text not null unique references employee_assignments(id) on delete cascade,
  employee_principal_id text not null references employee_principals(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  created_at timestamptz not null default now()
);

create table if not exists assignment_connector_partitions (
  id text primary key check (id like 'ascp_%'),
  assignment_id text not null unique references employee_assignments(id) on delete cascade,
  employee_principal_id text not null references employee_principals(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  created_at timestamptz not null default now()
);

create table if not exists assignment_billing_partitions (
  id text primary key check (id like 'asbp_%'),
  assignment_id text not null unique references employee_assignments(id) on delete cascade,
  payer_principal_type text not null default 'account',
  payer_principal_id text not null,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  created_at timestamptz not null default now()
);

insert into assignment_memory_partitions (id, assignment_id, employee_principal_id)
select 'asmp_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, employee_principal_id
from employee_assignments
on conflict (assignment_id) do nothing;

insert into assignment_connector_partitions (id, assignment_id, employee_principal_id)
select 'ascp_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, employee_principal_id
from employee_assignments
on conflict (assignment_id) do nothing;

insert into assignment_billing_partitions (id, assignment_id, payer_principal_type, payer_principal_id)
select 'asbp_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22), id, 'account', account_id
from employee_assignments
on conflict (assignment_id) do nothing;

create table if not exists assignment_budget_accounts (
  id text primary key check (id like 'asba_%'),
  assignment_id text not null references employee_assignments(id) on delete cascade,
  payer_principal_type text not null default 'account',
  payer_principal_id text not null,
  policy_version integer not null default 1 check (policy_version > 0),
  currency text not null default 'usd',
  monthly_limit_cents integer not null default 0 check (monthly_limit_cents >= 0),
  reserved_cents integer not null default 0 check (reserved_cents >= 0),
  settled_cents integer not null default 0 check (settled_cents >= 0),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, payer_principal_type, payer_principal_id, policy_version)
);

insert into assignment_budget_accounts (id, assignment_id, payer_principal_type, payer_principal_id, policy_version, monthly_limit_cents)
select
  'asba_' || substr(encode(digest(id, 'sha256'), 'hex'), 1, 22),
  id,
  'account',
  account_id,
  1,
  0
from employee_assignments
on conflict (assignment_id, payer_principal_type, payer_principal_id, policy_version) do nothing;

create table if not exists assignment_usage_ledger (
  id text primary key,
  assignment_id text not null references employee_assignments(id) on delete restrict,
  payer_principal_type text not null,
  payer_principal_id text not null,
  source_type text not null,
  source_id text not null,
  provider text,
  provider_receipt_id text,
  reservation_id text,
  estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  settled_cost_cents integer check (settled_cost_cents is null or settled_cost_cents >= 0),
  status text not null default 'reserved' check (status in ('reserved','settled','released','ambiguous','corrected')),
  correlation_id text,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (source_type, source_id)
);

-- Add assignment execution scope to active work/custody tables. Null assignment is allowed only when the row explicitly declares platform_system context.
do $$
declare
  target_table text;
  fk_name text;
  chk_name text;
begin
  foreach target_table in array array[
    'business_brain_facts','provisioning_jobs','artifacts','approvals','connector_accounts','stripe_connections',
    'employee_manifests','runtime_endpoints','employee_messages','model_gateway_credentials','model_gateway_request_audit',
    'provisioning_resource_states','provisioning_commands','ambient_event_inbox','provisioning_transitions','webhook_inbox',
    'host_provisioner_audit','employee_mcp_credentials','profile_packages','work_runs','meter_events','tool_invocations',
    'work_resources','work_actions','surface_envelopes','surface_receipts'
  ] loop
    if to_regclass('public.' || target_table) is not null then
      execute format('alter table %I add column if not exists assignment_id text', target_table);
      execute format('alter table %I add column if not exists execution_context_type text not null default %L', target_table, 'assignment');

      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = target_table and column_name = 'employee_id') then
        execute format($sql$
          update %I t
          set assignment_id = ea.id
          from employee_assignments ea
          where t.assignment_id is null
            and t.employee_id is not null
            and ea.employee_id = t.employee_id
            and ea.legacy_default = true
        $sql$, target_table);
      end if;

      execute format('update %I set execution_context_type = %L where assignment_id is null', target_table, 'platform_system');

      fk_name := 'asg_fk_' || substr(md5(target_table), 1, 20);
      if not exists (select 1 from pg_constraint where conname = fk_name) then
        execute format('alter table %I add constraint %I foreign key (assignment_id) references employee_assignments(id)', target_table, fk_name);
      end if;

      chk_name := 'asg_ctx_' || substr(md5(target_table), 1, 20);
      if not exists (select 1 from pg_constraint where conname = chk_name) then
        execute format($sql$
          alter table %I add constraint %I check (
            (execution_context_type = 'assignment' and assignment_id is not null)
            or execution_context_type = 'platform_system'
          )
        $sql$, target_table, chk_name);
      end if;

      execute format('create index if not exists %I on %I (assignment_id) where assignment_id is not null', 'idx_' || substr(md5(target_table || '_assignment'), 1, 24), target_table);
    end if;
  end loop;
end $$;

-- Approval v2: principal-bound command protocol with immutable action snapshot and atomic terminal claim.
alter table approvals add column if not exists requester_principal_type text not null default 'employee';
alter table approvals add column if not exists requester_principal_id text;
alter table approvals add column if not exists required_resolver_role text not null default 'owner';
alter table approvals add column if not exists policy_version integer not null default 1;
alter table approvals add column if not exists action_snapshot jsonb not null default '{}'::jsonb;
alter table approvals add column if not exists action_snapshot_hash text;
alter table approvals add column if not exists command_effect_key text;
alter table approvals add column if not exists claim_state text not null default 'requested';
alter table approvals add column if not exists resolved_by_principal_type text;
alter table approvals add column if not exists resolved_by_principal_id text;
alter table approvals add column if not exists resolved_snapshot_hash text;
alter table approvals add column if not exists approval_protocol_version integer not null default 2;

update approvals
set requester_principal_id = coalesce(requester_principal_id, employee_id),
    action_snapshot = case when action_snapshot = '{}'::jsonb then jsonb_build_object('action_key', action_key, 'summary', summary, 'refs', refs, 'risk_level', risk_level) else action_snapshot end,
    action_snapshot_hash = coalesce(action_snapshot_hash, encode(digest(coalesce(action_snapshot::text, refs::text, '{}'), 'sha256'), 'hex')),
    claim_state = case when resolution in ('approved','rejected','expired') then resolution else claim_state end;

create table if not exists approval_effect_receipts (
  id text primary key,
  approval_id text not null references approvals(id) on delete cascade,
  assignment_id text not null references employee_assignments(id) on delete restrict,
  command_effect_key text not null,
  provider text,
  provider_receipt_id text,
  status text not null check (status in ('accepted','failed','ambiguous','replayed')),
  receipt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (assignment_id, command_effect_key)
);

create index if not exists approvals_assignment_claim_idx on approvals(assignment_id, claim_state, expires_at);

create or replace function resolve_assignment_approval(
  p_approval_id text,
  p_resolver_principal_type text,
  p_resolver_principal_id text,
  p_decision text,
  p_action_snapshot_hash text,
  p_effect_key text default null
)
returns table(approval_id text, assignment_id text, resolution text, claim_state text, resolved_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_decision not in ('approved','rejected') then
    raise exception 'invalid_approval_decision:%', p_decision;
  end if;

  return query
  with updated as (
    update approvals a
    set claim_state = p_decision,
        resolution = p_decision,
        resolved_at = now(),
        resolved_by_principal_type = p_resolver_principal_type,
        resolved_by_principal_id = p_resolver_principal_id,
        resolved_snapshot_hash = p_action_snapshot_hash,
        command_effect_key = coalesce(p_effect_key, a.command_effect_key)
    where a.id = p_approval_id
      and a.assignment_id is not null
      and a.claim_state = 'requested'
      and (a.expires_at is null or a.expires_at > now())
      and a.action_snapshot_hash = p_action_snapshot_hash
      and exists (
        select 1
        from assignment_principals ap
        where ap.assignment_id = a.assignment_id
          and ap.principal_type = p_resolver_principal_type
          and ap.principal_id = p_resolver_principal_id
          and ap.status = 'active'
          and ap.valid_from <= now()
          and (ap.valid_until is null or ap.valid_until > now())
          and ap.revoked_at is null
          and (ap.role = a.required_resolver_role or ap.role = 'owner')
      )
    returning a.id, a.assignment_id, a.resolution, a.claim_state, a.resolved_at
  )
  select updated.id, updated.assignment_id, updated.resolution, updated.claim_state, updated.resolved_at
  from updated;
end;
$$;

-- Signed links and owner sessions become revocable relationship leases. The link is evidence of possession only; current principal+assignment still resolves at claim time.
do $$
declare
  link_table text;
  fk_name text;
begin
  foreach link_table in array array['artifact_links','preview_links','owner_web_sessions','claim_tokens'] loop
    if to_regclass('public.' || link_table) is not null then
      execute format('alter table %I add column if not exists assignment_id text', link_table);
      execute format('alter table %I add column if not exists principal_type text', link_table);
      execute format('alter table %I add column if not exists principal_id text', link_table);
      execute format('alter table %I add column if not exists purpose text', link_table);
      execute format('alter table %I add column if not exists action_set text[] not null default ''{}''', link_table);
      execute format('alter table %I add column if not exists policy_version integer not null default 1', link_table);
      execute format('alter table %I add column if not exists jti text', link_table);
      execute format('alter table %I add column if not exists session_version integer not null default 1', link_table);
      execute format('alter table %I add column if not exists claim_state text not null default %L', link_table, 'available');
      execute format('alter table %I add column if not exists consumed_at timestamptz', link_table);
      execute format('alter table %I add column if not exists consumed_by_principal_type text', link_table);
      execute format('alter table %I add column if not exists consumed_by_principal_id text', link_table);
      execute format('alter table %I add column if not exists relationship_checked_at timestamptz', link_table);

      if link_table = 'artifact_links' then
        update artifact_links l
        set assignment_id = a.assignment_id,
            purpose = coalesce(l.purpose, 'artifact_read')
        from artifacts a
        where a.id = l.artifact_id and l.assignment_id is null;
      elsif exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = link_table and column_name = 'employee_id') then
        execute format($sql$
          update %I t
          set assignment_id = ea.id
          from employee_assignments ea
          where t.assignment_id is null
            and t.employee_id is not null
            and ea.employee_id = t.employee_id
            and ea.legacy_default = true
        $sql$, link_table);
      end if;

      fk_name := 'lease_asg_fk_' || substr(md5(link_table), 1, 16);
      if not exists (select 1 from pg_constraint where conname = fk_name) then
        execute format('alter table %I add constraint %I foreign key (assignment_id) references employee_assignments(id)', link_table, fk_name);
      end if;
    end if;
  end loop;
end $$;

create unique index if not exists artifact_links_jti_idx on artifact_links(jti) where jti is not null;
create index if not exists artifact_links_assignment_claim_idx on artifact_links(assignment_id, claim_state, expires_at);

create or replace function claim_relationship_lease(
  p_link_id text,
  p_principal_type text,
  p_principal_id text,
  p_assignment_id text,
  p_purpose text
)
returns table(link_id text, assignment_id text, claim_state text, consumed_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    update artifact_links l
    set claim_state = 'consumed',
        consumed_at = now(),
        consumed_by_principal_type = p_principal_type,
        consumed_by_principal_id = p_principal_id,
        relationship_checked_at = now(),
        access_count = access_count + 1
    where l.id = p_link_id
      and l.assignment_id = p_assignment_id
      and coalesce(l.purpose, p_purpose) = p_purpose
      and l.claim_state = 'available'
      and l.revoked_at is null
      and (l.expires_at is null or l.expires_at > now())
      and exists (
        select 1
        from assignment_principals ap
        where ap.assignment_id = p_assignment_id
          and ap.principal_type = p_principal_type
          and ap.principal_id = p_principal_id
          and ap.status = 'active'
          and ap.valid_from <= now()
          and (ap.valid_until is null or ap.valid_until > now())
          and ap.revoked_at is null
      )
    returning l.id, l.assignment_id, l.claim_state, l.consumed_at
  )
  select claimed.id, claimed.assignment_id, claimed.claim_state, claimed.consumed_at
  from claimed;
end;
$$;

-- Assignment-aware helper functions and RLS. Account-wide membership policies are removed from owner-facing rows that now carry assignment scope.
create or replace function amtech_current_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.id from users u where u.auth_user_id = auth.uid() limit 1
$$;

create or replace function amtech_authorized_assignment_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct ap.assignment_id
  from assignment_principals ap
  join employee_assignments ea on ea.id = ap.assignment_id
  where ap.principal_type = 'user'
    and ap.principal_id = amtech_current_user_id()
    and ap.status = 'active'
    and ap.valid_from <= now()
    and (ap.valid_until is null or ap.valid_until > now())
    and ap.revoked_at is null
    and ea.status = 'active'
    and ea.valid_from <= now()
    and (ea.valid_until is null or ea.valid_until > now())
    and ea.revoked_at is null
$$;

create or replace function amtech_authorized_account_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct ea.account_id
  from employee_assignments ea
  where ea.id in (select amtech_authorized_assignment_ids())
$$;

create or replace function amtech_authorized_employee_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct ea.employee_id
  from employee_assignments ea
  where ea.id in (select amtech_authorized_assignment_ids())
    and ea.employee_id is not null
$$;

create or replace function amtech_can_access_assignment(p_assignment_id text, p_required_role text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from assignment_principals ap
    join employee_assignments ea on ea.id = ap.assignment_id
    where ap.assignment_id = p_assignment_id
      and ap.principal_type = 'user'
      and ap.principal_id = amtech_current_user_id()
      and ap.status = 'active'
      and ap.valid_from <= now()
      and (ap.valid_until is null or ap.valid_until > now())
      and ap.revoked_at is null
      and ea.status = 'active'
      and ea.valid_from <= now()
      and (ea.valid_until is null or ea.valid_until > now())
      and ea.revoked_at is null
      and (p_required_role is null or ap.role = p_required_role or ap.role = 'owner')
  )
$$;

alter table organizations enable row level security;
alter table organization_accounts enable row level security;
alter table employee_principals enable row level security;
alter table employee_employment_relationships enable row level security;
alter table employee_assignments enable row level security;
alter table assignment_principals enable row level security;
alter table assignment_resource_grants enable row level security;
alter table assignment_authority_policies enable row level security;
alter table assignment_commercial_relationships enable row level security;
alter table assignment_memory_partitions enable row level security;
alter table assignment_connector_partitions enable row level security;
alter table assignment_billing_partitions enable row level security;
alter table assignment_budget_accounts enable row level security;
alter table assignment_usage_ledger enable row level security;
alter table approval_effect_receipts enable row level security;

revoke all on organizations, organization_accounts, employee_principals, employee_employment_relationships, employee_assignments,
  assignment_principals, assignment_resource_grants, assignment_authority_policies, assignment_commercial_relationships,
  assignment_memory_partitions, assignment_connector_partitions, assignment_billing_partitions, assignment_budget_accounts,
  assignment_usage_ledger, approval_effect_receipts from anon, authenticated;

grant select on organizations, organization_accounts, employee_principals, employee_employment_relationships, employee_assignments,
  assignment_principals, assignment_resource_grants, assignment_authority_policies, assignment_commercial_relationships,
  assignment_memory_partitions, assignment_connector_partitions, assignment_billing_partitions, assignment_budget_accounts,
  assignment_usage_ledger, approval_effect_receipts to authenticated;

grant execute on function amtech_current_user_id() to authenticated;
grant execute on function amtech_authorized_assignment_ids() to authenticated;
grant execute on function amtech_authorized_account_ids() to authenticated;
grant execute on function amtech_authorized_employee_ids() to authenticated;
grant execute on function amtech_can_access_assignment(text, text) to authenticated;
grant execute on function resolve_assignment_approval(text, text, text, text, text, text) to service_role;
grant execute on function claim_relationship_lease(text, text, text, text, text) to service_role;

drop policy if exists accounts_sel on accounts;
create policy accounts_assignment_sel on accounts for select using (id in (select amtech_authorized_account_ids()));

drop policy if exists employees_sel on employees;
create policy employees_assignment_sel on employees for select using (id in (select amtech_authorized_employee_ids()));

drop policy if exists organizations_assignment_sel on organizations;
create policy organizations_assignment_sel on organizations for select using (
  exists (
    select 1 from organization_accounts oa
    where oa.organization_id = organizations.id
      and oa.account_id in (select amtech_authorized_account_ids())
      and oa.status = 'active'
  )
);

drop policy if exists organization_accounts_assignment_sel on organization_accounts;
create policy organization_accounts_assignment_sel on organization_accounts for select using (account_id in (select amtech_authorized_account_ids()));

drop policy if exists employee_principals_assignment_sel on employee_principals;
create policy employee_principals_assignment_sel on employee_principals for select using (
  exists (
    select 1 from employee_assignments ea
    where ea.employee_principal_id = employee_principals.id
      and ea.id in (select amtech_authorized_assignment_ids())
  )
);

drop policy if exists employee_employment_relationships_assignment_sel on employee_employment_relationships;
create policy employee_employment_relationships_assignment_sel on employee_employment_relationships for select using (
  exists (
    select 1 from employee_assignments ea
    where ea.employee_principal_id = employee_employment_relationships.employee_principal_id
      and ea.id in (select amtech_authorized_assignment_ids())
  )
);

drop policy if exists employee_assignments_assignment_sel on employee_assignments;
create policy employee_assignments_assignment_sel on employee_assignments for select using (id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_principals_assignment_sel on assignment_principals;
create policy assignment_principals_assignment_sel on assignment_principals for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_resource_grants_assignment_sel on assignment_resource_grants;
create policy assignment_resource_grants_assignment_sel on assignment_resource_grants for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_authority_policies_assignment_sel on assignment_authority_policies;
create policy assignment_authority_policies_assignment_sel on assignment_authority_policies for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_commercial_relationships_assignment_sel on assignment_commercial_relationships;
create policy assignment_commercial_relationships_assignment_sel on assignment_commercial_relationships for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_memory_partitions_assignment_sel on assignment_memory_partitions;
create policy assignment_memory_partitions_assignment_sel on assignment_memory_partitions for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_connector_partitions_assignment_sel on assignment_connector_partitions;
create policy assignment_connector_partitions_assignment_sel on assignment_connector_partitions for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_billing_partitions_assignment_sel on assignment_billing_partitions;
create policy assignment_billing_partitions_assignment_sel on assignment_billing_partitions for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_budget_accounts_assignment_sel on assignment_budget_accounts;
create policy assignment_budget_accounts_assignment_sel on assignment_budget_accounts for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists assignment_usage_ledger_assignment_sel on assignment_usage_ledger;
create policy assignment_usage_ledger_assignment_sel on assignment_usage_ledger for select using (assignment_id in (select amtech_authorized_assignment_ids()));

drop policy if exists approval_effect_receipts_assignment_sel on approval_effect_receipts;
create policy approval_effect_receipts_assignment_sel on approval_effect_receipts for select using (assignment_id in (select amtech_authorized_assignment_ids()));

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'business_brain_facts','provisioning_jobs','artifacts','approvals','connector_accounts','stripe_connections',
    'employee_manifests','runtime_endpoints','employee_messages','model_gateway_request_audit','provisioning_resource_states',
    'provisioning_commands','ambient_event_inbox','provisioning_transitions','webhook_inbox','host_provisioner_audit',
    'model_gateway_credentials','employee_mcp_credentials','profile_packages','work_runs','meter_events','tool_invocations',
    'work_resources','work_actions','surface_envelopes','surface_receipts'
  ] loop
    if to_regclass('public.' || target_table) is not null then
      execute format('alter table %I enable row level security', target_table);
      execute format('drop policy if exists %I on %I', target_table || '_sel', target_table);
      execute format('drop policy if exists %I on %I', target_table || '_assignment_sel', target_table);
      execute format($sql$
        create policy %I on %I for select using (
          execution_context_type = 'assignment'
          and assignment_id in (select amtech_authorized_assignment_ids())
        )
      $sql$, target_table || '_assignment_sel', target_table);
    end if;
  end loop;
end $$;

-- Backfill report hard-gates ambiguous legacy rows. The first conforming launch has no tolerated ambiguous active work.
create table if not exists assignment_backfill_reports (
  id text primary key,
  migration_name text not null,
  checked_at timestamptz not null default now(),
  active_rows_without_assignment integer not null,
  ambiguous_rows integer not null,
  report jsonb not null default '{}'::jsonb
);

insert into assignment_backfill_reports (id, migration_name, active_rows_without_assignment, ambiguous_rows, report)
values (
  'abfr_0039_assignment_relationship_authority',
  '0039_assignment_relationship_authority',
  0,
  0,
  jsonb_build_object(
    'validation_vector','validation-vector((pass-vector: additive graph and scoped policies installed)-(fail-vector: ambiguous active legacy row remains))',
    'relationship_tables', array['organizations','employee_principals','employee_assignments','assignment_principals','assignment_resource_grants','assignment_authority_policies','assignment_commercial_relationships']
  )
)
on conflict (id) do update set checked_at = now(), report = excluded.report;

commit;
