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

commit;
