import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  requireSnapshotRead,
  strictSnapshotClient,
} from "../../apps/manager/src/lib/employee-stream-strict.js";

function queryResult(result: { data: unknown; error: unknown }) {
  const builder = {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    limit() { return this; },
    maybeSingle() { return this; },
    then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
      try {
        return Promise.resolve(resolve(result));
      } catch (error) {
        return reject ? Promise.resolve(reject(error)) : Promise.reject(error);
      }
    },
  };
  return builder;
}

describe("employee snapshot strict reads", () => {
  it("returns successful read results unchanged", () => {
    const result = { data: [{ id: "art_1" }], error: null };
    expect(requireSnapshotRead(result, "artifacts")).toBe(result);
  });

  it("throws a bounded labeled error instead of converting a database fault to empty state", () => {
    expect(() => requireSnapshotRead({
      data: null,
      error: { code: "42501", message: "provider detail must not be copied into the public error" },
    }, "artifacts")).toThrow("employee_snapshot_read_failed:artifacts:42501");
  });

  it("preserves the fluent Supabase shape while rejecting failed awaited reads", async () => {
    const db = {
      from: () => queryResult({ data: null, error: { code: "XX001", message: "database read failed" } }),
    };
    const strict = strictSnapshotClient(db as never);
    await expect(strict.from("approvals").select("id").eq("id", "apr_1").maybeSingle())
      .rejects.toThrow("employee_snapshot_read_failed:approvals:XX001");
  });

  it("routes every production owner and employee context entry point through strict reads", async () => {
    const server = await readFile(join(process.cwd(), "apps/manager/src/server.ts"), "utf8");
    const operatingRoutes = await readFile(join(process.cwd(), "apps/manager/src/lib/onboarding-identity-routes.ts"), "utf8");
    const previews = await readFile(join(process.cwd(), "apps/manager/src/lib/preview-render.ts"), "utf8");
    const mcp = await readFile(join(process.cwd(), "apps/manager/src/lib/mcp-server.ts"), "utf8");
    const brain = await readFile(join(process.cwd(), "apps/manager/src/lib/business-brain.ts"), "utf8");

    expect(server).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
    expect(server).toContain("fetchWorkEventsSinceStrict as fetchWorkEventsSince");
    expect(server).toContain("buildEmployeeSnapshot(db, employeeId, accountId, assignmentId)");
    expect(server).toContain("fetchWorkEventsSince(db, employeeId, accountId, cursor, assignmentId)");
    expect(operatingRoutes).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
    expect(operatingRoutes).toContain("buildToolCapabilityCatalog(strictSnapshotClient(db), snapshot)");
    expect(operatingRoutes).toContain("buildOperatingSurfaceState(strictSnapshotClient(db), enriched)");
    expect(previews).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
    expect(mcp).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
    expect(brain).toContain('"business_brain.employee"');
    expect(brain).toContain('"business_brain.manifest"');
    expect(brain).toContain('"business_brain.profile_build"');
    expect(brain).toContain('"business_brain.facts"');
    expect(brain).toContain("if (result.error) throw result.error");
  });
});
