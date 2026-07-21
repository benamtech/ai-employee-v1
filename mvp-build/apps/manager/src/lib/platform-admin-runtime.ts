import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  evaluatePlatformAdminAuthority,
  type AdminActor,
  type AdminSupportActionInput,
  type AdminSupportActionResult,
  type PlatformAdminActionClass,
  type PlatformAdminSessionRecord,
  type PlatformPrincipalRecord,
  type PlatformPrincipalRole,
  type PlatformSupportLeaseRecord,
} from "@amtech/shared";
import { executeDurableCommandEffect } from "./durable-command-runtime.js";
import { runAdminSupportAction } from "./admin.js";

export const PLATFORM_ADMIN_TOKEN_PREFIX = "pad_";
export const PLATFORM_ADMIN_AUDIENCE = "manager-admin";

const ROLE_RANK: Record<PlatformPrincipalRole, number> = {
  support_readonly: 1,
  security_reviewer: 2,
  billing_operator: 3,
  platform_operator: 4,
  platform_owner: 5,
};

export interface PlatformAdminRuntimeActor extends AdminActor {
  platform_principal_id: string;
  platform_session_id: string;
  support_lease_id?: string | null;
  assignment_id?: string | null;
  authenticated_by: string;
}

export type PlatformAdminRuntimeDecision =
  | { ok: true; actor: PlatformAdminRuntimeActor; token_hash: string }
  | { ok: false; status: 401 | 403 | 409 | 410 | 503; error: string };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashJson(value: unknown): string {
  return `sha256:${sha256(JSON.stringify(canonicalize(value)))}`;
}

function stableId(prefix: "intent" | "cmd", ...parts: string[]): string {
  return `${prefix}_${sha256(parts.join("\u001f")).slice(0, 32)}`;
}

function bearer(value: string | null | undefined): string | null {
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice("Bearer ".length).trim();
  return token.startsWith(PLATFORM_ADMIN_TOKEN_PREFIX) ? token : null;
}

