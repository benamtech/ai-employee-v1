-- ============================================================================
-- Row Level Security — owner-facing tables (Phase 0)
-- Spec: 10-security-ops-observability.md ("Owner cannot access another
-- account's artifact"). The Manager uses the service role key and BYPASSES RLS
-- for backend control-plane work; RLS protects the web/anon-authenticated path.
--
-- Mapping: auth.uid() -> users.auth_user_id -> account_memberships.account_id.
-- ============================================================================

-- Set of account ids the current Supabase auth user belongs to.
create or replace function amtech_account_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select m.account_id
  from account_memberships m
  join users u on u.id = m.user_id
  where u.auth_user_id = auth.uid()
$$;

-- Enable RLS + an account-scoped read policy on owner-facing tables.
do $$
declare
  t text;
  owner_scoped text[] := array[
    'accounts','employees','employee_manifests','business_brain_facts',
    'runtime_endpoints','provisioning_jobs','artifacts','approvals',
    'connector_accounts','stripe_connections','stripe_invoices',
    'employee_messages','job_commitments','reminders','verified_phones',
    'notification_preferences'
  ];
begin
  foreach t in array owner_scoped loop
    execute format('alter table %I enable row level security;', t);
    -- accounts keys on id; everything else keys on account_id.
    if t = 'accounts' then
      execute format($p$
        create policy %1$s_sel on %1$I for select
        using (id in (select amtech_account_ids()));
      $p$, t);
    else
      execute format($p$
        create policy %1$s_sel on %1$I for select
        using (account_id in (select amtech_account_ids()));
      $p$, t);
    end if;
  end loop;
end $$;

-- artifact_links are reached by signed token (server-validated), not by the
-- anon client; keep RLS on with no anon select policy (service role only).
alter table artifact_links enable row level security;
