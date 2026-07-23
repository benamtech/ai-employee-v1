begin;

-- Forward-only WS-08 repair: ambiguity may converge to accepted only from exact
-- durable receipts. This never dispatches a provider effect and never erases the
-- prior ambiguous evidence.
create or replace function reconcile_model_gateway_request(
  p_request_key text,
  p_amount_minor integer,
  p_provider_receipt_id text,
  p_effect_receipt_id text,
  p_accounting_receipt_id text,
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
  select * into v_row
    from model_gateway_request_reservations
   where request_key = p_request_key
   for update;
  if v_row.request_key is null then raise exception 'model_gateway_request_not_found'; end if;
  if v_row.state in ('accepted','refunded') then
    if v_row.provider_receipt_id <> p_provider_receipt_id
       or v_row.effect_receipt_id <> p_effect_receipt_id
       or v_row.accounting_receipt_id <> p_accounting_receipt_id then
      raise exception 'model_gateway_reconciliation_conflict';
    end if;
    return next v_row; return;
  end if;
  if v_row.state <> 'ambiguous' then raise exception 'model_gateway_request_not_ambiguous'; end if;
  if p_amount_minor < 0 or p_amount_minor > v_row.reserved_amount_minor then
    raise exception 'model_gateway_reconciliation_amount_invalid';
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
         evidence = evidence || jsonb_build_object(
           'reconciled_from','ambiguous',
           'prior_ambiguity_code',v_row.ambiguity_code,
           'reconciled_at',now()
         ) || coalesce(p_evidence,'{}'::jsonb),
         settled_at = now(),
         updated_at = now()
   where request_key = p_request_key
   returning * into v_row;
  return next v_row;
end
$$;

create or replace function mark_effect_proof_projection_failed(
  p_effect_receipt_id text,
  p_projection_kind text,
  p_error text,
  p_evidence jsonb default '{}'::jsonb
)
returns setof effect_proof_projections
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v_projection effect_proof_projections%rowtype;
begin
  update effect_proof_projections
     set state = 'failed',
         repair_count = repair_count + 1,
         last_error = left(coalesce(p_error,'projection_failed'),180),
         evidence = evidence || coalesce(p_evidence,'{}'::jsonb),
         updated_at = now()
   where effect_receipt_id = p_effect_receipt_id
     and projection_kind = p_projection_kind
     and state <> 'projected'
   returning * into v_projection;
  if v_projection.id is null then raise exception 'effect_proof_projection_not_pending'; end if;
  return next v_projection;
end
$$;

revoke all on function reconcile_model_gateway_request(text,integer,text,text,text,jsonb,jsonb) from public, anon, authenticated;
revoke all on function mark_effect_proof_projection_failed(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function reconcile_model_gateway_request(text,integer,text,text,text,jsonb,jsonb) to service_role;
grant execute on function mark_effect_proof_projection_failed(text,text,text,jsonb) to service_role;

commit;
