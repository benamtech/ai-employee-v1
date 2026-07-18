-- ============================================================================
-- AMTECH Phase 2 — S5/S6 consumer enforcement and canonical commercial rows
--
-- Forward-only. Migration 0042 remains frozen. This migration makes the S5
-- connector adapter and S6 attribution contract database-enforced without
-- introducing account-only authorization or a feature-local effect protocol.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- S5 connector binding integrity and deterministic compatibility bindings
-- --------------------------------------------------------------------------

create unique index if not exists connector_bindings_active_subject_unique
  on connector_bindings(provider, external_subject)
  where status = 'active' and revoked_at is null;

-- Deterministic compatibility bindings for already-connected Gmail rows.
do $$
begin
  if to_regclass('public.connector_accounts') is not null
     and exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'connector_accounts' and column_name = 'external_email'
     ) then
    execute $sql$
      insert into connector_bindings (
        id, assignment_id, connector_account_id, principal_id, provider,
        external_subject, account_id, employee_id, resource_class, resource_id,
        capability_class, policy_version, status, provider_verification_ref,
        provider_verified_at, provenance
      )
      select
        'cb_' || substr(md5('gmail:' || ca.id || ':' || ca.external_email), 1, 29),
        ea.id,
        ca.id,
        ep.id,
        'gmail',
        ca.external_email,
        ca.account_id,
        ca.employee_id,
        'connector:gmail',
        ca.external_email,
        'consumer_dedupe',
        ea.policy_version,
        'active',
        'compatibility:connector_accounts:' || ca.id,
        coalesce(ca.updated_at, ca.created_at, now()),
        jsonb_build_object(
          'source', 'compatibility_backfill',
          'sourceRef', 'connector_accounts',
          'account_id', ca.account_id,
          'employee_id', ca.employee_id,
          'recordedAt', now()
        )
      from connector_accounts ca
      join employee_principals ep on ep.employee_id = ca.employee_id
      join employee_assignments ea
        on ea.employee_principal_id = ep.id
       and ea.account_id = ca.account_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
      where ca.provider = 'gmail'
        and ca.external_email is not null
        and ca.external_email <> ''
        and ca.status in ('connected','working','active')
      on conflict do nothing
    $sql$;
  end if;
end
$$;

-- Deterministic compatibility bindings for QuickBooks realms.
do $$
begin
  if to_regclass('public.connector_accounts') is not null
     and exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'connector_accounts' and column_name = 'realm_id'
     ) then
    execute $sql$
      insert into connector_bindings (
        id, assignment_id, connector_account_id, principal_id, provider,
        external_subject, account_id, employee_id, resource_class, resource_id,
        capability_class, policy_version, status, provider_verification_ref,
        provider_verified_at, provenance
      )
      select
        'cb_' || substr(md5('quickbooks:' || ca.id || ':' || ca.realm_id), 1, 29),
        ea.id,
        ca.id,
        ep.id,
        'quickbooks',
        ca.realm_id,
        ca.account_id,
        ca.employee_id,
        'connector:quickbooks',
        ca.realm_id,
        'consumer_dedupe',
        ea.policy_version,
        'active',
        'compatibility:connector_accounts:' || ca.id,
        coalesce(ca.updated_at, ca.created_at, now()),
        jsonb_build_object(
          'source', 'compatibility_backfill',
          'sourceRef', 'connector_accounts.realm_id',
          'account_id', ca.account_id,
          'employee_id', ca.employee_id,
          'recordedAt', now()
        )
      from connector_accounts ca
      join employee_principals ep on ep.employee_id = ca.employee_id
      join employee_assignments ea
        on ea.employee_principal_id = ep.id
       and ea.account_id = ca.account_id
       and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
      where ca.provider = 'quickbooks'
        and ca.realm_id is not null
        and ca.realm_id <> ''
        and ca.status in ('connected','working','active')
      on conflict do nothing
    $sql$;
  end if;
end
$$;

