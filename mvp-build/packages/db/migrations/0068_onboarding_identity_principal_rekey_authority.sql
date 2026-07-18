begin;

-- Principal identifiers are normally immutable. Data repair and legacy fixture
-- adoption can rekey a principal before dependent relationships exist; keep the
-- sole durable authority ledger synchronized instead of leaving a principal
-- with no current authority version.
create or replace function amtech_rekey_human_principal_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old authority_versions%rowtype;
begin
  if old.id is not distinct from new.id then
    return new;
  end if;

  select * into v_old
  from authority_versions av
  where av.scope_type = 'human_principal'
    and av.scope_id = old.id
  for update;

  insert into authority_versions(
    scope_type,
    scope_id,
    current_version,
    revoked_at,
    reason,
    updated_at
  ) values (
    'human_principal',
    new.id,
    greatest(1, coalesce(v_old.current_version, new.session_version, 1))::bigint,
    case
      when new.status not in ('active','current') or new.credentials_revoked_at is not null
        then coalesce(new.credentials_revoked_at, v_old.revoked_at, now())
      else v_old.revoked_at
    end,
    'rekey:human_principal',
    now()
  )
  on conflict (scope_type, scope_id) do update set
    current_version = greatest(authority_versions.current_version, excluded.current_version),
    revoked_at = excluded.revoked_at,
    reason = excluded.reason,
    updated_at = excluded.updated_at;

  delete from authority_versions av
  where av.scope_type = 'human_principal'
    and av.scope_id = old.id
    and old.id <> new.id;

  return new;
end
$$;

drop trigger if exists human_principal_authority_rekey on human_principals;
create trigger human_principal_authority_rekey
  after update of id on human_principals
  for each row
  when (old.id is distinct from new.id)
  execute function amtech_rekey_human_principal_authority();

commit;
