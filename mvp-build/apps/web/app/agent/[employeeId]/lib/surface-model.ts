import type { AbilitySummary, ConnectionSurface, ResourcePayload, ResurfaceItem, WorkOutput, WorkTask } from "../surface-types";
import type { CapabilityGraphNode, SurfaceEnvelope, WorkResource } from "@amtech/shared";
import { groupByJob } from "./group-by-job";

export type SurfaceView = "today" | "ask" | "work" | "library" | "connected" | "history" | "settings";

export type PreviewSelection =
  | { kind: "resource"; resource: WorkResource }
  | { kind: "envelope"; id: string }
  | { kind: "approval"; id: string }
  | { kind: "work_event"; id: string }
  | { kind: "job"; id: string }
  | { kind: "output"; id: string }
  | { kind: "task"; id: string }
  | { kind: "connection"; id: string }
  | { kind: "connector"; id: string }
  | { kind: "ability"; id: string }
  | { kind: "capability"; id: string }
  | { kind: "message"; id: string };

export interface PreviewItem {
  selection: PreviewSelection;
  title: string;
  eyebrow: string;
  summary?: string;
  status?: string;
  resource?: WorkResource;
  envelope?: SurfaceEnvelope;
}

export function navCounts(res: ResourcePayload): Record<SurfaceView, number> {
  const grouped = groupByJob(res);
  const attention = attentionItems(res).length;
  return {
    today: attention,
    ask: res.messages.length,
    work: grouped.folders.length + (res.tasks ?? []).filter((task) => task.status !== "done").length,
    library: res.outputs?.length ?? res.artifacts.length,
    connected: res.connection_surfaces?.length ?? res.connectors.length,
    history: res.work_events.length,
    settings: res.employee ? 1 : 0,
  };
}

export function attentionItems(res: ResourcePayload): ResurfaceItem[] {
  const resurfaced = (res.resurface_items ?? []).filter((item) => (
    item.status === "needs_you" || item.status === "blocked" || item.status === "failed"
  ));
  if (resurfaced.length) return resurfaced;
  return (res.tasks ?? [])
    .filter((task) => task.status === "needs_you" || task.status === "blocked" || task.status === "failed")
    .map((task) => ({
      id: `task:${task.id}`,
      kind: task.type === "approval" ? "approval" : task.type === "connector" ? "connector" : "work",
      title: task.title,
      why: task.summary ?? "Avery needs you to look at this.",
      status: task.status === "needs_you" ? "needs_you" : task.status === "failed" ? "failed" : "blocked",
      channel: "web",
      target: { kind: "task", id: task.id },
      proof: { source_table: "derived", source_id: task.id },
    }));
}

export function defaultSelection(res: ResourcePayload): PreviewSelection | null {
  const firstAttention = attentionItems(res)[0];
  if (firstAttention) return selectionForResurface(firstAttention);
  const firstEnvelope = res.surface_envelopes?.find((envelope) => envelope.resource);
  if (firstEnvelope) return { kind: "envelope", id: firstEnvelope.id };
  const approval = res.approvals[0];
  if (approval) return { kind: "approval", id: approval.id };
  const output = res.outputs?.[0];
  if (output) return { kind: "output", id: output.id };
  const connection = res.connection_surfaces?.[0];
  if (connection) return { kind: "connection", id: connection.id };
  const event = res.work_events[0];
  if (event) return { kind: "work_event", id: event.id };
  return null;
}

