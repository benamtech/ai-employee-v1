-- AMTECH AI Employee MVP — close the RLS gap on control-plane tables.
--
-- Supabase exposes every table in `public` through the Data API (PostgREST) to the
-- `anon`/`authenticated` roles unless RLS is enabled. Migrations 0002/0003/0007-0017
-- enabled RLS on the owner-facing and control-plane tables that were added over time,
-- but ~21 tables from the earlier schema were never protected. With RLS off (and the
-- default public grants intact), anyone holding the public SUPABASE_ANON_KEY could read
-- them cross-tenant via `GET /rest/v1/<table>` — including PII (users, phones, chat
-- transcripts) and customer email bodies.
--
-- Fix: enable RLS with NO select policy (Manager-only — the established convention, see
-- artifact_links in 0002 and the six metering ledgers in 0013). The Manager service-role
-- client bypasses RLS and keeps full access; the browser never uses the anon client
-- directly (all reads go through Manager), so nothing owner-facing breaks.
--
-- Additive and idempotent: `enable row level security` is a no-op if already enabled.

do $$
declare
  t text;
  manager_only text[] := array[
    'users',
    'account_memberships',
    'onboarding_sessions',
    'claim_tokens',
    'phone_verification_attempts',
    'email_threads',
    'outbound_emails',
    'inbound_email_events',
    'inbound_events',
    'gmail_watches',
    'number_pool',
    'audit_log',
    'stripe_customers',
    'stripe_account_links',
    'stripe_webhook_events',
    'usage_events',
    'feature_checks',
    'entitlement_policies',
    'hermes_job_runs',
    'event_repair_queue',
    'event_source_suppressions'
  ];
begin
  foreach t in array manager_only loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table %I enable row level security;', t);
    end if;
  end loop;
end $$;
