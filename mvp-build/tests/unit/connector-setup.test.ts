import { describe, expect, it } from "vitest";
import {
  custodyFor,
  ownerManagedConnectorSetups,
  resolveManagedSetupForCapability,
  resolveOwnerManagedConnectorSetup,
} from "@amtech/shared";

describe("managed native connector setup protocol", () => {
  it("represents OAuth and provider onboarding through one fail-closed descriptor", () => {
    const setups = ownerManagedConnectorSetups();
    expect(setups.map((setup) => setup.key).sort()).toEqual(["gmail", "quickbooks", "stripe"]);

    const gmail = resolveOwnerManagedConnectorSetup("google-workspace");
    expect(gmail?.authorization_protocol).toBe("oauth2_authorization_code");
    expect(gmail?.setup_flow).toBe("oauth_redirect");
    expect(gmail?.allowed_authorization_hosts).toEqual(["accounts.google.com"]);

    const quickBooks = resolveOwnerManagedConnectorSetup("qbo");
    expect(quickBooks?.start_tool).toBe("connect_quickbooks");
    expect(quickBooks?.custody).toBe("manager_mediated");

    const stripe = resolveOwnerManagedConnectorSetup("payments");
    expect(stripe?.authorization_protocol).toBe("provider_managed_onboarding");
    expect(stripe?.continuation?.tool).toBe("create_stripe_account_link");
    expect(stripe?.redirect_proof_fields).toContain("account_link_url");

    expect(resolveOwnerManagedConnectorSetup("unreviewed-write-provider")).toBeNull();
  });

  it("derives setup from capability metadata rather than a Web provider branch", () => {
    expect(resolveManagedSetupForCapability({
      connector_id: "qbo",
      server_id: "amtech-manager",
      tool_name: "prepare_quickbooks_expense",
      category: "accounting",
    })?.key).toBe("quickbooks");

    expect(resolveManagedSetupForCapability({
      connector_id: null,
      server_id: "amtech-manager",
      tool_name: "connect_stripe",
      category: "money",
    })?.key).toBe("stripe");

    expect(resolveManagedSetupForCapability({
      connector_id: "unreviewed-provider",
      server_id: "remote-mcp",
      tool_name: "write_everything",
      category: "system",
    })).toBeNull();
  });

  it("retains risk-derived custody independent of provider setup support", () => {
    expect(custodyFor({ writes: false, money: false, customer_facing: false })).toBe("direct_mcp");
    expect(custodyFor({ writes: true, money: false, customer_facing: false })).toBe("manager_mediated");
    expect(custodyFor({ writes: false, money: true, customer_facing: false })).toBe("manager_mediated");
  });
});
