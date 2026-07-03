/**
 * Twilio X-Twilio-Signature validation — THE security boundary for inbound SMS
 * (10-security-ops-observability.md; product-ai-employee-context.md "security boundary").
 * The phone allowlist trusts the spoofable `From`; the signature proves the request
 * genuinely came through AMTECH's Twilio account.
 *
 * Algorithm (Twilio): take the full request URL, append each POST param as
 * key+value sorted by key, HMAC-SHA1 with the auth token, base64-encode, and
 * compare (constant-time) to the X-Twilio-Signature header.
 *
 * Implemented from primitives (no SDK) so it is unit-testable offline.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function expectedTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): string {
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  return createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export interface SignatureCheckOptions {
  /** Local-debug ONLY. When true, validation is skipped. Never set outside local. */
  insecureNoSignature?: boolean;
}

/**
 * Returns true iff the signature header matches. The `url` MUST be the exact
 * public URL Twilio signed (SMS_WEBHOOK_BASE_URL / tunnel URL), not the internal
 * URL behind Caddy.
 */
export function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  headerSignature: string | undefined | null,
  opts: SignatureCheckOptions = {},
): boolean {
  if (opts.insecureNoSignature) return true; // local debug escape hatch only
  if (!headerSignature) return false;
  const expected = expectedTwilioSignature(authToken, url, params);
  return safeEqual(expected, headerSignature);
}
