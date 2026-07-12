import { afterEach, describe, expect, it } from "vitest";
import {
  computeApiServerToolsets,
  toYamlFlowList,
  HERMES_API_SERVER_BASE_TOOLSETS,
} from "../../packages/shared/src/platform-toolsets";
import { profileTokenMap } from "../../apps/manager/src/lib/profile-renderer";
import type { ProfileBuildParams } from "../../packages/shared/src/profile-package";

const KEYS = ["BROWSERBASE_API_KEY", "OPENROUTER_API_KEY", "FAL_KEY", "ELEVENLABS_API_KEY"];
afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

function params(runtime_backend?: ProfileBuildParams["runtime_backend"]): ProfileBuildParams {
  return {
    client_id: "client-1",
    account_id: "acct_1",
    employee_id: "emp_1",
    profile_package_key: "contractor_estimator",
    runtime_backend,
    business_display_name: "Smith Painting",
    business_kind: "painting",
    owner_name: "Jane",
    owner_phone_e164: "+15555550100",
    employee_name: "Alex",
    timezone: "America/New_York",
    workspace_dir: "/tmp/amtech-test",
    webhook_url: "https://api.test/webhooks/twilio/emp_1",
    gateway_port: 8101,
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
  };
}

describe("api_server toolset policy", () => {
  it("always includes the safe base set", () => {
    const set = computeApiServerToolsets({ runtimeBackend: "docker" });
    for (const t of HERMES_API_SERVER_BASE_TOOLSETS) expect(set).toContain(t);
  });

  it("enables terminal only when the backend is isolated (not local)", () => {
    expect(computeApiServerToolsets({ runtimeBackend: "docker" })).toContain("terminal");
    expect(computeApiServerToolsets({ runtimeBackend: "ssh" })).toContain("terminal");
    expect(computeApiServerToolsets({ runtimeBackend: "local" })).not.toContain("terminal");
  });

  it("gates browser on isolation AND a Browserbase key", () => {
    expect(computeApiServerToolsets({ runtimeBackend: "docker", hasBrowserbaseKey: true })).toContain("browser");
    expect(computeApiServerToolsets({ runtimeBackend: "docker", hasBrowserbaseKey: false })).not.toContain("browser");
    expect(computeApiServerToolsets({ runtimeBackend: "local", hasBrowserbaseKey: true })).not.toContain("browser");
  });

  it("gates keyed toolsets on their provider key", () => {
    expect(computeApiServerToolsets({ runtimeBackend: "docker", hasVisionKey: true })).toContain("vision");
    expect(computeApiServerToolsets({ runtimeBackend: "docker", hasImageGenKey: true })).toContain("image_gen");
    expect(computeApiServerToolsets({ runtimeBackend: "docker", hasTtsKey: true })).toContain("tts");
    const bare = computeApiServerToolsets({ runtimeBackend: "docker" });
    expect(bare).not.toContain("vision");
    expect(bare).not.toContain("image_gen");
    expect(bare).not.toContain("tts");
  });

  it("never enables cronjob or skills_hub by default (pending live proof / user-driven)", () => {
    const set = computeApiServerToolsets({ runtimeBackend: "docker", hasBrowserbaseKey: true, hasVisionKey: true, hasImageGenKey: true, hasTtsKey: true });
    expect(set).not.toContain("cronjob");
    expect(set).not.toContain("skills_hub");
  });

  it("renders a valid YAML flow list", () => {
    expect(toYamlFlowList(["web", "file"])).toBe("[web, file]");
  });

  it("renders PLATFORM_TOOLSETS into the profile token map from backend + env keys", () => {
    process.env.FAL_KEY = "fal_test";
    const docker = profileTokenMap(params("docker")).PLATFORM_TOOLSETS;
    expect(docker).toContain("terminal");
    expect(docker).toContain("image_gen");
    expect(docker.startsWith("[") && docker.endsWith("]")).toBe(true);

    const local = profileTokenMap(params("local")).PLATFORM_TOOLSETS;
    expect(local).not.toContain("terminal");
  });

  it("exposes a MANAGER_MCP_URL token defaulting under the Manager origin", () => {
    expect(profileTokenMap(params("docker")).MANAGER_MCP_URL).toContain("/manager/mcp");
  });
});
