-- ============================================================================
-- AMTECH WS-02/WS-06 — atomic conversational decision focus
--
-- A natural reply such as "yeah, send it" must resolve against exactly one work
-- object. Serialize focus per assignment-bound human principal, supersede the
-- prior focus, insert or replay the new focus, and attach it to the delivered SMS
-- in one transaction.
-- ============================================================================

begin;

-- Upgrade safety for any 0080 deployment that briefly ran the pre-atomic Manager
-- path. Expire dead focus first, then keep the newest live focus per owner and
-- supersede every older duplicate before adding the partial unique index.
update channel_decision_contexts cdc
   set status = 'expired',
       updated_at = now(),
       evidence = cdc.evidence || jsonb_build_object(
         'normalized_by_migration', '0082',
         'normalized_reason', 'expired_open_context',
         'normalized_at', now()
       )
 where cdc.channel = 'sms'
   and cdc.status = 'open'
   and cdc.expires_at <= now();

with ranked_open as (
  select cdc.id,
         row_number() over (
           partition by cdc.assignment_id, cdc.human_principal_id
           order by cdc.created_at desc, cdc.id desc
         ) as focus_rank
    from channel_decision_contexts cdc
   where cdc.channel = 'sms'
     and cdc.status = 'open'
), duplicates as (
  select id from ranked_open where focus_rank > 1
)
update channel_decision_contexts cdc
   set status = 'superseded',
       updated_at = now(),
       evidence = cdc.evidence || jsonb_build_object(
         'normalized_by_migration', '0082',
         'normalized_reason', 'duplicate_open_context',
         'normalized_at', now()
       )
  from duplicates d
 where cdc.id = d.id;

create unique index if not exists channel_decision_context_one_open_sms_idx
  on channel_decision_contexts(assignment_id, human_principal_id)
  where channel = 'sms' and status = 'open';

create or replace function amtech_open_sms_channel_decision_context(
  p_context_id text,
  p_assignment_id text,
  p_account_id text,
  p_employee_id text,
  p_external_subject text,
  p_human_principal_id text,
  p_approval_id text,
  p_prompt_message_id text,
  p_expires_at timestamptz,
  p_evidence jsonb default '{}'::jsonb
)
returns setof channel_decision_contexts
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_approval approvals%rowtype;
  v_prompt employee_messages%rowtype;
  v_context channel_decision_contexts%rowtype;
begin
  if coalesce(p_context_id, '') = ''
     or coalesce(p_assignment_id, '') = ''
     or coalesce(p_account_id, '') = ''
     or coalesce(p_employee_id, '') = ''
     or coalesce(p_human_principal_id, '') = ''
     or coalesce(p_approval_id, '') = ''
     or coalesce(p_prompt_message_id, '') = '' then
    raise exception 'sms_decision_context_identity_incomplete';
  end if;

  -- One owner/assignment SMS conversation can focus on only one pending decision
  -- at a time. The advisory lock closes the empty-set race before the partial
  -- unique index becomes relevant.
  perform pg_advisory_xact_lock(hashtextextended(
    p_assignment_id || ':' || p_human_principal_id || ':sms-decision-focus',
    0
  ));

  select a.*
    into v_approval
    from approvals a
   where a.id = p_approval_id
   for share;

  if v_approval.id is null
     or v_approval.assignment_id <> p_assignment_id
     or v_approval.account_id <> p_account_id
     or v_approval.employee_id <> p_employee_id then
    raise exception 'sms_decision_approval_scope_mismatch';
  end if;
  if v_approval.status <> 'pending' or v_approval.expires_at <= now() then
    raise exception 'sms_decision_approval_not_pending';
  end if;
  if p_expires_at is distinct from v_approval.expires_at then
    raise exception 'sms_decision_expiry_mismatch';
  end if;

  if not exists (
    select 1
      from assignment_principals ap
     where ap.assignment_id = p_assignment_id
       and ap.principal_class = 'human'
       and ap.principal_id = p_human_principal_id
       and ap.role = any(v_approval.required_resolver_roles)
       and ap.policy_version = v_approval.policy_version
       and amtech_relationship_current(ap.status, ap.starts_at, ap.ends_at)
  ) then
    raise exception 'sms_decision_resolver_not_current';
  end if;

  select em.*
    into v_prompt
    from employee_messages em
   where em.id = p_prompt_message_id
   for update;

  if v_prompt.id is null
     or v_prompt.direction <> 'to_owner'
     or v_prompt.channel <> 'sms'
     or v_prompt.assignment_id <> p_assignment_id
     or v_prompt.account_id <> p_account_id
     or v_prompt.employee_id <> p_employee_id then
    raise exception 'sms_decision_prompt_scope_mismatch';
  end if;

  update channel_decision_contexts cdc
     set status = 'superseded',
         updated_at = now(),
         evidence = cdc.evidence || jsonb_build_object(
           'superseded_by_prompt_message_id', p_prompt_message_id,
           'superseded_by_approval_id', p_approval_id,
           'superseded_at', now()
         )
   where cdc.assignment_id = p_assignment_id
     and cdc.channel = 'sms'
     and cdc.human_principal_id = p_human_principal_id
     and cdc.status = 'open'
     and not (
       cdc.prompt_message_id = p_prompt_message_id
       and cdc.approval_id = p_approval_id
     );

  insert into channel_decision_contexts (
    id,
    assignment_id,
    account_id,
    employee_id,
    channel,
    external_subject,
    human_principal_id,
    approval_id,
    prompt_message_id,
    status,
    expires_at,
    evidence,
    created_at,
    updated_at
  ) values (
    p_context_id,
    p_assignment_id,
    p_account_id,
    p_employee_id,
    'sms',
    nullif(p_external_subject, ''),
    p_human_principal_id,
    p_approval_id,
    p_prompt_message_id,
    'open',
    p_expires_at,
    coalesce(p_evidence, '{}'::jsonb),
    now(),
    now()
  )
  on conflict (prompt_message_id, approval_id) do update
     set external_subject = excluded.external_subject,
         expires_at = excluded.expires_at,
         evidence = channel_decision_contexts.evidence || excluded.evidence,
         updated_at = now()
  returning * into v_context;

  if v_context.id is null or v_context.status <> 'open' then
    raise exception 'sms_decision_context_not_open';
  end if;

  update employee_messages em
     set human_principal_id = p_human_principal_id,
         decision_context_id = v_context.id,
         decision_context = em.decision_context || jsonb_build_object(
           'approval_id', v_approval.id,
           'action_key', v_approval.action_key,
           'snapshot_hash', v_approval.snapshot_hash,
           'expires_at', v_approval.expires_at,
           'context_id', v_context.id
         )
   where em.id = p_prompt_message_id;

  return next v_context;
end
$$;

revoke all on function amtech_open_sms_channel_decision_context(text,text,text,text,text,text,text,text,timestamptz,jsonb)
  from public, anon, authenticated;
grant execute on function amtech_open_sms_channel_decision_context(text,text,text,text,text,text,text,text,timestamptz,jsonb)
  to service_role;

commit;
