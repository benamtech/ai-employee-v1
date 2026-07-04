import { describe, expect, it } from "vitest";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import { insertDedup } from "../../apps/manager/src/lib/db";

describe("fake-supabase: unique-index enforcement", () => {
  it("rejects a duplicate insert on a declared unique key with a 23505", async () => {
    const db = makeFakeDb({}, { uniques: { inbound_events: [["idempotency_key"]] } });
    const first = await db.from("inbound_events").insert({ id: "evt_1", idempotency_key: "k1" });
    expect(first.error).toBeNull();
    const second = await db.from("inbound_events").insert({ id: "evt_2", idempotency_key: "k1" });
    expect(second.error?.code).toBe("23505");
    // Only the first row survived.
    expect(db.tables.inbound_events).toHaveLength(1);
  });

  it("makes insertDedup report conflict on a lost unique race", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const a = await insertDedup(db.from("delivery_decisions").insert({ id: "d1", employee_id: "emp_1", intent_key: "i1" }), "t");
    const b = await insertDedup(db.from("delivery_decisions").insert({ id: "d2", employee_id: "emp_1", intent_key: "i1" }), "t");
    expect(a.conflict).toBe(false);
    expect(b.conflict).toBe(true);
  });

  it("treats NULL unique members as distinct (Postgres semantics)", async () => {
    const db = makeFakeDb({}, { uniques: { channel_sessions: [["employee_id", "channel"]] } });
    const a = await db.from("channel_sessions").insert({ id: "c1", employee_id: "emp_1", channel: null });
    const b = await db.from("channel_sessions").insert({ id: "c2", employee_id: "emp_1", channel: null });
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    expect(db.tables.channel_sessions).toHaveLength(2);
  });

  it("leaves inserts unconstrained when no uniques are declared (back-compat)", async () => {
    const db = makeFakeDb();
    await db.from("inbound_events").insert({ id: "e1", idempotency_key: "same" });
    await db.from("inbound_events").insert({ id: "e2", idempotency_key: "same" });
    expect(db.tables.inbound_events).toHaveLength(2);
  });
});

describe("fake-supabase: turn-queue rpc", () => {
  const seedJob = (over: Record<string, any> = {}) => ({
    id: "turn_1", account_id: "acct_1", employee_id: "emp_1", kind: "employee_event_wake",
    idempotency_key: "wake:evt_1", status: "queued", input: { a: 1 }, output: {}, attempts: 0,
    lease_token: null, lease_expires_at: null, created_at: "2026-07-03T00:00:00.000Z", ...over,
  });

  it("claims a queued job, locks the employee, and bumps attempts", async () => {
    const db = makeFakeDb({ employee_turn_jobs: [seedJob()] });
    const { data } = await db.rpc("claim_employee_turn_job_for_employee", { p_employee_id: "emp_1", p_worker_id: "w1", p_lease_seconds: 60 });
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("turn_1");
    expect(data[0].attempts).toBe(1);
    expect(data[0].lease_token).toContain("w1:");
    expect(db.tables.employee_turn_jobs[0].status).toBe("running");
    expect(db.tables.employee_turn_locks).toHaveLength(1);
  });

  it("does not hand a second worker a job while the employee lease is held", async () => {
    const db = makeFakeDb({ employee_turn_jobs: [seedJob(), seedJob({ id: "turn_2", idempotency_key: "wake:evt_2", created_at: "2026-07-03T00:00:01.000Z" })] });
    const first = await db.rpc("claim_employee_turn_job_for_employee", { p_employee_id: "emp_1", p_worker_id: "w1", p_lease_seconds: 60 });
    const second = await db.rpc("claim_employee_turn_job_for_employee", { p_employee_id: "emp_1", p_worker_id: "w2", p_lease_seconds: 60 });
    expect(first.data).toHaveLength(1);
    expect(second.data).toHaveLength(0); // serialized: emp_1 lease still held
  });

  it("completes only with the matching lease token and releases the lock", async () => {
    const db = makeFakeDb({ employee_turn_jobs: [seedJob()] });
    const claim = await db.rpc("claim_employee_turn_job", { p_worker_id: "w1", p_lease_seconds: 60 });
    const token = claim.data[0].lease_token;
    const wrong = await db.rpc("complete_employee_turn_job", { p_job_id: "turn_1", p_lease_token: "nope", p_status: "succeeded" });
    expect(wrong.data).toBe(false);
    const right = await db.rpc("complete_employee_turn_job", { p_job_id: "turn_1", p_lease_token: token, p_status: "succeeded", p_output: { ok: true } });
    expect(right.data).toBe(true);
    expect(db.tables.employee_turn_jobs[0].status).toBe("succeeded");
    expect(db.tables.employee_turn_jobs[0].output).toEqual({ ok: true });
    expect(db.tables.employee_turn_locks).toHaveLength(0);
  });
});
