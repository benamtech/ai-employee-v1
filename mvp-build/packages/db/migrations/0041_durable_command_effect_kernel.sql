-- ============================================================================
-- AMTECH Phase 2 — durable command and effect kernel
--
-- Forward-only migration. Consequential work is assignment-scoped, commands
-- are claimed with bounded leases, irreversible effects are reserved once,
-- and terminal command state requires a durable provider receipt.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Durable intent and command records
-- --------------------------------------------------------------------------

create table command_intents (
  id                     text primary key,
  assignment_id          text not null references employee_assignments(id) on delete restrict,
  actor_principal_id     text not null,
  actor_class            text not null
                         check (actor_class in ('human','employee','service','platform')),
  authenticated_by       text not null,
  intent_key             text not null,
  command_id             text not null unique,
  command_type           text not null,
  command_version        text not null
                         check (command_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  policy_version         text not null,
  payload                jsonb not null
                         check (jsonb_typeof(payload) = 'object'),
  payload_hash           text not null
                         check (payload_hash ~ '^sha256:[0-9a-f]{64}$'),
  original_payload_hash  text not null
                         check (original_payload_hash ~ '^sha256:[0-9a-f]{64}$'),
  correlation_id         text not null,
  causation_id           text,
  requested_at           timestamptz not null default now(),
  unique (assignment_id, intent_key)
);

create index command_intents_assignment_requested_idx
  on command_intents(assignment_id, requested_at desc);

create table durable_commands (
  id                   text primary key,
  intent_id            text not null unique references command_intents(id) on delete restrict,
  assignment_id        text not null references employee_assignments(id) on delete restrict,
  actor_principal_id   text not null,
  actor_class          text not null
                       check (actor_class in ('human','employee','service','platform')),
  authenticated_by     text not null,
  command_type         text not null,
  command_version      text not null
                       check (command_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  policy_version       text not null,
  payload              jsonb not null
                       check (jsonb_typeof(payload) = 'object'),
  payload_hash         text not null
                       check (payload_hash ~ '^sha256:[0-9a-f]{64}$'),
  status               text not null default 'requested'
                       check (status in ('requested','claimed','succeeded','failed','ambiguous','cancelled')),
  claim_version        integer not null default 0 check (claim_version >= 0),
  lease_token          text,
  lease_expires_at     timestamptz,
  attempt_count        integer not null default 0 check (attempt_count >= 0),
  terminal_receipt_id  text,
  correlation_id       text not null,
  causation_id         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (
    (status = 'claimed' and lease_token is not null and lease_expires_at is not null)
    or status <> 'claimed'
  ),
  check (
    status not in ('succeeded','failed','ambiguous')
    or terminal_receipt_id is not null
  )
);

create index durable_commands_assignment_status_idx
  on durable_commands(assignment_id, status, created_at);
create index durable_commands_reclaim_idx
  on durable_commands(lease_expires_at, id)
  where status = 'claimed';

-- --------------------------------------------------------------------------
-- Effect reservation, receipts, and replay
-- --------------------------------------------------------------------------

create table effect_attempts (
  id                        text primary key,
  assignment_id             text not null references employee_assignments(id) on delete restrict,
  command_id                text not null references durable_commands(id) on delete restrict,
  effect_key                text not null,
  provider                  text not null,
  operation                 text not null,
  capability_class          text not null
                            check (capability_class in (
                              'native_idempotency',
                              'queryable_receipt',
                              'consumer_dedupe',
                              'non_idempotent_ambiguous'
                            )),
  request_hash              text not null
                            check (request_hash ~ '^sha256:[0-9a-f]{64}$'),
  provider_idempotency_key  text,
  state                     text not null default 'reserved'
                            check (state in ('reserved','applying','accepted','failed','ambiguous','reconciled')),
  lease_token               text,
  lease_expires_at          timestamptz,
  attempt_count             integer not null default 1 check (attempt_count >= 1),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (assignment_id, effect_key),
  check (
    capability_class <> 'native_idempotency'
    or provider_idempotency_key is not null
  )
);

create index effect_attempts_command_idx
  on effect_attempts(command_id, created_at);
create index effect_attempts_reconcile_idx
  on effect_attempts(state, lease_expires_at)
  where state in ('reserved','applying','ambiguous');

create table effect_receipts (
  id                   text primary key,
  assignment_id        text not null references employee_assignments(id) on delete restrict,
  command_id           text not null references durable_commands(id) on delete restrict,
  effect_attempt_id    text not null unique references effect_attempts(id) on delete restrict,
  effect_key           text not null,
  provider             text not null,
  operation            text not null,
  capability_class     text not null
                       check (capability_class in (
                         'native_idempotency',
                         'queryable_receipt',
                         'consumer_dedupe',
                         'non_idempotent_ambiguous'
                       )),
  request_hash         text not null
                       check (request_hash ~ '^sha256:[0-9a-f]{64}$'),
  state                text not null
                       check (state in ('accepted','failed','ambiguous')),
  provider_receipt_id  text,
  error_code           text,
  ambiguity_code       text,
  evidence             jsonb not null default '{}'::jsonb
                       check (jsonb_typeof(evidence) = 'object'),
  observed_at          timestamptz not null default now(),
  check (
    (state = 'accepted' and provider_receipt_id is not null and error_code is null and ambiguity_code is null)
    or
    (state = 'failed' and error_code is not null and ambiguity_code is null)
    or
    (state = 'ambiguous' and error_code is null and ambiguity_code is not null)
  )
);

create index effect_receipts_command_idx
  on effect_receipts(command_id, observed_at);

alter table durable_commands
  add constraint durable_commands_terminal_receipt_fk
  foreign key (terminal_receipt_id) references effect_receipts(id) on delete restrict
  deferrable initially deferred;

create table command_replay_responses (
  id                   text primary key,
  assignment_id        text not null references employee_assignments(id) on delete restrict,
  intent_id            text not null unique references command_intents(id) on delete restrict,
  command_id           text not null unique references durable_commands(id) on delete restrict,
  status               text not null
                       check (status in ('succeeded','failed','ambiguous','cancelled')),
  terminal_receipt_id  text references effect_receipts(id) on delete restrict,
  response_hash        text not null
                       check (response_hash ~ '^sha256:[0-9a-f]{64}$'),
  response             jsonb not null
                       check (jsonb_typeof(response) = 'object'),
  created_at           timestamptz not null default now(),
  check (
    status = 'cancelled'
    or terminal_receipt_id is not null
  )
);

create index command_replay_responses_assignment_idx
  on command_replay_responses(assignment_id, created_at desc);

-- --------------------------------------------------------------------------
-- Internal authority boundary
-- --------------------------------------------------------------------------

create or replace function amtech_assert_command_actor(
  p_assignment_id text,
  p_actor_principal_id text,
  p_actor_class text,
  p_policy_version text
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not amtech_assignment_launch_allowed(p_assignment_id) then
    raise exception 'assignment_not_active: %', p_assignment_id;
  end if;

  if p_actor_class = 'human' then
    if not exists (
      select 1
        from assignment_principals ap
       where ap.assignment_id = p_assignment_id
         and ap.principal_id = p_actor_principal_id
         and ap.principal_class = 'human'
         and ap.policy_version = p_policy_version
         and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
    ) then
      raise exception 'unauthorized_command_actor: %', p_actor_principal_id;
    end if;
  elsif p_actor_class = 'employee' then
    if not exists (
      select 1
        from employee_assignments ea
       where ea.id = p_assignment_id
         and ea.employee_principal_id = p_actor_principal_id
         and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
    ) then
      raise exception 'unauthorized_command_actor: %', p_actor_principal_id;
    end if;
  elsif p_actor_class not in ('service','platform') then
    raise exception 'unsupported_actor_class: %', p_actor_class;
  end if;
end
$$;

-- --------------------------------------------------------------------------
-- Stable intent registration and atomic command claim
-- --------------------------------------------------------------------------

create or replace function register_durable_command(
  p_intent_id text,
  p_assignment_id text,
  p_actor_principal_id text,
  p_actor_class text,
  p_authenticated_by text,
  p_intent_key text,
  p_command_id text,
  p_command_type text,
  p_command_version text,
  p_policy_version text,
  p_payload jsonb,
  p_payload_hash text,
  p_correlation_id text,
  p_causation_id text
)
returns table (
  intent_id text,
  command_id text,
  duplicate boolean,
  status text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_intent command_intents%rowtype;
  v_command durable_commands%rowtype;
begin
  if coalesce(p_intent_id, '') = ''
     or coalesce(p_command_id, '') = ''
     or coalesce(p_intent_key, '') = ''
     or coalesce(p_authenticated_by, '') = '' then
    raise exception 'invalid_command_identity';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid_command_payload';
  end if;

  perform amtech_assert_command_actor(
    p_assignment_id,
    p_actor_principal_id,
    p_actor_class,
    p_policy_version
  );

  insert into command_intents (
    id, assignment_id, actor_principal_id, actor_class, authenticated_by,
    intent_key, command_id, command_type, command_version, policy_version,
    payload, payload_hash, original_payload_hash, correlation_id, causation_id
  )
  values (
    p_intent_id, p_assignment_id, p_actor_principal_id, p_actor_class, p_authenticated_by,
    p_intent_key, p_command_id, p_command_type, p_command_version, p_policy_version,
    p_payload, p_payload_hash, p_payload_hash, p_correlation_id, p_causation_id
  )
  on conflict (assignment_id, intent_key) do nothing
  returning * into v_intent;

  if found then
    begin
      insert into durable_commands (
        id, intent_id, assignment_id, actor_principal_id, actor_class, authenticated_by,
        command_type, command_version, policy_version, payload, payload_hash,
        correlation_id, causation_id
      )
      values (
        p_command_id, p_intent_id, p_assignment_id, p_actor_principal_id, p_actor_class,
        p_authenticated_by, p_command_type, p_command_version, p_policy_version,
        p_payload, p_payload_hash, p_correlation_id, p_causation_id
      )
      returning * into v_command;
    exception
      when unique_violation then
        raise exception 'idempotency_conflict: command identity already used';
    end;

    return query
      select v_intent.id, v_command.id, false, v_command.status;
    return;
  end if;

  select ci.*
    into v_intent
    from command_intents ci
   where ci.assignment_id = p_assignment_id
     and ci.intent_key = p_intent_key;

  if v_intent.id is null then
    raise exception 'command_registration_race';
  end if;

  if v_intent.actor_principal_id <> p_actor_principal_id
     or v_intent.actor_class <> p_actor_class
     or v_intent.authenticated_by <> p_authenticated_by
     or v_intent.command_type <> p_command_type
     or v_intent.command_version <> p_command_version
     or v_intent.policy_version <> p_policy_version
     or v_intent.payload_hash <> p_payload_hash
     or v_intent.correlation_id <> p_correlation_id
     or v_intent.causation_id is distinct from p_causation_id then
    raise exception 'idempotency_conflict: stable intent changed';
  end if;

  select dc.*
    into strict v_command
    from durable_commands dc
   where dc.id = v_intent.command_id
     and dc.intent_id = v_intent.id;

  return query
    select v_intent.id, v_command.id, true, v_command.status;
end
$$;

create or replace function claim_durable_command(
  p_command_id text,
  p_lease_token text,
  p_lease_seconds integer
)
returns setof durable_commands
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if coalesce(p_lease_token, '') = ''
     or p_lease_seconds is null
     or p_lease_seconds < 1
     or p_lease_seconds > 3600 then
    raise exception 'invalid_command_lease';
  end if;

  return query
    update durable_commands dc
       set status = 'claimed',
           claim_version = dc.claim_version + 1,
           lease_token = p_lease_token,
           lease_expires_at = now() + make_interval(secs => p_lease_seconds),
           attempt_count = dc.attempt_count + 1,
           updated_at = now()
     where dc.id = p_command_id
       and (
         dc.status = 'requested'
         or (
           dc.status = 'claimed'
           and dc.lease_expires_at <= now()
         )
       )
    returning dc.*;
end
$$;

-- --------------------------------------------------------------------------
-- Effect reservation and durable terminal receipts
-- --------------------------------------------------------------------------

create or replace function reserve_effect_attempt(
  p_effect_id text,
  p_command_id text,
  p_effect_key text,
  p_provider text,
  p_operation text,
  p_capability_class text,
  p_request_hash text,
  p_provider_idempotency_key text,
  p_lease_token text,
  p_lease_seconds integer
)
returns table (
  effect_id text,
  duplicate boolean,
  state text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_command durable_commands%rowtype;
  v_effect effect_attempts%rowtype;
begin
  if coalesce(p_effect_id, '') = ''
     or coalesce(p_effect_key, '') = ''
     or coalesce(p_provider, '') = ''
     or coalesce(p_operation, '') = ''
     or coalesce(p_lease_token, '') = ''
     or p_lease_seconds is null
     or p_lease_seconds < 1
     or p_lease_seconds > 3600 then
    raise exception 'invalid_effect_reservation';
  end if;

  if p_capability_class = 'native_idempotency'
     and p_provider_idempotency_key is null then
    raise exception 'provider_idempotency_key_required';
  end if;

  select dc.*
    into v_command
    from durable_commands dc
   where dc.id = p_command_id;

  if v_command.id is null
     or v_command.status <> 'claimed'
     or v_command.lease_expires_at <= now() then
    raise exception 'command_not_claimed: %', p_command_id;
  end if;

  insert into effect_attempts (
    id, assignment_id, command_id, effect_key, provider, operation,
    capability_class, request_hash, provider_idempotency_key,
    lease_token, lease_expires_at
  )
  values (
    p_effect_id, v_command.assignment_id, p_command_id, p_effect_key, p_provider,
    p_operation, p_capability_class, p_request_hash, p_provider_idempotency_key,
    p_lease_token, now() + make_interval(secs => p_lease_seconds)
  )
  on conflict (assignment_id, effect_key) do nothing
  returning * into v_effect;

  if found then
    return query select v_effect.id, false, v_effect.state;
    return;
  end if;

  select ea.*
    into v_effect
    from effect_attempts ea
   where ea.assignment_id = v_command.assignment_id
     and ea.effect_key = p_effect_key;

  if v_effect.id is null then
    raise exception 'effect_reservation_race';
  end if;

  if v_effect.command_id <> p_command_id
     or v_effect.provider <> p_provider
     or v_effect.operation <> p_operation
     or v_effect.capability_class <> p_capability_class
     or v_effect.request_hash <> p_request_hash
     or v_effect.provider_idempotency_key is distinct from p_provider_idempotency_key then
    raise exception 'idempotency_conflict: effect request changed';
  end if;

  return query select v_effect.id, true, v_effect.state;
end
$$;

create or replace function record_effect_receipt(
  p_receipt_id text,
  p_effect_id text,
  p_state text,
  p_provider_receipt_id text,
  p_error_code text,
  p_ambiguity_code text,
  p_request_hash text,
  p_lease_token text,
  p_evidence jsonb
)
returns setof effect_receipts
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_effect effect_attempts%rowtype;
  v_existing effect_receipts%rowtype;
  v_receipt effect_receipts%rowtype;
begin
  if p_state not in ('accepted','failed','ambiguous') then
    raise exception 'invalid_receipt_state: %', p_state;
  end if;

  if p_evidence is null or jsonb_typeof(p_evidence) <> 'object' then
    raise exception 'invalid_receipt_evidence';
  end if;

  if (p_state = 'accepted' and (
        p_provider_receipt_id is null
        or p_error_code is not null
        or p_ambiguity_code is not null
      ))
     or (p_state = 'failed' and (
        p_error_code is null
        or p_ambiguity_code is not null
      ))
     or (p_state = 'ambiguous' and (
        p_error_code is not null
        or p_ambiguity_code is null
      )) then
    raise exception 'invalid_receipt_shape: %', p_state;
  end if;

  select ea.*
    into v_effect
    from effect_attempts ea
   where ea.id = p_effect_id
   for update;

  if v_effect.id is null then
    raise exception 'effect_not_found: %', p_effect_id;
  end if;

  if v_effect.request_hash <> p_request_hash then
    raise exception 'idempotency_conflict: receipt request hash changed';
  end if;

  select er.*
    into v_existing
    from effect_receipts er
   where er.effect_attempt_id = p_effect_id;

  if v_existing.id is not null then
    if v_existing.id = p_receipt_id
       and v_existing.state = p_state
       and v_existing.provider_receipt_id is not distinct from p_provider_receipt_id
       and v_existing.error_code is not distinct from p_error_code
       and v_existing.ambiguity_code is not distinct from p_ambiguity_code
       and v_existing.request_hash = p_request_hash
       and v_existing.evidence = p_evidence then
      return next v_existing;
      return;
    end if;

    raise exception 'contradictory_terminal_receipt: effect % already has receipt %',
      p_effect_id, v_existing.id;
  end if;

  if v_effect.lease_token is distinct from p_lease_token then
    raise exception 'stale_effect_lease';
  end if;

  insert into effect_receipts (
    id, assignment_id, command_id, effect_attempt_id, effect_key, provider,
    operation, capability_class, request_hash, state, provider_receipt_id,
    error_code, ambiguity_code, evidence
  )
  values (
    p_receipt_id, v_effect.assignment_id, v_effect.command_id, v_effect.id,
    v_effect.effect_key, v_effect.provider, v_effect.operation,
    v_effect.capability_class, p_request_hash, p_state, p_provider_receipt_id,
    p_error_code, p_ambiguity_code, p_evidence
  )
  returning * into v_receipt;

  update effect_attempts ea
     set state = p_state,
         lease_token = null,
         lease_expires_at = null,
         updated_at = now()
   where ea.id = p_effect_id;

  return next v_receipt;
end
$$;

-- --------------------------------------------------------------------------
-- Receipt-gated completion and deterministic replay
-- --------------------------------------------------------------------------

create or replace function complete_durable_command(
  p_command_id text,
  p_lease_token text,
  p_terminal_receipt_id text,
  p_replay_id text,
  p_response_hash text,
  p_response jsonb
)
returns setof durable_commands
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_command durable_commands%rowtype;
  v_receipt effect_receipts%rowtype;
  v_replay command_replay_responses%rowtype;
  v_terminal_status text;
begin
  if p_response is null or jsonb_typeof(p_response) <> 'object' then
    raise exception 'invalid_replay_response';
  end if;

  select dc.*
    into v_command
    from durable_commands dc
   where dc.id = p_command_id
   for update;

  if v_command.id is null then
    raise exception 'command_not_found: %', p_command_id;
  end if;

  if v_command.status in ('succeeded','failed','ambiguous','cancelled') then
    select crr.*
      into v_replay
      from command_replay_responses crr
     where crr.command_id = p_command_id;

    if v_command.terminal_receipt_id is not distinct from p_terminal_receipt_id
       and v_replay.id is not null
       and v_replay.response_hash = p_response_hash
       and v_replay.response = p_response then
      return next v_command;
      return;
    end if;

    raise exception 'command_already_terminal: %', p_command_id;
  end if;

  if v_command.status <> 'claimed'
     or v_command.lease_token is distinct from p_lease_token then
    raise exception 'stale_command_lease';
  end if;

  select er.*
    into v_receipt
    from effect_receipts er
   where er.id = p_terminal_receipt_id
     and er.command_id = p_command_id;

  if v_receipt.id is null then
    raise exception 'durable_receipt_required: %', p_terminal_receipt_id;
  end if;

  v_terminal_status := case v_receipt.state
    when 'accepted' then 'succeeded'
    when 'failed' then 'failed'
    when 'ambiguous' then 'ambiguous'
  end;

  update durable_commands dc
     set status = v_terminal_status,
         terminal_receipt_id = v_receipt.id,
         lease_token = null,
         lease_expires_at = null,
         updated_at = now()
   where dc.id = p_command_id
  returning dc.* into v_command;

  insert into command_replay_responses (
    id, assignment_id, intent_id, command_id, status, terminal_receipt_id,
    response_hash, response
  )
  values (
    p_replay_id, v_command.assignment_id, v_command.intent_id, v_command.id,
    v_terminal_status, v_receipt.id, p_response_hash, p_response
  );

  return next v_command;
end
$$;

create or replace function replay_durable_command(
  p_assignment_id text,
  p_intent_key text
)
returns table (
  id text,
  intent_id text,
  command_id text,
  status text,
  terminal_receipt_id text,
  response_hash text,
  response jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    crr.id,
    crr.intent_id,
    crr.command_id,
    crr.status,
    crr.terminal_receipt_id,
    crr.response_hash,
    crr.response,
    crr.created_at
  from command_intents ci
  join command_replay_responses crr
    on crr.intent_id = ci.id
   and crr.assignment_id = ci.assignment_id
  where ci.assignment_id = p_assignment_id
    and ci.intent_key = p_intent_key
$$;

-- --------------------------------------------------------------------------
-- Direct table access is internal-only; callers use the bounded RPC surface.
-- --------------------------------------------------------------------------

alter table command_intents enable row level security;
alter table durable_commands enable row level security;
alter table effect_attempts enable row level security;
alter table effect_receipts enable row level security;
alter table command_replay_responses enable row level security;

revoke all on command_intents from anon, authenticated;
revoke all on durable_commands from anon, authenticated;
revoke all on effect_attempts from anon, authenticated;
revoke all on effect_receipts from anon, authenticated;
revoke all on command_replay_responses from anon, authenticated;

grant select, insert, update on command_intents to service_role;
grant select, insert, update on durable_commands to service_role;
grant select, insert, update on effect_attempts to service_role;
grant select, insert, update on effect_receipts to service_role;
grant select, insert, update on command_replay_responses to service_role;

revoke all on function amtech_assert_command_actor(text,text,text,text) from public;
revoke all on function register_durable_command(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text) from public;
revoke all on function claim_durable_command(text,text,integer) from public;
revoke all on function reserve_effect_attempt(text,text,text,text,text,text,text,text,text,integer) from public;
revoke all on function record_effect_receipt(text,text,text,text,text,text,text,text,jsonb) from public;
revoke all on function complete_durable_command(text,text,text,text,text,jsonb) from public;
revoke all on function replay_durable_command(text,text) from public;

grant execute on function amtech_assert_command_actor(text,text,text,text) to service_role;
grant execute on function register_durable_command(text,text,text,text,text,text,text,text,text,text,jsonb,text,text,text) to service_role;
grant execute on function claim_durable_command(text,text,integer) to service_role;
grant execute on function reserve_effect_attempt(text,text,text,text,text,text,text,text,text,integer) to service_role;
grant execute on function record_effect_receipt(text,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function complete_durable_command(text,text,text,text,text,jsonb) to service_role;
grant execute on function replay_durable_command(text,text) to service_role;
