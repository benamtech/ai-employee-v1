-- ============================================================================
-- AMTECH WS-02/WS-06 — provider-neutral connector operating substrate
--
-- One lifecycle for AMTECH-managed OAuth/provider onboarding, guided credentials,
-- verified webhook connectors, remote MCP, and operator-managed systems.
-- SMS remains a normal assignment-bound owner session. Natural-language owner
-- decisions bind to one exact approval context; no per-message challenge exists.
-- ============================================================================

begin;

alter table verified_phones
  add column if not exists human_principal_id text references human_principals(id) on delete set null;

-- Compatibility backfill is allowed only when every current owner assignment for
-- the account points to one distinct human principal. Ambiguity remains null.
with unique_owner as (
  select ea.account_id, min(ap.principal_id) as human_principal_id
    from employee_assignments ea
    join assignment_principals ap
      on ap.assignment_id = ea.id
     and ap.principal_class = 'human'
     and ap.role = 'owner'
     and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
    join human_principals hp on hp.id = ap.principal_id and hp.status = 'active'
   where amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
   group by ea.account_id
  having count(distinct ap.principal_id) = 1
)
update verified_phones vp
   set human_principal_id = uo.human_principal_id
  from unique_owner uo
 where vp.account_id = uo.account_id
   and vp.human_principal_id is null;

create index if not exists verified_phones_principal_idx
  on verified_phones(account_id, human_principal_id, verified_at desc);

alter table connector_bindings
  add column if not exists connector_key text,
  add column if not exists lifecycle_state text not null default 'connected',
  add column if not exists discovery_state text not null default 'pending',
  add column if not exists discovered_capabilities jsonb not null default '[]'::jsonb,
  add column if not exists last_capability_discovery_at timestamptz,
  add column if not exists last_health_check_at timestamptz,
  add column if not exists revocation_reason text,
  add column if not exists revocation_evidence jsonb not null default '{}'::jsonb;

update connector_bindings
   set connector_key = provider
 where connector_key is null or connector_key = '';

alter table connector_bindings
  drop constraint if exists connector_bindings_lifecycle_state_check;
alter table connector_bindings
  add constraint connector_bindings_lifecycle_state_check
  check (lifecycle_state in ('available','setup_required','authorizing','connected','degraded','expired','revoked'));

alter table connector_bindings
  drop constraint if exists connector_bindings_discovery_state_check;
alter table connector_bindings
  add constraint connector_bindings_discovery_state_check
  check (discovery_state in ('pending','complete','degraded','revoked'));

create table if not exists connector_capability_projections (
  id                       text primary key,
  connector_binding_id     text not null references connector_bindings(id) on delete cascade,
  assignment_id            text not null references employee_assignments(id) on delete cascade,
  account_id               text not null references accounts(id) on delete cascade,
  employee_id              text not null references employees(id) on delete cascade,
  provider                 text not null,
  connector_key            text not null,
  capability_key           text not null,
  label                    text not null,
  category                 text not null,
  effect_class             text not null
                           check (effect_class in ('read','internal_write','customer_facing','money_movement')),
  approval_interaction     text not null
                           check (approval_interaction in ('none','conversational','explicit','typed_confirmation')),
  event_driven             boolean not null default false,
  status                   text not null default 'discovered'
                           check (status in ('discovered','ready','degraded','revoked')),
  manifest_revision        text not null,
  evidence                 jsonb not null default '{}'::jsonb,
  discovered_at            timestamptz not null default now(),
  last_verified_at         timestamptz,
  revoked_at               timestamptz,
  updated_at               timestamptz not null default now(),
  unique (connector_binding_id, capability_key)
);

create index if not exists connector_capability_projection_scope_idx
  on connector_capability_projections(assignment_id, connector_key, status, effect_class);
create index if not exists connector_capability_projection_employee_idx
  on connector_capability_projections(account_id, employee_id, status, updated_at desc);

