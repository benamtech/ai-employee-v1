-- ============================================================================
-- AMTECH S10.1 — onboarding identity and employee activation authority
--
-- Forward-only. Owner identity is verified before first employee activation.
-- Raw TIN values are stored only as encrypted secret references. New employee
-- desired state, canonical principal/assignment relationships, and the accepted
-- C3 activation receipt commit atomically before the Hermes reconciler can run.
-- ============================================================================

begin;

create table if not exists onboarding_identities (
  id text primary key,
  account_id text not null references accounts(id) on delete restrict,
  owner_principal_id text not null references human_principals(id) on delete restrict,
  employee_principal_id text references employee_principals(id) on delete restrict,
  business_type text not null,
  business_name text not null,
  business_address jsonb not null check (jsonb_typeof(business_address) = 'object'),
  tax_id_secret_ref text not null,
  tax_id_fingerprint text not null check (tax_id_fingerprint ~ '^sha256:[0-9a-f]{64}$'),
  tax_id_last4 text not null check (tax_id_last4 ~ '^[0-9]{4}$'),
  verified_at timestamptz,
  verification_method text not null check (verification_method in ('middesk_tin')),
  provider text not null check (provider in ('middesk')),
  provider_business_id text,
  provider_status text,
  status text not null default 'pending'
    check (status in ('pending','verified','rejected','revoked','expired')),
  policy_version text not null,
  audit_correlation_id text not null,
  immutable_snapshot_hash text
    check (immutable_snapshot_hash is null or immutable_snapshot_hash ~ '^sha256:[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status <> 'verified'
    or (verified_at is not null and provider_business_id is not null and immutable_snapshot_hash is not null)
  )
);

create unique index if not exists onboarding_identities_active_owner_idx
  on onboarding_identities(account_id, owner_principal_id)
  where status in ('pending','verified','rejected');
create unique index if not exists onboarding_identities_provider_business_idx
  on onboarding_identities(provider, provider_business_id)
  where provider_business_id is not null;
create index if not exists onboarding_identities_owner_status_idx
  on onboarding_identities(owner_principal_id, status, verified_at desc);

create table if not exists onboarding_identity_attempts (
  id text primary key,
  onboarding_identity_id text not null references onboarding_identities(id) on delete restrict,
  account_id text not null references accounts(id) on delete restrict,
  owner_principal_id text not null references human_principals(id) on delete restrict,
  provider text not null check (provider in ('middesk')),
  idempotency_key text not null,
  provider_request_id text,
  provider_status text,
  status text not null default 'requested'
    check (status in ('requested','submitted','verified','rejected','failed','rate_limited')),
  retry_after_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (onboarding_identity_id, idempotency_key)
);

create index if not exists onboarding_identity_attempts_rate_idx
  on onboarding_identity_attempts(owner_principal_id, created_at desc);
create index if not exists onboarding_identity_attempts_identity_status_idx
  on onboarding_identity_attempts(onboarding_identity_id, status, created_at desc);