export function previewItem(res: ResourcePayload, selection: PreviewSelection | null): PreviewItem | null {
  if (!selection) return null;
  if (selection.kind === "resource") {
    return { selection, eyebrow: labelResourceType(selection.resource.resource_type), title: selection.resource.title, summary: selection.resource.summary, resource: selection.resource };
  }
  if (selection.kind === "envelope") {
    const envelope = res.surface_envelopes?.find((item) => item.id === selection.id);
    return envelope ? { selection, eyebrow: labelEnvelopeKind(envelope.kind), title: envelope.title, summary: envelope.summary, status: envelope.status, envelope, resource: envelope.resource } : null;
  }
  if (selection.kind === "approval") {
    const row = res.approvals.find((a) => a.id === selection.id);
    return row ? { selection, eyebrow: "Approval", title: "Exact permission needed", summary: row.summary, status: row.risk_level, resource: resourceFromApproval(row) } : null;
  }
  if (selection.kind === "work_event") {
    const row = res.work_events.find((w) => w.id === selection.id);
    const descriptor = row?.work_event_descriptor;
    return row ? {
      selection,
      eyebrow: "History",
      title: descriptor?.title ?? ownerize(row.event_type),
      summary: descriptor?.summary,
      status: row.status,
      resource: descriptor ? resourceFromDescriptor(row.id, descriptor) : undefined,
    } : null;
  }
  if (selection.kind === "output") {
    const row = (res.outputs ?? []).find((o: WorkOutput) => o.id === selection.id);
    return row ? { selection, eyebrow: "Library", title: row.title, summary: row.summary, status: row.status, resource: resourceFromOutput(row) } : null;
  }
  if (selection.kind === "task") {
    const row = (res.tasks ?? []).find((t: WorkTask) => t.id === selection.id);
    const approval = row?.type === "approval" && row.target_id ? res.approvals.find((a) => a.id === row.target_id) : null;
    return row ? {
      selection,
      eyebrow: row.type === "approval" ? "Needs you" : "Work item",
      title: row.title,
      summary: row.summary,
      status: row.status,
      resource: approval ? resourceFromApproval(approval) : resourceFromTask(row),
    } : null;
  }
  if (selection.kind === "connection") {
    const row = (res.connection_surfaces ?? []).find((c: ConnectionSurface) => c.id === selection.id);
    return row ? { selection, eyebrow: "Connected account", title: row.label, summary: row.health ?? row.what_employee_can_do, status: row.state, resource: resourceFromConnection(row) } : null;
  }
  if (selection.kind === "connector") {
    const row = res.connectors.find((c) => c.id === selection.id);
    return row ? { selection, eyebrow: "Connected account", title: labelConnector(row.provider), summary: row.last_error ?? row.external_email ?? undefined, status: row.status } : null;
  }
  if (selection.kind === "ability") {
    const row = (res.abilities ?? []).find((a: AbilitySummary) => a.id === selection.id);
    return row ? { selection, eyebrow: "Ability", title: row.label, summary: row.summary, status: row.status, resource: resourceFromAbility(row) } : null;
  }
  if (selection.kind === "capability") {
    const row = (res.capabilities ?? []).find((a: CapabilityGraphNode) => a.id === selection.id);
    return row ? { selection, eyebrow: "Ability", title: row.label, summary: row.summary, status: row.status, resource: resourceFromCapability(row) } : null;
  }
  if (selection.kind === "message") {
    const row = res.messages.find((m) => m.id === selection.id);
    return row ? { selection, eyebrow: row.direction === "to_owner" ? "Avery" : "Owner", title: row.direction === "to_owner" ? "Avery said" : "You said", summary: row.body, status: row.status } : null;
  }
  if (selection.kind === "job") {
    const row = groupByJob(res).folders.find((f) => f.key === selection.id);
    return row ? { selection, eyebrow: "Work folder", title: row.title, summary: row.customer, status: "active" } : null;
  }
  return null;
}

export function selectionForResurface(item: ResurfaceItem): PreviewSelection {
  if (item.source_envelope_id) return { kind: "envelope", id: item.source_envelope_id };
  if (item.target) return item.target;
  return { kind: "task", id: item.id };
}

export function labelConnector(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("gmail") || v.includes("email")) return "Email";
  if (v.includes("stripe") || v.includes("payment")) return "Payments";
  if (v.includes("qbo") || v.includes("quickbooks") || v.includes("accounting")) return "Accounting";
  if (v.includes("drive") || v.includes("file")) return "Files";
  return ownerize(value);
}

export function statusTone(status?: string): "good" | "warn" | "bad" | "quiet" {
  const s = String(status ?? "").toLowerCase();
  if (["ready", "healthy", "connected", "working", "active", "sent", "delivered", "done", "completed", "approved", "success", "paid"].includes(s)) return "good";
  if (["not_connected", "needs_connection", "needs_info", "needs_you", "blocked", "degraded", "scheduled", "pending", "draft", "policy_gated", "waiting", "needs_review"].includes(s)) return "warn";
  if (["failed", "unhealthy", "error", "rejected", "unavailable", "expired"].includes(s)) return "bad";
  return "quiet";
}

