-- AMTECH AI Employee MVP — agent trust-boundary hardening
--
-- Per-employee MCP credentials replace the shared Manager internal bearer inside
-- employee containers. The raw token is rendered only into the profile config;
-- Manager stores only a hash and derives account/employee identity from this row.

create table if not exists employee_mcp_credentials (
  id            text primary key,
  account_id    text not null references accounts(id) on delete cascade,
  employee_id   text not null references employees(id) on delete cascade,
  token_hash    text not null unique,
  token_prefix  text not null,
  audience      text not null default '/manager/mcp',
  status        text not null default 'active',
  expires_at    timestamptz,
  revoked_at    timestamptz,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint employee_mcp_credentials_status_chk check (status in ('active', 'revoked')),
  constraint employee_mcp_credentials_audience_chk check (audience = '/manager/mcp')
);

create index if not exists employee_mcp_credentials_employee_idx
  on employee_mcp_credentials(employee_id, status);

alter table employee_mcp_credentials enable row level security;

-- Defense-in-depth: this table is Manager/service-role only. No anon or
-- authenticated Data API role should be able to read credential metadata.
revoke all on table employee_mcp_credentials from anon;
revoke all on table employee_mcp_credentials from authenticated;
