import {
  ID_PREFIX,
  newId,
  type AdminAccountSummary,
  type AdminActor,
  type AdminDashboard,
  type AdminEmployeeSummary,
  type AdminReadinessReport,
  type AdminSupportActionInput,
  type AdminSupportActionResult,
  type BillingState,
  type HealthState,
  type PlatformRole,
} from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { writeAudit } from "./audit.js";
import { buildEmployeeSnapshot } from "./employee-stream.js";
import { mintEmployeeMcpCredential } from "./mcp-auth.js";
import { recordRuntimeHealthSnapshots } from "./runtime-health.js";
import { runManagerTool } from "./run-tool.js";
import { runEmployeeLifecycleAction } from "./employee-lifecycle.js";

const ROLE_RANK: Record<PlatformRole, number> = {
  support_readonly: 1,
  security_reviewer: 2,
  billing_operator: 3,
  platform_operator: 4,
  platform_owner: 5,
};

const SENSITIVE_KEY = /(token|secret|authorization|signature|raw_?body|email_?body|webhook_?body|payload|code)/i;

function nowIso(): string {
  return new Date().toISOString();
}

function asRows<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function safeRole(value: unknown): PlatformRole | null {
  const role = String(value ?? "");
  return role in ROLE_RANK ? role as PlatformRole : null;
}

function strongestRole(roles: PlatformRole[]): PlatformRole | null {
  return roles.sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0] ?? null;
}

function healthFromParts(parts: Array<"green" | "yellow" | "red" | "gray">): HealthState {
  if (parts.includes("red")) return "red";
  if (parts.includes("yellow")) return "yellow";
  if (parts.includes("green")) return "green";
  return "gray";
}

function runtimeHealth(value: unknown): HealthState {
  const status = String(value ?? "");
  if (status === "healthy" || status === "live" || status === "success") return "green";
  if (status === "degraded" || status === "provisioning" || status === "running") return "yellow";
  if (status === "unhealthy" || status === "failed" || status === "suspended" || status === "retired") return "red";
  return "gray";
}

function billingState(value: unknown): BillingState {
  const s = String(value ?? "free_mvp");
  if (["free_mvp", "trialing", "active", "past_due", "cancelled", "unknown"].includes(s)) return s as BillingState;
  return "unknown";
}

export function redactAdminValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string" && /(Bearer\s+|sk_(test|live)_|whsec_|mcp_|ya29\.)/.test(value)) return "[redacted]";
  if (Array.isArray(value)) return value.map((v, idx) => redactAdminValue(String(idx), v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = redactAdminValue(k, v);
    return out;
  }
  return value;
}

export function redactAdminPayload<T>(value: T): T {
  return redactAdminValue("root", value) as T;
}

export async function requirePlatformRole(
  db: SupabaseClient,
  input: { platform_user_id?: string | null; minimum?: PlatformRole },
): Promise<{ ok: true; actor: AdminActor } | { ok: false; status: number; error: string }> {
  const userId = String(input.platform_user_id ?? "").trim();
  if (!userId) return { ok: false, status: 401, error: "platform_user_required" };

  const { data: user } = await db.from("platform_users").select("*").eq("id", userId).eq("status", "active").maybeSingle();
  if (!user) {
    if (process.env.ALLOW_ADMIN_BOOTSTRAP === "1" && process.env.NODE_ENV !== "production") {
      return { ok: true, actor: { platform_user_id: userId, role: "platform_owner" } };
    }
    return { ok: false, status: 403, error: "platform_user_denied" };
  }

  const { data: roleRows } = await db.from("platform_user_roles").select("role").eq("platform_user_id", userId);
  const roles = asRows<{ role?: string }>(roleRows).flatMap((r) => {
    const role = safeRole(r.role);
    return role ? [role] : [];
  });
  const role = strongestRole(roles);
  if (!role) return { ok: false, status: 403, error: "platform_role_required" };
  const minimum = input.minimum ?? "support_readonly";
  if (ROLE_RANK[role] < ROLE_RANK[minimum]) return { ok: false, status: 403, error: "platform_role_insufficient" };
  return { ok: true, actor: { platform_user_id: userId, role } };
}

