begin;

-- WS-07: one durable commercial identity from admission through settlement.
create table if not exists model_gateway_rate_windows (
  credential_id text not null references model_gateway_credentials(id) on delete restrict,
  rate_window_key text not null,
  admitted_count integer not null default 0 check (admitted_count >= 0),
  first_admitted_at timestamptz not null default now(),
  last_admitted_at timestamptz not null default now(),
  primary key (credential_id, rate_window_key)
);

create table if not exists model_gateway_request_reservations (
  request_key text primary key,
  assignment_id text not null references employee_assignments(id) on delete restrict,
  credential_id text not null references model_gateway_credentials(id) on delete restrict,
  revision_id text not null,
  request_hash text not null check (request_hash ~ '^sha256:[0-9a-f]{64}$'),
  route_key text not null,
  provider_idempotency_key text not null,
  rate_window_key text not null,
  state text not null check (state in ('admitted','dispatched','accepted','failed','ambiguous','denied','refunded')),
  reserved_amount_minor integer not null default 0 check (reserved_amount_minor >= 0),
  committed_amount_minor integer not null default 0 check (committed_amount_minor >= 0),
  released_amount_minor integer not null default 0 check (released_amount_minor >= 0),
  refunded_amount_minor integer not null default 0 check (refunded_amount_minor >= 0),
  currency text not null default 'USD',
  command_intent_id text references command_intents(id) on delete restrict,
  command_id text references durable_commands(id) on delete restrict,
  effect_key text,
  provider_receipt_id text,
  effect_receipt_id text references effect_receipts(id) on delete restrict,
  accounting_receipt_id text references commercial_usage_receipts(id) on delete restrict,
  error_code text,
  ambiguity_code text,
  response jsonb not null default '{}'::jsonb check (jsonb_typeof(response) = 'object'),
  proof_state text not null default 'pending' check (proof_state in ('pending','projected','not_applicable','failed')),
  proof_ref text,
  correlation_id text not null,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  admitted_at timestamptz not null default now(),
  dispatched_at timestamptz,
  settled_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (assignment_id, provider_idempotency_key),
  check (committed_amount_minor + released_amount_minor <= reserved_amount_minor),
  check (refunded_amount_minor <= committed_amount_minor),
  check (
    state <> 'accepted'
    or (
      provider_receipt_id is not null
      and effect_receipt_id is not null
      and accounting_receipt_id is not null
      and ambiguity_code is null
      and error_code is null
    )
  ),
  check (state <> 'ambiguous' or ambiguity_code is not null),
  check (state <> 'failed' or error_code is not null),
  check (state <> 'denied' or error_code is not null),
  check (proof_state <> 'projected' or proof_ref is not null)
);

create index if not exists model_gateway_request_assignment_state_idx
  on model_gateway_request_reservations(assignment_id, state, admitted_at desc);
create index if not exists model_gateway_request_reconcile_idx
  on model_gateway_request_reservations(state, updated_at)
  where state in ('dispatched','ambiguous');
create index if not exists model_gateway_request_lineage_idx
  on model_gateway_request_reservations(correlation_id, request_key);

create table if not exists model_gateway_adjustments (
  id text primary key,
  request_key text not null references model_gateway_request_reservations(request_key) on delete restrict,
  assignment_id text not null references employee_assignments(id) on delete restrict,
  adjustment_kind text not null check (adjustment_kind in ('refund','reversal','credit','compensation')),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null,
  reason text not null,
  external_ref text not null,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  unique (request_key, external_ref)
);

-- WS-08 groundwork: a repairable projection is separate from the accepted effect.
create table if not exists effect_proof_projections (
  id text primary key,
  assignment_id text not null references employee_assignments(id) on delete restrict,
  effect_receipt_id text not null references effect_receipts(id) on delete restrict,
  approval_id text references approvals(id) on delete restrict,
  resource_class text not null,
  resource_id text not null,
  revision_id text,
  projection_kind text not null,
  state text not null default 'pending' check (state in ('pending','projected','failed')),
  output_ref text,
  proof_ref text,
  repair_count integer not null default 0 check (repair_count >= 0),
  last_error text,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  projected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (effect_receipt_id, projection_kind),
  check (state <> 'projected' or (output_ref is not null and proof_ref is not null))
);

