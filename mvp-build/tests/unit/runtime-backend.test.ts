import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isLocalRuntimeBackendAllowed, resolveRuntimeBackend } from "../../apps/manager/src/lib/runtime-backend";
import { profileTokenMap } from "../../apps/manager/src/lib/profile-renderer";
import type { ProfileBuildParams } from "../../packages/shared/src/profile-package";

afterEach(() => {
  delete process.env.HERMES_BACKEND_TYPE;
  delete process.env.MANAGER_API_ORIGIN;
  delete process.env.DOCKER_MANAGER_API_ORIGIN;
  delete process.env.MANAGER_MCP_URL;
  delete process.env.HERMES_TERMINAL_BACKEND;
  delete process.env.HERMES_MODEL_PROVIDER;
  delete process.env.HERMES_MODEL_DEFAULT;
  delete process.env.HERMES_MODEL_BASE_URL;
  delete process.env.HERMES_MODEL_API_KEY;
  delete process.env.ORCHESTRATOR_API_BASE_URL;
  delete process.env.ORCHESTRATOR_MODEL;
  delete process.env.ORCHESTRATOR_API_KEY;
  delete process.env.XAI_API_TOKEN;
  delete process.env.XAI_API_KEY;
  delete process.env.xai_api_key;
  delete process.env.XAI_MODEL;
  delete process.env.xai_model;
  delete process.env.ANTHROPIC_API_KEY;
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

describe("runtime backend policy", () => {
  it("defaults to docker for production-like runtime containment", () => {
    expect(resolveRuntimeBackend()).toBe("docker");
  });

  it("allows explicit local only when requested", () => {
    process.env.HERMES_BACKEND_TYPE = "local";
    expect(resolveRuntimeBackend()).toBe("local");
  });

  it("rejects unknown runtime backends", () => {
    process.env.HERMES_BACKEND_TYPE = "bare-metal";
    expect(() => resolveRuntimeBackend()).toThrow(/Unsupported HERMES_BACKEND_TYPE/);
  });

  it("passes the resolved backend into rendered profile tokens", () => {
    expect(profileTokenMap(params("docker")).RUNTIME_BACKEND).toBe("docker");
    expect(profileTokenMap(params("local")).RUNTIME_BACKEND).toBe("local");
  });

  it("uses a scoped MCP token slot instead of the global Manager internal token", () => {
    const tokens = profileTokenMap(params("docker"), { manager_mcp_token: "mcp_scoped" });
    expect(tokens.MANAGER_MCP_TOKEN).toBe("mcp_scoped");
    expect(tokens).not.toHaveProperty("MANAGER_INTERNAL_TOKEN");
  });

  it("renders only read-only direct MCP connectors into config tokens", () => {
    const tokens = profileTokenMap({
      ...params("docker"),
      direct_mcp_connectors: [
        { name: "reference_data", url: "http://reference.test/mcp" },
        { name: "stripe_direct", url: "http://stripe.test/mcp", money: true },
        { name: "customer_mailer", url: "http://mailer.test/mcp", customer_facing: true },
      ],
    });
    expect(tokens.CONNECTOR_MCP_SERVERS).toContain("reference_data:");
    expect(tokens.CONNECTOR_MCP_SERVERS).toContain("http://reference.test/mcp");
    expect(tokens.CONNECTOR_MCP_SERVERS).not.toContain("stripe_direct");
    expect(tokens.CONNECTOR_MCP_SERVERS).not.toContain("customer_mailer");
  });

  it("renders Hermes terminal backend as in-process 'local' even under docker isolation", () => {
    // The employee already runs inside the Manager's container; Hermes must not
    // attempt docker-in-docker (no socket) or it silently gates terminal/file tools.
    expect(profileTokenMap(params("docker")).TERMINAL_BACKEND).toBe("local");
    expect(profileTokenMap(params("local")).TERMINAL_BACKEND).toBe("local");
  });

  it("allows an explicit HERMES_TERMINAL_BACKEND override", () => {
    process.env.HERMES_TERMINAL_BACKEND = "docker";
    expect(profileTokenMap(params("docker")).TERMINAL_BACKEND).toBe("docker");
  });

  it("renders live Anthropic model wiring without the local bridge env", () => {
    process.env.HERMES_MODEL_PROVIDER = "anthropic";
    process.env.HERMES_MODEL_DEFAULT = "claude-haiku-4-5-20251001";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";

    const tokens = profileTokenMap(params("docker"));

    expect(tokens.MODEL_CONFIG).toContain("provider: anthropic");
    expect(tokens.MODEL_CONFIG).toContain("default: claude-haiku-4-5-20251001");
    expect(tokens.MODEL_CONFIG).not.toContain("base_url:");
    expect(tokens.MODEL_BRIDGE_BASE_URL).toBe("");
    expect(tokens.MODEL_BRIDGE_API_KEY).toBe("");
    expect(tokens.ANTHROPIC_API_KEY).toBe("sk-ant-test");
  });

  it("maps deployment openai_compatible model env to Hermes custom provider", () => {
    process.env.HERMES_MODEL_PROVIDER = "openai_compatible";
    process.env.HERMES_MODEL_DEFAULT = "grok-4.3";
    process.env.ORCHESTRATOR_API_BASE_URL = "https://api.x.ai/v1";
    process.env.XAI_API_TOKEN = "xai-test";

    const tokens = profileTokenMap(params("docker"));

    expect(tokens.MODEL_CONFIG).toContain("provider: custom");
    expect(tokens.MODEL_CONFIG).toContain("base_url: https://api.x.ai/v1");
    expect(tokens.MODEL_CONFIG).toContain("default: grok-4.3");
    expect(tokens.MODEL_CONFIG).not.toContain("provider: openai_compatible");
    expect(tokens.MODEL_BRIDGE_BASE_URL).toBe("https://api.x.ai/v1");
    expect(tokens.MODEL_BRIDGE_API_KEY).toBe("xai-test");
  });
});

describe("local runtime backend admission (production provisioning)", () => {
  const GUARD_ENV_KEYS = ["NODE_ENV", "ALLOW_LOCAL_RUNTIME_BACKEND"];
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    saved = Object.fromEntries(GUARD_ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of GUARD_ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of GUARD_ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("denies local by default even outside production (no opt-in flag)", () => {
    process.env.NODE_ENV = "test";
    expect(isLocalRuntimeBackendAllowed()).toBe(false);
  });

  it("allows local when explicitly opted in outside production", () => {
    process.env.NODE_ENV = "test";
    process.env.ALLOW_LOCAL_RUNTIME_BACKEND = "1";
    expect(isLocalRuntimeBackendAllowed()).toBe(true);
  });

  it("accepts the 'true' string form of the opt-in flag", () => {
    process.env.NODE_ENV = "test";
    process.env.ALLOW_LOCAL_RUNTIME_BACKEND = "true";
    expect(isLocalRuntimeBackendAllowed()).toBe(true);
  });

  it("vetoes local in production even when explicitly opted in", () => {
    process.env.NODE_ENV = "production";
    process.env.ALLOW_LOCAL_RUNTIME_BACKEND = "1";
    expect(isLocalRuntimeBackendAllowed()).toBe(false);
  });
});

describe("container-facing Manager origin", () => {
  it("rewrites host loopback to host.docker.internal for docker employees", () => {
    process.env.MANAGER_API_ORIGIN = "http://localhost:8080";
    const tokens = profileTokenMap(params("docker"));
    expect(tokens.MANAGER_API_ORIGIN).toBe("http://host.docker.internal:8080");
    expect(tokens.MANAGER_MCP_URL).toBe("http://host.docker.internal:8080/manager/mcp");
  });

  it("also rewrites the 127.0.0.1 loopback form", () => {
    process.env.MANAGER_API_ORIGIN = "http://127.0.0.1:8080";
    expect(profileTokenMap(params("docker")).MANAGER_MCP_URL).toBe(
      "http://host.docker.internal:8080/manager/mcp",
    );
  });

  it("leaves the host loopback intact for local employees (run on the host directly)", () => {
    process.env.MANAGER_API_ORIGIN = "http://localhost:8080";
    const tokens = profileTokenMap(params("local"));
    expect(tokens.MANAGER_API_ORIGIN).toBe("http://localhost:8080");
    expect(tokens.MANAGER_MCP_URL).toBe("http://localhost:8080/manager/mcp");
  });

  it("leaves a non-loopback (production) origin untouched under docker", () => {
    process.env.MANAGER_API_ORIGIN = "https://api.amtechai.com";
    expect(profileTokenMap(params("docker")).MANAGER_MCP_URL).toBe(
      "https://api.amtechai.com/manager/mcp",
    );
  });

  it("honors an explicit DOCKER_MANAGER_API_ORIGIN override for docker employees", () => {
    process.env.MANAGER_API_ORIGIN = "http://localhost:8080";
    process.env.DOCKER_MANAGER_API_ORIGIN = "http://host.docker.internal:9090";
    expect(profileTokenMap(params("docker")).MANAGER_MCP_URL).toBe(
      "http://host.docker.internal:9090/manager/mcp",
    );
  });
});