create table if not exists onboarding_identity_webhook_events (
  id text primary key,
  provider text not null check (provider in ('middesk')),
  provider_event_id text not null,
  provider_event_type text not null,
  provider_business_id text not null,
  onboarding_identity_id text references onboarding_identities(id) on delete restrict,
  payload_hash text not null check (payload_hash ~ '^sha256:[0-9a-f]{64}$'),
  signature_verified_at timestamptz not null,
  result text not null check (result in ('pending','verified','rejected','ignored')),
  processed_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists onboarding_identity_webhook_business_idx
  on onboarding_identity_webhook_events(provider_business_id, processed_at desc);

create table if not exists onboarding_identity_activations (
  id text primary key,
  onboarding_identity_id text not null unique references onboarding_identities(id) on delete restrict,
  account_id text not null references accounts(id) on delete restrict,
  owner_principal_id text not null references human_principals(id) on delete restrict,
  employee_id text not null unique references employees(id) on delete restrict,
  employee_principal_id text not null unique references employee_principals(id) on delete restrict,
  assignment_id text not null unique references employee_assignments(id) on delete restrict,
  provisioning_job_id text not null unique references provisioning_jobs(id) on delete restrict,
  command_id text not null unique references durable_commands(id) on delete restrict,
  receipt_id text not null unique references effect_receipts(id) on delete restrict,
  idempotency_key text not null,
  activation_snapshot_hash text not null check (activation_snapshot_hash ~ '^sha256:[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (account_id, idempotency_key)
);

create index if not exists onboarding_identity_activations_owner_idx
  on onboarding_identity_activations(owner_principal_id, created_at desc);

alter table onboarding_identities enable row level security;
alter table onboarding_identity_attempts enable row level security;
alter table onboarding_identity_webhook_events enable row level security;
alter table onboarding_identity_activations enable row level security;

revoke all on onboarding_identities, onboarding_identity_attempts,
  onboarding_identity_webhook_events, onboarding_identity_activations
  from anon, authenticated;
grant select, insert, update on onboarding_identities, onboarding_identity_attempts,
  onboarding_identity_webhook_events, onboarding_identity_activations
  to service_role;

create policy onboarding_identities_owner_select on onboarding_identities
  for select to authenticated
  using (owner_principal_id = amtech_current_human_principal_id());
create policy onboarding_identity_attempts_owner_select on onboarding_identity_attempts
  for select to authenticated
  using (owner_principal_id = amtech_current_human_principal_id());
create policy onboarding_identity_activations_owner_select on onboarding_identity_activations
  for select to authenticated
  using (owner_principal_id = amtech_current_human_principal_id());

create or replace function amtech_bootstrap_human_principal_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into human_principals(id, user_id, status, created_at)
  values ('hpr_' || substr(md5(new.id), 1, 22), new.id, 'active', new.created_at)
  on conflict (user_id) do nothing;
  return new;
end
$$;

drop trigger if exists users_human_principal_bootstrap on users;
create trigger users_human_principal_bootstrap
  after insert on users
  for each row execute function amtech_bootstrap_human_principal_for_user();

insert into human_principals(id, user_id, status, created_at)
select 'hpr_' || substr(md5(u.id), 1, 22), u.id, 'active', u.created_at
from users u
where not exists (select 1 from human_principals hp where hp.user_id = u.id)
on conflict (user_id) do nothing;

create or replace function amtech_onboarding_identity_snapshot_hash(p_identity onboarding_identities)
returns text
language sql
immutable
parallel safe
as $$
  select 'sha256:' || encode(digest(
    concat_ws(E'\x1f',
      p_identity.id,
      p_identity.account_id,
      p_identity.owner_principal_id,
      p_identity.business_type,
      p_identity.business_name,
      p_identity.business_address::text,
      p_identity.tax_id_fingerprint,
      p_identity.verification_method,
      p_identity.provider,
      p_identity.provider_business_id,
      p_identity.policy_version,
      p_identity.audit_correlation_id
    ),
    'sha256'
  ), 'hex')
$$;

create or replace function amtech_guard_onboarding_identity_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'rejected' and new.status <> 'rejected' then
    raise exception 'identity_rejected_permanent';
  end if;

  if old.status = 'verified' then
    if new.account_id is distinct from old.account_id
       or new.owner_principal_id is distinct from old.owner_principal_id
       or new.business_type is distinct from old.business_type
       or new.business_name is distinct from old.business_name
       or new.business_address is distinct from old.business_address
       or new.tax_id_secret_ref is distinct from old.tax_id_secret_ref
       or new.tax_id_fingerprint is distinct from old.tax_id_fingerprint
       or new.tax_id_last4 is distinct from old.tax_id_last4
       or new.verified_at is distinct from old.verified_at
       or new.verification_method is distinct from old.verification_method
       or new.provider is distinct from old.provider
       or new.provider_business_id is distinct from old.provider_business_id
       or new.policy_version is distinct from old.policy_version
       or new.audit_correlation_id is distinct from old.audit_correlation_id
       or new.immutable_snapshot_hash is distinct from old.immutable_snapshot_hash then
      raise exception 'verified_identity_snapshot_immutable';
    end if;
    if old.employee_principal_id is not null
       and new.employee_principal_id is distinct from old.employee_principal_id then
      raise exception 'verified_identity_employee_principal_immutable';
    end if;
  end if;

  if new.status = 'verified' and old.status <> 'verified' then
    if new.provider_business_id is null then raise exception 'provider_business_id_required'; end if;
    new.verified_at := coalesce(new.verified_at, now());
    new.immutable_snapshot_hash := amtech_onboarding_identity_snapshot_hash(new);
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists onboarding_identity_snapshot_guard on onboarding_identities;
create trigger onboarding_identity_snapshot_guard
  before update on onboarding_identities
  for each row execute function amtech_guard_onboarding_identity_snapshot();

create or replace function amtech_verify_onboarding_identity_snapshot(p_identity_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select oi.status = 'verified'
     and oi.immutable_snapshot_hash = amtech_onboarding_identity_snapshot_hash(oi)
  from onboarding_identities oi
  where oi.id = p_identity_id
$$;

create or replace function reserve_onboarding_identity_verification(
  p_identity_id text,
  p_attempt_id text,
  p_account_id text,
  p_owner_principal_id text,
  p_business_type text,
  p_business_name text,
  p_business_address jsonb,
  p_tax_id_secret_ref text,
  p_tax_id_fingerprint text,
  p_tax_id_last4 text,
  p_verification_method text,
  p_provider text,
  p_policy_version text,
  p_audit_correlation_id text,
  p_idempotency_key text
)
returns table (
  identity_id text,
  attempt_id text,
  identity_status text,
  attempt_status text,
  retry_after_at timestamptz,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_identity onboarding_identities%rowtype;
  v_attempt onboarding_identity_attempts%rowtype;
  v_attempt_count integer;
  v_retry_at timestamptz;
begin
  if p_business_address is null or jsonb_typeof(p_business_address) <> 'object' then
    raise exception 'business_address_required';
  end if;
  if not exists (
    select 1
    from human_principals hp
    join account_memberships am on am.user_id = hp.user_id
    where hp.id = p_owner_principal_id
      and hp.status = 'active'
      and am.account_id = p_account_id
      and am.role in ('owner','admin')
  ) then
    raise exception 'owner_principal_account_mismatch';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_account_id || E'\x1f' || p_owner_principal_id, 0));

  select * into v_identity
  from onboarding_identities oi
  where oi.account_id = p_account_id
    and oi.owner_principal_id = p_owner_principal_id
    and oi.status in ('pending','verified','rejected')
  order by oi.created_at desc
  limit 1
  for update;

  if v_identity.status = 'rejected' then raise exception 'identity_rejected_permanent'; end if;
  if v_identity.status = 'verified' then
    return query select v_identity.id, null::text, v_identity.status, 'verified'::text, null::timestamptz, true;
    return;
  end if;

  if v_identity.id is null then
    insert into onboarding_identities(
      id, account_id, owner_principal_id, business_type, business_name,
      business_address, tax_id_secret_ref, tax_id_fingerprint, tax_id_last4,
      verification_method, provider, status, policy_version, audit_correlation_id
    ) values (
      p_identity_id, p_account_id, p_owner_principal_id, p_business_type, p_business_name,
      p_business_address, p_tax_id_secret_ref, p_tax_id_fingerprint, p_tax_id_last4,
      p_verification_method, p_provider, 'pending', p_policy_version, p_audit_correlation_id
    ) returning * into v_identity;
  elsif v_identity.business_type <> p_business_type
     or v_identity.business_name <> p_business_name
     or v_identity.business_address <> p_business_address
     or v_identity.tax_id_fingerprint <> p_tax_id_fingerprint
     or v_identity.verification_method <> p_verification_method
     or v_identity.provider <> p_provider
     or v_identity.policy_version <> p_policy_version then
    raise exception 'identity_input_conflict';
  end if;

  select * into v_attempt
  from onboarding_identity_attempts a
  where a.onboarding_identity_id = v_identity.id
    and a.idempotency_key = p_idempotency_key;
  if v_attempt.id is not null then
    return query select v_identity.id, v_attempt.id, v_identity.status, v_attempt.status, v_attempt.retry_after_at, true;
    return;
  end if;

  select count(*), min(created_at) + interval '24 hours'
    into v_attempt_count, v_retry_at
  from onboarding_identity_attempts a
  where a.owner_principal_id = p_owner_principal_id
    and a.created_at > now() - interval '24 hours'
    and a.status <> 'rate_limited';

  if v_attempt_count >= 2 then
    insert into onboarding_identity_attempts(
      id, onboarding_identity_id, account_id, owner_principal_id, provider,
      idempotency_key, status, retry_after_at, error_code, completed_at
    ) values (
      p_attempt_id, v_identity.id, p_account_id, p_owner_principal_id, p_provider,
      p_idempotency_key, 'rate_limited', greatest(coalesce(v_retry_at, now() + interval '24 hours'), now()),
      'identity_verification_rate_limited', now()
    ) returning * into v_attempt;
    return query select v_identity.id, v_attempt.id, v_identity.status, v_attempt.status, v_attempt.retry_after_at, false;
    return;
  end if;

  insert into onboarding_identity_attempts(
    id, onboarding_identity_id, account_id, owner_principal_id, provider,
    idempotency_key, status
  ) values (
    p_attempt_id, v_identity.id, p_account_id, p_owner_principal_id, p_provider,
    p_idempotency_key, 'requested'
  ) returning * into v_attempt;

  return query select v_identity.id, v_attempt.id, v_identity.status, v_attempt.status, null::timestamptz, false;
end
$$;

create or replace function mark_onboarding_identity_provider_submission(
  p_attempt_id text,
  p_provider_business_id text,
  p_provider_status text,
  p_provider_request_id text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_identity_id text;
begin
  update onboarding_identity_attempts
     set status = 'submitted',
         provider_request_id = p_provider_request_id,
         provider_status = p_provider_status
   where id = p_attempt_id
     and status = 'requested'
  returning onboarding_identity_id into v_identity_id;
  if v_identity_id is null then raise exception 'identity_attempt_not_claimable'; end if;

  update onboarding_identities
     set provider_business_id = coalesce(provider_business_id, p_provider_business_id),
         provider_status = p_provider_status,
         updated_at = now()
   where id = v_identity_id
     and status = 'pending'
     and (provider_business_id is null or provider_business_id = p_provider_business_id);
  if not found then raise exception 'identity_provider_binding_conflict'; end if;
end
$$;

create or replace function complete_onboarding_identity_verification(
  p_provider_event_row_id text,
  p_provider_event_id text,
  p_provider_event_type text,
  p_provider_business_id text,
  p_payload_hash text,
  p_result text,
  p_provider_status text
)
returns table (identity_id text, status text, duplicate boolean)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_identity onboarding_identities%rowtype;
  v_existing onboarding_identity_webhook_events%rowtype;
begin
  if p_result not in ('pending','verified','rejected','ignored') then
    raise exception 'invalid_identity_provider_result';
  end if;

  select * into v_existing
  from onboarding_identity_webhook_events e
  where e.provider = 'middesk' and e.provider_event_id = p_provider_event_id;
  if v_existing.id is not null then
    return query select v_existing.onboarding_identity_id, v_existing.result, true;
    return;
  end if;

  select * into v_identity
  from onboarding_identities oi
  where oi.provider = 'middesk'
    and oi.provider_business_id = p_provider_business_id
  for update;
  if v_identity.id is null then raise exception 'identity_provider_business_not_found'; end if;

  if p_result = 'verified' then
    update onboarding_identities
       set status = 'verified', provider_status = p_provider_status, verified_at = now()
     where id = v_identity.id and status = 'pending'
    returning * into v_identity;
    update onboarding_identity_attempts
       set status = 'verified', provider_status = p_provider_status, completed_at = now()
     where id = (
       select id from onboarding_identity_attempts
       where onboarding_identity_id = v_identity.id and status in ('requested','submitted')
       order by created_at desc limit 1
     );
  elsif p_result = 'rejected' then
    update onboarding_identities
       set status = 'rejected', provider_status = p_provider_status
     where id = v_identity.id and status = 'pending'
    returning * into v_identity;
    update onboarding_identity_attempts
       set status = 'rejected', provider_status = p_provider_status,
           error_code = 'identity_rejected_permanent', completed_at = now()
     where id = (
       select id from onboarding_identity_attempts
       where onboarding_identity_id = v_identity.id and status in ('requested','submitted')
       order by created_at desc limit 1
     );
  else
    update onboarding_identities
       set provider_status = p_provider_status, updated_at = now()
     where id = v_identity.id
    returning * into v_identity;
  end if;

  insert into onboarding_identity_webhook_events(
    id, provider, provider_event_id, provider_event_type, provider_business_id,
    onboarding_identity_id, payload_hash, signature_verified_at, result
  ) values (
    p_provider_event_row_id, 'middesk', p_provider_event_id, p_provider_event_type,
    p_provider_business_id, v_identity.id, p_payload_hash, now(), p_result
  );

  return query select v_identity.id, v_identity.status, false;
end
$$;

create or replace function amtech_onboarding_identity_decision(
  p_account_id text,
  p_owner_principal_id text
)
returns table (
  allowed boolean,
  error text,
  identity_id text,
  policy_version text
)
language sql
stable
security definer
set search_path = public
as $$
  with candidate as (
    select oi.*
    from onboarding_identities oi
    where oi.account_id = p_account_id
      and oi.owner_principal_id = p_owner_principal_id
      and oi.status in ('pending','verified','rejected','revoked','expired')
    order by oi.created_at desc
    limit 1
  )
  select
    coalesce(candidate.status = 'verified' and amtech_verify_onboarding_identity_snapshot(candidate.id), false),
    case
      when candidate.id is null or candidate.status = 'pending' then 'identity_unverified'
      when candidate.status = 'rejected' then 'identity_rejected_permanent'
      when candidate.status in ('revoked','expired') then 'identity_revoked'
      when not amtech_verify_onboarding_identity_snapshot(candidate.id) then 'identity_unverified'
      else null
    end,
    candidate.id,
    candidate.policy_version
  from (select 1) seed
  left join candidate on true
$$;

create or replace function amtech_stable_activation_id(p_prefix text, p_seed text)
returns text
language sql
immutable
parallel safe
as $$
  select p_prefix || '_' || substr(encode(digest(p_seed, 'sha256'), 'hex'), 1, 32)
$$;

create or replace function amtech_activate_verified_employee(
  p_identity_id text,
  p_account_id text,
  p_owner_principal_id text,
  p_employee_name text,
  p_profile_package_key text,
  p_manifest jsonb,
  p_raw_answers jsonb,
  p_transcript_ref text,
  p_worker_context jsonb,
  p_resource_graph jsonb,
  p_facts jsonb,
  p_idempotency_key text,
  p_policy_version text,
  p_correlation_id text
)
returns table (
  activation_id text,
  employee_id text,
  employee_principal_id text,
  assignment_id text,
  provisioning_job_id text,
  command_id text,
  receipt_id text,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_identity onboarding_identities%rowtype;
  v_existing onboarding_identity_activations%rowtype;
  v_org_account organization_accounts%rowtype;
  v_org_id text;
  v_org_account_id text;
  v_activation_id text;
  v_employee_id text;
  v_employee_principal_id text;
  v_assignment_id text;
  v_employment_id text;
  v_assignment_principal_id text;
  v_read_grant_id text;
  v_message_grant_id text;
  v_policy_id text;
  v_payer_id text;
  v_beneficiary_id text;
  v_manifest_id text;
  v_build_id text;
  v_job_id text;
  v_intent_id text;
  v_command_id text;
  v_effect_id text;
  v_receipt_id text;
  v_replay_id text;
  v_lease_token text;
  v_seed text;
  v_payload jsonb;
  v_payload_hash text;
  v_response jsonb;
  v_response_hash text;
  v_profile_package profile_packages%rowtype;
begin
  if p_manifest is null or jsonb_typeof(p_manifest) <> 'object'
     or p_raw_answers is null or jsonb_typeof(p_raw_answers) <> 'object'
     or p_worker_context is null or jsonb_typeof(p_worker_context) <> 'object'
     or p_resource_graph is null or jsonb_typeof(p_resource_graph) <> 'array'
     or p_facts is null or jsonb_typeof(p_facts) <> 'array' then
    raise exception 'invalid_activation_payload';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_account_id || E'\x1f' || p_idempotency_key, 0));

  select * into v_existing
  from onboarding_identity_activations a
  where a.account_id = p_account_id and a.idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    return query select v_existing.id, v_existing.employee_id, v_existing.employee_principal_id,
      v_existing.assignment_id, v_existing.provisioning_job_id, v_existing.command_id,
      v_existing.receipt_id, true;
    return;
  end if;

  select * into v_identity
  from onboarding_identities oi
  where oi.id = p_identity_id
    and oi.account_id = p_account_id
    and oi.owner_principal_id = p_owner_principal_id
  for update;
  if v_identity.id is null or v_identity.status <> 'verified'
     or not amtech_verify_onboarding_identity_snapshot(v_identity.id) then
    raise exception 'identity_unverified';
  end if;
  if v_identity.employee_principal_id is not null then
    raise exception 'identity_already_activated';
  end if;
  if not exists (
    select 1 from human_principals hp
    join account_memberships am on am.user_id = hp.user_id
    where hp.id = p_owner_principal_id and hp.status = 'active'
      and am.account_id = p_account_id and am.role in ('owner','admin')
  ) then
    raise exception 'owner_principal_account_mismatch';
  end if;

  select * into v_profile_package
  from profile_packages pp
  where pp.package_key = p_profile_package_key and pp.status = 'active';
  if v_profile_package.id is null then raise exception 'profile_package_not_active'; end if;

  select * into v_org_account
  from organization_accounts oa
  where oa.account_id = p_account_id and oa.status = 'active'
  order by oa.created_at asc limit 1
  for update;
  if v_org_account.id is null then
    v_org_id := amtech_stable_activation_id('org', 'onboarding-org:' || p_account_id);
    v_org_account_id := amtech_stable_activation_id('rel', 'onboarding-org-account:' || p_account_id);
    insert into organizations(id, display_name, status)
    select v_org_id, a.display_name, 'active' from accounts a where a.id = p_account_id
    on conflict (id) do nothing;
    insert into organization_accounts(id, organization_id, account_id, status, provenance)
    values (v_org_account_id, v_org_id, p_account_id, 'active', jsonb_build_object(
      'source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now()
    )) on conflict (organization_id, account_id) do nothing;
  else
    v_org_id := v_org_account.organization_id;
  end if;

  v_seed := p_account_id || E'\x1f' || p_idempotency_key;
  v_activation_id := amtech_stable_activation_id('oact', 'activation:' || v_seed);
  v_employee_id := amtech_stable_activation_id('emp', 'employee:' || v_seed);
  v_employee_principal_id := amtech_stable_activation_id('epr', 'employee-principal:' || v_seed);
  v_assignment_id := amtech_stable_activation_id('asn', 'assignment:' || v_seed);
  v_employment_id := amtech_stable_activation_id('rel', 'employment:' || v_seed);
  v_assignment_principal_id := amtech_stable_activation_id('aspr', 'owner-assignment:' || v_seed);
  v_read_grant_id := amtech_stable_activation_id('grant', 'employee-read:' || v_seed);
  v_message_grant_id := amtech_stable_activation_id('grant', 'employee-message:' || v_seed);
  v_policy_id := amtech_stable_activation_id('apol', 'approval-policy:' || v_seed);
  v_payer_id := amtech_stable_activation_id('crel', 'payer:' || v_seed);
  v_beneficiary_id := amtech_stable_activation_id('crel', 'beneficiary:' || v_seed);
  v_manifest_id := amtech_stable_activation_id('man', 'manifest:' || v_seed);
  v_build_id := amtech_stable_activation_id('build', 'profile-build:' || v_seed);
  v_job_id := amtech_stable_activation_id('pjob', 'provisioning-job:' || v_seed);
  v_intent_id := amtech_stable_activation_id('intent', 'intent:' || v_seed);
  v_command_id := amtech_stable_activation_id('cmd', 'command:' || v_seed);
  v_effect_id := amtech_stable_activation_id('eff', 'effect:' || v_seed);
  v_receipt_id := amtech_stable_activation_id('erec', 'receipt:' || v_seed);
  v_replay_id := amtech_stable_activation_id('replay', 'replay:' || v_seed);
  v_lease_token := amtech_stable_activation_id('lease', 'lease:' || v_seed);

  insert into employees(id, account_id, name, status, profile_package_key, web_route)
  values (v_employee_id, p_account_id, p_employee_name, 'provisioning', p_profile_package_key, '/agent/' || v_employee_id);
  insert into employee_principals(id, employee_id, status)
  values (v_employee_principal_id, v_employee_id, 'active');
  insert into employee_assignments(
    id, organization_id, account_id, employee_principal_id, status, starts_at,
    policy_version, provenance
  ) values (
    v_assignment_id, v_org_id, p_account_id, v_employee_principal_id, 'active', now(),
    p_policy_version, jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())
  );
  insert into labor_relationships(
    id, relationship_type, subject_principal_id, subject_principal_class,
    organization_id, account_id, assignment_id, role, status, starts_at,
    policy_version, provenance
  ) values (
    v_employment_id, 'employment', v_employee_principal_id, 'employee',
    v_org_id, p_account_id, v_assignment_id, 'employee', 'active', now(),
    p_policy_version, jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())
  );
  insert into assignment_principals(
    id, assignment_id, principal_id, principal_class, role, status, starts_at,
    policy_version, provenance
  ) values (
    v_assignment_principal_id, v_assignment_id, p_owner_principal_id, 'human', 'owner',
    'active', now(), p_policy_version,
    jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())
  );
  insert into assignment_resource_grants(
    id, assignment_id, principal_id, resource_class, resource_id, actions,
    status, starts_at, policy_version, provenance
  ) values
    (v_read_grant_id, v_assignment_id, p_owner_principal_id, 'employee', v_employee_id,
     array['read'], 'active', now(), p_policy_version,
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())),
    (v_message_grant_id, v_assignment_id, p_owner_principal_id, 'employee', v_employee_id,
     array['message:create'], 'active', now(), p_policy_version,
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now()));
  insert into assignment_authority_policies(
    id, assignment_id, policy_version, action, required_roles, risk_class,
    step_up_required, status
  ) values (
    v_policy_id, v_assignment_id, p_policy_version, 'approve_consequential_action',
    array['owner','manager','approver'], 'high', true, 'active'
  );
  insert into commercial_relationships(
    id, assignment_id, relationship_type, organization_id, account_id, status,
    starts_at, provenance
  ) values
    (v_payer_id, v_assignment_id, 'payer', v_org_id, p_account_id, 'active', now(),
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now())),
    (v_beneficiary_id, v_assignment_id, 'beneficiary', v_org_id, p_account_id, 'active', now(),
     jsonb_build_object('source','onboarding_identity','identity_id',p_identity_id,'recordedAt',now()));

  v_payload := jsonb_build_object(
    'schema_version','onboarding-create-employee-v1',
    'onboarding_identity_id',p_identity_id,
    'employee_id',v_employee_id,
    'assignment_id',v_assignment_id,
    'provisioning_job_id',v_job_id,
    'manifest_hash','sha256:' || encode(digest(p_manifest::text,'sha256'),'hex')
  );
  v_payload_hash := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');

  perform register_durable_command(
    v_intent_id, v_assignment_id, p_owner_principal_id, 'human',
    'onboarding_identity:' || p_identity_id,
    'onboarding:create_employee:' || p_idempotency_key,
    v_command_id, 'onboarding.create_employee', '1.0.0', p_policy_version,
    v_payload, v_payload_hash, p_correlation_id, null
  );
  if not exists (select 1 from claim_durable_command(v_command_id, v_lease_token, 120)) then
    raise exception 'onboarding_activation_command_not_claimable';
  end if;
  perform reserve_effect_attempt(
    v_effect_id, v_command_id, 'onboarding-activation:' || p_idempotency_key,
    'manager-control-plane', 'persist_employee_activation', 'native_idempotency',
    v_payload_hash, p_idempotency_key, v_lease_token, 120
  );

  insert into employee_manifests(
    id, employee_id, manifest, raw_answers, transcript_ref, profile_package_key
  ) values (
    v_manifest_id, v_employee_id, p_manifest, p_raw_answers, p_transcript_ref, p_profile_package_key
  );

  insert into business_brain_facts(
    id, employee_id, account_id, fact_key, fact_value, category, source, source_ref, confidence
  )
  select
    amtech_stable_activation_id('fact', v_employee_id || ':' || (fact ->> 'key')),
    v_employee_id,
    p_account_id,
    fact ->> 'key',
    fact ->> 'value',
    fact ->> 'category',
    'onboarding',
    fact ->> 'source_ref',
    coalesce(fact ->> 'confidence', 'medium')
  from jsonb_array_elements(p_facts) fact
  where coalesce(fact ->> 'key','') <> '' and coalesce(fact ->> 'value','') <> '';

  insert into employee_profile_builds(
    id, employee_id, account_id, profile_package_id, package_key, package_version,
    params, install_status
  ) values (
    v_build_id, v_employee_id, p_account_id, v_profile_package.id, p_profile_package_key,
    v_profile_package.version, p_manifest, 'queued'
  );

  insert into provisioning_jobs(
    id, account_id, employee_id, idempotency_key, command_type, operation_key,
    state, desired_state, desired_resource_graph, worker_context, logs
  ) values (
    v_job_id, p_account_id, v_employee_id, p_idempotency_key, 'ensure_runtime',
    'ensure_runtime:' || p_account_id || ':' || v_employee_id,
    'requested', 'ready', p_resource_graph,
    p_worker_context || jsonb_build_object(
      'onboarding_identity_id', p_identity_id,
      'onboarding_command_id', v_command_id,
      'assignment_id', v_assignment_id,
      'manifest_id', v_manifest_id,
      'build_id', v_build_id
    ),
    jsonb_build_array(jsonb_build_object(
      'at',now(),
      'message','Verified onboarding activation committed through C3; Hermes reconciler owns runtime effects.',
      'command_id',v_command_id,
      'identity_id',p_identity_id
    ))
  );

  insert into provisioning_resource_states(
    id, provisioning_job_id, account_id, employee_id, resource_key, resource_type,
    desired_state, observed_state, idempotency_key
  )
  select
    amtech_stable_activation_id('prs', v_job_id || ':' || (resource ->> 'resource_key')),
    v_job_id, p_account_id, v_employee_id,
    resource ->> 'resource_key', resource ->> 'resource_type', resource ->> 'desired_state',
    case when resource ->> 'resource_key' in ('account','employee_record') then 'present' else 'unknown' end,
    resource ->> 'idempotency_key'
  from jsonb_array_elements(p_resource_graph) resource;

  perform record_effect_receipt(
    v_receipt_id, v_effect_id, 'accepted', 'postgres-activation:' || v_job_id,
    null, null, v_payload_hash, v_lease_token,
    jsonb_build_object(
      'onboarding_identity_id',p_identity_id,
      'employee_id',v_employee_id,
      'assignment_id',v_assignment_id,
      'provisioning_job_id',v_job_id
    )
  );

  v_response := jsonb_build_object('result', jsonb_build_object(
    'onboarding_identity_id',p_identity_id,
    'employee_id',v_employee_id,
    'employee_principal_id',v_employee_principal_id,
    'assignment_id',v_assignment_id,
    'provisioning_job_id',v_job_id,
    'receipt_id',v_receipt_id
  ));
  v_response_hash := 'sha256:' || encode(digest(v_response::text, 'sha256'), 'hex');
  perform complete_durable_command(
    v_command_id, v_lease_token, v_receipt_id, v_replay_id, v_response_hash, v_response
  );

  update onboarding_identities
     set employee_principal_id = v_employee_principal_id, updated_at = now()
   where id = p_identity_id and employee_principal_id is null;
  if not found then raise exception 'identity_activation_binding_conflict'; end if;

  insert into onboarding_identity_activations(
    id, onboarding_identity_id, account_id, owner_principal_id, employee_id,
    employee_principal_id, assignment_id, provisioning_job_id, command_id,
    receipt_id, idempotency_key, activation_snapshot_hash
  ) values (
    v_activation_id, p_identity_id, p_account_id, p_owner_principal_id, v_employee_id,
    v_employee_principal_id, v_assignment_id, v_job_id, v_command_id,
    v_receipt_id, p_idempotency_key,
    'sha256:' || encode(digest(v_payload::text || E'\x1f' || v_response::text, 'sha256'), 'hex')
  );

  return query select v_activation_id, v_employee_id, v_employee_principal_id,
    v_assignment_id, v_job_id, v_command_id, v_receipt_id, false;
