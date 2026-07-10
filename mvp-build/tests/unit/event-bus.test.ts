import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverEmployeeEvent } from "../../apps/manager/src/lib/employee-events";
import { invalidateRuntimeCapabilities } from "../../apps/manager/src/lib/hermes-client";
import { listEventSources } from "../../apps/manager/src/events/registry";
import "../../apps/manager/src/events/adapters/index";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { EMAIL_SEND_ACTION_KEY, INVOICE_SEND_ACTION_KEY, REMINDER_ACTION_KEY } from "../../packages/shared/src/approval-policy";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
  process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
});
afterEach(() => {
  invalidateRuntimeCapabilities({ runtime_endpoint_id: "rt_1" });
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
    expect(db.tables.approvals?.[0]?.action_key).toBe(INVOICE_SEND_ACTION_KEY);
    const descriptor = db.tables.inbound_events?.[0]?.normalized_payload.work_event_descriptor;
    expect(descriptor.deliverable.refs.approval_id).toBe(db.tables.approvals?.[0]?.id);
  });

  it("binds the shared email send-gate action_key for an outbound_message descriptor", async () => {
    const db = makeFakeDb();
    await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      event_type: "manager.custom",
      safe_summary: "Reply draft ready.",
      actor: "manager",
      work_event_descriptor: {
        account_id: "acct_1",
        employee_id: "emp_1",
        move: "review",
        title: "Reply draft",
        summary: "Reply draft ready to send.",
        deliverable: {
          type: "outbound_message",
          title: "Reply draft",
          refs: {},
          money: { involved: false },
          leaves_business: true,
          reversible: false,
          acceptance: ["approve"],
        },
      },
    });
    expect(db.tables.approvals?.[0]?.action_key).toBe(EMAIL_SEND_ACTION_KEY);
  });

  it("binds the shared reminder action_key for a gated schedule_mutation descriptor", async () => {
    const db = makeFakeDb();
    await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      event_type: "manager.custom",
      safe_summary: "Reschedule the visit.",
      actor: "manager",
      work_event_descriptor: {
        account_id: "acct_1",
        employee_id: "emp_1",
        move: "review",
        title: "Reschedule visit",
        summary: "Move tomorrow's visit to Friday.",
        deliverable: {
          type: "schedule_mutation",
          title: "Reschedule visit",
          refs: {},
          money: { involved: false },
          leaves_business: true,
          reversible: true,
          acceptance: ["approve"],
        },
      },
    });
    expect(db.tables.approvals?.[0]?.action_key).toBe(REMINDER_ACTION_KEY);
  });

  it("persists the money amount (as a string) on the approval so the mobile preview can show it", async () => {
    const db = makeFakeDb();
    await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", event_type: "manager.custom", safe_summary: "Send the deposit invoice.", actor: "manager",
      work_event_descriptor: {
        account_id: "acct_1", employee_id: "emp_1", move: "review", title: "Deposit invoice", summary: "Collect a $1,250 deposit.",
        deliverable: { type: "money_movement", title: "Deposit invoice", refs: { estimate_artifact_id: "art_1" }, money: { involved: true, amount_cents: 125000, currency: "usd" }, leaves_business: true, reversible: false, acceptance: ["approve"] },
      },
    });
    expect(db.tables.approvals?.[0]?.refs.amount_cents).toBe("125000");
    expect(db.tables.approvals?.[0]?.refs.currency).toBe("usd");
  });

  it("does not orphan an approval or preview_link row when a duplicate delivery is caught", async () => {
    process.env.SIGNING_SECRET = "unit-test-signing-secret-0123456789";
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });
    const params = {
      account_id: "acct_1", employee_id: "emp_1", event_type: "manager.custom", idempotency_key: "dup:1", safe_summary: "x", actor: "manager" as const,
      work_event_descriptor: {
        account_id: "acct_1", employee_id: "emp_1", move: "review" as const, title: "Deposit", summary: "Send the deposit invoice.",
        deliverable: { type: "money_movement" as const, title: "Deposit invoice", refs: { estimate_artifact_id: "art_1" }, money: { involved: true, amount_cents: 125000 }, leaves_business: true, reversible: false, acceptance: ["approve" as const] },
      },
    };
    const first = await deliverEmployeeEvent(db.asClient(), params);
    const second = await deliverEmployeeEvent(db.asClient(), params);
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    // Binds now run only after the dedupe row is claimed, so the duplicate adds nothing.
    expect(db.tables.approvals).toHaveLength(1);
    expect(db.tables.preview_links).toHaveLength(1);
    delete process.env.SIGNING_SECRET;
  });

  it("wakes the employee for judgment events and stores the returned descriptor", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "amtech-owner-thread" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("unit-hermes-key") }],
    });
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/api/sessions/amtech-owner-thread/chat", body: { text: "```json\n{\"move\":\"notify\",\"title\":\"Paid\",\"summary\":\"Deposit paid.\"}\n```" } },
      { match: "/api/sessions", body: { id: "amtech-owner-thread" } },
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
    expect(listEventSources()).toEqual(["gmail", "manager", "stripe"]);
  });
});

