import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ID_PREFIX,
  TOOL_NAMES,
  custodyFor,
  getToolSchema,
  hasExplicitToolSchema,
  newId,
  resolveConnectorMeta,
  resolveManagedSetupForCapability,
  type AbilitySummary,
  type CapabilityCategory,
  type CapabilityGraphNode,
  type CapabilityStatus,
  type OwnerManagedConnectorSetup,
  type RuntimeHealthSummary,
  type ToolName,
} from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";

const MANAGER_TOOL_META: Partial<Record<ToolName, { category: CapabilityCategory; label: string; summary: string }>> = {
  send_phone_verification: { category: "office", label: "Verify owner phone", summary: "Confirm the owner can receive and approve work by phone." },
  check_phone_code: { category: "office", label: "Confirm phone code", summary: "Finish phone ownership verification." },
  create_account: { category: "office", label: "Create account", summary: "Create the AMTECH account and owner session." },
  provision_employee: { category: "system", label: "Set up employee", summary: "Create and start the employee profile for this business." },
  get_provisioning_status: { category: "system", label: "Check setup status", summary: "Read employee setup progress and any repairable failure." },
  create_estimate_artifact: { category: "documents", label: "Create estimates and documents", summary: "Draft structured estimates, save artifacts, and prepare owner-safe previews." },
  render_estimate_pdf: { category: "documents", label: "Render estimate PDFs", summary: "Turn stored estimates into customer-ready PDF artifacts." },
  create_signed_artifact_link: { category: "documents", label: "Share stored outputs", summary: "Create expiring AMTECH links for artifacts." },
  connect_email: { category: "communication", label: "Connect email", summary: "Start Gmail consent and connection." },
  complete_gmail_oauth: { category: "communication", label: "Finish email connection", summary: "Complete Gmail consent after the owner approves it." },
  run_email_connector_test: { category: "communication", label: "Test email connection", summary: "Verify the email connection is healthy before sending work." },
  create_email_draft: { category: "communication", label: "Draft customer email", summary: "Draft customer-facing email without sending it." },
  send_email_draft: { category: "communication", label: "Send customer email", summary: "Send a drafted customer email after owner approval." },
  start_email_listener: { category: "communication", label: "Watch for customer replies", summary: "Start the email listener so replies become employee work." },
  renew_email_watch: { category: "communication", label: "Renew email watch", summary: "Keep customer-reply notifications healthy." },
  renew_expiring_watches: { category: "automation", label: "Renew expiring watches", summary: "Maintenance work that keeps email notifications alive." },
  handle_gmail_pubsub: { category: "communication", label: "Receive email updates", summary: "Process verified Gmail notifications into safe employee work." },
  sync_gmail_history: { category: "communication", label: "Sync email history", summary: "Recover customer replies from Gmail history when needed." },
  connect_stripe: { category: "money", label: "Connect payments", summary: "Start Stripe Connect setup for customer deposits." },
  create_stripe_account_link: { category: "money", label: "Open payment setup link", summary: "Create an authenticated Stripe setup link." },
  complete_stripe_onboarding: { category: "money", label: "Finish payment setup", summary: "Check whether Stripe onboarding is ready for deposits." },
  create_deposit_invoice: { category: "money", label: "Create deposit invoices", summary: "Draft Stripe deposit invoices for estimates." },
  send_deposit_invoice: { category: "money", label: "Send deposit invoices", summary: "Send Stripe deposit invoices after owner approval." },
  handle_stripe_webhook: { category: "money", label: "Receive payment updates", summary: "Process verified Stripe events into employee work and receipts." },
  get_stripe_connection_status: { category: "money", label: "Check payment connection", summary: "Read whether payment setup is connected and healthy." },
  request_approval: { category: "office", label: "Ask for approval", summary: "Open owner decision gates before risky actions." },
  resolve_approval: { category: "office", label: "Resolve approvals", summary: "Record owner decisions on pending gates." },
  get_approval_status: { category: "office", label: "Check approval status", summary: "Read whether a decision is still waiting, approved, or rejected." },
  set_internal_reminder: { category: "automation", label: "Track follow-ups and reminders", summary: "Schedule internal reminders and surface them in the job timeline." },
  get_reminders: { category: "automation", label: "Read reminders", summary: "List upcoming and historical reminders." },
  get_business_brain: { category: "office", label: "Read business brain", summary: "Use durable business facts learned during onboarding and work." },
  save_business_brain_fact: { category: "office", label: "Update business brain", summary: "Persist safe facts the employee learns about the business." },
  send_employee_event: { category: "system", label: "Post work updates", summary: "Emit owner-safe work events to the Work Surface." },
  dispatch_due_reminders: { category: "automation", label: "Send due reminders", summary: "Maintenance work that fires reminders at the right time." },
  dispatch_daily_briefs: { category: "automation", label: "Create daily briefs", summary: "Maintenance work that prepares owner-safe daily summaries." },
  replay_gmail_history_range: { category: "system", label: "Repair email history", summary: "Operator repair for missed Gmail history." },
  replay_stripe_event: { category: "system", label: "Repair payment event", summary: "Operator repair for Stripe event replay." },
  relink_email_thread: { category: "system", label: "Repair customer thread", summary: "Operator repair for linking an email thread to the right work." },
  mark_event_duplicate: { category: "system", label: "Mark duplicate event", summary: "Operator repair for duplicate provider events." },
  redeliver_employee_event: { category: "system", label: "Redeliver owner notice", summary: "Operator repair for sending an owner notice again." },
  suppress_event_source: { category: "system", label: "Quiet noisy source", summary: "Operator repair for suppressing noisy or broken event sources." },
  regenerate_stripe_onboarding_link: { category: "money", label: "Regenerate payment setup link", summary: "Operator repair for Stripe setup links." },
  get_entitlements: { category: "office", label: "Check account policy", summary: "Read what the account is allowed to use." },
  record_usage: { category: "system", label: "Record usage", summary: "Track work for operations and billing visibility." },
  request_upgrade: { category: "office", label: "Request plan change", summary: "Record that the owner needs more capability or support." },
  connect_quickbooks: { category: "accounting", label: "Connect QuickBooks", summary: "Start QuickBooks Online consent and connection." },
  complete_quickbooks_oauth: { category: "accounting", label: "Finish QuickBooks connection", summary: "Complete QuickBooks consent after the owner approves it." },
  run_quickbooks_connector_test: { category: "accounting", label: "Test QuickBooks connection", summary: "Verify the QuickBooks connection is healthy before booking work." },
  create_expense: { category: "accounting", label: "Record expenses", summary: "Prepare a QuickBooks expense for owner approval before it posts." },
  create_bill: { category: "accounting", label: "Enter bills", summary: "Prepare a QuickBooks bill for owner approval before it posts." },
  create_invoice: { category: "accounting", label: "Create invoices", summary: "Prepare a QuickBooks customer invoice for owner approval before it posts." },
  create_payment: { category: "accounting", label: "Record payments", summary: "Prepare a QuickBooks customer payment for owner approval before it posts." },
  commit_quickbooks_write: { category: "accounting", label: "Post approved QuickBooks entry", summary: "Post an approved QuickBooks entry to the books." },
  query_quickbooks: { category: "accounting", label: "Look up QuickBooks records", summary: "Read QuickBooks records by name and simple filters." },
  get_profit_and_loss: { category: "accounting", label: "Profit and Loss", summary: "Read a QuickBooks Profit and Loss report in plain language." },
  get_balance_sheet: { category: "accounting", label: "Balance Sheet", summary: "Read a QuickBooks Balance Sheet in plain language." },
  get_aged_receivables: { category: "accounting", label: "Who owes the business", summary: "Read QuickBooks A/R aging (overdue customer invoices)." },
  get_aged_payables: { category: "accounting", label: "What the business owes", summary: "Read QuickBooks A/P aging (overdue bills)." },
};

