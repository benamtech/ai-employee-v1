import { createHash } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";

export type GatewayCommercialState = "admitted" | "dispatched" | "accepted" | "failed" | "ambiguous" | "denied" | "refunded";
export type GatewayProofState = "pending" | "projected" | "not_applicable" | "failed";

export interface GatewayRequestIdentityInput {
  assignment_id: string;
  credential_id: string;
  revision_id: string;
  route_key: string;
  request: Record<string, unknown>;
  reserve_amount_minor: number;
  rate_window_key: string;
  correlation_id?: string;
}

export interface GatewayRequestIdentity {
  request_key: string;
  request_hash: string;
  effect_key: string;
  provider_idempotency_key: string;
}

export interface GatewayCommercialAdmission extends GatewayRequestIdentity {
  assignment_id: string;
  credential_id: string;
  revision_id: string;
  route_key: string;
  reserve_amount_minor: number;
  rate_window_key: string;
  correlation_id: string;
}

export interface GatewayCommercialRecord<T> {
  request_key: string;
  assignment_id: string;
  revision_id: string;
  request_hash: string;
  provider_idempotency_key: string;
  rate_window_key: string;
  state: GatewayCommercialState;
  reserved_amount_minor: number;
  committed_amount_minor: number;
  released_amount_minor: number;
  refunded_amount_minor: number;
  provider_receipt_id: string | null;
  effect_receipt_id: string | null;
  accounting_receipt_id: string | null;
  error_code: string | null;
  ambiguity_code: string | null;
  response: T | null;
  proof_state: GatewayProofState;
  proof_ref: string | null;
  command_id?: string | null;
  command_intent_id?: string | null;
  effect_key?: string | null;
  correlation_id?: string | null;
}

export interface GatewaySettlementInput<T> {
  request_key: string;
  state: "accepted" | "failed" | "ambiguous";
  amount_minor: number;
  provider_receipt_id?: string | null;
  effect_receipt_id?: string | null;
  accounting_receipt_id?: string | null;
  error_code?: string | null;
  ambiguity_code?: string | null;
  response?: T | null;
  evidence?: Record<string, unknown>;
}

export interface GatewayCommercialStore<T> {
  admit(input: GatewayCommercialAdmission): Promise<{
    kind: "admitted" | "replay" | "denied";
    record: GatewayCommercialRecord<T>;
    reason?: string;
  }>;
  markDispatched(requestKey: string): Promise<GatewayCommercialRecord<T>>;
  settle(input: GatewaySettlementInput<T>): Promise<GatewayCommercialRecord<T>>;
  markProofProjected(requestKey: string, proofRef: string): Promise<GatewayCommercialRecord<T>>;
  waitForTerminal?(requestKey: string, timeoutMs?: number): Promise<GatewayCommercialRecord<T>>;
}

export interface GatewayProviderAccepted<T> {
  response: T;
  provider_receipt_id: string;
  effect_receipt_id: string;
  accounting_receipt_id: string;
  amount_minor: number;
  evidence?: Record<string, unknown>;
}

export interface GatewayExecutionResult<T> {
  state: GatewayCommercialState;
  replayed: boolean;
  error_code: string | null;
  ambiguity_code: string | null;
  proof_state: GatewayProofState;
  record: GatewayCommercialRecord<T>;
  response: T | null;
}

export class ProviderOutcomeAmbiguousError extends Error {
  readonly ambiguity_code: string;
  readonly evidence: Record<string, unknown>;

  constructor(ambiguityCode: string, evidence: Record<string, unknown> = {}) {
    super(ambiguityCode);
    this.name = "ProviderOutcomeAmbiguousError";
    this.ambiguity_code = ambiguityCode;
    this.evidence = evidence;
  }
}

export class ProofProjectionPendingError extends Error {
  readonly request_key: string;
  readonly effect_receipt_id: string;
  readonly cause_message: string;

