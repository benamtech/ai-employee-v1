import { describe, expect, it } from "vitest";
import {
  evaluateAssignmentBudget,
  resolveConnectorCustody,
  validateCommercialAttribution,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type CommercialAccountingReceipt,
  type CommercialPriceVersionRecord,
  type CommercialRelationshipRecord,
  type ConnectorBindingRecord,
} from "../../packages/shared/src/index.js";

const now = new Date("2026-07-18T15:00:00.000Z");
const future = "2026-07-19T15:00:00.000Z";
const payloadHash = `sha256:${"a".repeat(64)}`;

const assignments: AssignmentPrincipalRecord[] = [
  {
    assignment_id: "assign_1",
    account_id: "acct_1",
    employee_id: "emp_1",
    principal_id: "epr_1",
    role: "operator",
    status: "active",
  },
  {
    assignment_id: "assign_2",
    account_id: "acct_2",
    employee_id: "emp_2",
    principal_id: "epr_2",
    role: "operator",
    status: "active",
  },
];

const grants: AssignmentResourceGrantRecord[] = [
  {
    assignment_id: "assign_1",
    resource_class: "connector:gmail",
    resource_id: "owner@example.test",
    actions: ["connector:event:ingest"],
  },
];

const binding: ConnectorBindingRecord = {
  binding_id: "cb_1",
  provider: "gmail",
  external_subject: "owner@example.test",
  assignment_id: "assign_1",
  account_id: "acct_1",
  employee_id: "emp_1",
  principal_id: "epr_1",
  resource_class: "connector:gmail",
  resource_id: "owner@example.test",
  status: "active",
  policy_version: "authorization-v1",
  capability_class: "consumer_dedupe",
  expires_at: future,
};

const verification = {
  verified: true,
  provider: "gmail",
  verification_ref: "pubsub-jwt:jti_1",
  verified_at: now.toISOString(),
};

describe("S5 connector custody contract", () => {
  it("requires provider verification, one current assignment binding, resource grant, and C3 intent", () => {
    const unverified = resolveConnectorCustody({
      verification: { ...verification, verified: false },
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding],
      assignments,
      grants,
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(unverified.ok).toBe(false);
    if (!unverified.ok) expect(unverified.reason).toBe("invalid_provider_verification");

    const noIntent = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding],
      assignments,
      grants,
      now,
    });
    expect(noIntent.ok).toBe(false);
    if (!noIntent.ok) expect(noIntent.reason).toBe("missing_command_effect_intent");

    const noGrant = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding],
      assignments,
      grants: [],
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(noGrant.ok).toBe(false);
    if (!noGrant.ok) {
      expect(noGrant.reason).toBe("assignment_scope_denied");
      expect(noGrant.scope_reason).toBe("missing_resource_grant");
    }

    const accepted = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding],
      assignments,
      grants,
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.assignment.assignment_id).toBe("assign_1");
      expect(accepted.evidence.grant_checked).toBe(true);
      expect(accepted.evidence.command_effect_checked).toBe(true);
    }
  });

  it("fails closed for ambiguous, revoked, cross-assignment, and conflicting duplicate events", () => {
    const ambiguous = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding, { ...binding, binding_id: "cb_2" }],
      assignments,
      grants,
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(ambiguous.ok).toBe(false);
    if (!ambiguous.ok) expect(ambiguous.reason).toBe("ambiguous_connector_binding");

    const revoked = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [{ ...binding, status: "revoked", revoked_at: now.toISOString() }],
      assignments,
      grants,
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(revoked.ok).toBe(false);
    if (!revoked.ok) expect(revoked.reason).toBe("revoked_or_expired_connector_binding");

    const crossAssignment = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [{ ...binding, assignment_id: "assign_2" }],
      assignments,
      grants,
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(crossAssignment.ok).toBe(false);
    if (!crossAssignment.ok) expect(crossAssignment.reason).toBe("assignment_scope_denied");

    const conflict = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding],
      assignments,
      grants,
      dedupe_record: {
        provider: "gmail",
        external_event_id: "evt_1",
        payload_hash: `sha256:${"b".repeat(64)}`,
        assignment_id: "assign_1",
        command_intent_id: "intent_1",
        processing_state: "processed",
      },
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.reason).toBe("connector_event_conflict");
  });

  it("returns an idempotent duplicate only when assignment, payload, and intent match", () => {
    const duplicate = resolveConnectorCustody({
      verification,
      external_event_id: "evt_1",
      external_subject: binding.external_subject,
      payload_hash: payloadHash,
      bindings: [binding],
      assignments,
      grants,
      dedupe_record: {
        provider: "gmail",
        external_event_id: "evt_1",
        payload_hash: payloadHash,
        assignment_id: "assign_1",
        command_intent_id: "intent_1",
        processing_state: "processed",
      },
      command_effect_intent_id: "intent_1",
      now,
    });
    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) expect(duplicate.duplicate).toBe(true);
  });
});

const relationships: CommercialRelationshipRecord[] = [
  {
    relationship_id: "payer_1",
    assignment_id: "assign_1",
    relationship_type: "payer",
    organization_id: "org_payer",
    account_id: "acct_payer",
    status: "active",
    starts_at: "2026-07-01T00:00:00.000Z",
  },
  {
    relationship_id: "beneficiary_1",
    assignment_id: "assign_1",
    relationship_type: "beneficiary",
    organization_id: "org_beneficiary",
    account_id: "acct_1",
    status: "active",
    starts_at: "2026-07-01T00:00:00.000Z",
  },
];

