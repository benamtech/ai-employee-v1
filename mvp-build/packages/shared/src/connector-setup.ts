import type { ToolName } from "./tool-contracts.js";
import type { CapabilityCategory } from "./materialization.js";
import { resolveConnectorMeta, type ConnectorCustody } from "./connector-registry.js";

export type ManagedConnectorAuthorizationProtocol =
  | "oauth2_authorization_code"
  | "provider_managed_onboarding"
  | "managed_api_key"
  | "managed_service_account"
  | "operator_managed"
  | "none";

export type ManagedConnectorSetupFlow =
  | "oauth_redirect"
  | "provider_onboarding_redirect"
  | "managed_operator"
  | "none";

/** Which durable read model proves that a shipped provider adapter is connected. */
export type ManagedConnectorReadinessSource = "connector_accounts" | "stripe_connections" | "operator_evidence";

export interface ManagedConnectorContinuation {
  tool: ToolName;
  input_from_proof: {
    proof_key: string;
    input_key: string;
  };
  return_url_input?: string;
  refresh_url_input?: string;
}

/**
 * One owner-safe, transport-neutral setup contract for a native connector.
 *
 * Why: provider names are adapters, not AMTECH's authorization ontology. Keeping
 * scopes, governed tools, readiness evidence, redirect hosts, custody, and
 * continuation steps in one descriptor prevents a browser or broad capability
 * category from selecting a more powerful provider flow.
 */
export interface OwnerManagedConnectorSetup {
  key: string;
  aliases: string[];
  label: string;
  provider: string;
  category: CapabilityCategory;
  custody: ConnectorCustody;
  authorization_protocol: ManagedConnectorAuthorizationProtocol;
  setup_flow: ManagedConnectorSetupFlow;
  start_tool: ToolName | null;
  /** Exact Manager tools governed by this adapter. Categories never imply provider identity. */
  managed_tool_names: ToolName[];
  readiness_source: ManagedConnectorReadinessSource;
  continuation: ManagedConnectorContinuation | null;
  requested_scopes: string[];
  allowed_authorization_hosts: string[];
  redirect_proof_fields: string[];
  can_do: string[];
  cannot_do: string[];
  credential_posture: string;
  standards_profile: {
    oauth_security_bcp: "rfc9700" | "not_applicable";
    protected_resource_metadata: "required_for_remote_mcp" | "provider_specific" | "not_applicable";
    pkce: "required_when_supported" | "not_applicable";
    rich_authorization: "preferred_when_supported" | "not_applicable";
    sender_constrained_tokens: "preferred_when_supported" | "not_applicable";
  };
}

/** @deprecated Use OwnerManagedConnectorSetup; not every native setup flow is OAuth. */
export type OwnerOAuthConnectorSetup = OwnerManagedConnectorSetup;

