-- Forward-only compatibility columns required by the S5 binding backfill.
-- Historical connector tables did not consistently carry updated_at/created_at.

begin;

alter table connector_accounts
  add column if not exists updated_at timestamptz not null default now();

alter table stripe_connections
  add column if not exists updated_at timestamptz not null default now();

alter table verified_phones
  add column if not exists created_at timestamptz not null default now();

commit;
