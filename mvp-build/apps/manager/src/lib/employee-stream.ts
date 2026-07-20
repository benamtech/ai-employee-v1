/**
 * Work Surface read-model + live deltas (Phase 5). `buildEmployeeSnapshot` is the
 * single source of the owner's snapshot — used by the /resources endpoint (full
 * poll), the SSE stream (initial frame + reconnect catch-up), and tests.
 * `fetchWorkEventsSince` returns only what is new past a cursor so the stream can
 * push deltas instead of re-sending everything.
 *
 * Everything here is descriptor-driven and account-scoped; no raw provider payload
 * reaches the surface.
 */
import type { SupabaseClient } from "@amtech/db";
import type {
  CapabilityGraphNode,
  ConnectionSurface,
  ResourcePayload,
  ResurfaceItem,
  RuntimeHealthSummary,
  SurfaceEnvelope,
  WorkEventRow,
  WorkOutput,
  WorkTask,
} from "@amtech/shared";
import type { WorkDeliverableDescriptor, WorkEventDescriptor } from "@amtech/shared";
import { custodyFor, resolveConnectorMeta } from "@amtech/shared";
import { materializeEmployeeSnapshot } from "./materialization.js";

export type EmployeeSnapshot = ResourcePayload & {
  employee_id: string;
  assignment_id: string;
  stripe_connections: Array<Record<string, unknown>>;
};

type EmployeeRow = { id: string; name?: string | null; status?: string | null; profile_id?: string | null; web_route?: string | null; created_at?: string | null };
type RuntimeEndpointRow = { id: string; backend_type?: string | null; health?: Record<string, unknown> | null; sms_number_e164?: string | null };
type RuntimeHealthRow = { status?: string | null; checked_at?: string | null; backend_type?: string | null; details?: Record<string, unknown> | null };
export interface TupleCursor {
  created_at: string;
  id: string;
}

const CONNECTED_STATUSES = new Set(["connected", "active", "ok", "ready"]);

type ConnectionDef = {
  id: string;
  label: string;
  category: ConnectionSurface["category"];
  providerHints: string[];
  capabilityCategories?: Array<CapabilityGraphNode["category"]>;
  defaultCanDo: string;
  setupRequirement: string;
};

const CONNECTION_DEFS: ConnectionDef[] = [
  {
    id: "email",
    label: "Email",
    category: "communication",
    providerHints: ["gmail", "email", "google-workspace"],
    capabilityCategories: ["communication"],
    defaultCanDo: "Draft customer emails, watch for replies, and send approved messages.",
    setupRequirement: "Connect the business email account.",
  },
  {
    id: "payments",
    label: "Payments",
    category: "money",
    providerHints: ["stripe", "payment", "payments"],
    capabilityCategories: ["money"],
    defaultCanDo: "Prepare deposit invoices, track payment status, and surface payment follow-ups.",
    setupRequirement: "Connect the payment account.",
  },
  {
    id: "accounting",
    label: "Accounting",
    category: "accounting",
    providerHints: ["quickbooks", "qbo", "accounting"],
    capabilityCategories: ["accounting"],
    defaultCanDo: "Prepare approved accounting entries, look up records, and summarize key reports.",
    setupRequirement: "Connect the accounting system.",
  },
  {
    id: "files",
    label: "Files",
    category: "documents",
    providerHints: ["drive", "dropbox", "file", "files", "storage"],
    defaultCanDo: "Use job documents, photos, blueprints, and stored outputs when a file system is connected.",
    setupRequirement: "Connect file storage when document context is needed.",
  },
  {
    id: "calendar",
    label: "Calendar",
    category: "calendar",
    providerHints: ["calendar", "gcal", "schedule"],
    defaultCanDo: "Coordinate job dates, site visits, and follow-up appointments when a calendar is connected.",
    setupRequirement: "Connect a calendar when scheduling is needed.",
  },
  {
    id: "store",
    label: "Store",
    category: "store",
    providerHints: ["shopify", "store", "commerce", "orders"],
    defaultCanDo: "Read orders and customer commerce events when a store is connected.",
    setupRequirement: "Connect a store only when the business needs commerce events.",
  },
];

function normalize(value?: string | null): string {
  return String(value ?? "").toLowerCase();
}

function humanLabel(value?: string | null): string {
  const v = String(value ?? "Connected system").replace(/[_:-]+/g, " ").trim();
  return v.replace(/\b\w/g, (c) => c.toUpperCase());
}

