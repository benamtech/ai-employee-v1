-- ============================================================================
-- AMTECH Phase 2 — assignment scope and release-evidence spine
--
-- Lane 1: make the consequential-surface inventory durable and add nullable
-- assignment columns to existing customer-work rows where the table already
-- exists. Columns are nullable because ambiguous compatibility backfills must be
-- reviewed rather than silently promoted.
--
-- Lane 10: create immutable release-evidence manifest tables so CI, staging,
-- provider, browser/channel, commercial, capacity, rollback, and public-claim
-- gates bind to one exact SHA instead of stale prose or cross-SHA artifacts.
-- ============================================================================

create table if not exists assignment_scope_registry (
  key                    text primary key,
  surface_category       text not null check (surface_category in (
                           'table','manager_route','sms_path','signed_resource',
                           'connector_binding','owner_session','admin_support_action',
                           'commercial_row','service_worker','public_claim'
                         )),
  subject                text not null,
  lane_owner             text not null,
  scope_requirement      text not null check (scope_requirement in (
                           'explicit_assignment','assignment_resolver',
                           'approved_platform_context','approved_system_context',
                           'noncanonical_diagnostic'
                         )),
  authorization_contract text not null check (authorization_contract in ('C1','C2','C3','C4','C5','C6')),
  customer_consequential boolean not null default true,
  enabled                boolean not null default true,
  denied_authorizers     text[] not null,
  required_evidence      text[] not null,
  source_ref             text not null,
  notes                  text not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (cardinality(denied_authorizers) > 0),
  check (cardinality(required_evidence) > 0),
  check (not (enabled and customer_consequential and scope_requirement = 'noncanonical_diagnostic')),
  check (surface_category <> 'commercial_row' or scope_requirement = 'explicit_assignment')
);

insert into assignment_scope_registry
  (key, surface_category, subject, lane_owner, scope_requirement, authorization_contract,
   customer_consequential, enabled, denied_authorizers, required_evidence, source_ref, notes)
