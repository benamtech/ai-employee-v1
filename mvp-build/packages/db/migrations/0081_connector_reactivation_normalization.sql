-- ============================================================================
-- AMTECH WS-02/WS-06 — connector reactivation normalization
--
-- Migration 0080 added provider-neutral lifecycle projections. Existing binding
-- IDs are intentionally stable, so a fresh verified reconnect can upsert a row
-- that was previously revoked. Normalize that transition before persistence and
-- project a durable connected receipt after persistence.
-- ============================================================================

begin;

create or replace function amtech_normalize_connector_binding_activation()
returns trigger
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_fresh_activation boolean;
begin
  if tg_op = 'INSERT' then
    v_fresh_activation := new.status = 'active' and new.revoked_at is null;
  else
    v_fresh_activation := new.status = 'active'
      and new.revoked_at is null
      and (
        old.status is distinct from 'active'
        or old.revoked_at is not null
        or old.lifecycle_state in ('revoked','expired','degraded','setup_required')
        or old.provider_verification_ref is distinct from new.provider_verification_ref
        or old.provider_verified_at is distinct from new.provider_verified_at
      );
  end if;

  if v_fresh_activation then
    new.connector_key := coalesce(nullif(new.connector_key, ''), new.provider);
    new.lifecycle_state := 'connected';
    new.discovery_state := 'pending';
    new.discovered_capabilities := '[]'::jsonb;
    new.last_capability_discovery_at := null;
    new.last_health_check_at := null;
    new.revocation_reason := null;
    new.revocation_evidence := '{}'::jsonb;
    new.expires_at := null;
  end if;

  return new;
end
$$;

drop trigger if exists connector_binding_activation_normalization on connector_bindings;
create trigger connector_binding_activation_normalization
before insert or update of status, revoked_at, provider_verification_ref, provider_verified_at
on connector_bindings
for each row execute function amtech_normalize_connector_binding_activation();

create or replace function amtech_project_connector_binding_activation()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_fresh_activation boolean;
  v_event_id text;
begin
  if tg_op = 'INSERT' then
    v_fresh_activation := new.status = 'active'
      and new.revoked_at is null
      and new.lifecycle_state = 'connected'
      and new.discovery_state = 'pending';
  else
    v_fresh_activation := new.status = 'active'
      and new.revoked_at is null
      and new.lifecycle_state = 'connected'
      and new.discovery_state = 'pending'
      and (
        old.status is distinct from 'active'
        or old.revoked_at is not null
        or old.lifecycle_state is distinct from 'connected'
        or old.provider_verification_ref is distinct from new.provider_verification_ref
        or old.provider_verified_at is distinct from new.provider_verified_at
      );
  end if;

  if not v_fresh_activation then
    return new;
  end if;

  update connector_setup_intents csi
     set status = 'connected',
         updated_at = now(),
         evidence = csi.evidence || jsonb_build_object(
           'connector_binding_id', new.id,
           'provider_verification_ref', new.provider_verification_ref,
           'connected_at', now()
         )
   where csi.assignment_id = new.assignment_id
     and csi.connector_key = coalesce(new.connector_key, new.provider)
     and csi.status in ('requested','in_progress','ready');

  v_event_id := 'cle_' || substr(encode(digest(
    new.id || ':' || coalesce(new.provider_verification_ref, '') || ':' || new.provider_verified_at::text || ':connected',
    'sha256'
  ), 'hex'), 1, 28);

  insert into connector_lifecycle_events (
    id,
    connector_binding_id,
    assignment_id,
    account_id,
    employee_id,
    connector_key,
    provider,
    event_type,
    lifecycle_state,
    evidence
  ) values (
    v_event_id,
    new.id,
    new.assignment_id,
    new.account_id,
    new.employee_id,
    coalesce(new.connector_key, new.provider),
    new.provider,
    'connected',
    'connected',
    jsonb_build_object(
      'source', 'connector_binding_activation',
      'provider_verification_ref', new.provider_verification_ref,
      'provider_verified_at', new.provider_verified_at,
      'reactivation', tg_op = 'UPDATE',
      'capability_discovery_required', true
    )
  ) on conflict (id) do nothing;

  return new;
end
$$;

drop trigger if exists connector_binding_activation_projection on connector_bindings;
create trigger connector_binding_activation_projection
after insert or update of status, revoked_at, provider_verification_ref, provider_verified_at
on connector_bindings
for each row execute function amtech_project_connector_binding_activation();

revoke all on function amtech_normalize_connector_binding_activation() from public, anon, authenticated;
revoke all on function amtech_project_connector_binding_activation() from public, anon, authenticated;
grant execute on function amtech_normalize_connector_binding_activation() to service_role;
grant execute on function amtech_project_connector_binding_activation() to service_role;

commit;
