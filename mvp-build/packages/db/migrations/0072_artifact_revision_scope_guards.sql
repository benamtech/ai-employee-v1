begin;

-- Application compare-and-swap prevents ordinary stale writes. These triggers add
-- the durable cross-row tenant/assignment invariant so a malformed service-role
-- write cannot bind a revision, parent, validation, or head from another artifact.
create or replace function amtech_assert_artifact_revision_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
      from artifacts a
     where a.id = new.artifact_id
       and a.assignment_id = new.assignment_id
       and a.account_id = new.account_id
       and a.employee_id = new.employee_id
  ) then
    raise exception 'artifact_revision_scope_mismatch';
  end if;

  if new.parent_revision_id is not null and not exists (
    select 1
      from artifact_revisions parent
     where parent.id = new.parent_revision_id
       and parent.artifact_id = new.artifact_id
       and parent.assignment_id = new.assignment_id
       and parent.account_id = new.account_id
       and parent.employee_id = new.employee_id
       and parent.revision_number < new.revision_number
  ) then
    raise exception 'artifact_parent_revision_scope_mismatch';
  end if;

  return new;
end;
$$;

create or replace function amtech_assert_artifact_validation_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
      from artifact_revisions revision
     where revision.id = new.revision_id
       and revision.artifact_id = new.artifact_id
       and revision.assignment_id = new.assignment_id
  ) then
    raise exception 'artifact_validation_scope_mismatch';
  end if;
  return new;
end;
$$;

create or replace function amtech_assert_artifact_current_revision_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.current_revision_id is not null and not exists (
    select 1
      from artifact_revisions revision
     where revision.id = new.current_revision_id
       and revision.artifact_id = new.id
       and revision.assignment_id = new.assignment_id
       and revision.account_id = new.account_id
       and revision.employee_id = new.employee_id
  ) then
    raise exception 'artifact_current_revision_scope_mismatch';
  end if;
  return new;
end;
$$;

revoke all on function amtech_assert_artifact_revision_scope() from public, anon, authenticated;
revoke all on function amtech_assert_artifact_validation_scope() from public, anon, authenticated;
revoke all on function amtech_assert_artifact_current_revision_scope() from public, anon, authenticated;

drop trigger if exists artifact_revisions_assert_scope on artifact_revisions;
create trigger artifact_revisions_assert_scope
before insert or update of artifact_id, assignment_id, account_id, employee_id, parent_revision_id, revision_number
on artifact_revisions
for each row execute function amtech_assert_artifact_revision_scope();

drop trigger if exists artifact_validations_assert_scope on artifact_validations;
create trigger artifact_validations_assert_scope
before insert or update of artifact_id, revision_id, assignment_id
on artifact_validations
for each row execute function amtech_assert_artifact_validation_scope();

drop trigger if exists artifacts_assert_current_revision_scope on artifacts;
create trigger artifacts_assert_current_revision_scope
before insert or update of current_revision_id, assignment_id, account_id, employee_id
on artifacts
for each row execute function amtech_assert_artifact_current_revision_scope();

-- Refuse to install a guard over already-inconsistent data.
do $$
begin
  if exists (
    select 1
      from artifact_revisions revision
      left join artifacts artifact
        on artifact.id = revision.artifact_id
       and artifact.assignment_id = revision.assignment_id
       and artifact.account_id = revision.account_id
       and artifact.employee_id = revision.employee_id
     where artifact.id is null
  ) then
    raise exception 'existing_artifact_revision_scope_mismatch';
  end if;

  if exists (
    select 1
      from artifact_revisions revision
      join artifact_revisions parent on parent.id = revision.parent_revision_id
     where parent.artifact_id <> revision.artifact_id
        or parent.assignment_id <> revision.assignment_id
        or parent.account_id <> revision.account_id
        or parent.employee_id <> revision.employee_id
        or parent.revision_number >= revision.revision_number
  ) then
    raise exception 'existing_artifact_parent_revision_scope_mismatch';
  end if;

  if exists (
    select 1
      from artifact_validations validation
      left join artifact_revisions revision
        on revision.id = validation.revision_id
       and revision.artifact_id = validation.artifact_id
       and revision.assignment_id = validation.assignment_id
     where revision.id is null
  ) then
    raise exception 'existing_artifact_validation_scope_mismatch';
  end if;

  if exists (
    select 1
      from artifacts artifact
      left join artifact_revisions revision
        on revision.id = artifact.current_revision_id
       and revision.artifact_id = artifact.id
       and revision.assignment_id = artifact.assignment_id
       and revision.account_id = artifact.account_id
       and revision.employee_id = artifact.employee_id
     where artifact.current_revision_id is not null
       and revision.id is null
  ) then
    raise exception 'existing_artifact_current_revision_scope_mismatch';
  end if;
end $$;

create index if not exists artifact_revisions_scope_idx
  on artifact_revisions(artifact_id, assignment_id, account_id, employee_id, revision_number desc);
create index if not exists artifact_validations_scope_idx
  on artifact_validations(artifact_id, assignment_id, revision_id, created_at desc);

commit;
