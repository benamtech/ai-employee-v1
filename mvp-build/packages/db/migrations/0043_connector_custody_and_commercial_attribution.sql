-- ============================================================================
-- AMTECH Phase 2 — S5 connector custody and S6 commercial attribution
--
-- Forward-only migration. Migration 0042 is frozen. This migration consumes the
-- canonical assignment and C3 command/effect kernels instead of creating a
-- feature-local authorization or idempotency protocol.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- S5: durable connector custody
-- --------------------------------------------------------------------------

create table if not exists connector_bindings (
  id                         text primary key,
  assignment_id              text not null references employee_assignments(id) on delete restrict,
  connector_account_id       text,
  principal_id               text not null,
  provider                   text not null,
  external_subject           text not null,
  resource_class             text not null,
  resource_id                text,
  capability_class           text not null
                             check (capability_class in (
                               'native_idempotency',
                               'queryable_receipt',
                               'consumer_dedupe',
                               'non_idempotent_ambiguous'
                             )),
  policy_version             text not null,
  status                     text not null default 'active'
                             check (status in ('pending','active','revoked','expired','disabled')),
  provider_verification_ref  text not null,
  provider_verified_at       timestamptz not null,
  starts_at                  timestamptz not null default now(),
  expires_at                 timestamptz,
  revoked_at                 timestamptz,
  provenance                 jsonb not null default '{}'::jsonb
                             check (jsonb_typeof(provenance) = 'object'),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (provider, external_subject, assignment_id, resource_class, resource_id),
  check (expires_at is null or expires_at > starts_at),
  check (status <> 'revoked' or revoked_at is not null)
);

create index if not exists connector_bindings_subject_idx
  on connector_bindings(provider, external_subject, status, starts_at, expires_at);
create index if not exists connector_bindings_assignment_idx
  on connector_bindings(assignment_id, resource_class, resource_id, status);

alter table ambient_event_inbox
  add column if not exists assignment_id text references employee_assignments(id) on delete restrict,
  add column if not exists connector_binding_id text references connector_bindings(id) on delete restrict,
  add column if not exists command_intent_id text references command_intents(id) on delete restrict,
  add column if not exists command_id text references durable_commands(id) on delete restrict,
  add column if not exists provider_verification_ref text,
  add column if not exists payload_hash text,
  add column if not exists resource_class text,
  add column if not exists resource_id text,
  add column if not exists authorization_state text not null default 'waiting_for_binding'
    check (authorization_state in ('public_ingress','waiting_for_binding','authorized','denied','revoked'));

create index if not exists ambient_event_inbox_assignment_idx
  on ambient_event_inbox(assignment_id, received_at desc)
  where assignment_id is not null;
create index if not exists ambient_event_inbox_binding_idx
  on ambient_event_inbox(connector_binding_id, processing_state, received_at)
  where connector_binding_id is not null;
create index if not exists ambient_event_inbox_command_idx
  on ambient_event_inbox(command_id)
  where command_id is not null;

-- Existing connector-account rows remain compatibility records. New custody is
-- represented by connector_bindings and must resolve through assignment scope.
do $$
begin
  if to_regclass('public.connector_accounts') is not null then
    alter table connector_accounts
      add column if not exists assignment_id text references employee_assignments(id) on delete restrict,
      add column if not exists connector_binding_id text references connector_bindings(id) on delete restrict;
    create index if not exists connector_accounts_assignment_idx
      on connector_accounts(assignment_id) where assignment_id is not null;
  end if;
end
$$;

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
     or coalesce(p_payload_hash, '') !~ '^sha256:[0-9a-f]{64}$' then
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
     or v_binding.status <> 'active'
     or v_binding.revoked_at is not null
     or (v_binding.expires_at is not null and v_binding.expires_at <= now()) then
    raise exception 'connector_binding_scope_mismatch';
  end if;

  if not exists (
    select 1 from command_intents ci
     where ci.id = p_command_intent_id
       and ci.assignment_id = p_assignment_id
       and ci.command_id = p_command_id
  ) or not exists (
    select 1 from durable_commands dc
     where dc.id = p_command_id
       and dc.intent_id = p_command_intent_id
       and dc.assignment_id = p_assignment_id
  ) then
    raise exception 'connector_command_scope_mismatch';
  end if;

  update ambient_event_inbox
     set assignment_id = p_assignment_id,
         connector_binding_id = p_connector_binding_id,
         command_intent_id = p_command_intent_id,
         command_id = p_command_id,
         provider_verification_ref = p_provider_verification_ref,
         payload_hash = p_payload_hash,
         resource_class = p_resource_class,
         resource_id = p_resource_id,
         account_id = v_binding.provenance->>'account_id',
         employee_id = v_binding.provenance->>'employee_id',
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

