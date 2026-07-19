begin;

-- Forward-only closure for DEF-001. Verified activation creates the assignment
-- atomically, but 0066 only inserted read/message grants for the activating owner.
-- Keep account ownership and assignment authority congruent without rewriting an
-- applied activation migration.

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

create or replace function amtech_reconcile_account_owner_assignments(p_account_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  insert into assignment_principals(
    id,
    assignment_id,
    principal_id,
    principal_class,
    role,
    status,
    starts_at,
    ends_at,
    policy_version,
    provenance
  )
  select
    'aspr_' || substr(md5('account-owner:' || ea.id || ':' || hp.id), 1, 27),
    ea.id,
    hp.id,
    'human',
    'owner',
    'active',
    now(),
    null,
    ea.policy_version,
    jsonb_build_object(
      'source', 'account_owner_reconciliation',
      'account_membership_id', am.id,
      'recordedAt', now()
    )
  from employee_assignments ea
  join account_memberships am
    on am.account_id = ea.account_id
   and am.role in ('owner','admin')
  join human_principals hp
    on hp.user_id = am.user_id
   and hp.status = 'active'
  where ea.account_id = p_account_id
    and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
  on conflict (assignment_id, principal_id, role) do update set
    status = 'active',
    starts_at = case
      when assignment_principals.status = 'active' then assignment_principals.starts_at
      else excluded.starts_at
    end,
    ends_at = null,
    policy_version = excluded.policy_version;

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

create or replace function amtech_reconcile_assignment_account_owners()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform amtech_reconcile_account_owner_assignments(new.account_id);
  return new;
end
$$;

create or replace function amtech_reconcile_account_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id text;
  v_user_id text;
  v_human_principal_id text;
  v_is_owner boolean;
begin
  if tg_op = 'DELETE' then
    v_account_id := old.account_id;
    v_user_id := old.user_id;
    v_is_owner := false;
  else
    v_account_id := new.account_id;
    v_user_id := new.user_id;
    v_is_owner := new.role in ('owner','admin');
  end if;

  select hp.id
    into v_human_principal_id
    from human_principals hp
   where hp.user_id = v_user_id;

  if v_human_principal_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if v_is_owner then
    perform amtech_reconcile_account_owner_assignments(v_account_id);
  else
    update assignment_principals ap
       set status = 'revoked',
           ends_at = greatest(coalesce(ap.ends_at, now()), ap.starts_at + interval '1 microsecond')
      from employee_assignments ea
     where ea.id = ap.assignment_id
       and ea.account_id = v_account_id
       and ap.principal_class = 'human'
       and ap.principal_id = v_human_principal_id
       and ap.role = 'owner'
       and ap.status = 'active';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end
$$;

drop trigger if exists assignment_principals_owner_surface_grant on assignment_principals;
create trigger assignment_principals_owner_surface_grant
  after insert or update of status, starts_at, ends_at, policy_version, role
  on assignment_principals
  for each row execute function amtech_sync_owner_employee_surface_grant();

-- Deferred so onboarding's explicit creator principal is inserted before the
-- account-owner reconciliation attempts the same unique assignment role.
drop trigger if exists employee_assignments_account_owner_reconciliation on employee_assignments;
create constraint trigger employee_assignments_account_owner_reconciliation
  after insert or update on employee_assignments
  deferrable initially deferred
  for each row execute function amtech_reconcile_assignment_account_owners();

drop trigger if exists account_memberships_assignment_owner_reconciliation on account_memberships;
create trigger account_memberships_assignment_owner_reconciliation
  after insert or update of role, account_id, user_id or delete
  on account_memberships
  for each row execute function amtech_reconcile_account_owner_membership();

-- Bring every existing active account owner/admin onto every current employee
-- assignment in that account. The assignment-principal trigger seeds the full
-- surface grant for inserted and conflict-updated rows.
do $$
declare
  v_account record;
begin
  for v_account in
    select distinct account_id from employee_assignments
  loop
    perform amtech_reconcile_account_owner_assignments(v_account.account_id);
  end loop;
end
$$;

-- Existing manager/operator/viewer assignment principals also retain the
-- canonical grant behavior established in 0053. A no-op policy update invokes
-- the trigger without changing authority provenance.
update assignment_principals
   set policy_version = policy_version
 where principal_class = 'human'
   and role in ('owner','manager','operator','viewer');

revoke all on function amtech_owner_employee_surface_actions() from public, anon, authenticated;
revoke all on function amtech_reconcile_account_owner_assignments(text) from public, anon, authenticated;
grant execute on function amtech_owner_employee_surface_actions() to service_role;
grant execute on function amtech_reconcile_account_owner_assignments(text) to service_role;

commit;
