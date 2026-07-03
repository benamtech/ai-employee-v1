#!/usr/bin/env node
/**
 * Acceptance Run 8 — Security: forged-request denial (doc 03 §8), LIVE probe.
 * Sends genuinely forged requests to the DEPLOYED Manager and asserts they are
 * rejected. This is real (not faked): a forged Twilio signature must 403; a forged
 * Stripe signature must 4xx; a 200 here is a SECURITY FAILURE.
 *
 * The deterministic, always-runnable boundary proof (no server needed) is the unit
 * test tests/unit/forged-requests.test.ts (`npm run test:unit`).
 */
import { runById, runnability, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(8);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const base = String(process.env.MANAGER_BASE_URL).replace(/\/$/, "");
  const proofs = {};
  const fails = [];

  // 1. Forged Twilio signature -> must be 403.
  try {
    const res = await fetch(`${base}/webhooks/twilio/frontdoor`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Twilio-Signature": "forged-not-a-real-signature" },
      body: new URLSearchParams({ From: "+15555550100", Body: "probe", MessageSid: "SMforged" }).toString(),
    });
    if (res.status === 403) proofs.twilio_forged = "denied (403)";
    else if (res.status === 200) fails.push(`SECURITY FAILURE: forged Twilio request ACCEPTED (200) at ${base}`);
    else fails.push(`forged Twilio request returned ${res.status} (expected 403; 500 => server TWILIO_AUTH_TOKEN unset)`);
  } catch (e) {
    fails.push(`manager unreachable for Twilio probe: ${e.message}`);
  }

  // 2. Forged Stripe signature -> must be 4xx (not 200).
  try {
    const res = await fetch(`${base}/webhooks/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=deadbeefdeadbeef" },
      body: JSON.stringify({ id: "evt_forged", type: "invoice.paid" }),
    });
    if (res.status >= 400 && res.status < 500 && res.status !== 503) proofs.stripe_forged = `denied (${res.status})`;
    else if (res.status === 200) fails.push(`SECURITY FAILURE: forged Stripe webhook ACCEPTED (200) at ${base}`);
    else if (res.status === 503) fails.push("forged Stripe webhook returned 503 (server STRIPE_WEBHOOK_SECRET unset)");
    else fails.push(`forged Stripe webhook returned ${res.status} (expected 4xx denial)`);
  } catch (e) {
    fails.push(`manager unreachable for Stripe probe: ${e.message}`);
  }

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, {
    proofs,
    notes: [
      ...fails.map((f) => `issue: ${f}`),
      "Deterministic boundary proof (offline): `npm run test:unit` -> tests/unit/forged-requests.test.ts.",
      "Live OIDC Pub/Sub + cross-account artifact denial: env-gated tests/integration/security-live.test.ts.",
    ],
  });
}

await runMain(import.meta.url, verify);
