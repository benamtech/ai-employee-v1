begin;

-- WS1: employee-scoped model gateway credentials. Raw tokens are sealed by
-- Manager and never rendered as provider master keys. Runtime profiles receive
-- only the scoped token and gateway URL.
create table if not exists model_gateway_credentials (
  id text primary key,
  account_id text not null,
  employee_id text not null,
  credential_version integer not null default 1,
  token_hash text not null,
  token_secret_ref text not null,
  gateway_url text not null,
  model_alias text not null,
  allowed_providers text[] not null default '{}',
  allowed_models text[] not null default '{}',
  spend_limit_cents integer not null default 0,
  rate_limit_per_minute integer not null default 60,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  rotated_from_credential_id text references model_gateway_credentials(id),
  created_at timestamptz not null default now(),
  check (credential_version > 0),
  check (spend_limit_cents >= 0),
  check (rate_limit_per_minute > 0)
);

create unique index if not exists model_gateway_credentials_active_version_idx
  on model_gateway_credentials (account_id, employee_id, credential_version)
  where revoked_at is null;

create index if not exists model_gateway_credentials_lookup_idx
  on model_gateway_credentials (employee_id, account_id, expires_at)
  where revoked_at is null;

create table if not exists model_gateway_request_audit (
  id text primary key,
  credential_id text not null references model_gateway_credentials(id),
  account_id text not null,
  employee_id text not null,
  model_alias text not null,
  provider text not null,
  upstream_model text not null,
  credential_version integer not null,
  latency_ms integer not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_cents integer not null default 0,
  status text not null check (status in ('ok','failed','rate_limited','provider_unavailable','unauthorized')),
  error_code text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists model_gateway_request_audit_employee_created_idx
  on model_gateway_request_audit (account_id, employee_id, created_at desc);

create index if not exists model_gateway_request_audit_correlation_idx
  on model_gateway_request_audit (correlation_id)
  where correlation_id is not null;

-- WS2: durable reconciler fields. Existing provisioning_jobs remains the source
-- row; these columns let workers lease, retry, resume, classify, and inspect.
alter table provisioning_jobs
  add column if not exists command_type text not null default 'ensure_runtime',
  add column if not exists operation_key text,
  add column if not exists lease_token text,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists retry_class text,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists desired_resource_graph jsonb not null default '[]'::jsonb,
  add column if not exists last_verified_resource_key text,
  add column if not exists drift jsonb not null default '{}'::jsonb;

create unique index if not exists provisioning_jobs_operation_key_idx
  on provisioning_jobs (operation_key)
  where operation_key is not null;

create index if not exists provisioning_jobs_lease_scan_idx
  on provisioning_jobs (state, next_attempt_at, lease_expires_at);

create index if not exists provisioning_jobs_employee_state_idx
  on provisioning_jobs (account_id, employee_id, state);

create table if not exists provisioning_resource_states (
  id text primary key,
  provisioning_job_id text not null references provisioning_jobs(id) on delete cascade,
  account_id text not null,
  employee_id text,
  resource_key text not null,
  resource_type text not null check (resource_type in (
    'account','employee_record','scoped_credentials','rendered_profile','employee_network',
    'runtime','gateway_routing','channel_provider_bindings','health_acceptance','welcome_ready'
  )),
  desired_state text not null,
  observed_state text,
  idempotency_key text not null,
  last_inspected_at timestamptz,
  last_applied_at timestamptz,
  last_verified_at timestamptz,
  retry_class text,
  evidence jsonb not null default '{}'::jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provisioning_job_id, resource_key),
  unique (idempotency_key)
);

create index if not exists provisioning_resource_states_job_idx
  on provisioning_resource_states (provisioning_job_id, resource_key);

create index if not exists provisioning_resource_states_repair_idx
  on provisioning_resource_states (resource_type, observed_state, updated_at);

create table if not exists provisioning_commands (
  id text primary key,
  account_id text not null,
  employee_id text,
  command_type text not null check (command_type in (
    'ensure_runtime','teardown','suspend','rotate_model_gateway_credential',
    'reprovision','replace_runtime','restore','inspect_drift','repair_drift'
  )),
  idempotency_key text not null unique,
  requested_by text not null default 'manager',
  status text not null default 'requested' check (status in ('requested','claimed','succeeded','failed','compensating','compensated')),
  provisioning_job_id text references provisioning_jobs(id),
  payload jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  error jsonb,
  lease_token text,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provisioning_commands_claim_idx
  on provisioning_commands (status, created_at)
  where status in ('requested','failed');

-- WS3 groundwork: canonical ambient inbox envelope. Existing webhook_inbox can be
-- migrated source-by-source onto this table without losing the two-door invariant.
create table if not exists ambient_event_inbox (
  inbox_id text primary key,
  source_type text not null,
  provider text not null,
  external_event_id text not null,
  account_id text,
  employee_id text,
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  verified_at timestamptz,
  schema_version integer not null default 1,
  event_type text not null,
  subject_key text,
  correlation_id text,
  causation_id text,
  dedupe_key text not null,
  ordering_key text,
  payload jsonb not null default '{}'::jsonb,
  headers_metadata jsonb not null default '{}'::jsonb,
  verification_metadata jsonb not null default '{}'::jsonb,
  processing_state text not null default 'received' check (processing_state in (
    'received','processing','waiting_for_binding','processed','retryable_failed','dead_letter','suppressed'
  )),
  attempt_count integer not null default 0,
  lease_token text,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  dead_letter_reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_type, provider, external_event_id),
  unique (dedupe_key)
);

create index if not exists ambient_event_inbox_claim_idx
  on ambient_event_inbox (processing_state, next_attempt_at, received_at)
  where processing_state in ('received','retryable_failed','waiting_for_binding');

create index if not exists ambient_event_inbox_correlation_idx
  on ambient_event_inbox (correlation_id)
  where correlation_id is not null;

create index if not exists ambient_event_inbox_employee_state_idx
  on ambient_event_inbox (account_id, employee_id, processing_state, received_at);

create index if not exists ambient_event_inbox_ordering_idx
  on ambient_event_inbox (ordering_key, occurred_at, received_at)
  where ordering_key is not null;

alter table model_gateway_credentials enable row level security;
alter table model_gateway_request_audit enable row level security;
alter table provisioning_resource_states enable row level security;
alter table provisioning_commands enable row level security;
alter table ambient_event_inbox enable row level security;

revoke all on model_gateway_credentials, model_gateway_request_audit, provisioning_resource_states, provisioning_commands, ambient_event_inbox from anon, authenticated;

commit;