function connectorMatches(connector: EmployeeSnapshot["connectors"][number], def: ConnectionDef): boolean {
  const haystack = `${connector.provider} ${connector.connector_key}`.toLowerCase();
  return def.providerHints.some((hint) => haystack.includes(hint));
}

function capabilityMatches(capability: CapabilityGraphNode, def: ConnectionDef): boolean {
  return Boolean(def.capabilityCategories?.includes(capability.category));
}

function ownerSafeCapability(node: CapabilityGraphNode): CapabilityGraphNode | null {
  if (node.key.startsWith("manager_tool:")) return null;
  if (node.sources.includes("manager_mcp")) return null;
  return {
    ...node,
    key: node.key.startsWith("connector:") ? node.key : `owner:${node.category}:${node.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    trust_level: node.trust_level === "manager_mcp" ? "native_manager" : node.trust_level,
    sources: node.sources.filter((source) => source !== "manager_mcp" && source !== "manager_tool"),
    proof: {},
  };
}

function ownerSafeCapabilities(
  nodes: CapabilityGraphNode[],
  abilities: NonNullable<ResourcePayload["abilities"]>,
  accountId: string,
  employeeId: string,
): CapabilityGraphNode[] {
  const abilityNodes = abilities.map((ability) => ({
    id: `capability:${ability.id}`,
    account_id: accountId,
    employee_id: employeeId,
    key: `ability:${ability.id.replace(/^ability:/, "")}`,
    label: ability.label,
    summary: ability.summary,
    category: ability.category,
    status: ability.status === "degraded" ? "degraded" : ability.status,
    setup_requirement: null,
    trust_level: ability.source === "connector" ? "connector" : ability.source === "policy" ? "native_manager" : "runtime",
    can_run_now: ability.status === "ready" || ability.status === "policy_gated" || ability.status === "degraded",
    sources: ability.source === "connector" ? ["connector"] : ability.source === "policy" ? ["policy"] : ["hermes"],
    proof: {},
  } satisfies CapabilityGraphNode));
  const connectorNodes = nodes.flatMap((node) => {
    const safe = ownerSafeCapability(node);
    return safe ? [{ ...safe, account_id: accountId, employee_id: employeeId }] : [];
  });
  return [...abilityNodes, ...connectorNodes].filter((node, index, all) => all.findIndex((other) => other.key === node.key) === index);
}

function ownerSafeDeliverable(deliverable: WorkDeliverableDescriptor | undefined): WorkDeliverableDescriptor | undefined {
  if (!deliverable) return undefined;
  const refs = Object.fromEntries(
    Object.entries(deliverable.refs ?? {}).filter(([key]) =>
      ["approval_id", "artifact_id", "estimate_id", "estimate_artifact_id", "message_id", "invoice_id", "job_id"].includes(key),
    ),
  );
  return {
    type: deliverable.type === "tool_activity" ? "recommendation" : deliverable.type,
    title: deliverable.title,
    refs,
    leaves_business: deliverable.leaves_business,
    money: deliverable.money,
    reversible: deliverable.reversible,
    acceptance: deliverable.acceptance,
    view: deliverable.view,
  };
}

function ownerSafeDescriptor(descriptor: WorkEventDescriptor | undefined): WorkEventDescriptor | undefined {
  if (!descriptor) return undefined;
  return {
    account_id: descriptor.account_id,
    employee_id: descriptor.employee_id,
    source_event_id: descriptor.source_event_id,
    move: descriptor.move,
    title: descriptor.title,
    summary: descriptor.summary,
    suggested_next_action: descriptor.suggested_next_action,
    preview_url: descriptor.preview_url,
    deliverable: ownerSafeDeliverable(descriptor.deliverable),
    proof: descriptor.proof
      ? Object.fromEntries(Object.entries(descriptor.proof).filter(([key]) => ["run_id", "audit_id", "artifact_id", "approval_id"].includes(key)))
      : undefined,
  };
}

function ownerSafeWorkEvents(rows: WorkEventRow[]): WorkEventRow[] {
  return rows.map((row) => ({ ...row, work_event_descriptor: ownerSafeDescriptor(row.work_event_descriptor) }));
}

function ownerSafeSurfaceEnvelope(envelope: SurfaceEnvelope): SurfaceEnvelope {
  const wasTool = envelope.kind === "tool_activity" || envelope.safety.trust_level === "manager_mcp";
  return {
    ...envelope,
    kind: envelope.kind === "tool_activity" ? "work_event" : envelope.kind,
    render_hints: wasTool
      ? { ...envelope.render_hints, tier: "generic", component: "work_event" }
      : envelope.render_hints,
    safety: {
      ...envelope.safety,
      trust_level: envelope.safety.trust_level === "manager_mcp" ? "native_manager" : envelope.safety.trust_level,
      redacted: envelope.safety.redacted || wasTool,
    },
    proof: {
      audit_id: envelope.proof.audit_id,
      artifact_id: envelope.proof.artifact_id,
      approval_id: envelope.proof.approval_id,
      inbound_event_id: envelope.proof.inbound_event_id,
      preview_link_id: envelope.proof.preview_link_id,
      source_table: envelope.proof.source_table,
      source_id: envelope.proof.source_id,
    },
  };
}

function connectionState(input: {
  connector?: EmployeeSnapshot["connectors"][number];
  capabilities: CapabilityGraphNode[];
  lastEvent?: WorkEventRow | null;
}): ConnectionSurface["state"] {
  const connectorStatus = normalize(input.connector?.status);
  if (input.connector && CONNECTED_STATUSES.has(connectorStatus)) {
    return input.lastEvent || input.connector.last_connector_test_at ? "working" : "connected";
  }
  if (input.connector) return "needs_you";
  if (input.capabilities.some((c) => c.status === "degraded" || c.status === "unavailable")) return "needs_you";
  return "not_connected";
}

function latestEventFor(snapshot: EmployeeSnapshot, def: ConnectionDef): WorkEventRow | null {
  return snapshot.work_events
    .filter((event) => def.providerHints.some((hint) => normalize(event.event_type).includes(hint)))
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0] ?? null;
}

function canDoSummary(def: ConnectionDef, capabilities: CapabilityGraphNode[]): string {
  const ready = capabilities
    .filter((capability) => capability.status === "ready" || capability.status === "policy_gated")
    .map((capability) => capability.label)
    .filter((label) => !/^connect\b/i.test(label))
    .slice(0, 3);
  if (ready.length) return ready.join("; ");
  return def.defaultCanDo;
}

function surfaceForDef(snapshot: EmployeeSnapshot, capabilities: CapabilityGraphNode[], def: ConnectionDef): ConnectionSurface {
  const connector = snapshot.connectors.find((row) => connectorMatches(row, def));
  const defCapabilities = capabilities.filter((capability) => capabilityMatches(capability, def));
  const lastEvent = latestEventFor(snapshot, def);
  const state = connectionState({ connector, capabilities: defCapabilities, lastEvent });
  return {
    id: `connection:${def.id}`,
    label: def.label,
    category: def.category,
    state,
    account_label: connector?.external_label ?? connector?.external_email ?? null,
    health: connector?.last_error ?? (state === "not_connected" ? def.setupRequirement : "Ready"),
    last_event: lastEvent ? `${humanLabel(lastEvent.event_type)} at ${lastEvent.created_at}` : null,
    last_action: connector?.last_connector_test_at ? `Connection tested at ${connector.last_connector_test_at}` : null,
    what_employee_can_do: canDoSummary(def, defCapabilities),
    setup_requirement: state === "not_connected" ? def.setupRequirement : null,
    connector_id: connector?.id ?? null,
    capability_keys: defCapabilities.map((capability) => capability.key),
    proof: connector
      ? { source_table: "connector_accounts", source_id: connector.id, inbound_event_id: lastEvent?.id ?? null }
      : { source_table: "capability_registry", source_id: def.id, inbound_event_id: lastEvent?.id ?? null },
  };
}

function customConnectionSurface(connector: EmployeeSnapshot["connectors"][number]): ConnectionSurface {
  const connected = CONNECTED_STATUSES.has(normalize(connector.status));
  const meta = resolveConnectorMeta(connector.provider || connector.connector_key);
  const directMcp = custodyFor(meta) === "direct_mcp";
  return {
    id: `connection:custom:${connector.id}`,
    label: meta.label || humanLabel(connector.provider || connector.connector_key),
    category: "custom",
    state: connected ? "connected" : "needs_you",
    account_label: connector.external_label ?? connector.external_email ?? null,
    health: connector.last_error ?? (connected ? "Ready" : "Needs attention"),
    last_event: null,
    last_action: connector.last_connector_test_at ? `Connection tested at ${connector.last_connector_test_at}` : null,
    what_employee_can_do: directMcp
      ? "Query this read-only system directly when it helps the work."
      : "Use this connected system through approved Manager capabilities.",
    setup_requirement: connected ? null : "Repair or reconnect this system.",
    connector_id: connector.id,
    capability_keys: [],
    proof: { source_table: "connector_accounts", source_id: connector.id },
  };
}

export function deriveConnectionSurfaces(snapshot: EmployeeSnapshot, capabilities: CapabilityGraphNode[]): ConnectionSurface[] {
  const known = CONNECTION_DEFS.map((def) => surfaceForDef(snapshot, capabilities, def));
  const custom = snapshot.connectors
    .filter((connector) => !CONNECTION_DEFS.some((def) => connectorMatches(connector, def)))
    .map(customConnectionSurface);
  return [...known, ...custom];
}

function resurfaceStatusFrom(value?: string | null): ResurfaceItem["status"] | null {
  const v = normalize(value);
  if (["needs_you", "pending"].includes(v)) return "needs_you";
  if (["blocked", "degraded", "unhealthy", "needs_connection"].includes(v)) return "blocked";
  if (["failed", "error", "unavailable"].includes(v)) return "failed";
  if (["scheduled"].includes(v)) return "scheduled";
  return null;
}

function itemKindFromTask(task: WorkTask): ResurfaceItem["kind"] {
  if (task.type === "approval") return "approval";
  if (task.type === "question") return "question";
  if (task.type === "reminder") return "reminder";
  if (task.type === "connector") return "connector";
  if (task.type === "runtime") return "runtime";
  return "work";
}

function targetFromEnvelope(envelope: SurfaceEnvelope): ResurfaceItem["target"] {
  if (envelope.kind === "approval" && envelope.proof.approval_id) return { kind: "approval", id: envelope.proof.approval_id };
  if ((envelope.kind === "work_event" || envelope.kind === "tool_activity") && envelope.proof.inbound_event_id) return { kind: "work_event", id: envelope.proof.inbound_event_id };
  if (envelope.kind === "connector" && envelope.proof.source_id) return { kind: "connector", id: envelope.proof.source_id };
  if (envelope.kind === "reminder" && envelope.proof.source_id) return { kind: "task", id: `reminder:${envelope.proof.source_id}` };
  return null;
}

export function deriveResurfaceItems(input: {
  tasks: WorkTask[];
  envelopes: SurfaceEnvelope[];
  connections: ConnectionSurface[];
}): ResurfaceItem[] {
  const seen = new Set<string>();
  const items: ResurfaceItem[] = [];
  const add = (item: ResurfaceItem) => {
    const key = item.target ? `${item.target.kind}:${item.target.id}` : item.id;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  for (const task of input.tasks) {
    const status = resurfaceStatusFrom(task.status);
    if (!status) continue;
    add({
      id: `resurface:${task.id}`,
      kind: itemKindFromTask(task),
      title: task.title,
      why: task.summary ?? "This work is not finished yet.",
      status,
      resurface_at: task.created_at ?? null,
      channel: task.type === "connector" || task.type === "runtime" ? "web" : "both",
      source_envelope_id: null,
      target: { kind: "task", id: task.id },
      proof: { source_table: "work_tasks", source_id: task.id },
    });
  }

  for (const envelope of input.envelopes) {
    const status = envelope.safety.requires_approval
      ? "needs_you"
      : resurfaceStatusFrom(envelope.status) ?? (envelope.render_hints.priority === "high" ? "blocked" : null);
    if (!status) continue;
    const target = targetFromEnvelope(envelope);
    add({
      id: `resurface:${envelope.id}`,
      kind: envelope.safety.requires_approval ? "review" : envelope.kind === "connector" ? "connector" : status === "failed" ? "failure" : "work",
      title: envelope.title,
      why: envelope.summary ?? (envelope.safety.requires_approval ? "Owner review is required before this can continue." : "This item needs attention."),
      status,
      resurface_at: envelope.created_at ?? null,
      channel: envelope.kind === "runtime_health" || envelope.kind === "connector" ? "web" : "both",
      source_envelope_id: envelope.id,
      target,
      proof: envelope.proof,
    });
  }

  for (const connection of input.connections) {
    if (connection.state !== "needs_you") continue;
    add({
      id: `resurface:${connection.id}`,
      kind: "connector",
      title: `${connection.label} needs attention`,
      why: connection.health ?? connection.setup_requirement ?? "This connection needs repair before the employee can use it.",
      status: "blocked",
      resurface_at: null,
      channel: "web",
      source_envelope_id: null,
      target: connection.connector_id ? { kind: "connector", id: connection.connector_id } : { kind: "ability", id: connection.id },
      proof: connection.proof,
    });
  }

  return items.slice(0, 25);
}

function toWorkEvents(inboundEvents: Array<Record<string, unknown>>, employeeId: string, accountId: string): WorkEventRow[] {
  return inboundEvents
    .map((event) => ({
      id: String(event.id ?? ""),
      event_type: String(event.event_type ?? "work_event"),
      provider_id: typeof event.provider_id === "string" ? event.provider_id : null,
      status: String(event.status ?? "delivered"),
      created_at: String(event.created_at ?? ""),
      work_event_descriptor: (event.normalized_payload as { work_event_descriptor?: unknown } | undefined)?.work_event_descriptor,
    }))
    .filter((event: { work_event_descriptor?: unknown }) =>
      (event.work_event_descriptor as { employee_id?: string; account_id?: string } | undefined)?.employee_id === employeeId &&
      (event.work_event_descriptor as { employee_id?: string; account_id?: string } | undefined)?.account_id === accountId,
    ) as unknown as WorkEventRow[];
}

function artifactTitle(row: { kind?: string; payload?: { customer_name?: string; job_description?: string; recommended_total?: number } }): string {
  const kind = row.kind ? row.kind.replace(/_/g, " ") : "Output";
  const customer = row.payload?.customer_name;
  return customer ? `${kind} for ${customer}` : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function runtimeHealthSummary(runtime: RuntimeEndpointRow | null, latest: RuntimeHealthRow | null): RuntimeHealthSummary {
  if (!runtime && !latest) {
    return { status: "unknown", message: "No runtime signal yet." };
  }
  const status = (latest?.status ?? (runtime?.health?.status as string | undefined) ?? "unknown") as RuntimeHealthSummary["status"];
  const apiOk = latest?.details?.api_ok ?? runtime?.health?.api_ok;
  const smsPresent = latest?.details?.sms_number_present ?? Boolean(runtime?.sms_number_e164);
  const message =
    status === "healthy" ? "Employee runtime is reachable." :
      status === "degraded" ? "Employee is reachable with a degraded setup." :
        status === "unhealthy" ? "Employee runtime needs attention." :
          "Runtime health has not been checked yet.";
  return {
    status,
    checked_at: latest?.checked_at ?? (runtime?.health?.checked_at as string | undefined) ?? null,
    backend_type: latest?.backend_type ?? runtime?.backend_type ?? null,
    api_ok: typeof apiOk === "boolean" ? apiOk : null,
    sms_number_present: typeof smsPresent === "boolean" ? smsPresent : null,
    message,
  };
}

function buildOutputs(input: {
  employeeId: string;
  artifacts: EmployeeSnapshot["artifacts"];
  stripeInvoices: EmployeeSnapshot["stripe_invoices"];
  messages: EmployeeSnapshot["messages"];
}): WorkOutput[] {
  const artifactOutputs: WorkOutput[] = input.artifacts.map((a) => ({
    id: `artifact:${a.id}`,
    type: "artifact",
    title: artifactTitle(a),
    status: a.storage_ref ? "ready" : "draft",
    created_at: a.created_at,
    href: `/agent/${input.employeeId}/output/${a.id}`,
    artifact_id: a.id,
    summary: a.payload?.job_description,
  }));
  const invoiceOutputs: WorkOutput[] = input.stripeInvoices.map((inv) => ({
    id: `invoice:${inv.id}`,
    type: "invoice",
    title: inv.deposit_amount ? `Deposit invoice $${(Number(inv.deposit_amount) / 100).toFixed(2)}` : "Deposit invoice",
    status: inv.status,
    href: inv.hosted_invoice_url ?? undefined,
    summary: inv.stripe_invoice_id ? "Stripe invoice is tracked." : undefined,
  }));
  const receiptOutputs: WorkOutput[] = input.messages
    .filter((m) => m.direction === "to_owner" && m.provider_id)
    .slice(-5)
    .map((m) => ({
      id: `message:${m.id}`,
      type: "message",
      title: "Delivered message",
      status: m.status,
      created_at: m.created_at,
      summary: m.body,
    }));
  return [...artifactOutputs, ...invoiceOutputs, ...receiptOutputs];
}

function buildTasks(input: {
  approvals: EmployeeSnapshot["approvals"];
  reminders: EmployeeSnapshot["reminders"];
  jobCommitments: EmployeeSnapshot["job_commitments"];
  workEvents: EmployeeSnapshot["work_events"];
  connectors: EmployeeSnapshot["connectors"];
  runtimeHealth: RuntimeHealthSummary;
}): WorkTask[] {
  const approvalTasks: WorkTask[] = input.approvals.map((a) => ({
    id: `approval:${a.id}`,
    type: "approval",
    title: "Decision needed",
    status: "needs_you",
    summary: a.summary,
    created_at: a.expires_at ?? null,
    target_id: a.id,
  }));
  const eventTasks: WorkTask[] = input.workEvents
    .filter((e) => e.work_event_descriptor?.move && e.work_event_descriptor.move !== "notify")
    .map((e) => ({
      id: `work:${e.id}`,
      type: e.work_event_descriptor?.move === "question" ? "question" : "work",
      title: e.work_event_descriptor?.title ?? e.event_type,
      status: e.work_event_descriptor?.move === "question" ? "needs_you" : "in_progress",
      summary: e.work_event_descriptor?.summary,
      created_at: e.created_at,
      target_id: e.id,
    }));
  const reminderTasks: WorkTask[] = input.reminders.map((r) => ({
    id: `reminder:${r.id}`,
    type: "reminder",
    title: r.message ?? "Scheduled reminder",
    status: r.status === "sent" ? "done" : r.status === "failed" ? "failed" : "scheduled",
    summary: r.scheduled_at ? `Scheduled for ${r.scheduled_at}` : undefined,
    created_at: r.scheduled_at,
    target_id: r.id,
  }));
  const jobTasks: WorkTask[] = input.jobCommitments.map((j) => ({
    id: `job:${j.id}`,
    type: "job",
    title: j.customer_ref ? `Job for ${j.customer_ref}` : "Job commitment",
    status: "scheduled",
    summary: j.notes ?? j.start_window ?? undefined,
    created_at: j.start_at ?? j.created_at,
    target_id: j.id,
  }));
  const connectorTasks: WorkTask[] = input.connectors
    .filter((c) => !["connected", "active", "ok"].includes(String(c.status).toLowerCase()))
    .map((c) => ({
      id: `connector:${c.id}`,
      type: "connector",
      title: `${c.provider} needs attention`,
      status: "blocked",
      summary: c.last_error ?? "Reconnect or test this connection.",
      target_id: c.id,
    }));
  const runtimeTask: WorkTask[] = ["unhealthy", "degraded"].includes(input.runtimeHealth.status)
    ? [{ id: "runtime:health", type: "runtime", title: "Employee runtime needs attention", status: input.runtimeHealth.status === "unhealthy" ? "failed" : "blocked", summary: input.runtimeHealth.message }]
    : [];
  return [...approvalTasks, ...eventTasks, ...runtimeTask, ...connectorTasks, ...reminderTasks, ...jobTasks];
}

async function resolveSnapshotAssignment(
  db: SupabaseClient,
  employeeId: string,
  accountId: string,
  explicitAssignmentId?: string | null,
): Promise<string> {
  if (explicitAssignmentId) {
    const scoped = await db.from("employee_assignments")
      .select("id,account_id,status,employee_principals!inner(employee_id)")
      .eq("id", explicitAssignmentId)
      .eq("account_id", accountId)
      .eq("employee_principals.employee_id", employeeId)
      .maybeSingle();
    if (scoped.error) throw scoped.error;
    if (!scoped.data?.id || scoped.data.status !== "active") throw new Error("snapshot_assignment_invalid");
    return String(scoped.data.id);
  }
  const rpc = (db as any).rpc;
  if (typeof rpc !== "function") throw new Error("snapshot_assignment_required");
  const result = await rpc.call(db, "amtech_default_assignment_for_employee_account", {
    p_employee_id: employeeId,
    p_account_id: accountId,
  });
  if (result.error) throw result.error;
  const assignmentId = typeof result.data === "string"
    ? result.data
    : Array.isArray(result.data)
      ? String(result.data[0] ?? "")
      : String(result.data ?? "");
  if (!assignmentId) throw new Error("snapshot_assignment_not_unique");
  return assignmentId;
}

export async function buildEmployeeSnapshot(
  db: SupabaseClient,
  employeeId: string,
  accountId: string,
  explicitAssignmentId?: string | null,
): Promise<EmployeeSnapshot> {
  const assignmentId = await resolveSnapshotAssignment(db, employeeId, accountId, explicitAssignmentId);
  const { data: employeeRaw } = await db
    .from("employees")
    .select("id,name,status,profile_id,web_route,created_at")
    .eq("id", employeeId).eq("account_id", accountId)
    .maybeSingle();
  const employee = (employeeRaw ?? { id: employeeId, name: "Employee", status: "unknown" }) as EmployeeRow;
  const { data: artifacts } = await db
    .from("artifacts")
    .select("id,kind,mime_type,storage_ref,payload,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false }).limit(10);
  const { data: approvals } = await db
    .from("approvals")
    .select("id,action_key,summary,risk_level,refs,resolution,expires_at,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId)
    .is("resolution", null)
    .order("created_at", { ascending: false }).limit(10);
  const { data: messages } = await db
    .from("employee_messages")
    .select("id,direction,source,channel,body,provider_id,status,created_at")
    .eq("employee_id", employeeId).eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false }).limit(20);
  const { data: connectors } = await db
    .from("connector_accounts")
    .select("id,connector_key,provider,status,external_email,external_label,last_connector_test_at,last_error,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId);
  const { data: stripeConnections } = await db
    .from("stripe_connections")
    .select("id,connected_account_id,onboarding_status,charges_enabled,payouts_enabled,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId);
  const stripeConnectionIds = (stripeConnections ?? []).map((row: { id: string }) => row.id);
  const { data: stripeInvoices } = stripeConnectionIds.length
    ? await db
      .from("stripe_invoices")
      .select("id,stripe_connection_id,estimate_id,stripe_invoice_id,deposit_amount,hosted_invoice_url,invoice_pdf,status,created_at")
      .in("stripe_connection_id", stripeConnectionIds).eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false }).limit(10)
    : { data: [] };
  const { data: reminders } = await db
    .from("reminders")
    .select("id,job_id,scheduled_at,channel,status,message,sent_at,provider_id,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId)
    .order("scheduled_at", { ascending: true }).limit(20);
  const { data: jobCommitments } = await db
    .from("job_commitments")
    .select("id,estimate_id,customer_ref,start_at,start_window,notes,source_ref,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false }).limit(20);
  const { data: inboundEvents } = await db
    .from("inbound_events")
    .select("id,source,event_type,provider_id,normalized_payload,status,trace,created_at")
    .eq("account_id", accountId)
    .eq("employee_id", employeeId)
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false }).limit(50);
  const { data: runtimeRaw } = await db
    .from("runtime_endpoints")
    .select("id,backend_type,health,sms_number_e164")
    .eq("employee_id", employeeId).eq("assignment_id", assignmentId)
    .maybeSingle();
  const runtime = runtimeRaw as RuntimeEndpointRow | null;
  const { data: latestHealthRaw } = runtime?.id
    ? await db
      .from("runtime_health_checks")
      .select("status,checked_at,backend_type,details")
      .eq("runtime_endpoint_id", runtime.id).eq("assignment_id", assignmentId)
      .order("checked_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const latestHealth = latestHealthRaw as RuntimeHealthRow | null;

  const snapshotBase = {
    employee_id: employeeId,
    assignment_id: assignmentId,
    account_id: accountId,
    employee: {
      id: employee.id,
      name: employee.name ?? "Employee",
      status: employee.status ?? "unknown",
      profile_id: employee.profile_id ?? null,
      web_route: employee.web_route ?? null,
      created_at: employee.created_at ?? null,
    },
    artifacts: (artifacts ?? []) as EmployeeSnapshot["artifacts"],
    approvals: (approvals ?? []) as EmployeeSnapshot["approvals"],
    messages: ((messages ?? []) as EmployeeSnapshot["messages"]).slice().reverse(),
    connectors: (connectors ?? []) as EmployeeSnapshot["connectors"],
    stripe_connections: (stripeConnections ?? []) as Array<Record<string, unknown>>,
    stripe_invoices: (stripeInvoices ?? []) as EmployeeSnapshot["stripe_invoices"],
    reminders: (reminders ?? []) as EmployeeSnapshot["reminders"],
    job_commitments: (jobCommitments ?? []) as EmployeeSnapshot["job_commitments"],
    work_events: toWorkEvents((inboundEvents ?? []) as Array<Record<string, unknown>>, employeeId, accountId).slice(0, 10),
  };
  const runtime_health = runtimeHealthSummary(runtime, latestHealth);

  const snapshot: EmployeeSnapshot = {
    ...snapshotBase,
    runtime_health,
    outputs: buildOutputs({ employeeId, artifacts: snapshotBase.artifacts, stripeInvoices: snapshotBase.stripe_invoices, messages: snapshotBase.messages }),
    tasks: buildTasks({
      approvals: snapshotBase.approvals,
      reminders: snapshotBase.reminders,
      jobCommitments: snapshotBase.job_commitments,
      workEvents: snapshotBase.work_events,
      connectors: snapshotBase.connectors,
      runtimeHealth: runtime_health,
    }),
  };
  const materialized = materializeEmployeeSnapshot(snapshot);
  const ownerCapabilities = ownerSafeCapabilities(materialized.capabilities, materialized.abilities, accountId, employeeId);
  const connection_surfaces = deriveConnectionSurfaces(snapshot, ownerCapabilities);
  const resurface_items = deriveResurfaceItems({
    tasks: snapshot.tasks ?? [],
    envelopes: materialized.surface_envelopes,
    connections: connection_surfaces,
  });
  return {
    ...snapshot,
    work_events: ownerSafeWorkEvents(snapshot.work_events),
    abilities: materialized.abilities,
    capabilities: ownerCapabilities,
    surface_envelopes: materialized.surface_envelopes.map(ownerSafeSurfaceEnvelope),
    connection_surfaces,
    resurface_items,
  };
}

export interface WorkEventDelta {
  workEvents: WorkEventRow[];
  approvals: Array<{ id: string; resolution: string | null }>;
  nextCursor: TupleCursor;
}

function normalizeCursor(cursor: TupleCursor | string): TupleCursor {
  return typeof cursor === "string" ? { created_at: cursor, id: "" } : cursor;
}

function afterCursor(row: { created_at?: string | null; id?: string | null }, cursor: TupleCursor): boolean {
  const created = row.created_at ?? "";
  if (created > cursor.created_at) return true;
  return created === cursor.created_at && String(row.id ?? "") > cursor.id;
}

function maxCursor(cursor: TupleCursor, rows: Array<{ created_at?: string | null; id?: string | null }>): TupleCursor {
  return rows.reduce<TupleCursor>((max, row) => {
    const created = row.created_at;
    if (created && afterCursor(row, max)) return { created_at: created, id: String(row.id ?? "") };
    return max;
  }, cursor);
}

export function cursorFromSnapshot(snapshot: EmployeeSnapshot): TupleCursor {
  const approvalRows = (snapshot.approvals ?? []) as Array<{ id?: string; created_at?: string | null }>;
  return maxCursor({ created_at: "1970-01-01T00:00:00.000Z", id: "" }, [
    ...(snapshot.work_events ?? []),
    ...approvalRows,
  ]);
}

/** New work events + approvals created after the stable `(created_at,id)` cursor.
 *  Rows at the exact cursor timestamp are over-fetched and filtered here so a
 *  reconnect cannot miss same-millisecond rows or duplicate the last delivered id. */
export async function fetchWorkEventsSince(
  db: SupabaseClient,
  employeeId: string,
  accountId: string,
  cursor: TupleCursor | string,
  explicitAssignmentId?: string | null,
): Promise<WorkEventDelta> {
  const assignmentId = await resolveSnapshotAssignment(db, employeeId, accountId, explicitAssignmentId);
  const c = normalizeCursor(cursor);
  const { data: inboundEvents } = await db
    .from("inbound_events")
    .select("id,source,event_type,provider_id,normalized_payload,status,trace,created_at")
    .eq("account_id", accountId)
    .eq("employee_id", employeeId)
    .eq("assignment_id", assignmentId)
    .gte("created_at", c.created_at)
    .order("created_at", { ascending: true }).limit(50);
  const rows = ((inboundEvents ?? []) as Array<Record<string, unknown> & { id?: string; created_at?: string }>)
    .filter((row) => afterCursor(row, c));
  const workEvents = ownerSafeWorkEvents(toWorkEvents(rows, employeeId, accountId));

  const { data: newApprovals } = await db
    .from("approvals")
    .select("id,resolution,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId).eq("assignment_id", assignmentId)
    .gte("created_at", c.created_at)
    .order("created_at", { ascending: true }).limit(20);
  const approvalRows = ((newApprovals ?? []) as Array<{ id: string; resolution: string | null; created_at?: string }>)
    .filter((row) => afterCursor(row, c));
  const approvals = approvalRows
    .map((a) => ({ id: a.id, resolution: a.resolution ?? null }));

  return { workEvents, approvals, nextCursor: maxCursor(c, [...rows, ...approvalRows]) };
}
