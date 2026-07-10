import { createHmac, randomBytes } from "node:crypto";
import { ID_PREFIX, newId } from "@amtech/shared";
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
  const token = `ow_${randomBytes(32).toString("base64url")}`;
  const expires_at = new Date(Date.now() + ttlMs).toISOString();
  // mustWrite: a swallowed insert would hand back a session cookie whose token_hash
  // was never stored, so requireOwnerSession always 401s — a login that silently
  // never works.
  await mustWrite(
    db.from("owner_web_sessions").insert({
      id: newId(ID_PREFIX.ownerWebSession),
      account_id: accountId,
      user_id: userId,
      token_hash: ownerSessionHash(token),
      expires_at,
    }),
    "owner_web_sessions.insert",
  );
  return { token, expires_at };
}

export async function requireOwnerSession(
  db: SupabaseClient,
  token: string | undefined | null,
): Promise<{ account_id: string; user_id: string } | null> {
  if (!token) return null;
  const { data } = await db
    .from("owner_web_sessions")
    .select("account_id,user_id,expires_at")
    .eq("token_hash", ownerSessionHash(token))
    .maybeSingle();
  if (!data || new Date(String(data.expires_at)).getTime() < Date.now()) return null;
  return { account_id: String(data.account_id), user_id: String(data.user_id) };
}
