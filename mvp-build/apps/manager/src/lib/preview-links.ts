/**
 * Phase 3 signed preview/action links. `createPreviewLink` mints a scoped token and
 * persists a `preview_links` row (mirrors `create_signed_artifact_link`);
 * `resolvePreviewLink` is the auth primitive that a forged/cross-account/expired
 * token cannot pass. The token is the only credential a mobile review page needs.
 */
import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId, reviewRoute, type PreviewResourceType, type PreviewActionType } from "@amtech/shared";
import { mintPreviewToken, tokenHash, verifyPreviewToken, type VerifiedPreviewToken } from "./signed-links.js";
import { mustWrite, orThrow } from "./db.js";

const DEFAULT_PREVIEW_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days; ambient inbox links live a while.

export function previewLinkTtlSeconds(input?: number): number {
  if (!input || !Number.isFinite(input)) return DEFAULT_PREVIEW_TTL_SECONDS;
  return Math.max(60, Math.min(Math.floor(input), 30 * 24 * 60 * 60));
}

function ownerWebOrigin(): string {
  return (process.env.AGENT_WEB_ORIGIN ?? process.env.PUBLIC_WEB_ORIGIN ?? "").replace(/\/$/, "");
}

export interface PreviewLinkRow {
  id: string;
  account_id: string;
  employee_id: string;
  resource_type: PreviewResourceType;
  resource_id: string;
  actions: string[];
  audience: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  consumed_at?: string | null;
  access_count?: number | null;
  run_id?: string | null;
}

export interface CreatePreviewLinkInput {
  account_id: string;
  employee_id: string;
  resource_type: PreviewResourceType;
  resource_id: string;
  actions: PreviewActionType[];
  ttl_seconds?: number;
  audience?: string;
  run_id?: string | null;
}

/** Mint a signed token, persist the backing row, and return the full review URL. */
export async function createPreviewLink(
  db: SupabaseClient,
  input: CreatePreviewLinkInput,
): Promise<{ id: string; token: string; url: string; expires_at: string }> {
  const ttl = previewLinkTtlSeconds(input.ttl_seconds);
  const expires = new Date(Date.now() + ttl * 1000);
  const token = mintPreviewToken({
    account_id: input.account_id,
    employee_id: input.employee_id,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    actions: input.actions,
    ttlSeconds: ttl,
  });
  const id = newId(ID_PREFIX.previewLink);
  // mustWrite: a swallowed insert error would mint a token whose backing row never
  // persisted → a dead SMS link. Throwing lets attachPreviewLink fall back to a
  // linkless message instead of shipping a broken link.
  await mustWrite(
    db.from("preview_links").insert({
      id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      token_hash: tokenHash(token),
      actions: input.actions,
      audience: input.audience ?? "owner",
      expires_at: expires.toISOString(),
      run_id: input.run_id ?? null,
    }),
    "preview_links.insert",
  );
  const path = reviewRoute(input.employee_id, token);
  const origin = ownerWebOrigin();
  return { id, token, url: origin ? `${origin}${path}` : path, expires_at: expires.toISOString() };
}

export type PreviewResolution =
  | { ok: true; link: PreviewLinkRow; claims: VerifiedPreviewToken }
  | { ok: false; reason: "invalid" | "not_found" | "expired" | "revoked" | "consumed" | "scope_mismatch" };

/**
 * Verify a preview token and load its backing row. Fails closed on any of: bad
 * signature/purpose/expiry (token), missing/revoked/expired/consumed row, or a
 * token whose bound account/employee/resource_type does not match the stored row
 * (cross-account or scope tampering).
 */
export async function resolvePreviewLink(db: SupabaseClient, token: string): Promise<PreviewResolution> {
  const claims = verifyPreviewToken(token);
  if (!claims) return { ok: false, reason: "invalid" };
  // A validly-signed but aged-out token is "expired" (→ owner-friendly reissue),
  // not "invalid" (→ generic denial). Distinct from a forged token, which fails
  // the signature check above and returns "invalid".
  if (claims.expired) return { ok: false, reason: "expired" };
  const row = orThrow(
    await db.from("preview_links").select("*").eq("token_hash", tokenHash(token)).maybeSingle(),
    "preview_links.lookup",
  ) as PreviewLinkRow | null;
  if (!row) return { ok: false, reason: "not_found" };
  if (
    row.account_id !== claims.account_id ||
    row.employee_id !== claims.employee_id ||
    row.resource_type !== claims.resource_type ||
    row.resource_id !== claims.resource_id
  ) {
    return { ok: false, reason: "scope_mismatch" };
  }
  if (row.revoked_at) return { ok: false, reason: "revoked" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, link: row, claims };
}
