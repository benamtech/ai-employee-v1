begin;

create or replace function complete_onboarding_identity_verification(
  p_provider_event_row_id text,
  p_provider_event_id text,
  p_provider_event_type text,
  p_provider_business_id text,
  p_payload_hash text,
  p_result text,
  p_provider_status text
)
returns table (identity_id text, status text, duplicate boolean)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_identity onboarding_identities%rowtype;
  v_existing onboarding_identity_webhook_events%rowtype;
begin
  if p_result not in ('pending','verified','rejected','ignored') then
    raise exception 'invalid_identity_provider_result';
  end if;

  select e.* into v_existing
  from onboarding_identity_webhook_events as e
  where e.provider = 'middesk'
    and e.provider_event_id = p_provider_event_id;

  if v_existing.id is not null then
    return query select v_existing.onboarding_identity_id, v_existing.result, true;
    return;
  end if;

  select oi.* into v_identity
  from onboarding_identities as oi
  where oi.provider = 'middesk'
    and oi.provider_business_id = p_provider_business_id
  for update;

  if v_identity.id is null then
    raise exception 'identity_provider_business_not_found';
  end if;

  if p_result = 'verified' then
    update onboarding_identities as oi
       set status = 'verified',
           provider_status = p_provider_status,
           verified_at = now()
     where oi.id = v_identity.id
       and oi.status = 'pending'
    returning oi.* into v_identity;

    update onboarding_identity_attempts as oia
       set status = 'verified',
           provider_status = p_provider_status,
           completed_at = now()
     where oia.id = (
       select oia_latest.id
       from onboarding_identity_attempts as oia_latest
       where oia_latest.onboarding_identity_id = v_identity.id
         and oia_latest.status in ('requested','submitted')
       order by oia_latest.created_at desc
       limit 1
     );
  elsif p_result = 'rejected' then
    update onboarding_identities as oi
       set status = 'rejected',
           provider_status = p_provider_status
     where oi.id = v_identity.id
       and oi.status = 'pending'
    returning oi.* into v_identity;

    update onboarding_identity_attempts as oia
       set status = 'rejected',
           provider_status = p_provider_status,
           error_code = 'identity_rejected_permanent',
           completed_at = now()
     where oia.id = (
       select oia_latest.id
       from onboarding_identity_attempts as oia_latest
       where oia_latest.onboarding_identity_id = v_identity.id
         and oia_latest.status in ('requested','submitted')
       order by oia_latest.created_at desc
       limit 1
     );
  else
    update onboarding_identities as oi
       set provider_status = p_provider_status,
           updated_at = now()
     where oi.id = v_identity.id
    returning oi.* into v_identity;
  end if;

  insert into onboarding_identity_webhook_events(
    id,
    provider,
    provider_event_id,
    provider_event_type,
    provider_business_id,
    onboarding_identity_id,
    payload_hash,
    signature_verified_at,
    result
  ) values (
    p_provider_event_row_id,
    'middesk',
    p_provider_event_id,
    p_provider_event_type,
    p_provider_business_id,
    v_identity.id,
    p_payload_hash,
    now(),
    p_result
  );

  return query select v_identity.id, v_identity.status, false;
end
$$;

revoke all on function complete_onboarding_identity_verification(
  text,text,text,text,text,text,text
) from public, anon, authenticated;

grant execute on function complete_onboarding_identity_verification(
  text,text,text,text,text,text,text
) to service_role;

commit;