const OWNER_MANAGED_CONNECTORS: readonly OwnerManagedConnectorSetup[] = [
  {
    key: "gmail",
    aliases: ["gmail", "email", "google-workspace"],
    label: "Email",
    provider: "gmail",
    category: "communication",
    custody: "manager_mediated",
    authorization_protocol: "oauth2_authorization_code",
    setup_flow: "oauth_redirect",
    start_tool: "connect_email",
    managed_tool_names: [
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
    ],
    readiness_source: "connector_accounts",
    continuation: null,
    requested_scopes: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    allowed_authorization_hosts: ["accounts.google.com"],
    redirect_proof_fields: ["consent_url"],
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
    standards_profile: {
      oauth_security_bcp: "rfc9700",
      protected_resource_metadata: "provider_specific",
      pkce: "required_when_supported",
      rich_authorization: "preferred_when_supported",
      sender_constrained_tokens: "preferred_when_supported",
    },
  },
  {
    key: "quickbooks",
    aliases: ["quickbooks", "qbo", "accounting", "intuit"],
    label: "QuickBooks",
    provider: "quickbooks",
    category: "accounting",
    custody: "manager_mediated",
    authorization_protocol: "oauth2_authorization_code",
    setup_flow: "oauth_redirect",
    start_tool: "connect_quickbooks",
    managed_tool_names: [
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
    ],
    readiness_source: "connector_accounts",
    continuation: null,
    requested_scopes: ["com.intuit.quickbooks.accounting"],
    allowed_authorization_hosts: ["appcenter.intuit.com"],
    redirect_proof_fields: ["consent_url"],
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
    standards_profile: {
      oauth_security_bcp: "rfc9700",
      protected_resource_metadata: "provider_specific",
      pkce: "required_when_supported",
      rich_authorization: "preferred_when_supported",
      sender_constrained_tokens: "preferred_when_supported",
    },
  },
  {
    key: "stripe",
    aliases: ["stripe", "payment", "payments", "stripe-connect"],
    label: "Payments",
    provider: "stripe",
    category: "money",
    custody: "manager_mediated",
    authorization_protocol: "provider_managed_onboarding",
    setup_flow: "provider_onboarding_redirect",
    start_tool: "connect_stripe",
    managed_tool_names: [
      "connect_stripe",
      "create_stripe_account_link",
      "complete_stripe_onboarding",
      "create_deposit_invoice",
      "send_deposit_invoice",
      "handle_stripe_webhook",
      "get_stripe_connection_status",
      "replay_stripe_event",
      "regenerate_stripe_onboarding_link",
    ],
    readiness_source: "stripe_connections",
    continuation: {
      tool: "create_stripe_account_link",
      input_from_proof: {
        proof_key: "stripe_connection_id",
        input_key: "stripe_connection_id",
      },
      return_url_input: "return_url",
      refresh_url_input: "refresh_url",
    },
    requested_scopes: [],
    allowed_authorization_hosts: ["connect.stripe.com"],
    redirect_proof_fields: ["account_link_url"],
    can_do: [
      "Create an assignment-bound Stripe Connect account in the configured mode",
      "Open Stripe's authenticated onboarding experience inside the owner setup flow",
      "Prepare and send deposit invoices only through current approval and effect boundaries",
    ],
    cannot_do: [
      "Expose the AMTECH Stripe secret key or connected-account credentials",
      "Treat provider onboarding as generic OAuth",
      "Send an invoice or move money without the exact required authority",
    ],
    credential_posture: "AMTECH keeps the platform credential in Manager custody. Stripe hosts the connected-account onboarding page; the employee runtime and browser never receive the platform secret.",
    standards_profile: {
      oauth_security_bcp: "not_applicable",
      protected_resource_metadata: "not_applicable",
      pkce: "not_applicable",
      rich_authorization: "not_applicable",
      sender_constrained_tokens: "not_applicable",
    },
  },
] as const;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cloneConnector(connector: OwnerManagedConnectorSetup): OwnerManagedConnectorSetup {
  return {
    ...connector,
    aliases: [...connector.aliases],
    managed_tool_names: [...connector.managed_tool_names],
    continuation: connector.continuation
      ? {
          ...connector.continuation,
          input_from_proof: { ...connector.continuation.input_from_proof },
        }
      : null,
    requested_scopes: [...connector.requested_scopes],
    allowed_authorization_hosts: [...connector.allowed_authorization_hosts],
    redirect_proof_fields: [...connector.redirect_proof_fields],
    can_do: [...connector.can_do],
    cannot_do: [...connector.cannot_do],
    standards_profile: { ...connector.standards_profile },
  };
}

/**
 * Resolve only an explicitly shipped self-service connector setup. Unknown
 * connectors remain representable in the capability graph but cannot choose a
 * tool, scope, credential mode, or redirect host.
 */
export function resolveOwnerManagedConnectorSetup(value: string | null | undefined): OwnerManagedConnectorSetup | null {
  const needle = normalize(String(value ?? ""));
  if (!needle) return null;
  for (const connector of OWNER_MANAGED_CONNECTORS) {
    if (
      normalize(connector.key) === needle
      || connector.aliases.some((alias) => normalize(alias) === needle)
    ) {
      return cloneConnector(connector);
    }
  }
  return null;
}

/** Compatibility resolver for callers that specifically require OAuth. */
export function resolveOwnerOAuthConnectorSetup(value: string | null | undefined): OwnerOAuthConnectorSetup | null {
  const setup = resolveOwnerManagedConnectorSetup(value);
  return setup?.authorization_protocol === "oauth2_authorization_code" ? setup : null;
}

export function ownerManagedConnectorSetups(): OwnerManagedConnectorSetup[] {
  return OWNER_MANAGED_CONNECTORS.map(cloneConnector);
}

/** Compatibility enumeration for older OAuth-only callers. */
export function ownerOAuthConnectorSetups(): OwnerOAuthConnectorSetup[] {
  return ownerManagedConnectorSetups().filter((connector) => connector.authorization_protocol === "oauth2_authorization_code");
}

/**
 * Resolve owner setup from capability metadata without relying on category or
 * tool-name branches in the Web client. Exact manifest tool membership is data,
 * not a broad domain-category inference.
 */
export function resolveManagedSetupForCapability(input: {
  connector_id?: string | null;
  server_id?: string | null;
  tool_name?: string | null;
  category?: CapabilityCategory | null;
}): OwnerManagedConnectorSetup | null {
  const candidates = [input.connector_id, input.server_id];
  for (const candidate of candidates) {
    const direct = resolveOwnerManagedConnectorSetup(candidate);
    if (direct) return direct;
    const meta = resolveConnectorMeta(candidate);
    const viaMeta = meta.known ? resolveOwnerManagedConnectorSetup(meta.key) : null;
    if (viaMeta) return viaMeta;
  }
  if (input.tool_name) {
    const byTool = OWNER_MANAGED_CONNECTORS.find((connector) => connector.managed_tool_names.includes(input.tool_name as ToolName));
    if (byTool) return cloneConnector(byTool);
  }
  // Why: a broad domain category is not provider identity. Falling back from
  // `accounting` or `communication` to one vendor would silently recreate the
  // provider-specific ontology this descriptor is designed to remove.
  return null;
}
