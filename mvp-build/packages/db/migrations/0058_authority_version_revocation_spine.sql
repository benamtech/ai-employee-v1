-- ============================================================================
-- AMTECH Phase 2 — S9 durable authority-version and revocation propagation
--
-- Forward-only. Runtime and owner credentials carry the authority version that
-- existed when they were issued. Security-relevant relationship changes bump one
-- durable version, revoke stale credentials synchronously, and emit an outbox row
-- for runtime/operations propagation. Hermes remains the runtime substrate; this
-- migration only constrains who may reach or direct it.
-- ============================================================================

begin;

create table if not exists authority_versions (
  scope_type text not null,
  scope_id text not null,
  current_version bigint not null default 1 check (current_version >= 1),
  revoked_at timestamptz,
  reason text,
  updated_at timestamptz not null default now(),
  primary key (scope_type, scope_id),
  check (scope_type in (
    'human_principal',
    'employee_assignment',
    'assignment_principal',
    'resource_grant',
    'preview_link',
    'connector_binding'
  ))
);

create table if not exists authority_revocation_outbox (
  id bigint generated always as identity primary key,
  scope_type text not null,
  scope_id text not null,
  assignment_id text references employee_assignments(id) on delete restrict,
  principal_id text,
  previous_version bigint not null check (previous_version >= 1),
  current_version bigint not null check (current_version > previous_version),
  revoked boolean not null,
  reason text not null,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  unique (scope_type, scope_id, current_version)
);

create index if not exists authority_revocation_outbox_pending_idx
  on authority_revocation_outbox(created_at, id)
  where dispatched_at is null;
create index if not exists authority_revocation_outbox_assignment_idx
  on authority_revocation_outbox(assignment_id, current_version desc)
  where assignment_id is not null;

alter table authority_versions enable row level security;
alter table authority_revocation_outbox enable row level security;
revoke all on authority_versions, authority_revocation_outbox from anon, authenticated;
grant select, insert, update on authority_versions, authority_revocation_outbox to service_role;

alter table owner_web_sessions
  add column if not exists authority_version bigint;
alter table preview_links
  add column if not exists resolver_authority_version bigint,
  add column if not exists assignment_authority_version bigint;
alter table approvals
  add column if not exists assignment_authority_version bigint;
alter table employee_mcp_credentials
  add column if not exists assignment_authority_version bigint;

insert into authority_versions(scope_type, scope_id, current_version, revoked_at, reason)
select
  'human_principal',
  hp.id,
  greatest(1, coalesce(hp.session_version, 1))::bigint,
  case
    when hp.status not in ('active','current') or hp.credentials_revoked_at is not null
      then coalesce(hp.credentials_revoked_at, now())
    else null
  end,
  'seed:human_principal'
from human_principals hp
on conflict (scope_type, scope_id) do nothing;

insert into authority_versions(scope_type, scope_id, current_version, revoked_at, reason)
select
  'employee_assignment',
  ea.id,
  1,
  case when amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at) then null else now() end,
  'seed:employee_assignment'
from employee_assignments ea
on conflict (scope_type, scope_id) do nothing;

update owner_web_sessions session
   set authority_version = av.current_version
  from authority_versions av
 where av.scope_type = 'human_principal'
   and av.scope_id = session.human_principal_id
   and session.authority_version is null;

update preview_links link
   set resolver_authority_version = principal_version.current_version,
       assignment_authority_version = assignment_version.current_version
  from authority_versions principal_version,
       authority_versions assignment_version
 where link.resource_type = 'approval'
   and principal_version.scope_type = 'human_principal'
   and principal_version.scope_id = link.resolver_principal_id
   and assignment_version.scope_type = 'employee_assignment'
   and assignment_version.scope_id = link.assignment_id
   and (
     link.resolver_authority_version is null
     or link.assignment_authority_version is null
   );

update approvals approval
   set assignment_authority_version = av.current_version
  from authority_versions av
 where av.scope_type = 'employee_assignment'
   and av.scope_id = approval.assignment_id
   and approval.assignment_authority_version is null;

update employee_mcp_credentials credential
   set assignment_authority_version = av.current_version
  from authority_versions av
 where av.scope_type = 'employee_assignment'
   and av.scope_id = credential.assignment_id
   and credential.assignment_authority_version is null;

