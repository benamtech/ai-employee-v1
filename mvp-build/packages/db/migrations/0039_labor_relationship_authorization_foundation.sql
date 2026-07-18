-- ============================================================================
-- AMTECH Phase 2 — canonical labor relationship and authorization foundation
--
-- Forward-only shadow migration. Existing account_id / employee_id columns are
-- retained as compatibility inputs. Authority moves to current assignment and
-- relationship records; no applied migration is rewritten.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Canonical relationship graph
-- --------------------------------------------------------------------------

create table organizations (
  id            text primary key,
  display_name  text not null,
  status        text not null default 'active'
                check (status in ('active','suspended','closed')),
  created_at    timestamptz not null default now()
);

create table organization_accounts (
  id               text primary key,
  organization_id  text not null references organizations(id) on delete restrict,
  account_id       text not null references accounts(id) on delete restrict,
  status           text not null default 'active'
                   check (status in ('pending','active','suspended','revoked','expired','ended')),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  provenance       jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  unique (organization_id, account_id),
  check (ends_at is null or ends_at > starts_at)
);

create table human_principals (
  id          text primary key,
  user_id     text not null unique references users(id) on delete restrict,
  status      text not null default 'active'
              check (status in ('active','suspended','disabled')),
  created_at  timestamptz not null default now()
);

create table employee_principals (
  id          text primary key,
  employee_id text not null unique references employees(id) on delete restrict,
  status      text not null default 'active'
              check (status in ('active','suspended','retired')),
  created_at  timestamptz not null default now()
);

