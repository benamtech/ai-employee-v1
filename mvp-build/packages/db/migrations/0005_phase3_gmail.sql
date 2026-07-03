-- ============================================================================
-- AMTECH AI Employee MVP — Phase 3 Gmail send/listen hardening (additive only)
-- All Phase 3 tables already exist in 0001_init.sql; this migration adds the
-- columns Phase 3 tools persist (connector identity, token expiry, send state)
-- and the dedupe/lookup indexes the event mesh relies on.
-- ============================================================================

-- Connector identity + token custody metadata (secrets remain BY REFERENCE in
-- token_secret_ref; these columns are safe, non-secret metadata only).
alter table connector_accounts add column if not exists external_email text;
alter table connector_accounts add column if not exists token_expiry timestamptz;
alter table connector_accounts add column if not exists last_connector_test_at timestamptz;
alter table connector_accounts add column if not exists last_error text;

-- Outbound email send proof/state.
alter table outbound_emails add column if not exists sent_at timestamptz;
alter table outbound_emails add column if not exists error text;

-- Dedupe + lookup indexes for the reply event mesh (Pub/Sub is at-least-once).
create unique index if not exists idx_inbound_email_events_message
  on inbound_email_events(gmail_message_id) where gmail_message_id is not null;
create index if not exists idx_inbound_email_events_connector_created
  on inbound_email_events(connector_id, created_at desc);
create unique index if not exists idx_email_threads_connector_thread
  on email_threads(connector_id, gmail_thread_id);
create index if not exists idx_connector_accounts_email
  on connector_accounts(external_email) where external_email is not null;
create index if not exists idx_gmail_watches_connector
  on gmail_watches(connector_id, created_at desc);
