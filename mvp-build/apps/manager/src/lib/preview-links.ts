/**
 * Signed preview/action links. The signature proves possession only; the durable
 * row binds assignment, human resolver, policy, snapshot, action scope, expiry,
 * revocation, single-use state, and the authority versions current at issuance.
 */
import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId, reviewRoute, type PreviewResourceType, type PreviewActionType } from "@amtech/shared";
import { mintPreviewToken, tokenHash, verifyPreviewToken, type VerifiedPreviewToken } from "./signed-links.js";
import { mustWrite, orThrow } from "./db.js";

const DEFAULT_PREVIEW_TTL_SECONDS = 7 * 24 * 60 * 60;

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
  assignment_id?: string | null;
  resolver_principal_id?: string | null;
  policy_version?: string | null;
  approval_snapshot_hash?: string | null;
  resolver_authority_version?: number | null;
  assignment_authority_version?: number | null;
  token_jti?: string | null;
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
  assignment_id?: string | null;
  resolver_principal_id?: string | null;
  policy_version?: string | null;
  approval_snapshot_hash?: string | null;
}

function currentAt(row: { status?: string | null; starts_at?: string | null; ends_at?: string | null }, now = Date.now()): boolean {
  if (row.status !== "active" && row.status !== "current") return false;
  if (row.starts_at && Date.parse(row.starts_at) > now) return false;
  if (row.ends_at && Date.parse(row.ends_at) <= now) return false;
  return true;
}

async function approvalPrincipalBinding(
  db: SupabaseClient,
  input: CreatePreviewLinkInput,
): Promise<{ assignment_id: string; resolver_principal_id: string; policy_version: string; approval_snapshot_hash: string }> {
  const approval = await db.from("approvals")
    .select("id,assignment_id,account_id,employee_id,status,policy_version,snapshot_hash,required_resolver_roles")
    .eq("id", input.resource_id)
    .maybeSingle();
  if (approval.error) throw approval.error;
  if (
    !approval.data?.id ||
    approval.data.account_id !== input.account_id ||
    approval.data.employee_id !== input.employee_id ||
    approval.data.status !== "pending" ||
    !approval.data.assignment_id ||
    !approval.data.policy_version ||
    !approval.data.snapshot_hash
  ) {
    throw new Error("preview_approval_not_promoted_or_wrong_assignment");
  }
  if (input.assignment_id && input.assignment_id !== approval.data.assignment_id) throw new Error("preview_assignment_mismatch");
  if (input.policy_version && input.policy_version !== approval.data.policy_version) throw new Error("preview_policy_mismatch");
  if (input.approval_snapshot_hash && input.approval_snapshot_hash !== approval.data.snapshot_hash) throw new Error("preview_snapshot_mismatch");

  let resolverPrincipalId = input.resolver_principal_id ?? null;
  const roles = Array.isArray(approval.data.required_resolver_roles) ? approval.data.required_resolver_roles.map(String) : [];
  if (!resolverPrincipalId) {
    const principals = await db.from("assignment_principals")
      .select("principal_id,principal_class,role,status,starts_at,ends_at,policy_version")
      .eq("assignment_id", approval.data.assignment_id)
      .eq("principal_class", "human")
      .in("role", roles);
    if (principals.error) throw principals.error;
    const current = (principals.data ?? []).filter((row) =>
      currentAt(row) && row.policy_version === approval.data!.policy_version,
    );
    const unique = [...new Set(current.map((row) => String(row.principal_id)))];
    if (unique.length !== 1) throw new Error(unique.length === 0 ? "preview_resolver_missing" : "preview_resolver_ambiguous");
    resolverPrincipalId = unique[0]!;
  }
  const principal = await db.from("assignment_principals")
    .select("principal_id,principal_class,role,status,starts_at,ends_at,policy_version")
    .eq("assignment_id", approval.data.assignment_id)
    .eq("principal_id", resolverPrincipalId)
    .eq("principal_class", "human");
  if (principal.error) throw principal.error;
  const permitted = (principal.data ?? []).some((row) =>
    roles.includes(String(row.role)) && currentAt(row) && row.policy_version === approval.data!.policy_version,
  );
  if (!permitted) throw new Error("preview_resolver_not_authorized");

  return {
    assignment_id: String(approval.data.assignment_id),
    resolver_principal_id: resolverPrincipalId,
    policy_version: String(approval.data.policy_version),
    approval_snapshot_hash: String(approval.data.snapshot_hash),
  };
}

