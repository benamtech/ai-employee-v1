-- S7: signed approval resolution and terminal preview consumption are one
-- transaction. The HTTP route may repeat the consumed_at update as an idempotent
-- compatibility write, but the approval cannot commit without this trigger.

begin;

create or replace function amtech_consume_preview_link_on_approval_resolution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link preview_links%rowtype;
  v_match_count integer;
begin
  if old.status <> 'pending'
     or new.status not in ('approved','rejected')
     or new.resolution_channel <> 'sms' then
    return new;
  end if;

  select count(*) into v_match_count
    from preview_links pl
   where pl.resource_type = 'approval'
     and pl.resource_id = new.id
     and pl.assignment_id = new.assignment_id
     and pl.resolver_principal_id = new.resolved_by_principal_id
     and pl.policy_version = new.policy_version
     and pl.approval_snapshot_hash = new.snapshot_hash
     and pl.revoked_at is null
     and pl.consumed_at is null
     and (pl.expires_at is null or pl.expires_at > now());

  if v_match_count = 0 then
    raise exception 'approval_preview_link_missing_or_consumed';
  elsif v_match_count > 1 then
    raise exception 'approval_preview_link_ambiguous';
  end if;

  select * into v_link
    from preview_links pl
   where pl.resource_type = 'approval'
     and pl.resource_id = new.id
     and pl.assignment_id = new.assignment_id
     and pl.resolver_principal_id = new.resolved_by_principal_id
     and pl.policy_version = new.policy_version
     and pl.approval_snapshot_hash = new.snapshot_hash
     and pl.revoked_at is null
     and pl.consumed_at is null
     and (pl.expires_at is null or pl.expires_at > now())
   for update;

  update preview_links
     set consumed_at = now()
   where id = v_link.id
     and consumed_at is null;
  if not found then raise exception 'approval_preview_link_consume_race'; end if;
  return new;
end
$$;

drop trigger if exists approval_preview_link_atomic_consume on approvals;
create trigger approval_preview_link_atomic_consume
after update of status, resolution, resolved_by_principal_id, resolution_channel on approvals
for each row execute function amtech_consume_preview_link_on_approval_resolution();

revoke all on function amtech_consume_preview_link_on_approval_resolution() from public, anon, authenticated;

commit;
