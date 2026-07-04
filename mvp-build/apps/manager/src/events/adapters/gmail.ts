import type { SupabaseClient } from "@amtech/db";
import { EVENT_TYPES } from "@amtech/shared";
import { registerEventSource, type NormalizedEvent } from "../registry.js";

export interface GmailReplyPayload {
  account_id: string;
  employee_id: string;
  inbound_email_event_id?: string;
  message_id: string;
  thread_id: string;
  from?: string | null;
  snippet?: string | null;
  related_estimate_id?: string | null;
}

function snippet(value?: string | null): string {
  return String(value ?? "").replace(/\s+/g, " ").slice(0, 500);
}

registerEventSource({
  source: "gmail",
  async verify(input) {
    const payload = input as GmailReplyPayload;
    return payload?.account_id && payload.employee_id && payload.message_id && payload.thread_id
      ? { ok: true }
      : { ok: false, reason: "gmail_reply_fields_required" };
  },
  async normalize(_db: SupabaseClient, input) {
    const payload = input as GmailReplyPayload;
    const body = snippet(payload.snippet);
    const event: NormalizedEvent = {
      account_id: payload.account_id,
      employee_id: payload.employee_id,
      event_type: EVENT_TYPES.gmailReplyReceived,
      provider_id: payload.message_id,
      idempotency_key: `${EVENT_TYPES.gmailReplyReceived}:${payload.message_id}`,
      normalized_payload: {
        inbound_email_event_id: payload.inbound_email_event_id ?? null,
        message_id: payload.message_id,
        thread_id: payload.thread_id,
        from: payload.from ?? null,
        related_estimate_id: payload.related_estimate_id ?? null,
        snippet: body,
      },
      safe_summary: payload.from
        ? `${payload.from} replied on an estimate thread: "${body}"`
        : `A customer replied on an estimate thread: "${body}"`,
      suggested_next_action: "Decide whether to reply, send the deposit invoice, or schedule the job.",
    };
    return event;
  },
  dedupeKey(event) { return event.idempotency_key; },
});
