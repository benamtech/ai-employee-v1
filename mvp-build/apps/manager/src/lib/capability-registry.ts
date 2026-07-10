import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ID_PREFIX,
  TOOL_NAMES,
  getToolSchema,
  hasExplicitToolSchema,
  newId,
  type AbilitySummary,
  type CapabilityCategory,
  type CapabilityGraphNode,
  type CapabilityStatus,
  type RuntimeHealthSummary,
  type ToolName,
} from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";

const MANAGER_TOOL_META: Partial<Record<ToolName, { category: CapabilityCategory; label: string; summary: string }>> = {
  create_estimate_artifact: { category: "documents", label: "Create estimates and documents", summary: "Draft structured estimates, save artifacts, and prepare owner-safe previews." },
  render_estimate_pdf: { category: "documents", label: "Render estimate PDFs", summary: "Turn stored estimates into customer-ready PDF artifacts." },
  create_signed_artifact_link: { category: "documents", label: "Share stored outputs", summary: "Create expiring AMTECH links for artifacts." },
  connect_email: { category: "communication", label: "Connect email", summary: "Start Gmail consent and connection." },
  create_email_draft: { category: "communication", label: "Draft customer email", summary: "Draft customer-facing email without sending it." },
  send_email_draft: { category: "communication", label: "Send customer email", summary: "Send a drafted customer email after owner approval." },
  create_deposit_invoice: { category: "money", label: "Create deposit invoices", summary: "Draft Stripe deposit invoices for estimates." },
  send_deposit_invoice: { category: "money", label: "Send deposit invoices", summary: "Send Stripe deposit invoices after owner approval." },
  request_approval: { category: "office", label: "Ask for approval", summary: "Open owner decision gates before risky actions." },
  resolve_approval: { category: "office", label: "Resolve approvals", summary: "Record owner decisions on pending gates." },
  set_internal_reminder: { category: "automation", label: "Track follow-ups and reminders", summary: "Schedule internal reminders and surface them in the job timeline." },
  get_reminders: { category: "automation", label: "Read reminders", summary: "List upcoming and historical reminders." },
  get_business_brain: { category: "office", label: "Read business brain", summary: "Use durable business facts learned during onboarding and work." },
  save_business_brain_fact: { category: "office", label: "Update business brain", summary: "Persist safe facts the employee learns about the business." },
  send_employee_event: { category: "system", label: "Post work updates", summary: "Emit owner-safe work events to the Work Surface." },
};

function runtimeStatus(runtime: RuntimeHealthSummary): CapabilityStatus {
  if (runtime.status === "healthy") return "ready";
  if (runtime.status === "degraded") return "degraded";
  if (runtime.status === "unhealthy") return "unavailable";
  return "needs_info";
}

function connectorStatus(snapshot: EmployeeSnapshot, provider: string): CapabilityStatus {
  const c = snapshot.connectors.find((row) => row.provider === provider || row.connector_key === provider);
  if (!c) return "needs_connection";
  return c.status === "connected" || c.status === "active" || c.status === "ok" ? "ready" : "needs_connection";
}

function stripeStatus(snapshot: EmployeeSnapshot): CapabilityStatus {
  const stripe = snapshot.stripe_connections[0] as { charges_enabled?: boolean; onboarding_status?: string } | undefined;
  if (stripe?.charges_enabled) return "ready";
  return "needs_connection";
}

function statusForTool(name: ToolName, snapshot: EmployeeSnapshot, runtime: RuntimeHealthSummary): CapabilityStatus {
  if (name.includes("email")) return connectorStatus(snapshot, "gmail");
  if (name.includes("invoice") || name.includes("deposit")) return stripeStatus(snapshot);
  if (runtime.status === "unhealthy" && !["connect_email", "request_approval", "resolve_approval"].includes(name)) return "degraded";
  return hasExplicitToolSchema(name) ? "ready" : "needs_info";
}

function setupFor(status: CapabilityStatus, category: CapabilityCategory): string | null {
  if (status === "needs_connection" && category === "communication") return "Connect Gmail.";
  if (status === "needs_connection" && category === "money") return "Finish Stripe onboarding.";
  if (status === "needs_info") return "Capability is listed but needs a live runtime/schema proof before autonomous use.";
  if (status === "degraded") return "Runtime health is degraded; Manager can still prepare safe work.";
  if (status === "unavailable") return "Runtime is unavailable.";
  return null;
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
    setup_requirement: setupFor(runtimeStatus(runtime), "system"),
    trust_level: "runtime",
    can_run_now: runtimeStatus(runtime) === "ready" || runtimeStatus(runtime) === "degraded",
    sources: ["runtime_health"],
    proof: { source_table: "runtime_health_checks", source_id: snapshot.runtime_health?.checked_at ?? undefined },
  };

  const toolNodes: CapabilityGraphNode[] = TOOL_NAMES.map((name) => {
    const meta = MANAGER_TOOL_META[name] ?? {
      category: "system" as CapabilityCategory,
      label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      summary: hasExplicitToolSchema(name) ? "Manager-controlled tool with typed input schema." : "Manager-controlled tool awaiting explicit schema coverage.",
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
      setup_requirement: setupFor(status, meta.category),
      trust_level: "manager_mcp",
      can_run_now: status === "ready" || status === "policy_gated",
      sources: ["manager_tool", "manager_mcp", "policy"],
      proof: { source_table: "tool_schemas", source_id: name, run_id: typeof schema === "object" ? null : null },
    };
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

  return [runtimeNode, ...toolNodes, policyNode];
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
