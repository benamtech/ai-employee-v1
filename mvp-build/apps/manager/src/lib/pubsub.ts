/**
 * Gmail Pub/Sub push decoding + authenticity checks (09-event-mesh-v1.md,
 * 10-security-ops-observability.md: "authenticated Pub/Sub push JWTs by issuer,
 * audience, expected service-account email, signature, and expiry").
 *
 * Pub/Sub delivers `{ message: { data: base64(JSON{emailAddress,historyId}), messageId }, subscription }`
 * and (when configured for authenticated push) an OIDC JWT in the Authorization
 * header. `decodePubSubPush` parses the envelope; `verifyPubSubJwt` validates the
 * token claims and, when configured, the RS256 signature against Google's JWKS.
 */
import { createPublicKey, verify as verifySignature } from "node:crypto";

export interface PubSubPush {
  email_address: string;
  history_id: string;
  pubsub_message_id?: string;
}

export function decodePubSubPush(body: unknown): PubSubPush {
  const msg = (body as { message?: { data?: string; messageId?: string; message_id?: string } })?.message;
  if (!msg?.data) throw new Error("pubsub_no_data");
  let decoded: { emailAddress?: string; historyId?: string | number };
  try {
    decoded = JSON.parse(Buffer.from(String(msg.data), "base64").toString("utf8"));
  } catch {
    throw new Error("pubsub_bad_base64");
  }
  if (!decoded?.emailAddress || decoded?.historyId === undefined || decoded?.historyId === null) {
    throw new Error("pubsub_bad_payload");
  }
  return {
    email_address: String(decoded.emailAddress),
    history_id: String(decoded.historyId),
    pubsub_message_id: msg.messageId ?? msg.message_id,
  };
}

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export interface PubSubVerifyResult {
  ok: boolean;
  reason?: string;
  /** True when verification was skipped because it is not configured (dev). */
  skipped?: boolean;
}

interface OidcClaims {
  iss?: string;
  aud?: string;
  email?: string;
  email_verified?: boolean;
  exp?: number;
}

interface JwtHeader {
  alg?: string;
  kid?: string;
}

interface Jwk {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
  x5c?: string[];
}

let jwksCache: { expiresAt: number; keys: Jwk[] } | null = null;

function decodeJwtPart<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function decodeJwtClaims(token: string): OidcClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  return decodeJwtPart<OidcClaims>(parts[1]!);
}

async function getGoogleJwks(): Promise<Jwk[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const url = process.env.PUBSUB_JWKS_URL ?? "https://www.googleapis.com/oauth2/v3/certs";
  const res = await fetch(url);
  if (!res.ok) throw new Error("jwks_fetch_failed");
  const body = await res.json() as { keys?: Jwk[] };
  const maxAge = /max-age=(\d+)/i.exec(res.headers.get("cache-control") ?? "")?.[1];
  jwksCache = {
    expiresAt: Date.now() + (Number(maxAge ?? 3600) * 1000),
    keys: body.keys ?? [],
  };
  return jwksCache.keys;
}

async function verifyJwtSignature(token: string): Promise<PubSubVerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "unparseable_token" };
  const header = decodeJwtPart<JwtHeader>(parts[0]!);
  if (!header?.kid || header.alg !== "RS256") return { ok: false, reason: "bad_jwt_header" };
  const keys = await getGoogleJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return { ok: false, reason: "jwk_not_found" };

  const key = jwk.x5c?.[0]
    ? createPublicKey(`-----BEGIN CERTIFICATE-----\n${jwk.x5c[0]}\n-----END CERTIFICATE-----`)
    : createPublicKey({ key: jwk as any, format: "jwk" });
  const ok = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    key,
    Buffer.from(parts[2]!, "base64url"),
  );
  return ok ? { ok: true } : { ok: false, reason: "signature_mismatch" };
}

/**
 * Verify the OIDC token claims from an authenticated Pub/Sub push. Verification is
 * only enforced when `PUBSUB_VERIFICATION_AUDIENCE` is configured; otherwise it is
 * skipped (dev) unless `PUBSUB_REQUIRE_AUTH=true`, which makes a missing token fail.
 */
export async function verifyPubSubJwt(authHeader: string | undefined | null): Promise<PubSubVerifyResult> {
  const audience = process.env.PUBSUB_VERIFICATION_AUDIENCE;
  const serviceAccount = process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL;
  const requireAuth = process.env.PUBSUB_REQUIRE_AUTH === "true";

  if (!audience) {
    if (process.env.NODE_ENV === "production") return { ok: false, reason: "verification_required_but_unconfigured" };
    if (requireAuth) return { ok: false, reason: "verification_required_but_unconfigured" };
    return { ok: true, skipped: true };
  }
  if (!authHeader?.startsWith("Bearer ")) return { ok: false, reason: "missing_bearer_token" };
  const token = authHeader.slice("Bearer ".length).trim();
  const signature = await verifyJwtSignature(token);
  if (!signature.ok) return signature;
  const claims = decodeJwtClaims(token);
  if (!claims) return { ok: false, reason: "unparseable_token" };
  if (!claims.iss || !GOOGLE_ISSUERS.has(claims.iss)) return { ok: false, reason: "bad_issuer" };
  if (claims.aud !== audience) return { ok: false, reason: "bad_audience" };
  if (serviceAccount && claims.email !== serviceAccount) return { ok: false, reason: "bad_service_account" };
  if (serviceAccount && claims.email_verified === false) return { ok: false, reason: "email_unverified" };
  if (!claims.exp || claims.exp * 1000 <= Date.now()) return { ok: false, reason: "token_expired" };
  return { ok: true };
}
