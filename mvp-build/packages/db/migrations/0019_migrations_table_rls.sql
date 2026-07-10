-- Lock down the migration runner's own bookkeeping table. `_migrations` is created
-- by packages/db/migrate.mjs and was the last public table without RLS, so the anon
-- Data API could read the list of applied migration filenames (schema-evolution
-- disclosure). Enable RLS with no policy: the migrate runner connects as the table
-- owner (which bypasses RLS), so status/apply keep working; PostgREST/anon is denied.

do $$
begin
  if to_regclass('public._migrations') is not null then
    execute 'alter table public._migrations enable row level security';
  end if;
end $$;
