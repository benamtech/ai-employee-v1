-- ============================================================================
-- AMTECH Phase 2 — S5 connector binding lifecycle consumers
--
-- Forward-only lifecycle wiring for connectors created after the 0045 backfill.
-- Provider-facing tables remain compatibility sources; connector_bindings plus
-- assignment_resource_grants are the durable authority.
-- ============================================================================

begin;

create or replace function amtech_upsert_assignment_connector_binding(
  p_provider text,
  p_external_subject text,
  p_account_id text,
  p_employee_id text,
  p_connector_account_id text,
  p_resource_class text,
  p_resource_id text,
  p_capability_class text,
  p_provider_verification_ref text,
  p_provenance jsonb default '{}'::jsonb
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_assignment_id text;
  v_employee_principal_id text;
  v_policy_version text;
  v_binding_id text;
  v_grant_id text;
begin
  if coalesce(p_provider, '') = ''
     or coalesce(p_external_subject, '') = ''
     or coalesce(p_account_id, '') = ''
     or coalesce(p_employee_id, '') = ''
     or coalesce(p_resource_class, '') = ''
     or coalesce(p_provider_verification_ref, '') = '' then
    raise exception 'connector_binding_identity_incomplete';
  end if;

  select ea.id, ea.policy_version, ep.id
    into v_assignment_id, v_policy_version, v_employee_principal_id
    from employee_principals ep
    join employee_assignments ea on ea.employee_principal_id = ep.id
   where ep.employee_id = p_employee_id
     and ep.status = 'active'
     and ea.account_id = p_account_id
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
   order by ea.created_at
   limit 2;

  if v_assignment_id is null then
    raise exception 'connector_assignment_missing';
  end if;
  if (
    select count(*)
      from employee_principals ep
      join employee_assignments ea on ea.employee_principal_id = ep.id
     where ep.employee_id = p_employee_id
       and ep.status = 'active'
       and ea.account_id = p_account_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
  ) <> 1 then
    raise exception 'connector_assignment_ambiguous';
  end if;

  v_binding_id := 'cb_' || substr(md5(
    p_provider || ':' || p_external_subject || ':' || v_assignment_id || ':' ||
    p_resource_class || ':' || coalesce(p_resource_id, '')
  ), 1, 29);
  v_grant_id := 'grant_' || substr(md5(v_binding_id || ':connector:event:ingest'), 1, 26);

  insert into assignment_resource_grants (
    id, assignment_id, principal_id, resource_class, resource_id, actions,
    status, starts_at, policy_version, provenance
  ) values (
    v_grant_id, v_assignment_id, v_employee_principal_id,
    p_resource_class, p_resource_id, array['connector:event:ingest'],
    'active', now(), v_policy_version,
    jsonb_build_object(
      'source', 'connector_binding_lifecycle',
      'provider', p_provider,
      'external_subject', p_external_subject,
      'recordedAt', now()
    ) || coalesce(p_provenance, '{}'::jsonb)
  )
  on conflict (id) do update set
    actions = excluded.actions,
    status = 'active',
    ends_at = null,
    policy_version = excluded.policy_version,
    provenance = assignment_resource_grants.provenance || excluded.provenance;

  insert into connector_bindings (
    id, assignment_id, connector_account_id, principal_id, provider,
    external_subject, account_id, employee_id, resource_class, resource_id,
    capability_class, policy_version, status, provider_verification_ref,
    provider_verified_at, revoked_at, provenance, updated_at
  ) values (
    v_binding_id, v_assignment_id, p_connector_account_id,
    v_employee_principal_id, p_provider, p_external_subject,
    p_account_id, p_employee_id, p_resource_class, p_resource_id,
    p_capability_class, v_policy_version, 'active',
    p_provider_verification_ref, now(), null,
    jsonb_build_object(
      'source', 'connector_binding_lifecycle',
      'account_id', p_account_id,
      'employee_id', p_employee_id,
      'recordedAt', now()
    ) || coalesce(p_provenance, '{}'::jsonb),
    now()
  )
  on conflict (id) do update set
    connector_account_id = excluded.connector_account_id,
    account_id = excluded.account_id,
    employee_id = excluded.employee_id,
    resource_class = excluded.resource_class,
    resource_id = excluded.resource_id,
    capability_class = excluded.capability_class,
    policy_version = excluded.policy_version,
    status = 'active',
    provider_verification_ref = excluded.provider_verification_ref,
    provider_verified_at = excluded.provider_verified_at,
    revoked_at = null,
    provenance = connector_bindings.provenance || excluded.provenance,
    updated_at = now();

  return v_binding_id;
end
$$;

create or replace function amtech_refresh_connector_account_binding()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if new.status not in ('connected','working','active') then
    return new;
  end if;

  if new.provider = 'gmail' and coalesce(new.external_email, '') <> '' then
    perform amtech_upsert_assignment_connector_binding(
      'gmail', new.external_email, new.account_id, new.employee_id, new.id,
      'connector:gmail', new.external_email, 'consumer_dedupe',
      'manager-verified:connector_accounts:' || new.id,
      jsonb_build_object('sourceRef', 'connector_accounts.external_email')
    );
  elsif new.provider = 'quickbooks' and coalesce(new.realm_id, '') <> '' then
    perform amtech_upsert_assignment_connector_binding(
      'quickbooks', new.realm_id, new.account_id, new.employee_id, new.id,
      'connector:quickbooks', new.realm_id, 'consumer_dedupe',
      'manager-verified:connector_accounts:' || new.id,
      jsonb_build_object('sourceRef', 'connector_accounts.realm_id')
    );
  end if;
  return new;
end
$$;

drop trigger if exists connector_accounts_assignment_binding on connector_accounts;
create trigger connector_accounts_assignment_binding
after insert or update of status, external_email, realm_id on connector_accounts
for each row execute function amtech_refresh_connector_account_binding();

create or replace function amtech_refresh_stripe_connection_binding()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if coalesce(new.connected_account_id, '') = '' then
    return new;
  end if;
  perform amtech_upsert_assignment_connector_binding(
    'stripe', new.connected_account_id, new.account_id, new.employee_id, new.id,
    'connector:stripe', new.connected_account_id, 'consumer_dedupe',
    'manager-verified:stripe_connections:' || new.id,
    jsonb_build_object('sourceRef', 'stripe_connections.connected_account_id')
  );
  return new;
end
$$;

drop trigger if exists stripe_connections_assignment_binding on stripe_connections;
create trigger stripe_connections_assignment_binding
after insert or update of connected_account_id on stripe_connections
for each row execute function amtech_refresh_stripe_connection_binding();

create or replace function amtech_refresh_twilio_bindings_for_employee(p_employee_id text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_endpoint record;
  v_assignment record;
  v_phone record;
begin
  select re.id, re.sms_number_e164
    into v_endpoint
    from runtime_endpoints re
   where re.employee_id = p_employee_id
     and coalesce(re.sms_number_e164, '') <> ''
   order by re.created_at desc
   limit 1;
  if v_endpoint.id is null then return; end if;

  select ea.id, ea.account_id
    into v_assignment
    from employee_principals ep
    join employee_assignments ea on ea.employee_principal_id = ep.id
   where ep.employee_id = p_employee_id
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
   order by ea.created_at
   limit 2;
  if v_assignment.id is null then return; end if;

  for v_phone in
    select vp.id, vp.phone_e164
      from verified_phones vp
     where vp.account_id = v_assignment.account_id
       and coalesce(vp.phone_e164, '') <> ''
  loop
    perform amtech_upsert_assignment_connector_binding(
      'twilio', v_endpoint.sms_number_e164 || '|' || v_phone.phone_e164,
      v_assignment.account_id, p_employee_id, v_endpoint.id,
      'channel:sms', v_phone.phone_e164, 'consumer_dedupe',
      'manager-verified:verified_phones:' || v_phone.id,
      jsonb_build_object(
        'sourceRef', 'runtime_endpoints+verified_phones',
        'destination_phone', v_endpoint.sms_number_e164,
        'sender_phone', v_phone.phone_e164
      )
    );
  end loop;
end
$$;

create or replace function amtech_refresh_twilio_binding_from_endpoint()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform amtech_refresh_twilio_bindings_for_employee(new.employee_id);
  return new;
end
$$;

drop trigger if exists runtime_endpoint_assignment_binding on runtime_endpoints;
create trigger runtime_endpoint_assignment_binding
after insert or update of sms_number_e164 on runtime_endpoints
for each row execute function amtech_refresh_twilio_binding_from_endpoint();

create or replace function amtech_refresh_twilio_binding_from_phone()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_employee record;
begin
  if new.account_id is null then return new; end if;
  for v_employee in
    select ep.employee_id
      from employee_principals ep
      join employee_assignments ea on ea.employee_principal_id = ep.id
     where ea.account_id = new.account_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
  loop
    perform amtech_refresh_twilio_bindings_for_employee(v_employee.employee_id);
  end loop;
  return new;
end
$$;

drop trigger if exists verified_phone_assignment_binding on verified_phones;
create trigger verified_phone_assignment_binding
after insert or update of account_id, phone_e164 on verified_phones
for each row execute function amtech_refresh_twilio_binding_from_phone();

revoke all on function amtech_upsert_assignment_connector_binding(text,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function amtech_refresh_connector_account_binding() from public, anon, authenticated;
revoke all on function amtech_refresh_stripe_connection_binding() from public, anon, authenticated;
revoke all on function amtech_refresh_twilio_bindings_for_employee(text) from public, anon, authenticated;
revoke all on function amtech_refresh_twilio_binding_from_endpoint() from public, anon, authenticated;
revoke all on function amtech_refresh_twilio_binding_from_phone() from public, anon, authenticated;
grant execute on function amtech_upsert_assignment_connector_binding(text,text,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function amtech_refresh_twilio_bindings_for_employee(text) to service_role;

commit;
