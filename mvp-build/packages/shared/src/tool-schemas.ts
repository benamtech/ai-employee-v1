/**
 * Runtime JSON-Schema source of truth for the Manager tool surface.
 *
 * `tool-contracts.ts` holds compile-time TypeScript interfaces (erased at
 * runtime). These zod schemas are their runtime counterpart — one artifact with
 * three consumers:
 *   1. HTTP dispatch input validation (`/manager/tools/:name`),
 *   2. the Manager MCP server's `tools/list` inputSchema (derived via zod),
 *   3. the schema-driven Work Surface renderer (form-from-schema).
 *
 * Coverage is intentionally partial: the money/customer-facing + approval +
 * identity/provisioning + spike tools are schema'd first (so the GATED set is
 * validated). Everything else falls back to a permissive passthrough schema, so
 * MCP `tools/list` still lists every tool and dispatch never rejects a
 * not-yet-schema'd tool. Fill the long tail incrementally.
 *
 * Objects use `.passthrough()` deliberately: validation asserts the REQUIRED
 * typed fields without rejecting extra keys, so hardening dispatch cannot break
 * a handler that already tolerates more than the interface documents.
 */
import { z } from "zod";
import { TOOL_NAMES, type ToolName } from "./tool-contracts.js";

const ownerCtx = {
  account_id: z.string().min(1),
  employee_id: z.string().min(1),
};

