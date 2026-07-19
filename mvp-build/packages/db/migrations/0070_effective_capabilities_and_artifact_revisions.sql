begin;

-- Thin artifact history/evidence layer. `artifacts` remains the canonical identity
-- and current-head projection; these rows add immutable revisions and validation
-- evidence without introducing another workflow engine.
create table if not exists artifact_revisions (
  id text primary key,
  artifact_id text not null references artifacts(id) on delete cascade,
  assignment_id text not null references employee_assignments(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  employee_id text not null references employees(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  parent_revision_id text references artifact_revisions(id),
  payload jsonb not null default '{}'::jsonb,
  mime_type text,
  storage_ref text,
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  source_manifest jsonb not null default '{}'::jsonb,
  created_run text,
  created_by text not null default 'employee',
  created_at timestamptz not null default now(),
  unique (artifact_id, revision_number)
);

create table if not exists artifact_validations (
  id text primary key,
  artifact_id text not null references artifacts(id) on delete cascade,
  revision_id text not null references artifact_revisions(id) on delete cascade,
  assignment_id text not null references employee_assignments(id) on delete cascade,
  validator_key text not null,
  status text not null check (status in ('passed','failed','warning','skipped')),
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table artifacts add column if not exists current_revision_id text references artifact_revisions(id);
alter table artifacts add column if not exists validation_status text not null default 'unvalidated'
  check (validation_status in ('unvalidated','passed','failed','warning'));
alter table artifacts add column if not exists publication_state text not null default 'draft'
  check (publication_state in ('draft','approved','published','verified','failed','rolled_back'));
alter table artifacts add column if not exists publication_ref text;
alter table artifacts add column if not exists published_at timestamptz;
alter table artifacts add column if not exists updated_at timestamptz not null default now();

insert into artifact_revisions(
  id, artifact_id, assignment_id, account_id, employee_id, revision_number,
  payload, mime_type, storage_ref, content_sha256, source_manifest, created_run,
  created_by, created_at
)
select
  'arv_' || substr(md5(a.id || ':1'), 1, 26),
  a.id,
  a.assignment_id,
  a.account_id,
  a.employee_id,
  1,
  coalesce(a.payload, '{}'::jsonb),
  a.mime_type,
  a.storage_ref,
  encode(digest(convert_to(coalesce(a.payload, '{}'::jsonb)::text, 'UTF8'), 'sha256'), 'hex'),
  '{}'::jsonb,
  a.created_run,
  'migration_backfill',
  a.created_at
from artifacts a
where a.assignment_id is not null
on conflict (artifact_id, revision_number) do nothing;

update artifacts a
set current_revision_id = r.id,
    updated_at = greatest(a.created_at, now())
from artifact_revisions r
where r.artifact_id = a.id
  and r.revision_number = 1
  and a.current_revision_id is null;

create index if not exists artifact_revisions_artifact_created_idx
  on artifact_revisions(artifact_id, revision_number desc);
create index if not exists artifact_validations_revision_created_idx
  on artifact_validations(revision_id, created_at desc);

-- Effective capability truth is an evidence report, not a projection of profile
-- YAML or host environment-key presence. One report records every dimension used
-- to decide whether a capability is actually usable by one assignment.
create table if not exists effective_capability_evidence (
  id text primary key,
  report_id text not null,
  assignment_id text not null references employee_assignments(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  employee_id text not null references employees(id) on delete cascade,
  capability_key text not null,
  advertised boolean not null default false,
  runtime_reported boolean not null default false,
  dependency_ready boolean not null default false,
  credential_ready boolean not null default false,
  network_ready boolean not null default false,
  policy_ready boolean not null default false,
  connector_ready boolean not null default true,
  live_probe_status text not null check (live_probe_status in ('passed','failed','skipped','unknown')),
  effective boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  unique (report_id, capability_key)
);

create index if not exists effective_capability_employee_checked_idx
  on effective_capability_evidence(employee_id, checked_at desc);
create index if not exists effective_capability_assignment_checked_idx
  on effective_capability_evidence(assignment_id, checked_at desc);

-- Extend the existing explicit assignment grant; membership alone still creates no
-- authority. These actions authorize owner initiation/read/revision only through
-- an already-current assignment principal.
create or replace function amtech_owner_employee_surface_actions()
returns text[]
language sql
immutable
parallel safe
as $$
  select array[
    'read',
    'message:create',
    'stream:read',
    'materialize',
    'heartbeat',
    'turn:create',
    'connector:connect',
    'capabilities:read',
    'artifact:revise',
    'artifact:validate',
    'artifact:publish'
  ]::text[]
$$;

update assignment_principals
   set policy_version = policy_version
 where principal_class = 'human'
   and role in ('owner','manager','operator','viewer');

alter table artifact_revisions enable row level security;
alter table artifact_validations enable row level security;
alter table effective_capability_evidence enable row level security;
revoke all on artifact_revisions, artifact_validations, effective_capability_evidence from anon, authenticated;
grant select, insert, update, delete on artifact_revisions, artifact_validations, effective_capability_evidence to service_role;

commit;
