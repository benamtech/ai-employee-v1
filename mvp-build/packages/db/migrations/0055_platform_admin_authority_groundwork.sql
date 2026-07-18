-- ============================================================================
-- AMTECH Phase 2 — S8 platform admin/support authority groundwork only
--
-- This migration establishes durable principal/session/step-up/support-lease and
-- append-only audit primitives. It intentionally does not issue sessions, enable
-- admin routes, or convert legacy platform_user/header identity into authority.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

create table if not exists platform_principals (
  id text primary key,
  user_id text not null,
  status text not null default 'disabled'
    check (status in ('disabled','active','suspended','revoked')),
  session_version integer not null default 1 check (session_version > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists platform_principal_roles (
  id text primary key,
  principal_id text not null references platform_principals(id) on delete restrict,
  role text not null check (role in (
    'platform_owner','platform_operator','support_readonly','billing_operator','security_reviewer'
  )),
  status text not null default 'disabled'
    check (status in ('disabled','active','suspended','revoked')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(principal_id, role, starts_at),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists platform_admin_sessions (
  id text primary key,
  principal_id text not null references platform_principals(id) on delete restrict,
  audience text not null,
  session_version integer not null check (session_version > 0),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  authenticated_at timestamptz not null,
  step_up_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  check (expires_at > authenticated_at),
  check (step_up_at is null or step_up_at >= authenticated_at)
);

create index if not exists platform_admin_sessions_current_idx
  on platform_admin_sessions(principal_id, audience, expires_at)
  where revoked_at is null;

create table if not exists platform_support_leases (
  id text primary key,
  principal_id text not null references platform_principals(id) on delete restrict,
  account_id text not null references accounts(id) on delete restrict,
  employee_id text references employees(id) on delete restrict,
  assignment_id text references employee_assignments(id) on delete restrict,
  allowed_actions text[] not null check (cardinality(allowed_actions) > 0),
  reason text not null check (length(btrim(reason)) >= 8),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by_principal_id text references platform_principals(id) on delete restrict,
  revocation_reason text,
  approval_ref text,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create index if not exists platform_support_leases_scope_idx
  on platform_support_leases(principal_id, account_id, employee_id, assignment_id, expires_at)
  where revoked_at is null;

create table if not exists platform_admin_audit_chain (
  sequence_id bigint generated always as identity primary key,
  id text not null unique,
  principal_id text references platform_principals(id) on delete restrict,
  session_id text references platform_admin_sessions(id) on delete restrict,
  support_lease_id text references platform_support_leases(id) on delete restrict,
  audience text not null,
  action text not null,
  action_class text not null check (action_class in ('read','support_read','support_write','security_write','billing_write')),
  account_id text references accounts(id) on delete restrict,
  employee_id text references employees(id) on delete restrict,
  assignment_id text references employee_assignments(id) on delete restrict,
  result text not null check (result in ('allowed','denied','failed')),
  denial_reason text,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  previous_hash text,
  entry_hash text not null check (entry_hash ~ '^sha256:[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists platform_admin_audit_chain_entry_hash_unique
  on platform_admin_audit_chain(entry_hash);

create or replace function append_platform_admin_audit(
  p_id text,
  p_principal_id text,
  p_session_id text,
  p_support_lease_id text,
  p_audience text,
  p_action text,
  p_action_class text,
  p_account_id text,
  p_employee_id text,
  p_assignment_id text,
  p_result text,
  p_denial_reason text,
  p_reason text,
  p_evidence jsonb
)
returns platform_admin_audit_chain
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_previous_hash text;
  v_created_at timestamptz := clock_timestamp();
  v_entry_hash text;
  v_row platform_admin_audit_chain%rowtype;
begin
  -- Serialize the chain head even when the table is empty; locking only the last
  -- row cannot protect two concurrent first inserts.
  perform pg_advisory_xact_lock(hashtext('platform_admin_audit_chain'));

  select chain.entry_hash
    into v_previous_hash
    from platform_admin_audit_chain chain
   order by chain.sequence_id desc
   limit 1;

  v_entry_hash := 'sha256:' || encode(digest(convert_to(
    concat_ws(E'\u001f',
      coalesce(v_previous_hash, ''), p_id, coalesce(p_principal_id, ''),
      coalesce(p_session_id, ''), coalesce(p_support_lease_id, ''),
      p_audience, p_action, p_action_class, coalesce(p_account_id, ''),
      coalesce(p_employee_id, ''), coalesce(p_assignment_id, ''), p_result,
      coalesce(p_denial_reason, ''), coalesce(p_reason, ''),
      coalesce(p_evidence, '{}'::jsonb)::text, v_created_at::text
    ), 'utf8'), 'sha256'), 'hex');

  insert into platform_admin_audit_chain(
    id, principal_id, session_id, support_lease_id, audience, action,
    action_class, account_id, employee_id, assignment_id, result,
    denial_reason, reason, evidence, previous_hash, entry_hash, created_at
  ) values (
    p_id, p_principal_id, p_session_id, p_support_lease_id, p_audience, p_action,
    p_action_class, p_account_id, p_employee_id, p_assignment_id, p_result,
    p_denial_reason, p_reason, coalesce(p_evidence, '{}'::jsonb),
    v_previous_hash, v_entry_hash, v_created_at
  ) returning * into v_row;
  return v_row;
end;
$$;

create or replace function platform_admin_audit_append_only_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'platform_admin_audit_append_only';
end;
$$;

drop trigger if exists platform_admin_audit_append_only on platform_admin_audit_chain;
create trigger platform_admin_audit_append_only
before update or delete on platform_admin_audit_chain
for each row execute function platform_admin_audit_append_only_guard();

alter table platform_principals enable row level security;
alter table platform_principal_roles enable row level security;
alter table platform_admin_sessions enable row level security;
alter table platform_support_leases enable row level security;
alter table platform_admin_audit_chain enable row level security;

revoke all on platform_principals from anon, authenticated;
revoke all on platform_principal_roles from anon, authenticated;
revoke all on platform_admin_sessions from anon, authenticated;
revoke all on platform_support_leases from anon, authenticated;
revoke all on platform_admin_audit_chain from anon, authenticated;
-- Even the service role must append the audit chain through the serializing RPC.
revoke insert, update, delete on platform_admin_audit_chain from service_role;
revoke all on function append_platform_admin_audit(text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function append_platform_admin_audit(text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb)
  to service_role;

insert into assignment_scope_registry(
  key, surface_category, subject, lane_owner, scope_requirement,
  authorization_contract, customer_consequential, enabled,
  denied_authorizers, required_evidence, source_ref, notes
)
values (
  'platform:admin-support-groundwork',
  'admin_support_action',
  'platform admin and scoped support authority',
  'Lane 8',
  'approved_platform_context',
  'C2',
  true,
  false,
  array['mutable_header_identity','account_membership_only','bearer_possession_only','caller_selected_account_or_employee'],
  array['durable-platform-principal','audience-bound-versioned-session','recent-step-up','scoped-expiring-support-lease','append-only-audit-chain'],
  'packages/db/migrations/0055_platform_admin_authority_groundwork.sql',
  'Groundwork only. Registry entry remains disabled; no live admin route may claim S8 acceptance until durable issuance, route wiring, step-up, lease, and audit packets are proven.'
)
on conflict (key) do update set
  surface_category = excluded.surface_category,
  subject = excluded.subject,
  lane_owner = excluded.lane_owner,
  scope_requirement = excluded.scope_requirement,
  authorization_contract = excluded.authorization_contract,
  customer_consequential = excluded.customer_consequential,
  enabled = false,
  denied_authorizers = excluded.denied_authorizers,
  required_evidence = excluded.required_evidence,
  source_ref = excluded.source_ref,
  notes = excluded.notes,
  updated_at = now();

commit;
