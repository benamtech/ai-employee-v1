import { describe, expect, it } from "vitest";
import {
  ownerManagedConnectorSetups,
  resolveManagedSetupForCapability,
  resolveOwnerManagedConnectorSetup,
} from "../../packages/shared/src/connector-setup";
import { custodyFor } from "../../packages/shared/src/connector-registry";

describe("managed native connector setup protocol", () => {
  it("represents OAuth and provider onboarding through one fail-closed descriptor", () => {
    const setups = ownerManagedConnectorSetups();
    expect(setups.map((setup) => setup.key).sort()).toEqual(["gmail", "quickbooks", "stripe"]);

    const gmail = resolveOwnerManagedConnectorSetup("google-workspace");
    expect(gmail?.authorization_protocol).toBe("oauth2_authorization_code");
    expect(gmail?.setup_flow).toBe("oauth_redirect");
    expect(gmail?.readiness_source).toBe("connector_accounts");
    expect(gmail?.allowed_authorization_hosts).toEqual(["accounts.google.com"]);

    const quickBooks = resolveOwnerManagedConnectorSetup("qbo");
    expect(quickBooks?.start_tool).toBe("connect_quickbooks");
    expect(quickBooks?.managed_tool_names).toContain("create_invoice");
    expect(quickBooks?.custody).toBe("manager_mediated");

    const stripe = resolveOwnerManagedConnectorSetup("payments");
    expect(stripe?.authorization_protocol).toBe("provider_managed_onboarding");
    expect(stripe?.readiness_source).toBe("stripe_connections");
    expect(stripe?.continuation?.tool).toBe("create_stripe_account_link");
    expect(stripe?.redirect_proof_fields).toContain("account_link_url");

    expect(resolveOwnerManagedConnectorSetup("unreviewed-write-provider")).toBeNull();
  });

  it("derives setup from exact connector or manifest tool metadata rather than a broad category", () => {
    expect(resolveManagedSetupForCapability({
      connector_id: "qbo",
      server_id: "amtech-manager",
      tool_name: "create_invoice",
      category: "accounting",
    })?.key).toBe("quickbooks");

    expect(resolveManagedSetupForCapability({
      connector_id: null,
      server_id: "amtech-manager",
      tool_name: "connect_stripe",
      category: "money",
    })?.key).toBe("stripe");

    // Why: category is not provider identity; an unknown accounting tool cannot
    // silently inherit QuickBooks scopes or redirect hosts.
    expect(resolveManagedSetupForCapability({
      connector_id: null,
      server_id: "remote-mcp",
      tool_name: "write_everything",
      category: "accounting",
    })).toBeNull();
  });

  it("keeps every governed tool in at most one native connector manifest", () => {
    const owners = new Map<string, string>();
    for (const setup of ownerManagedConnectorSetups()) {
      for (const tool of setup.managed_tool_names) {
        expect(owners.has(tool), `${tool} is owned by both ${owners.get(tool)} and ${setup.key}`).toBe(false);
        owners.set(tool, setup.key);
      }
    }
  });

  it("retains risk-derived custody independent of provider setup support", () => {
    expect(custodyFor({ writes: false, money: false, customer_facing: false })).toBe("direct_mcp");
    expect(custodyFor({ writes: true, money: false, customer_facing: false })).toBe("manager_mediated");
    expect(custodyFor({ writes: false, money: true, customer_facing: false })).toBe("manager_mediated");
  });
});
