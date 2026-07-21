-- Forward-only repair for the remaining PL/pgSQL output-column namespace
-- collision in the rate-window UPDATE. Migrations 0077 and 0078 remain immutable.
begin;

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
  v_rate_window_key text;
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
       or v_existing.provider_idempotency_key <> p_provider_idempotency_key then
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

  select * into v_assignment from employee_assignments ea where ea.id = p_assignment_id;
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

  v_rate_window_key := p_credential_id || ':' ||
    to_char(statement_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI');

  insert into model_gateway_rate_windows(credential_id, rate_window_key, admitted_count)
  values(p_credential_id, v_rate_window_key, 0)
  on conflict on constraint model_gateway_rate_windows_pkey do nothing;
  select * into v_window
    from model_gateway_rate_windows rw
   where rw.credential_id = p_credential_id
     and rw.rate_window_key = v_rate_window_key
   for update;

  if v_window.admitted_count >= v_credential.rate_limit_per_minute then
    insert into model_gateway_request_reservations(
      request_key, assignment_id, credential_id, revision_id, request_hash, route_key,
      provider_idempotency_key, rate_window_key, state, reserved_amount_minor, currency,
      error_code, proof_state, correlation_id, evidence
    ) values(
      p_request_key, p_assignment_id, p_credential_id, p_revision_id, p_request_hash, p_route_key,
      p_provider_idempotency_key, v_rate_window_key, 'denied', 0, v_price.currency,
      'rate_limit_exceeded', 'not_applicable', p_correlation_id,
      jsonb_build_object(
        'authority','model_gateway_rate_windows',
        'rate_window_authority','database_statement_minute',
        'caller_rate_window_ignored', p_rate_window_key is distinct from v_rate_window_key
      )
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

  update model_gateway_rate_windows as rw
     set admitted_count = rw.admitted_count + 1,
         last_admitted_at = now()
   where rw.credential_id = p_credential_id
     and rw.rate_window_key = v_rate_window_key
   returning rw.* into v_window;

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
      p_provider_idempotency_key, v_rate_window_key, 'denied', 0, v_price.currency,
      'budget_reservation_conflict', 'not_applicable', p_correlation_id,
      jsonb_build_object(
        'exposure_minor',v_exposure,
        'limit_minor',v_credential.spend_limit_cents,
        'rate_window_authority','database_statement_minute',
        'caller_rate_window_ignored', p_rate_window_key is distinct from v_rate_window_key
      )
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
      p_provider_idempotency_key, v_rate_window_key, 'admitted', p_reserve_amount_minor, v_price.currency,
      v_intent_id, v_command_id, v_effect_key, p_correlation_id,
      jsonb_build_object(
        'authority','postgres',
        'credential_version',v_credential.credential_version,
        'rate_window_authority','database_statement_minute',
        'caller_rate_window_ignored', p_rate_window_key is distinct from v_rate_window_key
      )
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

revoke all on function admit_model_gateway_request(text,text,text,text,text,text,text,text,integer,text)
  from public, anon, authenticated;
grant execute on function admit_model_gateway_request(text,text,text,text,text,text,text,text,integer,text)
  to service_role;

commit;
