import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Trace009 and Trace012 executable UI architecture fitness", () => {
  it("passes the singleton projection architecture verifier", () => {
    const output = execFileSync(process.execPath, ["scripts/verify-ui-architecture.mjs"], { encoding: "utf8" });
    expect(output).toContain('"status": "ok"');
  });

  it("routes UI Lab through a workbench and isolated production preview", () => {
    const page = read("apps/web/app/ui-lab/[scenario]/page.tsx");
    const workbench = read("apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx");
    const previewPage = read("apps/web/app/ui-lab/preview/[scenario]/page.tsx");
    const preview = read("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx");
    expect(page).toContain("UiLabWorkbenchClient");
    expect(workbench).toContain("<iframe");
    expect(workbench).toContain("Saved version");
    expect(workbench).toContain("Brand tokens");
    expect(workbench).toContain("Save next draft version");
    expect(previewPage).toContain("ProductionFixtureLabClient");
    expect(preview).toContain("<LiveEmployeeOperatingShell");
    expect(preview).toContain("<AgentSurface");
    expect(preview).toContain("fixturePayload={payload}");
    expect(preview).toContain("<EmployeeUiPortHost");
    expect(preview).toContain("amtech.ui-lab.command");
  });

  it("keeps adapter selection distinct from presentation strategies and preset assignments", () => {
    const port = read("apps/web/app/_components/employee-ui/EmployeeUiPort.tsx");
    const assignment = read("packages/shared/src/ui-lab-assignment-resolution.ts");
    const ownerPage = read("apps/web/app/agent/[employeeId]/page.tsx");
    const estimatorPage = read("apps/web/app/free-estimator/page.tsx");
    expect(port).toContain("owner_web");
    expect(port).toContain("public_form");
    expect(port).toContain("boundless_website");
    expect(port).toContain("data-ui-theme");
    expect(port).toContain("data-ui-layout");
    expect(port).toContain("data-ui-components");
    expect(port).toContain("data-ui-preset");
    expect(port).toContain("resolveApprovedUiPreset");
    expect(assignment).toContain("APPROVED_UI_PRESET_ASSIGNMENTS");
    expect(ownerPage).toContain('adapterKey="owner_web"');
    expect(estimatorPage).toContain('adapterKey="public_form"');
  });

  it("keeps generated embedded views on the one compiler and validating host boundary", () => {
    const compiler = read("apps/manager/src/lib/ui-resources.ts");
    const host = read("apps/web/app/agent/[employeeId]/components/McpUiResource.tsx");
    const workRenderer = read("apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx");
    expect((compiler.match(/export function compileDeliverableUiResource\(/g) ?? []).length).toBe(1);
    expect(host).toContain("actualHash !== metadata.resource_hash");
    expect(host).toContain("returned.assignment_id !== metadata.authority.assignment_id");
    expect(host).toContain("metadata.authority.allowed_actions.includes(projectedAction(intent))");
    expect(workRenderer).toContain("resource.actions.some");
  });
});
