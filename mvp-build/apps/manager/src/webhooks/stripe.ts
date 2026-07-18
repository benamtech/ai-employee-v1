/** Stripe signature verification and ambient-inbox ingress. */
import type { Hono } from "hono";
import { EVENT_TYPES, ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { verifyStripeSignature } from "../lib/stripe-signature.js";
import { ingestEvent } from "../events/ingress.js";
import { insertDedup } from "../lib/db.js";
import { AmbientWaitingForBindingError, enqueueAmbientEvent, type AmbientInboxRow } from "../lib/ambient-inbox.js";

export interface StripeEvent {
  id: string;
  type: string;
  livemode?: boolean;
  created?: number;
  data?: { object?: Record<string, unknown> };
}

export function normalizedStripeType(stripeType: string): string | null {
  if (stripeType === "invoice.sent" || stripeType === "invoice.finalized") return EVENT_TYPES.stripeInvoiceSent;
  if (stripeType === "invoice.paid" || stripeType === "invoice.payment_succeeded") return EVENT_TYPES.stripeInvoicePaid;
  return null;
}

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
  processed?: boolean;
}

export async function recordAndProcessStripeEvent(db: SupabaseClient, event: StripeEvent): Promise<StripeProcessResult> {
  const rowId = newId(ID_PREFIX.stripeWebhookEvent);
  const ins = await insertDedup(
    db.from("stripe_webhook_events").insert({
      id: rowId, stripe_event_id: event.id, type: event.type, livemode: Boolean(event.livemode),
      signature_verified: true, processed: false, trace: { object_type: (event.data?.object as { object?: string })?.object ?? null },
    }),
    "stripe_webhook_events.insert",
  );
  if (ins.conflict) return { duplicate: true, normalized_type: normalizedStripeType(event.type), delivered: false };

  const norm = normalizedStripeType(event.type);
  let delivered = false;
  const isInvoiceEvent = norm === EVENT_TYPES.stripeInvoicePaid || norm === EVENT_TYPES.stripeInvoiceSent;
  let contextResolved = true;
  if (isInvoiceEvent) {
    const ctx = await resolveInvoiceContext(db, event);
    if (ctx) {
      const res = await ingestEvent(db, {
        source: "stripe",
        payload: {
          account_id: ctx.account_id,
          employee_id: ctx.employee_id,
          stripe_event_id: event.id,
          event_type: norm,
          estimate_id: ctx.estimate_id,
          deposit_amount: ctx.deposit_amount,
        },
      });
      delivered = norm === EVENT_TYPES.stripeInvoicePaid && !res.duplicate;
    } else {
      contextResolved = false;
    }
  }

  await db.from("stripe_webhook_events").update({ processed: contextResolved }).eq("id", rowId);
  return { stored_id: rowId, duplicate: false, normalized_type: norm, delivered, processed: contextResolved };
}

export async function processStripeAmbientEvent(db: SupabaseClient, inbox: AmbientInboxRow): Promise<Record<string, unknown>> {
  const event = inbox.payload?.event as StripeEvent | undefined;
  if (!event?.id || !event.type) throw new Error("stripe_ambient_payload_invalid");
  const result = await recordAndProcessStripeEvent(db, event);
  if (result.processed === false) throw new AmbientWaitingForBindingError("stripe_invoice_waiting_for_binding");
  return { ...result };
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
      return c.json({ received: true, ignored: "livemode_rejected" }, 202);
    }

    const queued = await enqueueAmbientEvent(serviceClient(), {
      source_type: "provider_webhook",
      provider: "stripe",
      external_event_id: event.id,
      occurred_at: event.created ? new Date(event.created * 1000).toISOString() : null,
      event_type: event.type,
      subject_key: String((event.data?.object as { id?: string } | undefined)?.id ?? event.id),
      ordering_key: `stripe:${String((event.data?.object as { id?: string } | undefined)?.id ?? event.id)}`,
      payload: { event },
      headers_metadata: { stripe_signature_present: Boolean(c.req.header("Stripe-Signature")) },
      verification_metadata: { stripe_signature_verified: true, livemode: Boolean(event.livemode) },
    });
    return c.json({ received: true, queued: true, duplicate: queued.duplicate }, 202);
  });
}
