import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { expectedTwilioSignature } from "../../apps/manager/src/lib/signature";
import { sendSms } from "../../apps/manager/src/lib/twilio";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

const AUTH = "test-twilio-auth-token";
const STATUS_URL = "https://example.test/webhooks/twilio/status";

describe("twilio delivery-status callback", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal-token";
    process.env.TWILIO_AUTH_TOKEN = AUTH;
    process.env.SMS_WEBHOOK_BASE_URL = "https://example.test/webhooks/twilio";
    process.env.SIGNING_SECRET = "unit-test-signing-secret-123456789";
    delete process.env.SMS_INSECURE_NO_SIGNATURE;
    state.db = makeFakeDb({
      employee_messages: [{ id: "msg_1", employee_id: "emp_1", provider_id: "SM123", status: "sent" }],
    });
  });

  afterEach(() => {
    delete process.env.MANAGER_INTERNAL_TOKEN;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.SMS_WEBHOOK_BASE_URL;
    delete process.env.SIGNING_SECRET;
    state.db = null;
  });

  function post(params: Record<string, string>, sig: string) {
    return buildApp().request("/webhooks/twilio/status", {
      method: "POST",
      headers: { "X-Twilio-Signature": sig, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
  }

  it("updates the message status on a validly signed callback", async () => {
    const params = { MessageSid: "SM123", MessageStatus: "delivered" };
    const sig = expectedTwilioSignature(AUTH, STATUS_URL, params);
    const res = await post(params, sig);
    expect(res.status).toBe(200);
    expect(state.db!.tables.employee_messages![0].status).toBe("delivered");
  });

  it("rejects a forged signature (403) and leaves the message untouched", async () => {
    const res = await post({ MessageSid: "SM123", MessageStatus: "failed" }, "forged-signature");
    expect(res.status).toBe(403);
    expect(state.db!.tables.employee_messages![0].status).toBe("sent");
  });

  it("sendSms subscribes to the delivery-status callback derived from SMS_WEBHOOK_BASE_URL", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    let captured: URLSearchParams | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init: any) => {
      captured = new URLSearchParams(String(init?.body ?? ""));
      return new Response(JSON.stringify({ sid: "SM1", status: "queued" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    await sendSms({ to: "+15550001111", from: "+15559990000", body: "hi", forceFrom: true });
    expect(captured!.get("StatusCallback")).toBe("https://example.test/webhooks/twilio/status");
    vi.restoreAllMocks();
    delete process.env.TWILIO_ACCOUNT_SID;
  });
});
