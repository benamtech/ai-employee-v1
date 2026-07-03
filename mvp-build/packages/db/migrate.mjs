#!/usr/bin/env node
/**
 * CLI-agnostic migration runner. Applies packages/db/migrations/*.sql in order
 * against DATABASE_URL, tracking applied files in a _migrations table.
 *
 * Usage:
 *   node packages/db/migrate.mjs            # apply pending migrations
 *   node packages/db/migrate.mjs --status   # list applied/pending
 *
 * (Alternatively, apply the same .sql files via the Supabase CLI or the
 *  Supabase MCP apply_migration tool — they are plain Postgres SQL.)
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}

let pg;
try {
  pg = await import("pg");
} catch {
  console.error("Missing dependency 'pg'. Run `npm install` first.");
  process.exit(1);
}

const statusOnly = process.argv.includes("--status");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.default.Client({ connectionString: DATABASE_URL });
await client.connect();

await client.query(`
  create table if not exists _migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );
`);

const applied = new Set(
  (await client.query("select name from _migrations")).rows.map((r) => r.name),
);

if (statusOnly) {
  for (const f of files) console.log(`${applied.has(f) ? "✓ applied " : "· pending "} ${f}`);
  await client.end();
  process.exit(0);
}

let count = 0;
for (const f of files) {
  if (applied.has(f)) continue;
  const sql = readFileSync(join(migrationsDir, f), "utf8");
  process.stdout.write(`Applying ${f} … `);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into _migrations(name) values($1)", [f]);
    await client.query("commit");
    console.log("ok");
    count++;
  } catch (err) {
    await client.query("rollback");
    console.error("FAILED\n", err.message);
    await client.end();
    process.exit(1);
  }
}

console.log(count === 0 ? "Already up to date." : `Applied ${count} migration(s).`);
await client.end();
