import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { sealSecret } from "./secrets.js";

const AUDIENCE = "/manager/mcp";

export interface EmployeeMcpIdentity {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  principal_id: string;
  policy_version: string;
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

async function resolveEmployeeAssignment(db: SupabaseClient, input: { account_id: string; employee_id: string; assignment_id?: string | null }) {
  let assignmentId = String(input.assignment_id ?? "");
  if (!assignmentId) {
    const result = await db.rpc("amtech_default_assignment_for_employee_account", {
      p_employee_id: input.employee_id,
      p_account_id: input.account_id,
    });
    if (result.error) throw result.error;
    assignmentId = typeof result.data === "string"
      ? result.data
      : Array.isArray(result.data)
        ? String(result.data[0] ?? "")
        : String(result.data ?? "");
  }
  if (!assignmentId) throw new Error("mcp_assignment_not_unique");
  const assignment = await db.from("employee_assignments")
    .select("id,account_id,status,starts_at,ends_at,policy_version,employee_principals!inner(id,employee_id,status)")
    .eq("id", assignmentId)
    .eq("account_id", input.account_id)
    .eq("employee_principals.employee_id", input.employee_id)
    .maybeSingle();
  if (assignment.error) throw assignment.error;
  const principalJoin = assignment.data?.employee_principals as unknown as
    | { id?: string; employee_id?: string; status?: string }
    | Array<{ id?: string; employee_id?: string; status?: string }>
    | null;
  const principal = Array.isArray(principalJoin) ? principalJoin[0] : principalJoin;
  const expired = assignment.data?.ends_at && Date.parse(String(assignment.data.ends_at)) <= Date.now();
  if (!assignment.data?.id || assignment.data.status !== "active" || expired || !principal?.id || principal.status !== "active") {
    throw new Error("mcp_assignment_not_current");
  }
  return {
    assignment_id: String(assignment.data.id),
    principal_id: String(principal.id),
    policy_version: String(assignment.data.policy_version),
  };
}

export async function mintEmployeeMcpCredential(
  db: SupabaseClient,
  input: { account_id: string; employee_id: string; assignment_id?: string | null; ttl_seconds?: number },
): Promise<MintedEmployeeMcpCredential> {
  const authority = await resolveEmployeeAssignment(db, input);
  const token = `mcp_${randomBytes(32).toString("base64url")}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.slice(0, 12);
  const id = newId(ID_PREFIX.mcpCredential);
  const expiresAt = input.ttl_seconds
    ? new Date(Date.now() + Math.max(60, input.ttl_seconds) * 1000).toISOString()
    : null;
  const { error } = await db.from("employee_mcp_credentials").insert({
    id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: authority.assignment_id,
    principal_id: authority.principal_id,
    policy_version: authority.policy_version,
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
    account_id: input.account_id,
    employee_id: input.employee_id,
    ...authority,
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
    .select("id,account_id,employee_id,assignment_id,principal_id,policy_version,token_hash,expires_at,revoked_at,status")
    .eq("token_hash", tokenHash)
    .eq("audience", AUDIENCE)
    .eq("status", "active")
    .maybeSingle();
  const row = data as {
    id: string;
    account_id: string;
    employee_id: string;
    assignment_id?: string | null;
    principal_id?: string | null;
    policy_version?: string | null;
    token_hash: string;
    expires_at?: string | null;
    revoked_at?: string | null;
  } | null;
  if (!row || !row.assignment_id || !row.principal_id || !row.policy_version || row.revoked_at || !safeEqualHex(row.token_hash, tokenHash)) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return null;

  const assignment = await db.from("employee_assignments")
    .select("id,account_id,status,ends_at,policy_version,employee_principals!inner(id,employee_id,status)")
    .eq("id", row.assignment_id)
    .eq("account_id", row.account_id)
    .eq("policy_version", row.policy_version)
    .eq("employee_principals.id", row.principal_id)
    .eq("employee_principals.employee_id", row.employee_id)
    .maybeSingle();
  if (assignment.error) throw assignment.error;
  const principalJoin = assignment.data?.employee_principals as unknown as { status?: string } | Array<{ status?: string }> | null;
  const principal = Array.isArray(principalJoin) ? principalJoin[0] : principalJoin;
  if (!assignment.data?.id || assignment.data.status !== "active" || principal?.status !== "active") return null;
  if (assignment.data.ends_at && Date.parse(String(assignment.data.ends_at)) <= Date.now()) return null;

  await db.from("employee_mcp_credentials").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  return {
    account_id: row.account_id,
    employee_id: row.employee_id,
    assignment_id: row.assignment_id,
    principal_id: row.principal_id,
    policy_version: row.policy_version,
    credential_id: row.id,
  };
}

export async function revokeEmployeeMcpCredential(db: SupabaseClient, credentialId: string): Promise<void> {
  await db.from("employee_mcp_credentials").update({
    status: "revoked",
    revoked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", credentialId);
}