create table employee_assignments (
  id                     text primary key,
  organization_id        text not null references organizations(id) on delete restrict,
  account_id             text not null references accounts(id) on delete restrict,
  employee_principal_id  text not null references employee_principals(id) on delete restrict,
  status                 text not null default 'active'
                         check (status in ('pending','active','suspended','revoked','expired','ended')),
  starts_at              timestamptz not null default now(),
  ends_at                timestamptz,
  policy_version         text not null,
  provenance             jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index employee_assignments_employee_idx
  on employee_assignments(employee_principal_id, status, starts_at, ends_at);
create index employee_assignments_scope_idx
  on employee_assignments(organization_id, account_id, status);

create table labor_relationships (
  id                       text primary key,
  relationship_type        text not null
                           check (relationship_type in ('employment','management','supervision','custody')),
  subject_principal_id     text not null,
  subject_principal_class  text not null
                           check (subject_principal_class in ('human','employee','service','platform')),
  organization_id          text not null references organizations(id) on delete restrict,
  account_id               text references accounts(id) on delete restrict,
  assignment_id            text references employee_assignments(id) on delete restrict,
  role                     text,
  status                   text not null default 'active'
                           check (status in ('pending','active','suspended','revoked','expired','ended')),
  starts_at                timestamptz not null default now(),
  ends_at                  timestamptz,
  policy_version           text not null,
  provenance               jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (relationship_type not in ('employment','supervision') or subject_principal_class = 'employee'),
  check (relationship_type <> 'custody' or assignment_id is not null)
);

create index labor_relationship_subject_idx
  on labor_relationships(subject_principal_id, relationship_type, status);
create index labor_relationship_assignment_idx
  on labor_relationships(assignment_id, status) where assignment_id is not null;

create table assignment_principals (
  id               text primary key,
  assignment_id    text not null references employee_assignments(id) on delete cascade,
  principal_id     text not null,
  principal_class  text not null
                   check (principal_class in ('human','employee','service','platform')),
  role             text not null
                   check (role in ('owner','manager','operator','approver','viewer','billing')),
  status           text not null default 'active'
                   check (status in ('pending','active','suspended','revoked','expired','ended')),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  policy_version   text not null,
  provenance       jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  unique (assignment_id, principal_id, role),
  check (ends_at is null or ends_at > starts_at)
);

create index assignment_principals_actor_idx
  on assignment_principals(principal_id, status, assignment_id);

create table assignment_resource_grants (
  id               text primary key,
  assignment_id    text not null references employee_assignments(id) on delete cascade,
  principal_id     text,
  resource_class   text not null,
  resource_id      text,
  actions          text[] not null,
  status           text not null default 'active'
                   check (status in ('pending','active','suspended','revoked','expired','ended')),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  policy_version   text not null,
  provenance       jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  check (cardinality(actions) > 0),
  check (ends_at is null or ends_at > starts_at)
);

create index assignment_resource_grants_lookup_idx
  on assignment_resource_grants(assignment_id, principal_id, resource_class, resource_id, status);

create table assignment_authority_policies (
  id               text primary key,
  assignment_id    text not null references employee_assignments(id) on delete cascade,
  policy_version   text not null,
  action           text not null,
  required_roles   text[] not null,
  risk_class       text not null check (risk_class in ('low','medium','high','critical')),
  step_up_required boolean not null default false,
  status           text not null default 'active'
                   check (status in ('pending','active','suspended','revoked','expired','ended')),
  created_at       timestamptz not null default now(),
  unique (assignment_id, policy_version, action),
  check (cardinality(required_roles) > 0)
);

create table commercial_relationships (
  id                 text primary key,
  assignment_id      text not null references employee_assignments(id) on delete cascade,
  relationship_type  text not null check (relationship_type in ('payer','beneficiary')),
  organization_id    text not null references organizations(id) on delete restrict,
  account_id         text references accounts(id) on delete restrict,
  status             text not null default 'active'
                     check (status in ('pending','active','suspended','revoked','expired','ended')),
  starts_at          timestamptz not null default now(),
  ends_at            timestamptz,
  provenance         jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  unique nulls not distinct (assignment_id, relationship_type, organization_id, account_id),
  check (ends_at is null or ends_at > starts_at)
);

create index commercial_relationships_assignment_idx
  on commercial_relationships(assignment_id, relationship_type, status);

create table relationship_backfill_reports (
  id               text primary key,
  migration_key    text not null,
  entity_type      text not null,
  entity_id        text not null,
  outcome          text not null check (outcome in ('backfilled','ambiguous','rejected')),
  inferred_from    jsonb not null default '{}'::jsonb,
  reviewed_at      timestamptz,
  reviewed_by      text,
  created_at       timestamptz not null default now(),
  unique (migration_key, entity_type, entity_id)
);

-- --------------------------------------------------------------------------
-- Current relationship helpers
-- --------------------------------------------------------------------------

create or replace function amtech_relationship_current(
  p_status text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_at timestamptz default now()
)
returns boolean
language sql
stable
parallel safe
as $$
  select p_status = 'active'
     and p_starts_at <= p_at
     and (p_ends_at is null or p_at < p_ends_at)
$$;

create or replace function amtech_current_human_principal_id()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select hp.id
    from human_principals hp
    join users u on u.id = hp.user_id
   where u.auth_user_id = auth.uid()
     and hp.status = 'active'
   limit 1
$$;

create or replace function amtech_assignment_launch_allowed(p_assignment_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from employee_assignments ea
      join labor_relationships lr
        on lr.subject_principal_id = ea.employee_principal_id
       and lr.subject_principal_class = 'employee'
       and lr.relationship_type = 'employment'
     where ea.id = p_assignment_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
       and amtech_relationship_current(lr.status, lr.starts_at, lr.ends_at)
       and lr.organization_id = ea.organization_id
  )
$$;

create or replace function amtech_authorized_assignment_ids(
  p_action text,
  p_resource_class text,
  p_resource_id text default null
)
returns table (assignment_id text)
language sql
stable
security definer
set search_path = public, auth
as $$
  with actor as (
    select amtech_current_human_principal_id() as principal_id
  )
  select distinct ea.id
    from actor
    join assignment_principals ap
      on ap.principal_id = actor.principal_id
     and ap.principal_class = 'human'
    join employee_assignments ea on ea.id = ap.assignment_id
   where actor.principal_id is not null
     and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
     and amtech_assignment_launch_allowed(ea.id)
     and (
       (p_resource_class in ('employee','assignment') and p_action = 'read')
       or
       (p_resource_class = 'commercial_relationship'
         and p_action = 'read'
         and ap.role in ('owner','manager','billing'))
       or exists (
         select 1
           from assignment_resource_grants g
          where g.assignment_id = ea.id
            and (g.principal_id is null or g.principal_id = actor.principal_id)
            and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
            and (g.resource_class = p_resource_class or g.resource_class = '*')
            and (g.resource_id is null or g.resource_id = p_resource_id)
            and (p_action = any(g.actions) or '*' = any(g.actions))
       )
     )
$$;

create or replace function amtech_authorize_assignment_action(
  p_assignment_id text,
  p_resource_class text,
  p_resource_id text,
  p_action text,
  p_policy_version text
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
      from amtech_authorized_assignment_ids(p_action, p_resource_class, p_resource_id) aa
     where aa.assignment_id = p_assignment_id
  )
  and exists (
    select 1
      from employee_assignments ea
     where ea.id = p_assignment_id
       and ea.policy_version = p_policy_version
  )
$$;

revoke all on function amtech_current_human_principal_id() from public;
revoke all on function amtech_assignment_launch_allowed(text) from public;
revoke all on function amtech_authorized_assignment_ids(text,text,text) from public;
revoke all on function amtech_authorize_assignment_action(text,text,text,text,text) from public;
grant execute on function amtech_current_human_principal_id() to authenticated, service_role;
grant execute on function amtech_assignment_launch_allowed(text) to authenticated, service_role;
grant execute on function amtech_authorized_assignment_ids(text,text,text) to authenticated, service_role;
grant execute on function amtech_authorize_assignment_action(text,text,text,text,text) to authenticated, service_role;

-- --------------------------------------------------------------------------
-- Deterministic compatibility backfill
-- --------------------------------------------------------------------------

insert into organizations (id, display_name, status, created_at)
select 'org_' || substr(md5(a.id), 1, 22), a.display_name, a.status, a.created_at
  from accounts a
on conflict (id) do nothing;

insert into organization_accounts
  (id, organization_id, account_id, status, starts_at, provenance, created_at)
select
  'rel_' || substr(md5('organization_account:' || a.id), 1, 22),
  'org_' || substr(md5(a.id), 1, 22),
  a.id,
  case when a.status = 'active' then 'active' else 'suspended' end,
  a.created_at,
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'accounts.id',
    'confidence', 'high',
    'recordedAt', now()
  ),
  a.created_at