create index if not exists effect_proof_projection_repair_idx
  on effect_proof_projections(state, updated_at)
  where state in ('pending','failed');
create index if not exists effect_proof_projection_resource_idx
  on effect_proof_projections(assignment_id, resource_class, resource_id, revision_id);

create or replace function admit_model_gateway_request(
  p_request_key text,
  p_assignment_id text,
  p_credential_id text,
  p_revision_id text,
  p_request_hash text,
  p_route_key text,
  p_provider_idempotency_key text,
  p_rate_window_key text,
  p_reserve_amount_minor integer,
  p_correlation_id text
)
returns table (
  admission_kind text,
  request_key text,
  assignment_id text,
  credential_id text,
  revision_id text,
  request_hash text,
  route_key text,
  provider_idempotency_key text,
  rate_window_key text,
  state text,
  reserved_amount_minor integer,
  committed_amount_minor integer,
  released_amount_minor integer,
  refunded_amount_minor integer,
  currency text,
  command_intent_id text,
  command_id text,
  effect_key text,
  provider_receipt_id text,
  effect_receipt_id text,
  accounting_receipt_id text,
  error_code text,
  ambiguity_code text,
  response jsonb,
  proof_state text,
  proof_ref text,
  correlation_id text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_existing model_gateway_request_reservations%rowtype;
  v_credential model_gateway_credentials%rowtype;
  v_assignment employee_assignments%rowtype;
  v_price commercial_price_versions%rowtype;
  v_window model_gateway_rate_windows%rowtype;
  v_exposure bigint;
  v_intent_id text := 'intent_' || substr(md5(p_request_key), 1, 26);
  v_command_id text := 'cmd_' || substr(md5(p_request_key), 1, 28);
  v_effect_key text := 'model_gateway:' || substr(md5(p_request_key || ':' || p_request_hash), 1, 32);
  v_row model_gateway_request_reservations%rowtype;
  v_admission_kind text;
begin
  if coalesce(p_request_key, '') = ''
     or coalesce(p_revision_id, '') = ''
     or coalesce(p_route_key, '') = ''
     or coalesce(p_provider_idempotency_key, '') = ''
     or coalesce(p_rate_window_key, '') = ''
     or coalesce(p_correlation_id, '') = ''
     or p_request_hash !~ '^sha256:[0-9a-f]{64}$'
     or p_reserve_amount_minor < 0 then
    raise exception 'invalid_model_gateway_admission';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_credential_id, 0));

  select * into v_existing
    from model_gateway_request_reservations r
   where r.request_key = p_request_key
   for update;
  if v_existing.request_key is not null then
    if v_existing.assignment_id <> p_assignment_id
       or v_existing.credential_id <> p_credential_id
       or v_existing.revision_id <> p_revision_id
       or v_existing.request_hash <> p_request_hash
       or v_existing.route_key <> p_route_key
       or v_existing.provider_idempotency_key <> p_provider_idempotency_key
       or v_existing.rate_window_key <> p_rate_window_key
       or v_existing.reserved_amount_minor <> p_reserve_amount_minor
       or v_existing.correlation_id <> p_correlation_id then
      raise exception 'model_gateway_idempotency_conflict';
    end if;
    v_row := v_existing;
    v_admission_kind := 'replay';
    return query select v_admission_kind, v_row.request_key, v_row.assignment_id, v_row.credential_id,
      v_row.revision_id, v_row.request_hash, v_row.route_key, v_row.provider_idempotency_key,
      v_row.rate_window_key, v_row.state, v_row.reserved_amount_minor, v_row.committed_amount_minor,
      v_row.released_amount_minor, v_row.refunded_amount_minor, v_row.currency,
      v_row.command_intent_id, v_row.command_id, v_row.effect_key, v_row.provider_receipt_id,
      v_row.effect_receipt_id, v_row.accounting_receipt_id, v_row.error_code,
      v_row.ambiguity_code, v_row.response, v_row.proof_state, v_row.proof_ref, v_row.correlation_id;
    return;
  end if;

  select * into v_credential
    from model_gateway_credentials c
   where c.id = p_credential_id
   for update;
  if v_credential.id is null
     or v_credential.assignment_id <> p_assignment_id
     or v_credential.revoked_at is not null
     or v_credential.expires_at <= now()
     or not amtech_assignment_launch_allowed(p_assignment_id) then
    raise exception 'model_gateway_authority_stale';
  end if;

  select * into v_assignment from employee_assignments where id = p_assignment_id;
  if v_assignment.id is null
     or v_assignment.status <> 'active'
     or v_assignment.starts_at > now()
     or (v_assignment.ends_at is not null and now() >= v_assignment.ends_at) then
    raise exception 'model_gateway_assignment_stale';
  end if;

  if not exists (
    select 1 from commercial_relationships cr
     where cr.id = v_credential.payer_relationship_id
       and cr.assignment_id = p_assignment_id
       and cr.relationship_type = 'payer'
       and amtech_relationship_current(cr.status, cr.starts_at, cr.ends_at)
  ) or not exists (
    select 1 from commercial_relationships cr
     where cr.id = v_credential.beneficiary_relationship_id
       and cr.assignment_id = p_assignment_id
       and cr.relationship_type = 'beneficiary'
       and amtech_relationship_current(cr.status, cr.starts_at, cr.ends_at)
  ) then
    raise exception 'model_gateway_commercial_relationship_stale';
  end if;

  select * into v_price
    from commercial_price_versions cpv
   where cpv.id = v_credential.price_version_id
     and cpv.assignment_id = p_assignment_id
     and cpv.status = 'active'
     and cpv.effective_at <= now()
     and (cpv.expires_at is null or now() < cpv.expires_at);
  if v_price.id is null then
    raise exception 'model_gateway_price_version_stale';
  end if;

  insert into model_gateway_rate_windows(credential_id, rate_window_key, admitted_count)
  values(p_credential_id, p_rate_window_key, 0)
  on conflict (credential_id, rate_window_key) do nothing;
  select * into v_window
    from model_gateway_rate_windows rw
   where rw.credential_id = p_credential_id
     and rw.rate_window_key = p_rate_window_key
   for update;

  if v_window.admitted_count >= v_credential.rate_limit_per_minute then
    insert into model_gateway_request_reservations(
      request_key, assignment_id, credential_id, revision_id, request_hash, route_key,
      provider_idempotency_key, rate_window_key, state, reserved_amount_minor, currency,
      error_code, proof_state, correlation_id, evidence
    ) values(
      p_request_key, p_assignment_id, p_credential_id, p_revision_id, p_request_hash, p_route_key,
      p_provider_idempotency_key, p_rate_window_key, 'denied', 0, v_price.currency,
      'rate_limit_exceeded', 'not_applicable', p_correlation_id,
      jsonb_build_object('authority','model_gateway_rate_windows')
    ) returning * into v_row;
    v_admission_kind := 'denied';
    return query select v_admission_kind, v_row.request_key, v_row.assignment_id, v_row.credential_id,
      v_row.revision_id, v_row.request_hash, v_row.route_key, v_row.provider_idempotency_key,
      v_row.rate_window_key, v_row.state, v_row.reserved_amount_minor, v_row.committed_amount_minor,
      v_row.released_amount_minor, v_row.refunded_amount_minor, v_row.currency,
      v_row.command_intent_id, v_row.command_id, v_row.effect_key, v_row.provider_receipt_id,
      v_row.effect_receipt_id, v_row.accounting_receipt_id, v_row.error_code,
      v_row.ambiguity_code, v_row.response, v_row.proof_state, v_row.proof_ref, v_row.correlation_id;
    return;
  end if;

  update model_gateway_rate_windows
     set admitted_count = admitted_count + 1,
         last_admitted_at = now()
   where credential_id = p_credential_id and rate_window_key = p_rate_window_key
   returning * into v_window;

  select coalesce(sum(greatest(r.reserved_amount_minor - r.released_amount_minor - r.refunded_amount_minor, 0)), 0)
    into v_exposure
    from model_gateway_request_reservations r
   where r.credential_id = p_credential_id
     and r.state <> 'denied';

  if v_exposure + p_reserve_amount_minor > v_credential.spend_limit_cents then
    insert into model_gateway_request_reservations(
      request_key, assignment_id, credential_id, revision_id, request_hash, route_key,
      provider_idempotency_key, rate_window_key, state, reserved_amount_minor, currency,
      error_code, proof_state, correlation_id, evidence
    ) values(
      p_request_key, p_assignment_id, p_credential_id, p_revision_id, p_request_hash, p_route_key,
      p_provider_idempotency_key, p_rate_window_key, 'denied', 0, v_price.currency,
      'budget_reservation_conflict', 'not_applicable', p_correlation_id,
      jsonb_build_object('exposure_minor',v_exposure,'limit_minor',v_credential.spend_limit_cents)
    ) returning * into v_row;
    v_admission_kind := 'denied';
  else
    perform register_durable_command(
      v_intent_id, p_assignment_id, p_credential_id, 'service', 'model_gateway_credential',
      p_request_key, v_command_id, 'model_gateway_request', '1.0.0', v_assignment.policy_version,
      jsonb_build_object(
        'request_key', p_request_key,
        'revision_id', p_revision_id,
        'route_key', p_route_key,
        'provider_idempotency_key', p_provider_idempotency_key,
        'reserve_amount_minor', p_reserve_amount_minor
      ),
      p_request_hash, p_correlation_id, null
    );
    insert into model_gateway_request_reservations(
      request_key, assignment_id, credential_id, revision_id, request_hash, route_key,
      provider_idempotency_key, rate_window_key, state, reserved_amount_minor, currency,
      command_intent_id, command_id, effect_key, correlation_id, evidence
    ) values(
      p_request_key, p_assignment_id, p_credential_id, p_revision_id, p_request_hash, p_route_key,
      p_provider_idempotency_key, p_rate_window_key, 'admitted', p_reserve_amount_minor, v_price.currency,
      v_intent_id, v_command_id, v_effect_key, p_correlation_id,
      jsonb_build_object('authority','postgres','credential_version',v_credential.credential_version)
    ) returning * into v_row;
    v_admission_kind := 'admitted';
  end if;

  return query select v_admission_kind, v_row.request_key, v_row.assignment_id, v_row.credential_id,
    v_row.revision_id, v_row.request_hash, v_row.route_key, v_row.provider_idempotency_key,
    v_row.rate_window_key, v_row.state, v_row.reserved_amount_minor, v_row.committed_amount_minor,
    v_row.released_amount_minor, v_row.refunded_amount_minor, v_row.currency,
    v_row.command_intent_id, v_row.command_id, v_row.effect_key, v_row.provider_receipt_id,
    v_row.effect_receipt_id, v_row.accounting_receipt_id, v_row.error_code,
    v_row.ambiguity_code, v_row.response, v_row.proof_state, v_row.proof_ref, v_row.correlation_id;
