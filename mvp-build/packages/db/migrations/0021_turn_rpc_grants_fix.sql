-- 0020 revoked EXECUTE from anon/authenticated, but Postgres grants EXECUTE to
-- PUBLIC by default and those roles inherit it via PUBLIC — so anon could still call
-- the turn-queue RPCs. Revoke from PUBLIC (the real default grant) and grant EXECUTE
-- explicitly to service_role, which is how the Manager (serviceClient, SERVICE_ROLE_KEY)
-- invokes them. The function owner retains access regardless.

revoke execute on function public.claim_employee_turn_job(text, integer) from public, anon, authenticated;
revoke execute on function public.claim_employee_turn_job_for_employee(text, text, integer) from public, anon, authenticated;
revoke execute on function public.complete_employee_turn_job(text, text, text, jsonb, text) from public, anon, authenticated;

grant execute on function public.claim_employee_turn_job(text, integer) to service_role;
grant execute on function public.claim_employee_turn_job_for_employee(text, text, integer) to service_role;
grant execute on function public.complete_employee_turn_job(text, text, text, jsonb, text) to service_role;
