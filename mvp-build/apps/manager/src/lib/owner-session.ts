import { createHmac, randomBytes } from "node:crypto";
import { ID_PREFIX, newId, type OwnerSessionRecord } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { mustWrite } from "./db.js";

function signingSecret(): string {
  const secret = process.env.SIGNING_SECRET;
  if (!secret || secret.length < 16) throw new Error("SIGNING_SECRET missing or too short.");
  return secret;
}

export function ownerSessionHash(token: string): string {
  return createHmac("sha256", signingSecret()).update(token).digest("hex");
}

export async function mintOwnerSession(
  db: SupabaseClient,
  accountId: string,
  userId: string,
  ttlMs = 14 * 24 * 60 * 60 * 1000,
): Promise<{ token: string; expires_at: string }> {
  const principal = await db.from("human_principals")
    .select("id,user_id,status,session_version")
    .eq("user_id", userId)
    .maybeSingle();
  if (principal.error) throw principal.error;
  if (!principal.data?.id || principal.data.status !== "active") {
    throw new Error("owner_human_principal_not_active");
  }
  const authority = await db.from("authority_versions")
    .select("current_version,revoked_at")
    .eq("scope_type", "human_principal")
    .eq("scope_id", principal.data.id)
    .maybeSingle();
  if (authority.error) throw authority.error;
  if (!authority.data?.current_version || authority.data.revoked_at) {
    throw new Error("owner_human_authority_not_current");
  }
  const assignment = await db.from("assignment_principals")
    .select("assignment_id,status,employee_assignments!inner(account_id,status)")
    .eq("principal_id", principal.data.id)
    .eq("principal_class", "human")
    .eq("employee_assignments.account_id", accountId)
    .eq("status", "active")
    .limit(1);
  if (assignment.error) throw assignment.error;
  if (!assignment.data?.length) throw new Error("owner_assignment_not_active");

  const token = `ow_${randomBytes(32).toString("base64url")}`;
  const expires_at = new Date(Date.now() + ttlMs).toISOString();
  await mustWrite(
    db.from("owner_web_sessions").insert({
      id: newId(ID_PREFIX.ownerWebSession),
      account_id: accountId,
      user_id: userId,
      human_principal_id: principal.data.id,
      session_version: Number(principal.data.session_version ?? 1),
      authority_version: Number(authority.data.current_version),
      token_hash: ownerSessionHash(token),
      expires_at,
      last_seen_at: new Date().toISOString(),
    }),
    "owner_web_sessions.insert",
  );
  return { token, expires_at };
}

export async function requireOwnerSession(
  db: SupabaseClient,
  token: string | undefined | null,
): Promise<OwnerSessionRecord | null> {
  if (!token) return null;
  const sessionResult = await db.from("owner_web_sessions")
    .select("id,account_id,user_id,human_principal_id,session_version,authority_version,expires_at,revoked_at")
    .eq("token_hash", ownerSessionHash(token))
    .maybeSingle();
  if (sessionResult.error) throw sessionResult.error;
  const session = sessionResult.data;
  if (!session?.id || !session.human_principal_id || session.revoked_at) return null;
  if (session.expires_at && new Date(String(session.expires_at)).getTime() <= Date.now()) return null;

  const [principalResult, authorityResult] = await Promise.all([
    db.from("human_principals")
      .select("id,user_id,status,session_version,credentials_revoked_at")
      .eq("id", session.human_principal_id)
      .maybeSingle(),
    db.from("authority_versions")
      .select("current_version,revoked_at")
      .eq("scope_type", "human_principal")
      .eq("scope_id", session.human_principal_id)
      .maybeSingle(),
  ]);
  if (principalResult.error) throw principalResult.error;
  if (authorityResult.error) throw authorityResult.error;
  const principal = principalResult.data;
  const authority = authorityResult.data;
  if (!principal?.id || principal.status !== "active" || principal.user_id !== session.user_id) return null;
  if (Number(principal.session_version ?? 1) !== Number(session.session_version ?? 0)) return null;
  if (principal.credentials_revoked_at) return null;
  if (!authority?.current_version || authority.revoked_at) return null;
  if (Number(authority.current_version) !== Number(session.authority_version ?? 0)) return null;

  void db.from("owner_web_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", session.id).then(() => undefined, () => undefined);
  return {
    session_id: String(session.id),
    account_id: String(session.account_id),
    user_id: String(session.user_id),
    human_principal_id: String(session.human_principal_id),
    expires_at: session.expires_at ? String(session.expires_at) : null,
    revoked_at: session.revoked_at ? String(session.revoked_at) : null,
  };
}