from accounts a
on conflict (organization_id, account_id) do nothing;

insert into human_principals (id, user_id, status, created_at)
select
  'hpr_' || substr(md5(u.id), 1, 22),
  u.id,
  'active',
  u.created_at
from users u
on conflict (user_id) do nothing;

insert into employee_principals (id, employee_id, status, created_at)
select
  'epr_' || substr(md5(e.id), 1, 22),
  e.id,
  case when e.status = 'retired' then 'retired' else 'active' end,
  e.created_at
from employees e
on conflict (employee_id) do nothing;

insert into employee_assignments
  (id, organization_id, account_id, employee_principal_id, status, starts_at,
   policy_version, provenance, created_at)
select
  'asn_' || substr(md5('default_assignment:' || e.id), 1, 22),
  'org_' || substr(md5(e.account_id), 1, 22),
  e.account_id,
  ep.id,
  case when e.status = 'retired' then 'ended'
       when e.status = 'failed' then 'suspended'
       else 'active' end,
  e.created_at,
  'assignment-v1',
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'employees.account_id',
    'confidence', 'high',
    'recordedAt', now()
  ),
  e.created_at
from employees e
join employee_principals ep on ep.employee_id = e.id
where not exists (
  select 1 from employee_assignments ea
   where ea.employee_principal_id = ep.id
     and ea.account_id = e.account_id
     and ea.provenance ->> 'sourceRef' = 'employees.account_id'
);

insert into labor_relationships
  (id, relationship_type, subject_principal_id, subject_principal_class,
   organization_id, account_id, assignment_id, role, status, starts_at,
   policy_version, provenance, created_at)
select
  'rel_' || substr(md5('employment:' || e.id), 1, 22),
  'employment',
  ep.id,
  'employee',
  ea.organization_id,
  e.account_id,
  ea.id,
  'employee',
  ea.status,
  e.created_at,
  'labor-v1',
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'employees.account_id',
    'confidence', 'high',
    'recordedAt', now()
  ),
  e.created_at
from employees e
join employee_principals ep on ep.employee_id = e.id
join employee_assignments ea
  on ea.employee_principal_id = ep.id
 and ea.account_id = e.account_id
on conflict (id) do nothing;

insert into assignment_principals
  (id, assignment_id, principal_id, principal_class, role, status, starts_at,
   policy_version, provenance, created_at)
select
  'aspr_' || substr(md5(ea.id || ':' || hp.id || ':' || m.role), 1, 21),
  ea.id,
  hp.id,
  'human',
  case m.role
    when 'owner' then 'owner'
    when 'admin' then 'manager'
    else 'operator'
  end,
  'active',
  greatest(m.created_at, ea.starts_at),
  'authorization-v1',
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'account_memberships',
    'confidence', 'medium',
    'recordedAt', now()
  ),
  greatest(m.created_at, ea.created_at)
from account_memberships m
join human_principals hp on hp.user_id = m.user_id
join employee_assignments ea on ea.account_id = m.account_id
on conflict (assignment_id, principal_id, role) do nothing;

