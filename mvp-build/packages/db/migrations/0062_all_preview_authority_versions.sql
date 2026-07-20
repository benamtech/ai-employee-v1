-- ============================================================================
-- AMTECH Phase 2 — S9 all signed-preview authority versions
--
-- Every assignment-bound preview link, not only approval links, carries the
-- assignment authority version current at issuance. Human-bound links also carry
-- the resolver authority version. Signature possession remains insufficient.
-- ============================================================================

begin;

update preview_links link
   set assignment_authority_version = av.current_version
  from authority_versions av
 where link.assignment_id is not null
   and av.scope_type = 'employee_assignment'
   and av.scope_id = link.assignment_id
   and link.assignment_authority_version is null;

update preview_links link
   set resolver_authority_version = av.current_version
  from authority_versions av
 where link.resolver_principal_id is not null
   and av.scope_type = 'human_principal'
   and av.scope_id = link.resolver_principal_id
   and link.resolver_authority_version is null;

alter table preview_links
  drop constraint if exists preview_links_authority_version_check,
  add constraint preview_links_authority_version_check check (
    (assignment_id is null or (
      assignment_authority_version is not null and assignment_authority_version >= 1
    ))
    and
    (resolver_principal_id is null or (
      resolver_authority_version is not null and resolver_authority_version >= 1
    ))
    and
    (resource_type <> 'approval' or (
      assignment_id is not null
      and resolver_principal_id is not null
      and policy_version is not null
      and approval_snapshot_hash is not null
    ))
  ) not valid;

create or replace function amtech_stamp_preview_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignment_id is not null then
    new.assignment_authority_version := amtech_current_authority_version(
      'employee_assignment', new.assignment_id
    );
    if new.assignment_authority_version is null then
      raise exception 'preview_assignment_authority_not_current';
    end if;
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
    new.assignment_id is null
    or new.resolver_principal_id is null
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

update assignment_scope_registry
   set subject = 'all assignment-bound signed preview credentials',
       required_evidence = array[
         'assignment-version-at-issue',
         'current-version-check',
         'synchronous-preview-revocation'
       ],
       notes = 'Every assignment-bound signed preview fails closed after assignment authority changes; human-bound links also track resolver authority.',
       source_ref = 'packages/db/migrations/0062_all_preview_authority_versions.sql',
       updated_at = now()
 where key = 'authority:approval-version';

commit;
