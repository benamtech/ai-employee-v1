-- Lock the turn-queue RPCs to the Manager service role only.
--
-- claim_employee_turn_job[_for_employee] and complete_employee_turn_job are
-- SECURITY DEFINER (they run as owner and bypass RLS so the queue can be claimed
-- atomically). PostgREST exposes every public function as an RPC, and these were
-- executable by anon/authenticated — so anyone holding the public SUPABASE_ANON_KEY
-- could POST /rest/v1/rpc/claim_employee_turn_job, claim a queued owner turn, and
-- read its input (the owner's message body), as well as starve the real worker.
--
-- The Manager calls these through the service-role client, which retains EXECUTE.
-- Revoke from anon/authenticated so the Data API can no longer reach them.

revoke execute on function public.claim_employee_turn_job(text, integer) from anon, authenticated;
revoke execute on function public.claim_employee_turn_job_for_employee(text, text, integer) from anon, authenticated;
revoke execute on function public.complete_employee_turn_job(text, text, text, jsonb, text) from anon, authenticated;
