-- ============================================================================
-- AMTECH Phase 2 — S1-S4 owner/session/read/turn consumer closure
--
-- Forward-only. Compatibility account_id/employee_id columns remain projections;
-- every current owner session and customer-work row receives durable principal and
-- assignment scope. This migration does not implement S8 platform authority.
-- ============================================================================

begin;

alter table human_principals
  add column if not exists session_version integer not null default 1,
  add column if not exists credentials_revoked_at timestamptz;

alter table owner_web_sessions
  add column if not exists human_principal_id text references human_principals(id) on delete restrict,
  add column if not exists session_version integer,
  add column if not exists revoked_at timestamptz,
  add column if not exists last_seen_at timestamptz;

update owner_web_sessions ows
   set human_principal_id = hp.id,
       session_version = hp.session_version
  from human_principals hp
 where hp.user_id = ows.user_id
   and ows.human_principal_id is null;

create index if not exists owner_web_sessions_principal_idx
  on owner_web_sessions(human_principal_id, expires_at)
  where human_principal_id is not null and revoked_at is null;

alter table owner_web_sessions
  drop constraint if exists owner_web_sessions_principal_shape_check,
  add constraint owner_web_sessions_principal_shape_check check (
    human_principal_id is not null and session_version is not null
  ) not valid;

-- Add assignment scope to remaining live work/read rows. Ambiguous historical rows
-- remain null and therefore fail closed in consumers instead of being guessed.
do $$
declare
  scope_table text;
begin
  foreach scope_table in array array[
    'reminders',
    'job_commitments',
    'inbound_events',
    'employee_turn_jobs',
    'work_runs',
    'tool_invocations',
    'employee_channel_sessions',
    'runtime_health_checks'
  ] loop
    if to_regclass(format('public.%I', scope_table)) is not null then
      execute format(
        'alter table public.%I add column if not exists assignment_id text references employee_assignments(id) on delete restrict',
        scope_table
      );
      execute format(
        'create index if not exists %I on public.%I(assignment_id) where assignment_id is not null',
        left(scope_table || '_assignment_scope_idx', 63),
        scope_table
      );
    end if;
  end loop;
end;
$$;

do $$
declare
  scope_table text;
begin
  foreach scope_table in array array[
    'reminders',
    'job_commitments',
    'inbound_events',
    'employee_turn_jobs',
    'work_runs',
    'tool_invocations',
    'employee_channel_sessions'
  ] loop
    if to_regclass(format('public.%I', scope_table)) is not null
       and exists (
         select 1 from information_schema.columns
          where table_schema = 'public' and table_name = scope_table and column_name = 'employee_id'
       )
       and exists (
         select 1 from information_schema.columns
          where table_schema = 'public' and table_name = scope_table and column_name = 'account_id'
       ) then
      execute format($sql$
        update public.%I target
           set assignment_id = amtech_default_assignment_for_employee_account(target.employee_id, target.account_id)
         where target.assignment_id is null
           and amtech_default_assignment_for_employee_account(target.employee_id, target.account_id) is not null
      $sql$, scope_table);
    end if;
  end loop;
end;
$$;

-- Runtime health belongs to the endpoint assignment.
update runtime_health_checks rhc
   set assignment_id = re.assignment_id
  from runtime_endpoints re
 where rhc.runtime_endpoint_id = re.id
   and rhc.assignment_id is null
   and re.assignment_id is not null;

-- A human intent is unique inside one assignment. The legacy global uniqueness
-- could cause a request in assignment B to replay assignment A's result.
do $$
declare
  constraint_name text;
begin
  if to_regclass('public.employee_turn_jobs') is null then return; end if;
  for constraint_name in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'employee_turn_jobs'
       and con.contype = 'u'
       and pg_get_constraintdef(con.oid) = 'UNIQUE (idempotency_key)'
  loop
    execute format('alter table public.employee_turn_jobs drop constraint %I', constraint_name);
  end loop;
end;
$$;

create unique index if not exists employee_turn_jobs_assignment_intent_unique
  on employee_turn_jobs(assignment_id, idempotency_key)
  where assignment_id is not null;
