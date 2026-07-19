import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFile(join(process.cwd(), path), "utf8");

describe("web operating snapshot contract", () => {
  it("does not allow a production Manager response without operating_state to become a plausible local fallback", async () => {
    const route = await source("apps/web/app/api/employee/[employeeId]/resources/route.ts");
    const surface = await source("apps/web/app/agent/[employeeId]/AgentSurface.tsx");

    expect(route).toContain("if (!json.operating_state)");
    expect(route).toContain('operating_state_unavailable');
    expect(route).toContain("status: 503");
    expect(surface).toContain("fixtureMode ? fixtureResourcePayload(employeeId) : EMPTY");
    expect(surface).toContain("res.operating_state ?? fallbackOperatingState");
  });
});