end
$$;

create or replace function mark_model_gateway_request_dispatched(p_request_key text)
returns setof model_gateway_request_reservations
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_row model_gateway_request_reservations%rowtype;
begin
  select * into v_row from model_gateway_request_reservations where request_key = p_request_key for update;
  if v_row.request_key is null then raise exception 'model_gateway_request_not_found'; end if;
  if v_row.state = 'admitted' then
    update model_gateway_request_reservations
       set state = 'dispatched', dispatched_at = now(), updated_at = now()
     where request_key = p_request_key returning * into v_row;
  elsif v_row.state <> 'dispatched' then
    return next v_row; return;
  end if;
  return next v_row;
end
$$;

create or replace function settle_model_gateway_request(
  p_request_key text,
  p_state text,
  p_amount_minor integer,
  p_provider_receipt_id text,
  p_effect_receipt_id text,
  p_accounting_receipt_id text,
  p_error_code text,
  p_ambiguity_code text,
  p_response jsonb,
  p_evidence jsonb default '{}'::jsonb
)
returns setof model_gateway_request_reservations
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_row model_gateway_request_reservations%rowtype;
  v_effect effect_receipts%rowtype;
  v_usage commercial_usage_receipts%rowtype;
begin
  select * into v_row from model_gateway_request_reservations where request_key = p_request_key for update;
  if v_row.request_key is null then raise exception 'model_gateway_request_not_found'; end if;
  if p_state not in ('accepted','failed','ambiguous') or p_amount_minor < 0 then
    raise exception 'invalid_model_gateway_settlement';
  end if;

  if v_row.state in ('accepted','failed','ambiguous') then
    if v_row.state <> p_state
       or v_row.provider_receipt_id is distinct from p_provider_receipt_id
       or v_row.effect_receipt_id is distinct from p_effect_receipt_id
       or v_row.accounting_receipt_id is distinct from p_accounting_receipt_id then
      raise exception 'model_gateway_settlement_conflict';
    end if;
    return next v_row; return;
  end if;
  if v_row.state not in ('admitted','dispatched') then
    raise exception 'model_gateway_request_not_settleable: %', v_row.state;
  end if;

  if p_state = 'accepted' then
    if p_amount_minor > v_row.reserved_amount_minor
       or coalesce(p_provider_receipt_id,'') = ''
       or coalesce(p_effect_receipt_id,'') = ''
       or coalesce(p_accounting_receipt_id,'') = '' then
      raise exception 'accepted_gateway_settlement_incomplete';
    end if;
    select * into v_effect from effect_receipts where id = p_effect_receipt_id;
    select * into v_usage from commercial_usage_receipts where id = p_accounting_receipt_id;
    if v_effect.id is null
       or v_effect.assignment_id <> v_row.assignment_id
       or v_effect.state <> 'accepted'
       or v_effect.provider_receipt_id <> p_provider_receipt_id
       or v_effect.effect_key <> v_row.effect_key then
      raise exception 'gateway_effect_receipt_mismatch';
    end if;
    if v_usage.id is null
       or v_usage.assignment_id <> v_row.assignment_id
       or v_usage.state <> 'accepted'
       or v_usage.effect_receipt_id <> p_effect_receipt_id
       or v_usage.provider_receipt_id <> p_provider_receipt_id then
      raise exception 'gateway_accounting_receipt_mismatch';
    end if;
    update model_gateway_request_reservations
       set state = 'accepted',
           committed_amount_minor = p_amount_minor,
           released_amount_minor = reserved_amount_minor - p_amount_minor,
           provider_receipt_id = p_provider_receipt_id,
           effect_receipt_id = p_effect_receipt_id,
           accounting_receipt_id = p_accounting_receipt_id,
           error_code = null,
           ambiguity_code = null,
           response = coalesce(p_response,'{}'::jsonb),
           evidence = evidence || coalesce(p_evidence,'{}'::jsonb),
           settled_at = now(), updated_at = now()
     where request_key = p_request_key returning * into v_row;
  elsif p_state = 'failed' then
    if coalesce(p_error_code,'') = '' then raise exception 'failed_gateway_settlement_requires_error'; end if;
    update model_gateway_request_reservations
       set state = 'failed', released_amount_minor = reserved_amount_minor,
           error_code = p_error_code, ambiguity_code = null,
           response = coalesce(p_response,'{}'::jsonb),
           proof_state = 'not_applicable',
           evidence = evidence || coalesce(p_evidence,'{}'::jsonb),
           settled_at = now(), updated_at = now()
     where request_key = p_request_key returning * into v_row;
  else
    if coalesce(p_ambiguity_code,'') = '' then raise exception 'ambiguous_gateway_settlement_requires_code'; end if;
    update model_gateway_request_reservations
       set state = 'ambiguous', ambiguity_code = p_ambiguity_code, error_code = null,
           response = coalesce(p_response,'{}'::jsonb),
           evidence = evidence || coalesce(p_evidence,'{}'::jsonb),
           settled_at = now(), updated_at = now()
     where request_key = p_request_key returning * into v_row;
  end if;
  return next v_row;
