import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("WS-05 durable turn claim assignment scope", () => {
  it("upgrades both Postgres claim RPCs to return the accepted assignment", async () => {
    const migration = await readFile("packages/db/migrations/0073_turn_claim_assignment_scope.sql", "utf8");
    expect(migration.match(/assignment_id text/g)).toHaveLength(2);
    expect(migration.match(/v_job\.assignment_id/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration).toContain("drop function public.claim_employee_turn_job(text, integer)");
    expect(migration).toContain("drop function public.claim_employee_turn_job_for_employee(text, text, integer)");
    expect(migration).toContain("grant execute on function public.claim_employee_turn_job(text, integer) to service_role");
    expect(migration).toContain("grant execute on function public.claim_employee_turn_job_for_employee(text, text, integer) to service_role");
  });

  it("keeps a fail-closed rolling-deploy hydration path until 0073 is applied everywhere", async () => {
    const source = await readFile("apps/manager/src/lib/turn-queue.ts", "utf8");
    expect(source).toContain("hydrateClaimedTurnScope");
    expect(source).toContain('select("id,account_id,employee_id,assignment_id,kind")');
    expect(source).toContain('throw new Error("employee_turn_claim_scope_mismatch")');
    expect(source).toContain('throw new Error("employee_turn_claim_assignment_missing")');
    expect(source).toContain("const claimed = await hydrateClaimedTurnScope(db, row)");
    expect(source).toContain("return row ? hydrateClaimedTurnScope(db, row) : null");
  });
});
