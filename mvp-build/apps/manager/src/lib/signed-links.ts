/**
 * HMAC signed tokens — two consumers:
 *   1. Single-use claim links for the SMS front door (Phase 1): inbound SMS proves
 *      phone ownership; we mint `/claim?t=<token>` to finish account setup on web.
 *   2. Signed artifact links (Phase 2): owner-safe links to ./output artifacts;
 *      `tokenHash()` is what gets stored in artifact_links.token_hash (never the raw).
 *
 * Built in Phase 0 as a shared seam so both flows just call it.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function key(): string {
  const k = process.env.SIGNING_SECRET;
  if (!k || k.length < 16) throw new Error("SIGNING_SECRET missing or too short.");
  return k;
}

export type SignedPurpose = "claim_link" | "artifact_link";

export interface SignedPayload {
  purpose: SignedPurpose;
  subject: string; // e.g. phone_e164 for claim, artifact_id for artifact
  jti: string; // unique id, enables single-use tracking by the caller
  exp: number;
  extra?: Record<string, string>;
}

export function mintSignedToken(
  purpose: SignedPurpose,
  subject: string,
  ttlSeconds: number,
  extra?: Record<string, string>,
): string {
  const payload: SignedPayload = {
    purpose,
    subject,
    jti: createHmac("sha256", key()).update(`${subject}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 24),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...(extra ? { extra } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySignedToken(token: string, purpose: SignedPurpose): SignedPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", key()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedPayload;
  if (payload.purpose !== purpose) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

/** What to store for an artifact link (never store the raw token). */
export function tokenHash(token: string): string {
  return createHmac("sha256", key()).update(token).digest("hex");
}
