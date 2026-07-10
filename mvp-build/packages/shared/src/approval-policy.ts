/**
 * Approval action_key policy — single source of truth for which action_keys
 * gate a "send"-shaped external action, and which require owner-authenticated
 * (not employee self-) resolution.
 *
 * `action_key` on `request_approval` stays an open string (the LLM employee
 * supplies it at runtime; a hard enum could reject a novel-but-reasonable
 * value) — but every constant that gates behavior derives from the arrays
 * below, so a new money/customer-facing action_key cannot be wired into a
 * send-gate (e.g. `send_email_draft`, `send_deposit_invoice`) without
 * automatically requiring owner-authenticated resolution. Mirrors the
 * `TOOL_NAMES` single-source-of-truth pattern in `tool-contracts.ts`.
 */

// Gmail send_email_draft gate.
export const ESTIMATE_EMAIL_SEND_ACTION_KEY = "send_estimate_email" as const;
export const EMAIL_SEND_ACTION_KEY = "send_email" as const;
export const EMAIL_SEND_ACTION_KEYS = [ESTIMATE_EMAIL_SEND_ACTION_KEY, EMAIL_SEND_ACTION_KEY] as const;

// Stripe send_deposit_invoice gate.
export const INVOICE_SEND_ACTION_KEY = "send_deposit_invoice" as const;
export const GENERIC_INVOICE_SEND_ACTION_KEY = "send_invoice" as const;
export const INVOICE_SEND_ACTION_KEYS = [INVOICE_SEND_ACTION_KEY, GENERIC_INVOICE_SEND_ACTION_KEY] as const;

// set_internal_reminder owner-confirmation gate — NOT a "send" gate (reminders
// are internal/reversible by design), so it is intentionally excluded from
// SEND_GATE_ACTION_KEY_GROUPS / the owner-auth-required set below.
export const REMINDER_ACTION_KEY = "set_job_reminder" as const;

// Default fallback when a delivered work-event descriptor doesn't map to a
// known action_key.
export const DEFAULT_EXTERNAL_ACTION_KEY = "external_system_action" as const;

// Forward-looking/vestigial: no code path creates an approval with these keys
// today. Kept so a future connect/bulk/delete flow is owner-auth-required from
// the day it's wired up, not opt-in later.
export const RESERVED_OWNER_AUTH_ACTION_KEYS = [
  "connect_email",
  "connect_stripe",
  "bulk_external_send",
  "delete_customer_data",
] as const;

/** Every array of action_keys that gates a customer/money-facing "send". Add a
 *  new group here (not a bespoke Set at the call site) and it is AUTOMATICALLY
 *  folded into OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS below. */
export const SEND_GATE_ACTION_KEY_GROUPS = [
  EMAIL_SEND_ACTION_KEYS,
  INVOICE_SEND_ACTION_KEYS,
] as const;

/** Derived, not hand-maintained: every send-gate key plus the reserved
 *  forward-looking keys. Structurally impossible for a send-gate key to be
 *  missing from this set. */
export const OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS: ReadonlySet<string> = new Set<string>([
  ...SEND_GATE_ACTION_KEY_GROUPS.flat(),
  ...RESERVED_OWNER_AUTH_ACTION_KEYS,
]);

/** True when an approval must be resolved by an owner-authenticated path
 *  (web session or signed preview link) rather than the employee's own
 *  `resolve_approval` MCP call. */
export function requiresOwnerAuthenticatedResolution(approval: {
  action_key: string;
  risk_level?: string | null;
}): boolean {
  return approval.risk_level === "high" || OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS.has(approval.action_key);
}
