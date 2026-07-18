import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Severity = "P0" | "P1" | "P2" | "P3" | "P4";

type Contract = {
  id: string;
  owner_lane: number;
  review_lanes?: number[];
  consumer_lanes?: number[];
  implementation_lane?: number;
  pass: string;
  fail: string;
};

type Lane = {
  id: number;
  contracts: string[];
  dependencies: number[];
};

type Finding = {
  id: string;
  severity: Severity;
  primary_lane: number;
  supporting_lanes?: number[];
  dependencies: string[];
  validation: string;
  metric: string;
  threshold: string;
  fail: string;
};

type Registry = {
  schema_version: string;
  finding_counts: Record<Severity | "total", number>;
  hard_gates: Record<string, number>;
  contracts: Contract[];
  lanes: Lane[];
  findings: Finding[];
  plan_pass: string;
  plan_fail: string;
};

const root = process.cwd();
const registryPath = join(root, "validation/phase-2-remediation-vectors.json");

async function loadRegistry(): Promise<Registry> {
  return JSON.parse(await readFile(registryPath, "utf8")) as Registry;
}

const expectedFindings = [
  ...Array.from({ length: 4 }, (_, index) => `GAP-P0-${String(index + 1).padStart(3, "0")}`),
  ...Array.from({ length: 13 }, (_, index) => `GAP-P1-${String(index + 5).padStart(3, "0")}`),
  ...Array.from({ length: 6 }, (_, index) => `GAP-P2-${String(index + 18).padStart(3, "0")}`),
  ...Array.from({ length: 4 }, (_, index) => `GAP-P3-${String(index + 24).padStart(3, "0")}`),
  ...Array.from({ length: 2 }, (_, index) => `GAP-P4-${String(index + 28).padStart(3, "0")}`),
];

function assertAcyclic(lanes: Lane[]): void {
  const graph = new Map(lanes.map((lane) => [lane.id, lane.dependencies]));
  const visiting = new Set<number>();
  const visited = new Set<number>();

  const visit = (id: number): void => {
    if (visiting.has(id)) throw new Error(`lane dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of graph.get(id) ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };

  for (const lane of lanes) visit(lane.id);
}

describe("Phase 2 remediation plan integrity", () => {
  it("accounts for all 29 findings exactly once as primary ownership", async () => {
    const registry = await loadRegistry();
    const ids = registry.findings.map((finding) => finding.id);

    expect(ids).toHaveLength(29);
    expect(new Set(ids).size).toBe(29);
    expect([...ids].sort()).toEqual([...expectedFindings].sort());
    expect(registry.finding_counts).toEqual({ P0: 4, P1: 13, P2: 6, P3: 4, P4: 2, total: 29 });

    const actualCounts = registry.findings.reduce<Record<Severity, number>>(
      (counts, finding) => ({ ...counts, [finding.severity]: counts[finding.severity] + 1 }),
      { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 },
    );
    expect(actualCounts).toEqual({ P0: 4, P1: 13, P2: 6, P3: 4, P4: 2 });
  });

  it("requires measurable validation and explicit failure semantics for every finding", async () => {
    const registry = await loadRegistry();

    for (const finding of registry.findings) {
      expect(finding.validation.trim().length, `${finding.id} validation`).toBeGreaterThan(10);
      expect(finding.metric.trim().length, `${finding.id} metric`).toBeGreaterThan(2);
      expect(finding.threshold.trim().length, `${finding.id} threshold`).toBeGreaterThan(0);
      expect(finding.fail.trim().length, `${finding.id} fail`).toBeGreaterThan(10);
      expect(finding.validation.toLowerCase(), `${finding.id} source-text closure`).not.toMatch(
        /source[- ]text|\.tocontain\(|string presence/,
      );
    }
  });

  it("resolves every lane, contract, and finding dependency without cycles", async () => {
    const registry = await loadRegistry();
    const laneIds = new Set(registry.lanes.map((lane) => lane.id));
    const contractIds = new Set(registry.contracts.map((contract) => contract.id));
    const findingIds = new Set(registry.findings.map((finding) => finding.id));

    expect([...laneIds].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect([...contractIds].sort()).toEqual(["C1", "C2", "C3", "C4", "C5", "C6"]);

    for (const contract of registry.contracts) {
      expect(laneIds.has(contract.owner_lane), `${contract.id} owner`).toBe(true);
      for (const lane of contract.review_lanes ?? []) expect(laneIds.has(lane)).toBe(true);
      for (const lane of contract.consumer_lanes ?? []) expect(laneIds.has(lane)).toBe(true);
      if (contract.implementation_lane !== undefined) expect(laneIds.has(contract.implementation_lane)).toBe(true);
      expect(contract.pass.trim().length).toBeGreaterThan(10);
      expect(contract.fail.trim().length).toBeGreaterThan(10);
    }

    for (const lane of registry.lanes) {
      for (const contract of lane.contracts) expect(contractIds.has(contract), `lane ${lane.id} contract ${contract}`).toBe(true);
      for (const dependency of lane.dependencies) expect(laneIds.has(dependency), `lane ${lane.id} dependency ${dependency}`).toBe(true);
      expect(lane.dependencies).not.toContain(lane.id);
    }

    for (const finding of registry.findings) {
      expect(laneIds.has(finding.primary_lane), `${finding.id} primary lane`).toBe(true);
      for (const lane of finding.supporting_lanes ?? []) expect(laneIds.has(lane), `${finding.id} supporting lane`).toBe(true);
      for (const dependency of finding.dependencies) expect(findingIds.has(dependency), `${finding.id} dependency ${dependency}`).toBe(true);
      expect(finding.dependencies).not.toContain(finding.id);
    }

    expect(() => assertAcyclic(registry.lanes)).not.toThrow();
  });

  it("keeps authority, isolation, effects, protocol, and evidence as non-waivable hard gates", async () => {
    const registry = await loadRegistry();

    expect(registry.hard_gates).toMatchObject({
      unauthorized_access_or_action_max: 0,
      successful_effect_without_durable_receipt_max: 0,
      active_work_without_assignment_or_system_context_max: 0,
      revocation_sla_seconds: 60,
      unknown_major_protocol_acceptance_max: 0,
      missing_required_proof_artifacts_max: 0,
      unsupported_public_claims_max: 0,
    });
    expect(registry.plan_pass).toContain("Every finding is present exactly once");
    expect(registry.plan_fail).toContain("hard gate");
  });

  it("assigns onboarding failures to Lane 4 and begins release engineering immediately", async () => {
    const registry = await loadRegistry();
    const onboarding = registry.findings.find((finding) => finding.id === "GAP-P1-007");
    const releaseLane = registry.lanes.find((lane) => lane.id === 10) as Lane & { starts_immediately?: boolean };

    expect(onboarding?.primary_lane).toBe(4);
    expect(onboarding?.validation).toMatch(/Auth timeout|Duplicate submit|split-brain/i);
    expect(releaseLane.starts_immediately).toBe(true);
  });
});
