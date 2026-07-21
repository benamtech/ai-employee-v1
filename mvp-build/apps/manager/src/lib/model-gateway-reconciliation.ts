import type { SupabaseClient } from "@amtech/db";
import type { GatewayCommercialRecord, GatewayProviderAccepted } from "./model-gateway-commercial.js";

function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === "object" ? value[0] as Record<string, unknown> : null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

/**
 * Resume only the durable receipt/accounting portion of an ambiguous request.
 * The supplied resolver must replay or query the existing provider identity; it
 * must never create a fresh effect identity.
 */
export async function reconcileAcceptedModelGatewayEffect<T>(
  db: SupabaseClient,
  record: GatewayCommercialRecord<T>,
  resolver: (record: GatewayCommercialRecord<T>) => Promise<GatewayProviderAccepted<T>>,
): Promise<GatewayCommercialRecord<T>> {
  if (record.state === "accepted" || record.state === "refunded") return record;
  if (record.state !== "ambiguous") throw new Error("model_gateway_request_not_ambiguous");
  const accepted = await resolver(record);
  if (!accepted.provider_receipt_id || !accepted.effect_receipt_id || !accepted.accounting_receipt_id) {
    throw new Error("model_gateway_reconciliation_receipts_missing");
  }
  const result = await db.rpc("reconcile_model_gateway_request", {
    p_request_key: record.request_key,
    p_amount_minor: accepted.amount_minor,
    p_provider_receipt_id: accepted.provider_receipt_id,
    p_effect_receipt_id: accepted.effect_receipt_id,
    p_accounting_receipt_id: accepted.accounting_receipt_id,
    p_response: accepted.response,
    p_evidence: accepted.evidence ?? {},
  });
  if (result.error) throw result.error;
  const row = firstRow(result.data);
  if (!row) throw new Error("model_gateway_reconciliation_missing");
  return {
    ...record,
    state: String(row.state) as GatewayCommercialRecord<T>["state"],
    committed_amount_minor: Number(row.committed_amount_minor ?? 0),
    released_amount_minor: Number(row.released_amount_minor ?? 0),
    refunded_amount_minor: Number(row.refunded_amount_minor ?? 0),
    provider_receipt_id: row.provider_receipt_id ? String(row.provider_receipt_id) : null,
    effect_receipt_id: row.effect_receipt_id ? String(row.effect_receipt_id) : null,
    accounting_receipt_id: row.accounting_receipt_id ? String(row.accounting_receipt_id) : null,
    error_code: row.error_code ? String(row.error_code) : null,
    ambiguity_code: row.ambiguity_code ? String(row.ambiguity_code) : null,
    response: row.response && typeof row.response === "object" ? row.response as T : null,
  };
}
