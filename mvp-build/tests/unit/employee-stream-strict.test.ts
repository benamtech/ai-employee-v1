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

  it("routes every production owner snapshot entry point through the strict adapter", async () => {
    const generator = await readFile(join(process.cwd(), "apps/manager/scripts/generate-production-server.mjs"), "utf8");
    const operatingRoutes = await readFile(join(process.cwd(), "apps/manager/src/lib/onboarding-identity-routes.ts"), "utf8");
    const previews = await readFile(join(process.cwd(), "apps/manager/src/lib/preview-render.ts"), "utf8");

    expect(generator).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
    expect(generator).toContain("fetchWorkEventsSinceStrict as fetchWorkEventsSince");
    expect(operatingRoutes).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
    expect(previews).toContain("buildEmployeeSnapshotStrict as buildEmployeeSnapshot");
  });
});