function strongestRole(rows: Array<{ role?: string | null }>): PlatformPrincipalRole | null {
  const roles = rows
    .map((row) => String(row.role ?? "") as PlatformPrincipalRole)
    .filter((role) => role in ROLE_RANK)
    .sort((left, right) => ROLE_RANK[right] - ROLE_RANK[left]);
  return roles[0] ?? null;
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

async function appendAuthorityAudit(db: SupabaseClient, input: {
  principal_id?: string | null;
  session_id?: string | null;
  support_lease_id?: string | null;
  action: string;
  action_class: PlatformAdminActionClass;
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  result: "allowed" | "denied" | "failed";
  denial_reason?: string | null;
  reason?: string | null;
  evidence?: Record<string, unknown>;
}): Promise<string> {
  const id = `pada_${randomUUID().replaceAll("-", "")}`;
  const appended = await db.rpc("append_platform_admin_audit", {
    p_id: id,
    p_principal_id: input.principal_id ?? null,
    p_session_id: input.session_id ?? null,
    p_support_lease_id: input.support_lease_id ?? null,
    p_audience: PLATFORM_ADMIN_AUDIENCE,
    p_action: input.action,
    p_action_class: input.action_class,
    p_account_id: input.account_id ?? null,
    p_employee_id: input.employee_id ?? null,
    p_assignment_id: input.assignment_id ?? null,
    p_result: input.result,
    p_denial_reason: input.denial_reason ?? null,
    p_reason: input.reason ?? null,
    p_evidence: input.evidence ?? {},
  });
  if (appended.error) throw appended.error;
  return id;
}

export async function authorizePlatformAdminRequest(db: SupabaseClient, input: {
  authorization?: string | null;
  support_lease_id?: string | null;
  action: string;
  action_class: PlatformAdminActionClass;
  allowed_roles: readonly PlatformPrincipalRole[];
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  require_step_up?: boolean;
  require_support_lease?: boolean;
  legacy_identity_header_present?: boolean;
  legacy_reason_header_present?: boolean;
}): Promise<PlatformAdminRuntimeDecision> {
  const token = bearer(input.authorization);
  const mutableHeader = Boolean(input.legacy_identity_header_present || input.legacy_reason_header_present);
  const tokenHash = token ? sha256(token) : "";
  const evidenceBase = {
    token_prefix_valid: Boolean(token),
    token_hash_checked: Boolean(token),
    legacy_identity_header_present: Boolean(input.legacy_identity_header_present),
    legacy_reason_header_present: Boolean(input.legacy_reason_header_present),
  };

  if (mutableHeader) {
    await appendAuthorityAudit(db, {
      action: input.action,
      action_class: input.action_class,
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: input.assignment_id,
      result: "denied",
      denial_reason: "mutable_header_identity_denied",
      evidence: evidenceBase,
    });
    return { ok: false, status: 403, error: "mutable_header_identity_denied" };
  }

  if (!token) {
    await appendAuthorityAudit(db, {
      action: input.action,
      action_class: input.action_class,
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: input.assignment_id,
      result: "denied",
      denial_reason: "platform_session_missing",
      evidence: evidenceBase,
    });
    return { ok: false, status: 401, error: "platform_session_missing" };
  }

  const sessionResult = await db
    .from("platform_admin_sessions")
    .select("id,principal_id,audience,session_version,authenticated_at,step_up_at,step_up_expires_at,expires_at,revoked_at,authenticated_by")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (sessionResult.error) throw sessionResult.error;
  const sessionRow = sessionResult.data as Record<string, unknown> | null;

  let principalRow: Record<string, unknown> | null = null;
  let role: PlatformPrincipalRole | null = null;
  if (sessionRow?.principal_id) {
    const [principalResult, rolesResult] = await Promise.all([
      db.from("platform_principals")
        .select("id,user_id,status,session_version,starts_at,ends_at")
        .eq("id", String(sessionRow.principal_id))
        .maybeSingle(),
      db.from("platform_principal_roles")
        .select("role,status,starts_at,ends_at")
        .eq("principal_id", String(sessionRow.principal_id))
        .eq("status", "active"),
    ]);
    if (principalResult.error) throw principalResult.error;
    if (rolesResult.error) throw rolesResult.error;
    principalRow = principalResult.data as Record<string, unknown> | null;
    role = strongestRole((rolesResult.data ?? []) as Array<{ role?: string | null }>);
  }

  let leaseRow: Record<string, unknown> | null = null;
  if (input.support_lease_id) {
    const leaseResult = await db.from("platform_support_leases")
      .select("id,principal_id,account_id,employee_id,assignment_id,allowed_actions,reason,starts_at,expires_at,revoked_at")
      .eq("id", input.support_lease_id)
      .maybeSingle();
    if (leaseResult.error) throw leaseResult.error;
    leaseRow = leaseResult.data as Record<string, unknown> | null;
  }

  const principal: PlatformPrincipalRecord | null = principalRow && role ? {
    principal_id: String(principalRow.id),
    user_id: String(principalRow.user_id),
    role,
    status: String(principalRow.status),
    session_version: Number(principalRow.session_version),
    starts_at: principalRow.starts_at ? String(principalRow.starts_at) : null,
    ends_at: principalRow.ends_at ? String(principalRow.ends_at) : null,
  } : null;
  const session: PlatformAdminSessionRecord | null = sessionRow ? {
    session_id: String(sessionRow.id),
    principal_id: String(sessionRow.principal_id),
    audience: String(sessionRow.audience),
    session_version: Number(sessionRow.session_version),
    authenticated_at: String(sessionRow.authenticated_at),
    step_up_at: sessionRow.step_up_at ? String(sessionRow.step_up_at) : null,
    step_up_expires_at: sessionRow.step_up_expires_at ? String(sessionRow.step_up_expires_at) : null,
    expires_at: String(sessionRow.expires_at),
    revoked_at: sessionRow.revoked_at ? String(sessionRow.revoked_at) : null,
  } : null;
  const lease: PlatformSupportLeaseRecord | null = leaseRow ? {
    lease_id: String(leaseRow.id),
    principal_id: String(leaseRow.principal_id),
    account_id: String(leaseRow.account_id),
    employee_id: leaseRow.employee_id ? String(leaseRow.employee_id) : null,
    assignment_id: leaseRow.assignment_id ? String(leaseRow.assignment_id) : null,
    allowed_actions: Array.isArray(leaseRow.allowed_actions) ? leaseRow.allowed_actions.map(String) : [],
    reason: String(leaseRow.reason ?? ""),
    starts_at: String(leaseRow.starts_at),
    expires_at: String(leaseRow.expires_at),
    revoked_at: leaseRow.revoked_at ? String(leaseRow.revoked_at) : null,
  } : null;

  const decision = evaluatePlatformAdminAuthority({
    enabled: true,
    principal,
    session,
    lease,
    audience: PLATFORM_ADMIN_AUDIENCE,
    action: input.action,
    action_class: input.action_class,
    allowed_roles: input.allowed_roles,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    require_step_up: input.require_step_up,
    require_support_lease: input.require_support_lease,
  });

  if (!decision.ok) {
    await appendAuthorityAudit(db, {
      principal_id: principal?.principal_id,
      session_id: session?.session_id,
      support_lease_id: lease?.lease_id,
      action: input.action,
      action_class: input.action_class,
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: input.assignment_id,
      result: "denied",
      denial_reason: decision.reason,
      reason: lease?.reason,
      evidence: { ...evidenceBase, ...decision.evidence },
    });
    return { ok: false, status: decision.status, error: decision.reason };
  }

  await db.from("platform_admin_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", decision.session.session_id)
    .is("revoked_at", null);
  await appendAuthorityAudit(db, {
    principal_id: decision.principal.principal_id,
    session_id: decision.session.session_id,
    support_lease_id: decision.lease?.lease_id,
    action: input.action,
    action_class: input.action_class,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    result: "allowed",
    reason: decision.lease?.reason,
    evidence: { ...evidenceBase, ...decision.evidence },
  });

  return {
    ok: true,
    token_hash: tokenHash,
    actor: {
      platform_user_id: decision.principal.user_id,
      platform_principal_id: decision.principal.principal_id,
      platform_session_id: decision.session.session_id,
      support_lease_id: decision.lease?.lease_id ?? null,
      assignment_id: input.assignment_id ?? null,
      role: decision.principal.role,
      support_reason: decision.lease?.reason,
      authenticated_by: `platform_admin_session:${decision.session.session_id}`,
    },
  };
}

export async function resolvePlatformAdminAssignment(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id?: string | null;
}): Promise<string> {
  if (input.assignment_id) {
    const row = await db.from("employee_assignments")
      .select("id,account_id,status,employee_principals!inner(employee_id)")
      .eq("id", input.assignment_id)
      .eq("account_id", input.account_id)
      .eq("employee_principals.employee_id", input.employee_id)
      .maybeSingle();
    if (row.error) throw row.error;
    if (!row.data?.id || row.data.status !== "active") throw new Error("platform_assignment_scope_mismatch");
    return String(row.data.id);
  }
  const result = await db.rpc("amtech_default_assignment_for_employee_account", {
    p_employee_id: input.employee_id,
    p_account_id: input.account_id,
  });
  if (result.error) throw result.error;
  const assignmentId = typeof result.data === "string"
    ? result.data
    : Array.isArray(result.data)
      ? String(result.data[0] ?? "")
      : String(result.data ?? "");
  if (!assignmentId) throw new Error("platform_assignment_not_unique");
  return assignmentId;
}

