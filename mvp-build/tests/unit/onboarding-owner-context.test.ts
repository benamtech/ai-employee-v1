import { createHmac } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeSupabase, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

function hash(token: string): string {
  return createHmac("sha256", process.env.SIGNING_SECRET!).update(token).digest("hex");
}

function headers() {
  return {
    Authorization: "Bearer test-internal",
    "Content-Type": "application/json",
  };
}

describe("onboarding owner context", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal";
    process.env.SIGNING_SECRET = "test-signing-secret-for-owner-context";
    state.db = makeFakeDb({
      accounts: [{ id: "acct_1", display_name: "Smith Painting", timezone: "America/New_York" }],
      users: [{ id: "user_1", email: "owner@example.com", full_name: "Sam Smith" }],
      owner_web_sessions: [{
        id: "ows_1",
        account_id: "acct_1",
        user_id: "user_1",
        token_hash: hash("owner-token"),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }],
      verified_phones: [{
        id: "phone_1",
        account_id: "acct_1",
        phone_e164: "+18058869173",
        verification_method: "twilio_verify",
        consent_channel: "web",
        verified_at: "2026-07-16T10:00:00.000Z",
      }],
      onboarding_sessions: [{
        id: "onb_1",
        state: "collecting",
        manifest_draft: {
          business_display_name: "Smith Painting",
          business_kind: "painting",
          top_workflows: ["estimates"],
        },
      }],
    }, { uniques: SCHEMA_UNIQUES });
  });

  it("requires a valid owner session", async () => {
    const res = await buildApp().request("/manager/onboarding/owner-context", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ owner_session_token: "bad-token", session_id: "onb_1" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "owner_session_invalid" });
  });

  it("attaches account and existing verified phone to a new onboarding session", async () => {
    const res = await buildApp().request("/manager/onboarding/owner-context", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ owner_session_token: "owner-token", session_id: "onb_1" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.account.id).toBe("acct_1");
    expect(json.verified_phone.phone_e164).toBe("+18058869173");
    expect(state.db!.tables.onboarding_sessions[0]).toMatchObject({
      account_id: "acct_1",
      manifest_draft: {
        account_id: "acct_1",
        owner_email: "owner@example.com",
        verified_phone_ref: "phone_1",
        verified_phone_e164: "+18058869173",
        verification_method: "twilio_verify",
        consent_channel: "web",
      },
    });
  });

  it("dashboard remains scoped to the owner account", async () => {
    state.db!.tables.employees = [
      { id: "emp_1", account_id: "acct_1", name: "Avery", status: "live", created_at: "2026-07-16T10:01:00.000Z" },
      { id: "emp_2", account_id: "acct_2", name: "Other", status: "live", created_at: "2026-07-16T10:02:00.000Z" },
    ];
    const res = await buildApp().request("/manager/owner/dashboard", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ owner_session_token: "owner-token" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.employees.map((employee: { id: string }) => employee.id)).toEqual(["emp_1"]);
  });
});