insert into assignment_resource_grants
  (id, assignment_id, principal_id, resource_class, resource_id, actions,
   status, starts_at, policy_version, provenance, created_at)
select
  'grant_' || substr(md5(ap.id || ':employee:read'), 1, 20),
  ap.assignment_id,
  ap.principal_id,
  'employee',
  null,
  array['read'],
  ap.status,
  ap.starts_at,
  ap.policy_version,
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'assignment_principals',
    'confidence', 'high',
    'recordedAt', now()
  ),
  ap.created_at
from assignment_principals ap
where ap.principal_class = 'human'
  and not exists (
    select 1 from assignment_resource_grants g
     where g.assignment_id = ap.assignment_id
       and g.principal_id = ap.principal_id
       and g.resource_class = 'employee'
       and g.resource_id is null
  );

insert into assignment_authority_policies
  (id, assignment_id, policy_version, action, required_roles, risk_class,
   step_up_required, status, created_at)
select
  'apol_' || substr(md5(ea.id || ':default-approval'), 1, 19),
  ea.id,
  'authorization-v1',
  'approve_consequential_action',
  array['owner','manager','approver'],
  'high',
  true,
  'active',
  ea.created_at
from employee_assignments ea
on conflict (assignment_id, policy_version, action) do nothing;

insert into commercial_relationships
  (id, assignment_id, relationship_type, organization_id, account_id, status,
   starts_at, provenance, created_at)
select
  'crel_' || substr(md5(ea.id || ':payer'), 1, 19),
  ea.id,
  'payer',
  ea.organization_id,
  ea.account_id,
  ea.status,
  ea.starts_at,
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'employee_assignments.account_id',
    'confidence', 'high',
    'recordedAt', now()
  ),
  ea.created_at
from employee_assignments ea
on conflict (assignment_id, relationship_type, organization_id, account_id) do nothing;

insert into commercial_relationships
  (id, assignment_id, relationship_type, organization_id, account_id, status,
   starts_at, provenance, created_at)
select
  'crel_' || substr(md5(ea.id || ':beneficiary'), 1, 19),
  ea.id,
  'beneficiary',
  ea.organization_id,
  ea.account_id,
  ea.status,
  ea.starts_at,
  jsonb_build_object(
    'source', 'backfill_inferred',
    'sourceRef', 'employee_assignments.account_id',
    'confidence', 'high',
    'recordedAt', now()
  ),
  ea.created_at
from employee_assignments ea
on conflict (assignment_id, relationship_type, organization_id, account_id) do nothing;

insert into relationship_backfill_reports
  (id, migration_key, entity_type, entity_id, outcome, inferred_from)
select
  'rel_' || substr(md5('0039:employee:' || e.id), 1, 22),
  '0039_labor_relationship_authorization_foundation',
  'employee',
  e.id,
  'backfilled',
  jsonb_build_object(
    'account_id', e.account_id,
    'employee_principal_id', ep.id,
    'assignment_id', ea.id,
    'organization_id', ea.organization_id
  )
from employees e
join employee_principals ep on ep.employee_id = e.id
join employee_assignments ea
  on ea.employee_principal_id = ep.id
 and ea.account_id = e.account_id
on conflict (migration_key, entity_type, entity_id) do nothing;

-- Refuse to complete if any legacy account/employee row failed deterministic backfill.
do $$
begin
  if exists (
    select 1 from accounts a
     where not exists (
       select 1 from organization_accounts oa where oa.account_id = a.id
     )
  ) then
    raise exception '0039 ambiguous account backfill';
  end if;

  if exists (
    select 1 from users u
     where not exists (
       select 1 from human_principals hp where hp.user_id = u.id
     )
  ) then
    raise exception '0039 ambiguous human principal backfill';
  end if;

  if exists (
    select 1 from employees e
     where not exists (
       select 1
         from employee_principals ep
         join employee_assignments ea on ea.employee_principal_id = ep.id
        where ep.employee_id = e.id
     )
  ) then
    raise exception '0039 ambiguous employee assignment backfill';
  end if;
end $$;

-- --------------------------------------------------------------------------
-- Assignment-aware browser policies
-- --------------------------------------------------------------------------

alter table organizations enable row level security;
alter table organization_accounts enable row level security;
alter table human_principals enable row level security;
alter table employee_principals enable row level security;
alter table labor_relationships enable row level security;
alter table employee_assignments enable row level security;
alter table assignment_principals enable row level security;
alter table assignment_resource_grants enable row level security;
alter table assignment_authority_policies enable row level security;
alter table commercial_relationships enable row level security;
alter table users enable row level security;
alter table account_memberships enable row level security;

