/**
 * Turn-queue concurrency — REAL integration proof of the plpgsql claim/complete
 * functions in migrations 0011/0014 (the unit suite proves the TS branches
 * against an in-memory faithful shim; this proves the actual Postgres
 * serialization + lease + run_id propagation).
 *
 * Runs only against live Supabase creds; excluded from `test:unit`.
 * Run with: `npm run test:integration`.
 * Required env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * (migrations 0011/0014 must be applied: `npm run db:migrate`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serviceClient } from "@amtech/db";

const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const suffix = `turn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const accountId = `acct_${suffix}`;
const employeeId = `emp_${suffix}`;
const job1 = `turn_1_${suffix}`;
const job2 = `turn_2_${suffix}`;
const runId = `run_${suffix}`;

describe.skipIf(!hasDb)("turn-queue: plpgsql claim serializes per employee brain", () => {
  beforeAll(async () => {
    const svc = serviceClient();
    await svc.from("accounts").insert({ id: accountId, display_name: "Turn Test" });
    await svc.from("employees").insert({ id: employeeId, account_id: accountId, name: "Turn Emp" });
    await svc.from("employee_turn_jobs").insert([
      { id: job1, account_id: accountId, employee_id: employeeId, kind: "owner_web_chat", idempotency_key: `k1_${suffix}`, status: "queued", input: {}, run_id: runId, created_at: new Date(Date.now() - 2000).toISOString() },
      { id: job2, account_id: accountId, employee_id: employeeId, kind: "owner_web_chat", idempotency_key: `k2_${suffix}`, status: "queued", input: {}, created_at: new Date(Date.now() - 1000).toISOString() },
    ]);
  }, 30_000);

  afterAll(async () => {
    const svc = serviceClient();
    await svc.from("employee_turn_locks").delete().eq("employee_id", employeeId);
    await svc.from("employee_turn_jobs").delete().eq("employee_id", employeeId);
    await svc.from("employees").delete().eq("id", employeeId);
    await svc.from("accounts").delete().eq("id", accountId);
  });

  it("hands one worker the oldest job and blocks a second while the lease is held", async () => {
    const svc = serviceClient();
    const first = await svc.rpc("claim_employee_turn_job_for_employee", { p_employee_id: employeeId, p_worker_id: "w1", p_lease_seconds: 120 });
    expect(first.error).toBeNull();
    expect(first.data).toHaveLength(1);
    expect(first.data[0].id).toBe(job1); // FIFO
    expect(first.data[0].run_id).toBe(runId);

    const second = await svc.rpc("claim_employee_turn_job_for_employee", { p_employee_id: employeeId, p_worker_id: "w2", p_lease_seconds: 120 });
    expect(second.error).toBeNull();
    expect(second.data ?? []).toHaveLength(0); // serialized: emp lease still held by w1

    const token = first.data[0].lease_token as string;

    // Complete rejects a wrong lease token, accepts the right one.
    const wrong = await svc.rpc("complete_employee_turn_job", { p_job_id: job1, p_lease_token: "nope", p_status: "succeeded" });
    expect(wrong.data).toBe(false);
    const right = await svc.rpc("complete_employee_turn_job", { p_job_id: job1, p_lease_token: token, p_status: "succeeded", p_output: { ok: true } });
    expect(right.data).toBe(true);

    // Lease released -> the next queued job is now claimable.
    const third = await svc.rpc("claim_employee_turn_job_for_employee", { p_employee_id: employeeId, p_worker_id: "w3", p_lease_seconds: 120 });
    expect(third.data).toHaveLength(1);
    expect(third.data[0].id).toBe(job2);
  }, 30_000);
});
