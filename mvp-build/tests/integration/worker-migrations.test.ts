import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.STAGING_DATABASE_URL;

describe.skipIf(!databaseUrl)("worker migrations 0032-0038", () => {
  it("apply cleanly and satisfy lease, grant, welcome, and reprovision behavior", () => {
    const result = spawnSync("node", ["infra/scripts/acceptance/verify-worker-migrations.mjs", "--apply"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: databaseUrl, STAGING_DATABASE_URL: databaseUrl },
      timeout: 120_000,
    });
    expect(`${result.stdout ?? ""}${result.stderr ?? ""}`, "migration verifier output").toContain("worker_migrations_verified");
    expect(result.status, `${result.stdout ?? ""}\n${result.stderr ?? ""}`).toBe(0);
  });
});
