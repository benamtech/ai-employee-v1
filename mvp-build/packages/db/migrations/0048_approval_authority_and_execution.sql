-- ============================================================================
-- AMTECH Phase 2 — S7 principal-bound approval authority and execution
--
-- Forward-only. Approval is an immutable authority protocol, not a mutable
-- yes/no row. Every promoted request binds one assignment, requester, action,
-- durable resource snapshot, current policy/version, resolver roles/grant, and
-- one predetermined C3 command/effect identity.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- Consequential resources carry explicit assignment scope. Compatibility
-- account/employee columns never authorize an approval.
alter table outbound_emails
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict;
alter table stripe_invoices
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict;
alter table quickbooks_pending_writes
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict;

create index if not exists outbound_emails_assignment_idx on outbound_emails(assignment_id) where assignment_id is not null;
create index if not exists stripe_invoices_assignment_idx on stripe_invoices(assignment_id) where assignment_id is not null;
create index if not exists quickbooks_pending_writes_assignment_idx on quickbooks_pending_writes(assignment_id) where assignment_id is not null;

update outbound_emails oe
   set assignment_id = amtech_default_assignment_for_employee_account(ca.employee_id, ca.account_id)
  from connector_accounts ca
 where oe.connector_id = ca.id
   and oe.assignment_id is null
   and amtech_default_assignment_for_employee_account(ca.employee_id, ca.account_id) is not null;

update stripe_invoices si
   set assignment_id = amtech_default_assignment_for_employee_account(sc.employee_id, sc.account_id)
  from stripe_connections sc
 where si.stripe_connection_id = sc.id
   and si.assignment_id is null
   and amtech_default_assignment_for_employee_account(sc.employee_id, sc.account_id) is not null;

update quickbooks_pending_writes qpw
   set assignment_id = amtech_default_assignment_for_employee_account(qpw.employee_id, qpw.account_id)
 where qpw.assignment_id is null
   and amtech_default_assignment_for_employee_account(qpw.employee_id, qpw.account_id) is not null;

-- --------------------------------------------------------------------------
-- Approval authority dimensions
-- --------------------------------------------------------------------------

alter table approvals
  add column if not exists requester_principal_id text,
  add column if not exists requester_principal_class text,
  add column if not exists resource_class text,
  add column if not exists resource_id text,
  add column if not exists snapshot jsonb,
  add column if not exists snapshot_hash text,
  add column if not exists policy_version text,
  add column if not exists required_resolver_roles text[],
  add column if not exists required_resolver_action text,
  add column if not exists status text not null default 'legacy',
  add column if not exists approval_version integer not null default 1,
  add column if not exists resolved_by_principal_id text,
  add column if not exists resolved_by_role text,
  add column if not exists resolution_channel text,
  add column if not exists command_intent_id text,
  add column if not exists command_id text,
  add column if not exists effect_key text,
  add column if not exists execution_state text not null default 'not_started',
  add column if not exists execution_receipt_id text references effect_receipts(id) on delete restrict,
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text,
  add column if not exists updated_at timestamptz not null default now();

alter table approvals
  drop constraint if exists approvals_requester_principal_class_check,
  add constraint approvals_requester_principal_class_check
    check (requester_principal_class is null or requester_principal_class in ('human','employee','service','platform')),
  drop constraint if exists approvals_status_check,
  add constraint approvals_status_check
    check (status in ('legacy','pending','approved','rejected','expired','revoked')),
  drop constraint if exists approvals_resolution_check,
  add constraint approvals_resolution_check
    check (resolution is null or resolution in ('approved','rejected','expired')),
  drop constraint if exists approvals_risk_level_check,
  add constraint approvals_risk_level_check
    check (risk_level in ('low','medium','high','critical')),
  drop constraint if exists approvals_execution_state_check,
  add constraint approvals_execution_state_check
    check (execution_state in ('not_started','executing','succeeded','failed','ambiguous','cancelled')),
  drop constraint if exists approvals_snapshot_hash_check,
  add constraint approvals_snapshot_hash_check
    check (snapshot_hash is null or snapshot_hash ~ '^sha256:[0-9a-f]{64}$'),
  drop constraint if exists approvals_promoted_shape_check,
  add constraint approvals_promoted_shape_check check (
    status = 'legacy'
    or (
      assignment_id is not null
      and requester_principal_id is not null
      and requester_principal_class is not null
      and resource_class is not null
      and resource_id is not null
      and snapshot is not null and jsonb_typeof(snapshot) = 'object'
      and snapshot_hash is not null
      and policy_version is not null
      and required_resolver_roles is not null and cardinality(required_resolver_roles) > 0
      and required_resolver_action is not null
      and command_intent_id is not null
      and command_id is not null
      and effect_key is not null
    )
  ) not valid;

