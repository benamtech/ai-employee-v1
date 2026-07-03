/**
 * Manager tool contracts — the full surface from 04-manager-tools.md.
 * Phase 0 declares input types + the tool-name registry here (shared by the
 * front door, the live employee, and the Manager). Phase 1 implements the
 * identity + provisioning + brain tools; the rest are typed seams whose
 * Phase-0 implementations return `notImplemented()`.
 *
 * Tool rules (enforced structurally elsewhere): every connector setup includes
 * a test; every external send needs an approval_id; every webhook verifies
 * signature; every tool writes audit; every provider success returns proof.
 */

import type { OnboardingManifest } from "./manifest.js";
import type { WorkEventDescriptor } from "./work-events.js";

/** Every Manager tool name (the complete 04-manager-tools.md surface). */
export const TOOL_NAMES = [
  // Identity & provisioning (Phase 1)
  "send_phone_verification",
  "check_phone_code",
  "create_account",
  "provision_employee",
  "get_provisioning_status",
  // Estimate & artifact (Phase 2)
  "get_business_brain",
  "save_business_brain_fact",
  "create_estimate_artifact",
  "render_estimate_pdf",
  "create_signed_artifact_link",
  // Approval (primitive defined Phase 0; consumers Phase 2+)
  "request_approval",
  "resolve_approval",
  "get_approval_status",
  // Gmail (Phase 3)
  "connect_email",
  "complete_gmail_oauth",
  "run_email_connector_test",
  "create_email_draft",
  "send_email_draft",
  "start_email_listener",
  "renew_email_watch",
  "renew_expiring_watches",
  "handle_gmail_pubsub",
  "sync_gmail_history",
  // Stripe (Phase 4)
  "connect_stripe",
  "create_stripe_account_link",
  "complete_stripe_onboarding",
  "create_deposit_invoice",
  "send_deposit_invoice",
  "handle_stripe_webhook",
  "get_stripe_connection_status",
  // Event & reminder (Phase 5 / event mesh)
  "send_employee_event",
  "set_internal_reminder",
  "get_reminders",
  "dispatch_due_reminders",
  "dispatch_daily_briefs",
  "replay_gmail_history_range",
  "replay_stripe_event",
  "relink_email_thread",
  "mark_event_duplicate",
  "redeliver_employee_event",
  "suppress_event_source",
  "regenerate_stripe_onboarding_link",
  // Entitlement & usage (default-allow in MVP)
  "get_entitlements",
  "record_usage",
  "request_upgrade",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

/** Which phase implements each tool (drives Phase-0 stub status). */
export const TOOL_PHASE: Record<ToolName, 1 | 2 | 3 | 4 | 5> = {
  send_phone_verification: 1,
  check_phone_code: 1,
  create_account: 1,
  provision_employee: 1,
  get_provisioning_status: 1,
  get_business_brain: 1, // used at seed time in Phase 1; full estimate use Phase 2
  save_business_brain_fact: 1,
  create_estimate_artifact: 2,
  render_estimate_pdf: 2,
  create_signed_artifact_link: 2,
  request_approval: 2,
  resolve_approval: 2,
  get_approval_status: 2,
  connect_email: 3,
  complete_gmail_oauth: 3,
  run_email_connector_test: 3,
  create_email_draft: 3,
  send_email_draft: 3,
  start_email_listener: 3,
  renew_email_watch: 3,
  renew_expiring_watches: 5,
  handle_gmail_pubsub: 3,
  sync_gmail_history: 3,
  connect_stripe: 4,
  create_stripe_account_link: 4,
  complete_stripe_onboarding: 4,
  create_deposit_invoice: 4,
  send_deposit_invoice: 4,
  handle_stripe_webhook: 4,
  get_stripe_connection_status: 4,
  send_employee_event: 5,
  set_internal_reminder: 5,
  get_reminders: 5,
  dispatch_due_reminders: 5,
  dispatch_daily_briefs: 5,
  replay_gmail_history_range: 5,
  replay_stripe_event: 5,
  relink_email_thread: 5,
  mark_event_duplicate: 5,
  redeliver_employee_event: 5,
  suppress_event_source: 5,
  regenerate_stripe_onboarding_link: 5,
  get_entitlements: 1,
  record_usage: 1,
  request_upgrade: 1,
};

// --- Phase 1 tool input types (the only ones with real bodies in Phase 1) ----

export interface SendPhoneVerificationInput {
  phone_e164: string;
  session_id: string;
}

export interface CheckPhoneCodeInput {
  verification_attempt_id: string;
  code: string;
}

export interface CreateAccountInput {
  email: string;
  password_or_auth_ref: string;
  verified_phone_ref: string;
  business_display_name: string;
  timezone: string;
}

export interface ProvisionEmployeeInput {
  account_id: string;
  manifest: OnboardingManifest;
  transcript_ref?: string;
  idempotency_key: string;
}

export interface GetProvisioningStatusInput {
  account_id: string;
  employee_id_or_job_id: string;
}

// --- Phase 2 tool input types ------------------------------------------------

export interface EstimateLineItem {
  label: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  confidence?: "high" | "medium" | "low";
}

export interface EstimatePayload {
  customer_name?: string;
  customer_email?: string;
  job_description: string;
  line_items: EstimateLineItem[];
  assumptions: string[];
  low_confidence_flags?: string[];
  owner_price_hint?: number;
  recommended_total: number;
  approved_total?: number;
  deposit_percent?: number;
  deposit_amount?: number;
  source_refs?: string[];
}

export interface CreateEstimateArtifactInput {
  account_id: string;
  employee_id: string;
  estimate_payload: EstimatePayload;
  created_run?: string;
}

export interface RenderEstimatePdfInput {
  account_id: string;
  employee_id: string;
  artifact_id: string;
  filename: string;
  pdf_base64: string;
  checksum_sha256?: string;
}

export interface CreateSignedArtifactLinkInput {
  account_id: string;
  employee_id: string;
  artifact_id: string;
  audience?: string;
  expiry_seconds?: number;
}

export interface RequestApprovalInput {
  account_id: string;
  employee_id: string;
  action_key: string;
  summary: string;
  risk_level: "low" | "medium" | "high";
  refs?: Record<string, string>;
  channel?: "sms" | "web";
  expiry_seconds?: number;
}

export interface ResolveApprovalInput {
  account_id: string;
  employee_id: string;
  approval_id: string;
  owner_response: "approved" | "rejected" | "yes" | "no";
  channel?: "sms" | "web";
}

export interface GetApprovalStatusInput {
  account_id: string;
  employee_id: string;
  approval_id: string;
}

// --- Phase 3 Gmail groundwork input types -----------------------------------

export interface ConnectEmailInput {
  account_id: string;
  employee_id: string;
  provider: "gmail";
  requested_scopes: string[];
  redirect_uri?: string;
}

export interface CompleteGmailOAuthInput {
  state: string;
  code: string;
}

export interface RunEmailConnectorTestInput {
  account_id: string;
  employee_id: string;
  connector_id: string;
}

export interface CreateEmailDraftInput {
  account_id: string;
  employee_id: string;
  to: string;
  subject: string;
  body: string;
  attachment_artifact_ids: string[];
  thread_ref?: string;
}

export interface SendEmailDraftInput {
  account_id: string;
  employee_id: string;
  draft_id: string;
  approval_id: string;
}

export interface StartEmailListenerInput {
  account_id: string;
  employee_id: string;
  connector_id?: string;
}

export interface HandleGmailPubsubInput {
  /** Decoded Pub/Sub notification (Manager decodes the envelope before calling). */
  email_address: string;
  history_id: string;
  pubsub_message_id?: string;
}

export interface SyncGmailHistoryInput {
  account_id: string;
  employee_id: string;
  connector_id: string;
  start_history_id?: string;
}

// --- Phase 3 reply/event delivery -------------------------------------------

export interface SendEmployeeEventInput {
  account_id: string;
  employee_id: string;
  event_type: string;
  provider_id?: string;
  idempotency_key?: string;
  normalized_payload?: Record<string, unknown>;
  work_event_descriptor?: WorkEventDescriptor;
  /** Safe, owner-facing summary (no raw email body / sensitive content). */
  safe_summary: string;
  suggested_next_action?: string;
  channel?: "sms" | "web" | "voice";
  routing_mode?: "deliver_only" | "wake_employee";
}

// --- Phase 4 Stripe groundwork input types ----------------------------------

export interface ConnectStripeInput {
  account_id: string;
  employee_id: string;
  account_type?: "standard" | "express";
}

export interface CreateStripeAccountLinkInput {
  account_id: string;
  employee_id: string;
  stripe_connection_id: string;
  refresh_url?: string;
  return_url?: string;
}

export interface CompleteStripeOnboardingInput {
  account_id: string;
  employee_id: string;
  stripe_connection_id: string;
}

export interface CreateDepositInvoiceInput {
  account_id: string;
  employee_id: string;
  estimate_artifact_id: string;
  customer_email: string;
  customer_name?: string;
  deposit_amount_cents: number;
  currency?: string;
  idempotency_key?: string;
}

export interface SendDepositInvoiceInput {
  account_id: string;
  employee_id: string;
  stripe_invoice_row_id: string;
  approval_id: string;
}

export interface GetStripeConnectionStatusInput {
  account_id: string;
  employee_id: string;
}

// --- Phase 5 reminder/event input types -------------------------------------

export interface JobCommitmentInput {
  estimate_artifact_id?: string;
  customer_ref?: string;
  start_at?: string;
  start_window?: string;
  notes?: string;
  source_ref?: string;
}

export interface SetInternalReminderInput {
  account_id: string;
  employee_id: string;
  scheduled_at: string; // ISO 8601
  channel?: "sms" | "web" | "voice";
  /** Owner-facing reminder text the employee writes; sent by dispatch_due_reminders. */
  message?: string;
  job?: JobCommitmentInput;
  idempotency_key?: string;
  /**
   * Optional owner-confirmation gate. When set, a resolved+approved approval with
   * action_key `set_job_reminder` is required before the reminder is created.
   * Omitted for purely internal/reversible reminders the employee sets directly.
   */
  approval_id?: string;
}

export interface GetRemindersInput {
  account_id: string;
  employee_id: string;
  status?: string;
  upcoming_only?: boolean;
}

/**
 * Fire due reminders (status `scheduled` && scheduled_at <= now). Driven by the
 * scheduler (Hermes cron in prod; `scheduler:tick` for dev), never the owner.
 * Idempotent: only acts on `scheduled` rows, flips them to `sent`/`failed`.
 */
export interface DispatchDueRemindersInput {
  /** Cap per pass (default 50). */
  limit?: number;
  /** Optional override of "now" (ISO) for deterministic testing. */
  now?: string;
  /** Restrict to one employee/account (default: all). */
  account_id?: string;
  employee_id?: string;
}

export interface DispatchDailyBriefsInput {
  now?: string;
  account_id?: string;
  employee_id?: string;
  limit?: number;
}

/**
 * Renew Gmail watches nearing expiry and resync history. Driven by the scheduler.
 */
export interface RenewExpiringWatchesInput {
  /** Renew watches expiring within this window (seconds, default 86400 = 24h). */
  within_seconds?: number;
  /** Cap per pass (default 50). */
  limit?: number;
  /** Optional override of "now" (ISO) for deterministic testing. */
  now?: string;
}

export interface ReplayGmailHistoryRangeInput {
  account_id: string;
  employee_id: string;
  connector_id: string;
  start_history_id: string;
  end_history_id?: string;
}

export interface ReplayStripeEventInput {
  stripe_event_id: string;
}

export interface RelinkEmailThreadInput {
  account_id: string;
  employee_id: string;
  gmail_thread_id: string;
  estimate_artifact_id: string;
  customer_email?: string;
}

export interface MarkEventDuplicateInput {
  event_id: string;
  duplicate_of_event_id?: string;
  reason?: string;
}

export interface RedeliverEmployeeEventInput {
  event_id: string;
  channel?: "sms" | "web" | "voice";
}

export interface SuppressEventSourceInput {
  account_id?: string;
  source: string;
  event_type?: string;
  reason: string;
  expires_at?: string;
}

export interface RegenerateStripeOnboardingLinkInput extends CreateStripeAccountLinkInput {}
