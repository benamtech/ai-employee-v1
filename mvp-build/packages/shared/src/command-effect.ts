import { z } from "zod";
import {
  ExecutionContextSchema,
  PrincipalActorClassSchema,
} from "./relationship-contract.js";

const prefixedId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[a-z0-9]+$`), `expected ${prefix}_ prefixed id`);

const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/, "expected sha256:<64 lowercase hex>");
const protocolVersion = z.string().regex(/^\d+\.\d+\.\d+$/, "expected semantic protocol version");

export const ProviderCapabilityClassSchema = z.enum([
  "native_idempotency",
  "queryable_receipt",
  "consumer_dedupe",
  "non_idempotent_ambiguous",
]);
export type ProviderCapabilityClass = z.infer<typeof ProviderCapabilityClassSchema>;

export const DurableCommandStatusSchema = z.enum([
  "requested",
  "claimed",
  "succeeded",
  "failed",
  "ambiguous",
  "cancelled",
]);
export type DurableCommandStatus = z.infer<typeof DurableCommandStatusSchema>;

export const EffectAttemptStateSchema = z.enum([
  "reserved",
  "applying",
  "accepted",
  "failed",
  "ambiguous",
  "reconciled",
]);
export type EffectAttemptState = z.infer<typeof EffectAttemptStateSchema>;

export const CommandActorSchema = z.object({
  principalId: z.string().min(1),
  actorClass: PrincipalActorClassSchema,
  authenticatedBy: z.string().min(1),
});
export type CommandActor = z.infer<typeof CommandActorSchema>;

export const CommandProtocolEnvelopeSchema = z.object({
  protocolName: z.string().min(1),
  protocolVersion,
  schemaVersion: z.number().int().positive(),
  producer: z.string().min(1),
  compatibility: z.object({
    minReaderMajor: z.number().int().nonnegative(),
    maxReaderMajor: z.number().int().nonnegative(),
  }).refine((range) => range.minReaderMajor <= range.maxReaderMajor, {
    message: "minReaderMajor must not exceed maxReaderMajor",
  }),
  actor: CommandActorSchema,
  context: ExecutionContextSchema,
  intentId: prefixedId("intent"),
  commandId: prefixedId("cmd"),
  correlationId: z.string().min(1),
  causationId: z.string().min(1).nullable(),
  policyVersion: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  payloadHash: sha256,
  originalPayloadHash: sha256,
});
export type CommandProtocolEnvelope = z.infer<typeof CommandProtocolEnvelopeSchema>;

export const CommandIntentSchema = z.object({
  id: prefixedId("intent"),
  context: ExecutionContextSchema,
  actor: CommandActorSchema,
  intentKey: z.string().min(1),
  commandType: z.string().min(1),
  commandVersion: protocolVersion,
  policyVersion: z.string().min(1),
  payload: z.record(z.unknown()),
  payloadHash: sha256,
  correlationId: z.string().min(1),
  causationId: z.string().min(1).nullable(),
  requestedAt: z.string().datetime({ offset: true }),
});
export type CommandIntent = z.infer<typeof CommandIntentSchema>;

export const DurableCommandSchema = z.object({
  id: prefixedId("cmd"),
  intentId: prefixedId("intent"),
  context: ExecutionContextSchema,
  actor: CommandActorSchema,
  commandType: z.string().min(1),
  commandVersion: protocolVersion,
  policyVersion: z.string().min(1),
  payload: z.record(z.unknown()),
  payloadHash: sha256,
  status: DurableCommandStatusSchema,
  claimVersion: z.number().int().nonnegative(),
  leaseToken: z.string().min(1).nullable(),
  leaseExpiresAt: z.string().datetime({ offset: true }).nullable(),
  attemptCount: z.number().int().nonnegative(),
  terminalReceiptId: prefixedId("erec").nullable(),
  correlationId: z.string().min(1),
  causationId: z.string().min(1).nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type DurableCommand = z.infer<typeof DurableCommandSchema>;

export const EffectAttemptSchema = z.object({
  id: prefixedId("eff"),
  commandId: prefixedId("cmd"),
  effectKey: z.string().min(1),
  provider: z.string().min(1),
  operation: z.string().min(1),
  capabilityClass: ProviderCapabilityClassSchema,
  requestHash: sha256,
  providerIdempotencyKey: z.string().min(1).nullable(),
  state: EffectAttemptStateSchema,
  leaseToken: z.string().min(1).nullable(),
  leaseExpiresAt: z.string().datetime({ offset: true }).nullable(),
  attemptCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).superRefine((attempt, context) => {
  if (
    attempt.capabilityClass === "native_idempotency" &&
    attempt.providerIdempotencyKey === null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["providerIdempotencyKey"],
      message: "native idempotency requires a provider idempotency key",
    });
  }
});
export type EffectAttempt = z.infer<typeof EffectAttemptSchema>;

const receiptBase = z.object({
  id: prefixedId("erec"),
  commandId: prefixedId("cmd"),
  effectAttemptId: prefixedId("eff"),
  effectKey: z.string().min(1),
  provider: z.string().min(1),
  operation: z.string().min(1),
  capabilityClass: ProviderCapabilityClassSchema,
  requestHash: sha256,
  evidence: z.record(z.unknown()),
  observedAt: z.string().datetime({ offset: true }),
});

export const EffectReceiptSchema = z.discriminatedUnion("state", [
  receiptBase.extend({
    state: z.literal("accepted"),
    providerReceiptId: z.string().min(1),
    errorCode: z.null(),
    ambiguityCode: z.null(),
  }),
  receiptBase.extend({
    state: z.literal("failed"),
    providerReceiptId: z.string().min(1).nullable(),
    errorCode: z.string().min(1),
    ambiguityCode: z.null(),
  }),
  receiptBase.extend({
    state: z.literal("ambiguous"),
    providerReceiptId: z.string().min(1).nullable(),
    errorCode: z.null(),
    ambiguityCode: z.string().min(1),
  }),
]);
export type EffectReceipt = z.infer<typeof EffectReceiptSchema>;

export const CommandReplayResponseSchema = z.object({
  id: prefixedId("replay"),
  intentId: prefixedId("intent"),
  commandId: prefixedId("cmd"),
  status: DurableCommandStatusSchema,
  terminalReceiptId: prefixedId("erec").nullable(),
  responseHash: sha256,
  response: z.record(z.unknown()),
  createdAt: z.string().datetime({ offset: true }),
});
export type CommandReplayResponse = z.infer<typeof CommandReplayResponseSchema>;

export function terminalStatusForReceipt(
  receipt: EffectReceipt,
): Extract<DurableCommandStatus, "succeeded" | "failed" | "ambiguous"> {
  if (receipt.state === "accepted") return "succeeded";
  if (receipt.state === "failed") return "failed";
  return "ambiguous";
}

export function commandCanReportSuccess(input: {
  command: Pick<DurableCommand, "status" | "terminalReceiptId">;
  receipt: EffectReceipt | null;
}): boolean {
  return (
    input.command.status === "succeeded" &&
    input.command.terminalReceiptId !== null &&
    input.receipt?.id === input.command.terminalReceiptId &&
    input.receipt.state === "accepted"
  );
}
