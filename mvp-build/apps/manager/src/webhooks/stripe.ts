/**
 * Stripe webhook route (Phase 4 groundwork, test mode). Verifies `Stripe-Signature`
 * against the RAW body BEFORE acting, rejects live-mode events unless explicitly
 * enabled, dedupes by Stripe `event.id`, stores a webhook trace, and normalizes
 * known invoice events into the shared event mesh. The Stripe API-calling tools
 * (connect/invoice) remain honestly not_implemented until real test-mode proof.
 * Spec: 09-event-mesh-v1.md, 10-security-ops-observability.md.
 */
import type { Hono } from "hono";
import { EVENT_TYPES, ID_PREFIX, MANAGER_API, newId, type WorkEventDescriptor } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { verifyStripeSignature } from "../lib/stripe-signature.js";
import { deliverEmployeeEvent } from "../lib/employee-events.js";

export interface StripeEvent {
  id: string;
  type: string;
  livemode?: boolean;
  data?: { object?: Record<string, unknown> };
}

export function normalizedStripeType(stripeType: string): string | null {
  if (stripeType === "invoice.sent" || stripeType === "invoice.finalized") return EVENT_TYPES.stripeInvoiceSent;
  if (stripeType === "invoice.paid" || stripeType === "invoice.payment_succeeded") return EVENT_TYPES.stripeInvoicePaid;
  return null;
}

/** Resolve account/employee/estimate for an invoice event, if the invoice is known. */
async function resolveInvoiceContext(db: SupabaseClient, event: StripeEvent) {
  const obj = event.data?.object as { id?: string } | undefined;
  const stripeInvoiceId = obj?.id;
  if (!stripeInvoiceId) return null;
  const { data: inv } = await db.from("stripe_invoices").select("*").eq("stripe_invoice_id", stripeInvoiceId).maybeSingle();
  if (!inv) return null;
  const invoice = inv as { stripe_connection_id: string; estimate_id: string | null; deposit_amount: number | null };
  const { data: conn } = await db.from("stripe_connections").select("account_id,employee_id").eq("id", invoice.stripe_connection_id).maybeSingle();
  if (!conn) return null;
  const c = conn as { account_id: string; employee_id: string };
  return { account_id: c.account_id, employee_id: c.employee_id, estimate_id: invoice.estimate_id, deposit_amount: invoice.deposit_amount };
}

export interface StripeProcessResult {
  stored_id?: string;
  duplicate: boolean;
  normalized_type: string | null;
  delivered: boolean;
}

/**
 * Dedupe, store, and normalize a SIGNATURE-VERIFIED Stripe event. Pure w.r.t. the
 * injected db so it is unit-testable; the route handles transport + signature.
 */
export async function recordAndProcessStripeEvent(db: SupabaseClient, event: StripeEvent): Promise<StripeProcessResult> {
  const { data: existing } = await db.from("stripe_webhook_events").select("id").eq("stripe_event_id", event.id).maybeSingle();
  if (existing) return { duplicate: true, normalized_type: normalizedStripeType(event.type), delivered: false };

  const rowId = newId(ID_PREFIX.stripeWebhookEvent);
  await db.from("stripe_webhook_events").insert({
    id: rowId, stripe_event_id: event.id, type: event.type, livemode: Boolean(event.livemode),
    signature_verified: true, processed: false, trace: { object_type: (event.data?.object as { object?: string })?.object ?? null },
  });

  const norm = normalizedStripeType(event.type);
  let delivered = false;
  if (norm === EVENT_TYPES.stripeInvoicePaid) {
    const ctx = await resolveInvoiceContext(db, event);
    if (ctx) {
      const amount = ctx.deposit_amount != null ? ` ($${(ctx.deposit_amount / 100).toFixed(2)})` : "";
      const descriptor: WorkEventDescriptor = {
        account_id: ctx.account_id,
        employee_id: ctx.employee_id,
        source_event_id: rowId,
        move: "notify",
        title: "Deposit paid",
        summary: `The deposit invoice was paid${amount}.`,
        deliverable: {
          type: "job_folder",
          title: "Job follow-through",
          refs: {
            stripe_event_id: event.id,
            ...(ctx.estimate_id ? { estimate_artifact_id: ctx.estimate_id } : {}),
          },
          money: { involved: false },
          reversible: true,
          acceptance: ["acknowledge", "respond"],
        },
        suggested_next_action: "Confirm the job start with the customer and set a reminder.",
        proof: { stripe_event_id: event.id },
      };
      const res = await deliverEmployeeEvent(db, {
        account_id: ctx.account_id, employee_id: ctx.employee_id, event_type: norm,
        provider_id: event.id, idempotency_key: `${norm}:${event.id}`,
        normalized_payload: { stripe_event_id: event.id, related_estimate_id: ctx.estimate_id, deposit_amount: ctx.deposit_amount },
        work_event_descriptor: descriptor,
        safe_summary: `The deposit invoice was paid${amount}.`,
        suggested_next_action: "Confirm the job start with the customer and set a reminder.",
        channel: "sms", actor: "manager",
      });
      delivered = !res.duplicate;
    }
  }

  await db.from("stripe_webhook_events").update({ processed: true }).eq("id", rowId);
  return { stored_id: rowId, duplicate: false, normalized_type: norm, delivered };
}

export function registerStripeWebhooks(app: Hono): void {
  app.post(MANAGER_API.webhooks.stripe, async (c) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return c.text("stripe_webhook_unconfigured", 503);

    const raw = await c.req.text();
    const verification = verifyStripeSignature(raw, c.req.header("Stripe-Signature"), secret);
    if (!verification.ok) return c.text("invalid signature", 400);

    let event: StripeEvent;
    try {
      event = JSON.parse(raw) as StripeEvent;
    } catch {
      return c.text("bad json", 400);
    }
    if (!event?.id) return c.text("missing event id", 400);

    if (Boolean(event.livemode) && process.env.STRIPE_ALLOW_LIVE !== "true") {
      // Accept (2xx) so Stripe stops retrying, but do not process live events.
      return c.json({ received: true, ignored: "livemode_rejected" }, 202);
    }

    const result = await recordAndProcessStripeEvent(serviceClient(), event);
    return c.json({ received: true, ...result });
  });
}
