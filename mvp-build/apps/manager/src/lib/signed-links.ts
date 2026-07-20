/**
 * HMAC signed tokens for claim links, artifact links, and principal-bound preview
 * links. Signed possession is never sufficient by itself; preview consumers must
 * load the durable row and revalidate assignment, resolver principal, policy,
 * snapshot, expiry, revocation, and single-use state.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function key(): string {
  const value = process.env.SIGNING_SECRET;
  if (!value || value.length < 16) throw new Error("SIGNING_SECRET missing or too short.");
  return value;
}

export type SignedPurpose = "claim_link" | "artifact_link" | "preview_link";

export interface SignedPayload {
  purpose: SignedPurpose;
  subject: string;
  jti: string;
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
    jti: randomBytes(12).toString("hex"),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...(extra ? { extra } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", key()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function decodeSignedToken(token: string, purpose: SignedPurpose): { payload: SignedPayload; expired: boolean } | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", key()).update(body).digest("base64url");
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) return null;
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
  return !decoded || decoded.expired ? null : decoded.payload;
}

export function tokenHash(token: string): string {
  return createHmac("sha256", key()).update(token).digest("hex");
}

export interface PreviewTokenClaims {
  account_id: string;
  employee_id: string;
  resource_type: string;
  resource_id: string;
  actions: string[];
  ttlSeconds: number;
  assignment_id?: string | null;
  resolver_principal_id?: string | null;
  policy_version?: string | null;
  approval_snapshot_hash?: string | null;
}

export interface VerifiedPreviewToken {
  account_id: string;
  employee_id: string;
  resource_type: string;
  resource_id: string;
  actions: string[];
  assignment_id: string | null;
  resolver_principal_id: string | null;
  policy_version: string | null;
  approval_snapshot_hash: string | null;
  jti: string;
  expired: boolean;
}

export function mintPreviewToken(claims: PreviewTokenClaims): string {
  return mintSignedToken("preview_link", claims.resource_id, claims.ttlSeconds, {
    account_id: claims.account_id,
    employee_id: claims.employee_id,
    resource_type: claims.resource_type,
    actions: claims.actions.join(","),
    ...(claims.assignment_id ? { assignment_id: claims.assignment_id } : {}),
    ...(claims.resolver_principal_id ? { resolver_principal_id: claims.resolver_principal_id } : {}),
    ...(claims.policy_version ? { policy_version: claims.policy_version } : {}),
    ...(claims.approval_snapshot_hash ? { approval_snapshot_hash: claims.approval_snapshot_hash } : {}),
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
    assignment_id: extra.assignment_id ?? null,
    resolver_principal_id: extra.resolver_principal_id ?? null,
    policy_version: extra.policy_version ?? null,
    approval_snapshot_hash: extra.approval_snapshot_hash ?? null,
    jti: decoded.payload.jti,
    expired: decoded.expired,
  };
}
