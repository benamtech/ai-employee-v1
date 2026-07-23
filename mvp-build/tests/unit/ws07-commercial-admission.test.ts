import { describe, expect, it } from "vitest";
import {
  ProviderOutcomeAmbiguousError,
  assertCommercialConservation,
  executeCommercialProviderRequest,
  gatewayRequestIdentity,
  type GatewayCommercialAdmission,
  type GatewayCommercialRecord,
  type GatewayCommercialStore,
  type GatewaySettlementInput,
} from "../../apps/manager/src/lib/model-gateway-commercial.js";

class MemoryStore<T> implements GatewayCommercialStore<T> {
  readonly records = new Map<string, GatewayCommercialRecord<T>>();
  private serial: Promise<void> = Promise.resolve();
  constructor(private readonly options: { rateLimit?: number; budgetMinor?: number } = {}) {}

  async admit(input: GatewayCommercialAdmission): Promise<{ kind: "admitted" | "replay" | "denied"; record: GatewayCommercialRecord<T>; reason?: string }> {
    let release!: () => void;
    const wait = this.serial;
    this.serial = new Promise<void>((resolve) => { release = resolve; });
    await wait;
    try {
      const existing = this.records.get(input.request_key);
      if (existing) return { kind: "replay", record: existing };
      const admittedCount = [...this.records.values()].filter((row) => row.rate_window_key === input.rate_window_key).length;
      if (admittedCount >= (this.options.rateLimit ?? Number.POSITIVE_INFINITY)) {
        const denied = record<T>(input, "denied");
        denied.error_code = "rate_limit_exceeded";
        return { kind: "denied", record: denied, reason: denied.error_code };
      }
      const reserved = [...this.records.values()].reduce((sum, row) => sum + row.reserved_amount_minor - row.released_amount_minor - row.committed_amount_minor, 0);
      if (reserved + input.reserve_amount_minor > (this.options.budgetMinor ?? Number.POSITIVE_INFINITY)) {
        const denied = record<T>(input, "denied");
        denied.error_code = "budget_reservation_conflict";
        return { kind: "denied", record: denied, reason: denied.error_code };
      }
      const row = record<T>(input, "admitted");
      this.records.set(input.request_key, row);
      return { kind: "admitted", record: row };
    } finally {
      release();
    }
  }

  async markDispatched(requestKey: string): Promise<GatewayCommercialRecord<T>> {
    const row = must(this.records.get(requestKey));
    row.state = "dispatched";
    return row;
  }

  async settle(input: GatewaySettlementInput<T>): Promise<GatewayCommercialRecord<T>> {
    const row = must(this.records.get(input.request_key));
    row.state = input.state;
    row.provider_receipt_id = input.provider_receipt_id ?? null;
    row.effect_receipt_id = input.effect_receipt_id ?? null;
    row.accounting_receipt_id = input.accounting_receipt_id ?? null;
    row.error_code = input.error_code ?? null;
    row.ambiguity_code = input.ambiguity_code ?? null;
    row.response = input.response ?? null;
    if (input.state === "accepted") row.committed_amount_minor = input.amount_minor;
    if (input.state === "failed") row.released_amount_minor = row.reserved_amount_minor;
    return row;
  }

  async markProofProjected(requestKey: string, proofRef: string): Promise<GatewayCommercialRecord<T>> {
    const row = must(this.records.get(requestKey));
    row.proof_state = "projected";
    row.proof_ref = proofRef;
    return row;
  }
}

function record<T>(input: GatewayCommercialAdmission, state: GatewayCommercialRecord<T>["state"]): GatewayCommercialRecord<T> {
  return {
    request_key: input.request_key,
    assignment_id: input.assignment_id,
    revision_id: input.revision_id,
    request_hash: input.request_hash,
    provider_idempotency_key: input.provider_idempotency_key,
    rate_window_key: input.rate_window_key,
    state,
    reserved_amount_minor: state === "admitted" ? input.reserve_amount_minor : 0,
    committed_amount_minor: 0,
    released_amount_minor: 0,
    refunded_amount_minor: 0,
    provider_receipt_id: null,
    effect_receipt_id: null,
    accounting_receipt_id: null,
    error_code: null,
    ambiguity_code: null,
    response: null,
    proof_state: "pending",
    proof_ref: null,
  };
}