-- Stripe webhook custody resolves through the connected Stripe account, not an
-- invoice ID or account-wide employee lookup.
do $$
begin
  if to_regclass('public.stripe_connections') is not null then
    insert into connector_bindings (
      id, assignment_id, connector_account_id, principal_id, provider,
      external_subject, account_id, employee_id, resource_class, resource_id,
      capability_class, policy_version, status, provider_verification_ref,
      provider_verified_at, provenance
    )
    select
      'cb_' || substr(md5('stripe:' || sc.id || ':' || sc.connected_account_id), 1, 29),
      ea.id,
      sc.id,
      ep.id,
      'stripe',
      sc.connected_account_id,
      sc.account_id,
      sc.employee_id,
      'connector:stripe',
      sc.connected_account_id,
      'consumer_dedupe',
      ea.policy_version,
      'active',
      'compatibility:stripe_connections:' || sc.id,
      coalesce(sc.updated_at, sc.created_at, now()),
      jsonb_build_object(
        'source', 'compatibility_backfill',
        'sourceRef', 'stripe_connections.connected_account_id',
        'account_id', sc.account_id,
        'employee_id', sc.employee_id,
        'recordedAt', now()
      )
    from stripe_connections sc
    join employee_principals ep on ep.employee_id = sc.employee_id
    join employee_assignments ea
      on ea.employee_principal_id = ep.id
     and ea.account_id = sc.account_id
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
    where sc.connected_account_id is not null
      and sc.connected_account_id <> ''
    on conflict do nothing;
  end if;
end
$$;

-- Twilio owner turns bind the provider destination and verified sender pair to
-- exactly one employee assignment.
do $$
begin
  if to_regclass('public.runtime_endpoints') is not null
     and to_regclass('public.verified_phones') is not null then
    insert into connector_bindings (
      id, assignment_id, connector_account_id, principal_id, provider,
      external_subject, account_id, employee_id, resource_class, resource_id,
      capability_class, policy_version, status, provider_verification_ref,
      provider_verified_at, provenance
    )
    select
      'cb_' || substr(md5('twilio:' || re.employee_id || ':' || re.sms_number_e164 || ':' || vp.phone_e164), 1, 29),
      ea.id,
      re.id,
      ep.id,
      'twilio',
      re.sms_number_e164 || '|' || vp.phone_e164,
      ea.account_id,
      re.employee_id,
      'channel:sms',
      vp.phone_e164,
      'consumer_dedupe',
      ea.policy_version,
      'active',
      'compatibility:verified_phones:' || vp.id,
      coalesce(vp.verified_at, vp.created_at, now()),
      jsonb_build_object(
        'source', 'compatibility_backfill',
        'sourceRef', 'runtime_endpoints+verified_phones',
        'account_id', ea.account_id,
        'employee_id', re.employee_id,
        'destination_phone', re.sms_number_e164,
        'sender_phone', vp.phone_e164,
        'recordedAt', now()
      )
    from runtime_endpoints re
    join employee_principals ep on ep.employee_id = re.employee_id
    join employee_assignments ea
      on ea.employee_principal_id = ep.id
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
    join verified_phones vp on vp.account_id = ea.account_id
    where re.sms_number_e164 is not null
      and re.sms_number_e164 <> ''
      and vp.phone_e164 is not null
      and vp.phone_e164 <> ''
    on conflict do nothing;
  end if;
end
$$;

-- Every durable binding receives a principal-specific resource grant. Existing
-- human grants are not reused as connector authority.
insert into assignment_resource_grants (
  id, assignment_id, principal_id, resource_class, resource_id, actions,
  status, starts_at, policy_version, provenance, created_at
)
select
  'grant_' || substr(md5(cb.id || ':connector:event:ingest'), 1, 26),
  cb.assignment_id,
  cb.principal_id,
  cb.resource_class,
  cb.resource_id,
  array['connector:event:ingest'],
  'active',
  cb.starts_at,
  cb.policy_version,
  jsonb_build_object(
    'source', 'connector_binding',
    'connector_binding_id', cb.id,
    'provider', cb.provider,
    'recordedAt', now()
  ),
  cb.created_at
from connector_bindings cb
where cb.status = 'active'
  and cb.revoked_at is null
  and not exists (
    select 1
      from assignment_resource_grants g
     where g.assignment_id = cb.assignment_id
       and g.principal_id = cb.principal_id
       and g.resource_class = cb.resource_class
       and g.resource_id is not distinct from cb.resource_id
       and 'connector:event:ingest' = any(g.actions)
       and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
  );

create or replace function amtech_connector_binding_scope_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_assignment employee_assignments%rowtype;
  v_employee_principal employee_principals%rowtype;
