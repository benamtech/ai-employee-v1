-- S6: the Model Gateway must persist an ambiguous provider outcome instead of
-- collapsing it into success or retryable failure when the provider may have
-- accepted work without returning a durable receipt.

begin;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
    from pg_constraint
   where conrelid = 'model_gateway_request_audit'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%status%rate_limited%provider_unavailable%'
   limit 1;
  if constraint_name is not null then
    execute format('alter table model_gateway_request_audit drop constraint %I', constraint_name);
  end if;
end
$$;

alter table model_gateway_request_audit
  add constraint model_gateway_request_audit_status_check
  check (status in ('ok','failed','rate_limited','provider_unavailable','unauthorized','ambiguous'));

commit;
