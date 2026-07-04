import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drainQueuedTurns } from "../../apps/manager/src/lib/turn-drain";
import { invalidateRuntimeCapabilities } from "../../apps/manager/src/lib/hermes-client";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

let smsBodies: string[] = [];

beforeEach(() => {
  smsBodies = [];
  process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  process.env.TWILIO_AUTH_TOKEN = "tok";
  process.env.NODE_ENV = "test";
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  vi.stubGlobal("fetch", vi.fn(async (url: unknown, init: any) => {
    const u = String(url);
    if (u.includes("Messages.json")) {
      smsBodies.push(new URLSearchParams(String(init?.body ?? "")).get("Body") ?? "");
      return new Response(JSON.stringify({ sid: "SM1", status: "queued" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (u.includes("/v1/capabilities")) return new Response(JSON.stringify({ features: { session_chat: true } }), { status: 200, headers: { "Content-Type": "application/json" } });
    if (u.includes("/chat")) return new Response(JSON.stringify({ text: "Sure, Tuesday works." }), { status: 200, headers: { "Content-Type": "application/json" } });
    if (u.includes("/api/sessions")) return new Response(JSON.stringify({ id: "sess_1" }), { status: 200, headers: { "Content-Type": "application/json" } });
    throw new Error(`no mock route for ${u}`);
  }));
});
afterEach(() => {
  invalidateRuntimeCapabilities({ runtime_endpoint_id: "rt_1" });
  vi.restoreAllMocks();
});

const queuedTurn = (over: Record<string, any> = {}) => ({
  id: "turn_q", account_id: "acct_1", employee_id: "emp_1", kind: "owner_sms_chat",
  idempotency_key: "twilio:SMx", status: "queued", input: { body: "Can you do Tuesday?", channel: "sms" },
  output: {}, attempts: 0, lease_token: null, lease_expires_at: null, run_id: "run_queued",
  created_at: "2026-07-03T00:00:00.000Z", ...over,
});

const drainDb = (jobs: Record<string, any>[]) => makeFakeDb({
  employees: [{ id: "emp_1", account_id: "acct_1" }],
  work_runs: [{ id: "run_queued", account_id: "acct_1", employee_id: "emp_1", trigger_type: "owner_message", status: "started" }],
  employee_turn_jobs: jobs,
  runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "sess_1", sms_number_e164: "+15559990000" }],
  runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
  verified_phones: [{ account_id: "acct_1", phone_e164: "+15550001111", verified_at: new Date().toISOString() }],
}, { uniques: SCHEMA_UNIQUES });

describe("turn-drain drainQueuedTurns", () => {
  it("returns nothing when the queue is empty", async () => {
    expect(await drainQueuedTurns(drainDb([]).asClient())).toEqual([]);
  });

  it("executes a queued owner turn and delivers the reply via the router", async () => {
    const db = drainDb([queuedTurn()]);
    const results = await drainQueuedTurns(db.asClient());
    expect(results).toEqual([{ job_id: "turn_q", employee_id: "emp_1", status: "delivered" }]);
    expect(db.tables.employee_turn_jobs[0].status).toBe("succeeded");
    expect(db.tables.employee_turn_jobs[0].output).toMatchObject({ reply: "Sure, Tuesday works." });
    expect(db.tables.employee_turn_jobs[0].output.message_id).toMatch(/^msg_/);
    expect(db.tables.employee_messages).toHaveLength(1);
    expect(db.tables.employee_messages[0]).toMatchObject({
      employee_id: "emp_1",
      direction: "to_owner",
      source: "employee",
      channel: "sms",
      body: "Sure, Tuesday works.",
      status: "delivered",
      provider_id: "SM1",
    });
    expect(db.tables.delivery_decisions[0].reason).toBe("ambient_sms");
    expect(db.tables.delivery_decisions[0].run_id).toBe("run_queued");
    expect(db.tables.delivery_decisions[0].proof.message_id).toBe(db.tables.employee_messages[0].id);
    expect(smsBodies[0]).toBe("Sure, Tuesday works.");
    expect(db.tables.employee_turn_locks ?? []).toHaveLength(0);
    expect(db.tables.work_runs[0].status).toBe("succeeded");
    expect(db.tables.work_runs[0].finished_at).toBeTruthy();
    expect(db.tables.tool_invocations.some((t) => t.run_id === "run_queued" && t.tool_name === "drain_owner_turn")).toBe(true);
  });

  it("fails a stale queued event-wake closed instead of re-running it without context", async () => {
    const db = drainDb([queuedTurn({ id: "turn_ev", kind: "employee_event_wake", idempotency_key: "wake:evt_1" })]);
    const results = await drainQueuedTurns(db.asClient());
    expect(results[0]).toEqual({ job_id: "turn_ev", employee_id: "emp_1", status: "skipped" });
    expect(db.tables.employee_turn_jobs[0].status).toBe("failed");
    expect(db.tables.employee_turn_jobs[0].error).toBe("event_wake_not_drainable");
    expect(db.tables.work_runs[0].status).toBe("failed");
    expect(smsBodies).toHaveLength(0);
  });

  it("stops at the limit", async () => {
    const db = drainDb([queuedTurn({ id: "t1", idempotency_key: "k1", created_at: "2026-07-03T00:00:00Z" }), queuedTurn({ id: "t2", idempotency_key: "k2", created_at: "2026-07-03T00:00:01Z" })]);
    const results = await drainQueuedTurns(db.asClient(), { limit: 1 });
    expect(results).toHaveLength(1);
    expect(db.tables.employee_turn_jobs.find((j) => j.status === "queued")).toBeTruthy();
  });
});