export function labelStatus(status?: string): string {
  const s = String(status ?? "").toLowerCase();
  const labels: Record<string, string> = {
    ready: "Ready",
    healthy: "Reachable",
    connected: "Connected",
    active: "Active",
    sent: "Sent",
    delivered: "Delivered",
    done: "Done",
    completed: "Completed",
    approved: "Approved",
    success: "Ready",
    paid: "Paid",
    needs_connection: "Needs connection",
    needs_info: "Needs info",
    needs_you: "Needs you",
    blocked: "Needs help",
    degraded: "Degraded",
    scheduled: "Scheduled",
    pending: "Waiting",
    waiting: "Waiting",
    draft: "Draft",
    policy_gated: "Asks first",
    failed: "Failed",
    unhealthy: "Unreachable",
    error: "Failed",
    rejected: "Rejected",
    unavailable: "Unavailable",
    not_connected: "Not connected",
    working: "Working",
    provisioning: "Setting up",
    live: "Live",
    retired: "Disabled",
    suspended: "Paused",
    needs_review: "Needs review",
  };
  return labels[s] ?? ownerize(String(status ?? "Unknown"));
}

export function ownerize(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resourceFromApproval(row: ResourcePayload["approvals"][number]): WorkResource {
  const actionLabel = approvalActionLabel(row.action_key, row.risk_level);
  return {
    resource_type: "approval",
    resource_id: row.id,
    title: "Avery needs your say",
    subtitle: riskLabel(row.risk_level),
    summary: row.summary,
    risk: row.risk_level.includes("money") ? "high" : "medium",
    fields: [
      { label: "Permission", value: ownerize(row.action_key) },
      ...(row.expires_at ? [{ label: "Expires", value: formatDate(row.expires_at) }] : []),
    ],
    actions: [
      { action: "approve", label: actionLabel, style: "primary", gated: true },
      { action: "reject", label: "Decline", style: "danger", gated: true },
      { action: "respond", label: "Tweak with Avery", style: "default" },
    ],
  };
}

function resourceFromDescriptor(id: string, descriptor: NonNullable<ResourcePayload["work_events"][number]["work_event_descriptor"]>): WorkResource {
  const deliverable = descriptor.deliverable;
  if (!deliverable) {
    return {
      resource_type: "work_event",
      resource_id: id,
      title: descriptor.title,
      subtitle: "Work update",
      summary: descriptor.summary,
      fields: descriptor.suggested_next_action ? [{ label: "Next", value: descriptor.suggested_next_action }] : undefined,
      actions: [
        { action: "respond", label: "Reply", style: "default" },
        { action: "acknowledge", label: "Got it", style: "default" },
      ],
    };
  }
  const gated = Boolean(deliverable.leaves_business || deliverable.money?.involved);
  return {
    resource_type: "work_event",
    resource_id: id,
    title: descriptor.title,
    subtitle: ownerize(deliverable.type),
    summary: descriptor.summary,
    amount: deliverable.money?.amount_cents ? formatMoney(deliverable.money.amount_cents, deliverable.money.currency) : undefined,
    risk: gated ? (deliverable.money?.involved ? "high" : "medium") : undefined,
    fields: [
      { label: "Work", value: deliverable.title },
      ...(descriptor.suggested_next_action ? [{ label: "Next", value: descriptor.suggested_next_action }] : []),
    ],
    actions: gated ? [
      { action: "approve", label: deliverable.money?.involved ? "Approve money step" : "Approve send", style: "primary", gated: true },
      { action: "reject", label: "Decline", style: "danger", gated: true },
      { action: "respond", label: "Tweak with Avery", style: "default" },
    ] : [
      { action: "respond", label: "Reply", style: "default" },
      { action: "acknowledge", label: "Got it", style: "default" },
    ],
  };
}

function resourceFromOutput(row: WorkOutput): WorkResource {
  return {
    resource_type: "artifact",
    resource_id: row.artifact_id ?? row.id,
    title: row.title,
    subtitle: ownerize(row.type),
    summary: row.summary,
    open_url: row.href,
    fields: [
      { label: "Status", value: labelStatus(row.status) },
      ...(row.created_at ? [{ label: "Made", value: formatDate(row.created_at) }] : []),
    ],
    actions: [
      ...(row.href ? [{ action: "view" as const, label: "Open work surface", style: "primary" as const }] : []),
      { action: "respond", label: "Ask Avery about this", style: "default" },
    ],
  };
}

function resourceFromTask(row: WorkTask): WorkResource {
  return {
    resource_type: "task",
    resource_id: row.id,
    title: row.title,
    subtitle: ownerize(row.type),
    summary: row.summary,
    fields: [
      { label: "State", value: labelStatus(row.status) },
      ...(row.created_at ? [{ label: "Since", value: formatDate(row.created_at) }] : []),
    ],
    actions: [{ action: "respond", label: "Reply to Avery", style: "default" }],
  };
}

function resourceFromConnection(row: ConnectionSurface): WorkResource {
  return {
    resource_type: "connector",
    resource_id: row.connector_id ?? row.id,
    title: row.label,
    subtitle: "Connected account",
    summary: row.what_employee_can_do,
    fields: [
      { label: "State", value: labelStatus(row.state) },
      ...(row.account_label ? [{ label: "Account", value: row.account_label }] : []),
      ...(row.health ? [{ label: "Health", value: row.health }] : []),
      ...(row.setup_requirement ? [{ label: "Needs", value: row.setup_requirement }] : []),
    ],
    receipts: [
      ...(row.last_event ? [{ label: "Last event", value: row.last_event }] : []),
      ...(row.last_action ? [{ label: "Last action", value: row.last_action }] : []),
    ],
    actions: [
      { action: "respond", label: row.state === "connected" || row.state === "working" ? "Ask what Avery can do" : "Repair with Avery", style: "default" },
      { action: "acknowledge", label: "Got it", style: "default" },
    ],
  };
}

function resourceFromAbility(row: AbilitySummary): WorkResource {
  return {
    resource_type: "task",
    resource_id: row.id,
    title: row.label,
    subtitle: "Ability",
    summary: row.summary,
    fields: [
      { label: "Area", value: ownerize(row.category) },
      { label: "State", value: labelStatus(row.status) },
    ],
    actions: [{ action: "respond", label: "Ask Avery to use this", style: "default" }],
  };
}

function resourceFromCapability(row: CapabilityGraphNode): WorkResource {
  return {
    resource_type: "task",
    resource_id: row.id,
    title: row.label,
    subtitle: "Ability",
    summary: row.summary,
    fields: [
      { label: "Area", value: ownerize(row.category) },
      { label: "State", value: labelStatus(row.status) },
      { label: "Can run now", value: row.can_run_now ? "Yes" : "Not yet" },
      ...(row.setup_requirement ? [{ label: "Needs", value: row.setup_requirement }] : []),
    ],
    actions: [{ action: "respond", label: "Ask Avery about this", style: "default" }],
  };
}

function labelResourceType(type: WorkResource["resource_type"]): string {
  return ownerize(type);
}

function labelEnvelopeKind(kind: SurfaceEnvelope["kind"]): string {
  if (kind === "work_event") return "Work";
  if (kind === "runtime_health") return "Employee status";
  return ownerize(kind);
}

function riskLabel(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("money")) return "Money approval";
  if (v.includes("customer")) return "Customer-facing approval";
  return "Owner approval";
}

function approvalActionLabel(actionKey: string, riskLevel: string): string {
  const key = `${actionKey} ${riskLevel}`.toLowerCase();
  if (key.includes("invoice") || key.includes("deposit") || key.includes("money") || key.includes("payment")) return "Approve payment link";
  if (key.includes("publish")) return "Approve publish";
  if (key.includes("share")) return "Approve sharing";
  if (key.includes("accounting") || key.includes("quickbooks") || key.includes("bookkeeping") || key.includes("write")) return "Save after approval";
  if (key.includes("send") || key.includes("customer") || key.includes("email") || key.includes("reply")) return "Approve send";
  return "Approve this";
}

function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