values
  ('table:employees','table','employees','Lane 1','assignment_resolver','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['cross-employee-denial','revocation-denial-le-60s','assignment-compatible-backfill'],
   'owner dashboard/runtime compatibility resolver','employee_id remains identity; assignment resolver owns access.'),
  ('table:employee_messages','table','employee_messages','Lane 1','assignment_resolver','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['wrong-employee-message-denial','signed-preview-scope-denial','sms-web-continuity'],
   'apps/manager/src/server.ts','message write/read resolves through visible assignment.'),
  ('table:artifacts','table','artifacts','Lane 8','assignment_resolver','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','signed_payload_without_resource_lookup'],
   array['artifact-wrong-employee-denial','artifact-link-revocation','storage-signed-url-scope'],
   'artifact resolve and materialization','artifact access requires durable resource lookup and assignment match.'),
  ('signed:preview-links','signed_resource','preview_links','Lane 2','assignment_resolver','C2',true,true,
   array['signed_payload_without_resource_lookup','bearer_possession_only','caller_selected_account_or_employee'],
   array['wrong-action-denial','terminal-single-consume','preview-resource-cross-assignment-denial'],
   'MANAGER_API.previewResolve/action','signed payload is never sufficient without durable row/resource lookup.'),
  ('session:owner-web','owner_session','owner_web_sessions','Lane 2','assignment_resolver','C2',true,true,
   array['bearer_possession_only','account_membership_only','caller_selected_account_or_employee'],
   array['revoked-session-denial','role-change-denial-le-60s','multi-account-session-isolation'],
   'lib/owner-session.ts','session authenticates principal; assignment relationship authorizes resource.'),
  ('route:owner-dashboard','manager_route','MANAGER_API.ownerDashboard','Lane 1','assignment_resolver','C2',true,true,
   array['account_membership_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['dashboard-cross-assignment-filter','revoked-assignment-hidden','multi-employee-isolation'],
   'apps/manager/src/server.ts','dashboard listing is an assignment projection, not account-wide leakage.'),
  ('sms:twilio-inbound-owner-turn','sms_path','Twilio inbound owner turn','Lane 6','assignment_resolver','C5',true,true,
   array['phone_number_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['twilio-signature-denial','wrong-phone-assignment-denial','revoked-channel-denial'],
   'apps/manager/src/webhooks/twilio.ts','phone possession alone cannot select employee or assignment.'),
  ('connector:gmail','connector_binding','Gmail watches and inbound events','Lane 6','assignment_resolver','C5',true,true,
   array['account_membership_only','caller_selected_account_or_employee','bearer_possession_only'],
   array['unverified-provider-denial','cross-assignment-connector-denial','duplicate-provider-event-idempotent'],
   'apps/manager/src/webhooks/gmail.ts','connector custody is assignment/resource scoped before business processing.'),
  ('admin:account-detail','admin_support_action','/manager/admin/accounts/:accountId','Lane 2','approved_platform_context','C2',true,true,
   array['mutable_header_identity','account_membership_only','bearer_possession_only'],
   array['support-reason-required','support-role-denial','customer-access-audit'],
   'apps/manager/src/server.ts','customer support access requires independent platform authority and support reason.'),
  ('worker:scheduler-run','service_worker','scheduled work consumers','Lane 7','approved_system_context','C3',true,true,
   array['caller_selected_account_or_employee','bearer_possession_only','mutable_header_identity'],
   array['system-context-audit','assignment-per-work-item','restart-no-duplicate-effect'],
   'scheduler runner','system-authenticated scheduler still needs assignment per customer work item.'),
  ('commercial:relationships','commercial_row','commercial_relationships','Lane 5','explicit_assignment','C1',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['payer-beneficiary-split','commercial-cross-assignment-denial','invoice-reconciliation'],
   'packages/db/migrations/0039_labor_relationship_authorization_foundation.sql','payer and beneficiary are assignment relationships.'),
  ('public:estimator','public_claim','public estimator and prod-like estimator scripts','Lane 10','noncanonical_diagnostic','C6',false,false,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['must-not-enter-release-proof','public-claim-consistency'],
   'CODEGRAPH.md','public estimator is non-canonical diagnostic/acquisition surface only.')
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

create or replace function amtech_default_assignment_for_employee_account(
  p_employee_id text,
  p_account_id text
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ea.id
    from employee_principals ep
    join employee_assignments ea on ea.employee_principal_id = ep.id
   where ep.employee_id = p_employee_id
     and ea.account_id = p_account_id
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
   order by ea.created_at asc
   limit 1
$$;

revoke all on function amtech_default_assignment_for_employee_account(text,text) from public;
grant execute on function amtech_default_assignment_for_employee_account(text,text) to authenticated, service_role;

do $$
declare
  scope_table text;
begin
  foreach scope_table in array array[
    'employee_messages',
    'employee_sessions',
    'runtime_endpoints',
    'artifacts',
    'artifact_links',
    'preview_links',
    'approvals',
    'owner_web_sessions',
    'mcp_credentials',
    'audit_log',
    'work_events',
    'meter_events',
    'usage_rollups',
    'budget_policies',
    'gmail_watches',
    'inbound_email_events',
    'stripe_connections',
    'stripe_invoices',
    'qbo_pending_writes',
    'inbound_qbo_events'
  ] loop
    if to_regclass(format('public.%I', scope_table)) is not null then
      execute format(
        'alter table public.%I add column if not exists assignment_id text references employee_assignments(id) on delete restrict',
        scope_table
      );
      execute format(
        'create index if not exists %I on public.%I(assignment_id) where assignment_id is not null',
        left(scope_table || '_assignment_id_idx', 63),
        scope_table
      );
    end if;
  end loop;
end $$;

do $$
declare
  scope_table text;
begin
  foreach scope_table in array array[
    'employee_messages',
    'employee_sessions',
    'runtime_endpoints',
    'artifacts',
    'approvals',
    'audit_log',
    'work_events',
    'meter_events'
  ] loop
    if to_regclass(format('public.%I', scope_table)) is not null
       and exists (
         select 1 from information_schema.columns
          where table_schema = 'public' and table_name = scope_table and column_name = 'employee_id'
       )
       and exists (
         select 1 from information_schema.columns
          where table_schema = 'public' and table_name = scope_table and column_name = 'account_id'
       ) then
      execute format($sql$
        update public.%I target
           set assignment_id = amtech_default_assignment_for_employee_account(target.employee_id, target.account_id)
         where target.assignment_id is null
           and amtech_default_assignment_for_employee_account(target.employee_id, target.account_id) is not null
      $sql$, scope_table);
    end if;
  end loop;
end $$;

create table if not exists release_evidence_manifests (
  id                 text primary key,
  repository         text not null,
  branch             text not null,
  commit_sha         text not null check (commit_sha ~ '^[a-f0-9]{40}$'),
  schema_version     text not null default 'release-evidence-v1',
  public_claim_state text not null check (public_claim_state in (
                       'not_launch_cleared','source_and_ci_only','staging_accepted','production_ready'
                     )),
  generator          text not null,
  generated_at       timestamptz not null,
  manifest_digest    text not null,
  redaction_state    text not null check (redaction_state in ('not_secret','redacted')),
  created_at         timestamptz not null default now(),
  unique (repository, branch, commit_sha, manifest_digest)
);

create table if not exists release_evidence_gates (
  id              text primary key,
  manifest_id     text not null references release_evidence_manifests(id) on delete cascade,
  gate            text not null,
  status          text not null,
  evidence_id     text,
  evidence_sha    text not null check (evidence_sha ~ '^[a-f0-9]{40}$'),
  source          text not null,
  redaction_state text not null check (redaction_state in ('not_secret','redacted')),
  generated_at    timestamptz not null,
  notes           text not null,
  created_at      timestamptz not null default now(),
  unique (manifest_id, gate)
);

create or replace function amtech_release_evidence_gate_sha_guard()
returns trigger
language plpgsql
as $$
declare
  manifest_sha text;
begin
  select commit_sha into manifest_sha
    from release_evidence_manifests
   where id = new.manifest_id;

  if manifest_sha is null then
    raise exception 'release evidence manifest % not found', new.manifest_id;
  end if;

  if new.evidence_sha <> manifest_sha then
    raise exception 'release evidence gate % sha % does not match manifest sha %', new.gate, new.evidence_sha, manifest_sha;
  end if;

  return new;
end;
$$;

drop trigger if exists release_evidence_gate_sha_guard on release_evidence_gates;
create trigger release_evidence_gate_sha_guard
before insert or update on release_evidence_gates
for each row execute function amtech_release_evidence_gate_sha_guard();
