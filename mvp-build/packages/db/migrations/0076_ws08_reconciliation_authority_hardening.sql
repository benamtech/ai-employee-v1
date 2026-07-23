begin;

-- Native provider idempotency is reconcilable only through the already-reserved
-- effect identity and its exact provider idempotency key. This replaces the C3
-- function without adding a second effect or allowing ordinary redispatch.
create or replace function reconcile_ambiguous_command(
  p_command_id text,
  p_target_state text,
  p_provider_receipt_id text,
  p_error_code text,
  p_response_hash text,
  p_response jsonb,
  p_evidence jsonb
)
returns setof durable_commands
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_command durable_commands%rowtype;
  v_effect effect_attempts%rowtype;
  v_receipt effect_receipts%rowtype;
  v_replay command_replay_responses%rowtype;
  v_command_status text;
begin
  if p_target_state not in ('accepted','failed') then
    raise exception 'invalid_reconciliation_target: %', p_target_state;
  end if;
  if p_response is null or jsonb_typeof(p_response) <> 'object'
     or p_evidence is null or jsonb_typeof(p_evidence) <> 'object'
     or p_response_hash !~ '^sha256:[0-9a-f]{64}$' then
    raise exception 'invalid_reconciliation_evidence';
  end if;
  if (p_target_state = 'accepted' and (coalesce(p_provider_receipt_id, '') = '' or p_error_code is not null))
     or (p_target_state = 'failed' and (p_provider_receipt_id is not null or coalesce(p_error_code, '') = '')) then
    raise exception 'invalid_reconciliation_shape: %', p_target_state;
  end if;

  select * into v_command
    from durable_commands
   where id = p_command_id
   for update;
  if v_command.id is null then raise exception 'command_not_found: %', p_command_id; end if;

  select * into v_replay
    from command_replay_responses
   where command_id = p_command_id
   for update;
  if v_replay.id is null then raise exception 'command_replay_missing: %', p_command_id; end if;

  if v_command.status in ('succeeded','failed') then
    if v_replay.response_hash = p_response_hash and v_replay.response = p_response then
      return next v_command;
      return;
    end if;
    raise exception 'command_already_reconciled: %', p_command_id;
  end if;
  if v_command.status <> 'ambiguous' or v_replay.status <> 'ambiguous' then
    raise exception 'command_not_ambiguous: %', p_command_id;
  end if;

  select * into v_receipt
    from effect_receipts
   where id = v_command.terminal_receipt_id
     and command_id = p_command_id
   for update;
  if v_receipt.id is null or v_receipt.state <> 'ambiguous' then
    raise exception 'ambiguous_receipt_missing: %', p_command_id;
  end if;

  select * into v_effect
    from effect_attempts
   where id = v_receipt.effect_attempt_id
     and command_id = p_command_id
   for update;
  if v_effect.id is null
     or v_effect.state <> 'ambiguous'
     or v_effect.capability_class not in ('native_idempotency','queryable_receipt','consumer_dedupe')
     or (v_effect.capability_class = 'native_idempotency' and coalesce(v_effect.provider_idempotency_key,'') = '') then
    raise exception 'effect_not_reconcilable: %', p_command_id;
  end if;

  update effect_receipts
     set state = p_target_state,
         provider_receipt_id = case when p_target_state = 'accepted' then p_provider_receipt_id else null end,
         error_code = case when p_target_state = 'failed' then p_error_code else null end,
         ambiguity_code = null,
         evidence = v_receipt.evidence || p_evidence || jsonb_build_object(
           'reconciled_from', 'ambiguous',
           'reconciliation_capability_class', v_effect.capability_class,
           'provider_idempotency_key_present', v_effect.provider_idempotency_key is not null,
           'reconciled_at', now()
         ),
         observed_at = now()
   where id = v_receipt.id;

  update effect_attempts
     set state = 'reconciled',
         lease_token = null,
         lease_expires_at = null,
         updated_at = now()
   where id = v_effect.id;

  v_command_status := case when p_target_state = 'accepted' then 'succeeded' else 'failed' end;
  update durable_commands
     set status = v_command_status,
         updated_at = now()
   where id = p_command_id
   returning * into v_command;

  update command_replay_responses
     set status = v_command_status,
         response_hash = p_response_hash,
         response = p_response
   where command_id = p_command_id;

  return next v_command;
end
$$;

create or replace function amtech_immutable_gateway_adjustment_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'model_gateway_adjustments_are_immutable';
end
$$;

drop trigger if exists model_gateway_adjustment_immutable on model_gateway_adjustments;
create trigger model_gateway_adjustment_immutable
before update or delete on model_gateway_adjustments
for each row execute function amtech_immutable_gateway_adjustment_guard();

-- The authority tables are mutated only through reviewed security-definer RPCs.
-- Service workers may inspect them directly but cannot bypass conservation,
-- receipt, ambiguity, or projection guards with raw table writes.
revoke insert, update, delete on model_gateway_rate_windows from service_role;
revoke insert, update, delete on model_gateway_request_reservations from service_role;
revoke insert, update, delete on model_gateway_adjustments from service_role;
revoke insert, update, delete on effect_proof_projections from service_role;
grant select on model_gateway_rate_windows, model_gateway_request_reservations, model_gateway_adjustments, effect_proof_projections to service_role;

revoke all on function amtech_immutable_gateway_adjustment_guard() from public, anon, authenticated;
grant execute on function amtech_immutable_gateway_adjustment_guard() to service_role;

commit;
