import { describe, expect, it } from "vitest";
import type { ResourcePayload } from "../../apps/web/app/agent/[employeeId]/surface-types";
import { defaultSelection, labelConnector, navCounts, previewItem, statusTone } from "../../apps/web/app/agent/[employeeId]/lib/surface-model";

function payload(overrides: Partial<ResourcePayload> = {}): ResourcePayload {
  return {
    account_id: "acct_1",
    employee_id: "emp_1",
    artifacts: [],
    approvals: [],
    messages: [],
    connectors: [],
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: [],
    abilities: [],
    outputs: [],
    tasks: [],
    ...overrides,
  };
}

describe("Work Surface model", () => {
  it("keeps an empty resource payload selectable only when real work exists", () => {
    const res = payload();
    expect(defaultSelection(res)).toBeNull();
    expect(previewItem(res, null)).toBeNull();
    expect(navCounts(res).today).toBe(0);
  });

  it("prioritizes owner-needed tasks for the default preview", () => {
    const res = payload({
      tasks: [{ id: "task_1", type: "approval", title: "Approve send", status: "needs_you", target_id: "appr_1" }],
      outputs: [{ id: "output_1", type: "artifact", title: "Estimate", status: "ready" }],
    });
    expect(defaultSelection(res)).toEqual({ kind: "task", id: "task_1" });
    expect(previewItem(res, { kind: "task", id: "task_1" })?.title).toBe("Approve send");
  });

  it("counts major navigation groups from the resource payload", () => {
    const counts = navCounts(payload({
      messages: [{ id: "m_1", direction: "to_owner", body: "hi", status: "sent", created_at: "x" }],
      tasks: [
        { id: "task_1", type: "approval", title: "A", status: "needs_you" },
        { id: "task_2", type: "reminder", title: "B", status: "scheduled" },
      ],
      outputs: [{ id: "output_1", type: "artifact", title: "Estimate", status: "ready" }],
      connectors: [{ id: "conn_1", connector_key: "gmail", provider: "gmail", status: "connected" }],
      abilities: [{ id: "ability_1", label: "Email", category: "communication", status: "ready", summary: "x", source: "connector" }],
    }));
    expect(counts.today).toBe(1);
    expect(counts.chat).toBe(1);
    expect(counts.tasks).toBe(2);
    expect(counts.outputs).toBe(1);
    expect(counts.connected).toBe(1);
    expect(counts.abilities).toBe(1);
  });

  it("translates connector and status labels into owner-facing buckets", () => {
    expect(labelConnector("gmail")).toBe("Email");
    expect(labelConnector("stripe")).toBe("Payments");
    expect(statusTone("needs_connection")).toBe("warn");
    expect(statusTone("unhealthy")).toBe("bad");
    expect(statusTone("ready")).toBe("good");
  });
});
