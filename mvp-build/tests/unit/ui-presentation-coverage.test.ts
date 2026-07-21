import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Trace009 constrained presentation coverage", () => {
  it("covers every declared pair and surface-browser-network triple with no hidden remainder", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-ui-coverage-"));
    const output = join(directory, "coverage.json");
    try {
      execFileSync(process.execPath, ["scripts/generate-ui-coverage.mjs", output], { encoding: "utf8" });
      const report = JSON.parse(readFileSync(output, "utf8"));
      expect(report.valid_combination_count).toBe(648);
      expect(report.generated_case_count).toBeGreaterThan(0);
      expect(report.generated_case_count).toBeLessThan(report.valid_combination_count);
      expect(report.uncovered_combinations).toEqual([]);
      expect(report.coverage.three_way).toEqual(["surface", "browser", "network"]);
      expect(report.coverage.consequential_authority_states).toContain("exhaustively");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps the committed coverage artifact reproducible", () => {
    const committed = JSON.parse(readFileSync(resolve("validation/ui-presentation-coverage.json"), "utf8"));
    expect(committed.uncovered_combinations).toEqual([]);
    expect(committed.nonclaims).toContain("UI Lab cases remain fixture demonstrations.");
  });
});
