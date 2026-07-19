import type { SupabaseClient } from "@amtech/db";
import {
  matchTaskCapabilities,
  type CapabilityCategory,
  type EffectiveCapabilityDecision,
  type TaskCapabilityInput,
  type ToolCapabilityAvailability,
  type ToolCapabilityCatalog,
  type ToolCapabilityDescriptor,
  type ToolCapabilityRisk,
} from "@amtech/shared";
import type { EmployeeSnapshot } from "./employee-stream.js";
import { buildCapabilityRegistry } from "./capability-registry.js";
import { latestEffectiveCapabilityReport } from "./effective-capability-evidence.js";

const OWNER_MANAGER_TOOLS = new Set([
  "get_business_brain",
  "save_business_brain_fact",
  "create_estimate_artifact",
  "render_estimate_pdf",
  "create_signed_artifact_link",
  "request_approval",
  "get_approval_status",
  "connect_email",
  "run_email_connector_test",
  "create_email_draft",
  "send_email_draft",
  "start_email_listener",
  "connect_stripe",
  "create_stripe_account_link",
  "complete_stripe_onboarding",
  "create_deposit_invoice",
  "send_deposit_invoice",
  "get_stripe_connection_status",
  "set_internal_reminder",
  "get_reminders",
  "connect_quickbooks",
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
]);

const APPROVAL_GATED = new Set([
  "send_email_draft",
  "send_deposit_invoice",
  "commit_quickbooks_write",
  "publish_artifact_sandbox",
]);

const CUSTOMER_FACING = new Set(["send_email_draft", "send_deposit_invoice"]);
const MONEY_TOOLS = new Set([
  "connect_stripe",
  "create_stripe_account_link",
  "complete_stripe_onboarding",
  "create_deposit_invoice",
  "send_deposit_invoice",
  "get_stripe_connection_status",
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
]);

const ARTIFACT_CAPABILITIES: Array<{
  tool_name: string;
  label: string;
  summary: string;
  read_only: boolean;
  requires_approval: boolean;
}> = [
  { tool_name: "create_artifact_revision", label: "Save a project revision", summary: "Create or revise a durable artifact without replacing its history.", read_only: false, requires_approval: false },
  { tool_name: "validate_artifact_revision", label: "Validate the current revision", summary: "Record checks and evidence against the exact current artifact revision.", read_only: false, requires_approval: false },
  { tool_name: "get_artifact_history", label: "Review revision history", summary: "Compare revisions, validation evidence, and publication receipts.", read_only: true, requires_approval: false },
  { tool_name: "publish_artifact_sandbox", label: "Publish to the AMTECH sandbox", summary: "Publish only the approved, validated revision through durable effect execution.", read_only: false, requires_approval: true },
  { tool_name: "verify_artifact_publication", label: "Verify the published result", summary: "Observe the approved sandbox target and attach a verification receipt.", read_only: true, requires_approval: false },
];

