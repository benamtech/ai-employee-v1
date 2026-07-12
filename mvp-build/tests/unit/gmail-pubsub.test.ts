import { createSign, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MANAGER_API } from "@amtech/shared";
import { gmailTools } from "../../apps/manager/src/tools/gmail.stub";
import { decodePubSubPush, verifyPubSubJwt } from "../../apps/manager/src/lib/pubsub";
import { sealTokenBundle } from "../../apps/manager/src/lib/gmail-tokens";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { invalidateRuntimeCapabilities } from "../../apps/manager/src/lib/hermes-client";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

beforeAll(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-master-key-0123456789ab";
  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret";
});
afterEach(() => {
  invalidateRuntimeCapabilities({ runtime_endpoint_id: "rt_1" });
  vi.restoreAllMocks();
  delete process.env.PUBSUB_VERIFICATION_AUDIENCE;
  delete process.env.PUBSUB_REQUIRE_AUTH;
  delete process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL;
  delete process.env.PUBSUB_JWKS_URL;
  state.db = null;
});

describe("Pub/Sub decode + verify", () => {
  it("decodes the push envelope", () => {
    const data = Buffer.from(JSON.stringify({ emailAddress: "shop@gmail.com", historyId: 700 })).toString("base64");
    const push = decodePubSubPush({ message: { data, messageId: "pm_1" } });
    expect(push.email_address).toBe("shop@gmail.com");
    expect(push.history_id).toBe("700");
    expect(push.pubsub_message_id).toBe("pm_1");
  });

  it("rejects a malformed envelope", () => {
    expect(() => decodePubSubPush({ message: {} })).toThrow();
  });

  it("skips verification when unconfigured but fails when auth required", async () => {
    await expect(verifyPubSubJwt(undefined)).resolves.toMatchObject({ ok: true, skipped: true });
    process.env.PUBSUB_REQUIRE_AUTH = "true";
    await expect(verifyPubSubJwt(undefined)).resolves.toMatchObject({ ok: false });
  });

  it("enforces audience when configured", async () => {
    process.env.PUBSUB_VERIFICATION_AUDIENCE = "https://amtech/webhooks/gmail";
    await expect(verifyPubSubJwt("Bearer not-a-jwt")).resolves.toMatchObject({ ok: false });
  });

  it("verifies RS256 signature against JWKS when configured", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "kid_1" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: "https://accounts.google.com",
      aud: "https://amtech/webhooks/gmail",
      email: "pubsub@test.iam.gserviceaccount.com",
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString("base64url");
    const sig = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey).toString("base64url");
    process.env.PUBSUB_VERIFICATION_AUDIENCE = "https://amtech/webhooks/gmail";
    process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL = "pubsub@test.iam.gserviceaccount.com";
    process.env.PUBSUB_JWKS_URL = "https://jwks.test/certs";
    vi.stubGlobal("fetch", routerFetch([{ match: "jwks.test/certs", body: { keys: [{ ...jwk, kid: "kid_1", alg: "RS256" }] } }]));
    await expect(verifyPubSubJwt(`Bearer ${header}.${payload}.${sig}`)).resolves.toMatchObject({ ok: true });
    delete process.env.PUBSUB_JWKS_URL;
    delete process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL;
  });
});

const FUTURE = new Date(Date.now() + 3600_000).toISOString();

function seed(): FakeSupabase {
  return makeFakeDb({
    employees: [{ id: "emp_1", account_id: "acct_1" }],
    connector_accounts: [{ id: "conn_1", account_id: "acct_1", employee_id: "emp_1", connector_key: "email", provider: "gmail", status: "connected", scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"], external_email: "shop@gmail.com", token_secret_ref: sealTokenBundle({ access_token: "at", refresh_token: "rt" }), token_expiry: FUTURE }],
    gmail_watches: [{ id: "watch_1", connector_id: "conn_1", last_history_id: "600", status: "active" }],
    email_threads: [{ id: "thr_1", connector_id: "conn_1", gmail_thread_id: "thr_known", customer_email: "jane@example.com", estimate_artifact_id: "art_1" }],
    runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "amtech-owner-thread" }],
    runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("unit-hermes-key") }],
  });
}

