import { describe, expect, it } from "vitest";
import { buildEmployeeSnapshot, cursorFromSnapshot, fetchWorkEventsSince } from "../../apps/manager/src/lib/employee-stream";
import { makeFakeDb } from "./_helpers/fake-supabase";

function descriptorPayload(account: string, employee: string) {
  return { work_event_descriptor: { account_id: account, employee_id: employee, move: "notify", title: "T", summary: "S" } };
}

const seed = () => ({
  approvals: [{ id: "appr_1", employee_id: "emp_1", account_id: "acct_1", action_key: "send_email", summary: "x", risk_level: "high", resolution: null, created_at: "2026-07-04T00:00:00Z" }],
  employees: [{ id: "emp_1", account_id: "acct_1", name: "Sage", status: "live", profile_id: "client_emp_1", created_at: "2026-07-04T00:00:00Z" }],
  artifacts: [{ id: "art_1", employee_id: "emp_1", account_id: "acct_1", kind: "estimate", payload: { customer_name: "Jane", job_description: "Mulch", recommended_total: 1120 }, storage_ref: null, created_at: "2026-07-04T00:00:03Z" }],
  connector_accounts: [{ id: "conn_1", employee_id: "emp_1", account_id: "acct_1", connector_key: "gmail", provider: "gmail", status: "needs_reauth", last_error: "expired" }],
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
    expect(snap.employee?.name).toBe("Sage");
    expect(snap.outputs?.map((o) => o.id)).toContain("artifact:art_1");
    expect(snap.tasks?.some((t) => t.id === "approval:appr_1")).toBe(true);
    expect(snap.tasks?.some((t) => t.id === "connector:conn_1")).toBe(true);
    expect(snap.abilities?.some((a) => a.id === "ability:email" && a.status === "needs_connection")).toBe(true);
    expect(snap.capabilities?.some((c) => c.key === "manager_tool:create_estimate_artifact")).toBe(true);
    expect(snap.surface_envelopes?.some((e) => e.kind === "approval" && e.safety.requires_approval)).toBe(true);
  });
});

describe("fetchWorkEventsSince", () => {
  it("returns only events strictly after the cursor and advances it", async () => {
    const db = makeFakeDb(seed());
    const before = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:00Z");
    expect(before.workEvents.map((w) => w.id)).toEqual(["e_1"]);
    expect(before.nextCursor).toEqual({ created_at: "2026-07-04T00:00:02Z", id: "e_other" });

    const after = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", { created_at: "2026-07-04T00:00:01Z", id: "e_1" });
    expect(after.workEvents).toHaveLength(0);
  });

  it("surfaces newly created approvals as deltas", async () => {
    const db = makeFakeDb(seed());
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-03T00:00:00Z");
    expect(delta.approvals).toEqual([{ id: "appr_1", resolution: null }]);
  });

  it("advances the cursor when only approvals are new", async () => {
    const db = makeFakeDb({
      ...seed(),
      inbound_events: [],
      approvals: [{ id: "appr_2", employee_id: "emp_1", account_id: "acct_1", action_key: "send_email", summary: "x", risk_level: "high", resolution: null, created_at: "2026-07-04T00:00:05Z" }],
    });
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", "2026-07-04T00:00:00Z");
    expect(delta.approvals).toEqual([{ id: "appr_2", resolution: null }]);
    expect(delta.nextCursor).toEqual({ created_at: "2026-07-04T00:00:05Z", id: "appr_2" });
  });

  it("uses a stable created_at/id cursor for same-ms rows", async () => {
    const db = makeFakeDb({
      ...seed(),
      inbound_events: [
        { id: "evt_a", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01.000Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
        { id: "evt_b", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:01.000Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
        { id: "evt_c", source: "gmail", event_type: "gmail.reply_received", status: "delivered", created_at: "2026-07-04T00:00:02.000Z", normalized_payload: descriptorPayload("acct_1", "emp_1") },
      ],
      approvals: [],
    });
    const delta = await fetchWorkEventsSince(db.asClient(), "emp_1", "acct_1", { created_at: "2026-07-04T00:00:01.000Z", id: "evt_a" });
    expect(delta.workEvents.map((w) => w.id)).toEqual(["evt_b", "evt_c"]);
    expect(delta.nextCursor).toEqual({ created_at: "2026-07-04T00:00:02.000Z", id: "evt_c" });
  });

  it("derives reconnect cursor from delivered snapshot rows", async () => {
    const db = makeFakeDb(seed());
    const snap = await buildEmployeeSnapshot(db.asClient(), "emp_1", "acct_1");
    expect(cursorFromSnapshot(snap)).toEqual({ created_at: "2026-07-04T00:00:01Z", id: "e_1" });
  });
});
