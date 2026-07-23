import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  validateCommercialAttribution,
  type CommercialAccountingReceipt,
  type CommercialPriceVersionRecord,
  type CommercialRelationshipRecord,
} from "@amtech/shared";
import type { ResolvedCommercialScope } from "./commercial-attribution.js";

export interface EffectBoundProviderUsageInput extends ResolvedCommercialScope {
  request_id: string;
  effect_receipt_id: string;
  provider: string;
  provider_receipt_id: string;
  meter_kind: string;
  quantity: number;
  amount_minor: number;
  correlation_id: string;
  observed_at?: string;
  evidence?: Record<string, unknown>;
}

function stableId(prefix: string, ...parts: string[]): string {
  return `${prefix}_${createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 30)}`;
}

function sha256Json(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

export async function recordEffectBoundProviderUsage(
  db: SupabaseClient,
  input: EffectBoundProviderUsageInput,
): Promise<{ accounting_receipt_id: string; meter_event_id: string; duplicate: boolean }> {
  if (!input.effect_receipt_id || !input.provider_receipt_id) throw new Error("accepted_provider_usage_requires_effect_and_provider_receipts");
  if (!Number.isFinite(input.quantity) || input.quantity < 0) throw new Error("provider_usage_quantity_invalid");
  if (!Number.isInteger(input.amount_minor) || input.amount_minor < 0) throw new Error("provider_usage_amount_invalid");

  const observedAt = input.observed_at ?? new Date().toISOString();
  const accountingReceiptId = stableId("usage", input.assignment_id, input.provider, input.request_id);
  const meterEventId = stableId("meter", input.assignment_id, input.provider, input.request_id);
  const relationships: CommercialRelationshipRecord[] = [
    {
      relationship_id: input.payer_relationship_id,
      assignment_id: input.assignment_id,
      relationship_type: "payer",
      organization_id: input.payer_organization_id,
      account_id: input.account_id,
      status: "active",
      starts_at: observedAt,
    },
    {
      relationship_id: input.beneficiary_relationship_id,
      assignment_id: input.assignment_id,
      relationship_type: "beneficiary",
      organization_id: input.beneficiary_organization_id,
      account_id: input.account_id,
      status: "active",
      starts_at: observedAt,
    },
  ];
  const priceVersions: CommercialPriceVersionRecord[] = [{
    price_version_id: input.price_version_id,
    assignment_id: input.assignment_id,
    policy_key: input.policy_key,
    version: input.price_version,
    currency: input.currency,
    unit: input.meter_kind,
    unit_price_minor: 0,
    status: "active",
    effective_at: observedAt,
  }];
  const receipt: CommercialAccountingReceipt = {
    receipt_id: accountingReceiptId,
    assignment_id: input.assignment_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    state: "accepted",
    provider: input.provider,
    provider_receipt_id: input.provider_receipt_id,
    effect_receipt_id: input.effect_receipt_id,
    quantity: input.quantity,
    amount_minor: input.amount_minor,
    currency: input.currency,
    observed_at: observedAt,
  };
  const validation = validateCommercialAttribution({
    assignment_id: input.assignment_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    accounting_receipt_id: accountingReceiptId,
    relationships,
    price_versions: priceVersions,
    receipts: [receipt],
    billable: true,
    successful_provider_result: true,
    amount_minor: input.amount_minor,
    currency: input.currency,
    now: new Date(observedAt),
  });
  if (!validation.ok) throw new Error(`commercial_receipt_denied:${validation.reason}`);

  const receiptWrite = await db.from("commercial_usage_receipts").upsert({
    id: accountingReceiptId,
    assignment_id: input.assignment_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    meter_event_id: meterEventId,
    effect_receipt_id: input.effect_receipt_id,
    receipt_kind: "provider_usage",
    provider: input.provider,
    provider_receipt_id: input.provider_receipt_id,
    state: "accepted",
    quantity: input.quantity,
    amount_minor: input.amount_minor,
    currency: input.currency,
    correlation_id: input.correlation_id,
    evidence: {
      request_id: input.request_id,
      correlation_id: input.correlation_id,
      effect_receipt_id: input.effect_receipt_id,
      ...(input.evidence ?? {}),
    },
    observed_at: observedAt,
  }, { onConflict: "id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (receiptWrite.error) throw receiptWrite.error;
  const duplicate = !receiptWrite.data;

  const meterWrite = await db.from("commercial_meter_events").upsert({
    id: meterEventId,
    assignment_id: input.assignment_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    accounting_receipt_id: accountingReceiptId,
    event_key: `${input.provider}:${input.request_id}`,
    meter_kind: input.meter_kind,
    quantity: input.quantity,
    amount_minor: input.amount_minor,
    currency: input.currency,
    correlation_id: input.correlation_id,
    occurred_at: observedAt,
    evidence: {
      provider_receipt_id: input.provider_receipt_id,
      effect_receipt_id: input.effect_receipt_id,
      digest: sha256Json({
        assignment_id: input.assignment_id,
        provider: input.provider,
        request_id: input.request_id,
        quantity: input.quantity,
        amount_minor: input.amount_minor,
      }),
    },
  }, { onConflict: "id", ignoreDuplicates: true });
  if (meterWrite.error) throw meterWrite.error;

  const legacyMeter = await db.from("meter_events").upsert({
    id: meterEventId,
    assignment_id: input.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    accounting_receipt_id: accountingReceiptId,
    category: "model",
    provider: input.provider,
    feature_key: input.meter_kind,
    quantity: input.quantity,
    unit: "provider_request",
    cost_micros: input.amount_minor * 10_000,
    request_id: input.request_id,
    provider_id: input.provider_receipt_id,
    status: "accepted",
    metadata_safe: { correlation_id: input.correlation_id, effect_receipt_id: input.effect_receipt_id },
  }, { onConflict: "id", ignoreDuplicates: true });
  if (legacyMeter.error) throw legacyMeter.error;

  return { accounting_receipt_id: accountingReceiptId, meter_event_id: meterEventId, duplicate };
}
