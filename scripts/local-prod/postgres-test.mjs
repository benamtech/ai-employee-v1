#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, writeProof } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node scripts/local-prod/postgres-test.mjs\nRuns blank PostgreSQL 17 migrations and all repository integration tests using an already-present local image. External network is denied; only loopback PostgreSQL is allowed. It never pulls an image.");
  process.exit(0);
}

const image = process.env.LOCAL_PROD_POSTGRES_IMAGE ?? "postgres:17";
const inspect = spawnSync("docker", ["image", "inspect", image], { cwd: ROOT, encoding: "utf8" });
if (inspect.status !== 0) {
  console.error(`${image} is not present. Pull it explicitly before offline verification.`);
  process.exit(1);
}
const suffix = randomBytes(5).toString("hex");
const name = `amtech-local-prod-test-${suffix}`;
const port = String(55432 + Math.floor(Math.random() * 500));
const url = `postgresql://postgres:postgres@127.0.0.1:${port}/amtech_test`;
const offlineGuard = pathToFileURL(join(ROOT, "scripts", "local-prod", "offline-guard.mjs")).href;
const offlineNodeOptions = `${process.env.NODE_OPTIONS ?? ""} --import=${offlineGuard}`.trim();
const steps = [];
function run(label, command, args, env = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", stdio: "inherit", env: { ...process.env, ...env } });
  steps.push({ label, exit_code: result.status, status: result.status === 0 ? "pass" : "fail" });
  if (result.status !== 0) throw new Error(`${label} failed`);
}
try {
  run("postgres_start", "docker", ["run", "-d", "--rm", "--name", name, "-e", "POSTGRES_PASSWORD=postgres", "-e", "POSTGRES_DB=amtech_test", "-p", `127.0.0.1:${port}:5432`, image]);
  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    const check = spawnSync("docker", ["exec", name, "pg_isready", "-U", "postgres", "-d", "amtech_test"], { encoding: "utf8" });
    if (check.status === 0) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("postgres did not become ready");
  const bootstrap = `do $$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if; end $$; create schema if not exists auth; create table if not exists auth.users(id uuid primary key default gen_random_uuid(), email text); create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$; create or replace function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$; create or replace function auth.role() returns text language sql stable as $$ select current_user::text $$; create schema if not exists storage; create table if not exists storage.buckets(id text primary key,name text unique not null,owner uuid,public boolean default false,file_size_limit bigint,allowed_mime_types text[],created_at timestamptz default now(),updated_at timestamptz default now()); create table if not exists storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,owner uuid,metadata jsonb,created_at timestamptz default now(),updated_at timestamptz default now(),last_accessed_at timestamptz default now(),unique(bucket_id,name));`;
  run("postgres_bootstrap", "docker", ["exec", name, "psql", "-U", "postgres", "-d", "amtech_test", "-v", "ON_ERROR_STOP=1", "-c", bootstrap]);
  run("migrations", "npm", ["--prefix", "mvp-build", "run", "db:migrate"], {
    DATABASE_URL: url,
    STAGING_DATABASE_URL: url,
    NODE_OPTIONS: offlineNodeOptions,
    LOCAL_PROD_OFFLINE: "1",
    LOCAL_PROD_ALLOW_LOOPBACK: "1",
  });
  run("integration_tests", "npm", ["--prefix", "mvp-build", "run", "test:integration"], {
    DATABASE_URL: url,
    STAGING_DATABASE_URL: url,
    NODE_OPTIONS: offlineNodeOptions,
    LOCAL_PROD_OFFLINE: "1",
    LOCAL_PROD_ALLOW_LOOPBACK: "1",
  });
  const { latest } = writeProof("postgres-tests", { status: "pass", image, network_policy: "loopback_only", steps });
  console.log(`proof_json:${latest}`);
} catch (error) {
  writeProof("postgres-tests", { status: "fail", image, network_policy: "loopback_only", steps, error: String(error?.message ?? error) });
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  spawnSync("docker", ["rm", "-f", name], { cwd: ROOT, stdio: "ignore" });
}
