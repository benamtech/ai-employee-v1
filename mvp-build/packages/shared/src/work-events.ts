/**
 * Typed work-event descriptors for the Work Surface.
 *
 * This is the small contract from wiki/MVP/phase-3-generative-ui-reframe.md:
 * provider/tool events become typed notify/question/review work events, and
 * surfaces render known components from this descriptor instead of raw payloads.
 */

export type WorkMove = "notify" | "question" | "review";

/**
 * Connector lifecycle convention (Gmail, Stripe, Drive, ...): a connector action is
 * an `external_system_action` deliverable whose `refs` carry
 * `{ connector_id, provider, status, consent_url? }`. It is ungated (`acknowledge`)
 * because it neither leaves the business nor moves money. Authored by Manager via
 * `emitConnectorEvent` (apps/manager/src/lib/connector-events.ts) through the
 * internal event door, so it renders as a Work Surface card and an SMS line from
 * the one descriptor. A consent_url is a start link, never proof of connection.
 */
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

export interface WorkDeliverableDescriptor {
  type: DeliverableType;
  title: string;
  refs: Record<string, string>;
  leaves_business?: boolean;
  money?: { involved: boolean; amount_cents?: number; currency?: string };
  reversible?: boolean;
  acceptance: AcceptanceAction[];
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