begin
  select * into v_assignment
    from employee_assignments
   where id = new.assignment_id;
  if v_assignment.id is null
     or v_assignment.account_id <> new.account_id
     or not amtech_relationship_current(v_assignment.status, v_assignment.starts_at, v_assignment.ends_at) then
    raise exception 'connector_binding_assignment_mismatch';
  end if;

  select * into v_employee_principal
    from employee_principals
   where id = v_assignment.employee_principal_id;
  if v_employee_principal.id is null
     or v_employee_principal.employee_id <> new.employee_id
     or v_employee_principal.id <> new.principal_id
     or v_employee_principal.status <> 'active' then
    raise exception 'connector_binding_principal_mismatch';
  end if;

  if new.status = 'active' and (
       coalesce(new.provider_verification_ref, '') = ''
       or new.provider_verified_at is null
     ) then
    raise exception 'connector_binding_provider_verification_required';
  end if;
  return new;
end
$$;

drop trigger if exists connector_binding_scope_guard on connector_bindings;
create trigger connector_binding_scope_guard
before insert or update on connector_bindings
for each row execute function amtech_connector_binding_scope_guard();

-- Replace the attestation function with grant and command-actor enforcement.
create or replace function attest_ambient_connector_custody(
  p_inbox_id text,
  p_assignment_id text,
  p_connector_binding_id text,
  p_command_intent_id text,
  p_command_id text,
  p_provider_verification_ref text,
  p_payload_hash text,
  p_resource_class text,
  p_resource_id text
)
returns setof ambient_event_inbox
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_inbox ambient_event_inbox%rowtype;
  v_binding connector_bindings%rowtype;
  v_command durable_commands%rowtype;
begin
  select * into v_inbox
    from ambient_event_inbox
   where inbox_id = p_inbox_id
   for update;
  if v_inbox.inbox_id is null then
    raise exception 'ambient_event_not_found: %', p_inbox_id;
  end if;
  if v_inbox.verified_at is null
     or coalesce(p_provider_verification_ref, '') = ''
     or coalesce(p_payload_hash, '') !~ '^sha256:[0-9a-f]{64}$'
     or v_inbox.provider_verification_ref is distinct from p_provider_verification_ref
     or v_inbox.payload_hash is distinct from p_payload_hash then
    raise exception 'provider_verification_required';
  end if;

  select * into v_binding
    from connector_bindings
   where id = p_connector_binding_id
   for share;
  if v_binding.id is null
     or v_binding.assignment_id <> p_assignment_id
     or v_binding.provider <> v_inbox.provider
     or v_binding.resource_class <> p_resource_class
     or v_binding.resource_id is distinct from p_resource_id
     or v_binding.external_subject <> v_inbox.subject_key
     or v_binding.status <> 'active'
     or v_binding.revoked_at is not null
     or (v_binding.expires_at is not null and v_binding.expires_at <= now()) then
    raise exception 'connector_binding_scope_mismatch';
  end if;

  if not exists (
    select 1
      from assignment_resource_grants g
     where g.assignment_id = p_assignment_id
       and (g.principal_id is null or g.principal_id = v_binding.principal_id)
       and g.resource_class = p_resource_class
       and g.resource_id is not distinct from p_resource_id
       and 'connector:event:ingest' = any(g.actions)
       and amtech_relationship_current(g.status, g.starts_at, g.ends_at)
  ) then
    raise exception 'connector_resource_grant_missing';
  end if;

  select * into v_command
    from durable_commands
   where id = p_command_id
     and intent_id = p_command_intent_id
     and assignment_id = p_assignment_id;
  if v_command.id is null
     or v_command.actor_class <> 'employee'
     or v_command.actor_principal_id <> v_binding.principal_id
     or v_command.authenticated_by <> 'verified_provider:' || v_binding.provider then
    raise exception 'connector_command_scope_mismatch';
  end if;

  update ambient_event_inbox
     set assignment_id = p_assignment_id,
         connector_binding_id = p_connector_binding_id,
         command_intent_id = p_command_intent_id,
         command_id = p_command_id,
         resource_class = p_resource_class,
         resource_id = p_resource_id,
         account_id = v_binding.account_id,
         employee_id = v_binding.employee_id,
         authorization_state = 'authorized'
   where inbox_id = p_inbox_id
     and authorization_state in ('waiting_for_binding','authorized')
     and (assignment_id is null or assignment_id = p_assignment_id)
     and (connector_binding_id is null or connector_binding_id = p_connector_binding_id)
  returning * into v_inbox;

  if v_inbox.inbox_id is null then
    raise exception 'connector_custody_conflict';
  end if;
  return next v_inbox;
