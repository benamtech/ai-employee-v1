import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFile(join(process.cwd(), path), "utf8");

describe("web operating snapshot contract", () => {
  it("does not allow a production Manager response without operating_state to become a plausible local fallback", async () => {
    const route = await source("apps/web/app/api/employee/[employeeId]/resources/route.ts");
    const surface = await source("apps/web/app/agent/[employeeId]/AgentSurface.tsx");
    const compiler = await source("packages/shared/src/operating-projection.ts");

    expect(route).toContain("if (!json.operating_state)");
    expect(route).toContain('operating_state_unavailable');
    expect(route).toContain("status: 503");
    expect(surface).toContain("fixturePayload ?? fixtureResourcePayload(employeeId)");
    expect(surface).toContain("compileOperatingProjection");
    expect(compiler).toContain('policy.evidence_class === "production"');
    expect(compiler).toContain('throw new Error("operating_projection_authoritative_state_required")');
    expect(compiler).toContain('throw new Error("operating_projection_scope_mismatch")');
  });
});
