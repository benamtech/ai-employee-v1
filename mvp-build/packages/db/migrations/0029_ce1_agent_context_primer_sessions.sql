-- CE-1: Manager-owned once-per-session gate for the Hermes pre_llm_call
-- context primer. The hook is a transport optimization; this table is the
-- authority that prevents dynamic context from becoming a per-turn digest.

create table if not exists agent_context_primer_sessions (
  account_id text not null references accounts(id) on delete cascade,
  employee_id text not null references employees(id) on delete cascade,
  session_key text not null,
  created_at timestamptz not null default now(),
  primary key (employee_id, session_key)
);

alter table agent_context_primer_sessions enable row level security;
revoke all on agent_context_primer_sessions from anon, authenticated;

create index if not exists idx_agent_context_primer_account
  on agent_context_primer_sessions(account_id, created_at desc);

