/**
 * The Work Surface job-folder grouping (build-plan 15 §4b): estimate -> reply ->
 * deposit -> reminder must read as one job. Pure function, so unit-tested directly.
 */
import { describe, expect, it } from "vitest";
import { groupByJob } from "../../apps/web/app/agent/[employeeId]/lib/group-by-job";
import type { ResourcePayload } from "../../apps/web/app/agent/[employeeId]/surface-types";

function payload(over: Partial<ResourcePayload>): Partial<ResourcePayload> {
  return over;
}

describe("groupByJob", () => {
  it("returns nothing for an empty payload", () => {
    const { folders, looseWorkEvents } = groupByJob({});
    expect(folders).toHaveLength(0);
    expect(looseWorkEvents).toHaveLength(0);
  });

  it("joins estimate + invoice + reminder + work event into one named folder", () => {
    const { folders } = groupByJob(payload({
      artifacts: [{ id: "art_1", kind: "estimate", payload: { customer_name: "Smith", recommended_total: 4200 }, created_at: "2026-06-01T00:00:00Z" }],
      job_commitments: [{ id: "job_1", estimate_id: "art_1", customer_ref: "Smith", start_window: "Tue 9:30am", created_at: "2026-06-02T00:00:00Z" }],
      stripe_invoices: [{ id: "stinv_1", estimate_id: "art_1", deposit_amount: 84000, status: "paid" }],
      reminders: [{ id: "rem_1", job_id: "job_1", scheduled_at: "2026-06-03T13:30:00Z", channel: "sms", status: "scheduled" }],
      work_events: [{
        id: "evt_1", event_type: "gmail.reply_received", status: "received", created_at: "2026-06-02T12:00:00Z",
        work_event_descriptor: {
          account_id: "acct_1", employee_id: "emp_1", move: "question", title: "Customer replied", summary: "…",
          deliverable: { type: "money_movement", title: "Deposit", refs: { estimate_artifact_id: "art_1" }, acceptance: ["approve", "respond"] },
        },
      }],
    }));

    expect(folders).toHaveLength(1);
    const f = folders[0]!;
    expect(f.key).toBe("art_1");
    expect(f.title).toBe("Smith");
    expect(f.customer).toBe("Smith");
    expect(f.estimate?.id).toBe("art_1");
    expect(f.invoices).toHaveLength(1);
    expect(f.reminders).toHaveLength(1);
    expect(f.commitments).toHaveLength(1);
    expect(f.workEvents).toHaveLength(1);
  });

  it("routes a work event with no estimate ref to the loose stream", () => {
    const { folders, looseWorkEvents } = groupByJob(payload({
      work_events: [{
        id: "evt_x", event_type: "manager.connector_connected", status: "received", created_at: "2026-06-01T00:00:00Z",
        work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Gmail connected", summary: "…" },
      }],
    }));
    expect(folders).toHaveLength(0);
    expect(looseWorkEvents).toHaveLength(1);
  });

  it("gives a reminder with no job its own folder", () => {
    const { folders } = groupByJob(payload({
      reminders: [{ id: "rem_solo", scheduled_at: "2026-06-03T13:30:00Z", channel: "sms", status: "scheduled" }],
    }));
    expect(folders).toHaveLength(1);
    expect(folders[0]!.key).toBe("rem:rem_solo");
    expect(folders[0]!.reminders).toHaveLength(1);
  });

  it("orders folders by most recent activity", () => {
    const { folders } = groupByJob(payload({
      artifacts: [
        { id: "old", kind: "estimate", payload: { customer_name: "Old" }, created_at: "2026-06-01T00:00:00Z" },
        { id: "new", kind: "estimate", payload: { customer_name: "New" }, created_at: "2026-06-09T00:00:00Z" },
      ],
    }));
    expect(folders.map((f) => f.key)).toEqual(["new", "old"]);
  });
});