const estimateLineItem = z.object({
  label: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  unit_price: z.number(),
  total: z.number(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
}).passthrough();

const estimatePayload = z.object({
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  job_description: z.string(),
  line_items: z.array(estimateLineItem),
  assumptions: z.array(z.string()),
  low_confidence_flags: z.array(z.string()).optional(),
  owner_price_hint: z.number().optional(),
  recommended_total: z.number(),
  approved_total: z.number().optional(),
  deposit_percent: z.number().optional(),
  deposit_amount: z.number().optional(),
  source_refs: z.array(z.string()).optional(),
}).passthrough();

/** Explicit schemas for the covered set (mirrors tool-contracts.ts interfaces). */
const SCHEMAS: Partial<Record<ToolName, z.ZodTypeAny>> = {
  // Identity & provisioning
  send_phone_verification: z.object({ phone_e164: z.string().min(1), session_id: z.string().min(1) }).passthrough(),
  check_phone_code: z.object({ verification_attempt_id: z.string().min(1), code: z.string().min(1) }).passthrough(),
  create_account: z.object({
    email: z.string().min(1),
    password_or_auth_ref: z.string().min(1),
    verified_phone_ref: z.string().min(1),
    business_display_name: z.string().min(1),
    timezone: z.string().min(1),
  }).passthrough(),
  provision_employee: z.object({
    account_id: z.string().min(1),
    manifest: z.record(z.unknown()),
    transcript_ref: z.string().optional(),
    idempotency_key: z.string().min(1),
  }).passthrough(),
  get_provisioning_status: z.object({ account_id: z.string().min(1), employee_id_or_job_id: z.string().min(1) }).passthrough(),

  // Brain (spike-friendly, owner-safe)
  get_business_brain: z.object({ ...ownerCtx }).passthrough(),
  save_business_brain_fact: z.object({ ...ownerCtx, fact: z.string().min(1), category: z.string().optional() }).passthrough(),

  // Estimate & artifact
  create_estimate_artifact: z.object({ ...ownerCtx, estimate_payload: estimatePayload, created_run: z.string().optional() }).passthrough(),
  render_estimate_pdf: z.object({
    ...ownerCtx,
    artifact_id: z.string().min(1),
    filename: z.string().min(1),
    pdf_base64: z.string().min(1),
    checksum_sha256: z.string().optional(),
  }).passthrough(),
  create_signed_artifact_link: z.object({
    ...ownerCtx,
    artifact_id: z.string().min(1),
    audience: z.string().optional(),
    expiry_seconds: z.number().optional(),
  }).passthrough(),

  // Approval (the gate primitive)
  request_approval: z.object({
    ...ownerCtx,
    action_key: z.string().min(1),
    summary: z.string().min(1),
    risk_level: z.enum(["low", "medium", "high"]),
    refs: z.record(z.string()).optional(),
    channel: z.enum(["sms", "web"]).optional(),
    expiry_seconds: z.number().optional(),
  }).passthrough(),
  resolve_approval: z.object({
    ...ownerCtx,
    approval_id: z.string().min(1),
    owner_response: z.enum(["approved", "rejected", "yes", "no"]),
    channel: z.enum(["sms", "web"]).optional(),
  }).passthrough(),
  get_approval_status: z.object({ ...ownerCtx, approval_id: z.string().min(1) }).passthrough(),

  // Gmail (customer-facing send is gated)
  connect_email: z.object({ ...ownerCtx, provider: z.literal("gmail"), requested_scopes: z.array(z.string()), redirect_uri: z.string().optional() }).passthrough(),
  create_email_draft: z.object({
    ...ownerCtx,
    to: z.string().min(1),
    subject: z.string(),
    body: z.string(),
    attachment_artifact_ids: z.array(z.string()),
    thread_ref: z.string().optional(),
  }).passthrough(),
  send_email_draft: z.object({ ...ownerCtx, draft_id: z.string().min(1), approval_id: z.string().min(1) }).passthrough(),

  // Stripe (money movement is gated)
  create_deposit_invoice: z.object({
    ...ownerCtx,
    estimate_artifact_id: z.string().min(1),
    customer_email: z.string().min(1),
    customer_name: z.string().optional(),
    deposit_amount_cents: z.number(),
    currency: z.string().optional(),
    idempotency_key: z.string().optional(),
  }).passthrough(),
  send_deposit_invoice: z.object({ ...ownerCtx, stripe_invoice_row_id: z.string().min(1), approval_id: z.string().min(1) }).passthrough(),

  // Event & reminder
  send_employee_event: z.object({
    ...ownerCtx,
    event_type: z.string().min(1),
    safe_summary: z.string().min(1),
    provider_id: z.string().optional(),
    idempotency_key: z.string().optional(),
    normalized_payload: z.record(z.unknown()).optional(),
    suggested_next_action: z.string().optional(),
    channel: z.enum(["sms", "web", "voice"]).optional(),
    routing_mode: z.enum(["deliver_only", "wake_employee"]).optional(),
  }).passthrough(),
  set_internal_reminder: z.object({
    ...ownerCtx,
    scheduled_at: z.string().min(1),
    channel: z.enum(["sms", "web", "voice"]).optional(),
    message: z.string().optional(),
    idempotency_key: z.string().optional(),
    approval_id: z.string().optional(),
  }).passthrough(),
  get_reminders: z.object({ ...ownerCtx, status: z.string().optional(), upcoming_only: z.boolean().optional() }).passthrough(),

  // QuickBooks Online (Phase A) — connector lifecycle
  connect_quickbooks: z.object({ ...ownerCtx, environment: z.enum(["sandbox", "production"]).optional() }).passthrough(),
  complete_quickbooks_oauth: z.object({ state: z.string().min(1), code: z.string().min(1), realmId: z.string().min(1) }).passthrough(),
  run_quickbooks_connector_test: z.object({ ...ownerCtx }).passthrough(),

  // QuickBooks write previews — resolve names via qbo-lookup.ts, never call QBO
  // directly; each inserts a quickbooks_pending_writes row and calls
  // request_approval. .passthrough() is fine here: these never reach the API,
  // commit_quickbooks_write below is the one tool that actually writes.
  create_expense: z.object({
    ...ownerCtx,
    vendor_name: z.string().min(1),
    account_name: z.string().min(1),
    amount_cents: z.number().int().positive(),
    payment_type: z.enum(["Cash", "Check", "CreditCard"]),
    department_name: z.string().optional(),
    memo: z.string().optional(),
    txn_date: z.string().optional(),
  }).passthrough(),
  create_bill: z.object({
    ...ownerCtx,
    vendor_name: z.string().min(1),
    account_name: z.string().min(1),
    amount_cents: z.number().int().positive(),
    due_date: z.string().optional(),
    memo: z.string().optional(),
    txn_date: z.string().optional(),
  }).passthrough(),
  create_invoice: z.object({
    ...ownerCtx,
    customer_name: z.string().min(1),
    line_items: z.array(z.object({
      item_name: z.string().min(1),
      quantity: z.number().positive(),
      unit_price_cents: z.number().int().nonnegative(),
      description: z.string().optional(),
    })).min(1),
    memo: z.string().optional(),
    txn_date: z.string().optional(),
  }).passthrough(),
  create_payment: z.object({
    ...ownerCtx,
    customer_name: z.string().min(1),
    amount_cents: z.number().int().positive(),
    invoice_ref: z.string().optional(),
    memo: z.string().optional(),
    txn_date: z.string().optional(),
  }).passthrough(),

  // commit_quickbooks_write — DELIBERATE EXCEPTION to this file's default
  // .passthrough() convention (see the file-level doc comment above). This is
  // the one tool where "no extra fields accepted" is a hard security property:
  // the entity payload that actually gets written to QuickBooks must come
  // exclusively from the stored quickbooks_pending_writes row (matched by
  // pending_write_id), never from anything the model supplies at commit time.
  // A permissive schema here would let a model resupply/override payload
  // fields at the one place that must not accept them.
  commit_quickbooks_write: z.object({
    ...ownerCtx,
    pending_write_id: z.string().min(1),
    approval_id: z.string().min(1),
  }).strict(),

  // QuickBooks read surface: one generic query tool (not ~40 search_* tools)
  // plus core reports. qbo-query.ts enforces the per-entity filterable-fields
  // whitelist and string-literal escaping server-side; this schema only shapes
  // the request.
  query_quickbooks: z.object({
    ...ownerCtx,
    entity: z.string().min(1),
    filters: z.record(z.string()).optional(),
    fields: z.array(z.string()).optional(),
    limit: z.number().int().positive().optional(),
    start_position: z.number().int().positive().optional(),
  }).passthrough(),
  get_profit_and_loss: z.object({
    ...ownerCtx,
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    date_macro: z.string().optional(),
  }).passthrough(),
  get_balance_sheet: z.object({
    ...ownerCtx,
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    date_macro: z.string().optional(),
  }).passthrough(),
  get_aged_receivables: z.object({ ...ownerCtx, report_date: z.string().optional() }).passthrough(),
  get_aged_payables: z.object({ ...ownerCtx, report_date: z.string().optional() }).passthrough(),
};

/** Permissive fallback for tools not yet schema'd — accepts any object, so
 *  dispatch never rejects and MCP still advertises the tool. */
export const PERMISSIVE_TOOL_SCHEMA: z.ZodTypeAny = z.object({}).passthrough();

/** The zod schema for a tool's input (specific if covered, else permissive). */
export function getToolSchema(name: ToolName): z.ZodTypeAny {
  return SCHEMAS[name] ?? PERMISSIVE_TOOL_SCHEMA;
}

/** True when the tool has an explicit (non-fallback) schema. */
export function hasExplicitToolSchema(name: ToolName): boolean {
  return Boolean(SCHEMAS[name]);
}

export const TOOL_SCHEMAS: Partial<Record<ToolName, z.ZodTypeAny>> = SCHEMAS;

/** Names of every tool with an explicit schema (drives coverage tests). */
export const SCHEMA_COVERED_TOOLS: ToolName[] = TOOL_NAMES.filter((n) => Boolean(SCHEMAS[n]));
