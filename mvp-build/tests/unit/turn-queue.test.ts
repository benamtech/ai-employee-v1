import { describe, expect, it } from "vitest";
import { enqueueEmployeeTurn, runEmployeeTurn } from "../../apps/manager/src/lib/turn-queue";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

const base = { account_id: "acct_1", employee_id: "emp_1", kind: "owner_web_chat" as const, input: { body: "hi" } };

describe("turn-queue", () => {
  it("enqueues a queued job", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const res = await enqueueEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" });
    expect(res.duplicate).toBe(false);
    expect(res.status).toBe("queued");
    expect(db.tables.employee_turn_jobs).toHaveLength(1);
  });

  it("returns duplicate on a repeated idempotency key", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    await enqueueEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" });
    const dup = await enqueueEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" });
    expect(dup.duplicate).toBe(true);
    expect(db.tables.employee_turn_jobs).toHaveLength(1);
  });

  it("runs execute once and returns its output", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    let calls = 0;
    const res = await runEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" }, async () => { calls += 1; return { reply: "done" }; });
    expect(calls).toBe(1);
    expect(res.status).toBe("succeeded");
    expect(res.output?.reply).toBe("done");
    expect(db.tables.employee_turn_jobs[0].status).toBe("succeeded");
  });

  it("returns the stored output on a duplicate after success (no re-execute)", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    let calls = 0;
    await runEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" }, async () => { calls += 1; return { reply: "first" }; });
    const again = await runEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" }, async () => { calls += 1; return { reply: "second" }; });
    expect(calls).toBe(1);
    expect(again.status).toBe("duplicate");
    expect(again.output?.reply).toBe("first");
  });

  it("returns queued when another worker holds the employee lease", async () => {
    const db = makeFakeDb(
      { employee_turn_locks: [{ employee_id: "emp_1", job_id: "turn_other", lease_token: "held", lease_expires_at: new Date(Date.now() + 60_000).toISOString() }] },
      { uniques: SCHEMA_UNIQUES },
    );
    let calls = 0;
    const res = await runEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" }, async () => { calls += 1; return { reply: "x" }; });
    expect(calls).toBe(0);
    expect(res.status).toBe("queued");
  });

  it("does not orphan an older queued turn when a newer request claims it", async () => {
    // turn_old is already queued (its own request returned 'queued' earlier). A newer
    // request enqueues turn_new and, with the lease free, the claim returns the OLDEST
    // queued turn (turn_old). The newer request must not leave turn_old stuck 'running';
    // it releases it back to 'queued' for a drain and reports 'queued' for itself.
    const db = makeFakeDb({
      employee_turn_jobs: [{
        id: "turn_old", account_id: "acct_1", employee_id: "emp_1", kind: "owner_web_chat",
        idempotency_key: "old", status: "queued", input: { body: "earlier" }, output: {}, attempts: 0,
        lease_token: null, lease_expires_at: null, created_at: "2026-07-03T00:00:00.000Z",
      }],
    }, { uniques: SCHEMA_UNIQUES });
    let calls = 0;
    const res = await runEmployeeTurn(db.asClient(), { ...base, idempotency_key: "new" }, async () => { calls += 1; return { reply: "x" }; });
    expect(calls).toBe(0);
    expect(res.status).toBe("queued");
    const old = db.tables.employee_turn_jobs.find((j) => j.id === "turn_old");
    expect(old?.status).toBe("queued"); // released, NOT orphaned in 'running'
    expect(db.tables.employee_turn_locks ?? []).toHaveLength(0);
  });

  it("marks failed and records the error when execute throws", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const res = await runEmployeeTurn(db.asClient(), { ...base, idempotency_key: "k1" }, async () => { throw new Error("boom"); });
    expect(res.status).toBe("failed");
    expect(res.error).toContain("boom");
    expect(db.tables.employee_turn_jobs[0].status).toBe("failed");
    expect(db.tables.employee_turn_jobs[0].error).toContain("boom");
  });
});
