/**
 * Unit coverage for the Stripe webhook event-recording/processing path
 * (`recordAndProcessStripeEvent`, apps/manager/src/webhooks/stripe.ts). The route
 * (signature + livemode gate + transport) is covered separately; this exercises the
 * pure-w.r.t.-db core: dedupe, livemode persistence, normalize → deliver. Twilio env
 * is left unset so the owner SMS stays `pending` (no network), per the fake-db rule
 * that provider mocks are forbidden in acceptance — this is local logic only.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EVENT_TYPES } from "@amtech/shared";
import { recordAndProcessStripeEvent, type StripeEvent } from "../../apps/manager/src/webhooks/stripe";
import { makeFakeDb, SCHEMA_UNIQUES, type FakeSupabase } from "./_helpers/fake-supabase";

// Guard: ensure no ambient Twilio creds make deliverEmployeeEvent attempt a real send.
beforeEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
});
afterEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
});

/** Seed a known invoice → connection so invoice.paid resolves owner context. */
function seedWithInvoice(): FakeSupabase {
  return makeFakeDb({
    stripe_invoices: [
      { id: "stinv_1", stripe_invoice_id: "in_1", stripe_connection_id: "stcon_1", estimate_id: "art_1", deposit_amount: 84000 },
    ],
    stripe_connections: [
      { id: "stcon_1", account_id: "acct_1", employee_id: "emp_1" },
    ],
  }, { uniques: SCHEMA_UNIQUES });
}

function paidEvent(id: string): StripeEvent {
  return { id, type: "invoice.paid", livemode: false, data: { object: { id: "in_1", object: "invoice" } } };
}

describe("recordAndProcessStripeEvent", () => {
  it("dedupes a Stripe event already recorded (idempotent webhook)", async () => {
    const db = makeFakeDb({ stripe_webhook_events: [{ id: "swe_existing", stripe_event_id: "evt_dup" }] }, { uniques: SCHEMA_UNIQUES });
    const res = await recordAndProcessStripeEvent(db.asClient(), paidEvent("evt_dup"));
    expect(res.duplicate).toBe(true);
    expect(res.delivered).toBe(false);
    expect(res.normalized_type).toBe(EVENT_TYPES.stripeInvoicePaid);
    // No second row written.
    expect(db.tables.stripe_webhook_events).toHaveLength(1);
    expect(db.tables.inbound_events ?? []).toHaveLength(0);
  });

  it("normalizes invoice.paid, resolves context, and delivers an owner work event", async () => {
    const db = seedWithInvoice();
    const res = await recordAndProcessStripeEvent(db.asClient(), paidEvent("evt_paid"));
    expect(res.duplicate).toBe(false);
    expect(res.normalized_type).toBe(EVENT_TYPES.stripeInvoicePaid);
    expect(res.delivered).toBe(true);
    expect(res.stored_id).toBeTruthy();
    // Webhook row stored and marked processed.
    const stored = db.tables.stripe_webhook_events?.[0];
    expect(stored?.stripe_event_id).toBe("evt_paid");
    expect(stored?.signature_verified).toBe(true);
    expect(stored?.processed).toBe(true);
    // Delivery primitive wrote an inbound event + a to_owner message carrying the descriptor.
    expect(db.tables.inbound_events).toHaveLength(1);
    expect(db.tables.inbound_events?.[0]?.event_type).toBe(EVENT_TYPES.stripeInvoicePaid);
    const ownerMsg = db.tables.employee_messages?.find((m) => m.direction === "to_owner");
    expect(ownerMsg).toBeTruthy();
    expect(ownerMsg?.status).toBe("pending"); // no Twilio env → not sent, still visible on web
  });

  it("does not redeliver when the same invoice.paid event arrives twice", async () => {
    const db = seedWithInvoice();
    await recordAndProcessStripeEvent(db.asClient(), paidEvent("evt_twice"));
    const second = await recordAndProcessStripeEvent(db.asClient(), paidEvent("evt_twice"));
    expect(second.duplicate).toBe(true);
    expect(second.delivered).toBe(false);
    expect(db.tables.inbound_events).toHaveLength(1);
  });

  it("leaves unresolved invoice events unprocessed so repair/replay can pick them up", async () => {
    const db = makeFakeDb({ stripe_invoices: [], stripe_connections: [] }, { uniques: SCHEMA_UNIQUES });
    const res = await recordAndProcessStripeEvent(db.asClient(), paidEvent("evt_unresolved"));

    expect(res.duplicate).toBe(false);
    expect(res.normalized_type).toBe(EVENT_TYPES.stripeInvoicePaid);
    expect(res.delivered).toBe(false);
    expect(res.processed).toBe(false);
    expect(db.tables.stripe_webhook_events).toHaveLength(1);
    expect(db.tables.stripe_webhook_events?.[0]?.processed).toBe(false);
    expect(db.tables.inbound_events ?? []).toHaveLength(0);
  });

  it("stores invoice.sent but does not deliver (only paid notifies the owner)", async () => {
    const db = seedWithInvoice();
    const res = await recordAndProcessStripeEvent(db.asClient(), {
      id: "evt_sent", type: "invoice.sent", livemode: false, data: { object: { id: "in_1" } },
    });
    expect(res.normalized_type).toBe(EVENT_TYPES.stripeInvoiceSent);
    expect(res.delivered).toBe(false);
    expect(db.tables.stripe_webhook_events?.[0]?.processed).toBe(true);
    expect(db.tables.inbound_events ?? []).toHaveLength(1);
    expect(db.tables.delivery_decisions?.[0]?.chosen_channel).toBe("none");
  });

  it("stores an unknown event type with a null normalized type and no delivery", async () => {
    const db = seedWithInvoice();
    const res = await recordAndProcessStripeEvent(db.asClient(), {
      id: "evt_unknown", type: "customer.created", livemode: false, data: { object: { id: "cus_1" } },
    });
    expect(res.normalized_type).toBeNull();
    expect(res.delivered).toBe(false);
    expect(db.tables.stripe_webhook_events?.[0]?.type).toBe("customer.created");
  });

  it("persists the livemode flag on the stored webhook row", async () => {
    const db = seedWithInvoice();
    await recordAndProcessStripeEvent(db.asClient(), {
      id: "evt_live", type: "invoice.sent", livemode: true, data: { object: { id: "in_1" } },
    });
    expect(db.tables.stripe_webhook_events?.[0]?.livemode).toBe(true);
  });
});