alter table owner_web_sessions
  drop constraint if exists owner_web_sessions_authority_version_check,
  add constraint owner_web_sessions_authority_version_check
    check (authority_version is not null and authority_version >= 1) not valid;

alter table preview_links
  drop constraint if exists preview_links_authority_version_check,
  add constraint preview_links_authority_version_check check (
    resource_type <> 'approval'
    or (
      resolver_authority_version is not null and resolver_authority_version >= 1
      and assignment_authority_version is not null and assignment_authority_version >= 1
    )
  ) not valid;

alter table approvals
  drop constraint if exists approvals_assignment_authority_version_check,
  add constraint approvals_assignment_authority_version_check check (
    status = 'legacy'
    or (assignment_authority_version is not null and assignment_authority_version >= 1)
  ) not valid;

alter table employee_mcp_credentials
  drop constraint if exists employee_mcp_credentials_authority_version_check,
  add constraint employee_mcp_credentials_authority_version_check
    check (assignment_authority_version is not null and assignment_authority_version >= 1) not valid;

create index if not exists owner_web_sessions_authority_version_idx
  on owner_web_sessions(human_principal_id, authority_version)
  where revoked_at is null;
create index if not exists preview_links_authority_version_idx
  on preview_links(assignment_id, assignment_authority_version, resolver_principal_id, resolver_authority_version)
  where revoked_at is null and consumed_at is null;
create index if not exists approvals_authority_version_idx
  on approvals(assignment_id, assignment_authority_version, status);
create index if not exists employee_mcp_credentials_authority_version_idx
  on employee_mcp_credentials(assignment_id, assignment_authority_version)
  where status = 'active' and revoked_at is null;