create unique index if not exists employee_turn_jobs_legacy_intent_unique
  on employee_turn_jobs(idempotency_key)
  where assignment_id is null;

-- Current assignment principals receive the minimum owner-surface grants. These
-- are not account-wide grants and expire/revoke with their assignment records.
insert into assignment_resource_grants(
  id, assignment_id, principal_id, resource_class, resource_id,
  actions, status, starts_at, policy_version, provenance
)
select
  'grant_' || substr(md5('owner_employee_surface:' || ap.assignment_id || ':' || ap.principal_id), 1, 26),
  ap.assignment_id,
  ap.principal_id,
  'employee',
  ep.employee_id,
  array['read','message:create','stream:read','materialize','heartbeat','turn:create'],
  'active',
  greatest(ap.starts_at, ea.starts_at),
  ea.policy_version,
  jsonb_build_object('source','s1_s4_consumer_closure','kind','owner_employee_surface')
from assignment_principals ap
join employee_assignments ea on ea.id = ap.assignment_id
join employee_principals ep on ep.id = ea.employee_principal_id
where ap.principal_class = 'human'
  and ap.role in ('owner','manager','operator','viewer')
  and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
  and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
on conflict (id) do update set
  actions = excluded.actions,
  status = excluded.status,
  policy_version = excluded.policy_version,
  provenance = excluded.provenance;

insert into assignment_resource_grants(
  id, assignment_id, principal_id, resource_class, resource_id,
  actions, status, starts_at, policy_version, provenance
)
select
  'grant_' || substr(md5('owner_artifact_surface:' || ap.assignment_id || ':' || ap.principal_id), 1, 26),
  ap.assignment_id,
  ap.principal_id,
  'artifact',
  null,
  array['artifact:read'],
  'active',
  greatest(ap.starts_at, ea.starts_at),
  ea.policy_version,
  jsonb_build_object('source','s1_s4_consumer_closure','kind','owner_artifact_surface')
from assignment_principals ap
join employee_assignments ea on ea.id = ap.assignment_id
where ap.principal_class = 'human'
  and ap.role in ('owner','manager','operator','viewer')
  and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
  and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
on conflict (id) do update set
  actions = excluded.actions,
  status = excluded.status,
  policy_version = excluded.policy_version,
  provenance = excluded.provenance;

-- One live action credential per approval/resolver. Older duplicate durable links
-- are revoked before installing the invariant; token possession never selects a
-- different link implicitly.
with ranked as (
  select id,
         row_number() over (
           partition by resource_type, resource_id, resolver_principal_id
           order by created_at desc, id desc
         ) as rn
    from preview_links
   where resource_type = 'approval'
     and resolver_principal_id is not null
     and revoked_at is null
     and consumed_at is null
)
update preview_links pl
   set revoked_at = now()
  from ranked r
 where pl.id = r.id and r.rn > 1;

create unique index if not exists preview_links_one_live_resolver_credential
  on preview_links(resource_type, resource_id, resolver_principal_id)
  where resource_type = 'approval'
    and resolver_principal_id is not null
    and revoked_at is null
    and consumed_at is null;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values
  ('route:owner-message','manager_route','owner web employee message','Lane 1','assignment_resolver','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['owner-session-human-principal','employee-resource-grant','assignment-bound-stable-turn-intent'],
   'apps/manager/src/server.ts','Owner messaging resolves one current assignment before writing or waking runtime.'),
  ('route:employee-resources','manager_route','owner employee resource snapshot and stream','Lane 1','assignment_resolver','C2',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['snapshot-assignment-partition','stream-assignment-partition','revoked-assignment-denial'],
   'apps/manager/src/lib/employee-stream.ts','Every snapshot and delta query is partitioned by the resolved assignment.'),
  ('worker:employee-turn','service_worker','employee turn job and runtime wake','Lane 7','explicit_assignment','C3',true,true,
   array['account_membership_only','employees_account_id_only','caller_selected_account_or_employee','process_local_idempotency'],
   array['assignment-bound-intent-key','durable-turn-claim','cross-assignment-replay-denial'],
   'apps/manager/src/lib/turn-queue.ts','One human intent is unique within one assignment and cannot replay another assignment result.')
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