export async function recordSupportAccess(
  db: SupabaseClient,
  actor: AdminActor,
  input: { account_id: string; reason?: string | null; action: string; employee_id?: string | null },
): Promise<{ ok: true; audit_id: string } | { ok: false; status: number; error: string }> {
  const reason = String(input.reason ?? "").trim();
  if (reason.length < 8) return { ok: false, status: 400, error: "support_reason_required" };
  const supportId = newId(ID_PREFIX.supportAccess);
  await db.from("support_access_sessions").insert({
    id: supportId,
    platform_user_id: actor.platform_user_id,
    account_id: input.account_id,
    role: actor.role,
    reason,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  await db.from("admin_action_events").insert({
    id: newId(ID_PREFIX.adminAction),
    platform_user_id: actor.platform_user_id,
    role: actor.role,
    account_id: input.account_id,
    employee_id: input.employee_id ?? null,
    action: `support_access:${input.action}`,
    reason,
    result: "ok",
    proof: { support_access_session_id: supportId },
  });
  const audit_id = await writeAudit(db, {
    account_id: input.account_id,
    employee_id: input.employee_id ?? null,
    actor: "manager",
    action: `admin:support_access:${input.action}`,
    result: "ok",
    details: { platform_user_id: actor.platform_user_id, role: actor.role, reason, support_access_session_id: supportId },
  });
  return { ok: true, audit_id };
}

function employeeHealth(employee: Record<string, unknown>, runtime: Record<string, unknown> | undefined, pendingApprovals: number, repairs: number): HealthState {
  return healthFromParts([
    runtimeHealth(employee.status),
    runtimeHealth((runtime?.health as { status?: string } | undefined)?.status ?? runtime?.status),
    pendingApprovals > 0 ? "yellow" : "green",
    repairs > 0 ? "yellow" : "green",
    employee.needs_reprovision ? "yellow" : "green",
  ]);
}

export async function buildAdminDashboard(db: SupabaseClient): Promise<AdminDashboard> {
  const [{ data: accountsRaw }, { data: employeesRaw }, { data: approvalsRaw }, { data: repairsRaw }, { data: runtimesRaw }, { data: meterRaw }] = await Promise.all([
    db.from("accounts").select("*").order("created_at", { ascending: false }).limit(100),
    db.from("employees").select("*").order("created_at", { ascending: false }).limit(250),
    db.from("approvals").select("id,account_id,employee_id,resolution").is("resolution", null).limit(500),
    db.from("event_repair_queue").select("id,account_id,employee_id,status,severity").limit(500),
    db.from("runtime_endpoints").select("*").limit(250),
    db.from("meter_events").select("account_id,cost_cents,created_at").limit(1000),
  ]);
  const accounts = asRows<Record<string, unknown>>(accountsRaw);
  const employees = asRows<Record<string, unknown>>(employeesRaw);
  const approvals = asRows<Record<string, unknown>>(approvalsRaw);
  const repairs = asRows<Record<string, unknown>>(repairsRaw).filter((r) => !["resolved", "duplicate", "suppressed"].includes(String(r.status ?? "")));
  const runtimes = asRows<Record<string, unknown>>(runtimesRaw);
  const meter = asRows<Record<string, unknown>>(meterRaw);

  const accountSummaries: AdminAccountSummary[] = accounts.map((account) => {
    const accountId = String(account.id);
    const accountEmployees = employees.filter((e) => e.account_id === accountId);
    const degraded = accountEmployees.filter((e) => {
      const rt = runtimes.find((r) => r.employee_id === e.id);
      return employeeHealth(e, rt, approvals.filter((a) => a.employee_id === e.id).length, repairs.filter((r) => r.employee_id === e.id).length) !== "green";
    }).length;
    const pending = approvals.filter((a) => a.account_id === accountId).length;
    const repairItems = repairs.filter((r) => r.account_id === accountId).length;
    return {
      id: accountId,
      display_name: String(account.display_name ?? ""),
      created_at: account.created_at as string | null,
      account_state: String(account.account_state ?? account.status ?? "trial") as AdminAccountSummary["account_state"],
      billing_state: billingState(account.billing_status),
      health: healthFromParts([degraded ? "yellow" : "green", repairItems ? "yellow" : "green", String(account.account_state) === "suspended" ? "red" : "green"]),
      employee_count: accountEmployees.length,
      pending_approvals: pending,
      repair_items: repairItems,
      degraded_employees: degraded,
    };
  });

  return {
    generated_at: nowIso(),
    accounts: accountSummaries,
    totals: {
      accounts: accountSummaries.length,
      employees: employees.length,
      unhealthy_employees: accountSummaries.reduce((n, a) => n + a.degraded_employees, 0),
      pending_approvals: approvals.length,
      repair_items: repairs.length,
      estimated_month_cost_cents: meter.reduce((sum, row) => sum + Number(row.cost_cents ?? 0), 0),
    },
    readiness_warnings: [
      "Live Hermes tool execution proof is still required before runtime acceptance.",
      "Egress control remains a pre-tenant launch blocker.",
      "Old rendered profiles may need reprovisioning to remove legacy Manager bearer config.",
    ],
  };
}

export async function buildAdminAccountDetail(db: SupabaseClient, accountId: string) {
  const [
    { data: account },
    { data: users },
    { data: employeesRaw },
    { data: provisioning },
    { data: connectors },
    { data: repairsRaw },
    { data: approvals },
    { data: events },
    { data: audit },
    { data: adminActions },
    { data: meters },
  ] = await Promise.all([
    db.from("accounts").select("*").eq("id", accountId).maybeSingle(),
    db.from("account_memberships").select("*").eq("account_id", accountId).limit(50),
    db.from("employees").select("*").eq("account_id", accountId).limit(50),
    db.from("provisioning_jobs").select("id,account_id,employee_id,state,failure_state,repair_state,created_at,updated_at").eq("account_id", accountId).limit(50),
    db.from("connector_accounts").select("id,account_id,employee_id,connector_key,provider,status,external_email,last_error,updated_at").eq("account_id", accountId).limit(100),
    db.from("event_repair_queue").select("id,account_id,employee_id,status,severity,source,event_type,reason,created_at").eq("account_id", accountId).limit(100),
    db.from("approvals").select("id,account_id,employee_id,action_key,summary,risk_level,resolution,created_at,expires_at").eq("account_id", accountId).limit(100),
    db.from("inbound_events").select("id,account_id,employee_id,source,event_type,status,created_at,provider_id").eq("account_id", accountId).limit(100),
    db.from("audit_log").select("id,account_id,employee_id,actor,action,resource,result,details,created_at").eq("account_id", accountId).limit(100),
    db.from("admin_action_events").select("*").eq("account_id", accountId).limit(100),
    db.from("meter_events").select("id,account_id,employee_id,feature_key,unit,quantity,cost_cents,created_at").eq("account_id", accountId).limit(200),
  ]);
  if (!account) return null;
  const employees = asRows<Record<string, unknown>>(employeesRaw);
  const employeeIds = employees.map((e) => String(e.id)).filter(Boolean);
  const { data: runtimes } = employeeIds.length
    ? await db.from("runtime_endpoints").select("*").in("employee_id", employeeIds).limit(100)
    : { data: [] };
  const runtimeRows = asRows<Record<string, unknown>>(runtimes);
  const approvalRows = asRows<Record<string, unknown>>(approvals);
  const repairRows = asRows<Record<string, unknown>>(repairsRaw);
  const employee_summaries: AdminEmployeeSummary[] = employees.map((e) => {
    const rt = runtimeRows.find((r) => r.employee_id === e.id);
    const pending = approvalRows.filter((a) => a.employee_id === e.id && !a.resolution).length;
    const repairItems = repairRows.filter((r) => r.employee_id === e.id && !["resolved", "duplicate", "suppressed"].includes(String(r.status ?? ""))).length;
    return {
      id: String(e.id),
      account_id: String(e.account_id),
      name: e.name as string | null,
      status: e.status as string | null,
      profile_id: e.profile_id as string | null,
      needs_reprovision: Boolean(e.needs_reprovision),
      runtime_health: String((rt?.health as { status?: string } | undefined)?.status ?? "unknown"),
      backend_type: rt?.backend_type as string | null,
      connector_health: asRows<Record<string, unknown>>(connectors).some((c) => c.employee_id === e.id && !["connected", "active", "ok"].includes(String(c.status).toLowerCase())) ? "yellow" : "green",
      pending_approvals: pending,
      repair_items: repairItems,
    };
  });
  return redactAdminPayload({
    account,
    users: users ?? [],
    employees: employee_summaries,
    provisioning: provisioning ?? [],
    runtime_endpoints: runtimeRows.map((r) => ({ id: r.id, employee_id: r.employee_id, backend_type: r.backend_type, sms_number_e164: r.sms_number_e164, gateway_port: r.gateway_port, health: r.health, created_at: r.created_at })),
    connectors: connectors ?? [],
    repairs: repairRows,
    approvals: approvalRows,
    events: events ?? [],
    audit: audit ?? [],
    admin_actions: adminActions ?? [],
    metering: {
      recent: meters ?? [],
      estimated_cost_cents: asRows<Record<string, unknown>>(meters).reduce((sum, row) => sum + Number(row.cost_cents ?? 0), 0),
    },
  });
}

export async function buildAdminEmployeeDetail(db: SupabaseClient, employeeId: string) {
  const { data: employee } = await db.from("employees").select("*").eq("id", employeeId).maybeSingle();
  if (!employee) return null;
  const emp = employee as { account_id: string; id: string };
  const snapshot = await buildEmployeeSnapshot(db, employeeId, emp.account_id);
  const { data: credentials } = await db
    .from("employee_mcp_credentials")
    .select("id,token_prefix,audience,status,expires_at,revoked_at,last_used_at,created_at")
    .eq("employee_id", employeeId)
    .limit(20);
  return redactAdminPayload({
    employee,
    snapshot,
    mcp_credentials: credentials ?? [],
    materialization: {
      connection_surfaces: snapshot.connection_surfaces ?? [],
      resurface_items: snapshot.resurface_items ?? [],
      latest_envelopes: (snapshot.surface_envelopes ?? []).slice(0, 50).map((e) => ({
        id: e.id,
        kind: e.kind,
        title: e.title,
        status: e.status ?? null,
        proof: e.proof,
        safety: e.safety,
        render_hints: e.render_hints,
        owner_summary: e.summary ?? null,
      })),
      latest_resources: (snapshot.surface_envelopes ?? []).flatMap((e) => e.resource ? [e.resource] : []).slice(0, 50),
      latest_actions: (snapshot.surface_envelopes ?? []).flatMap((e) => e.actions ?? []).slice(0, 50),
    },
  });
}

export async function buildReadinessReport(db: SupabaseClient, employeeId: string): Promise<AdminReadinessReport | null> {
  const detail = await buildAdminEmployeeDetail(db, employeeId) as { employee?: { account_id?: string; needs_reprovision?: boolean }; snapshot?: any; mcp_credentials?: Array<{ status?: string; last_used_at?: string | null }> } | null;
  if (!detail?.employee?.account_id) return null;
  const snapshot = detail.snapshot;
  const activeMcp = (detail.mcp_credentials ?? []).find((c) => c.status === "active");
  const checks: AdminReadinessReport["checks"] = [
    { key: "phase4_migrations", label: "Phase 4/agent-boundary migrations", status: "unknown", detail: "Verify live Supabase migrations 0022, 0023, and 0024 plus advisors before claiming live closure." },
    { key: "runtime_health", label: "Runtime health", status: snapshot?.runtime_health?.status === "healthy" ? "pass" : "warn", detail: snapshot?.runtime_health?.message ?? "No runtime health check found.", proof: snapshot?.runtime_health ?? undefined },
    { key: "mcp_scoped_credential", label: "Scoped MCP credential", status: activeMcp ? "pass" : "fail", detail: activeMcp ? "Active scoped credential exists; prove live use by last_used_at/tool audit." : "No active scoped employee MCP credential found." },
    { key: "old_profile_reprovision", label: "Rendered profile freshness", status: detail.employee.needs_reprovision ? "fail" : "unknown", detail: detail.employee.needs_reprovision ? "Employee is marked needs_reprovision." : "Confirm rendered profile no longer contains MANAGER_INTERNAL_TOKEN." },
    { key: "tool_loop", label: "Hermes tool execution", status: "unknown", detail: "Requires real model/provider path that executes MCP tool calls, not JSON emitted as text." },
    { key: "egress_control", label: "Agent egress control", status: "fail", detail: "Deny-by-default egress or allowlisted proxy remains required before real tenant use." },
    { key: "pending_approvals", label: "Owner approval gates", status: snapshot?.approvals?.length ? "warn" : "pass", detail: `${snapshot?.approvals?.length ?? 0} pending approval(s).` },
    { key: "connector_health", label: "Connector health", status: snapshot?.connection_surfaces?.some((c: { state?: string }) => c.state === "needs_you") ? "warn" : "pass", detail: `${snapshot?.connection_surfaces?.length ?? snapshot?.connectors?.length ?? 0} connection surface(s) summarized.` },
    { key: "resurface_queue", label: "Resurface queue", status: snapshot?.resurface_items?.some((item: { status?: string }) => item.status === "failed" || item.status === "blocked") ? "warn" : "pass", detail: `${snapshot?.resurface_items?.length ?? 0} resurfacing item(s) derived from current work.` },
  ];
  const failed = checks.some((c) => c.status === "fail");
  return {
    account_id: detail.employee.account_id,
    employee_id: employeeId,
    generated_at: nowIso(),
    status: failed ? "blocked" : checks.some((c) => c.status === "warn" || c.status === "unknown") ? "needs_review" : "ready",
    checks,
  };
}

async function writeAdminAction(
  db: SupabaseClient,
  actor: AdminActor,
  input: { action: string; account_id: string; employee_id?: string | null; reason: string; result: "ok" | "failed" | "denied"; proof?: Record<string, unknown> },
): Promise<string> {
  const id = newId(ID_PREFIX.adminAction);
  const proof = redactAdminPayload(input.proof ?? {});
  await db.from("admin_action_events").insert({
    id,
    platform_user_id: actor.platform_user_id,
    role: actor.role,
    account_id: input.account_id,
    employee_id: input.employee_id ?? null,
    action: input.action,
    reason: input.reason,
    result: input.result,
    proof,
  });
  await writeAudit(db, {
    account_id: input.account_id,
    employee_id: input.employee_id ?? null,
    actor: "manager",
    action: `admin:${input.action}`,
    result: input.result,
    details: { platform_user_id: actor.platform_user_id, role: actor.role, reason: input.reason, proof },
  });
  return id;
}

export async function runAdminSupportAction(db: SupabaseClient, actor: AdminActor, input: AdminSupportActionInput): Promise<AdminSupportActionResult> {
  if (!input.reason || input.reason.trim().length < 8) {
    return { status: "denied", action: input.action, changed_resources: [], proof: {}, user_facing_summary_hint: "Support reason is required." };
  }
  if (ROLE_RANK[actor.role] < ROLE_RANK.platform_operator && input.action !== "rerun_runtime_health") {
    await writeAdminAction(db, actor, { action: input.action, account_id: input.account_id, employee_id: input.employee_id, reason: input.reason, result: "denied", proof: { reason: "role_insufficient" } });
    return { status: "denied", action: input.action, changed_resources: [], proof: { reason: "role_insufficient" }, user_facing_summary_hint: "Platform operator role required." };
  }
  const changed: string[] = [];
  const proof: Record<string, unknown> = {};
  let summary = "Admin action completed.";

  if (["suspend_employee", "resume_employee", "disable_employee", "mark_needs_reprovision", "revoke_mcp_credentials", "rotate_mcp_credential", "rerun_runtime_health"].includes(input.action) && !input.employee_id) {
    return { status: "failed", action: input.action, changed_resources: [], proof: { reason: "employee_id_required" }, user_facing_summary_hint: "employee_id is required." };
  }

  if (input.action === "suspend_employee") {
    await db.from("employees").update({ status: "suspended" }).eq("id", input.employee_id).eq("account_id", input.account_id);
    const lifecycle = await runEmployeeLifecycleAction("stop", { account_id: input.account_id, employee_id: input.employee_id! });
    proof.lifecycle = lifecycle;
    changed.push(`employee:${input.employee_id}`);
    summary = "Employee suspended.";
  } else if (input.action === "resume_employee") {
    await db.from("employees").update({ status: "live", disabled_at: null }).eq("id", input.employee_id).eq("account_id", input.account_id);
    const lifecycle = await runEmployeeLifecycleAction("restart", { account_id: input.account_id, employee_id: input.employee_id! });
    proof.lifecycle = lifecycle;
    changed.push(`employee:${input.employee_id}`);
    summary = "Employee resumed.";
  } else if (input.action === "disable_employee") {
    if (!input.confirm) return { status: "denied", action: input.action, changed_resources: [], proof: { reason: "confirmation_required" }, user_facing_summary_hint: "Confirmation required." };
    await db.from("employees").update({ status: "retired", disabled_at: nowIso() }).eq("id", input.employee_id).eq("account_id", input.account_id);
    const lifecycle = await runEmployeeLifecycleAction("stop", { account_id: input.account_id, employee_id: input.employee_id! });
    proof.lifecycle = lifecycle;
    changed.push(`employee:${input.employee_id}`);
    summary = "Employee disabled.";
  } else if (input.action === "mark_needs_reprovision") {
    await db.from("employees").update({ needs_reprovision: true }).eq("id", input.employee_id).eq("account_id", input.account_id);
    changed.push(`employee:${input.employee_id}`);
    summary = "Employee marked for reprovisioning.";
  } else if (input.action === "revoke_mcp_credentials" || input.action === "rotate_mcp_credential") {
    await db.from("employee_mcp_credentials").update({ status: "revoked", revoked_at: nowIso(), updated_at: nowIso() }).eq("employee_id", input.employee_id).eq("status", "active");
    changed.push(`mcp_credentials:${input.employee_id}`);
    if (input.action === "rotate_mcp_credential") {
      const minted = await mintEmployeeMcpCredential(db, { account_id: input.account_id, employee_id: input.employee_id! });
      proof.new_credential_id = minted.credential_id;
      proof.token_prefix = minted.token_prefix;
      proof.raw_token_returned = false;
      await db.from("employees").update({ needs_reprovision: true }).eq("id", input.employee_id).eq("account_id", input.account_id);
      changed.push(`mcp_credential:${minted.credential_id}`, `employee:${input.employee_id}`);
      summary = "Scoped MCP credential rotated; reprovision required to render the new token.";
    } else {
      summary = "Active scoped MCP credentials revoked.";
    }
  } else if (input.action === "rerun_runtime_health") {
    const result = await recordRuntimeHealthSnapshots(db, { account_id: input.account_id, employee_id: input.employee_id, runner_type: "admin" });
    proof.runtime_health = result;
    changed.push(`runtime_health:${input.employee_id}`);
    summary = "Runtime health check completed.";
  } else if (input.action === "redeliver_event") {
    const outcome = await runManagerTool("redeliver_employee_event", { event_id: input.event_id, channel: "sms" }, { actor: "manager" });
    if (outcome.kind !== "ok" || outcome.envelope.status !== "ok") {
      proof.tool_status = outcome.kind === "ok" ? outcome.envelope.status : outcome.kind;
      const audit_id = await writeAdminAction(db, actor, { action: input.action, account_id: input.account_id, employee_id: input.employee_id, reason: input.reason, result: "failed", proof });
      return { status: "failed", action: input.action, changed_resources: [], proof, audit_id, user_facing_summary_hint: "Redelivery failed." };
    }
    changed.push(...(outcome.envelope.changed_resources ?? []));
    Object.assign(proof, outcome.envelope.proof ?? {});
    summary = "Event redelivered.";
  } else if (input.action === "suppress_event_source") {
    const outcome = await runManagerTool("suppress_event_source", { account_id: input.account_id, source: input.source, event_type: input.event_type, reason: input.reason, expires_at: input.expires_at }, { actor: "manager" });
    if (outcome.kind !== "ok" || outcome.envelope.status !== "ok") {
      proof.tool_status = outcome.kind === "ok" ? outcome.envelope.status : outcome.kind;
      const audit_id = await writeAdminAction(db, actor, { action: input.action, account_id: input.account_id, employee_id: input.employee_id, reason: input.reason, result: "failed", proof });
      return { status: "failed", action: input.action, changed_resources: [], proof, audit_id, user_facing_summary_hint: "Source suppression failed." };
    }
    changed.push(...(outcome.envelope.changed_resources ?? []));
    Object.assign(proof, outcome.envelope.proof ?? {});
    summary = "Event source suppressed.";
  }

  const audit_id = await writeAdminAction(db, actor, { action: input.action, account_id: input.account_id, employee_id: input.employee_id, reason: input.reason, result: "ok", proof });
  return { status: "ok", action: input.action, changed_resources: changed, proof, audit_id, user_facing_summary_hint: summary };
}