end
$$;

-- Existing reconciler-owned AMTECH events are approved system ingress, not
-- customer connector events. They remain claimable without a connector binding.
update ambient_event_inbox
   set authorization_state = 'public_ingress'
 where provider = 'amtech'
   and source_type = 'system'
   and authorization_state = 'waiting_for_binding';

-- --------------------------------------------------------------------------
-- S6 canonical meter, rollup, budget, and gateway dimensions
-- --------------------------------------------------------------------------

insert into commercial_price_versions (
  id, assignment_id, policy_key, version, currency, unit, unit_price_minor,
  status, effective_at, provenance
)
select
  'price_' || substr(md5(ea.id || ':provider-cost-observation:v1'), 1, 27),
  ea.id,
  'provider-cost-observation',
  '1.0.0',
  'USD',
  'provider_request',
  0,
  'active',
  ea.starts_at,
  jsonb_build_object(
    'source', 'platform_default',
    'purpose', 'immutable provider cost attribution; customer pricing remains separately versioned',
    'recordedAt', now()
  )
from employee_assignments ea
where amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
on conflict (assignment_id, policy_key, version) do nothing;

create table if not exists commercial_meter_events (
  id                           text primary key,
  assignment_id                text not null references employee_assignments(id) on delete restrict,
  payer_relationship_id        text not null references commercial_relationships(id) on delete restrict,
  beneficiary_relationship_id  text not null references commercial_relationships(id) on delete restrict,
  price_version_id             text not null references commercial_price_versions(id) on delete restrict,
  accounting_receipt_id        text not null references commercial_usage_receipts(id) on delete restrict,
  event_key                    text not null,
  meter_kind                   text not null,
  quantity                     numeric(20,6) not null check (quantity >= 0),
  amount_minor                 bigint not null check (amount_minor >= 0),
  currency                     text not null check (currency ~ '^[A-Z]{3}$'),
  correlation_id               text not null,
  occurred_at                  timestamptz not null,
  evidence                     jsonb not null default '{}'::jsonb
                               check (jsonb_typeof(evidence) = 'object'),
  created_at                   timestamptz not null default now(),
  unique (assignment_id, event_key)
);

create table if not exists commercial_usage_rollups (
  id                           text primary key,
  assignment_id                text not null references employee_assignments(id) on delete restrict,
  payer_relationship_id        text not null references commercial_relationships(id) on delete restrict,
  beneficiary_relationship_id  text not null references commercial_relationships(id) on delete restrict,
  price_version_id             text not null references commercial_price_versions(id) on delete restrict,
  period_start                 timestamptz not null,
  period_end                   timestamptz not null,
  meter_kind                   text not null,
  quantity                     numeric(20,6) not null check (quantity >= 0),
  amount_minor                 bigint not null check (amount_minor >= 0),
  currency                     text not null check (currency ~ '^[A-Z]{3}$'),
  accounting_receipt_ids       text[] not null,
  receipt_digest               text not null check (receipt_digest ~ '^sha256:[0-9a-f]{64}$'),
  created_at                   timestamptz not null default now(),
  unique (assignment_id, payer_relationship_id, beneficiary_relationship_id,
          price_version_id, period_start, period_end, meter_kind),
  check (period_end > period_start),
  check (cardinality(accounting_receipt_ids) > 0)
);

create table if not exists commercial_budget_policies (
  id                           text primary key,
  assignment_id                text not null references employee_assignments(id) on delete restrict,
  payer_relationship_id        text not null references commercial_relationships(id) on delete restrict,
  beneficiary_relationship_id  text not null references commercial_relationships(id) on delete restrict,
  price_version_id             text not null references commercial_price_versions(id) on delete restrict,
  budget_key                   text not null,
  limit_minor                  bigint not null check (limit_minor >= 0),
  consumed_minor               bigint not null default 0 check (consumed_minor >= 0),
  reserved_minor               bigint not null default 0 check (reserved_minor >= 0),
  in_flight_tolerance_minor    bigint not null default 0 check (in_flight_tolerance_minor >= 0),
  currency                     text not null check (currency ~ '^[A-Z]{3}$'),
  status                       text not null default 'active'
                               check (status in ('draft','active','exhausted','revoked','expired')),
  effective_at                 timestamptz not null,
  expires_at                   timestamptz,
  policy_version               text not null,
  updated_at                   timestamptz not null default now(),
  created_at                   timestamptz not null default now(),
  unique (assignment_id, budget_key, policy_version),
  check (expires_at is null or expires_at > effective_at)
);

