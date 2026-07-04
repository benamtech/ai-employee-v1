/**
 * Typed work-event descriptors for the Work Surface.
 *
 * This is the small contract from wiki/MVP/phase-3-generative-ui-reframe.md:
 * provider/tool events become typed notify/question/review work events, and
 * surfaces render known components from this descriptor instead of raw payloads.
 */

export type WorkMove = "notify" | "question" | "review";

export type DeliverableType =
  | "document"
  | "outbound_message"
  | "money_movement"
  | "dataset_report"
  | "recommendation"
  | "schedule_mutation"
  | "structured_record_write"
  | "media_asset"
  | "job_folder"
  | "external_system_action"
  | "plan";

export type AcceptanceAction = "approve" | "edit" | "reject" | "respond" | "acknowledge";

/**
 * Structured, owner-safe presentation data the agent may attach to a deliverable.
 * Manager compiles a `view` into an AMTECH-owned MCP-UI `ui://` resource
 * (lib/ui-resources.ts). A `view` is DATA ONLY — it never changes what gates
 * (validateWorkEventDescriptor enforces that separately).
 */
export interface WorkTableView {
  kind: "table";
  columns: string[];
  rows: string[][];
  /** Offer a single bulk-accept action across all rows (still gated). */
  bulk_accept?: boolean;
}
export interface WorkScheduleView {
  kind: "schedule";
  span: "day" | "week";
  slots: Array<{ when: string; label: string }>;
}
export interface WorkDiffView {
  kind: "diff";
  before: Record<string, string>;
  after: Record<string, string>;
}
export interface WorkFormField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  value?: string;
  options?: string[];
  required?: boolean;
}
export interface WorkFormView {
  kind: "form";
  fields: WorkFormField[];
}
export type WorkView = WorkTableView | WorkScheduleView | WorkDiffView | WorkFormView;

/**
 * Structural type for an MCP-UI resource (`@mcp-ui/server` `createUIResource`
 * output). Kept dependency-free here so `packages/shared` stays a pure contract;
 * Manager produces it and the Work Surface renders it via `@mcp-ui/client`.
 */
export interface UiResourceEnvelope {
  type: "resource";
  resource: { uri: string; mimeType: string; text?: string; blob?: string };
}

export interface WorkDeliverableDescriptor {
  type: DeliverableType;
  title: string;
  refs: Record<string, string>;
  leaves_business?: boolean;
  money?: { involved: boolean; amount_cents?: number; currency?: string };
  reversible?: boolean;
  acceptance: AcceptanceAction[];
  /** Agent-authored structured data for a rich renderer (compiled to `ui_resource`). */
  view?: WorkView;
  /** Manager-compiled MCP-UI resource; attached at delivery, not by the agent. */
  ui_resource?: UiResourceEnvelope;
}

export interface WorkEventDescriptor {
  account_id: string;
  employee_id: string;
  source_event_id?: string;
  move: WorkMove;
  title: string;
  summary: string;
  deliverable?: WorkDeliverableDescriptor;
  suggested_next_action?: string;
  proof?: Record<string, string>;
}

export interface WorkEventConformance {
  ok: boolean;
  reason?: string;
}

export function workDeliverableNeedsGate(d: WorkDeliverableDescriptor | undefined): boolean {
  return Boolean(d && (d.leaves_business || d.money?.involved || d.type === "money_movement" || d.type === "outbound_message"));
}

/** Shape-check an optional agent-authored view. Presentation only — a malformed
 *  view is rejected, but a well-formed one can never relax the gate. */
export function validateWorkView(view: WorkView | undefined): WorkEventConformance {
  if (!view) return { ok: true };
  switch (view.kind) {
    case "table":
      if (!Array.isArray(view.columns) || !view.columns.length) return { ok: false, reason: "view_table_columns" };
      if (!Array.isArray(view.rows)) return { ok: false, reason: "view_table_rows" };
      if (view.rows.some((row) => !Array.isArray(row) || row.length !== view.columns.length)) return { ok: false, reason: "view_table_row_shape" };
      return { ok: true };
    case "schedule":
      if (view.span !== "day" && view.span !== "week") return { ok: false, reason: "view_schedule_span" };
      if (!Array.isArray(view.slots)) return { ok: false, reason: "view_schedule_slots" };
      if (view.slots.some((s) => !s || !s.when?.trim() || !s.label?.trim())) return { ok: false, reason: "view_schedule_slot_shape" };
      return { ok: true };
    case "diff":
      if (typeof view.before !== "object" || typeof view.after !== "object") return { ok: false, reason: "view_diff_shape" };
      return { ok: true };
    case "form":
      if (!Array.isArray(view.fields) || !view.fields.length) return { ok: false, reason: "view_form_fields" };
      if (view.fields.some((f) => !f || !f.name?.trim() || !f.label?.trim())) return { ok: false, reason: "view_form_field_shape" };
      return { ok: true };
    default:
      return { ok: false, reason: "view_unknown_kind" };
  }
}

export function validateWorkEventDescriptor(descriptor: WorkEventDescriptor): WorkEventConformance {
  if (!descriptor.account_id || !descriptor.employee_id) return { ok: false, reason: "missing_owner_context" };
  if (!descriptor.title.trim() || !descriptor.summary.trim()) return { ok: false, reason: "missing_owner_copy" };
  const d = descriptor.deliverable;
  if (!d) return { ok: true };
  if (!d.title.trim()) return { ok: false, reason: "missing_deliverable_title" };
  if (!d.acceptance.length) return { ok: false, reason: "missing_acceptance" };
  const needsGate = workDeliverableNeedsGate(d);
  if (needsGate && !d.acceptance.some((a) => a === "approve" || a === "respond")) {
    return { ok: false, reason: "gated_deliverable_without_gate" };
  }
  const viewCheck = validateWorkView(d.view);
  if (!viewCheck.ok) return viewCheck;
  return { ok: true };
}

export function assertWorkEventDescriptor(descriptor: WorkEventDescriptor): WorkEventDescriptor {
  const result = validateWorkEventDescriptor(descriptor);
  if (!result.ok) throw new Error(`work_event_nonconformant:${result.reason}`);
  return descriptor;
}

export function renderWorkEventSms(descriptor: WorkEventDescriptor): string {
  const action = descriptor.suggested_next_action?.trim();
  const base = `${descriptor.title}: ${descriptor.summary}`.trim();
  return action ? `${base} ${action}` : base;
}