end
$$;

create or replace function claim_next_provisioning_job(
  p_lease_token text,
  p_lease_seconds integer default 120
)
returns setof provisioning_jobs
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with candidate as (
    select job.id
    from provisioning_jobs job
    where job.state not in ('ready','success','failed','compensated')
      and job.next_attempt_at <= now()
      and job.attempt_count < job.max_attempts
      and (job.lease_expires_at is null or job.lease_expires_at < now())
      and (
        not (job.worker_context ? 'onboarding_command_id')
        or exists (
          select 1
          from durable_commands dc
          join effect_receipts er on er.id = dc.terminal_receipt_id
          where dc.id = job.worker_context ->> 'onboarding_command_id'
            and dc.status = 'succeeded'
            and er.state = 'accepted'
        )
      )
    order by job.created_at
    for update skip locked
    limit 1
  )
  update provisioning_jobs as job
  set lease_token = p_lease_token,
      lease_expires_at = now() + make_interval(secs => greatest(10, p_lease_seconds)),
      attempt_count = job.attempt_count + 1,
      updated_at = now()
  from candidate
  where job.id = candidate.id
  returning job.*;
end
$$;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled, denied_authorizers,
  required_evidence, source_ref, notes
) values
  ('table:onboarding-identities','table','onboarding_identities','S10.1','approved_platform_context','C2',true,true,
   array['account_membership_only','bearer_possession_only','caller_selected_account_or_employee'],
   array['owner-principal-binding','provider-verification','immutable-snapshot','rate-limit'],
   'packages/db/migrations/0064_onboarding_identity_activation_authority.sql',
   'Identity verification is owner-principal bound and never stores a raw TIN.'),
  ('route:onboarding-identity','manager_route','/manager/onboarding/identity/*','S10.1','approved_platform_context','C2',true,true,
   array['internal_bearer_only','account_membership_only','caller_selected_identity'],
   array['owner-session','provider-signature','audit-correlation'],
   'apps/manager/src/lib/onboarding-identity-routes.ts',
   'Owner session authenticates the pre-assignment identity workflow.'),
  ('route:onboarding-activation','manager_route','/manager/onboarding/provision-from-session','S10.1','assignment_resolver','C3',true,true,
   array['internal_bearer_only','unverified_identity','success_without_receipt'],
   array['verified-identity-snapshot','canonical-assignment','accepted-c3-receipt'],
   'apps/manager/src/tools/verified-provisioning.stub.ts',
   'Employee desired state and assignment graph commit atomically with C3 activation evidence.')