-- Claim only public ingress or assignment-authorized events. Provider events
-- waiting for binding remain durable and are not dispatched to business logic.
create or replace function claim_next_ambient_event(
  p_lease_token text,
  p_lease_seconds integer default 120
)
returns setof ambient_event_inbox
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidate as (
    select inbox_id
      from ambient_event_inbox
     where processing_state in ('received','retryable_failed','waiting_for_binding','processing')
       and next_attempt_at <= now()
       and attempt_count < max_attempts
       and (lease_expires_at is null or lease_expires_at < now())
       and (
         authorization_state = 'public_ingress'
         or (
           authorization_state = 'authorized'
           and assignment_id is not null
           and connector_binding_id is not null
           and command_intent_id is not null
           and command_id is not null
           and provider_verification_ref is not null
           and payload_hash ~ '^sha256:[0-9a-f]{64}$'
         )
       )
     order by received_at
     for update skip locked
     limit 1
  )
  update ambient_event_inbox as inbox
     set processing_state = 'processing',
         lease_token = p_lease_token,
         lease_expires_at = now() + make_interval(secs => greatest(10, p_lease_seconds)),
         attempt_count = inbox.attempt_count + 1
    from candidate
   where inbox.inbox_id = candidate.inbox_id
  returning inbox.*;
end
$$;

-- --------------------------------------------------------------------------
-- S6: immutable commercial attribution and accounting receipts
-- --------------------------------------------------------------------------

create table if not exists commercial_price_versions (
  id                text primary key,
  assignment_id     text not null references employee_assignments(id) on delete restrict,
  policy_key        text not null,
  version           text not null,
  currency          text not null check (currency ~ '^[A-Z]{3}$'),
  unit              text not null,
  unit_price_minor  bigint not null check (unit_price_minor >= 0),
  status            text not null default 'active'
                    check (status in ('draft','active','revoked','expired')),
  effective_at      timestamptz not null,
  expires_at        timestamptz,
  provenance        jsonb not null default '{}'::jsonb
                    check (jsonb_typeof(provenance) = 'object'),
  created_at        timestamptz not null default now(),
  unique (assignment_id, policy_key, version),
  check (expires_at is null or expires_at > effective_at)
);

create index if not exists commercial_price_versions_current_idx
  on commercial_price_versions(assignment_id, policy_key, status, effective_at, expires_at);

create table if not exists commercial_usage_receipts (
  id                           text primary key,
  assignment_id                text not null references employee_assignments(id) on delete restrict,
  payer_relationship_id        text not null references commercial_relationships(id) on delete restrict,
  beneficiary_relationship_id  text not null references commercial_relationships(id) on delete restrict,
  price_version_id             text not null references commercial_price_versions(id) on delete restrict,
  command_id                   text references durable_commands(id) on delete restrict,
  effect_receipt_id            text references effect_receipts(id) on delete restrict,
  meter_event_id               text,
  provider                     text not null,
  provider_receipt_id          text,
  state                        text not null check (state in ('accepted','failed','ambiguous')),
  quantity                     numeric(20,6) not null check (quantity >= 0),
  amount_minor                 bigint not null check (amount_minor >= 0),
  currency                     text not null check (currency ~ '^[A-Z]{3}$'),
  correlation_id               text not null,
  evidence                     jsonb not null default '{}'::jsonb
                               check (jsonb_typeof(evidence) = 'object'),
  observed_at                  timestamptz not null default now(),
  created_at                   timestamptz not null default now(),
  unique (assignment_id, provider, provider_receipt_id),
  check (state <> 'accepted' or effect_receipt_id is not null),
  check (state <> 'accepted' or provider_receipt_id is not null)
);

create index if not exists commercial_usage_receipts_assignment_idx
  on commercial_usage_receipts(assignment_id, observed_at desc);
