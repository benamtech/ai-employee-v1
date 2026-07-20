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

describe("AMTECH Standard v0.2 ratification", () => {
  it("is effective, preserves hard production gates, and records the database TDD boundary", async () => {
    const standard = await readFile("STANDARD.md", "utf8");

    expect(standard).toContain("# AMTECH Standard v0.2 — Ratified Production Standard");
    expect(standard).toContain("Status: **ratified and effective**");
    expect(standard).toContain("No feature expansion occurs while a prerequisite P0 blocker is unresolved.");
    expect(standard).toContain("A live Supabase project is not required for every schema or query edit.");
    expect(standard).toContain("The proof is a release/staging gate, not the inner development loop.");
    expect(standard).toContain("MCP Apps");
    expect(standard).toContain("AG-UI shared state is a synchronized projection, not the source of durable authority.");
    expect(standard).toContain("Every AMTECH-supported native connector MUST be described by a declarative setup manifest");
    expect(standard).toContain("Current implementation remains source-wired and exact-head CI-accepted through migration `0072`");
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

  it("routes all current planning through one canonical production program", async () => {
    const planIndex = await readFile("second-half-plan/README.md", "utf8");
    const activePlan = await readFile(
      "second-half-plan/2026-07-19-ratified-standard-production-program/README.md",
      "utf8",
    );

    expect(planIndex).toContain("2026-07-19-ratified-standard-production-program/README.md");
    expect(planIndex).toContain("single active production program");
    expect(activePlan).toContain("Status: **active and canonical**");
    expect(activePlan).toContain("Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.");
  });
});
