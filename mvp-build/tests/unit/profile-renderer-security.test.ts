import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildProfileContext } from "../../apps/manager/src/lib/profile-context";
import { renderProfilePackage } from "../../apps/manager/src/lib/profile-renderer";
import type { OnboardingManifest } from "../../packages/shared/src/manifest";
import type { ProvisionerRequest } from "../../packages/shared/src/profile-package";

const saved: Record<string, string | undefined> = {};

const manifest: OnboardingManifest = {
  employee_type: "contractor_estimator",
  profile_package_key: "contractor_estimator",
  business_display_name: "Smith Painting",
  business_kind: "painting",
  timezone: "America/New_York",
  owner_name: "Jane",
  verified_phone_e164: "+15555550100",
  verification_method: "twilio_verify",
  consent_channel: "web",
  employee_name: "Alex",
  top_workflows: ["estimates"],
  tools_mentioned: ["QuickBooks"],
  seed_skills: ["estimate"],
  pricing_facts: [{ key: "labor_rate", value: "$75/hour", confidence: "high", source_snippet: "never render this raw snippet" }],
  branding_facts: [{ key: "tone", value: "simple and professional", confidence: "medium" }],
  customer_job_facts: [],
};

function req(token?: string): ProvisionerRequest {
  return {
    account_id: "acct_1",
    employee_id: "emp_1",
    manifest_id: "man_1",
    profile_package_key: "contractor_estimator",
    ...(token ? { render_secrets: { manager_mcp_token: token } } : {}),
    params: {
      client_id: "client-1",
      account_id: "acct_1",
      employee_id: "emp_1",
      profile_package_key: "contractor_estimator",
      runtime_backend: "docker",
      business_display_name: "Smith Painting",
      business_kind: "painting",
      owner_name: "Jane",
      owner_phone_e164: "+15555550100",
      employee_name: "Alex",
      timezone: "America/New_York",
      workspace_dir: "/tmp/amtech-render-test/workspace",
      webhook_url: "https://api.test/webhooks/twilio/emp_1",
      gateway_port: 8101,
      top_workflows: ["estimates"],
      tools_mentioned: [],
      seed_skills: ["estimate"],
      api_server_key: "api_server_secret",
      profile_context: buildProfileContext({ packageKey: "contractor_estimator", manifest }),
    },
  };
}

describe("profile renderer secret boundaries", () => {
  beforeEach(async () => {
    for (const k of ["HERMES_HOME", "PROFILE_VALIDATION_COMMAND", "AMTECH_MVP_ROOT", "MANAGER_INTERNAL_TOKEN"]) saved[k] = process.env[k];
    process.env.HERMES_HOME = await mkdtemp(join(tmpdir(), "amtech-hermes-home-"));
    process.env.PROFILE_VALIDATION_COMMAND = "true";
    process.env.AMTECH_MVP_ROOT = process.cwd();
    process.env.MANAGER_INTERNAL_TOKEN = "global-manager-token";
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("renders a scoped MCP token without persisting it in env or profile build params", async () => {
    const rendered = await renderProfilePackage(req("mcp_scoped_profile_token"));
    const env = await readFile(join(rendered.generated_path, ".env"), "utf8");
    const config = await readFile(join(rendered.generated_path, "config.yaml"), "utf8");
    const params = await readFile(join(rendered.generated_path, "profile-build-params.json"), "utf8");

    expect(env).not.toContain("MANAGER_INTERNAL_TOKEN");
    expect(env).not.toContain("global-manager-token");
    expect(config).toContain("Bearer mcp_scoped_profile_token");
    expect(config).not.toContain("X-AMTECH-Account-Id");
    expect(config).not.toContain("global-manager-token");
    expect(params).not.toContain("mcp_scoped_profile_token");
  });

  it("renders native Hermes memory and workspace brain from profile context", async () => {
    const rendered = await renderProfilePackage(req("mcp_scoped_profile_token"));
    const memory = await readFile(join(rendered.generated_path, "memories", "MEMORY.md"), "utf8");
    const user = await readFile(join(rendered.generated_path, "memories", "USER.md"), "utf8");
    const brain = await readFile(join(rendered.generated_path, "workspace", "brain", "business-brain.md"), "utf8");

    expect(memory).toContain("business_name: Smith Painting");
    expect(memory).toContain("pricing.labor_rate: $75/hour");
    expect(memory).toContain("amtech://manager/business-brain");
    expect(user.length).toBeLessThanOrEqual(1375);
    expect(brain).toContain("Tools and skills");
    expect(brain).toContain("tools_mentioned: QuickBooks");
    expect(`${memory}\n${user}\n${brain}`).not.toContain("never render this raw snippet");
  });

  it("fails closed when a scoped MCP token is missing", async () => {
    await expect(renderProfilePackage(req())).rejects.toThrow(/manager_mcp_token missing/);
  });

  it("replaces stale generated profile files on rerender", async () => {
    const first = await renderProfilePackage(req("mcp_scoped_profile_token"));
    await mkdir(join(first.generated_path, "skills", "stale"), { recursive: true });
    await writeFile(join(first.generated_path, "skills", "stale", "removed.md"), "{{OLD_TOKEN}}\n", "utf8");

    const second = await renderProfilePackage(req("mcp_scoped_profile_token_2"));
    await expect(readFile(join(second.generated_path, "skills", "stale", "removed.md"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" });
  });
});
