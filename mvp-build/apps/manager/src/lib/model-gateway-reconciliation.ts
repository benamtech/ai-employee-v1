import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import type { GatewayCommercialRecord } from "./model-gateway-commercial.js";

export interface ReconciledProviderObservation<T> {
  response: T;
  provider_receipt_id: string;
  amount_minor: number;
  evidence?: Record<string, unknown>;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function hashJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex")}`;
}

function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === "object" ? value[0] as Record<string, unknown> : null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function normalize<T>(row: Record<string, unknown>, prior: GatewayCommercialRecord<T>): GatewayCommercialRecord<T> {
  return {
    ...prior,
    state: String(row.state ?? prior.state) as GatewayCommercialRecord<T>["state"],
    committed_amount_minor: Number(row.committed_amount_minor ?? prior.committed_amount_minor),
    released_amount_minor: Number(row.released_amount_minor ?? prior.released_amount_minor),
    refunded_amount_minor: Number(row.refunded_amount_minor ?? prior.refunded_amount_minor),
    provider_receipt_id: row.provider_receipt_id ? String(row.provider_receipt_id) : null,
    effect_receipt_id: row.effect_receipt_id ? String(row.effect_receipt_id) : null,
    accounting_receipt_id: row.accounting_receipt_id ? String(row.accounting_receipt_id) : null,
    error_code: row.error_code ? String(row.error_code) : null,
    ambiguity_code: row.ambiguity_code ? String(row.ambiguity_code) : null,
    response: row.response && typeof row.response === "object" ? row.response as T : null,
  };
}

/**
 * Reconcile one ambiguous gateway request without creating a second effect:
 * query or replay the existing provider identity, reconcile the original
 * ambiguous command/effect receipt, write accounting against that receipt, and
 * settle the commercial request. A crash after any step is replay-safe.
 */
export async function reconcileAcceptedModelGatewayEffect<T>(
  db: SupabaseClient,
  record: GatewayCommercialRecord<T>,
  resolver: (record: GatewayCommercialRecord<T>) => Promise<ReconciledProviderObservation<T>>,
  recordAccounting: (input: {
    record: GatewayCommercialRecord<T>;
    effect_receipt_id: string;
    observation: ReconciledProviderObservation<T>;
  }) => Promise<string>,
): Promise<GatewayCommercialRecord<T>> {
  if (record.state === "accepted" || record.state === "refunded") return record;
  if (record.state !== "ambiguous") throw new Error("model_gateway_request_not_ambiguous");
  if (!record.command_id || !record.effect_key) throw new Error("model_gateway_reconciliation_identity_missing");

  const observation = await resolver(record);
  if (!observation.provider_receipt_id) throw new Error("model_gateway_reconciliation_provider_receipt_missing");
  if (!Number.isInteger(observation.amount_minor) || observation.amount_minor < 0 || observation.amount_minor > record.reserved_amount_minor) {
    throw new Error("model_gateway_reconciliation_amount_invalid");
  }

  const commandResponse = { result: observation.response };
  const command = await db.rpc("reconcile_ambiguous_command", {
    p_command_id: record.command_id,
    p_target_state: "accepted",
    p_provider_receipt_id: observation.provider_receipt_id,
    p_error_code: null,
    p_response_hash: hashJson(commandResponse),
    p_response: commandResponse,
    p_evidence: {
      request_key: record.request_key,
      revision_id: record.revision_id,
      provider_idempotency_key: record.provider_idempotency_key,
      ...(observation.evidence ?? {}),
    },
  });
  if (command.error) throw command.error;

  const effect = await db.from("effect_receipts")
    .select("id,assignment_id,command_id,effect_key,state,provider_receipt_id")
    .eq("command_id", record.command_id)
    .eq("effect_key", record.effect_key)
    .maybeSingle();
  if (effect.error) throw effect.error;
  if (!effect.data?.id
      || effect.data.assignment_id !== record.assignment_id
      || effect.data.state !== "accepted"
      || effect.data.provider_receipt_id !== observation.provider_receipt_id) {
    throw new Error("model_gateway_reconciled_effect_receipt_missing");
  }

  const effectReceiptId = String(effect.data.id);
  const accountingReceiptId = await recordAccounting({
    record,
    effect_receipt_id: effectReceiptId,
    observation,
  });
  if (!accountingReceiptId) throw new Error("model_gateway_reconciliation_accounting_receipt_missing");

  const result = await db.rpc("reconcile_model_gateway_request", {
    p_request_key: record.request_key,
    p_amount_minor: observation.amount_minor,
    p_provider_receipt_id: observation.provider_receipt_id,
    p_effect_receipt_id: effectReceiptId,
    p_accounting_receipt_id: accountingReceiptId,
    p_response: observation.response,
    p_evidence: {
      repaired_by: "reconcileAcceptedModelGatewayEffect",
      revision_id: record.revision_id,
      ...(observation.evidence ?? {}),
    },
  });
  if (result.error) throw result.error;
  const row = firstRow(result.data);
  if (!row) throw new Error("model_gateway_reconciliation_missing");
  return normalize<T>(row, record);
}
