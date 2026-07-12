import { mkdtemp, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activateCaddySnippet, renderCaddySnippet } from "../../apps/manager/src/lib/caddy-activation";
import type { ProfileBuildParams } from "../../packages/shared/src/profile-package";

const saved: Record<string, string | undefined> = {};

function params(overrides: Partial<ProfileBuildParams> = {}): ProfileBuildParams {
  return {
    client_id: "client-1",
    account_id: "acct_1",
    employee_id: "emp_1",
    profile_package_key: "contractor_estimator",
    runtime_backend: "docker",
    business_display_name: "Smith Painting",
    business_kind: "painting",
    owner_name: "Jane",
    owner_phone_e164: "+15555550100",
    employee_name: "Sage",
    timezone: "America/New_York",
    workspace_dir: "/tmp/amtech/workspace",
    webhook_url: "https://api.test/webhooks/twilio/emp_1",
    gateway_port: 8123,
    top_workflows: ["estimates"],
    tools_mentioned: [],
    seed_skills: ["estimate"],
    profile_context: {
      package_key: "contractor_estimator",
      generated_from: "onboarding_manifest",
      memory_limits: { memory_chars: 2200, user_chars: 1375 },
      resource_pointers: ["amtech://manager/business-brain"],
      slots: [],
    },
    ...overrides,
  };
}

describe("Caddy snippet activation", () => {
  beforeEach(async () => {
    for (const k of ["CADDY_CLIENTS_DIR", "CADDY_VALIDATE_COMMAND", "CADDY_RELOAD_COMMAND", "CADDY_SMOKE_COMMAND", "CADDY_EMPLOYEE_UPSTREAM_HOST", "PUBLIC_BASE_DOMAIN"]) {
      saved[k] = process.env[k];
    }
    process.env.CADDY_CLIENTS_DIR = await mkdtemp(join(tmpdir(), "amtech-caddy-"));
    process.env.CADDY_VALIDATE_COMMAND = "true";
    process.env.CADDY_RELOAD_COMMAND = "true";
    delete process.env.CADDY_SMOKE_COMMAND;
    process.env.PUBLIC_BASE_DOMAIN = "amtech.test";
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("renders employee upstreams with tokenized Docker DNS aliases", () => {
    process.env.CADDY_EMPLOYEE_UPSTREAM_HOST = "amtech-hermes-{{EMPLOYEE_ID}}";
    const rendered = renderCaddySnippet(params());
    expect(rendered.upstream).toBe("amtech-hermes-emp_1:8123");
    expect(rendered.snippet).toContain("client-1.agents.amtech.test");
    expect(rendered.snippet).toContain("reverse_proxy amtech-hermes-emp_1:8123");
  });

  it("validates and reloads after writing the active snippet", async () => {
    const result = await activateCaddySnippet(params());
    expect(result.reload_output).toBe("ok");
    expect(await readFile(join(process.env.CADDY_CLIENTS_DIR!, "client-1.caddy"), "utf8"))
      .toContain("reverse_proxy localhost:8123");
  });

  it("rolls back the snippet when reload fails", async () => {
    process.env.CADDY_RELOAD_COMMAND = "false";
    const file = join(process.env.CADDY_CLIENTS_DIR!, "client-1.caddy");
    await expect(activateCaddySnippet(params())).rejects.toThrow(/caddy_activation_failed/);
    expect(existsSync(file)).toBe(false);
  });
});
