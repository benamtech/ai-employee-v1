-- ============================================================================
-- AMTECH Phase 2 — S2/S3 preview assignment requirement
--
-- Existing historical unscoped rows remain unreadable and cannot be promoted by
-- this migration. Every newly issued signed preview must bind one exact assignment.
-- ============================================================================

begin;

alter table preview_links
  drop constraint if exists preview_links_authority_version_check,
  add constraint preview_links_authority_version_check check (
    assignment_id is not null
    and assignment_authority_version is not null
    and assignment_authority_version >= 1
    and (
      resolver_principal_id is null
      or (resolver_authority_version is not null and resolver_authority_version >= 1)
    )
    and (
      resource_type <> 'approval'
      or (
        resolver_principal_id is not null
        and policy_version is not null
        and approval_snapshot_hash is not null
      )
    )
  ) not valid;

create or replace function amtech_stamp_preview_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignment_id is null then
    raise exception 'preview_assignment_required';
  end if;

  new.assignment_authority_version := amtech_current_authority_version(
    'employee_assignment', new.assignment_id
  );
  if new.assignment_authority_version is null then
    raise exception 'preview_assignment_authority_not_current';
  end if;

  if new.resolver_principal_id is not null then
    new.resolver_authority_version := amtech_current_authority_version(
      'human_principal', new.resolver_principal_id
    );
    if new.resolver_authority_version is null then
      raise exception 'preview_resolver_authority_not_current';
    end if;
  end if;

  if new.resource_type = 'approval' and (
    new.resolver_principal_id is null
    or new.policy_version is null
    or new.approval_snapshot_hash is null
  ) then
    raise exception 'preview_approval_authority_incomplete';
  end if;

  return new;
end
$$;

drop trigger if exists preview_authority_stamp on preview_links;
create trigger preview_authority_stamp
  before insert on preview_links
  for each row execute function amtech_stamp_preview_authority();

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values (
  'signed-resource:preview-assignment-required',
  'signed_resource',
  'all owner preview and action links',
  'Lane 1',
  'explicit_assignment',
  'C2',
  true,
  true,
  array['bearer_possession_only','signed_payload_without_resource_lookup','caller_selected_account_or_employee'],
  array['durable-preview-row','exact-assignment-id','assignment-version-at-issue','current-version-check'],
  'packages/db/migrations/0063_preview_assignment_required.sql',
  'No preview token may be minted or resolved without one durable exact assignment.'
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
