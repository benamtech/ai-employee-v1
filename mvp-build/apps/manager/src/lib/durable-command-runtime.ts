import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import type { ProviderCapabilityClass } from "@amtech/shared";

export interface DurableEffectApplyResult<T> {
  result: T;
  provider_receipt_id: string;
  evidence?: Record<string, unknown>;
}

export interface DurableEffectExecution<T> {
  replayed: boolean;
  command_id: string;
  effect_id: string;
  receipt_id: string;
  result: T;
}

export class DurableEffectAmbiguousError extends Error {
  readonly ambiguity_code: string;
  readonly evidence: Record<string, unknown>;

  constructor(ambiguityCode: string, evidence: Record<string, unknown> = {}) {
    super(ambiguityCode);
    this.name = "DurableEffectAmbiguousError";
    this.ambiguity_code = ambiguityCode;
    this.evidence = evidence;
  }
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

function stableId(prefix: "eff" | "erec" | "replay", ...parts: string[]): string {
  return `${prefix}_${createHash("sha256").update(parts.join("\u001f")).digest("hex").slice(0, 32)}`;
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

async function replayResult<T>(db: SupabaseClient, commandId: string): Promise<DurableEffectExecution<T> | null> {
  const replay = await db
    .from("command_replay_responses")
    .select("command_id,terminal_receipt_id,response")
    .eq("command_id", commandId)
    .maybeSingle();
  if (replay.error) throw replay.error;
  if (!replay.data?.terminal_receipt_id) return null;
  const response = replay.data.response as Record<string, unknown> | null;
  if (!response || !("result" in response)) return null;
  const receipt = await db
    .from("effect_receipts")
    .select("id,effect_attempt_id,state")
    .eq("id", replay.data.terminal_receipt_id)
    .maybeSingle();
  if (receipt.error) throw receipt.error;
  if (!receipt.data || receipt.data.state !== "accepted") return null;
  return {
    replayed: true,
    command_id: commandId,
    effect_id: String(receipt.data.effect_attempt_id),
    receipt_id: String(receipt.data.id),
    result: response.result as T,
  };
}

export async function executeDurableCommandEffect<T>(
  db: SupabaseClient,
  input: {
    assignment_id: string;
    command_id: string;
    effect_key: string;
    provider: string;
    operation: string;
    capability_class: ProviderCapabilityClass;
    request: Record<string, unknown>;
    provider_idempotency_key?: string | null;
    lease_seconds?: number;
    apply: () => Promise<DurableEffectApplyResult<T>>;
  },
): Promise<DurableEffectExecution<T>> {
  const existingReplay = await replayResult<T>(db, input.command_id);
  if (existingReplay) return existingReplay;

  const leaseSeconds = Math.max(10, Math.min(input.lease_seconds ?? 120, 3600));
  const leaseToken = `lease_${randomUUID()}`;
  const requestHash = hashJson(input.request);
  const effectId = stableId("eff", input.assignment_id, input.command_id, input.effect_key);
  const receiptId = stableId("erec", effectId, requestHash);
  const replayId = stableId("replay", input.command_id, receiptId);

  const claimed = await db.rpc("claim_durable_command", {
    p_command_id: input.command_id,
    p_lease_token: leaseToken,
    p_lease_seconds: leaseSeconds,
  });
  if (claimed.error) throw claimed.error;
  if (!firstRow<Record<string, unknown>>(claimed.data)) {
    const replay = await replayResult<T>(db, input.command_id);
    if (replay) return replay;
    throw new Error("durable_command_not_claimable");
  }

  const reserved = await db.rpc("reserve_effect_attempt", {
    p_effect_id: effectId,
    p_command_id: input.command_id,
    p_effect_key: input.effect_key,
    p_provider: input.provider,
    p_operation: input.operation,
    p_capability_class: input.capability_class,
    p_request_hash: requestHash,
    p_provider_idempotency_key: input.provider_idempotency_key ?? null,
    p_lease_token: leaseToken,
    p_lease_seconds: leaseSeconds,
  });
  if (reserved.error) throw reserved.error;
  const reservation = firstRow<{ effect_id: string; duplicate: boolean; state: string }>(reserved.data);
  if (!reservation) throw new Error("effect_reservation_missing");
  if (reservation.duplicate) {
    const replay = await replayResult<T>(db, input.command_id);
    if (replay) return replay;
    const receipt = await db
      .from("effect_receipts")
      .select("state,ambiguity_code,error_code")
      .eq("effect_attempt_id", reservation.effect_id)
      .maybeSingle();
    if (receipt.error) throw receipt.error;
    if (receipt.data?.state === "ambiguous") {
      throw new DurableEffectAmbiguousError(String(receipt.data.ambiguity_code ?? "effect_already_ambiguous"));
    }
    throw new Error(`effect_already_${receipt.data?.state ?? reservation.state}`);
  }

  try {
    const applied = await input.apply();
    if (!applied.provider_receipt_id) throw new DurableEffectAmbiguousError("provider_receipt_missing");
    const response = { result: applied.result };
    const recorded = await db.rpc("record_effect_receipt", {
      p_receipt_id: receiptId,
      p_effect_id: effectId,
      p_state: "accepted",
      p_provider_receipt_id: applied.provider_receipt_id,
      p_error_code: null,
      p_ambiguity_code: null,
      p_request_hash: requestHash,
      p_lease_token: leaseToken,
      p_evidence: applied.evidence ?? {},
    });
    if (recorded.error) throw recorded.error;
    const completed = await db.rpc("complete_durable_command", {
      p_command_id: input.command_id,
      p_lease_token: leaseToken,
      p_terminal_receipt_id: receiptId,
      p_replay_id: replayId,
      p_response_hash: hashJson(response),
      p_response: response,
    });
    if (completed.error) throw completed.error;
    return {
      replayed: false,
      command_id: input.command_id,
      effect_id: effectId,
      receipt_id: receiptId,
      result: applied.result,
    };
  } catch (error) {
    if (error instanceof DurableEffectAmbiguousError) {
      const recorded = await db.rpc("record_effect_receipt", {
        p_receipt_id: receiptId,
        p_effect_id: effectId,
        p_state: "ambiguous",
        p_provider_receipt_id: null,
        p_error_code: null,
        p_ambiguity_code: error.ambiguity_code,
        p_request_hash: requestHash,
        p_lease_token: leaseToken,
        p_evidence: error.evidence,
      });
      if (recorded.error) throw recorded.error;
      const response = { result: null, ambiguity_code: error.ambiguity_code };
      const completed = await db.rpc("complete_durable_command", {
        p_command_id: input.command_id,
        p_lease_token: leaseToken,
        p_terminal_receipt_id: receiptId,
        p_replay_id: replayId,
        p_response_hash: hashJson(response),
        p_response: response,
      });
      if (completed.error) throw completed.error;
      throw error;
    }

    const errorCode = String((error as Error)?.message ?? error).slice(0, 160) || "effect_failed";
    const recorded = await db.rpc("record_effect_receipt", {
      p_receipt_id: receiptId,
      p_effect_id: effectId,
      p_state: "failed",
      p_provider_receipt_id: null,
      p_error_code: errorCode,
      p_ambiguity_code: null,
      p_request_hash: requestHash,
      p_lease_token: leaseToken,
      p_evidence: { error_code: errorCode },
    });
    if (recorded.error) throw recorded.error;
    const response = { result: null, error_code: errorCode };
    const completed = await db.rpc("complete_durable_command", {
      p_command_id: input.command_id,
      p_lease_token: leaseToken,
      p_terminal_receipt_id: receiptId,
      p_replay_id: replayId,
      p_response_hash: hashJson(response),
      p_response: response,
    });
    if (completed.error) throw completed.error;
    throw error;
  }
}
