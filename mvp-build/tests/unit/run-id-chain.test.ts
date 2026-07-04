/**
 * Phase 6 acceptance: a single run_id correlates a multi-step work chain. Proven
 * end-to-end through the real ingress -> triage -> (wake) -> deliver path so the
 * contract is stable before Phase 5 stream shapes adopt it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_TYPES } from "@amtech/shared";
import { ingestEvent } from "../../apps/manager/src/events/ingress";
import { deliverEmployeeEvent } from "../../apps/manager/src/lib/employee-events";
import { deliverOwnerTurnToRuntime } from "../../apps/manager/src/lib/runtime";
import { drainQueuedTurns } from "../../apps/manager/src/lib/turn-drain";
import { invalidateRuntimeCapabilities } from "../../apps/manager/src/lib/hermes-client";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";
import "../../apps/manager/src/events/adapters/index";

beforeEach(() => { process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key"; });
afterEach(() => {
  invalidateRuntimeCapabilities({ runtime_endpoint_id: "rt_1" });
  vi.restoreAllMocks();
});

const webActive = () => makeFakeDb({
  channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
}, { uniques: SCHEMA_UNIQUES });

describe("run_id correlation", () => {
  it("threads one run_id from ingress through delivery for a deliver_only event", async () => {
    const db = webActive();
    await ingestEvent(db.asClient(), {
      source: "stripe",
      payload: { account_id: "acct_1", employee_id: "emp_1", stripe_event_id: "evt_1", event_type: EVENT_TYPES.stripeInvoicePaid, deposit_amount: 25000 },
    });
    expect(db.tables.work_runs).toHaveLength(1);
    const runId = db.tables.work_runs[0].id;
    expect(db.tables.work_runs[0].trigger_type).toBe("provider_event");
    expect(db.tables.work_runs[0].status).toBe("succeeded");
    expect(db.tables.work_runs[0].finished_at).toBeTruthy();
    expect(db.tables.inbound_events[0].run_id).toBe(runId);
    expect(db.tables.delivery_decisions[0].run_id).toBe(runId);
    expect(db.tables.meter_events.some((m) => m.run_id === runId && m.feature_key === EVENT_TYPES.stripeInvoicePaid)).toBe(true);
  });

  it("threads the same run_id through a wake chain (ingress -> wake -> deliver)", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "sess_1" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { runs: true, session_key: true } } },
      { match: "/v1/runs", body: { run_id: "hrun_1", status: "succeeded", output: "```json\n{\"move\":\"notify\",\"title\":\"Replied\",\"summary\":\"Jane replied.\"}\n```" } },
      { match: "/chat", body: { text: "```json\n{\"move\":\"notify\",\"title\":\"Replied\",\"summary\":\"Jane replied.\"}\n```" } },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));
    await ingestEvent(db.asClient(), {
      source: "gmail",
      payload: { account_id: "acct_1", employee_id: "emp_1", message_id: "gmsg_1", thread_id: "thr_1", from: "jane@x.com", snippet: "ok" },
    });
    const runId = db.tables.work_runs[0].id;
    expect(db.tables.work_runs[0].status).toBe("succeeded");
    expect(db.tables.work_runs[0].runtime_provider).toBe("hermes");
    expect(db.tables.work_runs[0].external_runtime_run_id).toBe("hrun_1");
    expect(db.tables.work_runs[0].finished_at).toBeTruthy();
    expect(db.tables.inbound_events[0].run_id).toBe(runId);
    expect(db.tables.employee_turn_jobs[0].run_id).toBe(runId);
    expect(db.tables.tool_invocations.some((t) => t.run_id === runId && t.tool_name === "wake_employee")).toBe(true);
    expect(db.tables.delivery_decisions[0].run_id).toBe(runId);
  });

  it("finishes ingress-owned runs as failed when delivery routes to repair", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    await ingestEvent(db.asClient(), {
      source: "manager",
      payload: {
        account_id: "acct_1", employee_id: "emp_1", event_type: "manager.custom",
        idempotency_key: "manager.custom:repair", safe_summary: "Repair me.",
        normalized_payload: { ok: true },
        routing_mode: "wake_employee",
      },
    });
    expect(db.tables.work_runs).toHaveLength(1);
    expect(db.tables.work_runs[0].status).toBe("failed");
    expect(db.tables.work_runs[0].finished_at).toBeTruthy();
  });

  it("opens and finishes its own run for a direct internal delivery", async () => {
    const db = webActive();
    await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", event_type: "manager.reminder_due", provider_id: "rem_1",
      idempotency_key: "reminder_due:rem_1", safe_summary: "Reminder.", actor: "scheduler",
      work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Reminder", summary: "Job tomorrow." },
    });
    expect(db.tables.work_runs).toHaveLength(1);
    expect(db.tables.work_runs[0].trigger_type).toBe("scheduled_job");
    expect(db.tables.work_runs[0].status).toBe("succeeded"); // finished because it owned the run
    expect(db.tables.inbound_events[0].run_id).toBe(db.tables.work_runs[0].id);
  });

  it("finishes direct-owned runs on duplicate and triage repair early returns", async () => {
    const db = webActive();
    const base = {
      account_id: "acct_1", employee_id: "emp_1", event_type: "manager.reminder_due",
      provider_id: "rem_1", idempotency_key: "reminder_due:duplicate",
      safe_summary: "Reminder.", actor: "scheduler" as const,
      work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify" as const, title: "Reminder", summary: "Job tomorrow." },
    };
    await deliverEmployeeEvent(db.asClient(), base);
    await deliverEmployeeEvent(db.asClient(), base);
    expect(db.tables.work_runs).toHaveLength(2);
    expect(db.tables.work_runs[1].status).toBe("succeeded");
    expect(db.tables.work_runs[1].finished_at).toBeTruthy();

    await deliverEmployeeEvent(db.asClient(), {
      account_id: "acct_1", employee_id: "", event_type: "manager.bad_event",
      provider_id: "bad_1", idempotency_key: "manager.bad_event:1",
      safe_summary: "Missing employee.", actor: "manager",
    });
    expect(db.tables.work_runs[2].status).toBe("failed");
    expect(db.tables.work_runs[2].finished_at).toBeTruthy();
  });

  it("keeps queued owner-message runs open until the drain closes them", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "sess_1" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
      employee_turn_locks: [{ employee_id: "emp_1", job_id: "turn_busy", lease_token: "held", lease_expires_at: new Date(Date.now() + 60_000).toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });

    const queued = await deliverOwnerTurnToRuntime(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      body: "Can you do Tuesday?",
      channel: "web",
      idempotency_key: "web:queued:1",
    });
    expect(queued.status).toBe("queued");
    const runId = queued.run_id;
    expect(db.tables.work_runs[0]).toMatchObject({ id: runId, status: "started" });
    expect(db.tables.work_runs[0].finished_at).toBeUndefined();

    db.tables.employee_turn_locks = [];
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", body: { text: "Tuesday works." } },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));
    await drainQueuedTurns(db.asClient(), { limit: 1 });

    expect(db.tables.work_runs[0].status).toBe("succeeded");
    expect(db.tables.work_runs[0].finished_at).toBeTruthy();
    expect(db.tables.delivery_decisions[0].run_id).toBe(runId);
  });
});
