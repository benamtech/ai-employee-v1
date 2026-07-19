import type { ToolName } from "./tool-contracts.js";

export interface OwnerOAuthConnectorSetup {
  key: string;
  aliases: string[];
  label: string;
  start_tool: ToolName;
  provider: string;
  requested_scopes: string[];
  allowed_authorization_hosts: string[];
  can_do: string[];
  cannot_do: string[];
  credential_posture: string;
}

const OWNER_OAUTH_CONNECTORS: readonly OwnerOAuthConnectorSetup[] = [
  {
    key: "gmail",
    aliases: ["gmail", "email", "google-workspace"],
    label: "Email",
    start_tool: "connect_email",
    provider: "gmail",
    requested_scopes: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    allowed_authorization_hosts: ["accounts.google.com"],
    can_do: [
      "Read the job-related threads the employee is assigned to handle",
      "Draft customer emails and show them before sending",
      "Send only through the existing owner-approval boundary",
    ],
    cannot_do: [
      "Send customer-facing work without the required approval",
      "Expose Google access tokens or your password to the employee runtime",
      "Use the connection for a different employee or assignment",
    ],
    credential_posture: "Google returns a scoped, revocable token. AMTECH seals it in Manager custody; the browser and Hermes never receive the raw token.",
  },
  {
    key: "quickbooks",
    aliases: ["quickbooks", "qbo", "accounting", "intuit"],
    label: "QuickBooks",
    start_tool: "connect_quickbooks",
    provider: "quickbooks",
    requested_scopes: ["com.intuit.quickbooks.accounting"],
    allowed_authorization_hosts: ["appcenter.intuit.com"],
    can_do: [
      "Read bounded accounting records and owner-safe reports",
      "Prepare expenses, bills, invoices, and payments for review",
      "Post only the exact stored write covered by its own approval",
    ],
    cannot_do: [
      "Post a bookkeeping write without the matching approval",
      "Touch payroll, tax filing, or bank-transfer workflows",
      "Expose Intuit access tokens or your password to the employee runtime",
    ],
    credential_posture: "Intuit returns scoped OAuth credentials. AMTECH seals them in Manager custody and binds the company realm to the current assignment.",
  },
] as const;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Resolve shipped OAuth setup without allowing an arbitrary connector to choose a
 * tool, scope, or redirect host. Unknown connectors remain managed/manual. */
export function resolveOwnerOAuthConnectorSetup(value: string | null | undefined): OwnerOAuthConnectorSetup | null {
  const needle = normalize(String(value ?? ""));
  if (!needle) return null;
  for (const connector of OWNER_OAUTH_CONNECTORS) {
    if (connector.aliases.some((alias) => normalize(alias) === needle)) return { ...connector, aliases: [...connector.aliases], requested_scopes: [...connector.requested_scopes], allowed_authorization_hosts: [...connector.allowed_authorization_hosts], can_do: [...connector.can_do], cannot_do: [...connector.cannot_do] };
  }
  return null;
}

export function ownerOAuthConnectorSetups(): OwnerOAuthConnectorSetup[] {
  return OWNER_OAUTH_CONNECTORS.map((connector) => ({
    ...connector,
    aliases: [...connector.aliases],
    requested_scopes: [...connector.requested_scopes],
    allowed_authorization_hosts: [...connector.allowed_authorization_hosts],
    can_do: [...connector.can_do],
    cannot_do: [...connector.cannot_do],
  }));
}
