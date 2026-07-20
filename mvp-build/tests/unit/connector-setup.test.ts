import { describe, expect, it } from "vitest";
import {
  ownerManagedConnectorSetups,
  resolveManagedSetupForCapability,
  resolveOwnerManagedConnectorSetup,
} from "../../packages/shared/src/connector-setup";
import { custodyFor } from "../../packages/shared/src/connector-registry";

const PROVIDER_SPECIFIC_TOOLS = [
  "connect_email",
  "complete_gmail_oauth",
  "run_email_connector_test",
  "create_email_draft",
  "send_email_draft",
  "start_email_listener",
  "renew_email_watch",
  "handle_gmail_pubsub",
  "sync_gmail_history",
  "replay_gmail_history_range",
  "relink_email_thread",
  "connect_stripe",
  "create_stripe_account_link",
  "complete_stripe_onboarding",
  "create_deposit_invoice",
  "send_deposit_invoice",
  "handle_stripe_webhook",
  "get_stripe_connection_status",
  "replay_stripe_event",
  "regenerate_stripe_onboarding_link",
  "connect_quickbooks",
  "complete_quickbooks_oauth",
  "run_quickbooks_connector_test",
  "create_expense",
  "create_bill",
  "create_invoice",
  "create_payment",
  "commit_quickbooks_write",
  "query_quickbooks",
  "get_profit_and_loss",
  "get_balance_sheet",
  "get_aged_receivables",
  "get_aged_payables",
  "update_expense",
  "update_bill",
  "update_invoice",
  "create_deposit",
  "create_journal_entry",
  "update_journal_entry",
  "create_bill_payment",
] as const;

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

  it("keeps every governed tool in exactly one native connector manifest", () => {
    const owners = new Map<string, string>();
    for (const setup of ownerManagedConnectorSetups()) {
      for (const tool of setup.managed_tool_names) {
        expect(owners.has(tool), `${tool} is owned by both ${owners.get(tool)} and ${setup.key}`).toBe(false);
        owners.set(tool, setup.key);
      }
    }

    // Why: provider callback/webhook/repair tools need the same exact adapter
    // ownership as owner-visible tools even though they are not shown in the UI.
    for (const tool of PROVIDER_SPECIFIC_TOOLS) {
      expect(owners.get(tool), `${tool} is missing native connector ownership`).toBeTruthy();
    }
  });

  it("retains risk-derived custody independent of provider setup support", () => {
    expect(custodyFor({ writes: false, money: false, customer_facing: false })).toBe("direct_mcp");
    expect(custodyFor({ writes: true, money: false, customer_facing: false })).toBe("manager_mediated");
    expect(custodyFor({ writes: false, money: true, customer_facing: false })).toBe("manager_mediated");
  });
});
