-- ============================================================================
-- AMTECH AI Employee MVP — initial schema (Phase 0)
-- Spec: ../../../wiki/MVP/old-build-plan/03-data-model.md
--
-- The FULL logical schema is created now so Phases 1-6 inherit it without
-- migrations that reshape ownership boundaries. Tables are grouped by the
-- phase that first WRITES them; "[DORMANT]" tables exist as seams only.
--
-- Invariants baked in here:
--   * NO payment/billing column gates account or employee creation.
--   * Secrets are stored BY REFERENCE (token_secret_ref), never raw.
--   * Stripe rows default livemode=false; live events rejected unless enabled.
--   * RLS on owner-facing tables; the Manager uses the service role (bypasses
--     RLS) for backend control-plane work.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ACCOUNT & EMPLOYEE  (Phase 1 active)
-- ----------------------------------------------------------------------------

create table accounts (
  id            text primary key,              -- acct_…
  display_name  text not null,
  slug          text unique,
  timezone      text not null default 'America/New_York',
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

-- Owner login identity. Mirrors the Supabase Auth user (auth_user_id), so the
-- canonical identity key is the AMTECH account/user, not the Hermes profile.
create table users (
  id            text primary key,              -- user_…
  auth_user_id  uuid unique,                   -- supabase auth.users.id
  email         text unique not null,
  full_name     text,
  created_at    timestamptz not null default now()
);

create table account_memberships (
  id          text primary key,                -- mem_…
  account_id  text not null references accounts(id) on delete cascade,
  user_id     text not null references users(id) on delete cascade,
  role        text not null default 'owner',   -- owner now; admin roles later
  created_at  timestamptz not null default now(),
  unique (account_id, user_id)
);

-- The verified phone IS the employee's allowlisted owner number (A2P/TCPA record).
create table verified_phones (
  id                    text primary key,      -- phone_…
  account_id            text references accounts(id) on delete set null,
  phone_e164            text not null,
  verification_method   text not null,         -- twilio_verify | sms_inbound
  consent_channel       text,                  -- web | sms
  consent_text          text,
  twilio_proof          jsonb not null default '{}'::jsonb, -- Verify SID / inbound SID
  verified_at           timestamptz not null default now(),
  unique (account_id, phone_e164)
);

create table employees (
  id           text primary key,               -- emp_…
  account_id   text not null references accounts(id) on delete cascade,
  name         text not null,
  status       text not null default 'provisioning', -- provisioning|live|failed|retired
  profile_id   text,                           -- Hermes profile id (client_<id>)
  web_route    text,                           -- agent.amtechai.com/{employee_id}
  created_at   timestamptz not null default now()
);

-- Structured onboarding summary + raw answers + transcript ref (seeds the brain).
create table employee_manifests (
  id            text primary key,              -- man_…
  employee_id   text not null references employees(id) on delete cascade,
  manifest      jsonb not null,                -- OnboardingManifest
  raw_answers   jsonb not null default '{}'::jsonb,
  transcript_ref text,
  created_at    timestamptz not null default now()
);

-- Durable facts learned during onboarding/work. Pricing/logo/template facts are
-- first-class so the employee never re-asks what onboarding already supplied.
create table business_brain_facts (
  id           text primary key,               -- fact_…
  employee_id  text not null references employees(id) on delete cascade,
  account_id   text not null references accounts(id) on delete cascade,
  fact_key     text not null,
  fact_value   text not null,
  category     text,                           -- pricing|branding|customer|general
  source       text,                           -- onboarding|work|owner_correction
  source_ref   text,
  confidence   text not null default 'medium',
  updated_at   timestamptz not null default now(),
  unique (employee_id, fact_key)
);

-- ----------------------------------------------------------------------------
-- RUNTIME & PROVISIONING  (Phase 1 active)
-- ----------------------------------------------------------------------------

create table runtime_endpoints (
  id              text primary key,            -- rt_…
  employee_id     text not null references employees(id) on delete cascade,
  sms_number_e164 text,                        -- claimed 10DLC employee number
  twilio_webhook_url text,
  webchat_api_url text,                        -- Hermes per-profile API server
  public_web_route text,
  gateway_port    integer,                     -- 8100 + n
  backend_type    text not null default 'local', -- local now; docker/vm pilot seam
  health          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create table provisioning_jobs (
  id              text primary key,            -- pjob_…
  account_id      text not null references accounts(id) on delete cascade,
  employee_id     text references employees(id) on delete set null,
  idempotency_key text not null unique,
  state           text not null default 'queued', -- queued|running|success|failed
  failure_state   text,                        -- validation_failed|route_alloc_failed|…
  logs            jsonb not null default '[]'::jsonb,
  repair_state    jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Front-door orchestrator state (light store), keyed by phone + web session so a
-- conversation can start on one surface and finish on the other without loss.
create table onboarding_sessions (
  id             text primary key,             -- onb_…
  web_session_id text unique,
  phone_e164     text,
  state          text not null default 'anonymous_chat',
  surface        text,                         -- web | sms
  manifest_draft jsonb not null default '{}'::jsonb,
  transcript     jsonb not null default '[]'::jsonb,  -- raw turns; seeds brain verbatim
  account_id     text references accounts(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 10DLC number inventory. Lazy/self-healing pool; the front-door number is reserved.
create table number_pool (
  id            text primary key,              -- num_…
  phone_e164    text unique not null,
  status        text not null default 'free',  -- free|claimed|reserved
  employee_id   text references employees(id) on delete set null,
  reserved      boolean not null default false, -- true for the front-door number
  claimed_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ARTIFACTS & APPROVALS  ([DORMANT] — Phase 2)
-- ----------------------------------------------------------------------------

create table artifacts (
  id           text primary key,               -- art_…
  employee_id  text not null references employees(id) on delete cascade,
  account_id   text not null references accounts(id) on delete cascade,
  kind         text not null,                  -- estimate|invoice|report
  mime_type    text,
  storage_ref  text,                           -- Supabase Storage object path
  created_run  text,
  -- estimate-specific (03-data-model.md): line items, assumptions, prices, deposit
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table artifact_links (
  id            text primary key,              -- lnk_…
  artifact_id   text not null references artifacts(id) on delete cascade,
  token_hash    text not null,                 -- HMAC of signed token (not raw)
  audience      text,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  access_count  integer not null default 0,
  created_at    timestamptz not null default now()
);

create table approvals (
  id              text primary key,            -- appr_…
  employee_id     text not null references employees(id) on delete cascade,
  account_id      text not null references accounts(id) on delete cascade,
  action_key      text not null,               -- send_estimate_email|send_invoice|…
  summary         text not null,
  risk_level      text not null default 'medium',
  refs            jsonb not null default '{}'::jsonb,
  channel         text,                        -- sms|web
  resolution      text,                        -- approved|rejected|expired
  resolved_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- GMAIL CONNECTOR  ([DORMANT] — Phase 3). Secrets BY REFERENCE.
-- ----------------------------------------------------------------------------

create table connector_accounts (
  id              text primary key,            -- conn_…
  employee_id     text not null references employees(id) on delete cascade,
  account_id      text not null references accounts(id) on delete cascade,
  connector_key   text not null,               -- email
  provider        text not null,               -- gmail
  status          text not null default 'disconnected',
  scopes          text[] not null default '{}',
  token_secret_ref text,                        -- reference into the secret store; never raw
  created_at      timestamptz not null default now(),
  unique (employee_id, connector_key)
);

create table gmail_watches (
  id             text primary key,
  connector_id   text not null references connector_accounts(id) on delete cascade,
  topic          text,
  subscription   text,
  last_history_id text,
  expiration     timestamptz,
  status         text not null default 'inactive',
  created_at     timestamptz not null default now()
);

create table email_threads (
  id            text primary key,
  connector_id  text not null references connector_accounts(id) on delete cascade,
  gmail_thread_id text not null,
  customer_email text,
  customer_name text,
  estimate_artifact_id text references artifacts(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table outbound_emails (
  id            text primary key,
  connector_id  text not null references connector_accounts(id) on delete cascade,
  approval_id   text references approvals(id) on delete set null,
  to_email      text,
  subject       text,
  body          text,
  attachment_artifact_ids text[] not null default '{}',
  gmail_message_id text,
  gmail_thread_id text,
  sent_status   text not null default 'draft',
  created_at    timestamptz not null default now()
);

create table inbound_email_events (
  id             text primary key,
  connector_id   text references connector_accounts(id) on delete cascade,
  pubsub_message_id text,
  gmail_history_id text,
  gmail_message_id text,
  gmail_thread_id text,
  normalized_summary text,                     -- safe snippet only; no full raw body in logs
  delivery_status text not null default 'pending',
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- STRIPE CONNECTOR  ([DORMANT] — Phase 4). Test mode; livemode=false default.
-- ----------------------------------------------------------------------------

create table stripe_connections (
  id                 text primary key,
  employee_id        text not null references employees(id) on delete cascade,
  account_id         text not null references accounts(id) on delete cascade,
  connected_account_id text,
  account_type       text,                     -- standard|express
  onboarding_status  text not null default 'not_started',
  charges_enabled    boolean not null default false,
  payouts_enabled    boolean not null default false,
  secret_ref         text,
  created_at         timestamptz not null default now()
);

create table stripe_account_links (
  id            text primary key,
  stripe_connection_id text not null references stripe_connections(id) on delete cascade,
  url           text,
  state         text not null default 'created', -- created|returned|expired
  refresh_url   text,
  return_url    text,
  created_at    timestamptz not null default now()
);

create table stripe_customers (
  id            text primary key,
  account_id    text not null references accounts(id) on delete cascade,
  stripe_customer_id text,
  email         text,
  name          text,
  created_at    timestamptz not null default now()
);

create table stripe_invoices (
  id                 text primary key,
  stripe_connection_id text not null references stripe_connections(id) on delete cascade,
  estimate_id        text references artifacts(id) on delete set null,
  stripe_invoice_id  text,
  deposit_amount     integer,                  -- minor units
  hosted_invoice_url text,
  invoice_pdf        text,
  status             text not null default 'draft',
  created_at         timestamptz not null default now()
);

create table stripe_webhook_events (
  id                text primary key,
  stripe_event_id   text unique,
  type              text,
  livemode          boolean not null default false,
  signature_verified boolean not null default false,
  processed         boolean not null default false,
  trace             jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- EVENTS & NOTIFICATIONS  ([DORMANT] — event mesh)
-- ----------------------------------------------------------------------------

create table inbound_events (
  id              text primary key,            -- evt_…
  source          text not null,               -- gmail|stripe|twilio|manager
  event_type      text not null,
  provider_id     text,
  idempotency_key text unique,
  normalized_payload jsonb not null default '{}'::jsonb,
  status          text not null default 'received',
  trace           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create table employee_messages (
  id           text primary key,               -- msg_…
  employee_id  text not null references employees(id) on delete cascade,
  direction    text not null,                  -- to_employee | to_owner
  source       text,
  channel      text,                           -- sms|web|voice
  body         text,
  provider_id  text,                           -- e.g. Twilio outbound SID
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);

create table notification_preferences (
  id           text primary key,
  account_id   text references accounts(id) on delete cascade,
  employee_id  text references employees(id) on delete cascade,
  default_channel text not null default 'sms',
  critical_channel text,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- REMINDERS  ([DORMANT] — Phase 5). Google Calendar NOT required for MVP.
-- ----------------------------------------------------------------------------

create table job_commitments (
  id            text primary key,              -- job_…
  account_id    text references accounts(id) on delete cascade,  -- RLS owner scope
  employee_id   text not null references employees(id) on delete cascade,
  estimate_id   text references artifacts(id) on delete set null,
  customer_ref  text,
  start_at      timestamptz,
  start_window  text,
  notes         text,
  source_ref    text,                          -- source email/message
  created_at    timestamptz not null default now()
);

create table reminders (
  id            text primary key,              -- rem_…
  account_id    text references accounts(id) on delete cascade,
  employee_id   text references employees(id) on delete cascade,
  job_id        text references job_commitments(id) on delete set null,
  scheduled_at  timestamptz not null,
  channel       text not null default 'sms',
  status        text not null default 'scheduled',
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT, ENTITLEMENTS, USAGE  (Phase 1 active — default allow)
-- ----------------------------------------------------------------------------

create table audit_log (
  id          text primary key,                -- aud_…
  account_id  text,
  employee_id text,
  actor       text not null,                   -- front_door|employee|manager|owner
  action      text not null,
  resource    text,
  result      text not null,                   -- ok|failed|denied|needs_confirmation
  details     jsonb not null default '{}'::jsonb,  -- safe details only; no raw secrets
  created_at  timestamptz not null default now()
);

create table entitlement_policies (
  id          text primary key default ('ent_' || encode(gen_random_bytes(8), 'hex')),
  account_id  text references accounts(id) on delete cascade,
  feature_key text,
  policy      text not null default 'allow',   -- MVP default: allow all
  created_at  timestamptz not null default now()
);

create table feature_checks (
  id          uuid primary key default gen_random_uuid(),
  account_id  text,
  employee_id text,
  feature_key text not null,
  decision    text not null,                   -- allow|deny
  created_at  timestamptz not null default now()
);

create table usage_events (
  id          uuid primary key default gen_random_uuid(),
  account_id  text,
  employee_id text,
  feature_key text not null,
  quantity    numeric not null default 1,
  unit        text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Global default-allow policy row (account_id null = applies to all).
insert into entitlement_policies (account_id, feature_key, policy)
values (null, null, 'allow');

-- ----------------------------------------------------------------------------
-- Helpful indexes
-- ----------------------------------------------------------------------------
create index idx_memberships_user on account_memberships(user_id);
create index idx_employees_account on employees(account_id);
create index idx_brain_employee on business_brain_facts(employee_id);
create index idx_runtime_employee on runtime_endpoints(employee_id);
create index idx_audit_account on audit_log(account_id);
create index idx_events_idem on inbound_events(idempotency_key);
