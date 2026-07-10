-- AMTECH AI Employee MVP — Phase 5 admin/ops groundwork
--
-- Additive internal-operator state. These tables are Manager/service-role only
-- by default; browser admin pages must go through Manager redacted summaries.

alter table accounts add column if not exists account_state text not null default 'trial';
alter table accounts add column if not exists plan_key text not null default 'free_mvp';
alter table accounts add column if not exists trial_started_at timestamptz;
alter table accounts add column if not exists trial_ends_at timestamptz;
alter table accounts add column if not exists billing_status text not null default 'free_mvp';

alter table employees add column if not exists needs_reprovision boolean not null default false;
alter table employees add column if not exists disabled_at timestamptz;

create table if not exists platform_users (
  id          text primary key,
  email       text,
  display_name text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint platform_users_status_chk check (status in ('active', 'disabled'))
);

create table if not exists platform_user_roles (
  id                text primary key,
  platform_user_id  text not null references platform_users(id) on delete cascade,
  role              text not null,
  created_at        timestamptz not null default now(),
  unique (platform_user_id, role),
  constraint platform_user_roles_role_chk check (role in ('platform_owner','platform_operator','support_readonly','billing_operator','security_reviewer'))
);

create table if not exists support_access_sessions (
  id                text primary key,
  platform_user_id  text not null references platform_users(id) on delete cascade,
  account_id        text not null references accounts(id) on delete cascade,
  role              text not null,
  reason            text not null,
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now()
);

create table if not exists admin_action_events (
  id                text primary key,
  platform_user_id  text not null references platform_users(id) on delete cascade,
  role              text not null,
  account_id        text references accounts(id) on delete set null,
  employee_id       text references employees(id) on delete set null,
  action            text not null,
  reason            text not null,
  result            text not null,
  proof             jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists platform_user_roles_user_idx on platform_user_roles(platform_user_id);
create index if not exists support_access_sessions_account_idx on support_access_sessions(account_id, expires_at);
create index if not exists admin_action_events_account_idx on admin_action_events(account_id, created_at desc);
create index if not exists admin_action_events_employee_idx on admin_action_events(employee_id, created_at desc);

alter table platform_users enable row level security;
alter table platform_user_roles enable row level security;
alter table support_access_sessions enable row level security;
alter table admin_action_events enable row level security;

revoke all on table platform_users from anon, authenticated;
revoke all on table platform_user_roles from anon, authenticated;
revoke all on table support_access_sessions from anon, authenticated;
revoke all on table admin_action_events from anon, authenticated;
