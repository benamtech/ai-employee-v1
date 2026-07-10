import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWorkEventSms, smsGrammarSuffix, type WorkEventDescriptor } from "@amtech/shared";
import { routeEmployeeIntent } from "../../apps/manager/src/lib/channel-router";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

const URL = "https://app.test/agent/emp_1/review?t=tok123";

describe("SMS preview rendering (grammar + link)", () => {
  const base: WorkEventDescriptor = { account_id: "acct_1", employee_id: "emp_1", move: "review", title: "Estimate ready", summary: "$4,200 for Jane's kitchen." };

  it("appends nothing when there is no preview link", () => {
    expect(renderWorkEventSms(base)).toBe("Estimate ready: $4,200 for Jane's kitchen.");
  });

  it("uses review grammar and appends the link", () => {
    const out = renderWorkEventSms({ ...base, preview_url: URL });
    expect(out).toContain("Review and approve here:");
    expect(out.endsWith(URL)).toBe(true);
  });

  it("uses question grammar for a question move", () => {
    const out = renderWorkEventSms({ ...base, move: "question", title: "Quick question", summary: "Is Tuesday ok?", preview_url: URL });
    expect(out).toContain("Open to answer:");
    expect(out).toContain(URL);
  });

  it("uses notify grammar for a notify move", () => {
    const out = renderWorkEventSms({ ...base, move: "notify", preview_url: URL });
    expect(out).toContain("Details:");
  });

  it("smsGrammarSuffix is empty without a link", () => {
    expect(smsGrammarSuffix("review", false)).toBe("");
    expect(smsGrammarSuffix("review", true)).toContain("Review");
  });
});

describe("descriptor -> router SMS parity", () => {
  let smsBodies: string[] = [];
  beforeEach(() => {
    smsBodies = [];
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "tok";
    process.env.NODE_ENV = "test";
    vi.stubGlobal("fetch", vi.fn(async (url: unknown, init: any) => {
      if (String(url).includes("Messages.json")) {
        smsBodies.push(new URLSearchParams(String(init?.body ?? "")).get("Body") ?? "");
        return new Response(JSON.stringify({ sid: "SM1", status: "queued" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      throw new Error(`no mock route for ${url}`);
    }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("sends the identical link-bearing body the persisted message renders", async () => {
    const descriptor: WorkEventDescriptor = { account_id: "acct_1", employee_id: "emp_1", move: "review", title: "Estimate ready", summary: "$4,200 for Jane.", preview_url: URL };
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", account_id: "acct_1", channel: "web", last_seen_at: new Date(Date.now() - 10 * 60_000).toISOString() }],
      verified_phones: [{ account_id: "acct_1", phone_e164: "+15550001111", verified_at: new Date().toISOString() }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", sms_number_e164: "+15559990000" }],
    }, { uniques: SCHEMA_UNIQUES });
    await routeEmployeeIntent(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", intent_key: "i1", move: "review", text: renderWorkEventSms(descriptor), descriptor,
    });
    expect(smsBodies[0]).toBe(renderWorkEventSms(descriptor));
    expect(smsBodies[0]).toContain(URL);
  });
});