end
$$;

create or replace function refund_model_gateway_request(
  p_request_key text,
  p_amount_minor integer,
  p_reason text,
  p_external_ref text
)
returns setof model_gateway_request_reservations
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_row model_gateway_request_reservations%rowtype;
  v_adjustment_id text := 'mgadj_' || substr(md5(p_request_key || ':' || p_external_ref), 1, 28);
begin
  select * into v_row from model_gateway_request_reservations where request_key = p_request_key for update;
  if v_row.request_key is null or v_row.state not in ('accepted','refunded') then
    raise exception 'gateway_refund_not_allowed';
  end if;
  if p_amount_minor <= 0 or v_row.refunded_amount_minor + p_amount_minor > v_row.committed_amount_minor then
    raise exception 'gateway_refund_amount_invalid';
  end if;
  insert into model_gateway_adjustments(id,request_key,assignment_id,adjustment_kind,amount_minor,currency,reason,external_ref)
  values(v_adjustment_id,p_request_key,v_row.assignment_id,'refund',p_amount_minor,v_row.currency,p_reason,p_external_ref)
  on conflict (request_key,external_ref) do nothing;
  if found then
    update model_gateway_request_reservations
       set refunded_amount_minor = refunded_amount_minor + p_amount_minor,
           state = 'refunded', updated_at = now()
     where request_key = p_request_key returning * into v_row;
  else
    select * into v_row from model_gateway_request_reservations where request_key = p_request_key;
  end if;
  return next v_row;