create index if not exists commercial_meter_events_scope_idx
  on commercial_meter_events(assignment_id, occurred_at desc);
create index if not exists commercial_usage_rollups_scope_idx
  on commercial_usage_rollups(assignment_id, period_start, period_end);
create index if not exists commercial_budget_policies_scope_idx
  on commercial_budget_policies(assignment_id, status, effective_at, expires_at);

-- Accepted provider usage is a real accounting receipt even when the model call
-- is not itself a consequential customer-side effect. Consequential command
-- effects remain C3-receipt-bound.
alter table commercial_usage_receipts
  add column if not exists receipt_kind text not null default 'command_effect'
    check (receipt_kind in ('provider_usage','command_effect','invoice'));

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
    from pg_constraint
   where conrelid = 'commercial_usage_receipts'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%state%accepted%effect_receipt_id%'
   limit 1;
  if constraint_name is not null then
    execute format('alter table commercial_usage_receipts drop constraint %I', constraint_name);
  end if;
end
$$;

alter table commercial_usage_receipts
  drop constraint if exists commercial_usage_receipts_accepted_receipt_shape;
alter table commercial_usage_receipts
  add constraint commercial_usage_receipts_accepted_receipt_shape check (
    state <> 'accepted'
    or (
      provider_receipt_id is not null
      and (
        (receipt_kind = 'provider_usage')
        or (receipt_kind = 'command_effect' and effect_receipt_id is not null)
        or (receipt_kind = 'invoice')
      )
    )
  );

-- Gateway credentials receive immutable assignment and commercial context at
-- issuance. NOT VALID preserves ambiguous historical rows while rejecting every
-- new unscoped credential.
alter table model_gateway_credentials
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict,
  add column if not exists payer_relationship_id text references commercial_relationships(id) on delete restrict,
  add column if not exists beneficiary_relationship_id text references commercial_relationships(id) on delete restrict,
  add column if not exists price_version_id text references commercial_price_versions(id) on delete restrict;

update model_gateway_credentials mgc
   set assignment_id = scope.assignment_id,
       payer_relationship_id = scope.payer_relationship_id,
       beneficiary_relationship_id = scope.beneficiary_relationship_id,
       price_version_id = scope.price_version_id
  from lateral (
    select
      ea.id as assignment_id,
      payer.id as payer_relationship_id,
      beneficiary.id as beneficiary_relationship_id,
      price.id as price_version_id
    from employee_principals ep
    join employee_assignments ea
      on ea.employee_principal_id = ep.id
     and ea.account_id = mgc.account_id
     and amtech_relationship_current(ea.status, ea.starts_at, ea.ends_at)
    join commercial_relationships payer
      on payer.assignment_id = ea.id
     and payer.relationship_type = 'payer'
     and amtech_relationship_current(payer.status, payer.starts_at, payer.ends_at)
    join commercial_relationships beneficiary
      on beneficiary.assignment_id = ea.id
     and beneficiary.relationship_type = 'beneficiary'
     and amtech_relationship_current(beneficiary.status, beneficiary.starts_at, beneficiary.ends_at)
    join commercial_price_versions price
      on price.assignment_id = ea.id
     and price.policy_key = 'provider-cost-observation'
     and price.version = '1.0.0'
     and price.status = 'active'
    where ep.employee_id = mgc.employee_id
    limit 1
  ) scope
 where mgc.assignment_id is null;

alter table model_gateway_credentials
  drop constraint if exists model_gateway_credentials_s6_scope;
alter table model_gateway_credentials
  add constraint model_gateway_credentials_s6_scope check (
    assignment_id is not null
    and payer_relationship_id is not null
    and beneficiary_relationship_id is not null
    and price_version_id is not null
  ) not valid;

alter table model_gateway_request_audit
  drop constraint if exists model_gateway_request_audit_success_receipt;
alter table model_gateway_request_audit
  add constraint model_gateway_request_audit_success_receipt check (
    status <> 'ok'
    or (
      assignment_id is not null
      and payer_relationship_id is not null
      and beneficiary_relationship_id is not null
      and price_version_id is not null
      and accounting_receipt_id is not null
    )
  ) not valid;

