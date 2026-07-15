import { describe, expect, it } from "vitest";
import { smsPlan } from "../../apps/manager/src/provisioner";
import type { ProvisionerRequest } from "../../packages/shared/src/profile-package";

function req(options?: ProvisionerRequest["options"]): ProvisionerRequest {
  return {
    account_id: "acct_1",
    employee_id: "emp_1",
    manifest_id: "man_1",
    profile_package_key: "contractor_estimator",
    options,
    render_secrets: { manager_mcp_token: "mcp_test" },
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
      workspace_dir: "/tmp/workspace",
      webhook_url: "https://api.test/webhooks/twilio/emp_1",
      gateway_port: 8101,
      top_workflows: ["estimates"],
      tools_mentioned: [],
      seed_skills: ["estimate"],
      profile_context: {
        package_key: "contractor_estimator",
        generated_from: "onboarding_manifest",
        memory_limits: { memory_chars: 2200, user_chars: 1375 },
        resource_pointers: [],
        slots: [],
      },
    },
  };
}

describe("provisioner options", () => {
  it("keeps SMS provisioning on by default for ordinary employees", () => {
    expect(smsPlan(req())).toEqual({
      enabled: true,
      configure_webhook: true,
      send_first_message: true,
    });
  });

  it("supports non-SMS employee materializations", () => {
    expect(smsPlan(req({ sms: { enabled: false } }))).toEqual({
      enabled: false,
      configure_webhook: false,
      send_first_message: false,
    });
  });

  it("can configure SMS without sending a first message", () => {
    expect(smsPlan(req({ sms: { send_first_message: false } }))).toEqual({
      enabled: true,
      configure_webhook: true,
      send_first_message: false,
    });
  });
});
