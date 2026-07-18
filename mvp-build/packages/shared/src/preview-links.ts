/**
 * Signed mobile preview/action contract (Phase 3) + the first slice of the Phase 4
 * materialization layer (`WorkResource`/`WorkAction`).
 *
 * An SMS to the owner carries a signed, scoped, expiring link. Opening it resolves
 * a `WorkResource`: the SAME owner-safe state the web desk renders (built from
 * `buildEmployeeSnapshot`), never a raw provider payload. State-changing links carry
 * a scoped `WorkAction` set (approve/reject/respond/…) resolved by the owner token.
 *
 * This module is a PURE contract — no DB, no crypto. Manager mints the token
 * (lib/signed-links.ts + lib/preview-links.ts) and builds the resource
 * (lib/preview-render.ts); the web review page renders it.
 */
import type { WorkDeliverableDescriptor } from "./work-events.js";

/** Every owner-inspectable resource type a signed link can point at. */
export type PreviewResourceType =
  | "approval"
  | "artifact"
  | "work_event"
  | "task"
  | "connector"
  | "job";

/** Owner-facing actions. `view` is read-only; the rest are state-changing and
 *  stay approval-gated exactly where the underlying deliverable is gated. */
export type PreviewActionType = "approve" | "reject" | "respond" | "acknowledge" | "edit" | "view";

export interface WorkAction {
  action: PreviewActionType;
  label: string;
  style?: "primary" | "danger" | "default";
  /** True when this action resolves a money/customer-facing/dangerous gate. */
  gated?: boolean;
  /** True when the action must be claimed through the C3 durable command/effect kernel before side effects. */
  requires_command_effect?: boolean;
}

/** How the body of a resource should be rendered — the generic renderer tiers.
 *  No tier may relax an approval gate. */
export type WorkResourceBodyKind = "document" | "table" | "media" | "structured" | "text";

export interface WorkResourceField {
  label: string;
  value: string;
}

export interface WorkResourceMedia {
  /** Signed URL or data ref; the web surface decides how to embed. */
  url?: string;
  kind?: "image" | "video" | "gallery";
  caption?: string;
}

/**
 * The owner-safe, surface-agnostic rendering of one unit of employee work. The
 * web review page, an SMS preview, and (later) admin all render this one shape.
 */
export interface WorkResource {
  resource_type: PreviewResourceType;
  resource_id: string;
  /** S3: signature proves possession only; durable resource lookup supplies assignment scope. */
  assignment_id?: string | null;
  title: string;
  subtitle?: string;
  summary?: string;
  fields?: WorkResourceField[];
  /** Present for money-touching resources; owner-formatted (e.g. "$4,200.00"). */
  amount?: string;
  recipient?: string;
  risk?: "low" | "medium" | "high";
  body_kind?: WorkResourceBodyKind;
  /** Self-contained, escaped HTML for a `document` body (from artifact-view). */
  body_html?: string;
  /** Signed URL to open the underlying document/file directly (stored artifacts,
   *  media). Powers the `view` action so it actually opens something. */
  open_url?: string;
  media?: WorkResourceMedia;
  actions: WorkAction[];
  /** Quiet provider receipts (sent/paid/connected) — never raw payloads. */
  receipts?: WorkResourceField[];
  /** True when the link's underlying resource is already resolved/expired. */
  expired?: boolean;
}

const LABELS: Record<PreviewActionType, string> = {
  approve: "Approve",
  reject: "Decline",
  respond: "Reply",
  acknowledge: "Got it",
  edit: "Tweak",
  view: "Open",
};

/**
 * Default owner actions for a resource. Approvals and gated deliverables get
 * approve/decline/reply; everything else is view + reply. Pure — the caller may
 * override, but this keeps the common case declarative.
 */
export function defaultActionsFor(
  resourceType: PreviewResourceType,
  deliverable?: WorkDeliverableDescriptor,
): WorkAction[] {
  const gated = Boolean(
    deliverable &&
      (deliverable.leaves_business ||
        deliverable.money?.involved ||
        deliverable.type === "money_movement" ||
        deliverable.type === "outbound_message"),
  );
  if (resourceType === "approval" || gated) {
    return [
      { action: "approve", label: LABELS.approve, style: "primary", gated: true, requires_command_effect: true },
      { action: "reject", label: LABELS.reject, style: "danger", gated: true, requires_command_effect: true },
      { action: "respond", label: LABELS.respond, style: "default", requires_command_effect: true },
    ];
  }
  if (resourceType === "connector") {
    return [
      { action: "acknowledge", label: LABELS.acknowledge, style: "primary", requires_command_effect: true },
      { action: "respond", label: LABELS.respond, style: "default", requires_command_effect: true },
    ];
  }
  return [
    { action: "respond", label: LABELS.respond, style: "default", requires_command_effect: true },
    { action: "acknowledge", label: LABELS.acknowledge, style: "default", requires_command_effect: true },
  ];
}

/** The scoped action set a signed link is allowed to perform, derived from the
 *  resource's default actions minus the read-only `view`. */
export function actionScopeFor(
  resourceType: PreviewResourceType,
  deliverable?: WorkDeliverableDescriptor,
): PreviewActionType[] {
  return defaultActionsFor(resourceType, deliverable)
    .map((a) => a.action)
    .filter((a) => a !== "view");
}
