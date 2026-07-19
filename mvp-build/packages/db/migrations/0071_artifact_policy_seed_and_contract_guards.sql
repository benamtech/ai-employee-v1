begin;

-- Keep the artifact publish policy aligned with the assignment lifecycle. This is
-- the same assignment policy table consumed by immutable approval execution; it
-- is not a second authorization mechanism.
create or replace function amtech_sync_artifact_publish_policy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into assignment_authority_policies(
    id,
    assignment_id,
    policy_version,
    action,
    required_roles,
    risk_class,
    step_up_required,
    status,
    created_at
  ) values (
    'apol_' || substr(md5(new.id || ':publish_artifact_sandbox'), 1, 27),
    new.id,
    new.policy_version,
    'publish_artifact_sandbox',
    array['owner','manager','approver']::text[],
    'medium',
    true,
    case
      when amtech_relationship_current(new.status, new.starts_at, new.ends_at) then 'active'
      else 'suspended'
    end,
    now()
  )
  on conflict (assignment_id, policy_version, action) do update set
    required_roles = excluded.required_roles,
    risk_class = excluded.risk_class,
    step_up_required = excluded.step_up_required,
    status = excluded.status;
  return new;
end;
$$;

revoke all on function amtech_sync_artifact_publish_policy() from public, anon, authenticated;
grant execute on function amtech_sync_artifact_publish_policy() to service_role;

drop trigger if exists employee_assignments_sync_artifact_publish_policy on employee_assignments;
create trigger employee_assignments_sync_artifact_publish_policy
after insert or update of policy_version, status, starts_at, ends_at
on employee_assignments
for each row execute function amtech_sync_artifact_publish_policy();

-- Re-run through the trigger contract for existing assignments, including ended or
-- suspended assignments whose policy row must fail closed rather than disappear.
update employee_assignments
   set policy_version = policy_version;

commit;
