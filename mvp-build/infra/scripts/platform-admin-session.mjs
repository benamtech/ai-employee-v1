#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const DEFAULT_STATE = join(ROOT, "infra", ".local", "platform-admin-session.json");
const AUDIENCE = "manager-admin";

function usage(exitCode = 0) {
  console.log(`AMTECH S8 platform admin operator CLI

Usage:
  node infra/scripts/platform-admin-session.mjs bootstrap --user-id=<id> --role=<role>
  node infra/scripts/platform-admin-session.mjs mint --user-id=<id> [--ttl=3600] [--out=<file>]
  node infra/scripts/platform-admin-session.mjs step-up [--token=<token>|--state=<file>] [--method=operator_mfa]
  node infra/scripts/platform-admin-session.mjs lease --account=<acct> [--employee=<emp> --assignment=<asn>] --actions=a,b --reason="..." [--ttl=1800]
  node infra/scripts/platform-admin-session.mjs revoke-session [--state=<file>] --reason="..."
  node infra/scripts/platform-admin-session.mjs revoke-lease [--state=<file>] --reason="..."
  node infra/scripts/platform-admin-session.mjs status [--state=<file>]

Safety:
  - Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
  - bootstrap additionally requires PLATFORM_ADMIN_BOOTSTRAP_ACK=I_UNDERSTAND_SERVICE_ROLE_AUTHORITY.
  - Raw pad_ tokens are written once to a mode-0600 state file and are never stored in PostgreSQL.
  - Customer access requires an exact support lease; writes also require recent step-up and C3.
`);
  process.exit(exitCode);
}

function args() {
  const values = {};
  for (const arg of process.argv.slice(3)) {
    if (!arg.startsWith("--")) continue;
    const [key, ...rest] = arg.slice(2).split("=");
    values[key] = rest.length ? rest.join("=") : true;
  }
  return values;
}

function command() {
  const value = process.argv[2];
  if (!value || value === "--help" || value === "-h" || value === "help") usage(0);
  return value;
}

