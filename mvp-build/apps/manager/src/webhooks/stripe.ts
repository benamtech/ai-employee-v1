/** Stripe signature verification and assignment-bound ambient-inbox ingress. */
import type { Hono } from "hono";
import { EVENT_TYPES, ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { verifyStripeSignature } from "../lib/stripe-signature.js";
import { ingestEvent } from "../events/ingress.js";
import { insertDedup } from "../lib/db.js";
import { AmbientWaitingForBindingError, type AmbientInboxRow } from "../lib/ambient-inbox.js";
import { enqueueVerifiedConnectorEvent } from "../lib/connector-custody.js";
import { executeDurableCommandEffect } from "../lib/durable-command-runtime.js";

export interface StripeEvent {
  id: string;
  type: string;
  account?: string;
  livemode?: boolean;
  created?: number;
  data?: { object?: Record<string, unknown> };
}

interface ScopedAmbientInboxRow extends AmbientInboxRow {
  assignment_id?: string | null;
  connector_binding_id?: string | null;
  command_id?: string | null;
}

export function normalizedStripeType(stripeType: string): string | null {
  if (stripeType === "invoice.sent" || stripeType === "invoice.finalized") return EVENT_TYPES.stripeInvoiceSent;
  if (stripeType === "invoice.paid" || stripeType === "invoice.payment_succeeded") return EVENT_TYPES.stripeInvoicePaid;
  return null;
}

async function resolveInvoiceContext(
  db: SupabaseClient,
  event: StripeEvent,
  scope: { connector_id: string; assignment_id: string; account_id: string; employee_id: string },
) {
  const obj = event.data?.object as { id?: string } | undefined;
  const stripeInvoiceId = obj?.id;
  if (!stripeInvoiceId) return null;
  const invoice = await db
    .from("stripe_invoices")
    .select("stripe_connection_id,estimate_id,deposit_amount,assignment_id")
    .eq("stripe_invoice_id", stripeInvoiceId)
    .eq("stripe_connection_id", scope.connector_id)
    .maybeSingle();
  if (invoice.error) throw invoice.error;
  if (!invoice.data) return null;
  if (invoice.data.assignment_id && invoice.data.assignment_id !== scope.assignment_id) return null;
  return {
    assignment_id: scope.assignment_id,
    account_id: scope.account_id,
    employee_id: scope.employee_id,
    estimate_id: invoice.data.estimate_id as string | null,
    deposit_amount: invoice.data.deposit_amount as number | null,
  };
}

export interface StripeProcessResult {
  stored_id?: string;
  duplicate: boolean;
  normalized_type: string | null;
  delivered: boolean;
  processed?: boolean;
}

export async function recordAndProcessStripeEvent(
  db: SupabaseClient,
  event: StripeEvent,
  scope?: { connector_id: string; assignment_id: string; account_id: string; employee_id: string },
): Promise<StripeProcessResult> {
  if (!scope) return { duplicate: false, normalized_type: normalizedStripeType(event.type), delivered: false, processed: false };
  const rowId = newId(ID_PREFIX.stripeWebhookEvent);
  const ins = await insertDedup(
    db.from("stripe_webhook_events").insert({
      id: rowId,
      stripe_event_id: event.id,
      type: event.type,
      livemode: Boolean(event.livemode),
      signature_verified: true,
      processed: false,
      assignment_id: scope.assignment_id,
      trace: {
        object_type: (event.data?.object as { object?: string })?.object ?? null,
        connector_id: scope.connector_id,
      },
    }),
    "stripe_webhook_events.insert",
  );
  if (ins.conflict) return { duplicate: true, normalized_type: normalizedStripeType(event.type), delivered: false };

  const norm = normalizedStripeType(event.type);
  let delivered = false;
  const isInvoiceEvent = norm === EVENT_TYPES.stripeInvoicePaid || norm === EVENT_TYPES.stripeInvoiceSent;
  let contextResolved = true;
  if (isInvoiceEvent) {
    const ctx = await resolveInvoiceContext(db, event, scope);
    if (ctx) {
      const res = await ingestEvent(db, {
        source: "stripe",
        payload: {
          assignment_id: ctx.assignment_id,
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
  const scoped = inbox as ScopedAmbientInboxRow;
  const event = inbox.payload?.event as StripeEvent | undefined;
  if (!event?.id || !event.type) throw new Error("stripe_ambient_payload_invalid");
  if (!scoped.assignment_id || !scoped.connector_binding_id || !scoped.command_id || !inbox.account_id || !inbox.employee_id) {
    throw new AmbientWaitingForBindingError("stripe_assignment_custody_missing");
  }
  const binding = await db
    .from("connector_bindings")
    .select("connector_account_id,external_subject")
    .eq("id", scoped.connector_binding_id)
    .eq("assignment_id", scoped.assignment_id)
    .maybeSingle();
  if (binding.error) throw binding.error;
  const connectorId = String(binding.data?.connector_account_id ?? "");
  if (!connectorId || String(binding.data?.external_subject ?? "") !== String(event.account ?? "")) {
    throw new AmbientWaitingForBindingError("stripe_connection_waiting_for_binding");
  }

  const execution = await executeDurableCommandEffect<Record<string, unknown>>(db, {
    assignment_id: scoped.assignment_id,
    command_id: scoped.command_id,
    effect_key: `stripe:process:${inbox.inbox_id}`,
    provider: "manager",
    operation: "stripe.event.process",
    capability_class: "consumer_dedupe",
    request: {
      inbox_id: inbox.inbox_id,
      connector_binding_id: scoped.connector_binding_id,
      connector_id: connectorId,
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      stripe_account: event.account ?? null,
    },
    apply: async () => {
      const result = await recordAndProcessStripeEvent(db, event, {
        connector_id: connectorId,
        assignment_id: scoped.assignment_id!,
        account_id: inbox.account_id!,
        employee_id: inbox.employee_id!,
      });
      if (result.processed === false) throw new AmbientWaitingForBindingError("stripe_invoice_waiting_for_binding");
      const response = {
        ...result,
        assignment_id: scoped.assignment_id,
        connector_binding_id: scoped.connector_binding_id,
        command_id: scoped.command_id,
      };
      return {
        result: response,
        provider_receipt_id: `ambient:${inbox.inbox_id}`,
        evidence: { inbox_id: inbox.inbox_id, stripe_event_id: event.id, connector_id: connectorId },
      };
    },
  });
  return { ...execution.result, c3_replayed: execution.replayed, effect_receipt_id: execution.receipt_id };
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

    const objectId = String((event.data?.object as { id?: string } | undefined)?.id ?? event.id);
    const externalSubject = String(event.account ?? "");
    if (!externalSubject) {
      const queued = await enqueueVerifiedConnectorEvent(serviceClient(), {
        provider: "stripe",
        external_event_id: event.id,
        external_subject: `unbound:${objectId}`,
        occurred_at: event.created ? new Date(event.created * 1000).toISOString() : null,
        event_type: event.type,
        resource_class: "connector:stripe",
        resource_id: null,
        capability_class: "consumer_dedupe",
        ordering_key: `stripe-unbound:${objectId}`,
        verification_ref: `stripe-signature:${event.id}`,
        payload: { event },
        verification_metadata: { stripe_signature_verified: true, livemode: Boolean(event.livemode), binding_subject_missing: true },
      });
      return c.json({ received: true, queued: true, authorized: false, status: queued.status, reason: queued.reason }, 202);
    }

    const queued = await enqueueVerifiedConnectorEvent(serviceClient(), {
      provider: "stripe",
      external_event_id: event.id,
      external_subject: externalSubject,
      occurred_at: event.created ? new Date(event.created * 1000).toISOString() : null,
      event_type: event.type,
      resource_class: "connector:stripe",
      resource_id: externalSubject,
      capability_class: "consumer_dedupe",
      ordering_key: `stripe:${externalSubject}:${objectId}`,
      verification_ref: `stripe-signature:${event.id}`,
      payload: { event },
      verification_metadata: { stripe_signature_verified: true, livemode: Boolean(event.livemode) },
    });
    return c.json({
      received: true,
      queued: true,
      duplicate: queued.duplicate,
      authorized: queued.status === "authorized",
      status: queued.status,
    }, 202);
  });
}
