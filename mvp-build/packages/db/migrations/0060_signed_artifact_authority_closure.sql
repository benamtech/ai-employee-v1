-- ============================================================================
-- AMTECH Phase 2 — S9 signed artifact authority closure
--
-- Artifact-link possession remains a credential, never authority by itself. Every
-- link carries the assignment authority version current at issuance and is revoked
-- synchronously when that assignment's authority changes.
-- ============================================================================

begin;

alter table artifact_links
  add column if not exists assignment_authority_version bigint;

update artifact_links link
   set assignment_authority_version = av.current_version
  from authority_versions av
 where av.scope_type = 'employee_assignment'
   and av.scope_id = link.assignment_id
   and link.assignment_authority_version is null;

alter table artifact_links
  drop constraint if exists artifact_links_authority_version_check,
  add constraint artifact_links_authority_version_check
    check (assignment_authority_version is not null and assignment_authority_version >= 1) not valid;

create index if not exists artifact_links_authority_version_idx
  on artifact_links(assignment_id, assignment_authority_version)
  where revoked_at is null;

create or replace function amtech_stamp_artifact_link_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.assignment_authority_version := amtech_current_authority_version(
    'employee_assignment', new.assignment_id
  );
  if new.assignment_authority_version is null then
    raise exception 'artifact_link_assignment_authority_not_current';
  end if;
  return new;
end
$$;

drop trigger if exists artifact_link_authority_stamp on artifact_links;
create trigger artifact_link_authority_stamp
  before insert on artifact_links
  for each row execute function amtech_stamp_artifact_link_authority();

create or replace function amtech_revoke_stale_assignment_consumers(
  p_assignment_id text,
  p_current_version bigint,
  p_reason text,
  p_assignment_revoked boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update employee_mcp_credentials
     set status = 'revoked',
         revoked_at = coalesce(revoked_at, now()),
         updated_at = now()
   where assignment_id = p_assignment_id
     and status = 'active'
     and revoked_at is null
     and coalesce(assignment_authority_version, 0) < p_current_version;

  update preview_links
     set revoked_at = coalesce(revoked_at, now())
   where assignment_id = p_assignment_id
     and revoked_at is null
     and consumed_at is null
     and coalesce(assignment_authority_version, 0) < p_current_version;

  update artifact_links
     set revoked_at = coalesce(revoked_at, now())
   where assignment_id = p_assignment_id
     and revoked_at is null
     and coalesce(assignment_authority_version, 0) < p_current_version;

  if p_assignment_revoked then
    update approvals
       set status = 'revoked',
           revoked_at = coalesce(revoked_at, now()),
           revocation_reason = p_reason,
           updated_at = now()
     where assignment_id = p_assignment_id
       and status = 'pending'
       and coalesce(assignment_authority_version, 0) < p_current_version;

    update connector_bindings
       set status = 'revoked',
           revoked_at = coalesce(revoked_at, now()),
           updated_at = now()
     where assignment_id = p_assignment_id
       and status in ('active','current')
       and revoked_at is null;
  end if;
end
$$;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values (
  'authority:artifact-link-version',
  'signed_resource',
  'signed artifact link assignment authority version',
  'Lane 9',
  'explicit_assignment',
  'C2',
  true,
  true,
  array['bearer_possession_only','signed_payload_without_resource_lookup','caller_selected_account_or_employee'],
  array['assignment-version-at-issue','synchronous-link-revocation','durable-artifact-and-assignment-match'],
  'packages/db/migrations/0060_signed_artifact_authority_closure.sql',
  'Signed artifact links fail closed after any security-relevant assignment authority change.'
)
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
