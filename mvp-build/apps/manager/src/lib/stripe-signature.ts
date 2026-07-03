/**
 * Stripe webhook signature verification (10-security-ops-observability.md: "verify
 * Stripe webhooks with raw body plus Stripe-Signature"). Implements Stripe's scheme
 * — header `t=<unix>,v1=<hmacSHA256(t + "." + rawBody, endpointSecret)>` (possibly
 * multiple v1 values) — without the Stripe SDK. Always verify against the RAW body.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface StripeSignatureResult {
  ok: boolean;
  reason?: string;
}

export function verifyStripeSignature(
  payload: string,
  sigHeader: string | undefined | null,
  secret: string,
  toleranceSec = 300,
): StripeSignatureResult {
  if (!sigHeader) return { ok: false, reason: "missing_signature" };
  if (!secret) return { ok: false, reason: "missing_secret" };

  let t: string | undefined;
  const v1s: string[] = [];
  for (const part of sigHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1s.push(v);
  }
  if (!t || v1s.length === 0) return { ok: false, reason: "malformed_signature" };

  const ts = Number(t);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return { ok: false, reason: "timestamp_out_of_tolerance" };

  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const matched = v1s.some((v) => {
    const got = Buffer.from(v);
    return got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf);
  });
  return matched ? { ok: true } : { ok: false, reason: "signature_mismatch" };
}
