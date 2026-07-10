-- AMTECH AI Employee MVP — Phase 3: signed mobile preview/action links
--
-- Additive only. A `preview_links` row backs every signed SMS link: it maps a
-- server-validated token to (account, employee, resource_type, resource_id, allowed
-- actions, expiry). Generalizes what `artifact_links` does for stored PDFs to ANY
-- owner-inspectable resource (approval, artifact, work_event, task, connector, job).
--
-- Manager-only control-plane table: reached by signed token (server-validated), not
-- by the anon/owner Data API. RLS enabled with NO select policy (the artifact_links
-- convention) so only the service-role Manager client can read raw rows. Never grant
-- browser select on this table.

create table if not exists preview_links (
  id            text primary key,               -- prev_…
  account_id    text not null references accounts(id) on delete cascade,
  employee_id   text not null references employees(id) on delete cascade,
  resource_type text not null,                  -- approval | artifact | work_event | task | connector | job
  resource_id   text not null,                  -- id of the underlying resource
  token_hash    text not null,                  -- HMAC of signed token (never the raw)
  actions       text[] not null default '{}',   -- scoped owner actions (approve|reject|respond|…)
  audience      text not null default 'owner',
  expires_at    timestamptz,
  revoked_at    timestamptz,
  consumed_at   timestamptz,                     -- single-use guard for state-changing actions
  access_count  integer not null default 0,
  run_id        text,                            -- metering correlation (additive, nullable)
  created_at    timestamptz not null default now()
);

create unique index if not exists idx_preview_links_token_hash on preview_links(token_hash);
create index if not exists idx_preview_links_resource on preview_links(employee_id, resource_type, resource_id);

alter table preview_links enable row level security;