function must<T>(value: T | undefined): T {
  if (!value) throw new Error("missing_test_record");
  return value;
}

const base = {
  assignment_id: "asn_ws07",
  credential_id: "mgwc_ws07",
  revision_id: "request-revision-1",
  route_key: "openai_compatible:model-a:/chat/completions",
  request: { model: "amtech-primary", messages: [{ role: "user", content: "ping" }] },
  reserve_amount_minor: 10,
  rate_window_key: "mgwc_ws07:2026-07-20T23:59",
};

describe("WS-07 commercial admission and provider ambiguity", () => {
  it("derives the same exact identity for reordered JSON and a different identity for another revision", () => {
    const first = gatewayRequestIdentity(base);
    const reordered = gatewayRequestIdentity({ ...base, request: { messages: [{ content: "ping", role: "user" }], model: "amtech-primary" } });
    const changedRevision = gatewayRequestIdentity({ ...base, revision_id: "request-revision-2" });
    expect(reordered).toEqual(first);
    expect(changedRevision.request_key).not.toBe(first.request_key);
    expect(first.provider_idempotency_key).toMatch(/^amtech-/);
  });

  it("atomically admits concurrent copies once and replays one accepted effect", async () => {
    const store = new MemoryStore<Record<string, unknown>>({ rateLimit: 10, budgetMinor: 100 });
    let providerCalls = 0;
    const execute = () => executeCommercialProviderRequest(store, {
      ...base,
      provider: async () => {
        providerCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { response: { id: "provider-result" }, provider_receipt_id: "provider-receipt", effect_receipt_id: "erec-1", accounting_receipt_id: "usage-1", amount_minor: 7 };
      },
    });
    const results = await Promise.all([execute(), execute()]);
    expect(providerCalls).toBe(1);
    expect(results.every((result) => result.state === "accepted")).toBe(true);
    expect(results.filter((result) => result.replayed)).toHaveLength(1);
    expect(assertCommercialConservation(results[0].record)).toEqual({ conserved: true, delta_minor: 0 });
  });

  it("uses one shared rate and budget authority across independent callers", async () => {
    const store = new MemoryStore<Record<string, unknown>>({ rateLimit: 1, budgetMinor: 15 });
    let providerCalls = 0;
    const first = await executeCommercialProviderRequest(store, {
      ...base,
      provider: async () => {
        providerCalls += 1;
        return { response: { ok: true }, provider_receipt_id: "provider-1", effect_receipt_id: "erec-1", accounting_receipt_id: "usage-1", amount_minor: 10 };
      },
    });
    const second = await executeCommercialProviderRequest(store, {
      ...base,
      revision_id: "request-revision-2",
      provider: async () => {
        providerCalls += 1;
        return { response: { ok: true }, provider_receipt_id: "provider-2", effect_receipt_id: "erec-2", accounting_receipt_id: "usage-2", amount_minor: 10 };
      },
    });
    expect(first.state).toBe("accepted");
    expect(second).toMatchObject({ state: "denied", error_code: "rate_limit_exceeded" });
    expect(providerCalls).toBe(1);
  });

  it("persists accepted-possible response loss as ambiguous and never blindly redispatches", async () => {
    const store = new MemoryStore<Record<string, unknown>>();
    let providerCalls = 0;
    const run = () => executeCommercialProviderRequest(store, {
      ...base,
      provider: async () => {
        providerCalls += 1;
        throw new ProviderOutcomeAmbiguousError("provider_response_lost_after_dispatch", { upstream_request_id: "unknown" });
      },
    });
    const first = await run();
    const replay = await run();
    expect(first).toMatchObject({ state: "ambiguous", ambiguity_code: "provider_response_lost_after_dispatch" });
    expect(replay).toMatchObject({ state: "ambiguous", replayed: true });
    expect(providerCalls).toBe(1);
  });
});
