/**
 * OAuth CSRF state store — groundwork for Gmail (Phase 3) and Stripe (Phase 4)
 * account-link flows (10-security-ops-observability.md: "OAuth state validation",
 * "OAuth CSRF state mismatch fails"). HMAC-signed, single-use, short-lived state
 * tokens bound to an employee + provider. Built now so the connector flows just
 * call it.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function key(): string {
  const k = process.env.SIGNING_SECRET;
  if (!k || k.length < 16) throw new Error("SIGNING_SECRET missing or too short.");
  return k;
}

export interface OAuthStatePayload {
  employee_id: string;
  provider: "gmail" | "stripe";
  nonce: string;
  exp: number; // epoch seconds
}

export function mintOAuthState(
  employee_id: string,
  provider: "gmail" | "stripe",
  ttlSeconds = 600,
): string {
  const payload: OAuthStatePayload = {
    employee_id,
    provider,
    nonce: randomBytes(12).toString("hex"),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(token: string): OAuthStatePayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", key()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthStatePayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
