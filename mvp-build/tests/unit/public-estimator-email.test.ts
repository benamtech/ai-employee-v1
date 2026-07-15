import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import { sendResendEmail } from "../../apps/manager/src/lib/resend-client";
import { sendPublicEstimatorDraftEmail } from "../../apps/manager/src/lib/public-estimator-email";

function setEmailEnv() {
  process.env.RESEND_API_KEY = "re_test";
  process.env.PUBLIC_ESTIMATOR_EMAIL_ENABLED = "1";
  process.env.PUBLIC_ESTIMATOR_FROM_EMAIL = "AMTECH <estimates@mail.amtechleads.com>";
  process.env.PUBLIC_ESTIMATOR_REPLY_TO = "ben@amtechleads.com";
  process.env.PUBLIC_ESTIMATOR_SENDING_DOMAIN = "mail.amtechleads.com";
}

describe("public estimator Resend wrapper", () => {
  beforeEach(() => {
    setEmailEnv();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.PUBLIC_ESTIMATOR_EMAIL_ENABLED;
    delete process.env.PUBLIC_ESTIMATOR_FROM_EMAIL;
    delete process.env.PUBLIC_ESTIMATOR_REPLY_TO;
    delete process.env.PUBLIC_ESTIMATOR_SENDING_DOMAIN;
  });

  const input = {
    from: "AMTECH <estimates@mail.amtechleads.com>",
    to: "owner@example.com",
    reply_to: "ben@amtechleads.com",
    subject: "Draft",
    html: "<p>Draft</p>",
    text: "Draft",
    idempotency_key: "idem_1",
  };

  it("sends with Resend idempotency headers and returns provider id", async () => {
    const calls: RequestInit[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init: RequestInit = {}) => {
      calls.push(init);
      return new Response(JSON.stringify({ id: "eml_123" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    const result = await sendResendEmail(input);
    expect(result).toMatchObject({ ok: true, provider_message_id: "eml_123", provider_status: 200 });
    expect(new Headers(calls[0].headers).get("Idempotency-Key")).toBe("idem_1");
  });

  it("fails closed when env is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendResendEmail(input);
    expect(result.ok).toBe(false);
    expect(result.error_code).toBe("resend_api_key_missing");
  });

  it("normalizes validation, rate-limit, idempotency, and 5xx errors", async () => {
    for (const [status, name] of [[422, "validation_error"], [429, "rate_limit_exceeded"], [409, "invalid_idempotent_request"], [503, "server_error"]] as const) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ name, message: `${name} happened` }), { status, headers: { "Content-Type": "application/json" } })));
      const result = await sendResendEmail(input);
      expect(result.ok).toBe(false);
      expect(result.provider_status).toBe(status);
      expect(result.error_code).toBe(name);
    }
  });
});

describe("public estimator email service", () => {
  beforeEach(() => {
    setEmailEnv();
    process.env.SIGNING_SECRET = "unit-test-signing-secret-123";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SIGNING_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.PUBLIC_ESTIMATOR_EMAIL_ENABLED;
    delete process.env.PUBLIC_ESTIMATOR_FROM_EMAIL;
    delete process.env.PUBLIC_ESTIMATOR_REPLY_TO;
    delete process.env.PUBLIC_ESTIMATOR_SENDING_DOMAIN;
  });

  function dbWithDraft() {
    return makeFakeDb({
      public_estimator_sessions: [],
      public_estimator_artifacts: [{
        id: "peart_1",
        visitor_session_id: "pes_1",
        account_id: "acct_1",
        employee_id: "emp_1",
        artifact_id: "art_1",
        status: "current",
        created_at: new Date().toISOString(),
      }],
      public_estimator_events: [],
      public_estimator_email_sends: [],
      artifacts: [{
        id: "art_1",
        account_id: "acct_1",
        employee_id: "emp_1",
        kind: "estimate",
        payload: { job_description: "Kitchen", line_items: [{ description: "Paint", amount: 1200 }], recommended_total: 1200 },
        created_at: new Date().toISOString(),
      }],
    }, { uniques: SCHEMA_UNIQUES });
  }

  const session = {
    id: "pes_1",
    account_id: "acct_1",
    employee_id: "emp_1",
    visitor_token_hash: "hash",
    transcript_session_id: "pubest:pes_1",
    memory_session_key: "amtech:v1:public-estimator:employee:emp_1:visitor:pes_1",
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  };

  it("refuses sends without a current draft", async () => {
    const db = makeFakeDb({ public_estimator_events: [], public_estimator_artifacts: [] });
    const result = await sendPublicEstimatorDraftEmail(db.asClient(), { ...session }, "owner@example.com");
    expect(result).toMatchObject({ status: "failed", safe_reason: "draft_missing" });
  });

  it("only sends to the visitor email stored on the session", async () => {
    const db = dbWithDraft();
    const result = await sendPublicEstimatorDraftEmail(db.asClient(), { ...session, visitor_email: "owner@example.com" }, "other@example.com");
    expect(result).toMatchObject({ status: "failed", safe_reason: "recipient_mismatch" });
    expect(db.tables.public_estimator_email_sends ?? []).toHaveLength(0);
  });

  it("persists provider success and idempotent duplicate attempts", async () => {
    const db = dbWithDraft();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "eml_1" }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const first = await sendPublicEstimatorDraftEmail(db.asClient(), { ...session }, "owner@example.com");
    const second = await sendPublicEstimatorDraftEmail(db.asClient(), { ...session, visitor_email: "owner@example.com" }, "owner@example.com");
    expect(first).toMatchObject({ status: "sent", provider_message_id: "eml_1" });
    expect(second).toMatchObject({ status: "duplicate", provider_message_id: "eml_1" });
    expect(db.tables.public_estimator_email_sends).toHaveLength(1);
    expect(db.tables.public_estimator_events!.some((e) => e.event_type === "email_sent")).toBe(true);
  });
});
