-- AMTECH AI Employee MVP — Phase 3A: channel/session/presence router

create table if not exists channel_sessions (
  id            text primary key,
  employee_id   text not null references employees(id) on delete cascade,
  account_id    text references accounts(id) on delete cascade,
  channel       text not null check (channel in ('web','sms')),
  last_seen_at  timestamptz not null default now(),
  session_info  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(employee_id, channel)
);

create table if not exists delivery_decisions (
  id              text primary key,
  employee_id     text not null references employees(id) on delete cascade,
  account_id      text references accounts(id) on delete cascade,
  intent_key      text not null,
  move            text not null,
  chosen_channel  text not null check (chosen_channel in ('web','sms','none')),
  reason          text not null,
  proof           jsonb not null default '{}'::jsonb,
  fallback        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(employee_id, intent_key)
);

create index if not exists idx_channel_sessions_employee_seen
  on channel_sessions(employee_id, channel, last_seen_at desc);

create index if not exists idx_delivery_decisions_employee_created
  on delivery_decisions(employee_id, created_at desc);

alter table channel_sessions enable row level security;
alter table delivery_decisions enable row level security;
