import type { SupabaseClient } from "@amtech/db";
import { EVENT_TYPES } from "@amtech/shared";
import { registerEventSource, type NormalizedEvent } from "../registry.js";

export interface StripeInvoicePayload {
  account_id: string;
  employee_id: string;
  stripe_event_id: string;
  event_type: typeof EVENT_TYPES.stripeInvoicePaid | typeof EVENT_TYPES.stripeInvoiceSent;
  estimate_id?: string | null;
  deposit_amount?: number | null;
}

registerEventSource({
  source: "stripe",
  async verify(input) {
    const payload = input as StripeInvoicePayload;
    return payload?.account_id && payload.employee_id && payload.stripe_event_id && payload.event_type
      ? { ok: true }
      : { ok: false, reason: "stripe_invoice_fields_required" };
  },
  async normalize(_db: SupabaseClient, input) {
    const payload = input as StripeInvoicePayload;
    const amount = payload.deposit_amount != null ? ` ($${(Number(payload.deposit_amount) / 100).toFixed(2)})` : "";
    const paid = payload.event_type === EVENT_TYPES.stripeInvoicePaid;
    const event: NormalizedEvent = {
      account_id: payload.account_id,
      employee_id: payload.employee_id,
      event_type: payload.event_type,
      provider_id: payload.stripe_event_id,
      idempotency_key: `${payload.event_type}:${payload.stripe_event_id}`,
      normalized_payload: {
        stripe_event_id: payload.stripe_event_id,
        related_estimate_id: payload.estimate_id ?? null,
        deposit_amount: payload.deposit_amount ?? null,
      },
      safe_summary: paid ? `The deposit invoice was paid${amount}.` : `The deposit invoice was sent${amount}.`,
      suggested_next_action: paid ? "Confirm the job start with the customer and set a reminder." : undefined,
      triage_hint: paid ? undefined : "silent",
    };
    return event;
  },
  dedupeKey(event) { return event.idempotency_key; },
});
