-- Public estimator employee acquisition surface.
--
-- These tables are Manager/service-role only. Anonymous browser traffic must go
-- through the web route handlers and Manager endpoints; never expose raw rows
-- through Supabase Data API.

create table if not exists public_estimator_sessions (
  id                    text primary key,
  account_id             text not null references accounts(id) on delete cascade,
  employee_id            text not null references employees(id) on delete cascade,
  visitor_token_hash     text not null unique,
  transcript_session_id  text not null,
  memory_session_key     text not null,
  status                 text not null default 'active',
  visitor_email          text,
  ip_hash                text,
  user_agent_hash        text,
  last_seen_at           timestamptz not null default now(),
  expires_at             timestamptz not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint public_estimator_sessions_status_chk
    check (status in ('active','expired','blocked'))
);

create table if not exists public_estimator_messages (
  id                  text primary key,
  visitor_session_id  text not null references public_estimator_sessions(id) on delete cascade,
  account_id           text not null references accounts(id) on delete cascade,
  employee_id          text not null references employees(id) on delete cascade,
  direction            text not null,
  body                 text not null,
  status               text not null default 'recorded',
  turn_job_id          text,
  work_run_id          text,
  external_run_id      text,
  created_at           timestamptz not null default now(),
  constraint public_estimator_messages_direction_chk
    check (direction in ('visitor','employee','system')),
  constraint public_estimator_messages_status_chk
    check (status in ('received','delivered','queued','failed','recorded'))
);

create table if not exists public_estimator_artifacts (
  id                  text primary key,
  visitor_session_id  text not null references public_estimator_sessions(id) on delete cascade,
  account_id           text not null references accounts(id) on delete cascade,
  employee_id          text not null references employees(id) on delete cascade,
  artifact_id          text not null references artifacts(id) on delete cascade,
  status               text not null default 'current',
  source_run_id         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (visitor_session_id, artifact_id),
  constraint public_estimator_artifacts_status_chk
    check (status in ('current','superseded','revoked'))
);

create table if not exists public_estimator_events (
  id                  text primary key,
  visitor_session_id  text references public_estimator_sessions(id) on delete cascade,
  account_id           text references accounts(id) on delete cascade,
  employee_id          text references employees(id) on delete cascade,
  event_type           text not null,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);

create table if not exists public_estimator_email_sends (
  id                  text primary key,
  visitor_session_id  text not null references public_estimator_sessions(id) on delete cascade,
  account_id           text not null references accounts(id) on delete cascade,
  employee_id          text not null references employees(id) on delete cascade,
  artifact_id          text references artifacts(id) on delete set null,
  recipient_email      text not null,
  idempotency_key      text not null,
  status               text not null default 'pending',
  provider_message_id  text,
  provider_status      integer,
  error_code           text,
  error_message        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (idempotency_key),
  constraint public_estimator_email_sends_status_chk
    check (status in ('pending','sent','failed'))
);

create index if not exists idx_public_estimator_sessions_employee
  on public_estimator_sessions(employee_id, created_at desc);
create index if not exists idx_public_estimator_sessions_ip
  on public_estimator_sessions(ip_hash, created_at desc);
create index if not exists idx_public_estimator_messages_session
  on public_estimator_messages(visitor_session_id, created_at desc);
create index if not exists idx_public_estimator_artifacts_session_current
  on public_estimator_artifacts(visitor_session_id, status, created_at desc);
create index if not exists idx_public_estimator_events_session
  on public_estimator_events(visitor_session_id, created_at desc);
create index if not exists idx_public_estimator_events_type
  on public_estimator_events(event_type, created_at desc);
create index if not exists idx_public_estimator_email_session
  on public_estimator_email_sends(visitor_session_id, created_at desc);

alter table public_estimator_sessions enable row level security;
alter table public_estimator_messages enable row level security;
alter table public_estimator_artifacts enable row level security;
alter table public_estimator_events enable row level security;
alter table public_estimator_email_sends enable row level security;

revoke all on table public_estimator_sessions from anon, authenticated;
revoke all on table public_estimator_messages from anon, authenticated;
revoke all on table public_estimator_artifacts from anon, authenticated;
revoke all on table public_estimator_events from anon, authenticated;
revoke all on table public_estimator_email_sends from anon, authenticated;