end
$$;

create or replace function project_model_gateway_request_proof(p_request_key text, p_proof_ref text)
returns setof model_gateway_request_reservations
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_row model_gateway_request_reservations%rowtype;
begin
  if coalesce(p_proof_ref,'') = '' then raise exception 'gateway_proof_ref_required'; end if;
  update model_gateway_request_reservations
     set proof_state = 'projected', proof_ref = p_proof_ref, updated_at = now()
   where request_key = p_request_key
     and state in ('accepted','refunded')
   returning * into v_row;
  if v_row.request_key is null then raise exception 'gateway_accepted_request_required'; end if;
  return next v_row;
end
$$;

create or replace function project_effect_proof(
  p_projection_id text,
  p_assignment_id text,
  p_effect_receipt_id text,
  p_approval_id text,
  p_resource_class text,
  p_resource_id text,
  p_revision_id text,
  p_projection_kind text,
  p_output_ref text,
  p_proof_ref text,
  p_evidence jsonb default '{}'::jsonb
)
returns setof effect_proof_projections
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_effect effect_receipts%rowtype;
  v_approval approvals%rowtype;
  v_projection effect_proof_projections%rowtype;
begin
  select * into v_effect from effect_receipts where id = p_effect_receipt_id;
  if v_effect.id is null or v_effect.assignment_id <> p_assignment_id or v_effect.state <> 'accepted' then
    raise exception 'proof_projection_requires_accepted_effect';
  end if;
  if p_approval_id is not null then
    select * into v_approval from approvals where id = p_approval_id;
    if v_approval.id is null
       or v_approval.assignment_id <> p_assignment_id
       or v_approval.resource_class <> p_resource_class
       or v_approval.resource_id <> p_resource_id
       or v_approval.execution_receipt_id <> p_effect_receipt_id
       or v_approval.resolution <> 'approved' then
      raise exception 'proof_projection_approval_mismatch';
    end if;
    if p_revision_id is not null
       and coalesce(v_approval.snapshot->>'current_revision_id','') <> p_revision_id then
      raise exception 'proof_projection_revision_mismatch';
    end if;
  end if;
  insert into effect_proof_projections(
    id,assignment_id,effect_receipt_id,approval_id,resource_class,resource_id,
    revision_id,projection_kind,state,output_ref,proof_ref,evidence,projected_at
  ) values(
    p_projection_id,p_assignment_id,p_effect_receipt_id,p_approval_id,p_resource_class,p_resource_id,
    p_revision_id,p_projection_kind,'projected',p_output_ref,p_proof_ref,coalesce(p_evidence,'{}'::jsonb),now()
  )
  on conflict (effect_receipt_id,projection_kind) do update set
    state = 'projected',
    output_ref = excluded.output_ref,
    proof_ref = excluded.proof_ref,
    evidence = effect_proof_projections.evidence || excluded.evidence,
    last_error = null,
    projected_at = coalesce(effect_proof_projections.projected_at, excluded.projected_at),
    repair_count = case when effect_proof_projections.state = 'projected' then effect_proof_projections.repair_count else effect_proof_projections.repair_count + 1 end,
    updated_at = now()
  returning * into v_projection;
  return next v_projection;