create or replace function amtech_current_authority_version(
  p_scope_type text,
  p_scope_id text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select av.current_version
    from authority_versions av
   where av.scope_type = p_scope_type
     and av.scope_id = p_scope_id
     and av.revoked_at is null
$$;

create or replace function amtech_bump_authority_version(
  p_scope_type text,
  p_scope_id text,
  p_assignment_id text,
  p_principal_id text,
  p_revoked boolean,
  p_reason text
)
returns bigint
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_previous bigint;
  v_current bigint;
begin
  if coalesce(p_scope_id, '') = '' or coalesce(p_reason, '') = '' then
    raise exception 'authority_version_identity_incomplete';
  end if;

  insert into authority_versions(
    scope_type, scope_id, current_version, revoked_at, reason, updated_at
  ) values (
    p_scope_type, p_scope_id, 1,
    case when p_revoked then now() else null end,
    p_reason, now()
  ) on conflict (scope_type, scope_id) do nothing;

  select current_version
    into v_previous
    from authority_versions
   where scope_type = p_scope_type and scope_id = p_scope_id
   for update;

  if v_previous is null then raise exception 'authority_version_missing_after_seed'; end if;
  v_current := v_previous + 1;

  update authority_versions
     set current_version = v_current,
         revoked_at = case when p_revoked then coalesce(revoked_at, now()) else null end,
         reason = p_reason,
         updated_at = now()
   where scope_type = p_scope_type and scope_id = p_scope_id;

  insert into authority_revocation_outbox(
    scope_type, scope_id, assignment_id, principal_id,
    previous_version, current_version, revoked, reason
  ) values (
    p_scope_type, p_scope_id, p_assignment_id, p_principal_id,
    v_previous, v_current, p_revoked, p_reason
  ) on conflict (scope_type, scope_id, current_version) do nothing;

  return v_current;
end
$$;

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

  update approvals
     set status = 'revoked',
         revoked_at = coalesce(revoked_at, now()),
         revocation_reason = p_reason,
         updated_at = now()
   where assignment_id = p_assignment_id
     and status = 'pending'
     and coalesce(assignment_authority_version, 0) < p_current_version;

  if p_assignment_revoked then
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

create or replace function amtech_invalidate_assignment_authority(
  p_assignment_id text,
  p_reason text
)
returns bigint
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_assignment employee_assignments%rowtype;
  v_current bigint;
  v_revoked boolean;
begin
  select * into v_assignment
    from employee_assignments
   where id = p_assignment_id;
  if v_assignment.id is null then raise exception 'authority_assignment_missing'; end if;

  v_revoked := not amtech_relationship_current(
    v_assignment.status,
    v_assignment.starts_at,
    v_assignment.ends_at
  );
  v_current := amtech_bump_authority_version(
    'employee_assignment',
    p_assignment_id,
    p_assignment_id,
    v_assignment.employee_principal_id,
    v_revoked,
    p_reason
  );
  perform amtech_revoke_stale_assignment_consumers(
    p_assignment_id,
    v_current,
    p_reason,
    v_revoked
  );
  return v_current;
end
$$;

create or replace function amtech_human_authority_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current bigint;
  v_revoked boolean;
begin
  if new.status is not distinct from old.status
     and new.session_version is not distinct from old.session_version
     and new.credentials_revoked_at is not distinct from old.credentials_revoked_at then
    return new;
  end if;

  v_revoked := new.status not in ('active','current') or new.credentials_revoked_at is not null;
  v_current := amtech_bump_authority_version(
    'human_principal', new.id, null, new.id, v_revoked, 'human_principal_changed'
  );

  update owner_web_sessions
     set revoked_at = coalesce(revoked_at, now())
   where human_principal_id = new.id
     and revoked_at is null
     and coalesce(authority_version, 0) < v_current;

  update preview_links
     set revoked_at = coalesce(revoked_at, now())
   where resolver_principal_id = new.id
     and revoked_at is null
     and consumed_at is null
     and coalesce(resolver_authority_version, 0) < v_current;

  return new;
end
$$;

create or replace function amtech_employee_assignment_authority_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status
     and new.starts_at is not distinct from old.starts_at
     and new.ends_at is not distinct from old.ends_at
     and new.policy_version is not distinct from old.policy_version
     and new.employee_principal_id is not distinct from old.employee_principal_id then
    return new;
  end if;
  perform amtech_invalidate_assignment_authority(new.id, 'employee_assignment_changed');
  return new;
end
$$;

create or replace function amtech_assignment_principal_authority_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row assignment_principals%rowtype;
begin
  v_row := case when tg_op = 'DELETE' then old else new end;
  if tg_op = 'UPDATE'
     and new.assignment_id is not distinct from old.assignment_id
     and new.principal_id is not distinct from old.principal_id
     and new.role is not distinct from old.role
     and new.status is not distinct from old.status
     and new.starts_at is not distinct from old.starts_at
     and new.ends_at is not distinct from old.ends_at
     and new.policy_version is not distinct from old.policy_version then
    return new;
  end if;
  perform amtech_invalidate_assignment_authority(v_row.assignment_id, 'assignment_principal_changed');
  return case when tg_op = 'DELETE' then old else new end;
end
$$;

create or replace function amtech_resource_grant_authority_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row assignment_resource_grants%rowtype;
begin
  v_row := case when tg_op = 'DELETE' then old else new end;
  if tg_op = 'UPDATE'
     and new.assignment_id is not distinct from old.assignment_id
     and new.principal_id is not distinct from old.principal_id
     and new.resource_class is not distinct from old.resource_class
     and new.resource_id is not distinct from old.resource_id
     and new.actions is not distinct from old.actions
     and new.status is not distinct from old.status
     and new.starts_at is not distinct from old.starts_at
     and new.ends_at is not distinct from old.ends_at
     and new.policy_version is not distinct from old.policy_version then
    return new;
  end if;
  perform amtech_invalidate_assignment_authority(v_row.assignment_id, 'assignment_resource_grant_changed');
  return case when tg_op = 'DELETE' then old else new end;
end
$$;

create or replace function amtech_assignment_policy_authority_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment_id text;
begin
  v_assignment_id := case when tg_op = 'DELETE' then old.assignment_id else new.assignment_id end;
  if tg_op = 'UPDATE'
     and new.assignment_id is not distinct from old.assignment_id
     and new.policy_version is not distinct from old.policy_version
     and new.action is not distinct from old.action
     and new.required_roles is not distinct from old.required_roles
     and new.risk_class is not distinct from old.risk_class
     and new.step_up_required is not distinct from old.step_up_required
     and new.status is not distinct from old.status then
    return new;
  end if;
  perform amtech_invalidate_assignment_authority(v_assignment_id, 'assignment_authority_policy_changed');
  return case when tg_op = 'DELETE' then old else new end;
end
$$;

create or replace function amtech_stamp_owner_session_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.authority_version := amtech_current_authority_version('human_principal', new.human_principal_id);
  if new.authority_version is null then raise exception 'owner_session_authority_not_current'; end if;
  return new;
end
$$;

create or replace function amtech_stamp_preview_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.resource_type = 'approval' then
    new.resolver_authority_version := amtech_current_authority_version('human_principal', new.resolver_principal_id);
    new.assignment_authority_version := amtech_current_authority_version('employee_assignment', new.assignment_id);
    if new.resolver_authority_version is null or new.assignment_authority_version is null then
      raise exception 'preview_authority_not_current';
    end if;
  end if;
  return new;
end
$$;

create or replace function amtech_stamp_approval_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'legacy' then
    new.assignment_authority_version := amtech_current_authority_version('employee_assignment', new.assignment_id);
    if new.assignment_authority_version is null then raise exception 'approval_assignment_authority_not_current'; end if;
  end if;
  return new;
end
$$;

create or replace function amtech_stamp_mcp_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.assignment_authority_version := amtech_current_authority_version('employee_assignment', new.assignment_id);
  if new.assignment_authority_version is null then raise exception 'mcp_assignment_authority_not_current'; end if;
  return new;
end
$$;

create or replace function amtech_guard_approval_resolution_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current bigint;
begin
  if old.status = 'pending' and new.status in ('approved','rejected') then
    v_current := amtech_current_authority_version('employee_assignment', old.assignment_id);
    if v_current is null or old.assignment_authority_version is distinct from v_current then
      raise exception 'approval_authority_version_stale';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists human_principal_authority_version on human_principals;
create trigger human_principal_authority_version
  after update of status, session_version, credentials_revoked_at on human_principals
  for each row execute function amtech_human_authority_changed();

drop trigger if exists employee_assignment_authority_version on employee_assignments;
create trigger employee_assignment_authority_version
  after update of status, starts_at, ends_at, policy_version, employee_principal_id on employee_assignments
  for each row execute function amtech_employee_assignment_authority_changed();

drop trigger if exists assignment_principal_authority_version on assignment_principals;
create trigger assignment_principal_authority_version
  after update or delete on assignment_principals
  for each row execute function amtech_assignment_principal_authority_changed();

drop trigger if exists resource_grant_authority_version on assignment_resource_grants;
create trigger resource_grant_authority_version
  after update or delete on assignment_resource_grants
  for each row execute function amtech_resource_grant_authority_changed();

drop trigger if exists assignment_policy_authority_version on assignment_authority_policies;
create trigger assignment_policy_authority_version
  after update or delete on assignment_authority_policies
  for each row execute function amtech_assignment_policy_authority_changed();

drop trigger if exists owner_session_authority_stamp on owner_web_sessions;
create trigger owner_session_authority_stamp
  before insert on owner_web_sessions
  for each row execute function amtech_stamp_owner_session_authority();

drop trigger if exists preview_authority_stamp on preview_links;
create trigger preview_authority_stamp
  before insert on preview_links
  for each row execute function amtech_stamp_preview_authority();

drop trigger if exists approval_authority_stamp on approvals;
create trigger approval_authority_stamp
  before insert on approvals
  for each row execute function amtech_stamp_approval_authority();

drop trigger if exists mcp_authority_stamp on employee_mcp_credentials;
create trigger mcp_authority_stamp
  before insert on employee_mcp_credentials
  for each row execute function amtech_stamp_mcp_authority();

drop trigger if exists approval_resolution_authority_guard on approvals;
create trigger approval_resolution_authority_guard
  before update of status, resolution on approvals
  for each row execute function amtech_guard_approval_resolution_authority();

-- Execution revalidates the same immutable approval and the durable assignment
-- authority version immediately before the provider effect begins.
create or replace function assert_approved_action_execution(
  p_approval_id text,
  p_action_key text,
  p_resource_class text,
  p_resource_id text,
  p_current_snapshot_hash text
)
returns setof approvals
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_approval approvals%rowtype;
  v_snapshot_hash text;
  v_current_authority_version bigint;
begin
  select * into v_approval from approvals where id = p_approval_id;
  if v_approval.id is null or v_approval.status <> 'approved' or v_approval.resolution <> 'approved' then
    raise exception 'approval_not_approved';
  end if;
  if v_approval.revoked_at is not null or v_approval.expires_at <= now() then
    raise exception 'approval_revoked_or_expired';
  end if;
  if v_approval.action_key <> p_action_key
     or v_approval.resource_class <> p_resource_class
     or v_approval.resource_id <> p_resource_id then
    raise exception 'approval_execution_scope_mismatch';
  end if;

  v_snapshot_hash := amtech_approval_snapshot_hash(amtech_approval_snapshot(
    v_approval.assignment_id, v_approval.action_key,
    v_approval.resource_class, v_approval.resource_id
  ));
  if v_snapshot_hash <> v_approval.snapshot_hash
     or p_current_snapshot_hash <> v_approval.snapshot_hash then
    raise exception 'approval_snapshot_changed';
  end if;

  if not exists (
    select 1 from assignment_principals ap
     where ap.assignment_id = v_approval.assignment_id
       and ap.principal_id = v_approval.resolved_by_principal_id
       and ap.principal_class = 'human'
       and ap.role = v_approval.resolved_by_role
       and ap.role = any(v_approval.required_resolver_roles)
       and ap.policy_version = v_approval.policy_version
       and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
  ) then
    raise exception 'approval_resolver_role_revoked';
  end if;
  if not exists (
    select 1 from assignment_resource_grants g
     where g.assignment_id = v_approval.assignment_id
       and (g.principal_id is null or g.principal_id = v_approval.resolved_by_principal_id)
       and g.resource_class = 'approval'
       and g.resource_id = v_approval.id
       and v_approval.required_resolver_action = any(g.actions)
       and g.policy_version = v_approval.policy_version
       and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
  ) then
    raise exception 'approval_resolver_grant_revoked';
  end if;
  if not exists (
    select 1 from assignment_authority_policies p
     where p.assignment_id = v_approval.assignment_id
       and p.policy_version = v_approval.policy_version
       and p.action = v_approval.action_key
       and p.required_roles = v_approval.required_resolver_roles
       and p.status = 'active'
  ) then
    raise exception 'approval_policy_changed';
  end if;

  v_current_authority_version := amtech_current_authority_version(
    'employee_assignment', v_approval.assignment_id
  );
  if v_current_authority_version is null
     or v_approval.assignment_authority_version is distinct from v_current_authority_version then
    raise exception 'approval_authority_version_stale';
  end if;

  return next v_approval;
end
$$;

revoke all on function amtech_current_authority_version(text,text) from public, anon, authenticated;
revoke all on function amtech_bump_authority_version(text,text,text,text,boolean,text) from public, anon, authenticated;
revoke all on function amtech_revoke_stale_assignment_consumers(text,bigint,text,boolean) from public, anon, authenticated;
revoke all on function amtech_invalidate_assignment_authority(text,text) from public, anon, authenticated;
grant execute on function amtech_current_authority_version(text,text) to service_role;
grant execute on function amtech_bump_authority_version(text,text,text,text,boolean,text) to service_role;
grant execute on function amtech_revoke_stale_assignment_consumers(text,bigint,text,boolean) to service_role;
grant execute on function amtech_invalidate_assignment_authority(text,text) to service_role;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values
  ('authority:owner-session-version','credential','owner web session authority version','Lane 9','assignment_resolver','C2',true,true,
   array['bearer_possession_only','account_membership_only','stale_session_version'],
   array['human-principal-version-at-issue','current-version-check','synchronous-session-revocation'],
   'packages/db/migrations/0058_authority_version_revocation_spine.sql',
   'Owner sessions fail closed after principal credential or lifecycle changes.'),
  ('authority:runtime-credential-version','credential','Hermes Manager MCP credential authority version','Lane 9','explicit_assignment','C2',true,true,
   array['bearer_possession_only','stale_assignment_version','runtime_cache_only'],
   array['assignment-version-at-issue','current-version-check','synchronous-mcp-revocation'],
   'packages/db/migrations/0058_authority_version_revocation_spine.sql',
   'Hermes remains the runtime substrate but stale MCP credentials cannot reach Manager tools.'),
  ('authority:approval-version','approval','approval resolution and execution authority version','Lane 9','explicit_assignment','C3',true,true,
   array['stale_policy_snapshot','stale_resolver_role','stale_resource_grant'],
   array['assignment-version-at-request','resolution-version-check','execution-version-check'],
   'packages/db/migrations/0058_authority_version_revocation_spine.sql',
   'Pending and approved actions cannot survive a security-relevant assignment authority change.')
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
