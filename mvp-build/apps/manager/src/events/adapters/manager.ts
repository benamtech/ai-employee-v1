import type { SupabaseClient } from "@amtech/db";
import { registerEventSource, type NormalizedEvent } from "../registry.js";

registerEventSource({
  source: "manager",
  async verify(input) {
    const event = input as NormalizedEvent;
    return event?.account_id && event.employee_id && event.event_type && event.idempotency_key && event.safe_summary
      ? { ok: true }
      : { ok: false, reason: "manager_event_fields_required" };
  },
  async normalize(_db: SupabaseClient, input) { return input as NormalizedEvent; },
  dedupeKey(event) { return event.idempotency_key; },
});
