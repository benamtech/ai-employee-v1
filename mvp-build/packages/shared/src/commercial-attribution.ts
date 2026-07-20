export type CommercialRelationshipType = "payer" | "beneficiary";
export type CommercialReceiptState = "accepted" | "failed" | "ambiguous";

export interface CommercialRelationshipRecord {
  relationship_id: string;
  assignment_id: string;
  relationship_type: CommercialRelationshipType;
  organization_id: string;
  account_id?: string | null;
  status: "active" | "current" | "pending" | "revoked" | "expired" | "ended" | string;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface CommercialPriceVersionRecord {
  price_version_id: string;
  assignment_id: string;
  policy_key: string;
  version: string;
  currency: string;
  unit: string;
  unit_price_minor: number;
  status: "active" | "current" | "draft" | "revoked" | "expired" | string;
  effective_at: string;
  expires_at?: string | null;
}

export interface CommercialAccountingReceipt {
  receipt_id: string;
  assignment_id: string;
  payer_relationship_id: string;
  beneficiary_relationship_id: string;
  price_version_id: string;
  state: CommercialReceiptState;
  provider: string;
  provider_receipt_id?: string | null;
  effect_receipt_id?: string | null;
  quantity: number;
  amount_minor: number;
  currency: string;
  observed_at: string;
}

export interface CommercialAttributionInput {
  assignment_id?: string | null;
  payer_relationship_id?: string | null;
  beneficiary_relationship_id?: string | null;
  price_version_id?: string | null;
  accounting_receipt_id?: string | null;
  relationships: readonly CommercialRelationshipRecord[];
  price_versions: readonly CommercialPriceVersionRecord[];
  receipts: readonly CommercialAccountingReceipt[];
  successful_provider_result?: boolean;
  billable?: boolean;
  amount_minor?: number | null;
  currency?: string | null;
  now?: Date;
}

export type CommercialAttributionDenialReason =
  | "missing_assignment"
  | "missing_payer"
  | "missing_beneficiary"
  | "wrong_commercial_assignment"
  | "inactive_commercial_relationship"
  | "missing_price_version"
  | "inactive_price_version"
  | "missing_accounting_receipt"
  | "accounting_receipt_mismatch"
  | "successful_provider_result_without_accepted_receipt";

export type CommercialAttributionDecision =
  | {
      ok: true;
      status: 200;
      assignment_id: string;
      payer: CommercialRelationshipRecord;
      beneficiary: CommercialRelationshipRecord;
      price_version: CommercialPriceVersionRecord;
      receipt?: CommercialAccountingReceipt;
    }
  | {
      ok: false;
      status: 402 | 403 | 409;
      reason: CommercialAttributionDenialReason;
    };

function parsedAt(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function relationshipCurrent(record: CommercialRelationshipRecord, now: Date): boolean {
  const starts = parsedAt(record.starts_at);
  const ends = parsedAt(record.ends_at);
  return (record.status === "active" || record.status === "current") &&
    (starts === null || starts <= now.getTime()) &&
    (ends === null || now.getTime() < ends);
}

function priceCurrent(record: CommercialPriceVersionRecord, now: Date): boolean {
  const effective = parsedAt(record.effective_at);
  const expires = parsedAt(record.expires_at);
  return (record.status === "active" || record.status === "current") &&
    effective !== null && effective <= now.getTime() &&
    (expires === null || now.getTime() < expires);
}

function deny(reason: CommercialAttributionDenialReason, status: 402 | 403 | 409 = 403): CommercialAttributionDecision {
  return { ok: false, status, reason };
}

export function validateCommercialAttribution(input: CommercialAttributionInput): CommercialAttributionDecision {
  const now = input.now ?? new Date();
  const assignmentId = input.assignment_id;
  if (!assignmentId) return deny("missing_assignment");
  if (!input.payer_relationship_id) return deny("missing_payer");
  if (!input.beneficiary_relationship_id) return deny("missing_beneficiary");

  const payer = input.relationships.find((record) =>
    record.relationship_id === input.payer_relationship_id && record.relationship_type === "payer",
  );
  if (!payer) return deny("missing_payer");
  const beneficiary = input.relationships.find((record) =>
    record.relationship_id === input.beneficiary_relationship_id && record.relationship_type === "beneficiary",
  );
  if (!beneficiary) return deny("missing_beneficiary");
  if (payer.assignment_id !== assignmentId || beneficiary.assignment_id !== assignmentId) {
    return deny("wrong_commercial_assignment");
  }
  if (!relationshipCurrent(payer, now) || !relationshipCurrent(beneficiary, now)) {
    return deny("inactive_commercial_relationship");
  }

  if (!input.price_version_id) return deny("missing_price_version");
  const price = input.price_versions.find((record) => record.price_version_id === input.price_version_id);
  if (!price) return deny("missing_price_version");
  if (price.assignment_id !== assignmentId) return deny("wrong_commercial_assignment");
  if (!priceCurrent(price, now)) return deny("inactive_price_version", 402);

  const receiptRequired = Boolean(input.billable || input.successful_provider_result);
  let receipt: CommercialAccountingReceipt | undefined;
  if (input.accounting_receipt_id) {
    receipt = input.receipts.find((record) => record.receipt_id === input.accounting_receipt_id);
    if (!receipt) return deny("missing_accounting_receipt", 409);
    if (
      receipt.assignment_id !== assignmentId ||
      receipt.payer_relationship_id !== payer.relationship_id ||
      receipt.beneficiary_relationship_id !== beneficiary.relationship_id ||
      receipt.price_version_id !== price.price_version_id ||
      receipt.currency !== (input.currency ?? price.currency) ||
      (input.amount_minor !== null && input.amount_minor !== undefined && receipt.amount_minor !== input.amount_minor)
    ) {
      return deny("accounting_receipt_mismatch", 409);
    }
  } else if (receiptRequired) {
    return deny("missing_accounting_receipt", 409);
  }

  if (input.successful_provider_result && receipt?.state !== "accepted") {
    return deny("successful_provider_result_without_accepted_receipt", 409);
  }

  const accepted: Extract<CommercialAttributionDecision, { ok: true }> = {
    ok: true,
    status: 200,
    assignment_id: assignmentId,
    payer,
    beneficiary,
    price_version: price,
  };
  if (receipt) accepted.receipt = receipt;
  return accepted;
}

export interface AssignmentBudgetSnapshot {
  assignment_id: string;
  price_version_id: string;
  limit_minor: number;
  consumed_minor: number;
  reserved_minor: number;
  in_flight_tolerance_minor: number;
  status: "active" | "current" | "revoked" | "expired" | string;
}

export type AssignmentBudgetDecision =
  | { ok: true; status: 200; projected_minor: number; remaining_minor: number }
  | { ok: false; status: 402 | 403; reason: "missing_budget" | "inactive_budget" | "budget_exceeded"; projected_minor?: number };

export function evaluateAssignmentBudget(input: {
  assignment_id: string;
  price_version_id: string;
  requested_minor: number;
  budget?: AssignmentBudgetSnapshot | null;
}): AssignmentBudgetDecision {
  const budget = input.budget;
  if (!budget) return { ok: false, status: 403, reason: "missing_budget" };
  if (budget.assignment_id !== input.assignment_id || budget.price_version_id !== input.price_version_id) {
    return { ok: false, status: 403, reason: "missing_budget" };
  }
  if (budget.status !== "active" && budget.status !== "current") {
    return { ok: false, status: 402, reason: "inactive_budget" };
  }
  const requested = Math.max(0, Math.trunc(input.requested_minor));
  const projected = budget.consumed_minor + budget.reserved_minor + requested;
  const hardLimit = budget.limit_minor + Math.max(0, budget.in_flight_tolerance_minor);
  if (projected > hardLimit) {
    return { ok: false, status: 402, reason: "budget_exceeded", projected_minor: projected };
  }
  return {
    ok: true,
    status: 200,
    projected_minor: projected,
    remaining_minor: Math.max(0, budget.limit_minor - projected),
  };
}