const prices: CommercialPriceVersionRecord[] = [
  {
    price_version_id: "price_1",
    assignment_id: "assign_1",
    policy_key: "model-token",
    version: "2026-07-18.1",
    currency: "USD",
    unit: "token",
    unit_price_minor: 1,
    status: "active",
    effective_at: "2026-07-18T00:00:00.000Z",
    expires_at: future,
  },
];

const receipts: CommercialAccountingReceipt[] = [
  {
    receipt_id: "usage_1",
    assignment_id: "assign_1",
    payer_relationship_id: "payer_1",
    beneficiary_relationship_id: "beneficiary_1",
    price_version_id: "price_1",
    state: "accepted",
    provider: "openai-compatible",
    provider_receipt_id: "provider_request_1",
    effect_receipt_id: "erec_1",
    quantity: 20,
    amount_minor: 20,
    currency: "USD",
    observed_at: now.toISOString(),
  },
];

describe("S6 commercial attribution contract", () => {
  it("requires assignment, payer, beneficiary, effective price version, and accepted receipt", () => {
    const missingAssignment = validateCommercialAttribution({
      relationships,
      price_versions: prices,
      receipts,
      billable: true,
      now,
    });
    expect(missingAssignment.ok).toBe(false);
    if (!missingAssignment.ok) expect(missingAssignment.reason).toBe("missing_assignment");

    const accepted = validateCommercialAttribution({
      assignment_id: "assign_1",
      payer_relationship_id: "payer_1",
      beneficiary_relationship_id: "beneficiary_1",
      price_version_id: "price_1",
      accounting_receipt_id: "usage_1",
      relationships,
      price_versions: prices,
      receipts,
      billable: true,
      successful_provider_result: true,
      amount_minor: 20,
      currency: "USD",
      now,
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.payer.organization_id).toBe("org_payer");
      expect(accepted.beneficiary.organization_id).toBe("org_beneficiary");
      expect(accepted.receipt?.state).toBe("accepted");
    }
  });

  it("rejects cross-assignment relationships, stale prices, mismatched receipts, and success without accepted receipt", () => {
    const wrongAssignment = validateCommercialAttribution({
      assignment_id: "assign_2",
      payer_relationship_id: "payer_1",
      beneficiary_relationship_id: "beneficiary_1",
      price_version_id: "price_1",
      accounting_receipt_id: "usage_1",
      relationships,
      price_versions: prices,
      receipts,
      billable: true,
      now,
    });
    expect(wrongAssignment.ok).toBe(false);
    if (!wrongAssignment.ok) expect(wrongAssignment.reason).toBe("wrong_commercial_assignment");

    const stalePrice = validateCommercialAttribution({
      assignment_id: "assign_1",
      payer_relationship_id: "payer_1",
      beneficiary_relationship_id: "beneficiary_1",
      price_version_id: "price_1",
      accounting_receipt_id: "usage_1",
      relationships,
      price_versions: [{ ...prices[0]!, status: "expired" }],
      receipts,
      billable: true,
      now,
    });
    expect(stalePrice.ok).toBe(false);
    if (!stalePrice.ok) expect(stalePrice.reason).toBe("inactive_price_version");

    const mismatch = validateCommercialAttribution({
      assignment_id: "assign_1",
      payer_relationship_id: "payer_1",
      beneficiary_relationship_id: "beneficiary_1",
      price_version_id: "price_1",
      accounting_receipt_id: "usage_1",
      relationships,
      price_versions: prices,
      receipts,
      billable: true,
      amount_minor: 21,
      currency: "USD",
      now,
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.reason).toBe("accounting_receipt_mismatch");

    const ambiguousReceipt: CommercialAccountingReceipt = { ...receipts[0]!, receipt_id: "usage_ambiguous", state: "ambiguous" };
    const ambiguous = validateCommercialAttribution({
      assignment_id: "assign_1",
      payer_relationship_id: "payer_1",
      beneficiary_relationship_id: "beneficiary_1",
      price_version_id: "price_1",
      accounting_receipt_id: ambiguousReceipt.receipt_id,
      relationships,
      price_versions: prices,
      receipts: [ambiguousReceipt],
      successful_provider_result: true,
      now,
    });
    expect(ambiguous.ok).toBe(false);
    if (!ambiguous.ok) expect(ambiguous.reason).toBe("successful_provider_result_without_accepted_receipt");
  });

  it("enforces assignment-bound shared budget state with declared in-flight tolerance", () => {
    const accepted = evaluateAssignmentBudget({
      assignment_id: "assign_1",
      price_version_id: "price_1",
      requested_minor: 100,
      budget: {
        assignment_id: "assign_1",
        price_version_id: "price_1",
        limit_minor: 1000,
        consumed_minor: 700,
        reserved_minor: 100,
        in_flight_tolerance_minor: 25,
        status: "active",
      },
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) expect(accepted.projected_minor).toBe(900);

    const denied = evaluateAssignmentBudget({
      assignment_id: "assign_1",
      price_version_id: "price_1",
      requested_minor: 226,
      budget: {
        assignment_id: "assign_1",
        price_version_id: "price_1",
        limit_minor: 1000,
        consumed_minor: 700,
        reserved_minor: 100,
        in_flight_tolerance_minor: 25,
        status: "active",
      },
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe("budget_exceeded");
  });
});
