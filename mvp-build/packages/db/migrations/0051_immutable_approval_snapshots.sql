-- S7: approval snapshots contain only immutable action inputs. Provider/output
-- status fields are deliberately excluded so an accepted action can replay from
-- its durable C3 receipt after the resource materialization changes.

begin;

create or replace function amtech_approval_snapshot(
  p_assignment_id text,
  p_action_key text,
  p_resource_class text,
  p_resource_id text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_snapshot jsonb;
  v_stored_hash text;
  v_computed_hash text;
begin
  if p_resource_class = 'outbound_email' and p_action_key in ('send_estimate_email','send_email') then
    select jsonb_build_object(
      'schema_version', 'approval-snapshot-v1',
      'assignment_id', oe.assignment_id,
      'action_key', p_action_key,
      'resource_class', p_resource_class,
      'resource_id', oe.id,
      'connector_id', oe.connector_id,
      'to_email', oe.to_email,
      'subject', oe.subject,
      'body_hash', 'sha256:' || encode(digest(convert_to(coalesce(oe.body, ''), 'utf8'), 'sha256'), 'hex'),
      'attachment_artifact_ids', coalesce(to_jsonb(oe.attachment_artifact_ids), '[]'::jsonb),
      'gmail_thread_id', oe.gmail_thread_id
    ) into v_snapshot
      from outbound_emails oe
     where oe.id = p_resource_id
       and oe.assignment_id = p_assignment_id;
  elsif p_resource_class = 'stripe_invoice' and p_action_key in ('send_deposit_invoice','send_invoice') then
    select jsonb_build_object(
      'schema_version', 'approval-snapshot-v1',
      'assignment_id', si.assignment_id,
      'action_key', p_action_key,
      'resource_class', p_resource_class,
      'resource_id', si.id,
      'stripe_connection_id', si.stripe_connection_id,
      'stripe_invoice_id', si.stripe_invoice_id,
      'estimate_id', si.estimate_id,
      'deposit_amount', si.deposit_amount
    ) into v_snapshot
      from stripe_invoices si
     where si.id = p_resource_id
       and si.assignment_id = p_assignment_id;
  elsif p_resource_class = 'quickbooks_pending_write'
        and p_action_key in (
          'commit_quickbooks_expense','commit_quickbooks_bill',
          'commit_quickbooks_invoice','commit_quickbooks_payment'
        ) then
    select
      qpw.payload_hash,
      encode(digest(convert_to(qpw.canonical_payload, 'utf8'), 'sha256'), 'hex'),
      jsonb_build_object(
        'schema_version', 'approval-snapshot-v1',
        'assignment_id', qpw.assignment_id,
        'action_key', qpw.action_key,
        'resource_class', p_resource_class,
        'resource_id', qpw.id,
        'connector_id', qpw.connector_id,
        'entity_type', qpw.entity_type,
        'payload_hash', 'sha256:' || qpw.payload_hash
      )
      into v_stored_hash, v_computed_hash, v_snapshot
      from quickbooks_pending_writes qpw
     where qpw.id = p_resource_id
       and qpw.assignment_id = p_assignment_id
       and qpw.action_key = p_action_key;
    if v_snapshot is not null and v_stored_hash <> v_computed_hash then
      raise exception 'approval_resource_payload_hash_mismatch';
    end if;
  else
    raise exception 'unsupported_approval_resource: %/%', p_resource_class, p_action_key;
  end if;

  if v_snapshot is null then
    raise exception 'approval_resource_not_found_or_wrong_assignment';
  end if;
  return v_snapshot;
end
$$;

commit;
