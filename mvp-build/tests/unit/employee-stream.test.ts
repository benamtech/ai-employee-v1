import { describe, expect, it } from "vitest";
import { buildEmployeeSnapshot, fetchWorkEventsSince } from "../../apps/manager/src/lib/employee-stream";
import { makeFakeDb } from "./_helpers/fake-supabase";

function descriptorPayload(account: string, employee: string) {
  return { work_event_descriptor: { account_id: account, employee_id: employee, move: "notify", title: "T", summary: "S" } };
}

const seed = () => ({
  approvals: [{ id: "appr_1", employee_id: "emp_1", account_id: "acct_1", action_key: "send_email", summary: "x", risk_level: "high", resolution: null, created_at: "2026-07-04T00:00:00Z" }],
  employee_messages: [{ id: "m_1", employee_id: "emp_1", direction: "to_owner", body: "hi", status: "sent", created_at: "2026-07-04T00:00:00Z" }],
  inbound_events: [
    { id: "e_1", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
    { id: "e_other", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:02Z", normalized_payload: descriptorPayload("acct_2", "emp_2") },
  ],
});

describe("buildEmployeeSnapshot", () => {
  it("returns an account-scoped, descriptor-filtered read-model", async () => {
    const db = makeFakeDb(seed());
    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    expect(snap.account_id).toBe("acct_1");
    expect(snap.employee_id).toBe("emp_1");
    expect(snap.approvals).toHaveLength(1);
    // Only this employee/account's work event survives the descriptor filter.
    expect(snap.work_events.map((w) => w.id)).toEqual(["e_1"]);
  });
});

describe("fetchWorkEventsSince", () => {
  it("returns only events strictly after the cursor and advances it", async () => {
    const db = makeFakeDb(seed());
    const before = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:00Z");
    expect(before.workEvents.map((w) => w.id)).toEqual(["e_1"]);
    expect(before.nextCursor).toBe("2026-07-04T00:00:02Z");

    const after = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:01Z");
    expect(after.workEvents).toHaveLength(0);
  });

  it("surfaces newly created approvals as deltas", async () => {
    const db = makeFakeDb(seed());
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-03T00:00:00Z");
    expect(delta.approvals).toEqual([{ id: "appr_1", resolution: null }]);
  });
});
