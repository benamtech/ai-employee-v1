-- AMTECH AI Employee MVP — QuickBooks Online connector (Phase A0).
--
-- See mvp-build/docs/quickbooks-connector-architecture.md and
-- quickbooks-connector-implementation-plan.md. Mirrors the Gmail/Stripe
-- connector shape on connector_accounts, plus two new Manager-only tables:
-- quickbooks_pending_writes (the approval-binding source of truth for every
-- write) and inbound_qbo_events (webhook/CDC dedupe, mirroring
-- inbound_email_events).

-- Additive connector_accounts columns. NOTE: connector_accounts already has
-- `unique (employee_id, connector_key)` (0001_init.sql) — one employee can
-- have exactly one connector_key='accounting' row. external_label is a
-- display-name convenience only; it does NOT lift the one-QuickBooks-company-
-- per-employee limit (open gap, named in the architecture doc's Capabilities
-- section — a bookkeeping firm wanting one employee across many clients'
-- QBO companies needs a separate, not-yet-designed extension).
alter table connector_accounts add column if not exists environment text; -- 'sandbox' | 'production'
alter table connector_accounts add column if not exists realm_id text;
alter table connector_accounts add column if not exists external_label text;
-- Concurrency-safe QBO refresh-token-rotation lock (qbo-tokens.ts). QBO
-- rotates the refresh token on every use, so two concurrent refreshes must
-- never race; the claim is a single atomic conditional UPDATE (see
-- getFreshQboAccessToken), not a separate lock table — this column IS the lock.
alter table connector_accounts add column if not exists token_refresh_lease_until timestamptz;

create table if not exists quickbooks_pending_writes (
  id                text primary key,             -- qbpw_…
  account_id        text not null references accounts(id) on delete cascade,
  employee_id       text not null references employees(id) on delete cascade,
  connector_id      text not null references connector_accounts(id) on delete cascade,
  action_key        text not null,                -- commit_quickbooks_expense|bill|invoice|payment
  entity_type       text not null,                -- Purchase|Bill|Invoice|Payment (QBO entity name)
  -- Stored as TEXT (the exact serialized JSON), NOT jsonb: the commit-time
  -- tamper check re-hashes this value and compares to payload_hash, and jsonb
  -- normalizes/reorders object keys on round-trip — which would make the hash
  -- never match. text round-trips byte-identically. commit parses it before
  -- sending to QuickBooks.
  canonical_payload text not null,                 -- the exact serialized payload commit_quickbooks_write will send
  payload_hash      text not null,                 -- sha256 of canonical_payload (the text); tamper-evidence check at commit
  -- Set exactly once when request_approval returns an id; NEVER overwritten
  -- after that. commit_quickbooks_write verifies the caller's approval_id
  -- equals THIS column, not merely "does some approval exist and say
  -- approved" — the actual confused-deputy fix (see quickbooks-connector-
  -- implementation-plan.md Phase A3).
  approval_id       text references approvals(id) on delete set null,
  -- Active state machine: pending_approval -> committing -> committed | failed.
  -- The owner-approval truth lives in the approvals row (commit checks
  -- approvals.resolution='approved'); commit's compare-and-swap claims
  -- pending_approval -> committing. 'approved'/'rejected' are reserved for a
  -- future resolve_approval->pending_write mirroring (Phase B nicety), not used
  -- by the Phase A commit path.
  status            text not null default 'pending_approval',
  qbo_entity_id     text,                          -- QBO's assigned id once committed
  qbo_sync_token    text,                          -- QBO SyncToken once committed (needed for any future update)
  intuit_tid        text,                          -- Intuit correlation id (support/debugging)
  committed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists quickbooks_pending_writes_connector_idx on quickbooks_pending_writes(connector_id);
create index if not exists quickbooks_pending_writes_approval_idx on quickbooks_pending_writes(approval_id);

create table if not exists inbound_qbo_events (
  id                text primary key,              -- iqe_…
  connector_id      text not null references connector_accounts(id) on delete cascade,
  realm_id          text not null,
  entity_type       text not null,
  entity_id         text not null,
  operation         text not null,                 -- Create|Update|Delete|Merge|Void
  cloudevent_id      text,                          -- CloudEvents envelope id, when present — webhook/CDC dedupe key
  normalized_summary text,
  delivery_status   text not null default 'pending', -- pending|delivered|duplicate
  created_at        timestamptz not null default now()
);

create unique index if not exists inbound_qbo_events_dedupe_idx
  on inbound_qbo_events(connector_id, entity_type, entity_id, operation, coalesce(cloudevent_id, ''));

-- RLS: Manager-only (no policy = no anon/authenticated access), following the
-- established convention (0002 artifact_links, 0013 metering ledgers, 0017
-- preview_links, 0018 the 21-table RLS closure). ALSO revoke the default public
-- Data-API grants (matching 0025's hardening) so protection is defense-in-depth
-- (RLS-no-policy AND no table privilege), not RLS alone.
alter table quickbooks_pending_writes enable row level security;
alter table inbound_qbo_events enable row level security;

revoke all on table quickbooks_pending_writes from anon, authenticated;
revoke all on table inbound_qbo_events from anon, authenticated;