end
$$;

create or replace function gateway_commercial_conservation(p_assignment_id text, p_currency text default 'USD')
returns table(
  reserved_minor bigint,
  committed_minor bigint,
  released_minor bigint,
  refunded_minor bigint,
  outstanding_minor bigint,
  net_committed_minor bigint,
  delta_minor integer
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      coalesce(sum(reserved_amount_minor),0)::bigint as reserved,
      coalesce(sum(committed_amount_minor),0)::bigint as committed,
      coalesce(sum(released_amount_minor),0)::bigint as released,
      coalesce(sum(refunded_amount_minor),0)::bigint as refunded,
      coalesce(sum(greatest(reserved_amount_minor - committed_amount_minor - released_amount_minor,0)),0)::bigint as outstanding
    from model_gateway_request_reservations
    where assignment_id = p_assignment_id and currency = p_currency and state <> 'denied'
  )
  select reserved, committed, released, refunded, outstanding,
         committed - refunded,
         (reserved - committed - released - outstanding + committed - (committed - refunded) - refunded)::integer
    from totals
$$;

create or replace view model_gateway_reconciliation_queue as
select request_key, assignment_id, credential_id, revision_id, state, provider_idempotency_key,
       command_id, effect_key, correlation_id, reserved_amount_minor, updated_at, evidence
  from model_gateway_request_reservations
 where state in ('dispatched','ambiguous')
 order by updated_at;

