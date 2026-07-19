begin;

-- Thin artifact history/evidence layer. `artifacts` remains the canonical identity
-- and current-head projection; these rows add immutable revisions and validation
-- evidence without introducing another workflow engine.
create table if not exists artifact_revisions (
  id text primary key,
  artifact_id text not null references artifacts(id) on delete cascade,
  assignment_id text not null references employee_assignments(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  employee_id text not null references employees(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  parent_revision_id text references artifact_revisions(id),
  payload jsonb not null default '{}'::jsonb,
  mime_type text,
  storage_ref text,
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  source_manifest jsonb not null default '{}'::jsonb,
  created_run text,
  created_by text not null default 'employee',
  created_at timestamptz not null default now(),
  unique (artifact_id, revision_number)
);

create table if not exists artifact_validations (
  id text primary key,
  artifact_id text not null references artifacts(id) on delete cascade,
  revision_id text not null references artifact_revisions(id) on delete cascade,
  assignment_id text not null references employee_assignments(id) on delete cascade,
  validator_key text not null,
  status text not null check (status in ('passed','failed','warning','skipped')),
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table artifacts add column if not exists current_revision_id text references artifact_revisions(id);
alter table artifacts add column if not exists validation_status text not null default 'unvalidated'
  check (validation_status in ('unvalidated','passed','failed','warning'));
alter table artifacts add column if not exists publication_state text not null default 'draft'
  check (publication_state in ('draft','approved','published','verified','failed','rolled_back'));
alter table artifacts add column if not exists publication_ref text;
alter table artifacts add column if not exists published_at timestamptz;
alter table artifacts add column if not exists updated_at timestamptz not null default now();

insert into artifact_revisions(
  id, artifact_id, assignment_id, account_id, employee_id, revision_number,
  payload, mime_type, storage_ref, content_sha256, source_manifest, created_run,
  created_by, created_at
)
select
  'arv_' || substr(md5(a.id || ':1'), 1, 26),
  a.id,
  a.assignment_id,
  a.account_id,
  a.employee_id,
  1,
  coalesce(a.payload, '{}'::jsonb),
  a.mime_type,
  a.storage_ref,
  encode(digest(convert_to(coalesce(a.payload, '{}'::jsonb)::text, 'UTF8'), 'sha256'), 'hex'),
  '{}'::jsonb,
  a.created_run,
  'migration_backfill',
  a.created_at
from artifacts a
where a.assignment_id is not null
on conflict (artifact_id, revision_number) do nothing;

update artifacts a
set current_revision_id = r.id,
    updated_at = greatest(a.created_at, now())
from artifact_revisions r
where r.artifact_id = a.id
  and r.revision_number = 1
  and a.current_revision_id is null;

create index if not exists artifact_revisions_artifact_created_idx
  on artifact_revisions(artifact_id, revision_number desc);
create index if not exists artifact_validations_revision_created_idx
  on artifact_validations(revision_id, created_at desc);

-- Extend the same immutable approval snapshot function used for Gmail, Stripe and
-- QuickBooks. Artifact publish approval binds the exact current revision hash and
-- validation state; a later revision invalidates the approval automatically.
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
  elsif p_resource_class = 'artifact' and p_action_key = 'publish_artifact_sandbox' then
    select jsonb_build_object(
      'schema_version', 'approval-snapshot-v1',
      'assignment_id', a.assignment_id,
      'action_key', p_action_key,
      'resource_class', p_resource_class,
      'resource_id', a.id,
      'current_revision_id', a.current_revision_id,
      'revision_number', ar.revision_number,
      'content_sha256', 'sha256:' || ar.content_sha256,
      'validation_status', a.validation_status,
      'mime_type', ar.mime_type,
      'storage_ref', ar.storage_ref,
      'source_manifest_hash', 'sha256:' || encode(digest(convert_to(ar.source_manifest::text, 'utf8'), 'sha256'), 'hex')
    ) into v_snapshot
      from artifacts a
      join artifact_revisions ar
        on ar.id = a.current_revision_id
       and ar.artifact_id = a.id
       and ar.assignment_id = a.assignment_id
     where a.id = p_resource_id
       and a.assignment_id = p_assignment_id
       and a.validation_status = 'passed';
  else
    raise exception 'unsupported_approval_resource: %/%', p_resource_class, p_action_key;
  end if;

  if v_snapshot is null then
    raise exception 'approval_resource_not_found_or_wrong_assignment';
  end if;
  return v_snapshot;
end;
$$;

insert into assignment_authority_policies(
  id, assignment_id, policy_version, action, required_roles,
  risk_class, step_up_required, status
)
select
  'apol_' || substr(md5(ea.id || ':publish_artifact_sandbox'), 1, 27),
  ea.id,
  ea.policy_version,
  'publish_artifact_sandbox',
  array['owner','manager','approver']::text[],
  'medium',
  true,
  'active'
from employee_assignments ea
where amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
on conflict (assignment_id, policy_version, action) do update set
  required_roles = excluded.required_roles,
  risk_class = excluded.risk_class,
  step_up_required = excluded.step_up_required,
  status = excluded.status;

-- Effective capability truth is an evidence report, not a projection of profile
-- YAML or host environment-key presence. One report records every dimension used
-- to decide whether a capability is actually usable by one assignment.
create table if not exists effective_capability_evidence (
  id text primary key,
  report_id text not null,
  assignment_id text not null references employee_assignments(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  employee_id text not null references employees(id) on delete cascade,
  capability_key text not null,
  advertised boolean not null default false,
  runtime_reported boolean not null default false,
  dependency_ready boolean not null default false,
  credential_ready boolean not null default false,
  network_ready boolean not null default false,
  policy_ready boolean not null default false,
  connector_ready boolean not null default true,
  live_probe_status text not null check (live_probe_status in ('passed','failed','skipped','unknown')),
  effective boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  unique (report_id, capability_key)
);

create index if not exists effective_capability_employee_checked_idx
  on effective_capability_evidence(employee_id, checked_at desc);
create index if not exists effective_capability_assignment_checked_idx
  on effective_capability_evidence(assignment_id, checked_at desc);

-- Expand only already-explicit owner/manager/operator assignment principals. The
-- existing trigger remains the grant writer and account membership alone remains
-- insufficient authority.
create or replace function amtech_owner_employee_surface_actions()
returns text[]
language sql
immutable
parallel safe
as $$
  select array[
    'read',
    'message:create',
    'stream:read',
    'materialize',
    'heartbeat',
    'turn:create',
    'connector:connect',
    'capabilities:read',
    'artifact:revise',
    'artifact:validate',
    'artifact:publish'
  ]::text[]
$$;

update assignment_principals
   set policy_version = policy_version
 where principal_class = 'human'
   and role in ('owner','manager','operator','viewer');

alter table artifact_revisions enable row level security;
alter table artifact_validations enable row level security;
alter table effective_capability_evidence enable row level security;
revoke all on artifact_revisions, artifact_validations, effective_capability_evidence from anon, authenticated;
grant select, insert, update, delete on artifact_revisions, artifact_validations, effective_capability_evidence to service_role;

revoke all on function amtech_approval_snapshot(text,text,text,text) from public, anon, authenticated;
grant execute on function amtech_approval_snapshot(text,text,text,text) to service_role;

commit;