  constructor(record: GatewayCommercialRecord<unknown>, cause: unknown) {
    const causeMessage = String((cause as Error)?.message ?? cause);
    super(`proof_projection_pending:${record.request_key}:${causeMessage}`);
    this.name = "ProofProjectionPendingError";
    this.request_key = record.request_key;
    this.effect_receipt_id = String(record.effect_receipt_id ?? "");
    this.cause_message = causeMessage;
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

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function gatewayRequestIdentity(input: GatewayRequestIdentityInput): GatewayRequestIdentity {
  if (!input.assignment_id || !input.credential_id || !input.revision_id || !input.route_key) {
    throw new Error("gateway_request_identity_incomplete");
  }
  if (!Number.isInteger(input.reserve_amount_minor) || input.reserve_amount_minor < 0) {
    throw new Error("gateway_reservation_amount_invalid");
  }
  const requestHash = `sha256:${digest(JSON.stringify(canonicalize(input.request)))}`;
  const identityHash = digest([
    input.assignment_id,
    input.credential_id,
    input.revision_id,
    input.route_key,
    requestHash,
  ].join("\u001f"));
  return {
    request_key: `mgreq_${identityHash.slice(0, 32)}`,
    request_hash: requestHash,
    effect_key: `model_gateway:${identityHash.slice(0, 40)}`,
    provider_idempotency_key: `amtech-${identityHash.slice(0, 48)}`,
  };
}

function normalizeRecord<T>(row: Record<string, unknown>): GatewayCommercialRecord<T> {
  return {
    request_key: String(row.request_key ?? ""),
    assignment_id: String(row.assignment_id ?? ""),
    revision_id: String(row.revision_id ?? ""),
    request_hash: String(row.request_hash ?? ""),
    provider_idempotency_key: String(row.provider_idempotency_key ?? ""),
    rate_window_key: String(row.rate_window_key ?? ""),
    state: String(row.state ?? "failed") as GatewayCommercialState,
    reserved_amount_minor: Number(row.reserved_amount_minor ?? 0),
    committed_amount_minor: Number(row.committed_amount_minor ?? 0),
    released_amount_minor: Number(row.released_amount_minor ?? 0),
    refunded_amount_minor: Number(row.refunded_amount_minor ?? 0),
    provider_receipt_id: row.provider_receipt_id ? String(row.provider_receipt_id) : null,
    effect_receipt_id: row.effect_receipt_id ? String(row.effect_receipt_id) : null,
    accounting_receipt_id: row.accounting_receipt_id ? String(row.accounting_receipt_id) : null,
    error_code: row.error_code ? String(row.error_code) : null,
    ambiguity_code: row.ambiguity_code ? String(row.ambiguity_code) : null,
    response: row.response && typeof row.response === "object" ? row.response as T : null,
    proof_state: String(row.proof_state ?? "pending") as GatewayProofState,
    proof_ref: row.proof_ref ? String(row.proof_ref) : null,
    command_id: row.command_id ? String(row.command_id) : null,
    command_intent_id: row.command_intent_id ? String(row.command_intent_id) : null,
    effect_key: row.effect_key ? String(row.effect_key) : null,
    correlation_id: row.correlation_id ? String(row.correlation_id) : null,
  };
}

function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === "object" ? value[0] as Record<string, unknown> : null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

export function createSupabaseGatewayCommercialStore<T>(db: SupabaseClient): GatewayCommercialStore<T> {
  return {
    async admit(input) {
      const result = await db.rpc("admit_model_gateway_request", {
        p_request_key: input.request_key,
        p_assignment_id: input.assignment_id,
        p_credential_id: input.credential_id,
        p_revision_id: input.revision_id,
        p_request_hash: input.request_hash,
        p_route_key: input.route_key,
        p_provider_idempotency_key: input.provider_idempotency_key,
        p_rate_window_key: input.rate_window_key,
        p_reserve_amount_minor: input.reserve_amount_minor,
        p_correlation_id: input.correlation_id,
      });
      if (result.error) throw result.error;
      const row = firstRow(result.data);
      if (!row) throw new Error("gateway_admission_missing");
      const kind = String(row.admission_kind ?? "denied") as "admitted" | "replay" | "denied";
      return { kind, record: normalizeRecord<T>(row), reason: row.error_code ? String(row.error_code) : undefined };
    },
    async markDispatched(requestKey) {
      const result = await db.rpc("mark_model_gateway_request_dispatched", { p_request_key: requestKey });
      if (result.error) throw result.error;
      const row = firstRow(result.data);
      if (!row) throw new Error("gateway_dispatch_state_missing");
      return normalizeRecord<T>(row);
    },
    async settle(input) {
      const result = await db.rpc("settle_model_gateway_request", {
        p_request_key: input.request_key,
        p_state: input.state,
        p_amount_minor: input.amount_minor,
        p_provider_receipt_id: input.provider_receipt_id ?? null,
        p_effect_receipt_id: input.effect_receipt_id ?? null,
        p_accounting_receipt_id: input.accounting_receipt_id ?? null,
        p_error_code: input.error_code ?? null,
        p_ambiguity_code: input.ambiguity_code ?? null,
        p_response: input.response ?? {},
        p_evidence: input.evidence ?? {},
      });
      if (result.error) throw result.error;
      const row = firstRow(result.data);
      if (!row) throw new Error("gateway_settlement_missing");
      return normalizeRecord<T>(row);
    },
    async markProofProjected(requestKey, proofRef) {
      const result = await db.rpc("project_model_gateway_request_proof", {
        p_request_key: requestKey,
        p_proof_ref: proofRef,
      });
      if (result.error) throw result.error;
      const row = firstRow(result.data);
      if (!row) throw new Error("gateway_proof_projection_missing");
      return normalizeRecord<T>(row);
    },
    async waitForTerminal(requestKey, timeoutMs = 5_000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const result = await db.from("model_gateway_request_reservations").select("*").eq("request_key", requestKey).maybeSingle();
        if (result.error) throw result.error;
        if (result.data) {
          const record = normalizeRecord<T>(result.data as Record<string, unknown>);
          if (!["admitted", "dispatched"].includes(record.state)) return record;
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      throw new Error("gateway_request_still_in_progress");
    },
  };
}

async function waitForTerminal<T>(store: GatewayCommercialStore<T>, record: GatewayCommercialRecord<T>): Promise<GatewayCommercialRecord<T>> {
  if (store.waitForTerminal) return store.waitForTerminal(record.request_key);
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (!["admitted", "dispatched"].includes(record.state)) return record;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("gateway_request_still_in_progress");
}

async function projectAcceptedProof<T>(
  store: GatewayCommercialStore<T>,
  record: GatewayCommercialRecord<T>,
  projectProof?: (accepted: GatewayCommercialRecord<T>) => Promise<string>,
): Promise<GatewayCommercialRecord<T>> {
  if (!projectProof || record.proof_state === "projected") return record;
  try {
    const proofRef = await projectProof(record);
    if (!proofRef) throw new Error("proof_ref_missing");
    return await store.markProofProjected(record.request_key, proofRef);
  } catch (error) {
    throw new ProofProjectionPendingError(record as GatewayCommercialRecord<unknown>, error);
  }
}

export async function executeCommercialProviderRequest<T>(
  store: GatewayCommercialStore<T>,
  input: GatewayRequestIdentityInput & {
    provider: (context: GatewayCommercialRecord<T>) => Promise<GatewayProviderAccepted<T>>;
    projectProof?: (accepted: GatewayCommercialRecord<T>) => Promise<string>;
  },
): Promise<GatewayExecutionResult<T>> {
  const identity = gatewayRequestIdentity(input);
  const admitted = await store.admit({
    ...identity,
    assignment_id: input.assignment_id,
    credential_id: input.credential_id,
    revision_id: input.revision_id,
    route_key: input.route_key,
    reserve_amount_minor: input.reserve_amount_minor,
    rate_window_key: input.rate_window_key,
    correlation_id: input.correlation_id ?? identity.request_key,
  });

  if (admitted.kind === "denied") {
    return {
      state: "denied",
      replayed: false,
      error_code: admitted.reason ?? admitted.record.error_code,
      ambiguity_code: null,
      proof_state: admitted.record.proof_state,
      record: admitted.record,
      response: null,
    };
  }

  if (admitted.kind === "replay") {
    let replay = admitted.record;
    if (["admitted", "dispatched"].includes(replay.state)) replay = await waitForTerminal(store, replay);
    if (replay.state === "accepted") replay = await projectAcceptedProof(store, replay, input.projectProof);
    return {
      state: replay.state,
      replayed: true,
      error_code: replay.error_code,
      ambiguity_code: replay.ambiguity_code,
      proof_state: replay.proof_state,
      record: replay,
      response: replay.response,
    };
  }

  const dispatched = await store.markDispatched(identity.request_key);
  try {
    const accepted = await input.provider(dispatched);
    if (!accepted.provider_receipt_id || !accepted.effect_receipt_id || !accepted.accounting_receipt_id) {
      throw new ProviderOutcomeAmbiguousError("accepted_result_missing_durable_receipt", {
        provider_receipt_present: Boolean(accepted.provider_receipt_id),
        effect_receipt_present: Boolean(accepted.effect_receipt_id),
        accounting_receipt_present: Boolean(accepted.accounting_receipt_id),
      });
    }
    if (!Number.isInteger(accepted.amount_minor) || accepted.amount_minor < 0 || accepted.amount_minor > dispatched.reserved_amount_minor) {
      throw new Error("gateway_settlement_amount_invalid");
    }
    let settled = await store.settle({
      request_key: identity.request_key,
      state: "accepted",
      amount_minor: accepted.amount_minor,
      provider_receipt_id: accepted.provider_receipt_id,
      effect_receipt_id: accepted.effect_receipt_id,
      accounting_receipt_id: accepted.accounting_receipt_id,
      response: accepted.response,
      evidence: accepted.evidence,
    });
    settled.committed_amount_minor = accepted.amount_minor;
    settled.released_amount_minor = Math.max(0, settled.reserved_amount_minor - accepted.amount_minor);
    settled = await projectAcceptedProof(store, settled, input.projectProof);
    return {
      state: settled.state,
      replayed: false,
      error_code: null,
      ambiguity_code: null,
      proof_state: settled.proof_state,
      record: settled,
      response: settled.response,
    };
  } catch (error) {
    if (error instanceof ProofProjectionPendingError) throw error;
    if (error instanceof ProviderOutcomeAmbiguousError) {
      const ambiguous = await store.settle({
        request_key: identity.request_key,
        state: "ambiguous",
        amount_minor: 0,
        ambiguity_code: error.ambiguity_code,
        evidence: error.evidence,
      });
      return {
        state: "ambiguous",
        replayed: false,
        error_code: null,
        ambiguity_code: error.ambiguity_code,
        proof_state: ambiguous.proof_state,
        record: ambiguous,
        response: null,
      };
    }
    const errorCode = String((error as Error)?.message ?? error).slice(0, 160) || "provider_failed";
    const failed = await store.settle({
      request_key: identity.request_key,
      state: "failed",
      amount_minor: 0,
      error_code: errorCode,
      evidence: { error_code: errorCode },
    });
    failed.released_amount_minor = failed.reserved_amount_minor;
    return {
      state: "failed",
      replayed: false,
      error_code: errorCode,
      ambiguity_code: null,
      proof_state: failed.proof_state,
      record: failed,
      response: null,
    };
  }
}

export function assertCommercialConservation(record: GatewayCommercialRecord<unknown>): { conserved: boolean; delta_minor: number } {
  const outstanding = Math.max(0, record.reserved_amount_minor - record.committed_amount_minor - record.released_amount_minor);
  const reservationDelta = record.reserved_amount_minor - record.committed_amount_minor - record.released_amount_minor - outstanding;
  const netCommitted = Math.max(0, record.committed_amount_minor - record.refunded_amount_minor);
  const refundDelta = record.committed_amount_minor - netCommitted - record.refunded_amount_minor;
  const delta = reservationDelta + refundDelta;
  const nonnegative = [
    record.reserved_amount_minor,
    record.committed_amount_minor,
    record.released_amount_minor,
    record.refunded_amount_minor,
    outstanding,
    netCommitted,
  ].every((value) => Number.isInteger(value) && value >= 0);
  return { conserved: nonnegative && delta === 0, delta_minor: delta };
}
