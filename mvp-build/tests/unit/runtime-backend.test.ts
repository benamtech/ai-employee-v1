import { afterEach, describe, expect, it } from "vitest";
import { resolveRuntimeBackend } from "../../apps/manager/src/lib/runtime-backend";
import { profileTokenMap } from "../../apps/manager/src/lib/profile-renderer";
import type { ProfileBuildParams } from "../../packages/shared/src/profile-package";

afterEach(() => {
  delete process.env.HERMES_BACKEND_TYPE;
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
});
