begin;

-- Forward-only closure for DEF-001. Verified activation creates an explicit
-- assignment principal for the activating owner, but 0066 only inserted
-- read/message grants. Account membership remains insufficient by design: this
-- migration expands authority only for an already-explicit assignment principal.

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
    'turn:create'
  ]::text[]
$$;

create or replace function amtech_sync_owner_employee_surface_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id text;
  v_policy_version text;
  v_current boolean;
  v_ends_at timestamptz;
begin
  if new.principal_class <> 'human'
     or new.role not in ('owner','manager','operator','viewer') then
    return new;
  end if;

  select ep.employee_id, ea.policy_version
    into v_employee_id, v_policy_version
    from employee_assignments ea
    join employee_principals ep on ep.id = ea.employee_principal_id
   where ea.id = new.assignment_id;

  if v_employee_id is null then
    return new;
  end if;

  v_current := amtech_relationship_current(new.status, new.starts_at, new.ends_at);
  v_ends_at := case
    when v_current then new.ends_at
    else greatest(coalesce(new.ends_at, now()), new.starts_at + interval '1 microsecond')
  end;

  insert into assignment_resource_grants(
    id,
    assignment_id,
    principal_id,
    resource_class,
    resource_id,
    actions,
    status,
    starts_at,
    ends_at,
    policy_version,
    provenance
  ) values (
    'grant_' || substr(md5('owner_employee_surface:' || new.assignment_id || ':' || new.principal_id), 1, 26),
    new.assignment_id,
    new.principal_id,
    'employee',
    v_employee_id,
    amtech_owner_employee_surface_actions(),
    case when v_current then 'active' else 'revoked' end,
    new.starts_at,
    v_ends_at,
    v_policy_version,
    jsonb_build_object(
      'source', 'owner_activation_surface_authority',
      'assignment_principal_id', new.id,
      'recordedAt', now()
    )
  )
  on conflict (id) do update set
    actions = excluded.actions,
    status = excluded.status,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    policy_version = excluded.policy_version,
    provenance = excluded.provenance;

  return new;
end
$$;

drop trigger if exists assignment_principals_owner_surface_grant on assignment_principals;
create trigger assignment_principals_owner_surface_grant
  after insert or update of status, starts_at, ends_at, policy_version, role
  on assignment_principals
  for each row execute function amtech_sync_owner_employee_surface_grant();

-- Backfill every already-explicit human assignment relationship, including the
-- activating owner rows created earlier in the migration ledger. This does not
-- inspect account_memberships and cannot manufacture assignment authority.
update assignment_principals
   set policy_version = policy_version
 where principal_class = 'human'
   and role in ('owner','manager','operator','viewer');

revoke all on function amtech_owner_employee_surface_actions() from public, anon, authenticated;
revoke all on function amtech_sync_owner_employee_surface_grant() from public, anon, authenticated;
grant execute on function amtech_owner_employee_surface_actions() to service_role;

commit;
