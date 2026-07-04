import { describe, expect, it } from "vitest";
import { finishWorkRun, recordMeterEvent, recordToolInvocation, startWorkRun } from "../../apps/manager/src/lib/metering";
import { makeFakeDb } from "./_helpers/fake-supabase";

describe("metering helpers", () => {
  it("startWorkRun writes a work_run and returns a run_id", async () => {
    const db = makeFakeDb();
    const runId = await startWorkRun(db.asClient(), { account_id: "acct_1", employee_id: "emp_1", trigger_type: "provider_event", trigger_ref: "evt_1" });
    expect(runId).toMatch(/^run_/);
    expect(db.tables.work_runs).toHaveLength(1);
    expect(db.tables.work_runs[0].id).toBe(runId);
    expect(db.tables.work_runs[0].status).toBe("started");
  });

  it("finishWorkRun stamps status + finished_at", async () => {
    const db = makeFakeDb();
    const runId = await startWorkRun(db.asClient(), { trigger_type: "system" });
    await finishWorkRun(db.asClient(), runId, "succeeded");
    expect(db.tables.work_runs[0].status).toBe("succeeded");
    expect(db.tables.work_runs[0].finished_at).toBeTruthy();
  });

  it("records meter events and tool invocations under a run_id", async () => {
    const db = makeFakeDb();
    await recordMeterEvent(db.asClient(), { run_id: "run_1", account_id: "acct_1", category: "manager_tool", feature_key: "gmail.reply_received", unit: "tool_call", quantity: 1 });
    await recordToolInvocation(db.asClient(), { run_id: "run_1", tool_name: "wake_employee", actor: "manager", status: "succeeded" });
    expect(db.tables.meter_events[0].run_id).toBe("run_1");
    expect(db.tables.meter_events[0].feature_key).toBe("gmail.reply_received");
    expect(db.tables.tool_invocations[0].tool_name).toBe("wake_employee");
  });

  it("is best-effort: a failing meter write never throws", async () => {
    const broken = { from() { throw new Error("db down"); } } as never;
    // None of these should reject even though the DB is unusable.
    const runId = await startWorkRun(broken, { trigger_type: "system" });
    expect(runId).toMatch(/^run_/); // id still returned so correlation can proceed
    await expect(recordMeterEvent(broken, { category: "sms", feature_key: "send_sms", unit: "sms_segment" })).resolves.toBeUndefined();
    await expect(recordToolInvocation(broken, { tool_name: "x" })).resolves.toBeUndefined();
    await expect(finishWorkRun(broken, "run_1", "failed")).resolves.toBeUndefined();
  });
});
