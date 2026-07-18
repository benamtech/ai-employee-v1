/**
 * Manager tool return envelope.
 * Spec: ../../../wiki/MVP/old-build-plan/04-manager-tools.md ("Return Envelope").
 *
 * EVERY Manager tool — front-door and live-employee facing — returns this shape.
 * `proof` MUST carry real provider ids when a provider action succeeded
 * (Twilio SID, Gmail message/history id, Stripe account/invoice/webhook id,
 * artifact id/link, approval id, runtime health record). A success without
 * provider proof is not a real success (build-plan "Working Rule").
 */

export type ToolStatus =
  | "ok"
  | "pending"
  | "failed"
  | "denied"
  | "needs_confirmation";

/** A confirmation the owner must resolve before a gated action proceeds. */
export interface RequiredConfirmation {
  /** Stable action key, e.g. "send_estimate_email", "send_invoice". */
  action_key: string;
  /** One-line, owner-facing summary of what will happen if approved. */
  summary: string;
  /** Risk tier — drives how the employee phrases the gate. */
  risk_level: "low" | "medium" | "high";
  /** Refs to the draft/artifact the confirmation is about. */
  refs?: Record<string, string>;
  /** Approval id once a request_approval has been opened. */
  approval_id?: string;
}

/** Provider-backed proof. Free-form but should always include provider ids. */
export type ToolProof = Record<string, string | number | boolean | null>;

export interface ToolEnvelope {
  status: ToolStatus;
  account_id: string | null;
  employee_id: string | null;
  /** Canonical execution scope. Account and employee remain compatibility projections. */
  assignment_id: string | null;
  /** Resources created/changed, e.g. ["employee:emp_123", "runtime_endpoint:..."]. */
  changed_resources: string[];
  /** Provider proof ids. Empty object only when no provider action occurred. */
  proof: ToolProof;
  /** Hint the employee turns into a human-meaningful message; NOT shown raw. */
  user_facing_summary_hint: string;
  /** Set when status === "needs_confirmation". */
  required_confirmation: RequiredConfirmation | null;
  /** The obvious next move (proactive competence), e.g. "offer to send the estimate". */
  next_suggested_action: string;
  /** Audit row id for this call (every tool writes audit). */
  audit_id: string | null;
}

/** Reason codes for failed/denied envelopes. */
export type ToolFailureCode =
  | "not_implemented"
  | "validation_failed"
  | "unauthorized"
  | "provider_error"
  | "signature_invalid"
  | "idempotency_conflict"
  | "entitlement_denied"
  | "account_create_failed"
  | "account_email_already_registered";

export interface ToolEnvelopeMeta {
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  changed_resources?: string[];
  proof?: ToolProof;
  user_facing_summary_hint?: string;
  required_confirmation?: RequiredConfirmation | null;
  next_suggested_action?: string;
  audit_id?: string | null;
}

function base(meta: ToolEnvelopeMeta): ToolEnvelope {
  return {
    status: "ok",
    account_id: meta.account_id ?? null,
    employee_id: meta.employee_id ?? null,
    assignment_id: meta.assignment_id ?? null,
    changed_resources: meta.changed_resources ?? [],
    proof: meta.proof ?? {},
    user_facing_summary_hint: meta.user_facing_summary_hint ?? "",
    required_confirmation: meta.required_confirmation ?? null,
    next_suggested_action: meta.next_suggested_action ?? "",
    audit_id: meta.audit_id ?? null,
  };
}

export function ok(meta: ToolEnvelopeMeta): ToolEnvelope {
  return { ...base(meta), status: "ok" };
}

export function pending(meta: ToolEnvelopeMeta): ToolEnvelope {
  return { ...base(meta), status: "pending" };
}

export function needsConfirmation(
  confirmation: RequiredConfirmation,
  meta: ToolEnvelopeMeta = {},
): ToolEnvelope {
  return {
    ...base(meta),
    status: "needs_confirmation",
    required_confirmation: confirmation,
  };
}

export function failed(
  code: ToolFailureCode,
  message: string,
  meta: ToolEnvelopeMeta = {},
): ToolEnvelope {
  return {
    ...base(meta),
    status: "failed",
    user_facing_summary_hint: meta.user_facing_summary_hint ?? message,
    proof: { ...(meta.proof ?? {}), failure_code: code, failure_message: message },
  };
}

export function denied(message: string, meta: ToolEnvelopeMeta = {}): ToolEnvelope {
  return {
    ...base(meta),
    status: "denied",
    user_facing_summary_hint: meta.user_facing_summary_hint ?? message,
  };
}

/**
 * Phase 0 stub helper: declares a tool's contract while its body is unbuilt.
 * Returns a `failed/not_implemented` envelope so callers compile and route,
 * but no fake provider success is ever produced (forbidden-MVP-language rule).
 */
export function notImplemented(tool: string, meta: ToolEnvelopeMeta = {}): ToolEnvelope {
  return failed("not_implemented", `${tool} is not implemented yet (Phase 0 stub).`, meta);
}
