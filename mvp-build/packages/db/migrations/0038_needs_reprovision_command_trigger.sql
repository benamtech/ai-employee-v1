begin;

-- Preserve the existing admin/product contract that marks an employee as needing
-- reprovision, but make the durable provisioning command the only host-effect
-- authority. The trigger fires only on false/null -> true transitions.
create or replace function enqueue_employee_reprovision_command()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  command_id text;
  operation_key text;
begin
  if new.needs_reprovision is true
     and old.needs_reprovision is distinct from true then
    command_id := 'pcmd_' || replace(gen_random_uuid()::text, '-', '');
    operation_key := 'needs-reprovision:' || new.account_id || ':' || new.id || ':' || command_id;

    insert into provisioning_commands (
      id,
      account_id,
      employee_id,
      command_type,
      idempotency_key,
      requested_by,
      status,
      payload
    ) values (
      command_id,
      new.account_id,
      new.id,
      'reprovision',
      operation_key,
      'employees.needs_reprovision',
      'requested',
      jsonb_build_object(
        'reason', 'employee_marked_needs_reprovision',
        'source', 'employees_update_trigger'
      )
    )
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists employee_needs_reprovision_command on employees;
create trigger employee_needs_reprovision_command
after update of needs_reprovision on employees
for each row execute function enqueue_employee_reprovision_command();

revoke all on function enqueue_employee_reprovision_command() from public, anon, authenticated;
grant execute on function enqueue_employee_reprovision_command() to service_role;

-- A provider can redeliver the same verified event because its acknowledgement was
-- lost or delayed. Preserve one inbox row while recording atomic redelivery evidence
-- so production acceptance can prove deduplication rather than infer it.
alter table ambient_event_inbox
  add column if not exists duplicate_count integer not null default 0,
  add column if not exists last_duplicate_at timestamptz;

create or replace function record_ambient_event_duplicate(
  p_source_type text,
  p_provider text,
  p_external_event_id text,
  p_dedupe_key text
)
returns table(inbox_id text, duplicate_count integer, last_duplicate_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  update ambient_event_inbox as inbox
     set duplicate_count = inbox.duplicate_count + 1,
         last_duplicate_at = now()
   where inbox.dedupe_key = p_dedupe_key
      or (
        inbox.source_type = p_source_type
        and inbox.provider = p_provider
        and inbox.external_event_id = p_external_event_id
      )
   returning inbox.inbox_id, inbox.duplicate_count, inbox.last_duplicate_at;
end;
$$;

revoke all on function record_ambient_event_duplicate(text, text, text, text) from public, anon, authenticated;
grant execute on function record_ambient_event_duplicate(text, text, text, text) to service_role;

commit;