on conflict (key) do update set
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

revoke all on function reserve_onboarding_identity_verification(
  text,text,text,text,text,text,jsonb,text,text,text,text,text,text,text,text
) from public, anon, authenticated;
revoke all on function mark_onboarding_identity_provider_submission(text,text,text,text) from public, anon, authenticated;
revoke all on function complete_onboarding_identity_verification(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function amtech_onboarding_identity_decision(text,text) from public, anon, authenticated;
revoke all on function amtech_activate_verified_employee(
  text,text,text,text,text,jsonb,jsonb,text,jsonb,jsonb,jsonb,text,text,text
) from public, anon, authenticated;
revoke all on function amtech_verify_onboarding_identity_snapshot(text) from public, anon, authenticated;

grant execute on function reserve_onboarding_identity_verification(
  text,text,text,text,text,text,jsonb,text,text,text,text,text,text,text,text
) to service_role;
grant execute on function mark_onboarding_identity_provider_submission(text,text,text,text) to service_role;
grant execute on function complete_onboarding_identity_verification(text,text,text,text,text,text,text) to service_role;
grant execute on function amtech_onboarding_identity_decision(text,text) to service_role;
grant execute on function amtech_activate_verified_employee(
  text,text,text,text,text,jsonb,jsonb,text,jsonb,jsonb,jsonb,text,text,text
) to service_role;
grant execute on function amtech_verify_onboarding_identity_snapshot(text) to service_role;

commit;
