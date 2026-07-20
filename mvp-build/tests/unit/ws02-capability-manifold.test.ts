import { describe, expect, it } from "vitest";
import {
  generateCapabilityManifold,
  verifyCapabilityManifold,
} from "../../scripts/generate-ws02-capability-manifold.mjs";

describe("WS-02 capability manifold", () => {
  it("enumerates every pair and every dependency-connected or hazard-bearing triple", () => {
    const manifold = generateCapabilityManifold();
    expect(verifyCapabilityManifold(manifold)).toEqual({
      pairwise: 105,
      triple_wise: 357,
      total: 462,
    });
  });

  it("keeps every candidate independently actionable and authority-risk mapped", () => {
    const manifold = generateCapabilityManifold();
    for (const candidate of [...manifold.pairs, ...manifold.triples]) {
      expect(candidate.hypothesis.length).toBeGreaterThan(40);
      expect(candidate.trajectory.inspect.length).toBeGreaterThan(0);
      expect(candidate.trajectory.reproduce).toContain("Exercise");
      expect(candidate.trajectory.red_test).toContain("Assert");
      expect(candidate.trajectory.patch).toContain("Manager-owned");
      expect(candidate.trajectory.run_tests).toEqual(expect.arrayContaining([
        "focused WS-02 contract",
        "broad unit aggregate",
        "production build",
      ]));
      expect(candidate.blockers.length).toBeGreaterThan(0);
      expect(candidate.business_value).toBeGreaterThanOrEqual(1);
      expect(candidate.business_value).toBeLessThanOrEqual(5);
      expect(candidate.risk).toBeGreaterThanOrEqual(1);
      expect(candidate.risk).toBeLessThanOrEqual(5);
      expect(Number.isFinite(candidate.utility.score)).toBe(true);
      expect(["[VERIFIED]", "[UNVERIFIED]"]).toContain(candidate.verification);
      expect(JSON.stringify(candidate).toLowerCase()).not.toContain("out of scope");
    }
  });

  it("provides an impossibility proof for every pair with no legitimate direct edge", () => {
    const manifold = generateCapabilityManifold();
    const impossible = manifold.pairs.filter((candidate) => candidate.impossibility_proof);
    expect(impossible.length).toBeGreaterThan(0);
    for (const candidate of impossible) {
      expect(candidate.impossibility_proof).toContain("unauthorized hidden edge");
      expect(candidate.hypothesis).toBe(candidate.impossibility_proof);
    }
  });
});