create table if not exists connector_lifecycle_events (
  id                    text primary key,
  connector_binding_id  text references connector_bindings(id) on delete set null,
  assignment_id         text not null references employee_assignments(id) on delete cascade,
  account_id            text not null references accounts(id) on delete cascade,
  employee_id           text not null references employees(id) on delete cascade,
  connector_key         text not null,
  provider              text not null,
  event_type            text not null
                        check (event_type in ('connected','capabilities_discovered','health_changed','expired','revoked','provider_revocation_pending','provider_revocation_confirmed')),
  lifecycle_state       text not null,
  evidence              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists connector_lifecycle_events_scope_idx
  on connector_lifecycle_events(assignment_id, created_at desc, id desc);

create table if not exists connector_setup_intents (
  id                         text primary key,
  assignment_id              text not null references employee_assignments(id) on delete cascade,
  account_id                 text not null references accounts(id) on delete cascade,
  employee_id                text not null references employees(id) on delete cascade,
  connector_key              text not null,
  label                      text not null,
  setup_experience           text not null
                             check (setup_experience in ('amtech_managed_oauth','amtech_managed_provider_onboarding','guided_business_credentials','guided_webhook_subscription','guided_remote_mcp','amtech_managed_service')),
  requested_by_principal_id  text not null references human_principals(id) on delete restrict,
  status                     text not null default 'requested'
                             check (status in ('requested','in_progress','ready','connected','cancelled','failed')),
  owner_context              jsonb not null default '{}'::jsonb,
  evidence                   jsonb not null default '{}'::jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (assignment_id, connector_key, requested_by_principal_id)
);

create index if not exists connector_setup_intents_scope_idx
  on connector_setup_intents(assignment_id, status, updated_at desc);

-- Durable conversational decision context. The LLM interprets natural language;
-- this row prevents a reply such as “yeah, send it” from drifting to another task.
create table if not exists channel_decision_contexts (
  id                    text primary key,
  assignment_id         text not null references employee_assignments(id) on delete cascade,
  account_id            text not null references accounts(id) on delete cascade,
  employee_id           text not null references employees(id) on delete cascade,
  channel               text not null check (channel in ('sms','web','voice')),
  external_subject      text,
  human_principal_id    text not null references human_principals(id) on delete restrict,
  approval_id           text not null references approvals(id) on delete cascade,
  prompt_message_id     text not null references employee_messages(id) on delete cascade,
  status                text not null default 'open'
                        check (status in ('open','resolved','rejected','superseded','expired')),
  resolution            text check (resolution is null or resolution in ('approved','rejected')),
  resolved_by_message_id text references employee_messages(id) on delete set null,
  expires_at            timestamptz not null,
  evidence              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (prompt_message_id, approval_id)
);

create index if not exists channel_decision_context_open_idx
  on channel_decision_contexts(assignment_id, channel, human_principal_id, status, created_at desc);

alter table employee_messages
  add column if not exists account_id text references accounts(id) on delete cascade,
  add column if not exists human_principal_id text references human_principals(id) on delete set null,
  add column if not exists decision_context_id text references channel_decision_contexts(id) on delete set null,
  add column if not exists decision_consumed_at timestamptz,
  add column if not exists decision_context jsonb not null default '{}'::jsonb;

create index if not exists employee_messages_decision_context_idx
  on employee_messages(assignment_id, human_principal_id, decision_context_id, created_at desc);

-- Owner/manager/operator surfaces can request or revoke connections. Viewers remain
-- read-only. Re-running assignment principals refreshes existing grants.
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
      'connector:setup:request',
      'connector:revoke',
      'capabilities:read',
      'artifact:revise',
      'artifact:validate',
      'artifact:publish'
    ]::text[]
    else array['read']::text[]
  end
$$;

create or replace function amtech_connector_binding_lifecycle_projection()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_revoked boolean;
begin
  v_revoked := new.revoked_at is not null
    or new.status in ('revoked','expired','disabled')
    or new.lifecycle_state in ('revoked','expired');

  if v_revoked then
    update connector_capability_projections ccp
       set status = 'revoked',
           revoked_at = coalesce(ccp.revoked_at, now()),
           updated_at = now(),
           evidence = ccp.evidence || jsonb_build_object(
             'revoked_by_binding', new.id,
             'revoked_at', now(),
             'reason', coalesce(new.revocation_reason, new.status)
           )
     where ccp.connector_binding_id = new.id
       and ccp.status <> 'revoked';

    update assignment_resource_grants arg
       set status = 'revoked',
           ends_at = coalesce(arg.ends_at, now()),
           provenance = arg.provenance || jsonb_build_object(
             'connector_binding_revoked', new.id,
             'revoked_at', now(),
             'reason', coalesce(new.revocation_reason, new.status)
           )
     where arg.assignment_id = new.assignment_id
       and (
         arg.provenance ->> 'connector_binding_id' = new.id
         or (
           arg.principal_id = new.principal_id
           and arg.resource_class = new.resource_class
           and arg.resource_id is not distinct from new.resource_id
         )
       )
       and arg.status not in ('revoked','ended','expired');
  end if;

  return new;
end
$$;

drop trigger if exists connector_binding_lifecycle_projection on connector_bindings;
create trigger connector_binding_lifecycle_projection
after update of status, lifecycle_state, revoked_at on connector_bindings
for each row execute function amtech_connector_binding_lifecycle_projection();

