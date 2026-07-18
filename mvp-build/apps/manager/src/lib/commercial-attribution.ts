import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  validateCommercialAttribution,
  type CommercialAccountingReceipt,
  type CommercialPriceVersionRecord,
  type CommercialRelationshipRecord,
  type ModelGatewayCommercialScope,
} from "@amtech/shared";

export interface ResolvedCommercialScope extends ModelGatewayCommercialScope {
  account_id: string;
  employee_id: string;
  payer_organization_id: string;
  beneficiary_organization_id: string;
  currency: string;
  policy_key: string;
  price_version: string;
}

export interface ProviderUsageReceiptInput extends ResolvedCommercialScope {
  request_id: string;
  provider: string;
  provider_receipt_id?: string | null;
  state: "accepted" | "failed" | "ambiguous";
  meter_kind: string;
  quantity: number;
  amount_minor: number;
  currency: string;
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

async function resolveAssignmentId(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id?: string | null;
}): Promise<string> {
  if (input.assignment_id) {
    const assignment = await db
      .from("employee_assignments")
      .select("id,account_id,employee_principals!inner(employee_id)")
      .eq("id", input.assignment_id)
      .eq("account_id", input.account_id)
      .maybeSingle();
    if (assignment.error) throw assignment.error;
    const principal = assignment.data?.employee_principals as unknown as { employee_id?: string } | { employee_id?: string }[] | null;
    const employeeId = Array.isArray(principal) ? principal[0]?.employee_id : principal?.employee_id;
    if (!assignment.data?.id || employeeId !== input.employee_id) throw new Error("commercial_assignment_scope_mismatch");
    return String(assignment.data.id);
  }

  const result = await db.rpc("amtech_default_assignment_for_employee_account", {
    p_employee_id: input.employee_id,
    p_account_id: input.account_id,
  });
  if (result.error) throw result.error;
  const assignmentId = typeof result.data === "string"
    ? result.data
    : Array.isArray(result.data)
      ? String(result.data[0] ?? "")
      : String(result.data ?? "");
  if (!assignmentId) throw new Error("commercial_assignment_not_unique");
  return assignmentId;
}

