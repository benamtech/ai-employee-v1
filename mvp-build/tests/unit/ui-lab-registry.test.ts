import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  UiLabAssignmentRegistry,
  UiLabPreset,
  UiLabSavePresetRequest,
  formatUiLabPresetRef,
  parseUiLabPresetRef,
  uiLabPresetFilename,
} from "@amtech/shared";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8"));

describe("UI Lab preset registry", () => {
  it("validates the source-controlled seed presets", () => {
    const marketing = UiLabPreset.parse(readJson("ui-lab/presets/marketing-agency/v0001.json"));
    const ecommerce = UiLabPreset.parse(readJson("ui-lab/presets/ecommerce-manager/v0001.json"));
    expect(marketing).toMatchObject({ preset_ref: "marketing-agency@v0001", status: "draft", adapter_key: "owner_web" });
    expect(ecommerce).toMatchObject({ preset_ref: "ecommerce-manager@v0001", status: "draft", scenario_id: "clothing-ops" });
    expect(marketing.source.reproducible).toBe(true);
    expect(ecommerce.targets.profile_keys).toContain("ecommerce_manager");
  });

  it("keeps assignments empty until deliberate clean promotion", () => {
    const assignments = UiLabAssignmentRegistry.parse(readJson("ui-lab/assignments.json"));
    expect(assignments.assignments).toEqual([]);
    const generated = readFileSync(resolve("packages/shared/src/ui-lab-runtime-registry.generated.ts"), "utf8");
    expect(generated).toContain("APPROVED_UI_PRESET_ASSIGNMENTS = []");
  });

  it("verifies registry and generated-runtime parity through the canonical script", () => {
    const output = execFileSync(process.execPath, ["scripts/ui-lab-registry.mjs", "validate"], { encoding: "utf8" });
    expect(JSON.parse(output)).toMatchObject({ status: "PASS", preset_count: 2, approved_count: 0, assignment_count: 0 });
  });

  it("formats and parses immutable version references", () => {
    expect(formatUiLabPresetRef("marketing-agency", 12)).toBe("marketing-agency@v0012");
    expect(parseUiLabPresetRef("marketing-agency@v0012")).toEqual({ id: "marketing-agency", version: 12 });
    expect(uiLabPresetFilename(12)).toBe("v0012.json");
  });

  it("rejects arbitrary ids, paths, and incomplete save payloads", () => {
    expect(UiLabSavePresetRequest.safeParse({ id: "../../escape" }).success).toBe(false);
    expect(UiLabSavePresetRequest.safeParse({
      id: "valid-id",
      display_name: "Valid",
      description: "Valid preset",
      scenario_id: "office",
      adapter_key: "owner_web",
      presentation: {
        theme_key: "studio",
        layout_key: "canvas",
        component_set_key: "editorial",
        density: "balanced",
      },
    }).success).toBe(true);
  });

  it("requires approved presets to carry human review and reproducible source when assigned", () => {
    const invalidApproved = UiLabPreset.safeParse({
      ...readJson("ui-lab/presets/marketing-agency/v0001.json"),
      status: "approved",
      source: { ...readJson("ui-lab/presets/marketing-agency/v0001.json").source, dirty: true, reproducible: false },
    });
    expect(invalidApproved.success).toBe(true);
    expect(invalidApproved.success && invalidApproved.data.source.reproducible).toBe(false);
  });
});
