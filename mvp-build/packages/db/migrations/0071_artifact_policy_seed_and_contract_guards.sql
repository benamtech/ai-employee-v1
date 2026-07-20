begin;

-- Keep the artifact publish policy aligned with the assignment lifecycle. This is
-- the same assignment policy table consumed by immutable approval execution; it
-- is not a second authorization mechanism.
create or replace function amtech_sync_artifact_publish_policy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into assignment_authority_policies(
    id,
    assignment_id,
    policy_version,
    action,
    required_roles,
    risk_class,
    step_up_required,
    status,
    created_at
  ) values (
    'apol_' || substr(md5(new.id || ':publish_artifact_sandbox'), 1, 27),
    new.id,
    new.policy_version,
    'publish_artifact_sandbox',
    array['owner','manager','approver']::text[],
    'medium',
    true,
    case
      when amtech_relationship_current(new.status, new.starts_at, new.ends_at) then 'active'
      else 'suspended'
    end,
    now()
  )
  on conflict (assignment_id, policy_version, action) do update set
    required_roles = excluded.required_roles,
    risk_class = excluded.risk_class,
    step_up_required = excluded.step_up_required,
    status = excluded.status;
  return new;
end;
$$;

revoke all on function amtech_sync_artifact_publish_policy() from public, anon, authenticated;
grant execute on function amtech_sync_artifact_publish_policy() to service_role;

drop trigger if exists employee_assignments_sync_artifact_publish_policy on employee_assignments;
create trigger employee_assignments_sync_artifact_publish_policy
after insert or update of policy_version, status, starts_at, ends_at
on employee_assignments
for each row execute function amtech_sync_artifact_publish_policy();

-- 0069 deliberately granted an owner-facing employee surface to explicit human
-- principals, but used one action array for every role. Preserve that same grant
-- row and trigger architecture while making viewer access read-only.
create or replace function amtech_employee_surface_actions_for_role(p_role text)
returns text[]
language sql
immutable
parallel safe
as $$
  select case
    when p_role = 'viewer' then array[
      'read',
      'stream:read',
      'materialize',
      'capabilities:read'
    ]::text[]
    when p_role in ('owner','manager','operator') then array[
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
    else array['read']::text[]
  end
$$;

create or replace function amtech_owner_employee_surface_actions()
returns text[]
language sql
immutable
parallel safe
as $$
  select amtech_employee_surface_actions_for_role('owner')
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
    amtech_employee_surface_actions_for_role(new.role),
    case when v_current then 'active' else 'revoked' end,
    new.starts_at,
    v_ends_at,
    v_policy_version,
    jsonb_build_object(
      'source', 'owner_activation_surface_authority',
      'assignment_principal_id', new.id,
      'principal_role', new.role,
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
end;
$$;

revoke all on function amtech_employee_surface_actions_for_role(text) from public, anon, authenticated;
revoke all on function amtech_owner_employee_surface_actions() from public, anon, authenticated;
revoke all on function amtech_sync_owner_employee_surface_grant() from public, anon, authenticated;
grant execute on function amtech_employee_surface_actions_for_role(text) to service_role;
grant execute on function amtech_owner_employee_surface_actions() to service_role;

-- Re-run both lifecycle triggers for existing assignments and explicit human
-- principals. Viewers lose write actions; no account membership creates authority.
update employee_assignments
   set policy_version = policy_version;

update assignment_principals
   set policy_version = policy_version
 where principal_class = 'human'
   and role in ('owner','manager','operator','viewer');

commit;