create or replace function amtech_commercial_scope_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payer commercial_relationships%rowtype;
  v_beneficiary commercial_relationships%rowtype;
  v_price commercial_price_versions%rowtype;
begin
  select * into v_payer from commercial_relationships where id = new.payer_relationship_id;
  select * into v_beneficiary from commercial_relationships where id = new.beneficiary_relationship_id;
  select * into v_price from commercial_price_versions where id = new.price_version_id;
  if v_payer.id is null
     or v_payer.relationship_type <> 'payer'
     or v_payer.assignment_id <> new.assignment_id
     or not amtech_relationship_current(v_payer.status, v_payer.starts_at, v_payer.ends_at) then
    raise exception 'commercial_payer_scope_mismatch';
  end if;
  if v_beneficiary.id is null
     or v_beneficiary.relationship_type <> 'beneficiary'
     or v_beneficiary.assignment_id <> new.assignment_id
     or not amtech_relationship_current(v_beneficiary.status, v_beneficiary.starts_at, v_beneficiary.ends_at) then
    raise exception 'commercial_beneficiary_scope_mismatch';
  end if;
  if v_price.id is null
     or v_price.assignment_id <> new.assignment_id
     or v_price.status <> 'active' then
    raise exception 'commercial_price_scope_mismatch';
  end if;
  return new;
end
$$;

drop trigger if exists commercial_meter_event_scope_guard on commercial_meter_events;
create trigger commercial_meter_event_scope_guard
before insert or update on commercial_meter_events
for each row execute function amtech_commercial_scope_guard();

drop trigger if exists commercial_usage_rollup_scope_guard on commercial_usage_rollups;
create trigger commercial_usage_rollup_scope_guard
before insert or update on commercial_usage_rollups
for each row execute function amtech_commercial_scope_guard();

drop trigger if exists commercial_budget_policy_scope_guard on commercial_budget_policies;
create trigger commercial_budget_policy_scope_guard
before insert or update on commercial_budget_policies
for each row execute function amtech_commercial_scope_guard();

alter table commercial_meter_events enable row level security;
alter table commercial_usage_rollups enable row level security;
alter table commercial_budget_policies enable row level security;
revoke all on commercial_meter_events, commercial_usage_rollups, commercial_budget_policies from anon, authenticated;
grant select, insert, update on commercial_meter_events, commercial_usage_rollups, commercial_budget_policies to service_role;

insert into assignment_scope_registry (
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values
  ('commercial:meter-event-facts','commercial_row','commercial_meter_events','Lane 5','explicit_assignment','C1',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['immutable-meter-fact','accounting-receipt-required','payer-beneficiary-price-match'],
   'packages/db/migrations/0045_connector_consumer_and_commercial_rows.sql',
   'Meter facts are immutable assignment-scoped accounting inputs, not authorization.'),
  ('commercial:usage-rollups','commercial_row','commercial_usage_rollups','Lane 5','explicit_assignment','C1',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['receipt-set-digest','payer-beneficiary-price-match','cross-assignment-rollup-denial'],
   'packages/db/migrations/0045_connector_consumer_and_commercial_rows.sql',
   'Usage aggregation retains the exact receipt set and assignment/commercial dimensions.'),
  ('commercial:budget-policies','commercial_row','commercial_budget_policies','Lane 5','explicit_assignment','C1',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['transactional-budget-state','declared-in-flight-tolerance','wrong-assignment-budget-denial'],
   'packages/db/migrations/0045_connector_consumer_and_commercial_rows.sql',
   'Budget policy is assignment and price-version scoped; process-local counters are not authoritative.')
on conflict (key) do update set
  surface_category = excluded.surface_category,
  subject = excluded.subject,
  lane_owner = excluded.lane_owner,
  scope_requirement = excluded.scope_requirement,
  authorization_contract = excluded.authorization_contract,
  customer_consequential = excluded.customer_consequential,
  enabled = excluded.enabled,
  denied_authorizers = excluded.denied_authorizers,
  required_evidence = excluded.required_evidence,
  source_ref = excluded.source_ref,
  notes = excluded.notes,
  updated_at = now();

revoke all on function amtech_connector_binding_scope_guard() from public, anon, authenticated;
revoke all on function amtech_commercial_scope_guard() from public, anon, authenticated;
revoke all on function attest_ambient_connector_custody(text,text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function attest_ambient_connector_custody(text,text,text,text,text,text,text,text,text) to service_role;

commit;
