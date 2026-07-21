import { describe, expect, it } from "vitest";
import {
  ProofProjectionPendingError,
  executeCommercialProviderRequest,
  gatewayRequestIdentity,
  type GatewayCommercialAdmission,
  type GatewayCommercialRecord,
  type GatewayCommercialStore,
  type GatewaySettlementInput,
} from "../../apps/manager/src/lib/model-gateway-commercial.js";

class ProjectionStore<T> implements GatewayCommercialStore<T> {
  row: GatewayCommercialRecord<T> | null = null;
  async admit(input: GatewayCommercialAdmission) {
    if (this.row) return { kind: "replay" as const, record: this.row };
    this.row = {
      request_key: input.request_key,
      assignment_id: input.assignment_id,
      revision_id: input.revision_id,
      request_hash: input.request_hash,
      provider_idempotency_key: input.provider_idempotency_key,
      rate_window_key: input.rate_window_key,
      state: "admitted",
      reserved_amount_minor: input.reserve_amount_minor,
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
    return { kind: "admitted" as const, record: this.row };
  }
  async markDispatched() {
    this.row!.state = "dispatched";
    return this.row!;
  }
  async settle(input: GatewaySettlementInput<T>) {
    this.row!.state = input.state;
    this.row!.provider_receipt_id = input.provider_receipt_id ?? null;
    this.row!.effect_receipt_id = input.effect_receipt_id ?? null;
    this.row!.accounting_receipt_id = input.accounting_receipt_id ?? null;
    this.row!.response = input.response ?? null;
    this.row!.error_code = input.error_code ?? null;
    this.row!.ambiguity_code = input.ambiguity_code ?? null;
    if (input.state === "accepted") this.row!.committed_amount_minor = input.amount_minor;
    if (input.state === "failed") this.row!.released_amount_minor = this.row!.reserved_amount_minor;
    return this.row!;
  }
  async markProofProjected(_requestKey: string, proofRef: string) {
    this.row!.proof_state = "projected";
    this.row!.proof_ref = proofRef;
    return this.row!;
  }
}

const input = {
  assignment_id: "asn_golden",
  credential_id: "artifact-publisher",
  revision_id: "arv_exact_2",
  route_key: "amtech_sandbox:artifact.publish",
  request: { artifact_id: "art_golden", approval_id: "appr_exact" },
  reserve_amount_minor: 0,
  rate_window_key: "artifact-publisher:2026-07-20T23:59",
};

describe("WS-06 completion and WS-08 crash repair", () => {
  it("requires exact revision identity and rejects stale revision replay", () => {
    const exact = gatewayRequestIdentity(input);
    const stale = gatewayRequestIdentity({ ...input, revision_id: "arv_stale_1" });
    expect(stale.request_key).not.toBe(exact.request_key);
    expect(stale.effect_key).not.toBe(exact.effect_key);
  });

  it("repairs crash after receipt before proof projection without repeating the effect", async () => {
    const store = new ProjectionStore<{ publication_ref: string; revision_id: string }>();
    let providerCalls = 0;
    let projectionCalls = 0;
    const run = () => executeCommercialProviderRequest(store, {
      ...input,
      provider: async () => {
        providerCalls += 1;
        return {
          response: { publication_ref: "sandbox://artifacts/art_golden/revisions/arv_exact_2", revision_id: "arv_exact_2" },
          provider_receipt_id: "sandbox-publication-ref",
          effect_receipt_id: "erec_artifact",
          accounting_receipt_id: "usage_artifact",
          amount_minor: 0,
        };
      },
      projectProof: async (accepted) => {
        projectionCalls += 1;
        expect(accepted.revision_id).toBe("arv_exact_2");
        expect(accepted.effect_receipt_id).toBe("erec_artifact");
        if (projectionCalls === 1) throw new Error("injected_crash_after_receipt_before_projection");
        return "proof://art_golden/arv_exact_2/erec_artifact";
      },
    });

    await expect(run()).rejects.toBeInstanceOf(ProofProjectionPendingError);
    expect(store.row).toMatchObject({ state: "accepted", proof_state: "pending", effect_receipt_id: "erec_artifact" });

    const repaired = await run();
    expect(repaired).toMatchObject({ state: "accepted", replayed: true, proof_state: "projected" });
    expect(repaired.record.proof_ref).toBe("proof://art_golden/arv_exact_2/erec_artifact");
    expect(providerCalls).toBe(1);
    expect(projectionCalls).toBe(2);
  });

  it("converges a partial multi-step retry with no duplicate effect, leaked reservation, false failure, or lost proof", async () => {
    const store = new ProjectionStore<{ publication_ref: string; revision_id: string }>();
    let providerCalls = 0;
    let projectionCalls = 0;
    const execute = () => executeCommercialProviderRequest(store, {
      ...input,
      reserve_amount_minor: 12,
      provider: async () => {
        providerCalls += 1;
        return {
          response: { publication_ref: "sandbox://exact", revision_id: "arv_exact_2" },
          provider_receipt_id: "provider-exact",
          effect_receipt_id: "erec-exact",
          accounting_receipt_id: "usage-exact",
          amount_minor: 9,
        };
      },
      projectProof: async () => {
        projectionCalls += 1;
        if (projectionCalls === 1) throw new Error("injected_projection_crash");
        return "proof://exact";
      },
    });

    await expect(execute()).rejects.toBeInstanceOf(ProofProjectionPendingError);
    const resumed = await execute();
    expect(resumed.record).toMatchObject({
      state: "accepted",
      reserved_amount_minor: 12,
      committed_amount_minor: 9,
      released_amount_minor: 3,
      refunded_amount_minor: 0,
      proof_state: "projected",
      proof_ref: "proof://exact",
    });
    expect(providerCalls).toBe(1);
  });
});