export async function createPreviewLink(
  db: SupabaseClient,
  input: CreatePreviewLinkInput,
): Promise<{ id: string; token: string; url: string; expires_at: string }> {
  const ttl = previewLinkTtlSeconds(input.ttl_seconds);
  const expires = new Date(Date.now() + ttl * 1000);
  const authority = input.resource_type === "approval"
    ? await approvalPrincipalBinding(db, input)
    : {
        assignment_id: input.assignment_id ?? null,
        resolver_principal_id: input.resolver_principal_id ?? null,
        policy_version: input.policy_version ?? null,
        approval_snapshot_hash: input.approval_snapshot_hash ?? null,
      };
  const token = mintPreviewToken({
    account_id: input.account_id,
    employee_id: input.employee_id,
    resource_type: input.resource_type,
    resource_id: input.resource_id,
    actions: input.actions,
    ttlSeconds: ttl,
    assignment_id: authority.assignment_id,
    resolver_principal_id: authority.resolver_principal_id,
    policy_version: authority.policy_version,
    approval_snapshot_hash: authority.approval_snapshot_hash,
  });
  const claims = verifyPreviewToken(token);
  if (!claims) throw new Error("preview_token_mint_failed");
  const id = newId(ID_PREFIX.previewLink);
  await mustWrite(
    db.from("preview_links").insert({
      id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: authority.assignment_id,
      resolver_principal_id: authority.resolver_principal_id,
      policy_version: authority.policy_version,
      approval_snapshot_hash: authority.approval_snapshot_hash,
      token_jti: claims.jti,
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

function sameActions(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export async function resolvePreviewLink(db: SupabaseClient, token: string): Promise<PreviewResolution> {
  const claims = verifyPreviewToken(token);
  if (!claims) return { ok: false, reason: "invalid" };
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
    row.resource_id !== claims.resource_id ||
    !sameActions(row.actions ?? [], claims.actions) ||
    (row.token_jti ?? null) !== claims.jti ||
    (row.assignment_id ?? null) !== claims.assignment_id ||
    (row.resolver_principal_id ?? null) !== claims.resolver_principal_id ||
    (row.policy_version ?? null) !== claims.policy_version ||
    (row.approval_snapshot_hash ?? null) !== claims.approval_snapshot_hash
  ) {
    return { ok: false, reason: "scope_mismatch" };
  }
  if (row.resource_type === "approval" && (
    !row.assignment_id ||
    !row.resolver_principal_id ||
    !row.policy_version ||
    !row.approval_snapshot_hash ||
    !row.assignment_authority_version ||
    !row.resolver_authority_version
  )) {
    return { ok: false, reason: "scope_mismatch" };
  }
  if (row.revoked_at) return { ok: false, reason: "revoked" };
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return { ok: false, reason: "expired" };
  if (row.consumed_at) return { ok: false, reason: "consumed" };

  if (row.resource_type === "approval") {
    const [assignmentAuthority, resolverAuthority] = await Promise.all([
      db.from("authority_versions")
        .select("current_version,revoked_at")
        .eq("scope_type", "employee_assignment")
        .eq("scope_id", String(row.assignment_id))
        .maybeSingle(),
      db.from("authority_versions")
        .select("current_version,revoked_at")
        .eq("scope_type", "human_principal")
        .eq("scope_id", String(row.resolver_principal_id))
        .maybeSingle(),
    ]);
    if (assignmentAuthority.error) throw assignmentAuthority.error;
    if (resolverAuthority.error) throw resolverAuthority.error;
    if (
      !assignmentAuthority.data?.current_version ||
      assignmentAuthority.data.revoked_at ||
      Number(assignmentAuthority.data.current_version) !== Number(row.assignment_authority_version) ||
      !resolverAuthority.data?.current_version ||
      resolverAuthority.data.revoked_at ||
      Number(resolverAuthority.data.current_version) !== Number(row.resolver_authority_version)
    ) {
      return { ok: false, reason: "revoked" };
    }
  }

  return { ok: true, link: row, claims };
}