describe("event bus — idempotency & internal direct delivery", () => {
  const webActive = () => makeFakeDb({
    channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
  }, { uniques: SCHEMA_UNIQUES });

  const gatedDescriptor = {
    account_id: "acct_1", employee_id: "emp_1", move: "question" as const, title: "Deposit",
    summary: "Send the deposit invoice.",
    deliverable: { type: "money_movement" as const, title: "Deposit invoice", refs: { estimate_artifact_id: "art_1" }, money: { involved: true }, leaves_business: true, reversible: false, acceptance: ["approve" as const] },
  };

  it("never double-delivers a redelivered event (one message, one approval)", async () => {
    const db = webActive();
    const params = { account_id: "acct_1", employee_id: "emp_1", event_type: "manager.custom", idempotency_key: "manager.custom:1", safe_summary: "x", actor: "manager" as const, work_event_descriptor: gatedDescriptor };
    const first = await deliverEmployeeEvent(db.asClient(), params);
    const second = await deliverEmployeeEvent(db.asClient(), params);
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(db.tables.inbound_events).toHaveLength(1);
    expect(db.tables.employee_messages).toHaveLength(1);
    expect(db.tables.approvals).toHaveLength(1);
  });

  it("delivers an internal reminder descriptor to the active web surface", async () => {
    const db = webActive();
    const res = await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", event_type: "manager.reminder_due", provider_id: "rem_1",
      idempotency_key: "reminder_due:rem_1", safe_summary: "Reminder: job tomorrow.", actor: "manager", channel: "sms",
      work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Job reminder", summary: "Job is set for tomorrow.", deliverable: { type: "job_folder", title: "Job follow-through", refs: {}, money: { involved: false }, reversible: true, acceptance: ["acknowledge"] } },
    });
    expect(res.duplicate).toBe(false);
    expect(res.delivery_status).toBe("delivered");
    expect(db.tables.employee_messages?.[0]?.body).toContain("Job reminder");
  });

  it("sends a malformed employee descriptor to repair, never to the owner", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "sess_1" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });
    process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
    // Both attempts return a nonconformant descriptor (empty title/summary).
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", body: { text: "```json\n{\"move\":\"notify\",\"title\":\"\",\"summary\":\"\"}\n```" } },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));
    const res = await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", event_type: "gmail.reply_received",
      safe_summary: "Customer replied.", actor: "manager", routing_mode: "wake_employee",
    });
    expect(res.delivery_status).toBe("pending");
    expect(db.tables.event_repair_queue?.[0]?.reason).toMatch(/^wake_employee_failed:/);
    expect(db.tables.inbound_events?.[0]?.status).toBe("repair");
    expect(db.tables.inbound_events?.[0]?.trace?.repair_id).toBeTruthy();
    expect(db.tables.employee_messages ?? []).toHaveLength(0); // nothing surfaced to the owner
  });

  it("keeps a silent daily-brief off the interrupt channel (batched, no send)", async () => {
    const db = webActive();
    const res = await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", event_type: "manager.daily_brief", provider_id: "emp_1:2026-07-03",
      idempotency_key: "daily_brief:emp_1:2026-07-03", safe_summary: "Daily brief.", actor: "manager", channel: "web", triage_hint: "silent",
      work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Daily brief", summary: "Here is your day.", deliverable: { type: "plan", title: "Daily brief", refs: {}, money: { involved: false }, reversible: true, acceptance: ["acknowledge"] } },
    });
    expect(res.duplicate).toBe(false);
    expect(db.tables.delivery_decisions?.[0]?.reason).toBe("silent");
  });
});
