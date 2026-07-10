/** Stripe connector tools (Phase 4, test mode). Spec: 04-manager-tools.md "Stripe",
 *  09-event-mesh-v1.md. Provider calls use direct Stripe REST APIs so the Manager
 *  keeps account authority, approval gates, idempotency, and proof.
 */
import {
  ID_PREFIX,
  INVOICE_SEND_ACTION_KEYS,
  failed,
  newId,
  ok,
  type CompleteStripeOnboardingInput,
  type ConnectStripeInput,
  type CreateDepositInvoiceInput,
  type CreateStripeAccountLinkInput,
  type GetStripeConnectionStatusInput,
  type SendDepositInvoiceInput,
  type ToolName,
  type WorkEventDescriptor,
} from "@amtech/shared";
import { writeAudit } from "../lib/audit.js";
import { type ToolContext, type ToolHandler } from "./types.js";

const SEND_INVOICE_ACTION_KEYS = new Set<string>(INVOICE_SEND_ACTION_KEYS);

function stripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing.");
  if (key.startsWith("sk_live_") && process.env.STRIPE_ALLOW_LIVE !== "true") {
    throw new Error("stripe_live_mode_disabled");
  }
  return key;
}

function form(params: Record<string, string | number | boolean | null | undefined>): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) out.set(k, String(v));
  }
  return out;
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: URLSearchParams,
  opts?: { stripeAccount?: string | null; idempotencyKey?: string },
): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${stripeKey()}` };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (opts?.stripeAccount) headers["Stripe-Account"] = opts.stripeAccount;
  if (opts?.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  const res = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? `stripe_${res.status}`);
  return json as T;
}

async function employeeBelongsToAccount(ctx: ToolContext, account_id: string, employee_id: string): Promise<boolean> {
  const { data } = await ctx.db.from("employees").select("id").eq("id", employee_id).eq("account_id", account_id).maybeSingle();
  return Boolean(data);
}

async function loadConnection(ctx: ToolContext, account_id: string, employee_id: string) {
  const { data } = await ctx.db
    .from("stripe_connections")
    .select("*")
    .eq("account_id", account_id)
    .eq("employee_id", employee_id)
    .maybeSingle();
  return data as { id: string; account_id: string; employee_id: string; connected_account_id: string | null; onboarding_status: string; charges_enabled?: boolean; payouts_enabled?: boolean } | null;
}

const connectStripe: ToolHandler = async (ctx, raw) => {
  const input = raw as ConnectStripeInput;
  if (!input?.account_id || !input?.employee_id) return failed("validation_failed", "account_id and employee_id are required.");
  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:connect_stripe", result: "denied", details: { reason: "employee_account_mismatch" } });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  try {
    const existing = await loadConnection(ctx, input.account_id, input.employee_id);
    if (existing?.connected_account_id) {
      return ok({
        account_id: input.account_id, employee_id: input.employee_id,
        proof: { stripe_connection_id: existing.id, connected_account_id: existing.connected_account_id, onboarding_status: existing.onboarding_status, idempotent: true },
        user_facing_summary_hint: "Stripe connection already started.",
        next_suggested_action: "Create or refresh the Stripe onboarding link.",
        audit_id: null,
      });
    }
    const account = await stripeRequest<{ id: string; charges_enabled?: boolean; payouts_enabled?: boolean }>("POST", "/accounts", form({
      type: input.account_type ?? "standard",
      "metadata[account_id]": input.account_id,
      "metadata[employee_id]": input.employee_id,
    }), { idempotencyKey: `connect_stripe:${input.account_id}:${input.employee_id}` });
    const connectionId = existing?.id ?? newId(ID_PREFIX.stripeConnection);
    if (existing) {
      await ctx.db.from("stripe_connections").update({
        connected_account_id: account.id, account_type: input.account_type ?? "standard", onboarding_status: "account_created",
        charges_enabled: Boolean(account.charges_enabled), payouts_enabled: Boolean(account.payouts_enabled),
      }).eq("id", existing.id);
    } else {
      await ctx.db.from("stripe_connections").insert({
        id: connectionId, account_id: input.account_id, employee_id: input.employee_id,
        connected_account_id: account.id, account_type: input.account_type ?? "standard", onboarding_status: "account_created",
        charges_enabled: Boolean(account.charges_enabled), payouts_enabled: Boolean(account.payouts_enabled),
      });
    }
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:connect_stripe", resource: connectionId, result: "ok", details: { connected_account_id: account.id } });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`stripe_connection:${connectionId}`],
      proof: { stripe_connection_id: connectionId, connected_account_id: account.id, onboarding_status: "account_created" },
      user_facing_summary_hint: "Stripe test-mode account created.",
      next_suggested_action: "Create a Stripe onboarding link and send it inside the authenticated app.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:connect_stripe", result: "failed", details: { reason: "stripe_connect_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Stripe connection failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

const createStripeAccountLink: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateStripeAccountLinkInput;
  if (!input?.account_id || !input?.employee_id || !input?.stripe_connection_id) return failed("validation_failed", "account_id, employee_id, and stripe_connection_id are required.");
  const conn = await loadConnection(ctx, input.account_id, input.employee_id);
  if (!conn || conn.id !== input.stripe_connection_id || !conn.connected_account_id) return failed("validation_failed", "Stripe connection is not ready.", { account_id: input.account_id, employee_id: input.employee_id });
  try {
    const origin = (process.env.WEB_APP_ORIGIN ?? process.env.MANAGER_API_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
    const refreshUrl = input.refresh_url ?? `${origin}/agent/${input.employee_id}`;
    const returnUrl = input.return_url ?? `${origin}/agent/${input.employee_id}`;
    const link = await stripeRequest<{ url: string; expires_at?: number }>("POST", "/account_links", form({
      account: conn.connected_account_id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    }), { idempotencyKey: `stripe_account_link:${conn.id}:${Date.now()}` });
    const linkId = newId(ID_PREFIX.stripeAccountLink);
    await ctx.db.from("stripe_account_links").insert({ id: linkId, stripe_connection_id: conn.id, url: link.url, refresh_url: refreshUrl, return_url: returnUrl, state: "created" });
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:create_stripe_account_link", resource: linkId, result: "ok", details: { stripe_connection_id: conn.id } });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`stripe_account_link:${linkId}`],
      proof: { stripe_connection_id: conn.id, stripe_account_link_id: linkId, account_link_url: link.url, expires_at: link.expires_at ?? null },
      user_facing_summary_hint: "Stripe onboarding link created.",
      next_suggested_action: "Open this link in the authenticated app; do not send it by SMS/email.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:create_stripe_account_link", result: "failed", details: { reason: "account_link_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Could not create Stripe onboarding link.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

const completeStripeOnboarding: ToolHandler = async (ctx, raw) => {
  const input = raw as CompleteStripeOnboardingInput;
  if (!input?.account_id || !input?.employee_id || !input?.stripe_connection_id) return failed("validation_failed", "account_id, employee_id, and stripe_connection_id are required.");
  const conn = await loadConnection(ctx, input.account_id, input.employee_id);
  if (!conn || conn.id !== input.stripe_connection_id || !conn.connected_account_id) return failed("validation_failed", "Stripe connection is not ready.", { account_id: input.account_id, employee_id: input.employee_id });
  try {
    const account = await stripeRequest<{ id: string; charges_enabled?: boolean; payouts_enabled?: boolean; details_submitted?: boolean }>("GET", `/accounts/${conn.connected_account_id}`);
    const status = account.details_submitted ? "completed" : "requirements_due";
    await ctx.db.from("stripe_connections").update({ onboarding_status: status, charges_enabled: Boolean(account.charges_enabled), payouts_enabled: Boolean(account.payouts_enabled) }).eq("id", conn.id);
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:complete_stripe_onboarding", resource: conn.id, result: "ok", details: { status, charges_enabled: Boolean(account.charges_enabled) } });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`stripe_connection:${conn.id}`],
      proof: { stripe_connection_id: conn.id, connected_account_id: account.id, onboarding_status: status, charges_enabled: Boolean(account.charges_enabled), payouts_enabled: Boolean(account.payouts_enabled) },
      user_facing_summary_hint: status === "completed" ? "Stripe onboarding complete." : "Stripe still needs setup details.",
      next_suggested_action: status === "completed" ? "Create the deposit invoice when the owner approves." : "Regenerate the onboarding link if the owner needs to continue setup.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:complete_stripe_onboarding", resource: conn.id, result: "failed", details: { reason: "status_check_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Could not verify Stripe onboarding status.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

const getStripeConnectionStatus: ToolHandler = async (ctx, raw) => {
  const input = raw as GetStripeConnectionStatusInput;
  if (!input?.account_id || !input?.employee_id) return failed("validation_failed", "account_id and employee_id are required.");
  const conn = await loadConnection(ctx, input.account_id, input.employee_id);
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    proof: {
      stripe_connection_id: conn?.id ?? null,
      connected_account_id: conn?.connected_account_id ?? null,
      onboarding_status: conn?.onboarding_status ?? "not_started",
      charges_enabled: Boolean(conn?.charges_enabled),
      payouts_enabled: Boolean(conn?.payouts_enabled),
    },
    user_facing_summary_hint: conn ? "Stripe connection status loaded." : "Stripe is not connected yet.",
    audit_id: null,
  });
};

const createDepositInvoice: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateDepositInvoiceInput;
  if (!input?.account_id || !input?.employee_id || !input?.estimate_artifact_id || !input?.customer_email || !input.deposit_amount_cents) {
    return failed("validation_failed", "account_id, employee_id, estimate_artifact_id, customer_email, and deposit_amount_cents are required.");
  }
  const conn = await loadConnection(ctx, input.account_id, input.employee_id);
  if (!conn?.connected_account_id) return failed("validation_failed", "Stripe is not connected.", { account_id: input.account_id, employee_id: input.employee_id });
  const { data: artifact } = await ctx.db.from("artifacts").select("id,payload").eq("id", input.estimate_artifact_id).eq("account_id", input.account_id).eq("employee_id", input.employee_id).maybeSingle();
  if (!artifact) return failed("unauthorized", "Estimate artifact does not belong to this employee.", { account_id: input.account_id, employee_id: input.employee_id });
  const idem = input.idempotency_key ?? `deposit_invoice:${input.account_id}:${input.employee_id}:${input.estimate_artifact_id}:${input.deposit_amount_cents}`;
  const { data: existing } = await ctx.db.from("stripe_invoices").select("*").eq("stripe_connection_id", conn.id).eq("estimate_id", input.estimate_artifact_id).eq("deposit_amount", input.deposit_amount_cents).maybeSingle();
  if (existing?.stripe_invoice_id) {
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      proof: { stripe_invoice_row_id: existing.id, stripe_invoice_id: existing.stripe_invoice_id, hosted_invoice_url: existing.hosted_invoice_url ?? null, status: existing.status, idempotent: true },
      user_facing_summary_hint: "Deposit invoice already drafted.",
      next_suggested_action: "Request owner approval before sending the invoice.",
      audit_id: null,
    });
  }
  try {
    const customer = await stripeRequest<{ id: string }>("POST", "/customers", form({ email: input.customer_email, name: input.customer_name, "metadata[account_id]": input.account_id }), { stripeAccount: conn.connected_account_id, idempotencyKey: `${idem}:customer` });
    const customerRowId = newId(ID_PREFIX.stripeCustomer);
    await ctx.db.from("stripe_customers").insert({ id: customerRowId, account_id: input.account_id, stripe_customer_id: customer.id, email: input.customer_email, name: input.customer_name ?? null });
    const invoice = await stripeRequest<{ id: string; status?: string; hosted_invoice_url?: string; invoice_pdf?: string }>("POST", "/invoices", form({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      auto_advance: false,
      "metadata[account_id]": input.account_id,
      "metadata[employee_id]": input.employee_id,
      "metadata[estimate_artifact_id]": input.estimate_artifact_id,
    }), { stripeAccount: conn.connected_account_id, idempotencyKey: `${idem}:invoice` });
    await stripeRequest("POST", "/invoiceitems", form({
      customer: customer.id,
      invoice: invoice.id,
      amount: input.deposit_amount_cents,
      currency: input.currency ?? "usd",
      description: "Project deposit",
      "metadata[estimate_artifact_id]": input.estimate_artifact_id,
    }), { stripeAccount: conn.connected_account_id, idempotencyKey: `${idem}:item` });
    const rowId = newId(ID_PREFIX.stripeInvoice);
    await ctx.db.from("stripe_invoices").insert({
      id: rowId, stripe_connection_id: conn.id, estimate_id: input.estimate_artifact_id,
      stripe_invoice_id: invoice.id, deposit_amount: input.deposit_amount_cents,
      hosted_invoice_url: invoice.hosted_invoice_url ?? null, invoice_pdf: invoice.invoice_pdf ?? null,
      status: invoice.status ?? "draft",
    });
    const descriptor: WorkEventDescriptor = {
      account_id: input.account_id,
      employee_id: input.employee_id,
      move: "review",
      title: "Deposit invoice drafted",
      summary: `Drafted a ${((input.deposit_amount_cents) / 100).toFixed(2)} ${input.currency ?? "usd"} deposit invoice for ${input.customer_email}.`,
      deliverable: {
        type: "money_movement",
        title: "Deposit invoice",
        refs: { stripe_invoice_row_id: rowId, stripe_invoice_id: invoice.id, estimate_artifact_id: input.estimate_artifact_id },
        leaves_business: true,
        money: { involved: true, amount_cents: input.deposit_amount_cents, currency: input.currency ?? "usd" },
        reversible: false,
        acceptance: ["approve", "edit", "reject"],
      },
      suggested_next_action: "Approve sending it when the customer and amount look right.",
      proof: { stripe_invoice_id: invoice.id },
    };
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:create_deposit_invoice", resource: rowId, result: "ok", details: { stripe_invoice_id: invoice.id, deposit_amount: input.deposit_amount_cents } });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`stripe_invoice:${rowId}`, `stripe_customer:${customerRowId}`],
      proof: { stripe_invoice_row_id: rowId, stripe_invoice_id: invoice.id, stripe_customer_id: customer.id, status: invoice.status ?? "draft", work_event_descriptor: JSON.stringify(descriptor) },
      user_facing_summary_hint: "Deposit invoice drafted.",
      next_suggested_action: "Request owner approval before send_deposit_invoice.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:create_deposit_invoice", result: "failed", details: { reason: "invoice_create_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Could not create Stripe deposit invoice.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

const sendDepositInvoice: ToolHandler = async (ctx, raw) => {
  const input = raw as SendDepositInvoiceInput;
  if (!input?.account_id || !input?.employee_id || !input?.stripe_invoice_row_id || !input?.approval_id) return failed("validation_failed", "account_id, employee_id, stripe_invoice_row_id, and approval_id are required.");
  const conn = await loadConnection(ctx, input.account_id, input.employee_id);
  if (!conn?.connected_account_id) return failed("validation_failed", "Stripe is not connected.", { account_id: input.account_id, employee_id: input.employee_id });
  const { data: invoiceRaw } = await ctx.db.from("stripe_invoices").select("*").eq("id", input.stripe_invoice_row_id).eq("stripe_connection_id", conn.id).maybeSingle();
  const invoice = invoiceRaw as { id: string; stripe_invoice_id: string | null; deposit_amount: number | null; hosted_invoice_url: string | null; status: string; estimate_id: string | null } | null;
  if (!invoice?.stripe_invoice_id) return failed("validation_failed", "Stripe invoice row is not ready.", { account_id: input.account_id, employee_id: input.employee_id });
  if (invoice.status === "sent" && invoice.hosted_invoice_url) {
    return ok({ account_id: input.account_id, employee_id: input.employee_id, proof: { stripe_invoice_row_id: invoice.id, stripe_invoice_id: invoice.stripe_invoice_id, hosted_invoice_url: invoice.hosted_invoice_url, status: "sent", idempotent: true }, user_facing_summary_hint: "Deposit invoice already sent.", audit_id: null });
  }
  const { data: approvalRaw } = await ctx.db.from("approvals").select("*").eq("id", input.approval_id).eq("account_id", input.account_id).eq("employee_id", input.employee_id).maybeSingle();
  const approval = approvalRaw as { resolution: string | null; action_key: string } | null;
  if (!approval || approval.resolution !== "approved" || !SEND_INVOICE_ACTION_KEYS.has(approval.action_key)) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:send_deposit_invoice", resource: invoice.id, result: "denied", details: { reason: "approval_not_satisfied", action_key: approval?.action_key ?? null, resolution: approval?.resolution ?? null } });
    return failed("unauthorized", "A resolved owner approval is required before sending the deposit invoice.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  try {
    await stripeRequest("POST", `/invoices/${invoice.stripe_invoice_id}/finalize`, form({}), { stripeAccount: conn.connected_account_id, idempotencyKey: `finalize:${invoice.id}` });
    const sent = await stripeRequest<{ id: string; status?: string; hosted_invoice_url?: string; invoice_pdf?: string }>("POST", `/invoices/${invoice.stripe_invoice_id}/send`, form({}), { stripeAccount: conn.connected_account_id, idempotencyKey: `send:${invoice.id}:${input.approval_id}` });
    await ctx.db.from("stripe_invoices").update({ status: "sent", hosted_invoice_url: sent.hosted_invoice_url ?? invoice.hosted_invoice_url, invoice_pdf: sent.invoice_pdf ?? null }).eq("id", invoice.id);
    const descriptor: WorkEventDescriptor = {
      account_id: input.account_id,
      employee_id: input.employee_id,
      move: "notify",
      title: "Deposit invoice sent",
      summary: `Sent the deposit invoice${invoice.deposit_amount != null ? ` for $${(invoice.deposit_amount / 100).toFixed(2)}` : ""}.`,
      deliverable: {
        type: "money_movement",
        title: "Deposit invoice",
        refs: { stripe_invoice_row_id: invoice.id, stripe_invoice_id: sent.id, ...(invoice.estimate_id ? { estimate_artifact_id: invoice.estimate_id } : {}) },
        leaves_business: true,
        money: { involved: true, amount_cents: invoice.deposit_amount ?? undefined, currency: "usd" },
        reversible: false,
        acceptance: ["acknowledge"],
      },
      suggested_next_action: "I will watch Stripe for payment and let you know.",
      proof: { stripe_invoice_id: sent.id, hosted_invoice_url: sent.hosted_invoice_url ?? "" },
    };
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:send_deposit_invoice", resource: invoice.id, result: "ok", details: { stripe_invoice_id: sent.id, approval_id: input.approval_id } });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`stripe_invoice:${invoice.id}`],
      proof: { stripe_invoice_row_id: invoice.id, stripe_invoice_id: sent.id, hosted_invoice_url: sent.hosted_invoice_url ?? null, status: "sent", work_event_descriptor: JSON.stringify(descriptor) },
      user_facing_summary_hint: "Deposit invoice sent.",
      next_suggested_action: "Watch for invoice.paid webhook.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:send_deposit_invoice", resource: invoice.id, result: "failed", details: { reason: "invoice_send_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Could not send Stripe deposit invoice.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

export const stripeTools: Partial<Record<ToolName, ToolHandler>> = {
  connect_stripe: connectStripe,
  create_stripe_account_link: createStripeAccountLink,
  complete_stripe_onboarding: completeStripeOnboarding,
  create_deposit_invoice: createDepositInvoice,
  send_deposit_invoice: sendDepositInvoice,
  handle_stripe_webhook: async () => failed("validation_failed", "Use the signed /webhooks/stripe route for webhook processing."),
  get_stripe_connection_status: getStripeConnectionStatus,
};
