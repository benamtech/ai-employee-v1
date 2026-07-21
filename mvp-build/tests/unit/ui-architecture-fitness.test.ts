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

  it("routes UI Lab to the production projection and isolates the legacy fixture client", () => {
    const page = read("apps/web/app/ui-lab/[scenario]/page.tsx");
    const shell = read("apps/web/app/ui-lab/[scenario]/ProductionFixtureLabClient.tsx");
    expect(page).toContain("ProductionFixtureLabClient");
    expect(page).not.toContain('from "./FixtureLabClient"');
    expect(shell).toContain("<AgentSurface");
    expect(shell).toContain("fixturePayload={payload}");
    expect(shell).toContain("Fixture truth");
  });

  it("keeps generated embedded views on the one compiler and validating host boundary", () => {
    const compiler = read("apps/manager/src/lib/ui-resources.ts");
    const host = read("apps/web/app/agent/[employeeId]/components/McpUiResource.tsx");
    expect((compiler.match(/export function compileDeliverableUiResource\(/g) ?? []).length).toBe(1);
    expect(host).toContain("expectedAuthority");
    expect(host).toContain("resource.actions.some");
    expect(host).toContain("ui_resource_hash_mismatch");
  });
});
