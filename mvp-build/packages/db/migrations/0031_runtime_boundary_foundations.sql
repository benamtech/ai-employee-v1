begin;

create table if not exists provisioning_transitions (
  id text primary key,
  provisioning_job_id text not null references provisioning_jobs(id) on delete cascade,
  account_id text not null,
  employee_id text,
  from_state text,
  to_state text not null check (to_state in (
    'requested','resources_reserved','profile_rendered','credentials_minted',
    'runtime_started','runtime_healthy','routing_activated','channel_configured',
    'welcome_sent','ready','failed','compensating','compensated'
  )),
  transition_version bigint not null,
  attempt integer not null default 1,
  retry_class text,
  timeout_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  unique (provisioning_job_id, transition_version)
);

create index if not exists provisioning_transitions_job_created_idx
  on provisioning_transitions (provisioning_job_id, created_at);

alter table provisioning_jobs
  add column if not exists transition_version bigint not null default 0,
  add column if not exists desired_state text not null default 'ready',
  add column if not exists last_transition_at timestamptz,
  add column if not exists compensation_state jsonb not null default '{}'::jsonb;

create table if not exists webhook_inbox (
  id text primary key,
  provider text not null,
  provider_event_id text not null,
  account_id text,
  employee_id text,
  state text not null default 'received' check (state in (
    'received','processing','waiting_for_binding','processed','retryable_failed','dead_letter'
  )),
  signature_verified_at timestamptz not null,
  received_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token text,
  attempts integer not null default 0,
  max_attempts integer not null default 12,
  headers jsonb not null default '{}'::jsonb,
  raw_body bytea not null,
  normalized_event jsonb,
  last_error jsonb,
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index if not exists webhook_inbox_claim_idx
  on webhook_inbox (state, available_at, received_at)
  where state in ('received','retryable_failed','waiting_for_binding');

create table if not exists webhook_dead_letters (
  id text primary key,
  inbox_id text not null references webhook_inbox(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  failure jsonb not null,
  replay_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_replayed_at timestamptz
);

create table if not exists host_provisioner_audit (
  id text primary key,
  request_id text not null,
  idempotency_key text not null,
  nonce text not null,
  account_id text not null,
  employee_id text not null,
  operation text not null,
  result text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (request_id),
  unique (nonce)
);

alter table provisioning_transitions enable row level security;
alter table webhook_inbox enable row level security;
alter table webhook_dead_letters enable row level security;
alter table host_provisioner_audit enable row level security;

revoke all on provisioning_transitions, webhook_inbox, webhook_dead_letters, host_provisioner_audit from anon, authenticated;

commit;
