-- ============================================================================
-- AMTECH AI Employee MVP — Phase 1 operational seams
--
-- Adds production-shaped onboarding/provisioning state without locking the MVP
-- to one vertical. contractor_estimator is the first package, not the platform.
-- ============================================================================

create table phone_verification_attempts (
  id              text primary key,            -- ver_…
  onboarding_session_id text references onboarding_sessions(id) on delete set null,
  phone_e164      text not null,
  twilio_verify_sid text,
  status          text not null default 'pending',
  proof           jsonb not null default '{}'::jsonb,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table claim_tokens (
  id              text primary key,            -- claim_…
  token_hash      text unique not null,
  phone_e164      text not null,
  onboarding_session_id text references onboarding_sessions(id) on delete set null,
  twilio_proof    jsonb not null default '{}'::jsonb,
  consumed_at     timestamptz,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

create table profile_packages (
  id              text primary key,            -- pkg_…
  package_key     text unique not null,
  display_name    text not null,
  version         text not null,
  description     text,
  supported_business_kinds text[] not null default '{}',
  default_skills  text[] not null default '{}',
  template_source jsonb not null default '{}'::jsonb,
  env_requires    jsonb not null default '[]'::jsonb,
  validation_command text,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table employee_profile_builds (
  id              text primary key,            -- build_…
  employee_id     text not null references employees(id) on delete cascade,
  account_id      text not null references accounts(id) on delete cascade,
  profile_package_id text references profile_packages(id) on delete set null,
  package_key     text not null,
  package_version text,
  params          jsonb not null default '{}'::jsonb,
  generated_path  text,
  validation_status text not null default 'pending',
  install_status  text not null default 'pending',
  validation_output text,
  smoke_output    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table owner_web_sessions (
  id              text primary key,            -- sess_…
  account_id      text not null references accounts(id) on delete cascade,
  user_id         text not null references users(id) on delete cascade,
  token_hash      text unique not null,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

alter table employees
  add column if not exists profile_package_key text not null default 'contractor_estimator';

alter table employee_manifests
  add column if not exists profile_package_key text not null default 'contractor_estimator';

insert into profile_packages (
  id,
  package_key,
  display_name,
  version,
  description,
  supported_business_kinds,
  default_skills,
  template_source,
  env_requires,
  validation_command
) values (
  'pkg_contractor_estimator',
  'contractor_estimator',
  'Contractor Estimator',
  '0.1.0',
  'First AMTECH employee package: estimator/office employee optimized for painting and landscaping contractors.',
  array['painting', 'landscaping', 'hardscaping', 'contractor', 'home_services'],
  array['estimate', 'invoice', 'daily-checkin'],
  '{"name":"codegraphtheory/hermes-profile-template","url":"https://github.com/codegraphtheory/hermes-profile-template","relationship":"inspired-by-template-discipline"}'::jsonb,
  '[]'::jsonb,
  null
) on conflict (package_key) do update set
  version = excluded.version,
  description = excluded.description,
  supported_business_kinds = excluded.supported_business_kinds,
  default_skills = excluded.default_skills,
  template_source = excluded.template_source,
  updated_at = now();

create index idx_phone_attempt_session on phone_verification_attempts(onboarding_session_id);
create index idx_claim_tokens_session on claim_tokens(onboarding_session_id);
create index idx_profile_builds_employee on employee_profile_builds(employee_id);
create index idx_owner_sessions_token on owner_web_sessions(token_hash);

alter table profile_packages enable row level security;
alter table employee_profile_builds enable row level security;
alter table owner_web_sessions enable row level security;

create policy profile_packages_sel on profile_packages for select using (status = 'active');
create policy employee_profile_builds_sel on employee_profile_builds for select
  using (account_id in (select amtech_account_ids()));

-- owner_web_sessions remain service-role only; no anon select policy.
