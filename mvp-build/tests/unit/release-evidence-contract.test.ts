import { describe, expect, it } from "vitest";
import {
  REQUIRED_RELEASE_GATES,
  buildSourceCiReleaseEvidenceManifest,
  validateReleaseEvidenceManifest,
} from "../../packages/shared/src/release-evidence.js";

const sha = "a".repeat(40);

function manifest() {
  return buildSourceCiReleaseEvidenceManifest({
    repository: "benamtech/ai-employee-v1",
    branch: "employee-production-tuesday",
    commitSha: sha,
    generatedAt: "2026-07-18T12:00:00.000Z",
    generator: "test",
    runId: "29640000000",
  });
}

describe("Lane 10 release evidence contract", () => {
  it("builds a complete source-and-CI-only manifest without upgrading live acceptance", () => {
    const built = manifest();
    const result = validateReleaseEvidenceManifest(built, sha);

    expect(result.ok, result.problems.join("\n")).toBe(true);
    expect(result.missingGates).toEqual([]);
    expect(result.staleGates).toEqual([]);
    expect(built.publicClaimState).toBe("source_and_ci_only");
    expect(built.gates.map((gate) => gate.gate).sort()).toEqual([...REQUIRED_RELEASE_GATES].sort());
    expect(built.gates.find((gate) => gate.gate === "connector_custody_enforcement")?.status).toBe("ci_accepted");
    expect(built.gates.find((gate) => gate.gate === "commercial_attribution_enforcement")?.status).toBe("ci_accepted");
    expect(built.gates.find((gate) => gate.gate === "real_supabase_matrix")?.status).toBe("pending");
    expect(built.gates.find((gate) => gate.gate === "commercial_reconciliation")?.status).toBe("pending");
  });

  it("rejects stale cross-SHA evidence", () => {
    const built = manifest();
    const stale = {
      ...built,
      gates: built.gates.map((gate) =>
        gate.gate === "command_effect_matrix"
          ? { ...gate, sha: "b".repeat(40) }
          : gate,
      ),
    };

    const result = validateReleaseEvidenceManifest(stale, sha);
    expect(result.ok).toBe(false);
    expect(result.staleGates).toContain("command_effect_matrix");
  });

  it("rejects production-ready claims without accepted hard gates", () => {
    const built = { ...manifest(), publicClaimState: "production_ready" as const };
    const result = validateReleaseEvidenceManifest(built, sha);

    expect(result.ok).toBe(false);
    expect(result.problems.join("\n")).toContain("production_ready claim without accepted gate: real_supabase_matrix");
    expect(result.problems.join("\n")).toContain("production_ready claim without accepted gate: provider_packet");
  });

  it("rejects missing required gate entries", () => {
    const built = manifest();
    const incomplete = {
      ...built,
      gates: built.gates.filter((gate) => gate.gate !== "proof_digest_claim_consistency"),
    };

    const result = validateReleaseEvidenceManifest(incomplete, sha);
    expect(result.ok).toBe(false);
    expect(result.missingGates).toEqual(["proof_digest_claim_consistency"]);
  });
});