function runtimeStatus(runtime: RuntimeHealthSummary): CapabilityStatus {
  if (runtime.status === "healthy") return "ready";
  if (runtime.status === "degraded") return "degraded";
  if (runtime.status === "unhealthy") return "unavailable";
  return "needs_info";
}

function connectorStatus(snapshot: EmployeeSnapshot, connectorKey: string): CapabilityStatus {
  const connector = snapshot.connectors.find((row) => {
    const providerMeta = resolveConnectorMeta(row.provider);
    const keyMeta = resolveConnectorMeta(row.connector_key);
    return providerMeta.key === connectorKey || keyMeta.key === connectorKey;
  });
  if (!connector) return "needs_connection";
  return ["connected", "active", "ok", "ready"].includes(connector.status) ? "ready" : "needs_connection";
}

function stripeStatus(snapshot: EmployeeSnapshot): CapabilityStatus {
  const stripe = snapshot.stripe_connections[0] as { charges_enabled?: boolean; onboarding_status?: string } | undefined;
  if (stripe?.charges_enabled) return "ready";
  return "needs_connection";
}

function managedConnectorStatus(snapshot: EmployeeSnapshot, setup: OwnerManagedConnectorSetup): CapabilityStatus {
  // Why: readiness-source branching describes durable storage shape, not vendor
  // identity. New adapters choose a declared evidence source in the manifest.
  if (setup.readiness_source === "stripe_connections") return stripeStatus(snapshot);
  if (setup.readiness_source === "connector_accounts") return connectorStatus(snapshot, setup.key);
  return "needs_connection";
}

