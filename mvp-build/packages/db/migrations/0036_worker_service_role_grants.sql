begin;

-- Supabase is moving public-schema Data API exposure to explicit opt-in.
-- Manager uses the backend-only service-role client, so every control-plane table
-- introduced by the gateway/reconciler/inbox migrations must grant that role CRUD
-- access explicitly. Browser roles remain revoked and RLS remains enabled.
grant usage on schema public to service_role;

grant select, insert, update, delete on table
  model_gateway_credentials,
  model_gateway_request_audit,
  provisioning_resource_states,
  provisioning_commands,
  ambient_event_inbox,
  ambient_event_dead_letters,
  ambient_effect_receipts
  to service_role;

-- Existing source tables are also part of the worker transaction surface. These
-- grants are idempotent and keep new-project behavior independent of default ACLs.
grant select, insert, update, delete on table
  provisioning_jobs,
  employee_mcp_credentials,
  employees,
  employee_manifests,
  business_brain_facts,
  employee_profile_builds,
  profile_packages,
  runtime_endpoints,
  runtime_endpoint_secrets,
  employee_messages,
  verified_phones
  to service_role;

revoke all on table
  model_gateway_credentials,
  model_gateway_request_audit,
  provisioning_resource_states,
  provisioning_commands,
  ambient_event_inbox,
  ambient_event_dead_letters,
  ambient_effect_receipts
  from anon, authenticated;

-- SECURITY DEFINER worker claims are intentionally callable only by the backend
-- service role. PostgreSQL grants EXECUTE to PUBLIC by default, so preserve the
-- explicit revoke even when project default privileges are already hardened.
revoke execute on function claim_next_provisioning_job(text, integer) from public, anon, authenticated;
revoke execute on function claim_next_provisioning_command(text, integer) from public, anon, authenticated;
revoke execute on function claim_next_ambient_event(text, integer) from public, anon, authenticated;

grant execute on function claim_next_provisioning_job(text, integer) to service_role;
grant execute on function claim_next_provisioning_command(text, integer) to service_role;
grant execute on function claim_next_ambient_event(text, integer) to service_role;

commit;
