import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("Trace009 executable UI architecture fitness", () => {
  it("passes the singleton projection architecture verifier", () => {
    const output = execFileSync(process.execPath, ["scripts/verify-ui-architecture.mjs"], { encoding: "utf8" });
    expect(output).toContain('"status": "ok"');
  });

  it("routes UI Lab to production components and makes it an adapter strategy matrix", () => {
    const page = read("apps/web/app/ui-lab/[scenario]/page.tsx");
    const shell = read("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx");
    expect(page).toContain("ProductionFixtureLabClient");
    expect(page).not.toContain('from "./FixtureLabClient"');
    expect(shell).toContain("<AgentSurface");
    expect(shell).toContain("fixturePayload={payload}");
    expect(shell).toContain("<EmployeeUiPortHost");
    expect(shell).toContain("Port adapter");
    expect(shell).toContain("Theme");
    expect(shell).toContain("Layout");
    expect(shell).toContain("Components");
    expect(shell).toContain("Fixture truth");
  });

  it("keeps adapter selection distinct from presentation strategies", () => {
    const port = read("apps/web/app/_components/employee-ui/EmployeeUiPort.tsx");
    const ownerPage = read("apps/web/app/agent/[employeeId]/page.tsx");
    const estimatorPage = read("apps/web/app/free-estimator/page.tsx");
    expect(port).toContain("owner_web");
    expect(port).toContain("public_form");
    expect(port).toContain("boundless_website");
    expect(port).toContain("data-ui-theme");
    expect(port).toContain("data-ui-layout");
    expect(port).toContain("data-ui-components");
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
