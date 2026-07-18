begin;

-- The reconciler enqueues welcome only after runtime, public routing, and provider
-- binding acceptance. Materialize an idempotent owner-facing web message in the
-- same transaction that marks the ambient event processed.
create or replace function materialize_processed_employee_welcome()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.event_type = 'employee.welcome.requested'
     and new.processing_state = 'processed'
     and old.processing_state is distinct from 'processed'
     and new.employee_id is not null then
    insert into employee_messages (
      id,
      employee_id,
      direction,
      source,
      channel,
      body,
      provider_id,
      status
    ) values (
      'msg_' || md5(new.inbox_id || ':employee-welcome'),
      new.employee_id,
      'to_owner',
      'ambient:' || new.inbox_id,
      'web',
      coalesce(
        nullif(new.payload ->> 'message', ''),
        'Your AI Employee is ready. Open the employee workspace to send the first real task.'
      ),
      new.inbox_id,
      'delivered'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ambient_employee_welcome_effect on ambient_event_inbox;
create trigger ambient_employee_welcome_effect
after update of processing_state on ambient_event_inbox
for each row execute function materialize_processed_employee_welcome();

-- A job may not become ready merely because the welcome event was enqueued. The
-- ambient worker must have processed it, which also proves the owner-facing effect
-- above exists. The retryable exception keeps the job leased/retried instead of
-- compensating while the inbox worker is still making progress.
create or replace function require_processed_welcome_before_ready()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  welcome_inbox_id text;
  welcome_state text;
begin
  if new.state = 'ready' and old.state = 'welcome_sent' then
    welcome_inbox_id := new.worker_context ->> 'welcome_event_inbox_id';
    if welcome_inbox_id is null then
      raise exception 'temporarily_welcome_effect_not_processed:missing_inbox_id';
    end if;

    select processing_state
      into welcome_state
      from ambient_event_inbox
     where inbox_id = welcome_inbox_id;

    if welcome_state is distinct from 'processed' then
      raise exception 'temporarily_welcome_effect_not_processed:%', coalesce(welcome_state, 'missing');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists provisioning_ready_requires_welcome on provisioning_jobs;
create trigger provisioning_ready_requires_welcome
before update of state on provisioning_jobs
for each row execute function require_processed_welcome_before_ready();

revoke all on function materialize_processed_employee_welcome() from public, anon, authenticated;
revoke all on function require_processed_welcome_before_ready() from public, anon, authenticated;

grant execute on function materialize_processed_employee_welcome() to service_role;
grant execute on function require_processed_welcome_before_ready() to service_role;

commit;