export async function resolveCommercialScope(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id?: string | null;
  policy_key?: string;
}): Promise<ResolvedCommercialScope> {
  const assignmentId = await resolveAssignmentId(db, input);
  const now = new Date().toISOString();
  const policyKey = input.policy_key ?? "provider-cost-observation";
  const [relationshipsResult, pricesResult] = await Promise.all([
    db.from("commercial_relationships")
      .select("id,assignment_id,relationship_type,organization_id,account_id,status,starts_at,ends_at")
      .eq("assignment_id", assignmentId)
      .eq("status", "active")
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`),
    db.from("commercial_price_versions")
      .select("id,assignment_id,policy_key,version,currency,unit,unit_price_minor,status,effective_at,expires_at")
      .eq("assignment_id", assignmentId)
      .eq("policy_key", policyKey)
      .eq("status", "active")
      .lte("effective_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("effective_at", { ascending: false }),
  ]);
  if (relationshipsResult.error) throw relationshipsResult.error;
  if (pricesResult.error) throw pricesResult.error;

  const relationships = (relationshipsResult.data ?? []).map((row) => ({
    relationship_id: String(row.id),
    assignment_id: String(row.assignment_id),
    relationship_type: String(row.relationship_type) as "payer" | "beneficiary",
    organization_id: String(row.organization_id),
    account_id: row.account_id ? String(row.account_id) : null,
    status: String(row.status),
    starts_at: String(row.starts_at),
    ends_at: row.ends_at ? String(row.ends_at) : null,
  })) satisfies CommercialRelationshipRecord[];
  const prices = (pricesResult.data ?? []).map((row) => ({
    price_version_id: String(row.id),
    assignment_id: String(row.assignment_id),
    policy_key: String(row.policy_key),
    version: String(row.version),
    currency: String(row.currency),
    unit: String(row.unit),
    unit_price_minor: Number(row.unit_price_minor),
    status: String(row.status),
    effective_at: String(row.effective_at),
    expires_at: row.expires_at ? String(row.expires_at) : null,
  })) satisfies CommercialPriceVersionRecord[];

  const payer = relationships.filter((row) => row.relationship_type === "payer");
  const beneficiary = relationships.filter((row) => row.relationship_type === "beneficiary");
  if (payer.length !== 1) throw new Error(payer.length === 0 ? "commercial_payer_missing" : "commercial_payer_ambiguous");
  if (beneficiary.length !== 1) throw new Error(beneficiary.length === 0 ? "commercial_beneficiary_missing" : "commercial_beneficiary_ambiguous");
  if (prices.length !== 1) throw new Error(prices.length === 0 ? "commercial_price_missing" : "commercial_price_ambiguous");

  const decision = validateCommercialAttribution({
    assignment_id: assignmentId,
    payer_relationship_id: payer[0]!.relationship_id,
    beneficiary_relationship_id: beneficiary[0]!.relationship_id,
    price_version_id: prices[0]!.price_version_id,
    relationships,
    price_versions: prices,
    receipts: [],
    billable: false,
  });
  if (!decision.ok) throw new Error(`commercial_scope_denied:${decision.reason}`);

  return {
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
    payer_relationship_id: decision.payer.relationship_id,
    beneficiary_relationship_id: decision.beneficiary.relationship_id,
    price_version_id: decision.price_version.price_version_id,
    payer_organization_id: decision.payer.organization_id,
    beneficiary_organization_id: decision.beneficiary.organization_id,
    currency: decision.price_version.currency,
    policy_key: decision.price_version.policy_key,
    price_version: decision.price_version.version,
  };
}

export async function recordProviderUsageReceipt(
  db: SupabaseClient,
  input: ProviderUsageReceiptInput,
): Promise<{ accounting_receipt_id: string; meter_event_id: string; duplicate: boolean }> {
  if (input.state === "accepted" && !input.provider_receipt_id) {
    throw new Error("accepted_provider_usage_requires_provider_receipt");
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 0) throw new Error("provider_usage_quantity_invalid");
  if (!Number.isInteger(input.amount_minor) || input.amount_minor < 0) throw new Error("provider_usage_amount_invalid");

  const observedAt = input.observed_at ?? new Date().toISOString();
  const accountingReceiptId = stableId("usage", input.assignment_id, input.provider, input.request_id);
  const meterEventId = stableId("meter", input.assignment_id, input.provider, input.request_id);
  const receipt: CommercialAccountingReceipt = {
    receipt_id: accountingReceiptId,
    assignment_id: input.assignment_id,
    payer_relationship_id: input.payer_relationship_id,
    beneficiary_relationship_id: input.beneficiary_relationship_id,
    price_version_id: input.price_version_id,
    state: input.state,
    provider: input.provider,
    provider_receipt_id: input.provider_receipt_id ?? null,
    effect_receipt_id: null,
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
    relationships: [
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
    ],
    price_versions: [
      {
        price_version_id: input.price_version_id,
        assignment_id: input.assignment_id,
        policy_key: input.policy_key,
        version: input.price_version,
        currency: input.currency,
        unit: input.meter_kind,
        unit_price_minor: 0,
        status: "active",
        effective_at: observedAt,
      },
    ],
    receipts: [receipt],
    billable: true,
    successful_provider_result: input.state === "accepted",
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
    effect_receipt_id: null,
    receipt_kind: "provider_usage",
    provider: input.provider,
    provider_receipt_id: input.provider_receipt_id ?? null,
    state: input.state,
    quantity: input.quantity,
    amount_minor: input.amount_minor,
    currency: input.currency,
    evidence: {
      request_id: input.request_id,
      correlation_id: input.correlation_id,
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
      provider_receipt_id: input.provider_receipt_id ?? null,
      receipt_state: input.state,
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
    provider_id: input.provider_receipt_id ?? null,
    status: input.state,
    metadata_safe: { correlation_id: input.correlation_id },
  }, { onConflict: "id", ignoreDuplicates: true });
  if (legacyMeter.error) throw legacyMeter.error;

  return { accounting_receipt_id: accountingReceiptId, meter_event_id: meterEventId, duplicate };
}
