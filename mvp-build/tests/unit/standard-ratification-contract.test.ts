import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

interface EvolutionVector {
  standard_id: string;
  direction_basis: string[];
  summary: {
    dimensions: number;
    unapproved_destructive_modifications: number;
    production_ready: boolean;
  };
  dimensions: Array<{
    id: string;
    original_clauses: string[];
    ratified_clauses: string[];
    implementation_refs: string[];
    supersession_refs: string[];
    direction: Record<string, number>;
    velocity: number;
  }>;
}

interface DecisionProtocol {
  protocol_revision: number;
  candidate_dimensions: string[];
  dimension_semantics: Record<string, { meaning: string; orientation: "maximize" | "minimize" }>;
  baseline_contracts: Record<
    string,
    {
      roles: {
        positive_required: string[];
        positive_optional: string[];
        penalty_required: string[];
        penalty_optional: string[];
        excluded: string[];
      };
    }
  >;
}

describe("AMTECH Standard v0.2 ratification", () => {
  it("is effective, preserves hard production gates, and ratifies explicit decision semantics", async () => {
    const [standard, amendment, protocolText] = await Promise.all([
      readFile("STANDARD.md", "utf8"),
      readFile("STANDARD-V0.2-AMENDMENT-001.md", "utf8"),
      readFile("decision/protocol-v1.json", "utf8"),
    ]);
    const protocol = JSON.parse(protocolText) as DecisionProtocol;

    expect(standard).toContain("# AMTECH Standard v0.2 — Ratified Production Standard");
    expect(standard).toContain("Status: **ratified and effective**");
    expect(standard).toContain("No feature expansion occurs while a prerequisite P0 blocker is unresolved.");
    expect(standard).toContain("A live Supabase project is not required for every schema or query edit.");
    expect(standard).toContain("The proof is a release/staging gate, not the inner development loop.");
    expect(standard).toContain("MCP Apps");
    expect(standard).toContain("AG-UI shared state is a synchronized projection, not the source of durable authority.");
    expect(standard).toContain("Every AMTECH-supported native connector MUST be described by a declarative setup manifest");

    expect(amendment).toContain("Status: **ratified additive amendment and effective**");
    expect(amendment).toContain("## ENG-12.3D — Explicit score and baseline semantics");
    expect(amendment).toContain("## ENG-12.9A — Exact-candidate workflow evidence");
    expect(amendment).toContain("New dimensions MUST fail with `unclassified_baseline_dimensions`");
    expect(amendment).toContain("GitHub's synthetic merge ref is merge-candidate evidence, not branch-head evidence.");

    expect(protocol.protocol_revision).toBeGreaterThanOrEqual(3);
    expect(Object.keys(protocol.dimension_semantics)).toEqual(protocol.candidate_dimensions);
    expect(protocol.baseline_contracts.trace007).toBeDefined();
    const roles = protocol.baseline_contracts.trace007.roles;
    const declared = [
      ...roles.positive_required,
      ...roles.positive_optional,
      ...roles.penalty_required,
      ...roles.penalty_optional,
      ...roles.excluded,
    ];
    expect(new Set(declared).size).toBe(declared.length);
    expect(new Set(declared)).toEqual(new Set(protocol.candidate_dimensions));
  });

  it("keeps every evolution dimension grounded and prohibits unapproved destructive motion", async () => {
    const vector = JSON.parse(
      await readFile("validation/standard-v0.2-evolution-vector.json", "utf8"),
    ) as EvolutionVector;

    expect(vector.standard_id).toBe("amtech-standard-v0.2");
    expect(vector.direction_basis).toEqual([
      "expansion",
      "satisfaction",
      "narrowing",
      "destructive_modification",
      "appendix",
      "reorientation",
    ]);
    expect(vector.summary.dimensions).toBe(vector.dimensions.length);
    expect(vector.summary.dimensions).toBeGreaterThanOrEqual(12);
    expect(vector.summary.unapproved_destructive_modifications).toBe(0);
    expect(vector.summary.production_ready).toBe(false);

    for (const dimension of vector.dimensions) {
      expect(dimension.original_clauses.length).toBeGreaterThan(0);
      expect(dimension.ratified_clauses.length).toBeGreaterThan(0);
      expect(dimension.implementation_refs.length + dimension.supersession_refs.length).toBeGreaterThan(0);
      expect(dimension.velocity).toBeGreaterThanOrEqual(0);
      expect(dimension.velocity).toBeLessThanOrEqual(1);
      expect(dimension.direction.destructive_modification ?? 0).toBe(0);
      for (const basis of vector.direction_basis) {
        expect(Number.isFinite(dimension.direction[basis])).toBe(true);
      }
    }
  });

  it("routes current planning through one active program without transient status mirrors", async () => {
    const historicalIndex = await readFile("second-half-plan/README.md", "utf8");
    const activePlan = await readFile("production-readiness-program/README.md", "utf8");

    expect(historicalIndex).toContain("historical and non-canonical");
    expect(historicalIndex).toContain("production-readiness-program/README.md");
    expect(activePlan).toContain("Status: **active and canonical**");
    expect(activePlan).toContain("[`../CODEGRAPH.md`](../CODEGRAPH.md)");
    expect(activePlan).toContain("Provider and connector adapters do not create authority.");

    for (const route of [
      "04-dependency-ordered-production-plan.md",
      "08-production-issue-vector.json",
      "13-resolution-ledger.json",
      "09-workstream-execution-map.md",
      "20-ws06-ws08-commercial-effect-transaction.md",
      "10-test-suite-disposition.md",
      "07-verification-and-handoff-matrix.md",
    ]) {
      expect(activePlan).toContain(`\`${route}\``);
    }

    expect(activePlan).not.toMatch(/^Main baseline:/m);
    expect(activePlan).not.toMatch(/^Stacked base:/m);
    expect(activePlan).not.toMatch(/^Source migration head:/m);
  });
});