function setupFor(status: CapabilityStatus, name: ToolName | null, category: CapabilityCategory): string | null {
  if (status === "needs_connection" && name) {
    const setup = resolveManagedSetupForCapability({ tool_name: name, category });
    if (setup) return setup.setup_flow === "provider_onboarding_redirect"
      ? `Finish ${setup.label} setup.`
      : `Connect ${setup.label}.`;
  }
  if (status === "needs_info") return "Capability is listed but needs a live runtime/schema proof before autonomous use.";
  if (status === "degraded") return "Runtime health is degraded; Manager can still prepare safe work.";
  if (status === "unavailable") return "Runtime is unavailable.";
  return null;
}

function statusForTool(name: ToolName, snapshot: EmployeeSnapshot, runtime: RuntimeHealthSummary): CapabilityStatus {
  const category = MANAGER_TOOL_META[name]?.category;
  const setup = resolveManagedSetupForCapability({ tool_name: name, category });
  // Why: exact manifest tool ownership prevents a broad category such as
  // `accounting` from silently selecting one provider's credentials or status.
  if (setup) return managedConnectorStatus(snapshot, setup);
  if (runtime.status === "unhealthy" && !["request_approval", "resolve_approval"].includes(name)) return "degraded";
  return hasExplicitToolSchema(name) ? "ready" : "needs_info";
}