create index if not exists commercial_usage_receipts_invoice_idx
  on commercial_usage_receipts(payer_relationship_id, beneficiary_relationship_id, price_version_id, observed_at);

create table if not exists commercial_invoice_attributions (
  id                           text primary key,
  invoice_resource_id          text not null,
  assignment_id                text not null references employee_assignments(id) on delete restrict,
  payer_relationship_id        text not null references commercial_relationships(id) on delete restrict,
  beneficiary_relationship_id  text not null references commercial_relationships(id) on delete restrict,
  price_version_id             text not null references commercial_price_versions(id) on delete restrict,
  usage_receipt_id             text not null references commercial_usage_receipts(id) on delete restrict,
  amount_minor                 bigint not null check (amount_minor >= 0),
  currency                     text not null check (currency ~ '^[A-Z]{3}$'),
  reconciliation_state         text not null default 'pending'
                               check (reconciliation_state in ('pending','matched','mismatch','waived')),
  provider_invoice_line_id     text,
  reconciliation_delta_minor   bigint,
  evidence                     jsonb not null default '{}'::jsonb
                               check (jsonb_typeof(evidence) = 'object'),
  created_at                   timestamptz not null default now(),
  reconciled_at                timestamptz,
  unique (invoice_resource_id, usage_receipt_id)
);

create index if not exists commercial_invoice_attributions_assignment_idx
  on commercial_invoice_attributions(assignment_id, reconciliation_state, created_at);

-- Compatibility rows gain explicit commercial dimensions. Existing historical
-- rows remain nullable and unpromoted; all S6 writes use the canonical receipt
-- and attribution tables above.
do $$
declare
  commercial_table text;
begin
  foreach commercial_table in array array[
    'meter_events',
    'usage_rollups',
    'budget_policies',
    'model_gateway_request_audit',
    'stripe_invoices'
  ] loop
    if to_regclass(format('public.%I', commercial_table)) is not null then
      execute format('alter table public.%I add column if not exists assignment_id text references employee_assignments(id) on delete restrict', commercial_table);
      execute format('alter table public.%I add column if not exists payer_relationship_id text references commercial_relationships(id) on delete restrict', commercial_table);
      execute format('alter table public.%I add column if not exists beneficiary_relationship_id text references commercial_relationships(id) on delete restrict', commercial_table);
      execute format('alter table public.%I add column if not exists price_version_id text references commercial_price_versions(id) on delete restrict', commercial_table);
      execute format('alter table public.%I add column if not exists accounting_receipt_id text references commercial_usage_receipts(id) on delete restrict', commercial_table);
      execute format('create index if not exists %I on public.%I(assignment_id) where assignment_id is not null', left(commercial_table || '_s6_assignment_idx', 63), commercial_table);
    end if;
  end loop;
end
$$;

create or replace function amtech_commercial_usage_receipt_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payer commercial_relationships%rowtype;
  v_beneficiary commercial_relationships%rowtype;
  v_price commercial_price_versions%rowtype;
  v_effect effect_receipts%rowtype;
begin
  select * into v_payer from commercial_relationships where id = new.payer_relationship_id;
  select * into v_beneficiary from commercial_relationships where id = new.beneficiary_relationship_id;
  select * into v_price from commercial_price_versions where id = new.price_version_id;

  if v_payer.id is null or v_payer.relationship_type <> 'payer'
     or v_payer.assignment_id <> new.assignment_id
     or not amtech_relationship_current(v_payer.status, v_payer.starts_at, v_payer.ends_at) then
    raise exception 'invalid_payer_relationship';
  end if;
  if v_beneficiary.id is null or v_beneficiary.relationship_type <> 'beneficiary'
     or v_beneficiary.assignment_id <> new.assignment_id
     or not amtech_relationship_current(v_beneficiary.status, v_beneficiary.starts_at, v_beneficiary.ends_at) then
    raise exception 'invalid_beneficiary_relationship';
  end if;
  if v_price.id is null or v_price.assignment_id <> new.assignment_id
     or v_price.status <> 'active'
     or v_price.effective_at > new.observed_at
     or (v_price.expires_at is not null and new.observed_at >= v_price.expires_at)
     or v_price.currency <> new.currency then
    raise exception 'invalid_price_version';
  end if;

  if new.state = 'accepted' then
    select * into v_effect from effect_receipts where id = new.effect_receipt_id;
    if v_effect.id is null or v_effect.assignment_id <> new.assignment_id or v_effect.state <> 'accepted' then
      raise exception 'accepted_usage_requires_matching_effect_receipt';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists commercial_usage_receipt_guard on commercial_usage_receipts;
