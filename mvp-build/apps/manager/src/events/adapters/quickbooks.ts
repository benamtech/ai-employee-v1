import type { SupabaseClient } from "@amtech/db";
import { EVENT_TYPES } from "@amtech/shared";
import { registerEventSource, type NormalizedEvent } from "../registry.js";

/**
 * QuickBooks change-event adapter — the external door for the event mesh
 * (same two-door shape Gmail/Stripe use). The webhook (webhooks/quickbooks.ts)
 * has already verified Intuit's HMAC signature, fanned out per-realmId, and
 * matched a connector; this adapter normalizes one change into an owner-safe
 * fact and hands it to ingestEvent.
 *
 * LETHAL-TRIFECTA NOTE: QBO record text fields (Memo, PrivateNote, DocNumber,
 * custom fields) are frequently vendor- or bank-feed-populated. A live
 * enrichment step (targeted GET of the changed record) MUST treat every such
 * field as untrusted CONTENT to summarize, never an instruction to follow —
 * exactly like Gmail bodies. The webhook notification itself carries no record
 * text (only realm + entity + id + operation), so this metadata-only
 * normalization is inherently instruction-free; when a Phase-B enrichment adds
 * record text to the summary, it stays data. See quickbooks-connector-
 * architecture.md §7 and packages/agent-template/workspace/AGENTS.md.
 */
export interface QboEntityChangePayload {
  account_id: string;
  employee_id: string;
  connector_id: string;
  realm_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  cloudevent_id?: string | null;
}

const OPERATION_VERB: Record<string, string> = {
  Create: "created",
  Update: "updated",
  Delete: "deleted",
  Merge: "merged",
  Void: "voided",
  Emailed: "emailed",
};

function operationVerb(operation: string): string {
  return OPERATION_VERB[operation] ?? `${String(operation ?? "").toLowerCase()}d`;
}

registerEventSource({
  source: "quickbooks",
  async verify(input) {
    const payload = input as QboEntityChangePayload;
    return payload?.account_id && payload.employee_id && payload.realm_id && payload.entity_type && payload.entity_id && payload.operation
      ? { ok: true }
      : { ok: false, reason: "quickbooks_change_fields_required" };
  },
  async normalize(_db: SupabaseClient, input) {
    const payload = input as QboEntityChangePayload;
    const verb = operationVerb(payload.operation);
    const event: NormalizedEvent = {
      account_id: payload.account_id,
      employee_id: payload.employee_id,
      event_type: EVENT_TYPES.quickbooksEntityChanged,
      provider_id: `${payload.entity_type}:${payload.entity_id}`,
      idempotency_key: `${EVENT_TYPES.quickbooksEntityChanged}:${payload.realm_id}:${payload.entity_type}:${payload.entity_id}:${payload.operation}:${payload.cloudevent_id ?? ""}`,
      normalized_payload: {
        realm_id: payload.realm_id,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        operation: payload.operation,
      },
      safe_summary: `A QuickBooks ${payload.entity_type} was ${verb}.`,
      // Deletes/merges warrant a look; routine creates/updates stay quiet unless
      // a Phase-B enrichment rule promotes them.
      triage_hint: payload.operation === "Delete" || payload.operation === "Merge" ? undefined : "silent",
    };
    return event;
  },
  dedupeKey(event) { return event.idempotency_key; },
});
