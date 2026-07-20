import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mvpRoot = process.cwd();
const repoRoot = join(mvpRoot, "..");
const source = (path: string) => readFile(join(mvpRoot, path), "utf8");
const rootSource = (path: string) => readFile(join(repoRoot, path), "utf8");

function generateProductionServer() {
  return spawnSync(process.execPath, [join(mvpRoot, "apps", "manager", "scripts", "generate-production-server.mjs")], {
    cwd: mvpRoot,
    encoding: "utf8",
    timeout: 5000,
  });
}

describe("S8 production admin authority source boundary", () => {
  it("compiles the only runnable Manager server from an exact pinned template", async () => {
    const wrapper = await source("apps/manager/src/server.ts");
    const template = await source("apps/manager/src/server.template.ts");
    const generator = await source("apps/manager/scripts/generate-production-server.mjs");
    const managerPackage = JSON.parse(await source("apps/manager/package.json"));
    const tsconfig = JSON.parse(await source("apps/manager/tsconfig.json"));

    expect(wrapper).toBe([
      "// Canonical import surface for tests and internal callers.",
      "// Build/dev/start execute server.generated.ts directly after the pinned generator runs.",
      'export * from "./server.generated.js";',
      "",
    ].join("\n"));
    expect(template).toContain("async function adminActor(");
    expect(generator).toContain('expectedTemplateBlob = "c1ba7ef5b3f26a4511cd639f70b926605e7d834c"');
    expect(generator).toContain("production_server_template_hash_mismatch");
    expect(generator).toContain('from "node:url"');
    expect(managerPackage).toMatchObject({
      main: "./dist/server.generated.js",
      scripts: {
        "generate:production-server": expect.any(String),
        dev: "tsx watch src/server.generated.ts",
        start: "node dist/server.generated.js",
      },
    });
    expect(tsconfig.exclude).toContain("src/server.template.ts");

    const generated = generateProductionServer();
    expect(generated.status, generated.stderr).toBe(0);
    const server = await source("apps/manager/src/server.generated.ts");
    expect(server).toContain("authorizePlatformAdminRequest");
    expect(server).toContain('authorization: c.req.header("X-AMTECH-Admin-Authorization")');
    expect(server).toContain('support_lease_id: c.req.header("X-AMTECH-Support-Lease-Id")');
    expect(server).toContain("legacy_identity_header_present");
    expect(server).toContain("legacy_reason_header_present");
    expect(server).not.toContain("async function adminActor(");
    expect(server).not.toContain("requirePlatformRole");
    expect(server).not.toContain("recordSupportAccess");
    expect(server).not.toContain("runAdminSupportAction");
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
    expect(mvpPackage.scripts.prepare).toContain("generate:production-sources");
    await expect(readFile(join(mvpRoot, "package-lock.json"), "utf8")).resolves.toContain('"lockfileVersion"');
    await expect(readFile(join(repoRoot, "pnpm-lock.yaml"), "utf8")).resolves.toContain("importers:");
  });

  it("builds and starts only exact-SHA images for the full production topology", async () => {
    const compose = await source("infra/deploy/docker-compose.production.yml");
    const manager = await source("infra/deploy/manager.Dockerfile");
    const provisioner = await source("infra/deploy/provisioner.Dockerfile");
    const web = await source("infra/deploy/web.Dockerfile");
    const caddy = await source("infra/deploy/caddy.Dockerfile");
    for (const text of [compose, manager, provisioner, web, caddy]) expect(text).toContain("AMTECH_GIT_SHA");
    for (const service of ["manager:", "model-gateway:", "host-provisioner:", "web:", "caddy:"]) expect(compose).toContain(service);
    expect(compose).toContain("AMTECH_GIT_SHA is required");
    const managerBlock = compose.split("  model-gateway:")[0];
    expect(managerBlock).not.toContain("/var/run/docker.sock");
    expect(compose).toContain("provisioner_socket:/run/amtech-provisioner");
    expect(manager).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
    expect(manager).toContain("apps/manager/dist/server.generated.js");
    expect(manager).not.toContain('CMD ["node", "apps/manager/dist/server.js"]');
    expect(provisioner).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
    expect(web).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
    expect(caddy).toContain('org.opencontainers.image.revision="${AMTECH_GIT_SHA}"');
  });

  it("denies external network during all tests and never builds or pulls during dev", async () => {
    const guard = await rootSource("scripts/local-prod/offline-guard.mjs");
    const tests = await rootSource("scripts/local-prod/test.mjs");
    const postgres = await rootSource("scripts/local-prod/postgres-test.mjs");
    const dev = await rootSource("scripts/local-prod/dev.mjs");
    expect(guard).toContain("offline_test_network_denied");
    expect(tests).toContain("LOCAL_PROD_TEST_BUDGET_SECONDS ?? 10");
    expect(postgres).toContain("LOCAL_PROD_ALLOW_LOOPBACK");
    expect(postgres).toContain("offline-guard.mjs");
    expect(dev).toContain("docker-compose.production.yml");
    expect(dev).toContain('"--no-build"');
    expect(dev).toContain('"--pull", "never"');
    expect(dev).toContain("requireProof(\"build-artifacts\")");
    expect(dev).toContain("requireProof(\"test\")");
  });

  it("exposes help without running build, test, or deploy work", async () => {
    for (const script of ["preflight.mjs", "audit.mjs", "build.mjs", "build-runner.mjs", "test.mjs", "test-runner.mjs", "postgres-test.mjs", "dev.mjs", "verify.mjs", "go-no-go.mjs", "measure-command.mjs"]) {
      const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "local-prod", script), "--help"], { cwd: repoRoot, encoding: "utf8", timeout: 3000 });
      expect(result.status, `${script}: ${result.stderr}`).toBe(0);
      expect(result.stdout).toMatch(/Usage:/);
    }
  });
});
