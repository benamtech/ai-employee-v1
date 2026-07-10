-- AMTECH AI Employee MVP — Phase 4 source-wired materialization layer
--
-- Additive manager-only tables for capability/materialization state. The owner
-- browser reads these through Manager snapshots/resources only; direct Data API
-- access stays denied by RLS with no public policies.

create table if not exists capability_graph_nodes (
  id                 text primary key, -- cap_…
  account_id          text not null references accounts(id) on delete cascade,
  employee_id         text references employees(id) on delete cascade,
  capability_key      text not null,
  category            text not null,
  label               text not null,
  summary             text not null,
  status              text not null,
  setup_requirement   text,
  trust_level         text not null,
  can_run_now         boolean not null default false,
  sources             text[] not null default '{}',
  proof               jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (account_id, employee_id, capability_key)
);

create table if not exists surface_envelopes (
  id            text primary key, -- senv_…
  account_id    text not null references accounts(id) on delete cascade,
  employee_id   text references employees(id) on delete cascade,
  kind          text not null,
  title         text not null,
  summary       text,
  status        text,
  render_hints  jsonb not null default '{}'::jsonb,
  safety        jsonb not null default '{}'::jsonb,
  proof         jsonb not null default '{}'::jsonb,
  source_table  text,
  source_id     text,
  created_at    timestamptz not null default now()
);

create table if not exists work_resources (
  id            text primary key, -- wres_…
  account_id    text not null references accounts(id) on delete cascade,
  employee_id   text references employees(id) on delete cascade,
  resource_type text not null,
  resource_id   text not null,
  title         text not null,
  summary       text,
  body_kind     text,
  payload_safe  jsonb not null default '{}'::jsonb,
  proof         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (account_id, employee_id, resource_type, resource_id)
);

create table if not exists work_actions (
  id            text primary key, -- wact_…
  account_id    text not null references accounts(id) on delete cascade,
  employee_id   text references employees(id) on delete cascade,
  resource_type text not null,
  resource_id   text not null,
  action        text not null,
  label         text not null,
  style         text,
  gated         boolean not null default false,
  proof         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists surface_delivery_receipts (
  id                  text primary key, -- srcpt_…
  account_id           text not null references accounts(id) on delete cascade,
  employee_id          text references employees(id) on delete cascade,
  surface_envelope_id  text references surface_envelopes(id) on delete set null,
  surface              text not null, -- web | sms | voice | admin
  delivered_at         timestamptz not null default now(),
  delivery_status      text not null default 'delivered',
  proof                jsonb not null default '{}'::jsonb
);

create index if not exists capability_graph_nodes_employee_idx on capability_graph_nodes(employee_id, status);
create index if not exists surface_envelopes_employee_created_idx on surface_envelopes(employee_id, created_at, id);
create index if not exists work_resources_employee_resource_idx on work_resources(employee_id, resource_type, resource_id);
create index if not exists work_actions_resource_idx on work_actions(employee_id, resource_type, resource_id);
create index if not exists surface_delivery_receipts_envelope_idx on surface_delivery_receipts(surface_envelope_id);

alter table capability_graph_nodes enable row level security;
alter table surface_envelopes enable row level security;
alter table work_resources enable row level security;
alter table work_actions enable row level security;
alter table surface_delivery_receipts enable row level security;

-- Secret-reference-bearing connector tables must not be directly selectable by
-- browser/owner Data API roles. Manager service-role reads and redacts them into
-- safe snapshots instead.
drop policy if exists connector_accounts_sel on connector_accounts;
drop policy if exists stripe_connections_sel on stripe_connections;
alter table connector_accounts enable row level security;
alter table stripe_connections enable row level security;
alter table runtime_endpoint_secrets enable row level security;

-- Atomic counters for signed artifact/preview links. Revoke PUBLIC execute
-- before granting only service_role, because SECURITY DEFINER functions in public
-- otherwise become callable by anon/authenticated via default grants.
create or replace function increment_artifact_link_access_count(p_link_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update artifact_links
     set access_count = access_count + 1
   where id = p_link_id
   returning access_count into v_count;
  return v_count;
end;
$$;

revoke all on function increment_artifact_link_access_count(text) from public;
revoke all on function increment_artifact_link_access_count(text) from anon;
revoke all on function increment_artifact_link_access_count(text) from authenticated;
grant execute on function increment_artifact_link_access_count(text) to service_role;

create or replace function increment_preview_link_access_count(p_link_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update preview_links
     set access_count = access_count + 1
   where id = p_link_id
   returning access_count into v_count;
  return v_count;
end;
$$;

revoke all on function increment_preview_link_access_count(text) from public;
revoke all on function increment_preview_link_access_count(text) from anon;
revoke all on function increment_preview_link_access_count(text) from authenticated;
grant execute on function increment_preview_link_access_count(text) to service_role;