create trigger commercial_usage_receipt_guard
before insert or update on commercial_usage_receipts
for each row execute function amtech_commercial_usage_receipt_guard();

create or replace function amtech_invoice_attribution_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_usage commercial_usage_receipts%rowtype;
begin
  select * into v_usage from commercial_usage_receipts where id = new.usage_receipt_id;
  if v_usage.id is null
     or v_usage.assignment_id <> new.assignment_id
     or v_usage.payer_relationship_id <> new.payer_relationship_id
     or v_usage.beneficiary_relationship_id <> new.beneficiary_relationship_id
     or v_usage.price_version_id <> new.price_version_id
     or v_usage.currency <> new.currency
     or v_usage.amount_minor <> new.amount_minor then
    raise exception 'invoice_usage_attribution_mismatch';
  end if;
  return new;
end
$$;

drop trigger if exists commercial_invoice_attribution_guard on commercial_invoice_attributions;
create trigger commercial_invoice_attribution_guard
before insert or update on commercial_invoice_attributions
for each row execute function amtech_invoice_attribution_guard();

alter table connector_bindings enable row level security;
alter table commercial_price_versions enable row level security;
alter table commercial_usage_receipts enable row level security;
alter table commercial_invoice_attributions enable row level security;

revoke all on connector_bindings from anon, authenticated;
revoke all on commercial_price_versions from anon, authenticated;
revoke all on commercial_usage_receipts from anon, authenticated;
revoke all on commercial_invoice_attributions from anon, authenticated;
revoke all on function attest_ambient_connector_custody(text,text,text,text,text,text,text,text,text) from public, anon, authenticated;

-- Manager/service workers write through reviewed server contracts. Human-facing
-- reads must use role-safe projections rather than direct table grants.
grant select, insert, update on connector_bindings to service_role;
grant select, insert, update on commercial_price_versions to service_role;
grant select, insert, update on commercial_usage_receipts to service_role;
grant select, insert, update on commercial_invoice_attributions to service_role;
grant execute on function attest_ambient_connector_custody(text,text,text,text,text,text,text,text,text) to service_role;

insert into assignment_scope_registry
  (key, surface_category, subject, lane_owner, scope_requirement, authorization_contract,
   customer_consequential, enabled, denied_authorizers, required_evidence, source_ref, notes)
values
  ('connector:bindings','connector_binding','connector_bindings','Lane 6','explicit_assignment','C5',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee','mutable_header_identity'],
   array['provider-verification-before-binding','exact-one-assignment-binding','revoked-binding-denial','cross-assignment-connector-denial'],
   'packages/db/migrations/0043_connector_custody_and_commercial_attribution.sql',
   'Provider identity maps to an explicit assignment/resource grant before business processing.'),
  ('commercial:price-versions','commercial_row','commercial_price_versions','Lane 5','explicit_assignment','C1',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['price-version-immutable-attribution','wrong-assignment-price-denial'],
   'packages/db/migrations/0043_connector_custody_and_commercial_attribution.sql',
   'Every commercial calculation uses an assignment-bound effective price version.'),
  ('commercial:usage-receipts','commercial_row','commercial_usage_receipts','Lane 5','explicit_assignment','C3',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['accepted-provider-effect-receipt','payer-beneficiary-assignment-match','zero-success-without-usage-receipt'],
   'packages/db/migrations/0043_connector_custody_and_commercial_attribution.sql',
   'Accepted billable work requires matching assignment, payer, beneficiary, price version, and C3 receipt.'),
  ('commercial:invoice-attribution','commercial_row','commercial_invoice_attributions','Lane 5','explicit_assignment','C1',true,true,
   array['account_membership_only','employees_account_id_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['invoice-line-usage-match','invoice-delta-within-threshold','commercial-cross-assignment-denial'],
   'packages/db/migrations/0043_connector_custody_and_commercial_attribution.sql',
   'Invoice lines reconcile to immutable usage receipts rather than account-wide totals.')
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

commit;
