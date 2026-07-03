import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "../../apps/manager/src/lib/stripe-signature";

const SECRET = "whsec_test_secret";

function sign(payload: string, ts: number, secret = SECRET): string {
  const v1 = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

describe("verifyStripeSignature", () => {
  const payload = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
  const now = Math.floor(Date.now() / 1000);

  it("accepts a valid signature within tolerance", () => {
    expect(verifyStripeSignature(payload, sign(payload, now), SECRET).ok).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const header = sign(payload, now);
    expect(verifyStripeSignature(payload + "x", header, SECRET)).toMatchObject({ ok: false, reason: "signature_mismatch" });
  });

  it("rejects a wrong secret", () => {
    expect(verifyStripeSignature(payload, sign(payload, now, "whsec_other"), SECRET).ok).toBe(false);
  });

  it("rejects an out-of-tolerance timestamp", () => {
    const old = now - 10_000;
    expect(verifyStripeSignature(payload, sign(payload, old), SECRET)).toMatchObject({ ok: false, reason: "timestamp_out_of_tolerance" });
  });

  it("rejects a missing or malformed header", () => {
    expect(verifyStripeSignature(payload, undefined, SECRET).ok).toBe(false);
    expect(verifyStripeSignature(payload, "garbage", SECRET)).toMatchObject({ ok: false, reason: "malformed_signature" });
  });

  it("accepts when one of several v1 signatures matches", () => {
    const good = createHmac("sha256", SECRET).update(`${now}.${payload}`).digest("hex");
    const header = `t=${now},v1=deadbeef,v1=${good}`;
    expect(verifyStripeSignature(payload, header, SECRET).ok).toBe(true);
  });
});
