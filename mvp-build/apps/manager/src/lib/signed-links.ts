/**
 * HMAC signed tokens — two consumers:
 *   1. Single-use claim links for the SMS front door (Phase 1): inbound SMS proves
 *      phone ownership; we mint `/claim?t=<token>` to finish account setup on web.
 *   2. Signed artifact links (Phase 2): owner-safe links to ./output artifacts;
 *      `tokenHash()` is what gets stored in artifact_links.token_hash (never the raw).
 *
 * Built in Phase 0 as a shared seam so both flows just call it.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function key(): string {
  const k = process.env.SIGNING_SECRET;
  if (!k || k.length < 16) throw new Error("SIGNING_SECRET missing or too short.");
  return k;
}

export type SignedPurpose = "claim_link" | "artifact_link" | "preview_link";

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
    jti: randomBytes(12).toString("hex"), // 24 hex chars, CSPRNG (not Math.random)
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...(extra ? { extra } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Verify signature + purpose (timing-safe) WITHOUT rejecting on expiry, returning
 * the payload plus an `expired` flag. Mirrors how JWT libraries surface a
 * TokenExpiredError distinctly from a signature error, so callers can show an
 * owner-friendly "expired, get a fresh link" path instead of a generic denial.
 * Returns null only for a malformed / forged / wrong-purpose token.
 */
export function decodeSignedToken(token: string, purpose: SignedPurpose): { payload: SignedPayload; expired: boolean } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", key()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: SignedPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedPayload;
  } catch {
    return null;
  }
  if (payload.purpose !== purpose) return null;
  return { payload, expired: payload.exp < Math.floor(Date.now() / 1000) };
}

export function verifySignedToken(token: string, purpose: SignedPurpose): SignedPayload | null {
  const decoded = decodeSignedToken(token, purpose);
  if (!decoded || decoded.expired) return null;
  return decoded.payload;
}

/** What to store for an artifact link (never store the raw token). */
export function tokenHash(token: string): string {
  return createHmac("sha256", key()).update(token).digest("hex");
}

/**
 * Phase 3 signed preview/action link. The token is the auth for a mobile review
 * page: `subject` is the resource id; `extra` binds the account, employee, resource
 * type, and the comma-joined scoped actions so a forged or cross-account token can
 * never widen scope. Reuses the same HMAC as claim/artifact links.
 */
export interface PreviewTokenClaims {
  account_id: string;
  employee_id: string;
  resource_type: string;
  resource_id: string;
  actions: string[];
  ttlSeconds: number;
}

export interface VerifiedPreviewToken {
  account_id: string;
  employee_id: string;
  resource_type: string;
  resource_id: string;
  actions: string[];
  /** True when the signature is valid but the token's `exp` has passed. */
  expired: boolean;
}

export function mintPreviewToken(claims: PreviewTokenClaims): string {
  return mintSignedToken("preview_link", claims.resource_id, claims.ttlSeconds, {
    account_id: claims.account_id,
    employee_id: claims.employee_id,
    resource_type: claims.resource_type,
    actions: claims.actions.join(","),
  });
}

export function verifyPreviewToken(token: string): VerifiedPreviewToken | null {
  const decoded = decodeSignedToken(token, "preview_link");
  const extra = decoded?.payload.extra;
  if (!decoded || !extra?.account_id || !extra.employee_id || !extra.resource_type) return null;
  return {
    account_id: extra.account_id,
    employee_id: extra.employee_id,
    resource_type: extra.resource_type,
    resource_id: decoded.payload.subject,
    actions: extra.actions ? extra.actions.split(",").filter(Boolean) : [],
    expired: decoded.expired,
  };
}