function stableId(serverId: string, toolName: string): string {
  return `toolcap:${slug(serverId)}:${slug(toolName)}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "capability";
}

function humanize(value: string): string {
  return value.replace(/[_:.\/-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim() || "Connected capability";
}

function isReadOnly(toolName: string): boolean {
  return /^(get|query|list|search|read|verify|check|run_.*_test)/.test(toolName)
    || ["get_artifact_history", "verify_artifact_publication"].includes(toolName);
}

function riskFor(toolName: string, readOnly: boolean): ToolCapabilityRisk {
  if (readOnly) return "read";
  if (CUSTOMER_FACING.has(toolName)) return "customer_facing";
  if (MONEY_TOOLS.has(toolName)) return "money";
  return "write";
}

function nodeAvailability(status: string, toolName: string): ToolCapabilityAvailability {
  if (toolName.startsWith("connect_")) return "ready";
  if (status === "ready") return APPROVAL_GATED.has(toolName) ? "approval_gated" : "ready";
  if (status === "policy_gated") return "approval_gated";
  if (status === "needs_connection") return "needs_connection";
  if (status === "degraded") return "degraded";
  if (status === "unavailable") return "unavailable";
  return "unverified";
}

function reportAvailability(decision: EffectiveCapabilityDecision): ToolCapabilityAvailability {
  if (decision.effective) return "ready";
  if (decision.failed_dimensions.includes("connector_ready") || decision.failed_dimensions.includes("credential_ready")) return "needs_connection";
  if (decision.failed_dimensions.includes("network_ready") || decision.failed_dimensions.includes("dependency_ready")) return "degraded";
  if (decision.live_probe_status !== "passed") return "unverified";
  return "unavailable";
}

function categoryFrom(value: unknown, fallback: CapabilityCategory = "system"): CapabilityCategory {
  const category = String(value ?? "").toLowerCase();
  const allowed: CapabilityCategory[] = ["communication", "money", "office", "documents", "automation", "research", "system", "accounting"];
  if (allowed.includes(category as CapabilityCategory)) return category as CapabilityCategory;
  return fallback;
}

function inferredCategory(toolName: string, description: string): CapabilityCategory {
  const text = `${toolName} ${description}`.toLowerCase();
  if (/account|bookkeep|ledger|invoice|expense|bill|reconcil|profit|balance/.test(text)) return "accounting";
  if (/email|message|mail|reply|customer/.test(text)) return "communication";
  if (/browser|search|research|web|crawl|fetch/.test(text)) return "research";
  if (/file|document|pdf|image|media|artifact/.test(text)) return "documents";
  if (/schedule|remind|automation|job|task/.test(text)) return "automation";
  if (/payment|money|stripe|charge|deposit/.test(text)) return "money";
  return "system";
}

function evidenceString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function evidenceBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function runtimeDescriptors(decisions: EffectiveCapabilityDecision[], checkedAt: string, reportId: string): ToolCapabilityDescriptor[] {
  const out: ToolCapabilityDescriptor[] = [];
  for (const decision of decisions) {
    const evidence = decision.evidence ?? {};
    const rawTools = Array.isArray(evidence.reported_tools) ? evidence.reported_tools.map(String).filter(Boolean) : [];
    const tools = rawTools.length ? rawTools : [decision.capability_key];
    const serverId = evidenceString(evidence.server_id) ?? `hermes:${decision.capability_key}`;
    const serverLabel = evidenceString(evidence.server_label) ?? humanize(serverId.replace(/^hermes:/, "Hermes "));
    const transport = evidence.transport === "direct_mcp" ? "direct_mcp" : "runtime_native";
    for (const toolName of tools) {
      const descriptions = evidence.tool_descriptions && typeof evidence.tool_descriptions === "object"
        ? evidence.tool_descriptions as Record<string, unknown>
        : {};
      const description = evidenceString(descriptions[toolName]) ?? `Discovered from ${serverLabel}; availability is based on the latest persisted evidence report.`;
      const readOnlyEvidence = evidenceBoolean(evidence.read_only);
      const readOnly = readOnlyEvidence ?? false;
      const availability = reportAvailability(decision);
      out.push({
        id: stableId(serverId, toolName),
        capability_key: decision.capability_key,
        server_id: serverId,
        server_label: serverLabel,
        transport,
        tool_name: toolName,
        label: evidenceString((evidence.tool_labels as Record<string, unknown> | undefined)?.[toolName]) ?? humanize(toolName),
        summary: description,
        category: categoryFrom(evidence.category, inferredCategory(toolName, description)),
        availability,
        can_run_now: availability === "ready",
        read_only: readOnly,
        risk: readOnly ? "read" : evidenceString(evidence.risk) as ToolCapabilityRisk ?? "unknown",
        requires_approval: !readOnly && evidenceBoolean(evidence.requires_approval) !== false,
        setup_requirement: availability === "ready" ? null : evidenceString(evidence.setup_requirement) ?? decision.failed_dimensions.map(humanize).join(" · "),
        connector_id: evidenceString(evidence.connector_id),
        evidence: {
          level: decision.effective ? "live_proof" : decision.runtime_reported ? "runtime_report" : "advertised_only",
          checked_at: checkedAt,
          report_id: reportId,
          failed_dimensions: [...decision.failed_dimensions],
          source_refs: [
            `effective_capability_evidence:${reportId}:${decision.capability_key}`,
            ...(evidenceString(evidence.runtime_endpoint_id) ? [`runtime_endpoint:${evidenceString(evidence.runtime_endpoint_id)}`] : []),
          ],
        },
      });
    }
  }
  return out;
}

function managerDescriptors(snapshot: EmployeeSnapshot): ToolCapabilityDescriptor[] {
  const nodes = buildCapabilityRegistry(snapshot);
  return nodes.flatMap((node) => {
    if (!node.key.startsWith("manager_tool:")) return [];
    const toolName = node.key.slice("manager_tool:".length);
    if (!OWNER_MANAGER_TOOLS.has(toolName)) return [];
    const readOnly = isReadOnly(toolName);
    const availability = nodeAvailability(node.status, toolName);
    const connector = (snapshot.connectors ?? []).find((item) => node.category === "communication"
      ? item.provider === "gmail"
      : node.category === "accounting"
        ? item.provider === "quickbooks"
        : false);
    return [{
      id: stableId("amtech-manager", toolName),
      capability_key: node.key,
      server_id: "amtech-manager",
      server_label: "AMTECH Manager",
      transport: "manager_mcp",
      tool_name: toolName,
      label: node.label,
      summary: node.summary,
      category: node.category,
      availability,
      can_run_now: availability === "ready" || availability === "approval_gated",
      read_only: readOnly,
      risk: riskFor(toolName, readOnly),
      requires_approval: APPROVAL_GATED.has(toolName),
      setup_requirement: node.setup_requirement,
      connector_id: connector?.id ?? null,
      evidence: {
        level: "control_plane_contract",
        checked_at: snapshot.runtime_health?.checked_at ?? null,
        report_id: null,
        failed_dimensions: availability === "needs_connection" ? ["connector_ready"] : availability === "degraded" ? ["runtime_health"] : [],
        source_refs: [`manager_mcp:tools/${toolName}`, `tool_schema:${toolName}`],
      },
    } satisfies ToolCapabilityDescriptor];
  });
}

function artifactDescriptors(snapshot: EmployeeSnapshot): ToolCapabilityDescriptor[] {
  const runtimeUnavailable = snapshot.runtime_health?.status === "unhealthy";
  return ARTIFACT_CAPABILITIES.map((item) => {
    const availability: ToolCapabilityAvailability = runtimeUnavailable
      ? "degraded"
      : item.requires_approval ? "approval_gated" : "ready";
    return {
      id: stableId("amtech-manager", item.tool_name),
      capability_key: `manager_tool:${item.tool_name}`,
      server_id: "amtech-manager",
      server_label: "AMTECH Manager",
      transport: "manager_mcp",
      tool_name: item.tool_name,
      label: item.label,
      summary: item.summary,
      category: "documents",
      availability,
      can_run_now: availability === "ready" || availability === "approval_gated",
      read_only: item.read_only,
      risk: item.read_only ? "read" : "write",
      requires_approval: item.requires_approval,
      setup_requirement: runtimeUnavailable ? "Restore the employee runtime before continuing the artifact journey." : null,
      connector_id: null,
      evidence: {
        level: "control_plane_contract",
        checked_at: snapshot.runtime_health?.checked_at ?? null,
        report_id: null,
        failed_dimensions: runtimeUnavailable ? ["runtime_health"] : [],
        source_refs: [`manager_mcp:tools/${item.tool_name}`, `artifact_workbench:${item.tool_name}`],
      },
    };
  });
}

function dedupe(capabilities: ToolCapabilityDescriptor[]): ToolCapabilityDescriptor[] {
  const byId = new Map<string, ToolCapabilityDescriptor>();
  for (const item of capabilities) {
    const current = byId.get(item.id);
    if (!current || (item.evidence.level === "live_proof" && current.evidence.level !== "live_proof")) byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => {
    const ready = Number(b.can_run_now) - Number(a.can_run_now);
    return ready || a.category.localeCompare(b.category) || a.label.localeCompare(b.label);
  });
}

export async function buildToolCapabilityCatalog(
  db: SupabaseClient,
  snapshot: EmployeeSnapshot,
): Promise<ToolCapabilityCatalog> {
  const report = await latestEffectiveCapabilityReport(db, snapshot.employee_id, snapshot.assignment_id).catch(() => null);
  const capabilities = dedupe([
    ...managerDescriptors(snapshot),
    ...artifactDescriptors(snapshot),
    ...(report ? runtimeDescriptors(report.capabilities, report.checked_at, report.report_id) : []),
  ]);
  const tasks: TaskCapabilityInput[] = (snapshot.tasks ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    summary: task.summary,
    type: task.type,
  }));
  return {
    version: 1,
    generated_at: new Date().toISOString(),
    assignment_id: snapshot.assignment_id,
    effective_report_id: report?.report_id ?? null,
    capabilities,
    task_matches: matchTaskCapabilities(tasks, capabilities),
  };
}
