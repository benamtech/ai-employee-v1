import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routeEmployeeIntent, stampChannelPresence } from "../../apps/manager/src/lib/channel-router";
import { renderWorkEventSms, type WorkEventDescriptor } from "@amtech/shared";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

const nowIso = () => new Date().toISOString();
const oldIso = () => new Date(Date.now() - 10 * 60_000).toISOString();

let smsBodies: string[] = [];

beforeEach(() => {
  smsBodies = [];
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  process.env.TWILIO_AUTH_TOKEN = "tok";
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.TWILIO_TEST_NUMBER;
  process.env.NODE_ENV = "test";
  vi.stubGlobal("fetch", vi.fn(async (url: unknown, init: any) => {
    const u = String(url);
    if (u.includes("Messages.json")) {
      smsBodies.push(new URLSearchParams(String(init?.body ?? "")).get("Body") ?? "");
      return new Response(JSON.stringify({ sid: "SM1", status: "queued" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error(`no mock route for ${u}`);
  }));
});
afterEach(() => vi.restoreAllMocks());

const descriptor: WorkEventDescriptor = { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Update", summary: "Job is on track." };
const intent = (over: Partial<Parameters<typeof routeEmployeeIntent>[1]> = {}) => ({
  account_id: "acct_1", employee_id: "emp_1", intent_key: "i1", move: "notify" as const,
  text: "Update: Job is on track.", descriptor, ...over,
});

const webActiveDb = () => makeFakeDb({
  channel_sessions: [{ id: "chs_1", employee_id: "emp_1", account_id: "acct_1", channel: "web", last_seen_at: nowIso() }],
  employee_messages: [{ id: "msg_1", employee_id: "emp_1", channel: "web", status: "pending" }],
}, { uniques: SCHEMA_UNIQUES });

const smsDb = () => makeFakeDb({
  channel_sessions: [{ id: "chs_1", employee_id: "emp_1", account_id: "acct_1", channel: "web", last_seen_at: oldIso() }],
  verified_phones: [{ account_id: "acct_1", phone_e164: "+15550001111", verified_at: nowIso() }],
  runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", sms_number_e164: "+15559990000" }],
  employee_messages: [{ id: "msg_1", employee_id: "emp_1", channel: "web", status: "pending" }],
}, { uniques: SCHEMA_UNIQUES });

describe("channel-router routeEmployeeIntent", () => {
  it("delivers to web when a web session is active", async () => {
    const db = webActiveDb();
    const res = await routeEmployeeIntent(db.asClient(), intent({ message_id: "msg_1" }));
    expect(res.chosen_channel).toBe("web");
    expect(res.delivery_status).toBe("delivered");
    expect(db.tables.employee_messages[0].status).toBe("delivered");
    expect(db.tables.delivery_decisions[0].reason).toBe("active_web_session");
    expect(smsBodies).toHaveLength(0);
  });

  it("falls back to SMS when web presence is stale", async () => {
    const db = smsDb();
    const res = await routeEmployeeIntent(db.asClient(), intent({ message_id: "msg_1" }));
    expect(res.chosen_channel).toBe("sms");
    expect(res.sms_sid).toBe("SM1");
    expect(res.delivery_status).toBe("delivered");
    expect(db.tables.delivery_decisions[0].reason).toBe("ambient_sms");
    // The persisted message must reflect how it was actually delivered.
    expect(db.tables.employee_messages[0].channel).toBe("sms");
  });

  it("renders the SMS body from the same descriptor (one descriptor, both surfaces)", async () => {
    await routeEmployeeIntent(smsDb().asClient(), intent({ message_id: "msg_1" }));
    expect(smsBodies[0]).toBe(renderWorkEventSms(descriptor));
  });

  it("records a silent intent as delivered to no channel", async () => {
    const db = smsDb();
    const res = await routeEmployeeIntent(db.asClient(), intent({ move: "silent", message_id: "msg_1" }));
    expect(res.chosen_channel).toBe("none");
    expect(db.tables.delivery_decisions[0].reason).toBe("silent");
    expect(smsBodies).toHaveLength(0);
  });

  it("does not throw when the owner phone is missing", async () => {
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: oldIso() }],
    }, { uniques: SCHEMA_UNIQUES });
    const res = await routeEmployeeIntent(db.asClient(), intent());
    expect(res.chosen_channel).toBe("sms");
    expect(res.delivery_status).toBe("pending");
    expect(db.tables.delivery_decisions[0].reason).toBe("missing_owner_phone");
  });

  it("records sms_failed and stays pending when the send throws", async () => {
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: oldIso() }],
      verified_phones: [{ account_id: "acct_1", phone_e164: "+15550001111", verified_at: nowIso() }],
      // no runtime_endpoints.sms_number_e164 -> resolveEmployeeSmsSender throws
    }, { uniques: SCHEMA_UNIQUES });
    const res = await routeEmployeeIntent(db.asClient(), intent());
    expect(res.delivery_status).toBe("pending");
    expect(db.tables.delivery_decisions[0].reason).toBe("sms_failed");
  });

  it("returns duplicate on a repeated intent key", async () => {
    const db = smsDb();
    await routeEmployeeIntent(db.asClient(), intent({ message_id: "msg_1" }));
    const dup = await routeEmployeeIntent(db.asClient(), intent({ message_id: "msg_1" }));
    expect(dup.duplicate).toBe(true);
    expect(dup.delivery_status).toBe("duplicate");
  });
});

describe("channel-router stampChannelPresence", () => {
  it("upserts a single presence row per employee+channel", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    await stampChannelPresence(db.asClient(), { account_id: "acct_1", employee_id: "emp_1", channel: "web" });
    await stampChannelPresence(db.asClient(), { account_id: "acct_1", employee_id: "emp_1", channel: "web" });
    expect(db.tables.channel_sessions).toHaveLength(1);
  });
});
