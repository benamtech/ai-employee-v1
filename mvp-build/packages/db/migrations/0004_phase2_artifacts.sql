-- ============================================================================
-- AMTECH AI Employee MVP — Phase 2 artifacts, approvals, and storage hardening
-- ============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'artifacts',
  'artifacts',
  false,
  10485760,
  array['application/pdf']
) on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create unique index if not exists idx_artifact_links_token_hash on artifact_links(token_hash);
create index if not exists idx_artifacts_employee_created on artifacts(employee_id, created_at desc);
create index if not exists idx_artifacts_storage_ref on artifacts(storage_ref) where storage_ref is not null;
create index if not exists idx_approvals_employee_pending on approvals(employee_id, created_at desc) where resolution is null;
create index if not exists idx_outbound_emails_connector_created on outbound_emails(connector_id, created_at desc);

-- `amtech_account_ids()` is used by RLS policies; keep it callable by real
-- authenticated owners, but do not leave the SECURITY DEFINER function callable
-- by anon/PUBLIC.
revoke all on function amtech_account_ids() from public;
revoke all on function amtech_account_ids() from anon;
grant execute on function amtech_account_ids() to authenticated;
