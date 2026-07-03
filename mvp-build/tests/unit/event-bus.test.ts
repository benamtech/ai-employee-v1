import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverEmployeeEvent } from "../../apps/manager/src/lib/employee-events";
import { listEventSources } from "../../apps/manager/src/events/registry";
import { makeFakeDb } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("event bus delivery", () => {
  it("auto-binds a real approval for gated delivered descriptors", async () => {
    const db = makeFakeDb();
    const res = await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      event_type: "gmail.reply_received",
      safe_summary: "Jane accepted the deposit.",
      actor: "manager",
      work_event_descriptor: {
        account_id: "acct_1",
        employee_id: "emp_1",
        move: "question",
        title: "Customer replied",
        summary: "Jane accepted the deposit.",
        deliverable: {
          type: "money_movement",
          title: "Deposit invoice",
          refs: { estimate_artifact_id: "art_1" },
          money: { involved: true },
          leaves_business: true,
          reversible: false,
          acceptance: ["approve", "edit", "reject"],
        },
      },
    });
    expect(res.duplicate).toBe(false);
    expect(db.tables.approvals).toHaveLength(1);
    const descriptor = db.tables.inbound_events?.[0]?.normalized_payload.work_event_descriptor;
    expect(descriptor.deliverable.refs.approval_id).toBe(db.tables.approvals?.[0]?.id);
  });

  it("wakes the employee for judgment events and stores the returned descriptor", async () => {
    const db = makeFakeDb({ runtime_endpoints: [{ employee_id: "emp_1", webchat_api_url: "https://runtime.test" }] });
    vi.stubGlobal("fetch", routerFetch([
      { match: "/events/work", body: { work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Paid", summary: "Deposit paid." } } },
    ]));
    const res = await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      event_type: "stripe.invoice_paid",
      safe_summary: "Deposit paid.",
      actor: "manager",
      routing_mode: "wake_employee",
    });
    expect(res.duplicate).toBe(false);
    expect(db.tables.inbound_events?.[0]?.routing_mode).toBe("wake_employee");
    expect(db.tables.employee_messages?.[0]?.body).toContain("Paid");
  });

  it("routes unknown account context to the repair queue", async () => {
    const db = makeFakeDb();
    const res = await deliverEmployeeEvent(db.asClient(), {
      account_id: "",
      employee_id: "",
      event_type: "gmail.reply_received",
      safe_summary: "Unknown mapping.",
      actor: "manager",
    });
    expect(res.message_id).toBe("");
    expect(db.tables.event_repair_queue?.[0]?.reason).toBe("triage_repair");
  });

  it("has concrete registered event sources", () => {
    expect(listEventSources()).toEqual(["gmail", "manager", "stripe", "twilio"]);
  });
});
