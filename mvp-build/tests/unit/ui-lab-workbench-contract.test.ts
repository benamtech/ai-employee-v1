import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("UI Lab Phase 1 live workbench contracts", () => {
  it("loads authorized employees through the existing owner dashboard session", () => {
    const page = read("apps/web/app/ui-lab/page.tsx");
    expect(page).toContain("amtech_owner_session");
    expect(page).toContain("MANAGER_API.ownerDashboard");
    expect(page).toContain("redirect(`/login?next=");
    expect(page).toContain("rememberedAuthorized");
    expect(page).toContain("Remembered and authorized");
    expect(page).not.toContain("fixtureResourcePayload");
  });

  it("fails explicit employee routes closed unless dashboard authorization includes the employee", () => {
    const layout = read("apps/web/app/ui-lab/employee/[employeeId]/layout.tsx");
    expect(layout).toContain("amtech_owner_session");
    expect(layout).toContain("MANAGER_API.ownerDashboard");
    expect(layout).toContain(".find((item) => item.id === employeeId)");
    expect(layout).toContain('redirect("/ui-lab")');
  });

  it("uses one UI Lab provider-owned live projection controller", () => {
    const provider = read("apps/web/app/_components/live-employee/LiveEmployeeProvider.tsx");
    const layout = read("apps/web/app/ui-lab/employee/[employeeId]/layout.tsx");
    const shell = read("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx");
    const surface = read("apps/web/app/agent/[employeeId]/AgentSurface.tsx");
    expect(layout).toContain("<LiveEmployeeProvider");
    expect(provider).toContain("openOwnerProjectionController");
    expect(provider.match(/openOwnerProjectionController/g)?.length).toBe(2);
    expect(shell).toContain("liveProjection");
    expect(shell).toContain("if (controlledLive) return");
    expect(surface).toContain("liveProjection");
    expect(surface).toContain("if (controlledLive) return");
  });

  it("tears down and fails closed on employee or scope changes without replaying owner intent", () => {
    const provider = read("apps/web/app/_components/live-employee/LiveEmployeeProvider.tsx");
    expect(provider).toContain("return () =>");
    expect(provider).toContain("scopeRef.current = null");
    expect(provider).toContain("installResources({ ...EMPTY, employee_id: employeeId })");
    expect(provider).toContain("scope did not match");
    expect(provider).toContain("No fixture data was installed and no owner intent was replayed");
  });

  it("bridges only safe Phase 1 actions and rejects unsupported live intents", () => {
    const provider = read("apps/web/app/_components/live-employee/LiveEmployeeProvider.tsx");
    expect(provider).toContain("/api/employee/${employeeId}/message");
    expect(provider).toContain("/api/employee/${employeeId}/approval/resolve");
    expect(provider).toContain("safeModelHref");
    expect(provider).toContain("live_intent_unavailable");
    expect(provider).toContain("open_resource_unavailable");
  });

  it("builds live variant evidence from ResourcePayload without fixture fallback", () => {
    const panels = read("apps/web/app/_components/live-employee/UiLabShell.tsx");
    const builder = read("apps/web/app/_components/ui-variant/buildEmployeeExperienceModel.ts");
    expect(panels).toContain("buildEmployeeExperienceModel");
    expect(panels).toContain('evidenceLevel: "live"');
    expect(panels).toContain("data-evidence-level={model.metadata.evidence_level}");
    expect(builder).toContain('kind: "open_resource"');
    expect(builder).toContain('input.evidenceLevel ??');
  });

  it("keeps fixtures explicit and redirects legacy fixture front doors", () => {
    const fixtures = read("apps/web/app/ui-lab/fixtures/page.tsx");
    const legacy = read("apps/web/app/ui-lab/[scenario]/page.tsx");
    expect(fixtures).toContain("Explicit fixture evidence");
    expect(fixtures).toContain("Live UI Lab routes never fall back");
    expect(legacy).toContain("redirect(`/ui-lab/fixtures");
  });

  it("does not expose Hermes custody to browser-side live workbench code", () => {
    const browserCode = [
      read("apps/web/app/_components/live-employee/LiveEmployeeProvider.tsx"),
      read("apps/web/app/_components/live-employee/UiLabShell.tsx"),
      read("apps/web/app/ui-lab/page.tsx"),
      read("apps/web/app/ui-lab/employee/[employeeId]/layout.tsx"),
    ].join("\n");
    expect(browserCode).not.toMatch(/HERMES|hermes|MANAGER_INTERNAL_TOKEN|MANAGER_API_ORIGIN/);
  });

  it("preserves fixture preview tooling behind explicit local development guards", () => {
    const route = read("apps/web/app/api/ui-lab/presets/route.ts");
    const registry = read("apps/web/app/_lib/ui-lab-registry.server.ts");
    expect(route).toContain('process.env.NODE_ENV !== "development"');
    expect(route).toContain('process.env.AMTECH_UI_LAB_WRITE !== "1"');
    expect(route).toContain("isLoopback");
    expect(registry).toContain('open(path, "wx")');
  });
});
