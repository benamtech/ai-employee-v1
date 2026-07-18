import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mvpRoot = process.cwd();
const repoRoot = join(mvpRoot, "..");
const source = (path: string) => readFile(join(mvpRoot, path), "utf8");
const rootSource = (path: string) => readFile(join(repoRoot, path), "utf8");

describe("S8 production admin authority source boundary", () => {
  it("routes admin reads through durable session and exact lease authority", async () => {
    const server = await source("apps/manager/src/server.ts");
    expect(server).toContain("authorizePlatformAdminRequest");
    expect(server).toContain('authorization: c.req.header("X-AMTECH-Admin-Authorization")');
    expect(server).toContain('support_lease_id: c.req.header("X-AMTECH-Support-Lease-Id")');
    expect(server).toContain("legacy_identity_header_present");
    expect(server).toContain("legacy_reason_header_present");
    expect(server).not.toContain("const auth = await requirePlatformRole");
    expect(server).not.toContain("const access = await recordSupportAccess");
  });

  it("registers every support write through C3 and links the accepted receipt", async () => {
    const runtime = await source("apps/manager/src/lib/platform-admin-runtime.ts");
    expect(runtime).toContain('db.rpc("register_durable_command"');
    expect(runtime).toContain("executeDurableCommandEffect");
    expect(runtime).toContain('p_actor_class: "platform"');
    expect(runtime).toContain('p_policy_version: "platform-admin-v1"');
    expect(runtime).toContain("effect_receipt_id: execution.receipt_id");
    expect(runtime).toContain("if (receiptLinked.error) throw receiptLinked.error");
  });

  it("disables legacy mutable platform-user and feature-local support-session authority", async () => {
    const admin = await source("apps/manager/src/lib/admin.ts");
    expect(admin).toContain('error: "legacy_platform_authority_disabled"');
    expect(admin).toContain('error: "legacy_support_session_disabled"');
    expect(admin).not.toContain('db.from("support_access_sessions").insert');
  });

  it("activates versioned sessions, expiring step-up, exact leases, audit chain, and durable platform C3 actors", async () => {
    const activation = await source("packages/db/migrations/0056_platform_admin_authority_activation.sql");
    const actor = await source("packages/db/migrations/0057_platform_command_actor_enforcement.sql");
    expect(activation).toContain("mint_platform_admin_session");
    expect(activation).toContain("step_up_expires_at");
    expect(activation).toContain("issue_platform_support_lease");
    expect(activation).toContain("support_lease_assignment_scope_mismatch");
    expect(activation).toContain("set enabled = true");
    expect(actor).toContain("unauthorized_platform_command_actor");
    expect(actor).toContain("platform_command_policy_version_invalid");
  });
});

describe("local machine production gate", () => {
  it("keeps pnpm at the root and npm package-lock as application dependency authority", async () => {
    const rootPackage = JSON.parse(await rootSource("package.json"));
    const mvpPackage = JSON.parse(await source("package.json"));
    expect(rootPackage.packageManager).toMatch(/^pnpm@/);
    expect(rootPackage.scripts).toMatchObject({ build: expect.any(String), test: expect.any(String), dev: expect.any(String), verify: expect.any(String), "s9:go-no-go": expect.any(String) });
    expect(mvpPackage.workspaces).toEqual(["packages/*", "apps/*"]);
    await expect(readFile(join(mvpRoot, "package-lock.json"), "utf8")).resolves.toContain('"lockfileVersion"');
  });

  it("builds and starts only exact-SHA production images", async () => {
    const compose = await source("infra/deploy/docker-compose.yml");
    const manager = await source("infra/deploy/manager.Dockerfile");
    const web = await source("infra/deploy/web.Dockerfile");
    const caddy = await source("infra/deploy/caddy.Dockerfile");
    for (const text of [compose, manager, web, caddy]) expect(text).toContain("AMTECH_GIT_SHA");
    expect(compose).toContain("AMTECH_GIT_SHA is required");
    expect(manager).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
    expect(web).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
    expect(caddy).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
  });

  it("denies external network during unit tests and never builds or pulls during dev", async () => {
    const guard = await rootSource("scripts/local-prod/offline-guard.mjs");
    const tests = await rootSource("scripts/local-prod/test.mjs");
    const dev = await rootSource("scripts/local-prod/dev.mjs");
    expect(guard).toContain("offline_test_network_denied");
    expect(tests).toContain("LOCAL_PROD_TEST_BUDGET_SECONDS ?? 10");
    expect(dev).toContain('"--no-build"');
    expect(dev).toContain('"--pull", "never"');
    expect(dev).toContain("requireProof(\"build-artifacts\")");
    expect(dev).toContain("requireProof(\"test\")");
  });

  it("exposes help without running build, test, or deploy work", async () => {
    for (const script of ["preflight.mjs", "audit.mjs", "build.mjs", "test.mjs", "dev.mjs", "measure-command.mjs"]) {
      const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "local-prod", script), "--help"], { cwd: repoRoot, encoding: "utf8", timeout: 3000 });
      expect(result.status, `${script}: ${result.stderr}`).toBe(0);
      expect(result.stdout).toMatch(/Usage:/);
    }
  });
});
