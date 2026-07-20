-- Forward-only completion of the S5 binding row. Account and employee remain
-- compatibility/projection dimensions; assignment_id remains the authority.

begin;

alter table connector_bindings
  add column if not exists account_id text references accounts(id) on delete restrict,
  add column if not exists employee_id text references employees(id) on delete restrict;

update connector_bindings cb
   set account_id = ea.account_id,
       employee_id = ep.employee_id
  from employee_assignments ea
  join employee_principals ep on ep.id = ea.employee_principal_id
 where cb.assignment_id = ea.id
   and (cb.account_id is null or cb.employee_id is null);

alter table connector_bindings
  alter column account_id set not null,
  alter column employee_id set not null;

create index if not exists connector_bindings_employee_scope_idx
  on connector_bindings(assignment_id, account_id, employee_id, provider, status);

create or replace function attest_ambient_connector_custody(
  p_inbox_id text,
  p_assignment_id text,
  p_connector_binding_id text,
  p_command_intent_id text,
  p_command_id text,
  p_provider_verification_ref text,
  p_payload_hash text,
  p_resource_class text,
  p_resource_id text
)
returns setof ambient_event_inbox
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_inbox ambient_event_inbox%rowtype;
  v_binding connector_bindings%rowtype;
begin
  select * into v_inbox
    from ambient_event_inbox
   where inbox_id = p_inbox_id
   for update;

  if v_inbox.inbox_id is null then
    raise exception 'ambient_event_not_found: %', p_inbox_id;
  end if;
  if v_inbox.verified_at is null
     or coalesce(p_provider_verification_ref, '') = ''
     or coalesce(p_payload_hash, '') !~ '^sha256:[0-9a-f]{64}$' then
    raise exception 'provider_verification_required';
  end if;

  select * into v_binding
    from connector_bindings
   where id = p_connector_binding_id
   for share;

  if v_binding.id is null
     or v_binding.assignment_id <> p_assignment_id
     or v_binding.provider <> v_inbox.provider
     or v_binding.resource_class <> p_resource_class
     or v_binding.resource_id is distinct from p_resource_id
     or v_binding.status <> 'active'
     or v_binding.revoked_at is not null
     or (v_binding.expires_at is not null and v_binding.expires_at <= now()) then
    raise exception 'connector_binding_scope_mismatch';
  end if;

  if not exists (
    select 1 from command_intents ci
     where ci.id = p_command_intent_id
       and ci.assignment_id = p_assignment_id
       and ci.command_id = p_command_id
  ) or not exists (
    select 1 from durable_commands dc
     where dc.id = p_command_id
       and dc.intent_id = p_command_intent_id
       and dc.assignment_id = p_assignment_id
  ) then
    raise exception 'connector_command_scope_mismatch';
  end if;

  update ambient_event_inbox
     set assignment_id = p_assignment_id,
         connector_binding_id = p_connector_binding_id,
         command_intent_id = p_command_intent_id,
         command_id = p_command_id,
         provider_verification_ref = p_provider_verification_ref,
         payload_hash = p_payload_hash,
         resource_class = p_resource_class,
         resource_id = p_resource_id,
         account_id = v_binding.account_id,
         employee_id = v_binding.employee_id,
         authorization_state = 'authorized'
   where inbox_id = p_inbox_id
     and authorization_state in ('waiting_for_binding','authorized')
     and (assignment_id is null or assignment_id = p_assignment_id)
     and (connector_binding_id is null or connector_binding_id = p_connector_binding_id)
  returning * into v_inbox;

  if v_inbox.inbox_id is null then
    raise exception 'connector_custody_conflict';
  end if;
  return next v_inbox;
end
$$;

commit;