export function buildCapabilityRegistry(snapshot: EmployeeSnapshot): CapabilityGraphNode[] {
  const runtime = snapshot.runtime_health ?? { status: "unknown", message: "Runtime health has not been checked yet." };
  const runtimeNode: CapabilityGraphNode = {
    id: newId(ID_PREFIX.capabilityNode),
    account_id: snapshot.account_id,
    employee_id: snapshot.employee_id,
    key: "runtime:turns",
    label: "Answer owner work requests",
    summary: runtime.message,
    category: "system",
    status: runtimeStatus(runtime),
    setup_requirement: setupFor(runtimeStatus(runtime), null, "system"),
    trust_level: "runtime",
    can_run_now: runtimeStatus(runtime) === "ready" || runtimeStatus(runtime) === "degraded",
    sources: ["runtime_health"],
    proof: { source_table: "runtime_health_checks", source_id: snapshot.runtime_health?.checked_at ?? undefined },
  };

  const toolNodes: CapabilityGraphNode[] = TOOL_NAMES.map((name) => {
    const meta = MANAGER_TOOL_META[name] ?? {
      category: "system" as CapabilityCategory,
      label: "Managed business capability",
      summary: hasExplicitToolSchema(name) ? "A Manager-controlled capability with a typed input contract." : "A Manager-controlled capability awaiting explicit schema coverage.",
    };
    const status = statusForTool(name, snapshot, runtime);
    const schema = zodToJsonSchema(getToolSchema(name), { $refStrategy: "none" }) as Record<string, unknown>;
    return {
      id: newId(ID_PREFIX.capabilityNode),
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      key: `manager_tool:${name}`,
      label: meta.label,
      summary: meta.summary,
      category: meta.category,
      status,
      setup_requirement: setupFor(status, name, meta.category),
      trust_level: "manager_mcp",
      can_run_now: status === "ready" || status === "policy_gated",
      sources: ["manager_tool", "manager_mcp", "policy"],
      proof: { source_table: "tool_schemas", source_id: name, run_id: typeof schema === "object" ? null : null },
    };
  });

  // CE-4: generic connector nodes. Any connector present on the employee that the
  // registry does not recognize (an arbitrary MCP connector) still appears in the
  // capability graph — derived from its metadata (category, connected state, custody),
  // with ZERO per-tool code. Known Manager-mediated native adapters already have rich
  // tool nodes above; explicitly read-only direct-MCP connectors remain generic.
  const genericConnectorNodes: CapabilityGraphNode[] = (snapshot.connectors ?? []).flatMap((connector) => {
    const meta = resolveConnectorMeta(connector.provider || connector.connector_key);
    const directMcp = custodyFor(meta) === "direct_mcp";
    if (meta.known && !directMcp) return [];
    const status = connectorStatus(snapshot, meta.key);
    return [{
      id: newId(ID_PREFIX.capabilityNode),
      account_id: snapshot.account_id,
      employee_id: snapshot.employee_id,
      key: `connector:${connector.connector_key || connector.provider}`,
      label: meta.label,
      summary: directMcp
        ? "A connected read-only system the employee can query directly."
        : "A connected system used through approved Manager capabilities (money/customer-facing actions stay owner-gated).",
      category: meta.category,
      status,
      setup_requirement: status === "ready" ? null : "Repair or reconnect this system.",
      trust_level: "connector",
      can_run_now: status === "ready" && directMcp,
      sources: ["connector", "policy"],
      proof: { source_table: "connector_accounts", source_id: connector.id },
    } satisfies CapabilityGraphNode];
  });

  const policyNode: CapabilityGraphNode = {
    id: newId(ID_PREFIX.capabilityNode),
    account_id: snapshot.account_id,
    employee_id: snapshot.employee_id,
    key: "policy:broad_work",
    label: "Help with broad business work",
    summary: "The employee should take a real swing at owner work while asking before sending, spending, or changing external systems.",
    category: "office",
    status: "policy_gated",
    setup_requirement: "Owner approval is required before external side effects.",
    trust_level: "native_manager",
    can_run_now: true,
    sources: ["policy"],
    proof: { source_table: "policy", source_id: "approval-gates-v1" },
  };

  return [runtimeNode, ...toolNodes, ...genericConnectorNodes, policyNode];
}

export function abilitiesFromCapabilities(nodes: CapabilityGraphNode[]): AbilitySummary[] {
  const chosen = [
    { id: "ability:estimate", key: "manager_tool:create_estimate_artifact", source: "manager" as const },
    { id: "ability:email", key: "manager_tool:send_email_draft", source: "connector" as const },
    { id: "ability:payments", key: "manager_tool:send_deposit_invoice", source: "connector" as const },
    { id: "ability:reminders", key: "manager_tool:set_internal_reminder", source: "manager" as const },
    { id: "ability:broad-work", key: "policy:broad_work", source: "policy" as const },
  ];
  return chosen.flatMap(({ id, key, source }) => {
    const node = nodes.find((n) => n.key === key);
    if (!node) return [];
    const status = node.status === "needs_info" ? "degraded" : node.status;
    return [{
      id,
      label: node.label,
      category: node.category,
      status,
      summary: node.summary,
      source,
    } satisfies AbilitySummary];
  });
}
