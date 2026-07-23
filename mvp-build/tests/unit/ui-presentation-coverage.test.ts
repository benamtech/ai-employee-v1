import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const EXPECTED_AXES = [
  "surface",
  "adapter",
  "scenario",
  "browser",
  "viewport",
  "density",
  "runtime_state",
  "preset_state",
];

describe("Trace012 constrained presentation coverage", () => {
  it("covers every declared pair and selected three-way interaction with no hidden remainder", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-ui-coverage-"));
    const output = join(directory, "coverage.json");
    try {
      execFileSync(process.execPath, ["scripts/generate-ui-coverage.mjs", output], { encoding: "utf8" });
      const report = JSON.parse(readFileSync(output, "utf8"));
      expect(report.schema).toBe("amtech.ui-presentation-coverage.v2");
      expect(report.coverage.pairwise).toEqual(EXPECTED_AXES);
      expect(report.coverage.three_way).toEqual([
        ["surface", "browser", "runtime_state"],
        ["adapter", "scenario", "preset_state"],
      ]);
      expect(report.valid_combination_count).toBeGreaterThan(0);
      expect(report.valid_combination_count).toBeLessThan(report.unconstrained_combination_count);
      expect(report.generated_case_count).toBeGreaterThan(0);
      expect(report.generated_case_count).toBeLessThan(report.valid_combination_count);
      expect(report.requirement_count).toBeGreaterThan(report.generated_case_count);
      expect(report.selected_case_digest_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(report.uncovered_combinations).toEqual([]);
      expect(report.cases).toBeUndefined();
      expect(report.coverage.consequential_authority_states).toContain("exhaustively");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("can emit the full case matrix for execution without bloating the committed manifest", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-ui-coverage-full-"));
    const output = join(directory, "coverage.json");
    try {
      execFileSync(process.execPath, ["scripts/generate-ui-coverage.mjs", output, "--include-cases"], { encoding: "utf8" });
      const report = JSON.parse(readFileSync(output, "utf8"));
      expect(report.cases).toHaveLength(report.generated_case_count);
      expect(report.cases[0]).toMatchObject({ id: "UI-001" });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps the committed compact coverage manifest reproducible", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-ui-coverage-parity-"));
    const generatedPath = join(directory, "coverage.json");
    try {
      execFileSync(process.execPath, ["scripts/generate-ui-coverage.mjs", generatedPath], { encoding: "utf8" });
      const generated = readFileSync(generatedPath, "utf8");
      const committed = readFileSync(resolve("validation/ui-presentation-coverage.json"), "utf8");
      expect(committed).toBe(generated);
      const report = JSON.parse(committed);
      expect(report.uncovered_combinations).toEqual([]);
      expect(report.nonclaims).toContain("UI Lab cases remain fixture demonstrations even when production components render them.");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