function historyRoutes() {
  return routerFetch([
    { match: "/history?", body: { historyId: "701", history: [{ messagesAdded: [{ message: { id: "m1", threadId: "thr_known" } }, { message: { id: "m2", threadId: "thr_unknown" } }] }] } },
    { match: "/messages/m1", body: { id: "m1", threadId: "thr_known", snippet: "Looks good, deposit is fine", payload: { headers: [{ name: "From", value: "jane@example.com" }] } } },
    { match: "/v1/capabilities", body: { features: { session_chat: true } } },
    { match: "/api/sessions/amtech-owner-thread/chat", body: { text: "```json\n{\"move\":\"question\",\"title\":\"Customer replied\",\"summary\":\"Jane said the deposit is fine.\",\"deliverable\":{\"type\":\"money_movement\",\"title\":\"Deposit invoice\",\"refs\":{\"gmail_message_id\":\"m1\"},\"leaves_business\":true,\"money\":{\"involved\":true},\"reversible\":false,\"acceptance\":[\"approve\",\"edit\",\"reject\",\"respond\"]},\"suggested_next_action\":\"Approve the deposit invoice or tell me how to reply.\"}\n```" } },
    { match: "/api/sessions", body: { id: "amtech-owner-thread" } },
  ]);
}

describe("handle_gmail_pubsub reply pipeline", () => {
  it("processes a reply on a known thread and delivers one employee event", async () => {
    const db = seed();
    vi.stubGlobal("fetch", historyRoutes());
    const res = await gmailTools.handle_gmail_pubsub!({ db: db.asClient(), actor: "manager", account_id: null, employee_id: null }, { email_address: "shop@gmail.com", history_id: "701" });
    expect(res.status).toBe("ok");
    expect(res.proof.processed_count).toBe(1); // only the known thread
    expect(res.proof.delivered_count).toBe(1);
    expect(db.tables.inbound_email_events).toHaveLength(1);
    expect(db.tables.inbound_events).toHaveLength(1);
    expect(db.tables.employee_messages?.[0]?.direction).toBe("to_owner");
    expect(db.tables.inbound_events?.[0]?.normalized_payload.work_event_descriptor.move).toBe("question");
    expect(db.tables.inbound_events?.[0]?.normalized_payload.work_event_descriptor.deliverable.type).toBe("money_movement");
    // watch history id advanced
    expect(db.tables.gmail_watches?.[0]?.last_history_id).toBe("701");
  });

  it("dedupes a redelivered message (Pub/Sub is at-least-once)", async () => {
    const db = seed();
    vi.stubGlobal("fetch", historyRoutes());
    const ctx: ToolContext = { db: db.asClient(), actor: "manager", account_id: null, employee_id: null };
    await gmailTools.handle_gmail_pubsub!(ctx, { email_address: "shop@gmail.com", history_id: "701" });
    const second = await gmailTools.handle_gmail_pubsub!(ctx, { email_address: "shop@gmail.com", history_id: "701" });
    expect(second.proof.processed_count).toBe(0);
    expect(db.tables.inbound_email_events).toHaveLength(1);
  });

  it("fails cleanly when no connector matches the push email", async () => {
    const db = seed();
    vi.stubGlobal("fetch", vi.fn());
    const res = await gmailTools.handle_gmail_pubsub!({ db: db.asClient(), actor: "manager", account_id: null, employee_id: null }, { email_address: "nobody@gmail.com", history_id: "701" });
    expect(res.status).toBe("failed");
  });
});

describe("Gmail Pub/Sub webhook route", () => {
  it("acks handler failures with 204 and records an audit failure", async () => {
    state.db = makeFakeDb({ audit_log: [] });
    const { buildApp } = await import("../../apps/manager/src/server");
    const { TOOL_REGISTRY } = await import("../../apps/manager/src/tools/registry");
    const originalGet = TOOL_REGISTRY.get.bind(TOOL_REGISTRY);
    const throwingHandler = vi.fn(async () => {
      throw new Error("history pipeline failed");
    });
    const getSpy = vi.spyOn(TOOL_REGISTRY, "get").mockImplementation((name) =>
      name === "handle_gmail_pubsub" ? throwingHandler as never : originalGet(name),
    );
    const data = Buffer.from(JSON.stringify({ emailAddress: "shop@gmail.com", historyId: 701 })).toString("base64");

    try {
      const res = await buildApp().request(MANAGER_API.webhooks.gmail, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { data, messageId: "pm_fail" } }),
      });

      expect(res.status).toBe(204);
      expect(throwingHandler).toHaveBeenCalledWith(expect.any(Object), {
        email_address: "shop@gmail.com",
        history_id: "701",
        pubsub_message_id: "pm_fail",
      });
      expect(state.db.tables.audit_log).toHaveLength(1);
      expect(state.db.tables.audit_log?.[0]).toMatchObject({
        action: "gmail_pubsub:handler_failed",
        resource: "shop@gmail.com",
        result: "failed",
      });
    } finally {
      getSpy.mockRestore();
    }
  }, 15_000);
});