create or replace function amtech_revoke_connector_binding(
  p_binding_id text,
  p_account_id text,
  p_employee_id text,
  p_assignment_id text,
  p_reason text,
  p_evidence jsonb default '{}'::jsonb
)
returns table(
  binding_id text,
  connector_key text,
  provider text,
  assignment_id text,
  revoked_at timestamptz,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_binding connector_bindings%rowtype;
  v_now timestamptz := now();
  v_event_id text;
begin
  if coalesce(p_binding_id, '') = ''
     or coalesce(p_account_id, '') = ''
     or coalesce(p_employee_id, '') = ''
     or coalesce(p_assignment_id, '') = ''
     or coalesce(p_reason, '') = '' then
    raise exception 'connector_revocation_identity_incomplete';
  end if;

  select cb.*
    into v_binding
    from connector_bindings cb
   where cb.id = p_binding_id
     and cb.account_id = p_account_id
     and cb.employee_id = p_employee_id
     and cb.assignment_id = p_assignment_id
   for update;

  if v_binding.id is null then
    raise exception 'connector_binding_not_found_or_wrong_assignment';
  end if;

  if v_binding.revoked_at is not null or v_binding.status = 'revoked' or v_binding.lifecycle_state = 'revoked' then
    return query select
      v_binding.id,
      coalesce(v_binding.connector_key, v_binding.provider),
      v_binding.provider,
      v_binding.assignment_id,
      v_binding.revoked_at,
      true;
    return;
  end if;

  update connector_bindings cb
     set status = 'revoked',
         lifecycle_state = 'revoked',
         discovery_state = 'revoked',
         revoked_at = v_now,
         revocation_reason = p_reason,
         revocation_evidence = coalesce(cb.revocation_evidence, '{}'::jsonb)
           || coalesce(p_evidence, '{}'::jsonb)
           || jsonb_build_object('revoked_at', v_now),
         updated_at = v_now
   where cb.id = v_binding.id
   returning cb.* into v_binding;

  if v_binding.provider = 'stripe' then
    update stripe_connections sc
       set charges_enabled = false,
           payouts_enabled = false,
           secret_ref = null
     where sc.id = v_binding.connector_account_id
       and sc.account_id = p_account_id
       and sc.employee_id = p_employee_id;
  else
    update connector_accounts ca
       set status = 'revoked',
           token_secret_ref = null
     where ca.id = v_binding.connector_account_id
       and ca.account_id = p_account_id
       and ca.employee_id = p_employee_id;
  end if;

  update connector_capability_projections ccp
     set status = 'revoked',
         revoked_at = coalesce(ccp.revoked_at, v_now),
         updated_at = v_now,
         evidence = ccp.evidence || jsonb_build_object(
           'connector_binding_revoked', v_binding.id,
           'revoked_at', v_now,
           'reason', p_reason
         )
   where ccp.connector_binding_id = v_binding.id;

  update connector_setup_intents csi
     set status = case when csi.status in ('requested','in_progress','ready') then 'cancelled' else csi.status end,
         updated_at = v_now,
         evidence = csi.evidence || jsonb_build_object('binding_revoked', v_binding.id, 'reason', p_reason)
   where csi.assignment_id = p_assignment_id
     and csi.connector_key = coalesce(v_binding.connector_key, v_binding.provider);

  v_event_id := 'cle_' || substr(encode(digest(
    v_binding.id || ':' || v_now::text || ':revoked', 'sha256'
  ), 'hex'), 1, 28);

  insert into connector_lifecycle_events (
    id, connector_binding_id, assignment_id, account_id, employee_id,
    connector_key, provider, event_type, lifecycle_state, evidence
  ) values (
    v_event_id, v_binding.id, v_binding.assignment_id, v_binding.account_id,
    v_binding.employee_id, coalesce(v_binding.connector_key, v_binding.provider),
    v_binding.provider, 'revoked', 'revoked',
    coalesce(p_evidence, '{}'::jsonb) || jsonb_build_object('reason', p_reason)
  ) on conflict (id) do nothing;

  return query select
    v_binding.id,
    coalesce(v_binding.connector_key, v_binding.provider),
    v_binding.provider,
    v_binding.assignment_id,
    v_binding.revoked_at,
    false;
end
$$;

-- The LLM has already interpreted the natural-language reply. This transaction
-- proves that the exact SMS message, human principal, conversation context, and
-- immutable approval all agree before recording the decision.
create or replace function amtech_resolve_sms_channel_decision(
  p_owner_message_id text,
  p_decision_context_id text,
  p_approval_id text,
  p_resolution text
)
returns table(
  approval_id text,
  assignment_id text,
  resolution text,
  resolver_role text,
  command_intent_id text,
  command_id text,
  effect_key text,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_message employee_messages%rowtype;
  v_context channel_decision_contexts%rowtype;
  v_approval approvals%rowtype;
  v_current_snapshot_hash text;
  v_resolved record;
begin
  if p_resolution not in ('approved','rejected') then
    raise exception 'channel_decision_resolution_invalid';
  end if;

  select em.*
    into v_message
    from employee_messages em
   where em.id = p_owner_message_id
   for update;

  if v_message.id is null
     or v_message.direction <> 'to_employee'
     or v_message.channel <> 'sms'
     or v_message.assignment_id is null
     or v_message.account_id is null
     or v_message.human_principal_id is null then
    raise exception 'channel_decision_owner_message_invalid';
  end if;
  if v_message.decision_consumed_at is not null then
    raise exception 'channel_decision_message_already_consumed';
  end if;

  select cdc.*
    into v_context
    from channel_decision_contexts cdc
   where cdc.id = p_decision_context_id
   for update;

  if v_context.id is null
     or v_context.approval_id <> p_approval_id
     or v_context.assignment_id <> v_message.assignment_id
     or v_context.account_id <> v_message.account_id
     or v_context.employee_id <> v_message.employee_id
     or v_context.human_principal_id <> v_message.human_principal_id
     or v_context.channel <> 'sms'
     or v_context.status <> 'open'
     or v_context.expires_at <= now() then
    raise exception 'channel_decision_context_not_current';
  end if;

  select a.*
    into v_approval
    from approvals a
   where a.id = p_approval_id;
  if v_approval.id is null
     or v_approval.assignment_id <> v_context.assignment_id
     or v_approval.account_id <> v_context.account_id
     or v_approval.employee_id <> v_context.employee_id then
    raise exception 'channel_decision_approval_scope_mismatch';
  end if;

  v_current_snapshot_hash := amtech_approval_snapshot_hash(amtech_approval_snapshot(
    v_approval.assignment_id,
    v_approval.action_key,
    v_approval.resource_class,
    v_approval.resource_id
  ));

  select resolved.*
    into v_resolved
    from resolve_approval_authority(
      v_approval.id,
      v_message.human_principal_id,
      p_resolution,
      'sms',
      v_current_snapshot_hash,
      'owner_sms_session:' || v_message.id
    ) resolved;

  if v_resolved.approval_id is null then
    raise exception 'channel_decision_resolution_missing';
  end if;

  update channel_decision_contexts cdc
     set status = case when p_resolution = 'approved' then 'resolved' else 'rejected' end,
         resolution = p_resolution,
         resolved_by_message_id = v_message.id,
         updated_at = now(),
         evidence = cdc.evidence || jsonb_build_object(
           'resolved_by_message_id', v_message.id,
           'authenticated_by', 'owner_sms_session',
           'natural_language_interpreted_by', 'hermes'
         )
   where cdc.id = v_context.id;

  update employee_messages em
     set decision_context_id = v_context.id,
         decision_consumed_at = now(),
         decision_context = em.decision_context || jsonb_build_object(
           'approval_id', v_approval.id,
           'resolution', p_resolution,
           'context_id', v_context.id
         )
   where em.id = v_message.id;

  return query select
    v_resolved.approval_id,
    v_resolved.assignment_id,
    v_resolved.resolution,
    v_resolved.resolver_role,
    v_resolved.command_intent_id,
    v_resolved.command_id,
    v_resolved.effect_key,
    v_resolved.duplicate;
end
$$;

alter table connector_capability_projections enable row level security;
alter table connector_lifecycle_events enable row level security;
alter table connector_setup_intents enable row level security;
alter table channel_decision_contexts enable row level security;

revoke all on connector_capability_projections from public, anon, authenticated;
revoke all on connector_lifecycle_events from public, anon, authenticated;
revoke all on connector_setup_intents from public, anon, authenticated;
revoke all on channel_decision_contexts from public, anon, authenticated;
grant select, insert, update, delete on connector_capability_projections to service_role;
grant select, insert, update, delete on connector_lifecycle_events to service_role;
grant select, insert, update, delete on connector_setup_intents to service_role;
grant select, insert, update, delete on channel_decision_contexts to service_role;

revoke all on function amtech_employee_surface_actions_for_role(text) from public, anon, authenticated;
revoke all on function amtech_connector_binding_lifecycle_projection() from public, anon, authenticated;
revoke all on function amtech_revoke_connector_binding(text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function amtech_resolve_sms_channel_decision(text,text,text,text) from public, anon, authenticated;
grant execute on function amtech_employee_surface_actions_for_role(text) to service_role;
grant execute on function amtech_revoke_connector_binding(text,text,text,text,text,jsonb) to service_role;
grant execute on function amtech_resolve_sms_channel_decision(text,text,text,text) to service_role;

update assignment_principals
   set policy_version = policy_version
 where principal_class = 'human'
   and role in ('owner','manager','operator','viewer');

commit;
