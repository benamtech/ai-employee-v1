/**
 * Phase 5 close-the-loop: set_internal_reminder (job commitment + optional owner
 * gate + employee-written message), dispatch_due_reminders (fire at scheduled_at,
 * idempotent), and renew_expiring_watches (the watch-renewal sweep). Local logic
 * only — Twilio is left unset so the reminder SMS stays `pending` (the real Twilio
 * MessageSid is env-gated acceptance, golden step5), never mocked here.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eventTools } from "../../apps/manager/src/tools/events.stub";
import { gmailTools } from "../../apps/manager/src/tools/gmail.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";

beforeEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
});
afterEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
});

function ctx(db: FakeSupabase): ToolContext {
  return { db: db.asClient(), account_id: "acct_1", employee_id: "emp_1", actor: "employee" };
}

// Scheduler-driven tools (dispatch_*) are least-privilege: only the scheduler actor
// may invoke them, mirroring the runSchedulerCycle caller.
function schedCtx(db: FakeSupabase): ToolContext {
  return { db: db.asClient(), account_id: null, employee_id: null, actor: "scheduler" };
}

const ownedDb = () => makeFakeDb({ employees: [{ id: "emp_1", account_id: "acct_1" }] });

describe("set_internal_reminder", () => {
  it("creates a job commitment + reminder with the employee-written message", async () => {
    const db = ownedDb();
    const res = await eventTools.set_internal_reminder!(ctx(db), {
      account_id: "acct_1", employee_id: "emp_1",
      scheduled_at: "2026-07-01T13:30:00.000Z",
      message: "Reminder: Smith repaint starts Tuesday 9:30.",
      job: { estimate_artifact_id: "art_1", customer_ref: "Smith", start_window: "Tue 9:30am" },
    });
    expect(res.status).toBe("ok");
    expect(res.proof.reminder_id).toBeTruthy();
    expect(res.proof.job_id).toBeTruthy();
    const job = db.tables.job_commitments?.[0];
    expect(job?.account_id).toBe("acct_1"); // RLS owner scope is set
    expect(job?.customer_ref).toBe("Smith");
    const reminder = db.tables.reminders?.[0];
    expect(reminder?.status).toBe("scheduled");
    expect(reminder?.message).toContain("Smith");
  });

  it("is idempotent for the same employee + scheduled time", async () => {
    const db = ownedDb();
    const args = { account_id: "acct_1", employee_id: "emp_1", scheduled_at: "2026-07-01T13:30:00.000Z" };
    await eventTools.set_internal_reminder!(ctx(db), args);
    const second = await eventTools.set_internal_reminder!(ctx(db), args);
    expect(second.proof.idempotent).toBe(true);
    expect(db.tables.reminders).toHaveLength(1);
  });

  it("requires a resolved set_job_reminder approval when approval_id is given", async () => {
    const db = ownedDb();
    db.tables.approvals = [{ id: "appr_1", account_id: "acct_1", employee_id: "emp_1", action_key: "set_job_reminder", resolution: null }];
    const denied = await eventTools.set_internal_reminder!(ctx(db), {
      account_id: "acct_1", employee_id: "emp_1", scheduled_at: "2026-07-01T13:30:00.000Z", approval_id: "appr_1",
    });
    expect(denied.status).toBe("failed");
    expect(denied.proof.failure_code).toBe("unauthorized");

    db.tables.approvals![0]!.resolution = "approved";
    const ok = await eventTools.set_internal_reminder!(ctx(db), {
      account_id: "acct_1", employee_id: "emp_1", scheduled_at: "2026-07-01T13:30:00.000Z", approval_id: "appr_1",
    });
    expect(ok.status).toBe("ok");
  });
});

describe("dispatch_due_reminders", () => {
  function seedReminder(status: string, scheduledAt: string, message = "Job starts soon.") {
    return makeFakeDb({
      reminders: [{ id: "rem_1", account_id: "acct_1", employee_id: "emp_1", job_id: null, scheduled_at: scheduledAt, channel: "sms", status, message }],
    });
  }

  it("fires a due reminder and flips it out of scheduled", async () => {
    const db = seedReminder("scheduled", "2026-07-01T13:30:00.000Z");
    const res = await eventTools.dispatch_due_reminders!(schedCtx(db), { now: "2026-07-01T14:00:00.000Z" });
    expect(res.status).toBe("ok");
    expect(res.proof.due).toBe(1);
    expect(res.proof.fired).toBe(1);
    expect(db.tables.reminders?.[0]?.status).toBe("sent");
    // The owner-facing message was delivered to the Work Surface.
    const msg = db.tables.employee_messages?.find((m) => m.direction === "to_owner");
    expect(msg?.body).toContain("Job starts soon.");
  });

  it("leaves a not-yet-due reminder untouched", async () => {
    const db = seedReminder("scheduled", "2026-07-01T13:30:00.000Z");
    const res = await eventTools.dispatch_due_reminders!(schedCtx(db), { now: "2026-07-01T12:00:00.000Z" });
    expect(res.proof.due).toBe(0);
    expect(db.tables.reminders?.[0]?.status).toBe("scheduled");
  });

  it("does not double-fire on a second tick", async () => {
    const db = seedReminder("scheduled", "2026-07-01T13:30:00.000Z");
    await eventTools.dispatch_due_reminders!(schedCtx(db), { now: "2026-07-01T14:00:00.000Z" });
    const second = await eventTools.dispatch_due_reminders!(schedCtx(db), { now: "2026-07-01T15:00:00.000Z" });
    expect(second.proof.fired).toBe(0);
    expect(db.tables.employee_messages?.filter((m) => m.direction === "to_owner")).toHaveLength(1);
  });

  it("derives a message from the job when none was written", async () => {
    const db = makeFakeDb({
      reminders: [{ id: "rem_1", account_id: "acct_1", employee_id: "emp_1", job_id: "job_1", scheduled_at: "2026-07-01T13:30:00.000Z", channel: "sms", status: "scheduled", message: null }],
      job_commitments: [{ id: "job_1", account_id: "acct_1", employee_id: "emp_1", customer_ref: "Smith", start_window: "Tue 9:30am" }],
    });
    await eventTools.dispatch_due_reminders!(schedCtx(db), { now: "2026-07-01T14:00:00.000Z" });
    const msg = db.tables.employee_messages?.find((m) => m.direction === "to_owner");
    expect(msg?.body).toContain("Smith");
    expect(msg?.body).toContain("Tue 9:30am");
  });
});

describe("dispatch_daily_briefs", () => {
  it("emits a stored silent daily brief work event for live employees", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1", status: "live" }],
      approvals: [{ id: "appr_1", account_id: "acct_1", employee_id: "emp_1", resolution: null }],
      reminders: [{ id: "rem_1", account_id: "acct_1", employee_id: "emp_1", status: "scheduled", scheduled_at: "2026-07-02T00:00:00.000Z" }],
      stripe_connections: [],
    });
    const res = await eventTools.dispatch_daily_briefs!(schedCtx(db), { now: "2026-07-01T00:00:00.000Z" });
    expect(res.status).toBe("ok");
    expect(res.proof.emitted).toBe(1);
    const event = db.tables.inbound_events?.[0];
    expect(event?.event_type).toBe("manager.daily_brief");
    // Silent routing is carried by triage (batched), NOT a marker leaked into the
    // owner-facing summary.
    expect(event?.triage_decision).toBe("batch");
    expect(event?.normalized_payload.work_event_descriptor.summary).not.toContain("[SILENT]");
  });

  it("refuses a non-scheduler actor (least privilege)", async () => {
    const db = makeFakeDb({ employees: [{ id: "emp_1", account_id: "acct_1", status: "live" }] });
    const denied = await eventTools.dispatch_daily_briefs!(ctx(db), { now: "2026-07-01T00:00:00.000Z" });
    expect(denied.status).toBe("failed");
    expect(denied.proof.failure_code).toBe("unauthorized");
    expect(db.tables.inbound_events ?? []).toHaveLength(0);
  });
});

describe("renew_expiring_watches", () => {
  it("is a no-op when no watch is near expiry", async () => {
    const db = makeFakeDb({
      gmail_watches: [{ id: "watch_1", connector_id: "conn_1", status: "active", expiration: "2026-07-10T00:00:00.000Z" }],
    });
    const res = await gmailTools.renew_expiring_watches!(ctx(db), { now: "2026-07-01T00:00:00.000Z", within_seconds: 86_400 });
    expect(res.status).toBe("ok");
    expect(res.proof.candidates).toBe(0);
    expect(res.proof.renewed).toBe(0);
  });

  it("selects an expiring watch and fails gracefully when its connector is not connected", async () => {
    const db = makeFakeDb({
      gmail_watches: [{ id: "watch_1", connector_id: "conn_1", status: "active", expiration: "2026-07-01T06:00:00.000Z" }],
      connector_accounts: [{ id: "conn_1", account_id: "acct_1", employee_id: "emp_1", connector_key: "email", provider: "gmail", status: "disconnected", token_secret_ref: null }],
    });
    const res = await gmailTools.renew_expiring_watches!(ctx(db), { now: "2026-07-01T00:00:00.000Z", within_seconds: 86_400 });
    expect(res.status).toBe("ok");
    expect(res.proof.candidates).toBe(1);
    expect(res.proof.renewed).toBe(0); // not connected → graceful failure, no network
  });
});