export async function executePlatformAdminSupportAction(db: SupabaseClient, input: {
  authorization?: string | null;
  support_lease_id?: string | null;
  legacy_identity_header_present?: boolean;
  legacy_reason_header_present?: boolean;
  action: AdminSupportActionInput;
}): Promise<{ status: number; body: AdminSupportActionResult | { error: string } }> {
  const assignmentId = await resolvePlatformAdminAssignment(db, {
    account_id: input.action.account_id,
    employee_id: String(input.action.employee_id ?? ""),
    assignment_id: input.action.assignment_id,
  }).catch(() => "");
  if (!assignmentId || !input.action.employee_id || !input.action.idempotency_key) {
    return { status: 400, body: { error: "account_employee_assignment_and_idempotency_required" } };
  }

  const auth = await authorizePlatformAdminRequest(db, {
    authorization: input.authorization,
    support_lease_id: input.support_lease_id,
    action: `admin:${input.action.action}`,
    action_class: "support_write",
    allowed_roles: ["platform_owner", "platform_operator"],
    account_id: input.action.account_id,
    employee_id: input.action.employee_id,
    assignment_id: assignmentId,
    require_step_up: true,
    require_support_lease: true,
    legacy_identity_header_present: input.legacy_identity_header_present,
    legacy_reason_header_present: input.legacy_reason_header_present,
  });
  if (!auth.ok) return { status: auth.status, body: { error: auth.error } };

  const commandPayload = {
    action: input.action.action,
    account_id: input.action.account_id,
    employee_id: input.action.employee_id,
    assignment_id: assignmentId,
    platform_session_id: auth.actor.platform_session_id,
    support_lease_id: auth.actor.support_lease_id,
    reason: auth.actor.support_reason,
    event_id: input.action.event_id ?? null,
    source: input.action.source ?? null,
    event_type: input.action.event_type ?? null,
    expires_at: input.action.expires_at ?? null,
    confirm: Boolean(input.action.confirm),
  };
  const intentKey = `platform-admin:${auth.actor.platform_principal_id}:${input.action.idempotency_key}`;
  const intentId = stableId("intent", assignmentId, intentKey);
  const commandId = stableId("cmd", assignmentId, intentKey);
  const payloadHash = hashJson(commandPayload);
  const registered = await db.rpc("register_durable_command", {
    p_intent_id: intentId,
    p_assignment_id: assignmentId,
    p_actor_principal_id: auth.actor.platform_principal_id,
    p_actor_class: "platform",
    p_authenticated_by: auth.actor.authenticated_by,
    p_intent_key: intentKey,
    p_command_id: commandId,
    p_command_type: "platform.admin.support_action",
    p_command_version: "1.0.0",
    p_policy_version: "platform-admin-v1",
    p_payload: commandPayload,
    p_payload_hash: payloadHash,
    p_correlation_id: input.action.idempotency_key,
    p_causation_id: null,
  });
  if (registered.error) throw registered.error;
  const registeredRow = firstRow<{ command_id?: string }>(registered.data);
  const durableCommandId = String(registeredRow?.command_id ?? commandId);

  const execution = await executeDurableCommandEffect<AdminSupportActionResult>(db, {
    assignment_id: assignmentId,
    command_id: durableCommandId,
    effect_key: `platform-admin:${input.action.action}:${assignmentId}`,
    provider: "manager",
    operation: input.action.action,
    capability_class: "consumer_dedupe",
    request: commandPayload,
    apply: async () => {
      const result = await runAdminSupportAction(db, auth.actor, {
        ...input.action,
        assignment_id: assignmentId,
        reason: auth.actor.support_reason ?? input.action.reason,
      });
      if (result.status !== "ok" || !result.audit_id) {
        throw new Error(`platform_admin_action_${result.status}`);
      }
      const linked = await db.from("admin_action_events").update({
        assignment_id: assignmentId,
        platform_principal_id: auth.actor.platform_principal_id,
        platform_session_id: auth.actor.platform_session_id,
        support_lease_id: auth.actor.support_lease_id ?? null,
        command_id: durableCommandId,
      }).eq("id", result.audit_id);
      if (linked.error) throw linked.error;
      return {
        result,
        provider_receipt_id: `admin-action:${result.audit_id}`,
        evidence: {
          admin_action_id: result.audit_id,
          principal_id: auth.actor.platform_principal_id,
          session_id: auth.actor.platform_session_id,
          support_lease_id: auth.actor.support_lease_id ?? null,
        },
      };
    },
  });

  if (execution.result.audit_id) {
    const receiptLinked = await db.from("admin_action_events")
      .update({ effect_receipt_id: execution.receipt_id })
      .eq("id", execution.result.audit_id)
      .eq("command_id", durableCommandId);
    if (receiptLinked.error) throw receiptLinked.error;
  }
  return { status: 200, body: execution.result };
}
