import { describe, expect, it } from "vitest";
import {
  CommandIntentSchema,
  CommandProtocolEnvelopeSchema,
  CommandReplayResponseSchema,
  DurableCommandSchema,
  EffectAttemptSchema,
  EffectReceiptSchema,
  commandCanReportSuccess,
  terminalStatusForReceipt,
} from "../../packages/shared/src/command-effect.js";

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;
const observedAt = "2026-07-18T10:00:00.000Z";

const context = {
  kind: "assignment" as const,
  assignmentId: "asn_alpha",
  organizationId: "org_alpha",
  accountId: "acct_alpha",
};

const actor = {
  principalId: "hpr_owner",
  actorClass: "human" as const,
  authenticatedBy: "owner_session_v2",
};

const acceptedReceipt = EffectReceiptSchema.parse({
  id: "erec_alpha",
  commandId: "cmd_alpha",
  effectAttemptId: "eff_alpha",
  effectKey: "send-estimate:estimate_alpha:customer_alpha",
  provider: "gmail",
  operation: "messages.send",
  capabilityClass: "queryable_receipt",
  requestHash: HASH_B,
  state: "accepted",
  providerReceiptId: "gmail-message-alpha",
  errorCode: null,
  ambiguityCode: null,
  evidence: { message_id: "gmail-message-alpha" },
  observedAt,
});

describe("durable command and effect contract", () => {
  it("binds a stable intent to immutable actor, assignment, payload hash, policy, and causation", () => {
    const intent = CommandIntentSchema.parse({
      id: "intent_alpha",
      context,
      actor,
      intentKey: "owner-web:session_alpha:submit_001",
      commandType: "send_estimate_email",
      commandVersion: "1.0.0",
      policyVersion: "approval-policy-v2",
      payload: { estimate_id: "estimate_alpha", recipient: "customer@example.invalid" },
      payloadHash: HASH_A,
      correlationId: "corr_alpha",
      causationId: "turn_alpha",
      requestedAt: observedAt,
    });

    expect(intent.intentKey).toBe("owner-web:session_alpha:submit_001");
    expect(intent.context.kind).toBe("assignment");
    expect(intent.payloadHash).toBe(HASH_A);
    expect(intent.policyVersion).toBe("approval-policy-v2");
  });

  it("requires protocol compatibility, original hash preservation, and explicit actor/context evidence", () => {
    const envelope = CommandProtocolEnvelopeSchema.parse({
      protocolName: "amtech.command",
      protocolVersion: "1.0.0",
      schemaVersion: 1,
      producer: "manager.owner-web",
      compatibility: { minReaderMajor: 1, maxReaderMajor: 1 },
      actor,
      context,
      intentId: "intent_alpha",
      commandId: "cmd_alpha",
      correlationId: "corr_alpha",
      causationId: "turn_alpha",
      policyVersion: "approval-policy-v2",
      createdAt: observedAt,
      payloadHash: HASH_A,
      originalPayloadHash: HASH_A,
    });

    expect(envelope.compatibility).toEqual({ minReaderMajor: 1, maxReaderMajor: 1 });
    expect(envelope.originalPayloadHash).toBe(envelope.payloadHash);

    expect(
      CommandProtocolEnvelopeSchema.safeParse({
        ...envelope,
        compatibility: { minReaderMajor: 2, maxReaderMajor: 1 },
      }).success,
    ).toBe(false);
  });

  it("requires native provider idempotency operations to carry a provider key", () => {
    const base = {
      id: "eff_alpha",
      commandId: "cmd_alpha",
      effectKey: "stripe:invoice:create:invoice_alpha",
      provider: "stripe",
      operation: "invoices.create",
      capabilityClass: "native_idempotency" as const,
      requestHash: HASH_B,
      state: "reserved" as const,
      leaseToken: null,
      leaseExpiresAt: null,
      attemptCount: 0,
      createdAt: observedAt,
      updatedAt: observedAt,
    };

    expect(EffectAttemptSchema.safeParse({ ...base, providerIdempotencyKey: null }).success).toBe(false);
    expect(
      EffectAttemptSchema.parse({ ...base, providerIdempotencyKey: "cmd_alpha:invoice" })
        .providerIdempotencyKey,
    ).toBe("cmd_alpha:invoice");
  });

  it("makes accepted, failed, and ambiguous receipts mutually explicit", () => {
    const failed = EffectReceiptSchema.parse({
      ...acceptedReceipt,
      id: "erec_failed",
      state: "failed",
      providerReceiptId: null,
      errorCode: "provider_rejected",
      ambiguityCode: null,
      evidence: { status_code: 400 },
    });
    const ambiguous = EffectReceiptSchema.parse({
      ...acceptedReceipt,
      id: "erec_ambiguous",
      state: "ambiguous",
      providerReceiptId: null,
      errorCode: null,
      ambiguityCode: "timeout_after_request_write",
      evidence: { timeout_ms: 30000 },
    });

    expect(terminalStatusForReceipt(acceptedReceipt)).toBe("succeeded");
    expect(terminalStatusForReceipt(failed)).toBe("failed");
    expect(terminalStatusForReceipt(ambiguous)).toBe("ambiguous");

    expect(
      EffectReceiptSchema.safeParse({
        ...acceptedReceipt,
        state: "accepted",
        providerReceiptId: null,
      }).success,
    ).toBe(false);
    expect(
      EffectReceiptSchema.safeParse({
        ...ambiguous,
        ambiguityCode: null,
      }).success,
    ).toBe(false);
  });

  it("never reports command success without the matching accepted durable receipt", () => {
    const command = DurableCommandSchema.parse({
      id: "cmd_alpha",
      intentId: "intent_alpha",
      context,
      actor,
      commandType: "send_estimate_email",
      commandVersion: "1.0.0",
      policyVersion: "approval-policy-v2",
      payload: { estimate_id: "estimate_alpha" },
      payloadHash: HASH_A,
      status: "succeeded",
      claimVersion: 1,
      leaseToken: null,
      leaseExpiresAt: null,
      attemptCount: 1,
      terminalReceiptId: "erec_alpha",
      correlationId: "corr_alpha",
      causationId: "turn_alpha",
      createdAt: observedAt,
      updatedAt: observedAt,
    });

    expect(commandCanReportSuccess({ command, receipt: acceptedReceipt })).toBe(true);
    expect(commandCanReportSuccess({ command, receipt: null })).toBe(false);
    expect(
      commandCanReportSuccess({
        command,
        receipt: { ...acceptedReceipt, id: "erec_other" },
      }),
    ).toBe(false);
    expect(
      commandCanReportSuccess({
        command: { ...command, status: "ambiguous" },
        receipt: acceptedReceipt,
      }),
    ).toBe(false);
  });

  it("requires replay responses to reference the same stable intent, command, and terminal receipt", () => {
    const replay = CommandReplayResponseSchema.parse({
      id: "replay_alpha",
      intentId: "intent_alpha",
      commandId: "cmd_alpha",
      status: "succeeded",
      terminalReceiptId: "erec_alpha",
      responseHash: HASH_A,
      response: { status: "ok", provider_id: "gmail-message-alpha" },
      createdAt: observedAt,
    });

    expect(replay.intentId).toBe("intent_alpha");
    expect(replay.commandId).toBe("cmd_alpha");
    expect(replay.terminalReceiptId).toBe("erec_alpha");
  });
});
