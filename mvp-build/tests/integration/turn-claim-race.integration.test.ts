/**
 * Turn-queue concurrency — proves migration 0024 closes the unhandled 23505
 * race in claim_employee_turn_job_for_employee: two concurrent claims for the
 * SAME employee (with 2+ queued turns) must never both attempt the
 * employee_turn_locks insert and throw. This is deliberately a SEPARATE file
 * from turn-claim.integration.test.ts, whose two claim calls are awaited
 * sequentially and so never open this race window; here the two calls are
 * launched together via Promise.all against real Supabase to genuinely
 * interleave two Postgres transactions.
 *
 * Runs only against live Supabase creds; excluded from `test:unit`.
 * Run with: `npm run test:integration`.
 * Required env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * (migration 0024 must be applied: `npm run db:migrate`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serviceClient } from "@amtech/db";

const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const suffix = `race_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const accountId = `acct_${suffix}`;
const employeeId = `emp_${suffix}`;
const job1 = `turn_1_${suffix}`;
const job2 = `turn_2_${suffix}`;

describe.skipIf(!hasDb)("turn-queue: concurrent claim for the same employee does not throw 23505", () => {
  beforeAll(async () => {
    const svc = serviceClient();
    await svc.from("accounts").insert({ id: accountId, display_name: "Race Test" });
    await svc.from("employees").insert({ id: employeeId, account_id: accountId, name: "Race Emp" });
    await svc.from("employee_turn_jobs").insert([
      { id: job1, account_id: accountId, employee_id: employeeId, kind: "owner_web_chat", idempotency_key: `k1_${suffix}`, status: "queued", input: {}, created_at: new Date(Date.now() - 2000).toISOString() },
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

  it("exactly one concurrent claim wins the employee lock; the loser returns no rows, not an error", async () => {
    const svc = serviceClient();
    const [a, b] = await Promise.all([
      svc.rpc("claim_employee_turn_job_for_employee", { p_employee_id: employeeId, p_worker_id: "race-a", p_lease_seconds: 120 }),
      svc.rpc("claim_employee_turn_job_for_employee", { p_employee_id: employeeId, p_worker_id: "race-b", p_lease_seconds: 120 }),
    ]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    const rowsA = a.data ?? [];
    const rowsB = b.data ?? [];
    const winners = [rowsA, rowsB].filter((r) => r.length === 1);
    const losers = [rowsA, rowsB].filter((r) => r.length === 0);
    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(1);
    expect([job1, job2]).toContain(winners[0]![0].id);
  }, 30_000);
});