create unique index if not exists approvals_command_intent_unique
  on approvals(command_intent_id) where command_intent_id is not null;
create unique index if not exists approvals_command_unique
  on approvals(command_id) where command_id is not null;
create unique index if not exists approvals_assignment_effect_unique
  on approvals(assignment_id, effect_key) where assignment_id is not null and effect_key is not null;
create index if not exists approvals_assignment_status_idx
  on approvals(assignment_id, status, created_at desc);

alter table preview_links
  add column if not exists resolver_principal_id text,
  add column if not exists policy_version text,
  add column if not exists approval_snapshot_hash text,
  add column if not exists token_jti text;

alter table preview_links
  drop constraint if exists preview_links_snapshot_hash_check,
  add constraint preview_links_snapshot_hash_check
    check (approval_snapshot_hash is null or approval_snapshot_hash ~ '^sha256:[0-9a-f]{64}$');
create unique index if not exists preview_links_token_jti_unique
  on preview_links(token_jti) where token_jti is not null;

-- --------------------------------------------------------------------------
-- Deterministic immutable resource snapshots
-- --------------------------------------------------------------------------

create or replace function amtech_approval_snapshot(
  p_assignment_id text,
  p_action_key text,
  p_resource_class text,
  p_resource_id text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_snapshot jsonb;
  v_stored_hash text;
  v_computed_hash text;
begin
  if p_resource_class = 'outbound_email' and p_action_key in ('send_estimate_email','send_email') then
    select jsonb_build_object(
      'schema_version', 'approval-snapshot-v1',
      'assignment_id', oe.assignment_id,
      'action_key', p_action_key,
      'resource_class', p_resource_class,
      'resource_id', oe.id,
      'connector_id', oe.connector_id,
      'to_email', oe.to_email,
      'subject', oe.subject,
      'body_hash', 'sha256:' || encode(digest(convert_to(coalesce(oe.body, ''), 'utf8'), 'sha256'), 'hex'),
      'attachment_artifact_ids', coalesce(to_jsonb(oe.attachment_artifact_ids), '[]'::jsonb),
      'gmail_thread_id', oe.gmail_thread_id
    ) into v_snapshot
      from outbound_emails oe
     where oe.id = p_resource_id
       and oe.assignment_id = p_assignment_id;
  elsif p_resource_class = 'stripe_invoice' and p_action_key in ('send_deposit_invoice','send_invoice') then
    select jsonb_build_object(
      'schema_version', 'approval-snapshot-v1',
      'assignment_id', si.assignment_id,
      'action_key', p_action_key,
      'resource_class', p_resource_class,
      'resource_id', si.id,
      'stripe_connection_id', si.stripe_connection_id,
      'stripe_invoice_id', si.stripe_invoice_id,
      'estimate_id', si.estimate_id,
      'deposit_amount', si.deposit_amount
    ) into v_snapshot
      from stripe_invoices si
     where si.id = p_resource_id
       and si.assignment_id = p_assignment_id;
  elsif p_resource_class = 'quickbooks_pending_write'
        and p_action_key in (
          'commit_quickbooks_expense','commit_quickbooks_bill',
          'commit_quickbooks_invoice','commit_quickbooks_payment'
        ) then
    select
      qpw.payload_hash,
      encode(digest(convert_to(qpw.canonical_payload, 'utf8'), 'sha256'), 'hex'),
      jsonb_build_object(
        'schema_version', 'approval-snapshot-v1',
        'assignment_id', qpw.assignment_id,
        'action_key', qpw.action_key,
        'resource_class', p_resource_class,
        'resource_id', qpw.id,
        'connector_id', qpw.connector_id,
        'entity_type', qpw.entity_type,
        'payload_hash', 'sha256:' || qpw.payload_hash
      )
      into v_stored_hash, v_computed_hash, v_snapshot
      from quickbooks_pending_writes qpw
     where qpw.id = p_resource_id
       and qpw.assignment_id = p_assignment_id
       and qpw.action_key = p_action_key;
    if v_snapshot is not null and v_stored_hash <> v_computed_hash then
      raise exception 'approval_resource_payload_hash_mismatch';
    end if;
  else
    raise exception 'unsupported_approval_resource: %/%', p_resource_class, p_action_key;
  end if;

  if v_snapshot is null then
    raise exception 'approval_resource_not_found_or_wrong_assignment';
  end if;
  return v_snapshot;
end;
$$;

create or replace function amtech_approval_snapshot_hash(p_snapshot jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select 'sha256:' || encode(digest(convert_to(p_snapshot::text, 'utf8'), 'sha256'), 'hex')
$$;

-- --------------------------------------------------------------------------
-- Current action policies
-- --------------------------------------------------------------------------

insert into assignment_authority_policies(
  id, assignment_id, policy_version, action, required_roles,
  risk_class, step_up_required, status
)
select
  'apol_' || substr(md5(ea.id || ':' || policy.action), 1, 27),
  ea.id,
  ea.policy_version,
  policy.action,
  policy.roles,
  policy.risk,
  true,
  'active'
from employee_assignments ea
cross join (
  values
    ('send_estimate_email', array['owner','manager','approver']::text[], 'medium'),
    ('send_email', array['owner','manager','approver']::text[], 'medium'),
    ('send_deposit_invoice', array['owner','billing','approver']::text[], 'high'),
    ('send_invoice', array['owner','billing','approver']::text[], 'high'),
    ('commit_quickbooks_expense', array['owner','billing','approver']::text[], 'high'),
    ('commit_quickbooks_bill', array['owner','billing','approver']::text[], 'high'),
    ('commit_quickbooks_invoice', array['owner','billing','approver']::text[], 'high'),
    ('commit_quickbooks_payment', array['owner','billing','approver']::text[], 'high')
) as policy(action, roles, risk)
where amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
on conflict (assignment_id, policy_version, action) do nothing;

-- --------------------------------------------------------------------------
-- Immutable request creation
-- --------------------------------------------------------------------------

create or replace function create_approval_authority_request(
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
  v_assignment employee_assignments%rowtype;
  v_employee_principal employee_principals%rowtype;
  v_policy assignment_authority_policies%rowtype;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_approval approvals%rowtype;
  v_required_action text;
begin
  if coalesce(p_approval_id, '') = ''
     or coalesce(p_assignment_id, '') = ''
     or coalesce(p_requester_principal_id, '') = ''
     or coalesce(p_action_key, '') = ''
     or coalesce(p_resource_class, '') = ''
     or coalesce(p_resource_id, '') = ''
     or coalesce(p_command_intent_id, '') = ''
     or coalesce(p_command_id, '') = ''
     or coalesce(p_effect_key, '') = '' then
    raise exception 'approval_identity_incomplete';
  end if;
  if p_expires_at <= now() then raise exception 'approval_expiry_invalid'; end if;

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
  if (case p_risk_level when 'low' then 1 when 'medium' then 2 when 'high' then 3 when 'critical' then 4 else 0 end)
     < (case v_policy.risk_class when 'low' then 1 when 'medium' then 2 when 'high' then 3 when 'critical' then 4 else 99 end) then
    raise exception 'approval_risk_below_policy';
  end if;

  v_snapshot := amtech_approval_snapshot(p_assignment_id, p_action_key, p_resource_class, p_resource_id);
  v_snapshot_hash := amtech_approval_snapshot_hash(v_snapshot);
  v_required_action := 'approval:resolve:' || p_action_key;

  insert into approvals(
    id, assignment_id, account_id, employee_id,
    requester_principal_id, requester_principal_class,
    action_key, summary, risk_level, refs, channel, expires_at,
    resource_class, resource_id, snapshot, snapshot_hash,
    policy_version, required_resolver_roles, required_resolver_action,
    status, command_intent_id, command_id, effect_key, execution_state
  ) values (
    p_approval_id, p_assignment_id, p_account_id, p_employee_id,
    p_requester_principal_id, p_requester_principal_class,
    p_action_key, p_summary, p_risk_level,
    jsonb_build_object('resource_class', p_resource_class, 'resource_id', p_resource_id),
    p_channel, p_expires_at,
    p_resource_class, p_resource_id, v_snapshot, v_snapshot_hash,
    v_assignment.policy_version, v_policy.required_roles, v_required_action,
    'pending', p_command_intent_id, p_command_id, p_effect_key, 'not_started'
  )
  on conflict (id) do nothing
  returning * into v_approval;

  if v_approval.id is null then
    select * into strict v_approval from approvals where id = p_approval_id;
    if v_approval.assignment_id <> p_assignment_id
       or v_approval.action_key <> p_action_key
       or v_approval.resource_class <> p_resource_class
       or v_approval.resource_id <> p_resource_id
       or v_approval.snapshot_hash <> v_snapshot_hash
       or v_approval.command_id <> p_command_id
       or v_approval.effect_key <> p_effect_key then
      raise exception 'approval_idempotency_conflict';
    end if;
  end if;

  insert into assignment_resource_grants(
    id, assignment_id, principal_id, resource_class, resource_id,
    actions, status, starts_at, policy_version, provenance
  ) values (
    'grant_' || substr(md5(p_approval_id || ':' || v_required_action), 1, 26),
    p_assignment_id, null, 'approval', p_approval_id,
    array[v_required_action], 'active', now(), v_assignment.policy_version,
    jsonb_build_object(
      'source', 'approval_authority_request',
      'approval_id', p_approval_id,
      'action_key', p_action_key,
      'snapshot_hash', v_snapshot_hash
    )
  ) on conflict (id) do nothing;

  return next v_approval;
end;
$$;

-- --------------------------------------------------------------------------
-- Atomic human resolution and C3 command registration
-- --------------------------------------------------------------------------

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
  if p_resolution not in ('approved','rejected') then raise exception 'approval_resolution_invalid'; end if;
  if coalesce(p_resolver_principal_id, '') = '' then raise exception 'approval_resolver_missing'; end if;

  select * into v_approval from approvals where id = p_approval_id for update;
  if v_approval.id is null or v_approval.status = 'legacy' then raise exception 'approval_not_promoted'; end if;
  if v_approval.revoked_at is not null or v_approval.status = 'revoked' then raise exception 'approval_revoked'; end if;
  if v_approval.expires_at <= now() or v_approval.status = 'expired' then raise exception 'approval_expired'; end if;

  if v_approval.status in ('approved','rejected') then
    if v_approval.resolution = p_resolution and v_approval.resolved_by_principal_id = p_resolver_principal_id then
      return query select v_approval.id, v_approval.assignment_id, v_approval.resolution,
        v_approval.resolved_by_role, v_approval.command_intent_id, v_approval.command_id,
        v_approval.effect_key, true;
      return;
    end if;
    raise exception 'approval_already_resolved';
  end if;
  if v_approval.status <> 'pending' then raise exception 'approval_not_pending'; end if;
  if v_approval.requester_principal_id = p_resolver_principal_id then raise exception 'approval_self_resolution_denied'; end if;
  if not exists (
    select 1 from human_principals hp
     where hp.id = p_resolver_principal_id and hp.status = 'active'
  ) then
    raise exception 'approval_resolver_not_current_human';
  end if;

  v_snapshot := amtech_approval_snapshot(
    v_approval.assignment_id, v_approval.action_key,
    v_approval.resource_class, v_approval.resource_id
  );
  v_snapshot_hash := amtech_approval_snapshot_hash(v_snapshot);
  if v_snapshot_hash <> v_approval.snapshot_hash
     or p_current_snapshot_hash <> v_approval.snapshot_hash then
    raise exception 'approval_snapshot_changed';
  end if;

  select * into v_policy
    from assignment_authority_policies
   where assignment_id = v_approval.assignment_id
     and policy_version = v_approval.policy_version
     and action = v_approval.action_key
     and status = 'active'
   limit 1;
  if v_policy.id is null or v_policy.required_roles <> v_approval.required_resolver_roles then
    raise exception 'approval_policy_changed';
  end if;

  select ap.role into v_role
    from assignment_principals ap
   where ap.assignment_id = v_approval.assignment_id
     and ap.principal_id = p_resolver_principal_id
     and ap.principal_class = 'human'
     and ap.role = any(v_approval.required_resolver_roles)
     and ap.policy_version = v_approval.policy_version
     and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
   order by array_position(v_approval.required_resolver_roles, ap.role)
   limit 1;
  if v_role is null then raise exception 'approval_resolver_role_denied'; end if;

  if not exists (
    select 1 from assignment_resource_grants g
     where g.assignment_id = v_approval.assignment_id
       and (g.principal_id is null or g.principal_id = p_resolver_principal_id)
       and g.resource_class = 'approval'
       and g.resource_id = v_approval.id
       and v_approval.required_resolver_action = any(g.actions)
       and g.policy_version = v_approval.policy_version
       and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
  ) then
    raise exception 'approval_resolver_grant_denied';
  end if;

  if p_resolution = 'approved' then
    select * into v_registered
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
      );
  end if;

  update approvals
     set status = p_resolution,
         resolution = p_resolution,
         resolved_by_principal_id = p_resolver_principal_id,
         resolved_by_role = v_role,
         resolution_channel = p_channel,
         resolved_at = now(),
         approval_version = approval_version + 1,
         execution_state = case when p_resolution = 'approved' then 'not_started' else 'cancelled' end,
         updated_at = now()
   where id = v_approval.id
  returning * into v_approval;

  return query select v_approval.id, v_approval.assignment_id, v_approval.resolution,
    v_approval.resolved_by_role, v_approval.command_intent_id, v_approval.command_id,
    v_approval.effect_key, false;
end;
$$;

-- --------------------------------------------------------------------------
-- Execution revalidation and receipt linkage
-- --------------------------------------------------------------------------

create or replace function assert_approved_action_execution(
  p_approval_id text,
  p_action_key text,
  p_resource_class text,
  p_resource_id text,
  p_current_snapshot_hash text
)
returns setof approvals
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_approval approvals%rowtype;
  v_snapshot_hash text;
begin
  select * into v_approval from approvals where id = p_approval_id;
  if v_approval.id is null or v_approval.status <> 'approved' or v_approval.resolution <> 'approved' then
    raise exception 'approval_not_approved';
  end if;
  if v_approval.revoked_at is not null or v_approval.expires_at <= now() then
    raise exception 'approval_revoked_or_expired';
  end if;
  if v_approval.action_key <> p_action_key
     or v_approval.resource_class <> p_resource_class
     or v_approval.resource_id <> p_resource_id then
    raise exception 'approval_execution_scope_mismatch';
  end if;

  v_snapshot_hash := amtech_approval_snapshot_hash(amtech_approval_snapshot(
    v_approval.assignment_id, v_approval.action_key,
    v_approval.resource_class, v_approval.resource_id
  ));
  if v_snapshot_hash <> v_approval.snapshot_hash
     or p_current_snapshot_hash <> v_approval.snapshot_hash then
    raise exception 'approval_snapshot_changed';
  end if;

  if not exists (
    select 1 from assignment_principals ap
     where ap.assignment_id = v_approval.assignment_id
       and ap.principal_id = v_approval.resolved_by_principal_id
       and ap.principal_class = 'human'
       and ap.role = v_approval.resolved_by_role
       and ap.role = any(v_approval.required_resolver_roles)
       and ap.policy_version = v_approval.policy_version
       and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
  ) then
    raise exception 'approval_resolver_role_revoked';
  end if;
  if not exists (
    select 1 from assignment_resource_grants g
     where g.assignment_id = v_approval.assignment_id
       and (g.principal_id is null or g.principal_id = v_approval.resolved_by_principal_id)
       and g.resource_class = 'approval'
       and g.resource_id = v_approval.id
       and v_approval.required_resolver_action = any(g.actions)
       and g.policy_version = v_approval.policy_version
       and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
  ) then
    raise exception 'approval_resolver_grant_revoked';
  end if;
  if not exists (
    select 1 from assignment_authority_policies p
     where p.assignment_id = v_approval.assignment_id
       and p.policy_version = v_approval.policy_version
       and p.action = v_approval.action_key
       and p.required_roles = v_approval.required_resolver_roles
       and p.status = 'active'
  ) then
    raise exception 'approval_policy_changed';
  end if;

  return next v_approval;
end;
$$;

create or replace function record_approval_execution_receipt(
  p_approval_id text,
  p_receipt_id text
)
returns setof approvals
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_approval approvals%rowtype;
  v_receipt effect_receipts%rowtype;
begin
  select * into v_approval from approvals where id = p_approval_id for update;
  if v_approval.id is null then raise exception 'approval_not_found'; end if;
  select * into v_receipt from effect_receipts where id = p_receipt_id;
  if v_receipt.id is null
     or v_receipt.assignment_id <> v_approval.assignment_id
     or v_receipt.command_id <> v_approval.command_id
     or v_receipt.effect_key <> v_approval.effect_key then
    raise exception 'approval_receipt_scope_mismatch';
  end if;
  if v_approval.execution_receipt_id is not null and v_approval.execution_receipt_id <> p_receipt_id then
    raise exception 'approval_execution_receipt_conflict';
  end if;

  update approvals
     set execution_receipt_id = p_receipt_id,
         execution_state = case v_receipt.state
           when 'accepted' then 'succeeded'
           when 'failed' then 'failed'
           when 'ambiguous' then 'ambiguous'
         end,
         updated_at = now()
   where id = p_approval_id
  returning * into v_approval;
  return next v_approval;
end;
$$;

-- Authority-defining fields cannot drift after promotion.
create or replace function amtech_approval_immutable_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.status <> 'legacy' and (
    new.assignment_id is distinct from old.assignment_id
    or new.account_id is distinct from old.account_id
    or new.employee_id is distinct from old.employee_id
    or new.requester_principal_id is distinct from old.requester_principal_id
    or new.requester_principal_class is distinct from old.requester_principal_class
    or new.action_key is distinct from old.action_key
    or new.resource_class is distinct from old.resource_class
    or new.resource_id is distinct from old.resource_id
    or new.snapshot is distinct from old.snapshot
    or new.snapshot_hash is distinct from old.snapshot_hash
    or new.policy_version is distinct from old.policy_version
    or new.required_resolver_roles is distinct from old.required_resolver_roles
    or new.required_resolver_action is distinct from old.required_resolver_action
    or new.command_intent_id is distinct from old.command_intent_id
    or new.command_id is distinct from old.command_id
    or new.effect_key is distinct from old.effect_key
  ) then
    raise exception 'approval_immutable_authority_changed';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_immutable_guard on approvals;
create trigger approval_immutable_guard
before update on approvals
for each row execute function amtech_approval_immutable_guard();

alter table approvals enable row level security;
revoke insert, update, delete on approvals from anon, authenticated;
revoke all on function create_approval_authority_request(text,text,text,text,text,text,text,text,text,text,text,text,timestamptz,text,text,text) from public, anon, authenticated;
revoke all on function resolve_approval_authority(text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function assert_approved_action_execution(text,text,text,text,text) from public, anon, authenticated;
revoke all on function record_approval_execution_receipt(text,text) from public, anon, authenticated;
grant execute on function create_approval_authority_request(text,text,text,text,text,text,text,text,text,text,text,text,timestamptz,text,text,text) to service_role;
grant execute on function resolve_approval_authority(text,text,text,text,text,text) to service_role;
grant execute on function assert_approved_action_execution(text,text,text,text,text) to service_role;
grant execute on function record_approval_execution_receipt(text,text) to service_role;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values
  ('approval:immutable-request','table','approvals immutable authority request','Lane 2','explicit_assignment','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee','mutable_header_identity'],
   array['principal-bound-requester','immutable-snapshot-hash','policy-version-and-resolver-grant'],
   'packages/db/migrations/0048_approval_authority_and_execution.sql',
   'Approval request binds exact assignment, resource snapshot, resolver policy, and predetermined C3 identity.'),
  ('approval:atomic-resolution','manager_route','resolve_approval authority RPC','Lane 2','assignment_resolver','C3',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee','mutable_header_identity'],
   array['human-principal-current-role','atomic-single-terminal-decision','approved-command-registration'],
   'packages/db/migrations/0048_approval_authority_and_execution.sql',
   'Human resolution locks the request, revalidates policy/grant/snapshot, and registers one C3 command.'),
  ('approval:approved-execution','manager_route','approved provider action execution','Lane 2','explicit_assignment','C3',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee','mutable_header_identity'],
   array['snapshot-revalidation','resolver-revocation-denial','effect-receipt-linked-to-approval'],
   'packages/db/migrations/0048_approval_authority_and_execution.sql',
   'Provider consumers execute only the immutable approved snapshot through its exact command/effect and receipt.')
on conflict (key) do update set
  surface_category = excluded.surface_category,
  subject = excluded.subject,
  lane_owner = excluded.lane_owner,
  scope_requirement = excluded.scope_requirement,
  authorization_contract = excluded.authorization_contract,
  customer_consequential = excluded.customer_consequential,
  enabled = excluded.enabled,
  denied_authorizers = excluded.denied_authorizers,
  required_evidence = excluded.required_evidence,
  source_ref = excluded.source_ref,
  notes = excluded.notes,
  updated_at = now();

commit;
