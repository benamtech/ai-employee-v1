import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("UI Lab live workbench contracts", () => {
  it("uses one isolated preview route with production components", () => {
    const workbench = read("apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx");
    const preview = read("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx");
    const previewPage = read("apps/web/app/ui-lab/preview/[scenario]/page.tsx");
    expect(workbench).toContain("<iframe");
    expect(workbench).toContain("/ui-lab/preview/");
    expect(preview).toContain("<LiveEmployeeOperatingShell");
    expect(preview).toContain("<AgentSurface");
    expect(preview).toContain("<EmployeeUiPortHost");
    expect(previewPage).toContain("uiFixtureMode()");
  });

  it("exposes live controls, viewport review, preset selection, and draft saving", () => {
    const workbench = read("apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx");
    for (const token of [
      "Saved version",
      "Preview mode",
      "Adapter",
      "Theme",
      "Layout",
      "Components",
      "Density",
      "Viewport",
      "Brand tokens",
      "Save next draft version",
      "Copy review link",
      "Fixture interaction",
    ]) expect(workbench).toContain(token);
  });

  it("keeps repository writes behind explicit local development guards", () => {
    const route = read("apps/web/app/api/ui-lab/presets/route.ts");
    const registry = read("apps/web/app/_lib/ui-lab-registry.server.ts");
    expect(route).toContain('process.env.NODE_ENV !== "development"');
    expect(route).toContain('process.env.AMTECH_UI_LAB_WRITE !== "1"');
    expect(route).toContain("isLoopback");
    expect(route).toContain("new URL(origin).origin === requestUrl.origin");
    expect(registry).toContain('open(path, "wx")');
    expect(registry).toContain("UiLabPresetId.safeParse");
    expect(route).not.toContain("request.nextUrl.searchParams.get(\"path\")");
  });

  it("provides a no-full-build development loop and exact-SHA browser evidence", () => {
    const dev = read("scripts/ui-lab-dev.mjs");
    const browser = read("infra/scripts/ui/fixture-browser-v2.mjs");
    expect(dev).toContain('"--turbopack"');
    expect(dev).toContain('"--watch"');
    expect(dev).not.toContain('nextBin, "build"');
    expect(browser).toContain("amtech.ui-lab-evidence.v1");
    expect(browser).toContain("resolveGitSha");
    expect(browser).toContain("ui_lab_production_write_not_denied");
  });

  it("requires clean source, browser evidence, and human review for promotion", () => {
    const registry = read("scripts/ui-lab-registry.mjs");
    expect(registry).toContain("assertCleanGit()");
    expect(registry).toContain("promotion_evidence_required");
    expect(registry).toContain("evidence_sha_mismatch");
    expect(registry).toContain("reviewer_required");
    expect(registry).toContain('status: "approved"');
    expect(registry).toContain("generateRuntimeRegistry");
  });
});
