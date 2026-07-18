import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { sealSecret } from "./secrets.js";

const AUDIENCE = "/manager/mcp";

export interface EmployeeMcpIdentity {
  assignment_id: string;
  account_id: string;
  employee_id: string;
  credential_id: string;
}

export interface MintedEmployeeMcpCredential extends EmployeeMcpIdentity {
  token: string;
  token_prefix: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function bearerToken(value: string | null | undefined): string | null {
  const match = String(value ?? "").match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function resolveCurrentAssignmentId(
  db: SupabaseClient,
  input: { assignment_id?: string | null; account_id: string; employee_id: string },
): Promise<string> {
  const query = db
    .from("employee_assignments")
    .select("id,account_id,employee_id,status,revoked_at,valid_until,legacy_default")
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .eq("status", "active");
  const result = input.assignment_id
    ? await query.eq("id", input.assignment_id).maybeSingle()
    : await query.eq("legacy_default", true).maybeSingle();
  const row = result.data as { id?: string; revoked_at?: string | null; valid_until?: string | null } | null;
  if (result.error || !row?.id) throw new Error(`mcp_assignment_not_resolved:${input.account_id}:${input.employee_id}`);
  if (row.revoked_at) throw new Error(`mcp_assignment_revoked:${row.id}`);
  if (row.valid_until && Date.parse(row.valid_until) <= Date.now()) throw new Error(`mcp_assignment_expired:${row.id}`);
  return row.id;
}

export async function mintEmployeeMcpCredential(
  db: SupabaseClient,
  input: { assignment_id?: string | null; account_id: string; employee_id: string; ttl_seconds?: number },
): Promise<MintedEmployeeMcpCredential> {
  // validation-vector((pass-vector: MCP token mints only for a current assignment)-(fail-vector: leaked token or employee_id alone carries global Manager authority))
  const assignmentId = await resolveCurrentAssignmentId(db, input);
  const token = `mcp_${randomBytes(32).toString("base64url")}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.slice(0, 12);
  const id = newId(ID_PREFIX.mcpCredential);
  const expiresAt = input.ttl_seconds
    ? new Date(Date.now() + Math.max(60, input.ttl_seconds) * 1000).toISOString()
    : null;
  const { error } = await db.from("employee_mcp_credentials").insert({
    id,
    assignment_id: assignmentId,
    execution_context_type: "assignment",
    account_id: input.account_id,
    employee_id: input.employee_id,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    token_secret_ref: sealSecret(token),
    audience: AUDIENCE,
    status: "active",
    expires_at: expiresAt,
  });
  if (error) throw new Error(`mcp_credential_insert_failed:${error.message ?? "unknown"}`);
  return {
    token,
    token_prefix: tokenPrefix,
    credential_id: id,
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
  };
}

export async function verifyEmployeeMcpCredential(
  db: SupabaseClient,
  authorization: string | null | undefined,
): Promise<EmployeeMcpIdentity | null> {
  const token = bearerToken(authorization);
  if (!token || !token.startsWith("mcp_")) return null;
  const tokenHash = hashToken(token);
  const { data } = await db
    .from("employee_mcp_credentials")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("audience", AUDIENCE)
    .eq("status", "active")
    .maybeSingle();
  const row = data as {
    id: string;
    assignment_id?: string | null;
    account_id: string;
    employee_id: string;
    token_hash: string;
    expires_at?: string | null;
    revoked_at?: string | null;
  } | null;
  if (!row || !row.assignment_id || row.revoked_at || !safeEqualHex(row.token_hash, tokenHash)) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return null;
  try {
    await resolveCurrentAssignmentId(db, {
      assignment_id: row.assignment_id,
      account_id: row.account_id,
      employee_id: row.employee_id,
    });
  } catch {
    return null;
  }
  await db.from("employee_mcp_credentials").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  return { assignment_id: row.assignment_id, account_id: row.account_id, employee_id: row.employee_id, credential_id: row.id };
}

export async function revokeEmployeeMcpCredential(db: SupabaseClient, credentialId: string): Promise<void> {
  await db.from("employee_mcp_credentials").update({
    status: "revoked",
    revoked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", credentialId);
}