create or replace view effect_proof_repair_queue as
select id, assignment_id, effect_receipt_id, approval_id, resource_class, resource_id,
       revision_id, projection_kind, state, repair_count, last_error, updated_at
  from effect_proof_projections
 where state in ('pending','failed')
 order by updated_at;

create or replace view commercial_effect_lineage as
select r.request_key, r.assignment_id, r.revision_id, r.command_intent_id, r.command_id,
       r.effect_key, r.provider_receipt_id, r.effect_receipt_id, r.accounting_receipt_id,
       r.proof_state, r.proof_ref, r.correlation_id, r.state,
       p.id as projection_id, p.resource_class, p.resource_id, p.projection_kind,
       p.output_ref, p.proof_ref as projection_proof_ref, p.state as projection_state
  from model_gateway_request_reservations r
  left join effect_proof_projections p on p.effect_receipt_id = r.effect_receipt_id;

alter table model_gateway_rate_windows enable row level security;
alter table model_gateway_request_reservations enable row level security;
alter table model_gateway_adjustments enable row level security;
alter table effect_proof_projections enable row level security;

revoke all on model_gateway_rate_windows, model_gateway_request_reservations, model_gateway_adjustments, effect_proof_projections from anon, authenticated;
revoke all on model_gateway_reconciliation_queue, effect_proof_repair_queue, commercial_effect_lineage from anon, authenticated;
grant select, insert, update on model_gateway_rate_windows, model_gateway_request_reservations, model_gateway_adjustments, effect_proof_projections to service_role;
grant select on model_gateway_reconciliation_queue, effect_proof_repair_queue, commercial_effect_lineage to service_role;

revoke all on function admit_model_gateway_request(text,text,text,text,text,text,text,text,integer,text) from public, anon, authenticated;
revoke all on function mark_model_gateway_request_dispatched(text) from public, anon, authenticated;
revoke all on function settle_model_gateway_request(text,text,integer,text,text,text,text,text,jsonb,jsonb) from public, anon, authenticated;
revoke all on function refund_model_gateway_request(text,integer,text,text) from public, anon, authenticated;
revoke all on function project_model_gateway_request_proof(text,text) from public, anon, authenticated;
revoke all on function project_effect_proof(text,text,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function gateway_commercial_conservation(text,text) from public, anon, authenticated;

grant execute on function admit_model_gateway_request(text,text,text,text,text,text,text,text,integer,text) to service_role;
grant execute on function mark_model_gateway_request_dispatched(text) to service_role;
grant execute on function settle_model_gateway_request(text,text,integer,text,text,text,text,text,jsonb,jsonb) to service_role;
grant execute on function refund_model_gateway_request(text,integer,text,text) to service_role;
grant execute on function project_model_gateway_request_proof(text,text) to service_role;
grant execute on function project_effect_proof(text,text,text,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function gateway_commercial_conservation(text,text) to service_role;

commit;
