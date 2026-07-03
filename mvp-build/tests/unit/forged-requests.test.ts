/**
 * Phase 1 acceptance §8 (security) — the deterministic, always-runnable core.
 * Forged/missing provider signatures must be REJECTED at the Manager's HTTP boundary
 * (no creds, no network: in-process via Hono `app.request`). The live forged-request
 * probe against a deployed Manager is infra/scripts/acceptance/run8-security.mjs;
 * live OIDC Pub/Sub + cross-account denial are in tests/integration/security-live.test.ts.
 *
 * These rejection paths short-circuit BEFORE any DB/provider call, so they need only
 * the server-side secrets set (so the verifier runs at all), never live Supabase.
 */
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../apps/manager/src/server";
import { expectedTwilioSignature, validateTwilioSignature } from "../../apps/manager/src/lib/signature";
import { verifyStripeSignature } from "../../apps/manager/src/lib/stripe-signature";
import { mintSignedToken, verifySignedToken } from "../../apps/manager/src/lib/signed-links";

const ENV = {
  TWILIO_AUTH_TOKEN: "test-twilio-auth-token",
  STRIPE_WEBHOOK_SECRET: "whsec_test_secret_value",
  SIGNING_SECRET: "test-signing-secret-32-characters-long",
  SMS_WEBHOOK_BASE_URL: "https://example.test/webhooks/twilio",
};
const saved: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const [k, v] of Object.entries(ENV)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
});
afterAll(() => {
  for (const k of Object.keys(ENV)) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("forged provider requests are denied at the HTTP boundary", () => {
  it("rejects a Twilio webhook with a forged signature (403)", async () => {
    const app = buildApp();
    const res = await app.request("/webhooks/twilio/frontdoor", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": "forged-not-real" },
      body: new URLSearchParams({ From: "+15555550100", Body: "probe", MessageSid: "SMforged" }).toString(),
    });
    expect(res.status).toBe(403);
  });

  it("rejects a Twilio webhook with NO signature header (403)", async () => {
    const app = buildApp();
    const res = await app.request("/webhooks/twilio/frontdoor", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: "+15555550100", Body: "probe" }).toString(),
    });
    expect(res.status).toBe(403);
  });

  it("rejects a Stripe webhook with a forged signature (4xx, not 200)", async () => {
    const app = buildApp();
    const res = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=deadbeefdeadbeef" },
      body: JSON.stringify({ id: "evt_forged", type: "invoice.paid" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.status).not.toBe(200);
  });

  it("rejects a Stripe webhook with NO signature header", async () => {
    const app = buildApp();
    const res = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "evt_forged", type: "invoice.paid" }),
    });
    expect(res.status).not.toBe(200);
  });
});

describe("signature verifiers discriminate valid vs tampered (positive controls)", () => {
  it("Twilio: a correctly computed signature validates; tampered params do not", () => {
    const url = "https://example.test/webhooks/twilio/frontdoor";
    const params = { From: "+15555550100", Body: "hello", MessageSid: "SM1" };
    const sig = expectedTwilioSignature(ENV.TWILIO_AUTH_TOKEN, url, params);
    expect(validateTwilioSignature(ENV.TWILIO_AUTH_TOKEN, url, params, sig)).toBe(true);
    expect(validateTwilioSignature(ENV.TWILIO_AUTH_TOKEN, url, { ...params, Body: "tampered" }, sig)).toBe(false);
    expect(validateTwilioSignature(ENV.TWILIO_AUTH_TOKEN, url, params, undefined)).toBe(false);
  });

  it("Stripe: a correctly signed body verifies; tampered body and stale timestamp do not", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", ENV.STRIPE_WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=${t},v1=${v1}`, ENV.STRIPE_WEBHOOK_SECRET).ok).toBe(true);
    expect(verifyStripeSignature(payload + "x", `t=${t},v1=${v1}`, ENV.STRIPE_WEBHOOK_SECRET).ok).toBe(false);
    const oldT = t - 10_000;
    const oldV1 = createHmac("sha256", ENV.STRIPE_WEBHOOK_SECRET).update(`${oldT}.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=${oldT},v1=${oldV1}`, ENV.STRIPE_WEBHOOK_SECRET).ok).toBe(false);
  });

  it("Signed links: a valid token round-trips; tampered/wrong-purpose tokens are rejected", () => {
    const token = mintSignedToken("artifact_link", "art_123", 300, { employee_id: "emp_1" });
    expect(verifySignedToken(token, "artifact_link")?.subject).toBe("art_123");
    expect(verifySignedToken(token, "claim_link")).toBeNull();
    const [body] = token.split(".");
    expect(verifySignedToken(`${body}.deadbeef`, "artifact_link")).toBeNull();
  });
});
