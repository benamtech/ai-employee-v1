-- CE-3: session rotation before lossy compaction.
--
-- Tracks per-transcript context occupancy so Manager can rotate the employee to a
-- FRESH transcript (new `transcript_session_id`) BEFORE Hermes' lossy compression
-- fires, while PRESERVING the stable `memory_session_key` (X-Hermes-Session-Key) so
-- the Hermes memory scope is continuous across rotation.
--
-- Distinct from `agent_context_primer_sessions` (the once-per-session primer gate):
-- that gate keys on `transcript_session_id` so a rotated session re-primes; this
-- table tracks occupancy + rotation lineage.
--
-- Manager-only control-plane table (service-role only): RLS enabled, browser grants
-- revoked. Never grant anon/authenticated access.

create table if not exists employee_sessions (
  employee_id           text not null references employees(id) on delete cascade,
  transcript_session_id text not null,             -- Hermes run/session id (ROTATES)
  account_id            text not null references accounts(id) on delete cascade,
  memory_session_key    text not null,             -- X-Hermes-Session-Key (PRESERVED)
  context_tokens        integer not null default 0, -- latest prompt-token occupancy
  turn_count            integer not null default 0,
  status                text not null default 'active', -- active | rotated
  rotated_from          text,                       -- prior transcript_session_id
  pending_carryover     boolean not null default false, -- next primer adds a handoff line
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  primary key (employee_id, transcript_session_id)
);

-- At most one active transcript per employee (partial unique).
create unique index if not exists idx_employee_sessions_one_active
  on employee_sessions(employee_id) where status = 'active';

alter table employee_sessions enable row level security;
revoke all on employee_sessions from anon, authenticated;
