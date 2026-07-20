begin;

-- Forward-only S10.1 correction: migrations 0058 seeded existing authority
-- entities and installed update-time invalidation, but principals/assignments
-- created later require an initial durable authority version at insert time.

create or replace function amtech_seed_human_principal_authority_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into authority_versions(
    scope_type,
    scope_id,
    current_version,
    revoked_at,
    reason,
    updated_at
  ) values (
    'human_principal',
    new.id,
    greatest(1, coalesce(new.session_version, 1))::bigint,
    case
      when new.status not in ('active','current') or new.credentials_revoked_at is not null
        then coalesce(new.credentials_revoked_at, now())
      else null
    end,
    'insert:human_principal',
    now()
  )
  on conflict (scope_type, scope_id) do nothing;
  return new;
end
$$;

create or replace function amtech_seed_employee_assignment_authority_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into authority_versions(
    scope_type,
    scope_id,
    current_version,
    revoked_at,
    reason,
    updated_at
  ) values (
    'employee_assignment',
    new.id,
    1,
    case
      when amtech_relationship_current(new.status, new.starts_at, new.ends_at)
        then null
      else now()
    end,
    'insert:employee_assignment',
    now()
  )
  on conflict (scope_type, scope_id) do nothing;
  return new;
end
$$;

drop trigger if exists human_principal_authority_seed on human_principals;
create trigger human_principal_authority_seed
  after insert on human_principals
  for each row execute function amtech_seed_human_principal_authority_on_insert();

drop trigger if exists employee_assignment_authority_seed on employee_assignments;
create trigger employee_assignment_authority_seed
  after insert on employee_assignments
  for each row execute function amtech_seed_employee_assignment_authority_on_insert();

insert into authority_versions(
  scope_type,
  scope_id,
  current_version,
  revoked_at,
  reason,
  updated_at
)
select
  'human_principal',
  hp.id,
  greatest(1, coalesce(hp.session_version, 1))::bigint,
  case
    when hp.status not in ('active','current') or hp.credentials_revoked_at is not null
      then coalesce(hp.credentials_revoked_at, now())
    else null
  end,
  'backfill:human_principal_insert_seed',
  now()
from human_principals hp
on conflict (scope_type, scope_id) do nothing;

insert into authority_versions(
  scope_type,
  scope_id,
  current_version,
  revoked_at,
  reason,
  updated_at
)
select
  'employee_assignment',
  ea.id,
  1,
  case
    when amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
      then null
    else now()
  end,
  'backfill:employee_assignment_insert_seed',
  now()
from employee_assignments ea
on conflict (scope_type, scope_id) do nothing;

commit;
