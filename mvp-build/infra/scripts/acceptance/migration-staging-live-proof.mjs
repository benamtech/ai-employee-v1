#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { requireEnv, run, writeProof, assert } from "./production-proof-lib.mjs";

requireEnv("STAGING_DATABASE_URL");
const result = run("node", ["infra/scripts/acceptance/verify-worker-migrations.mjs", "--apply"], {
  env: { DATABASE_URL: process.env.STAGING_DATABASE_URL },
  timeout: 180_000,
});
assert(result.output.includes("worker_migrations_verified"), "migration_verifier_missing_success_marker");

const migrations = [];
for (let number = 32; number <= 38; number += 1) {
  const prefix = `00${number}`.slice(-4);
  const files = run("bash", ["-lc", `ls packages/db/migrations/${prefix}_*.sql`]).output.split("\n").filter(Boolean);
  assert(files.length === 1, "migration_file_not_unique", { prefix, files });
  const content = await readFile(files[0], "utf8");
  migrations.push({ file: files[0], sha256: createHash("sha256").update(content).digest("hex") });
}

await writeProof("migration-staging", "passed", {
  database_ref: process.env.STAGING_SUPABASE_PROJECT_REF ?? "database-url-only",
  migrations,
  verifier_tail: result.output.split("\n").slice(-20),
  production_mutated: false,
});
