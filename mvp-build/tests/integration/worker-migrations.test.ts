import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("worker migrations 0032-0038", () => {
  it("apply cleanly and satisfy lease, grant, welcome, and reprovision behavior in an isolated ledger", async () => {
    const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.replace(/[^a-z0-9_]/g, "");
    const databaseName = `amtech_worker_${suffix}`;
    const admin = new Client({ connectionString: databaseUrl });
    const isolated = new URL(databaseUrl!);
    isolated.pathname = `/${databaseName}`;
    let isolatedClient: Client | undefined;
    await admin.connect();
    try {
      await admin.query(`create database "${databaseName}"`);
      isolatedClient = new Client({ connectionString: isolated.toString() });
      await isolatedClient.connect();
      await isolatedClient.query(readFileSync("infra/scripts/ci/supabase-postgres-bootstrap.sql", "utf8"));
      await isolatedClient.end();
      isolatedClient = undefined;

      const result = spawnSync("node", ["infra/scripts/acceptance/verify-worker-migrations.mjs", "--apply"], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: isolated.toString(), STAGING_DATABASE_URL: isolated.toString() },
        timeout: 120_000,
      });
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
      expect(output, "migration verifier output").toContain("worker_migrations_verified");
      expect(result.status, output).toBe(0);
    } finally {
      await isolatedClient?.end().catch(() => {});
      await admin.query("select pg_terminate_backend(pid) from pg_stat_activity where datname=$1 and pid<>pg_backend_pid()", [databaseName]).catch(() => {});
      await admin.query(`drop database if exists "${databaseName}"`).catch(() => {});
      await admin.end();
    }
  }, 150_000);
});