async function loadDotEnv(path = join(ROOT, ".env")) {
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function required(name) {
  const value = process.env[name];
  if (!value || /PASTE|CHANGE_ME|change-me/.test(value)) throw new Error(`${name} missing or placeholder`);
  return value;
}

function stableId(prefix) {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function rawToken() {
  return `pad_${randomBytes(32).toString("base64url")}`;
}

async function readState(path) {
  const parsed = JSON.parse(await readFile(path, "utf8"));
  if (!parsed.token || !String(parsed.token).startsWith("pad_")) throw new Error("state file has no valid pad_ token");
  return parsed;
}

async function writeState(path, state) {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(absolute, 0o600);
  return absolute;
}

async function tokenFromOptions(options) {
  if (typeof options.token === "string") return { token: options.token, state: null, statePath: null };
  const statePath = resolve(String(options.state ?? DEFAULT_STATE));
  const state = await readState(statePath);
  return { token: state.token, state, statePath };
}

async function main() {
  await loadDotEnv();
  const cmd = command();
  const options = args();
  const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (cmd === "bootstrap") {
    if (process.env.PLATFORM_ADMIN_BOOTSTRAP_ACK !== "I_UNDERSTAND_SERVICE_ROLE_AUTHORITY") {
      throw new Error("Set PLATFORM_ADMIN_BOOTSTRAP_ACK=I_UNDERSTAND_SERVICE_ROLE_AUTHORITY for explicit bootstrap");
    }
    const userId = String(options["user-id"] ?? "").trim();
    const role = String(options.role ?? "").trim();
    const allowed = new Set(["platform_owner", "platform_operator", "support_readonly", "billing_operator", "security_reviewer"]);
    if (!userId || !allowed.has(role)) throw new Error("--user-id and a valid --role are required");
    const principalId = `ppr_${createHash("sha256").update(userId).digest("hex").slice(0, 28)}`;
    const roleId = `pprr_${createHash("sha256").update(`${principalId}:${role}`).digest("hex").slice(0, 27)}`;
    const principal = await db.from("platform_principals").upsert({
      id: principalId,
      user_id: userId,
      status: "active",
      session_version: 1,
      ends_at: null,
      provenance: { source: "explicit_operator_bootstrap", recorded_at: new Date().toISOString() },
    }, { onConflict: "user_id" });
    if (principal.error) throw principal.error;
    const roleWrite = await db.from("platform_principal_roles").upsert({
      id: roleId,
      principal_id: principalId,
      role,
      status: "active",
      ends_at: null,
      provenance: { source: "explicit_operator_bootstrap", recorded_at: new Date().toISOString() },
    }, { onConflict: "id" });
    if (roleWrite.error) throw roleWrite.error;
    console.log(JSON.stringify({ status: "ok", principal_id: principalId, user_id: userId, role }, null, 2));
    return;
  }

  if (cmd === "mint") {
    const userId = String(options["user-id"] ?? "").trim();
    if (!userId) throw new Error("--user-id is required");
    const token = rawToken();
    const sessionId = stableId("pads");
    const ttl = Number(options.ttl ?? 3600);
    const result = await db.rpc("mint_platform_admin_session", {
      p_session_id: sessionId,
      p_user_id: userId,
      p_audience: AUDIENCE,
      p_token_hash: tokenHash(token),
      p_ttl_seconds: ttl,
      p_authenticated_by: "service_role_operator_cli",
    });
    if (result.error) throw result.error;
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    const statePath = await writeState(String(options.out ?? DEFAULT_STATE), {
      token,
      session_id: sessionId,
      principal_id: row?.principal_id ?? null,
      user_id: userId,
      audience: AUDIENCE,
      expires_at: row?.expires_at ?? null,
      support_lease_id: null,
      created_at: new Date().toISOString(),
    });
    console.log(JSON.stringify({ status: "ok", session_id: sessionId, state_file: statePath, token_printed: false }, null, 2));
    console.log(`export AMTECH_ADMIN_TOKEN_FILE=${JSON.stringify(statePath)}`);
    return;
  }

  if (cmd === "step-up") {
    const resolved = await tokenFromOptions(options);
    const result = await db.rpc("step_up_platform_admin_session", {
      p_token_hash: tokenHash(resolved.token),
      p_method: String(options.method ?? "operator_mfa"),
      p_ttl_seconds: Number(options.ttl ?? 900),
    });
    if (result.error) throw result.error;
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (resolved.state && resolved.statePath) await writeState(resolved.statePath, { ...resolved.state, step_up_at: row?.step_up_at ?? new Date().toISOString(), step_up_expires_at: row?.step_up_expires_at ?? null });
    console.log(JSON.stringify({ status: "ok", session_id: row?.id, step_up_expires_at: row?.step_up_expires_at }, null, 2));
    return;
  }

  if (cmd === "lease") {
    const resolved = await tokenFromOptions(options);
    const accountId = String(options.account ?? "").trim();
    const employeeId = options.employee ? String(options.employee) : null;
    const assignmentId = options.assignment ? String(options.assignment) : null;
    const actions = String(options.actions ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    const reason = String(options.reason ?? "").trim();
    if (!accountId || !actions.length || reason.length < 8) throw new Error("--account, --actions, and --reason (8+ chars) are required");
    const leaseId = stableId("psl");
    const result = await db.rpc("issue_platform_support_lease", {
      p_lease_id: leaseId,
      p_session_token_hash: tokenHash(resolved.token),
      p_account_id: accountId,
      p_employee_id: employeeId,
      p_assignment_id: assignmentId,
      p_allowed_actions: actions,
      p_reason: reason,
      p_ttl_seconds: Number(options.ttl ?? 1800),
    });
    if (result.error) throw result.error;
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (resolved.state && resolved.statePath) await writeState(resolved.statePath, { ...resolved.state, support_lease_id: leaseId, support_lease_expires_at: row?.expires_at ?? null });
    console.log(JSON.stringify({ status: "ok", lease_id: leaseId, account_id: accountId, employee_id: employeeId, assignment_id: assignmentId, actions, expires_at: row?.expires_at }, null, 2));
    return;
  }

  if (cmd === "revoke-session") {
    const resolved = await tokenFromOptions(options);
    const sessionId = String(resolved.state?.session_id ?? options["session-id"] ?? "");
    if (!sessionId) throw new Error("session id unavailable");
    const result = await db.rpc("revoke_platform_admin_session", { p_session_id: sessionId, p_reason: String(options.reason ?? "operator_revoked") });
    if (result.error) throw result.error;
    console.log(JSON.stringify({ status: "ok", session_id: sessionId, revoked: Boolean(result.data) }, null, 2));
    return;
  }

  if (cmd === "revoke-lease") {
    const resolved = await tokenFromOptions(options);
    const leaseId = String(resolved.state?.support_lease_id ?? options["lease-id"] ?? "");
    const principalId = String(resolved.state?.principal_id ?? options["principal-id"] ?? "");
    if (!leaseId || !principalId) throw new Error("lease/principal id unavailable");
    const result = await db.rpc("revoke_platform_support_lease", { p_lease_id: leaseId, p_revoked_by_principal_id: principalId, p_reason: String(options.reason ?? "operator_revoked") });
    if (result.error) throw result.error;
    console.log(JSON.stringify({ status: "ok", lease_id: leaseId, revoked: Boolean(result.data) }, null, 2));
    return;
  }

  if (cmd === "status") {
    const resolved = await tokenFromOptions(options);
    const hash = tokenHash(resolved.token);
    const session = await db.from("platform_admin_sessions").select("id,principal_id,audience,session_version,authenticated_at,step_up_at,step_up_expires_at,expires_at,revoked_at,last_seen_at").eq("token_hash", hash).maybeSingle();
    if (session.error) throw session.error;
    const lease = resolved.state?.support_lease_id
      ? await db.from("platform_support_leases").select("id,account_id,employee_id,assignment_id,allowed_actions,starts_at,expires_at,revoked_at").eq("id", resolved.state.support_lease_id).maybeSingle()
      : { data: null, error: null };
    if (lease.error) throw lease.error;
    console.log(JSON.stringify({ status: "ok", session: session.data, lease: lease.data }, null, 2));
    return;
  }

  usage(2);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
