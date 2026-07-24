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

  it("routes UI Lab through live workbench and explicit fixture preview", () => {
    const page = read("apps/web/app/ui-lab/page.tsx");
    const employeeLayout = read("apps/web/app/ui-lab/employee/[employeeId]/layout.tsx");
    const legacy = read("apps/web/app/ui-lab/[scenario]/page.tsx");
    const fixtures = read("apps/web/app/ui-lab/fixtures/page.tsx");
    const workbench = read("apps/web/app/ui-lab/[scenario]/UiLabWorkbenchClient.tsx");
    const previewPage = read("apps/web/app/ui-lab/preview/[scenario]/page.tsx");
    const preview = read("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx");
    expect(page).toContain("MANAGER_API.ownerDashboard");
    expect(employeeLayout).toContain("LiveEmployeeProvider");
    expect(legacy).toContain("redirect(`/ui-lab/fixtures");
    expect(fixtures).toContain("Explicit fixture evidence");
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

  it("keeps the generated experience runtime on one admission, projection, and intent policy", () => {
    const output = execFileSync(process.execPath, ["scripts/verify-ui-architecture.mjs"], { encoding: "utf8" });
    expect(output).toContain("PASS one_variant_admission_policy");
    expect(output).toContain("PASS one_variant_model_projection");
    expect(output).toContain("PASS one_variant_intent_resolver");
    expect(output).toContain("PASS generated_runtime_host_refuses_unadmitted_variant");
    expect(output).toContain("PASS no_surface_local_intent_policy");
    const runtime = read("packages/shared/src/ui-variant-runtime.ts");
    expect(runtime).toContain("experiment_denied_on_live");
    expect(runtime).toContain("lab_only_denied_on_live");
    expect(runtime).toContain("candidate_requires_operator_acknowledgement");
    expect(runtime).toContain("variant_policy_unrecognized");
  });

  it("keeps variant folders free of ambient browser capability and product route access", () => {
    const validator = read("scripts/ui-variant.mjs");
    expect(validator).toContain("raw_markup_injection_forbidden");
    expect(validator).toContain("dynamic_code_evaluation_forbidden");
    expect(validator).toContain("ambient_credential_access_forbidden");
    expect(validator).toContain("environment_access_forbidden");
    expect(validator).toContain("product_route_reference_forbidden_use_host_intents");
    const doctor = execFileSync(process.execPath, ["scripts/ui-variant.mjs", "doctor"], { encoding: "utf8" });
    expect(doctor).toContain("UI variant doctor PASS");
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
