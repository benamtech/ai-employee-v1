#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireEnv, run, writeProof, assert } from "./production-proof-lib.mjs";

const migrationHead = "0072";
const migrationStart = "0032";
const migrationsDir = "packages/db/migrations";

requireEnv("STAGING_DATABASE_URL");
const databaseEnv = { DATABASE_URL: process.env.STAGING_DATABASE_URL };
const result = run("node", ["infra/scripts/acceptance/verify-worker-migrations.mjs", "--apply"], {
  env: databaseEnv,
  timeout: 180_000,
});
assert(result.output.includes("worker_migrations_verified"), "migration_verifier_missing_success_marker");

const files = (await readdir(migrationsDir))
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .sort()
  .filter((file) => file.slice(0, 4) >= migrationStart && file.slice(0, 4) <= migrationHead);
assert(files.length > 0, "migration_proof_range_empty", { migrationStart, migrationHead });
assert(files[0].startsWith(`${migrationStart}_`), "migration_proof_start_missing", { first: files[0] });
assert(files.at(-1)?.startsWith(`${migrationHead}_`), "migration_proof_head_missing", { last: files.at(-1) });

const status = run("node", ["packages/db/migrate.mjs", "--status"], {
  env: databaseEnv,
  timeout: 60_000,
});
for (const file of files) {
  assert(status.output.includes(`✓ applied  ${file}`), "migration_not_applied_on_staging", { file });
}

const migrations = [];
for (const file of files) {
  const path = join(migrationsDir, file);
  const content = await readFile(path, "utf8");
  migrations.push({ file: path, sha256: createHash("sha256").update(content).digest("hex") });
}

await writeProof("migration-staging", "passed", {
  database_ref: process.env.STAGING_SUPABASE_PROJECT_REF ?? "database-url-only",
  migration_start: migrationStart,
  migration_head: migrationHead,
  migration_count: migrations.length,
  migrations,
  verifier_tail: result.output.split("\n").slice(-20),
  status_tail: status.output.split("\n").slice(-40),
  production_mutated: false,
});
