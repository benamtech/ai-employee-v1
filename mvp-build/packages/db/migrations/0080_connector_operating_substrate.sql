-- ============================================================================
-- AMTECH WS-02/WS-06 — provider-neutral connector operating substrate
--
-- One forward-only lifecycle for native OAuth/provider onboarding, verified
-- webhook connectors, remote MCP, and managed credentials. Connection discovery,
-- revoke, capability projection, and SMS step-up remain assignment-scoped.
-- ============================================================================

begin;

alter table verified_phones
  add column if not exists human_principal_id text references human_principals(id) on delete set null;

-- Backfill only when the account has exactly one current owner human principal.
with unique_owner as (
  select am.account_id, min(hp.id) as human_principal_id
    from account_memberships am
    join users u on u.id = am.user_id
    join human_principals hp on hp.user_id = u.id and hp.status = 'active'
   where am.role = 'owner'
   group by am.account_id
  having count(*) = 1
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
  id                         text primary key,
  connector_binding_id       text not null references connector_bindings(id) on delete cascade,
  assignment_id              text not null references employee_assignments(id) on delete cascade,
  account_id                 text not null references accounts(id) on delete cascade,
  employee_id                text not null references employees(id) on delete cascade,
  provider                   text not null,
  connector_key              text not null,
  capability_key             text not null,
  label                      text not null,
  category                   text not null,
  effect_class               text not null
                             check (effect_class in ('read','internal_write','customer_facing','money_movement')),
  verification_requirement   text not null
                             check (verification_requirement in ('owner_session','sms_step_up','sms_and_owner_session')),
  event_driven               boolean not null default false,
  status                     text not null default 'discovered'
                             check (status in ('discovered','ready','degraded','revoked')),
  manifest_revision          text not null,
  evidence                   jsonb not null default '{}'::jsonb,
  discovered_at              timestamptz not null default now(),
  last_verified_at           timestamptz,
  revoked_at                 timestamptz,
  updated_at                 timestamptz not null default now(),
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

create table if not exists action_verification_challenges (
  id                         text primary key,
  account_id                 text not null references accounts(id) on delete cascade,
  employee_id                text not null references employees(id) on delete cascade,
  assignment_id              text not null references employee_assignments(id) on delete cascade,
  human_principal_id         text not null references human_principals(id) on delete restrict,
  phone_e164                 text not null,
  verification_requirement   text not null
                             check (verification_requirement in ('sms_step_up','sms_and_owner_session')),
  target_type                text not null,
  target_id                  text not null,
  purpose                    text not null,
  code_hash                  text not null,
  status                     text not null default 'pending'
                             check (status in ('pending','verified','consumed','expired','locked','delivery_ambiguous','revoked')),
  attempts                   integer not null default 0 check (attempts >= 0),
  max_attempts               integer not null default 5 check (max_attempts between 1 and 10),
  provider_message_id        text,
  provider_status            text,
  verified_provider_message_id text,
  verified_at                timestamptz,
  consumed_at                timestamptz,
  expires_at                 timestamptz not null,
  evidence                   jsonb not null default '{}'::jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (assignment_id, target_type, target_id, human_principal_id)
);

create index if not exists action_verification_pending_phone_idx
  on action_verification_challenges(assignment_id, phone_e164, status, expires_at desc);
create index if not exists action_verification_target_idx
  on action_verification_challenges(target_type, target_id, status);

alter table approvals
  add column if not exists verification_requirement text not null default 'owner_session',
  add column if not exists verification_challenge_id text references action_verification_challenges(id) on delete set null;

alter table approvals
  drop constraint if exists approvals_verification_requirement_check;
alter table approvals
  add constraint approvals_verification_requirement_check
  check (verification_requirement in ('owner_session','sms_step_up','sms_and_owner_session'));

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
       and arg.provenance ->> 'connector_binding_id' = new.id
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

  if v_binding.connector_account_id is not null then
    update connector_accounts ca
       set status = 'revoked',
           token_secret_ref = null
     where ca.id = v_binding.connector_account_id
       and ca.account_id = p_account_id
       and ca.employee_id = p_employee_id;

    if v_binding.provider = 'stripe' then
      update stripe_connections sc
         set onboarding_status = 'revoked',
             charges_enabled = false,
             payouts_enabled = false,
             secret_ref = null
       where sc.id = v_binding.connector_account_id
         and sc.account_id = p_account_id
         and sc.employee_id = p_employee_id;
    end if;
  end if;

  update assignment_resource_grants arg
     set status = 'revoked',
         ends_at = coalesce(arg.ends_at, v_now),
         provenance = arg.provenance || jsonb_build_object(
           'connector_binding_revoked', v_binding.id,
           'revoked_at', v_now,
           'reason', p_reason
         )
   where arg.assignment_id = p_assignment_id
     and (
       arg.provenance ->> 'connector_binding_id' = v_binding.id
       or (
         arg.principal_id = v_binding.principal_id
         and arg.resource_class = v_binding.resource_class
         and arg.resource_id is not distinct from v_binding.resource_id
       )
     )
     and arg.status not in ('revoked','ended','expired');

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

create or replace function amtech_verify_action_challenge(
  p_assignment_id text,
  p_phone_e164 text,
  p_code_hash text,
  p_provider_message_id text
)
returns table(
  challenge_id text,
  target_type text,
  target_id text,
  human_principal_id text,
  verification_requirement text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_challenge action_verification_challenges%rowtype;
begin
  select avc.*
    into v_challenge
    from action_verification_challenges avc
   where avc.assignment_id = p_assignment_id
     and avc.phone_e164 = p_phone_e164
     and avc.code_hash = p_code_hash
     and avc.status = 'pending'
     and avc.expires_at > now()
   order by avc.created_at desc
   limit 1
   for update;

  if v_challenge.id is null then
    update action_verification_challenges avc
       set attempts = avc.attempts + 1,
           status = case when avc.attempts + 1 >= avc.max_attempts then 'locked' else avc.status end,
           updated_at = now(),
           evidence = avc.evidence || jsonb_build_object('last_failed_provider_message_id', p_provider_message_id)
     where avc.assignment_id = p_assignment_id
       and avc.phone_e164 = p_phone_e164
       and avc.status = 'pending'
       and avc.expires_at > now();
    return;
  end if;

  update action_verification_challenges avc
     set status = 'verified',
         verified_at = now(),
         verified_provider_message_id = p_provider_message_id,
         attempts = avc.attempts + 1,
         updated_at = now()
   where avc.id = v_challenge.id
   returning avc.* into v_challenge;

  return query select
    v_challenge.id,
    v_challenge.target_type,
    v_challenge.target_id,
    v_challenge.human_principal_id,
    v_challenge.verification_requirement;
end
$$;

create or replace function resolve_approval_authority_with_verification(
  p_approval_id text,
  p_resolver_principal_id text,
  p_resolution text,
  p_channel text,
  p_current_snapshot_hash text,
  p_authenticated_by text,
  p_verification_challenge_id text default null
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
  v_approval approvals%rowtype;
  v_challenge action_verification_challenges%rowtype;
begin
  select a.*
    into v_approval
    from approvals a
   where a.id = p_approval_id
   for update;

  if v_approval.id is null then
    raise exception 'approval_not_found';
  end if;

  if p_resolution = 'approved'
     and v_approval.verification_requirement in ('sms_step_up','sms_and_owner_session') then
    if coalesce(p_verification_challenge_id, '') = ''
       or v_approval.verification_challenge_id is distinct from p_verification_challenge_id then
      raise exception 'approval_sms_step_up_required';
    end if;

    select avc.*
      into v_challenge
      from action_verification_challenges avc
     where avc.id = p_verification_challenge_id
       and avc.assignment_id = v_approval.assignment_id
       and avc.human_principal_id = p_resolver_principal_id
       and avc.target_type = 'approval'
       and avc.target_id = v_approval.id
     for update;

    if v_challenge.id is null
       or v_challenge.status <> 'verified'
       or v_challenge.verified_at is null
       or v_challenge.consumed_at is not null
       or v_challenge.expires_at <= now() then
      raise exception 'approval_sms_step_up_not_current';
    end if;

    update action_verification_challenges avc
       set status = 'consumed',
           consumed_at = now(),
           updated_at = now(),
           evidence = avc.evidence || jsonb_build_object(
             'consumed_for_approval', v_approval.id,
             'consumed_by_principal', p_resolver_principal_id,
             'consumed_channel', p_channel
           )
     where avc.id = v_challenge.id;
  end if;

  return query
  select resolved.approval_id,
         resolved.assignment_id,
         resolved.resolution,
         resolved.resolver_role,
         resolved.command_intent_id,
         resolved.command_id,
         resolved.effect_key,
         resolved.duplicate
    from resolve_approval_authority(
      p_approval_id,
      p_resolver_principal_id,
      p_resolution,
      p_channel,
      p_current_snapshot_hash,
      p_authenticated_by
    ) resolved;
end
$$;

alter table connector_capability_projections enable row level security;
alter table connector_lifecycle_events enable row level security;
alter table action_verification_challenges enable row level security;

revoke all on connector_capability_projections from public, anon, authenticated;
revoke all on connector_lifecycle_events from public, anon, authenticated;
revoke all on action_verification_challenges from public, anon, authenticated;
grant select, insert, update, delete on connector_capability_projections to service_role;
grant select, insert, update, delete on connector_lifecycle_events to service_role;
grant select, insert, update, delete on action_verification_challenges to service_role;

revoke all on function amtech_connector_binding_lifecycle_projection() from public, anon, authenticated;
revoke all on function amtech_revoke_connector_binding(text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function amtech_verify_action_challenge(text,text,text,text) from public, anon, authenticated;
revoke all on function resolve_approval_authority_with_verification(text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function amtech_revoke_connector_binding(text,text,text,text,text,jsonb) to service_role;
grant execute on function amtech_verify_action_challenge(text,text,text,text) to service_role;
grant execute on function resolve_approval_authority_with_verification(text,text,text,text,text,text,text) to service_role;

commit;
