import type { AbilitySummary, ResourcePayload, WorkOutput, WorkTask } from "../surface-types";
import { groupByJob } from "./group-by-job";

export type SurfaceView = "today" | "chat" | "jobs" | "tasks" | "outputs" | "connected" | "abilities" | "activity" | "settings";

export type PreviewSelection =
  | { kind: "approval"; id: string }
  | { kind: "work_event"; id: string }
  | { kind: "job"; id: string }
  | { kind: "output"; id: string }
  | { kind: "task"; id: string }
  | { kind: "connector"; id: string }
  | { kind: "ability"; id: string }
  | { kind: "message"; id: string };

export interface PreviewItem {
  selection: PreviewSelection;
  title: string;
  eyebrow: string;
  summary?: string;
  status?: string;
}

export function navCounts(res: ResourcePayload): Record<SurfaceView, number> {
  const grouped = groupByJob(res);
  return {
    today: (res.tasks ?? []).filter((t) => t.status === "needs_you" || t.status === "blocked" || t.status === "failed").length,
    chat: res.messages.length,
    jobs: grouped.folders.length,
    tasks: res.tasks?.length ?? 0,
    outputs: res.outputs?.length ?? res.artifacts.length,
    connected: res.connectors.length,
    abilities: res.abilities?.length ?? 0,
    activity: res.work_events.length,
    settings: res.employee ? 1 : 0,
  };
}

export function defaultSelection(res: ResourcePayload): PreviewSelection | null {
  const urgentTask = res.tasks?.find((t) => t.status === "needs_you" || t.status === "blocked" || t.status === "failed");
  if (urgentTask) return { kind: "task", id: urgentTask.id };
  const approval = res.approvals[0];
  if (approval) return { kind: "approval", id: approval.id };
  const output = res.outputs?.[0];
  if (output) return { kind: "output", id: output.id };
  const event = res.work_events[0];
  if (event) return { kind: "work_event", id: event.id };
  const ability = res.abilities?.[0];
  return ability ? { kind: "ability", id: ability.id } : null;
}

export function previewItem(res: ResourcePayload, selection: PreviewSelection | null): PreviewItem | null {
  if (!selection) return null;
  if (selection.kind === "approval") {
    const row = res.approvals.find((a) => a.id === selection.id);
    return row ? { selection, eyebrow: "Approval", title: "Decision needed", summary: row.summary, status: row.risk_level } : null;
  }
  if (selection.kind === "work_event") {
    const row = res.work_events.find((w) => w.id === selection.id);
    return row ? { selection, eyebrow: "Activity", title: row.work_event_descriptor?.title ?? row.event_type, summary: row.work_event_descriptor?.summary, status: row.status } : null;
  }
  if (selection.kind === "output") {
    const row = (res.outputs ?? []).find((o: WorkOutput) => o.id === selection.id);
    return row ? { selection, eyebrow: "Output", title: row.title, summary: row.summary, status: row.status } : null;
  }
  if (selection.kind === "task") {
    const row = (res.tasks ?? []).find((t: WorkTask) => t.id === selection.id);
    return row ? { selection, eyebrow: "Work item", title: row.title, summary: row.summary, status: row.status } : null;
  }
  if (selection.kind === "connector") {
    const row = res.connectors.find((c) => c.id === selection.id);
    return row ? { selection, eyebrow: "Connected", title: labelConnector(row.provider), summary: row.last_error ?? row.external_email ?? undefined, status: row.status } : null;
  }
  if (selection.kind === "ability") {
    const row = (res.abilities ?? []).find((a: AbilitySummary) => a.id === selection.id);
    return row ? { selection, eyebrow: "Ability", title: row.label, summary: row.summary, status: row.status } : null;
  }
  if (selection.kind === "message") {
    const row = res.messages.find((m) => m.id === selection.id);
    return row ? { selection, eyebrow: row.direction === "to_owner" ? "Employee" : "Owner", title: row.direction === "to_owner" ? "Employee message" : "Owner message", summary: row.body, status: row.status } : null;
  }
  if (selection.kind === "job") {
    const row = groupByJob(res).folders.find((f) => f.key === selection.id);
    return row ? { selection, eyebrow: "Job", title: row.title, summary: row.customer, status: "active" } : null;
  }
  return null;
}

export function labelConnector(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("gmail") || v.includes("email")) return "Email";
  if (v.includes("stripe") || v.includes("payment")) return "Payments";
  if (v.includes("drive") || v.includes("file")) return "Files";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusTone(status?: string): "good" | "warn" | "bad" | "quiet" {
  const s = String(status ?? "").toLowerCase();
  if (["ready", "healthy", "connected", "active", "sent", "delivered", "done", "completed", "approved", "success"].includes(s)) return "good";
  if (["needs_connection", "needs_you", "blocked", "degraded", "scheduled", "pending", "draft", "policy_gated"].includes(s)) return "warn";
  if (["failed", "unhealthy", "error", "rejected", "unavailable"].includes(s)) return "bad";
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
    needs_connection: "Needs connection",
    needs_you: "Needs you",
    blocked: "Needs help",
    degraded: "Degraded",
    scheduled: "Scheduled",
    pending: "Waiting",
    draft: "Draft",
    policy_gated: "Asks first",
    failed: "Failed",
    unhealthy: "Unreachable",
    error: "Failed",
    rejected: "Rejected",
    unavailable: "Unavailable",
    provisioning: "Setting up",
    live: "Live",
    retired: "Disabled",
    suspended: "Paused",
  };
  return labels[s] ?? String(status ?? "Unknown").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