create policy users_self_sel on users for select to authenticated
using (auth_user_id = auth.uid());

create policy account_memberships_self_sel on account_memberships for select to authenticated
using (
  exists (
    select 1 from users u
     where u.id = account_memberships.user_id
       and u.auth_user_id = auth.uid()
  )
);

create policy human_principals_self_sel on human_principals for select to authenticated
using (id = amtech_current_human_principal_id());

create policy organizations_assignment_sel on organizations for select to authenticated
using (
  exists (
    select 1
      from employee_assignments ea
      join amtech_authorized_assignment_ids('read','assignment',ea.id) aa
        on aa.assignment_id = ea.id
     where ea.organization_id = organizations.id
  )
);

create policy organization_accounts_assignment_sel on organization_accounts for select to authenticated
using (
  exists (
    select 1
      from employee_assignments ea
      join amtech_authorized_assignment_ids('read','assignment',ea.id) aa
        on aa.assignment_id = ea.id
     where ea.organization_id = organization_accounts.organization_id
       and ea.account_id = organization_accounts.account_id
  )
);

create policy employee_assignments_authorized_sel on employee_assignments for select to authenticated
using (
  id in (select assignment_id from amtech_authorized_assignment_ids('read','assignment',id))
);

create policy assignment_principals_authorized_sel on assignment_principals for select to authenticated
using (
  assignment_id in (
    select assignment_id from amtech_authorized_assignment_ids('read','assignment',assignment_id)
  )
);

create policy assignment_resource_grants_authorized_sel on assignment_resource_grants for select to authenticated
using (
  assignment_id in (
    select assignment_id from amtech_authorized_assignment_ids('read','assignment',assignment_id)
  )
);

create policy assignment_authority_policies_authorized_sel on assignment_authority_policies for select to authenticated
using (
  assignment_id in (
    select assignment_id from amtech_authorized_assignment_ids('read','assignment',assignment_id)
  )
);

create policy employee_principals_authorized_sel on employee_principals for select to authenticated
using (
  exists (
    select 1
      from employee_assignments ea
      join amtech_authorized_assignment_ids('read','employee',employee_principals.employee_id) aa
        on aa.assignment_id = ea.id
     where ea.employee_principal_id = employee_principals.id
  )
);

create policy labor_relationships_authorized_sel on labor_relationships for select to authenticated
using (
  (assignment_id is not null and assignment_id in (
    select assignment_id from amtech_authorized_assignment_ids('read','assignment',assignment_id)
  ))
  or exists (
    select 1
      from employee_assignments ea
      join employee_principals ep on ep.id = ea.employee_principal_id
      join amtech_authorized_assignment_ids('read','employee',ep.employee_id) aa
        on aa.assignment_id = ea.id
     where ep.id = labor_relationships.subject_principal_id
  )
);

create policy commercial_relationships_authorized_sel on commercial_relationships for select to authenticated
using (
  assignment_id in (
    select assignment_id
      from amtech_authorized_assignment_ids('read','commercial_relationship',id)
  )
);

grant select on organizations, organization_accounts, human_principals,
  employee_principals, labor_relationships, employee_assignments,
  assignment_principals, assignment_resource_grants,
  assignment_authority_policies, commercial_relationships
  to authenticated;

-- Replace account-wide employee/account visibility with assignment-aware scope.
drop policy if exists employees_sel on employees;
create policy employees_assignment_sel on employees for select to authenticated
using (
  exists (
    select 1
      from employee_principals ep
      join employee_assignments ea on ea.employee_principal_id = ep.id
      join amtech_authorized_assignment_ids('read','employee',employees.id) aa
        on aa.assignment_id = ea.id
     where ep.employee_id = employees.id
  )
);

drop policy if exists accounts_sel on accounts;
create policy accounts_assignment_sel on accounts for select to authenticated
using (
  exists (
    select 1
      from employee_assignments ea
      join amtech_authorized_assignment_ids('read','assignment',ea.id) aa
        on aa.assignment_id = ea.id
     where ea.account_id = accounts.id
  )
);

-- Legacy helper remains for compatibility reads only. It is no longer used by
-- account or employee authorization policies and must not be used by new code.
comment on function amtech_account_ids() is
  'Legacy compatibility helper. New authorization must use current assignment relationships.';
