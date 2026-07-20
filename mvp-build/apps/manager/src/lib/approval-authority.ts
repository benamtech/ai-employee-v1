import type { SupabaseClient } from "@amtech/db";
import {
  ID_PREFIX,
  newId,
  type ApprovalExecutionState,
  type ApprovalResolution,
  type ApprovalRiskLevel,
  type ImmutableApprovalRequestRecord,
  type ProviderCapabilityClass,
} from "@amtech/shared";
import { executeDurableCommandEffect, type DurableEffectApplyResult } from "./durable-command-runtime.js";

export interface ApprovalResourceBinding {
  resource_class: "outbound_email" | "stripe_invoice" | "quickbooks_pending_write";
  resource_id: string;
}

export interface ApprovalAuthorityRow extends ImmutableApprovalRequestRecord {
  summary: string;
  refs: Record<string, string>;
  channel?: string | null;
  snapshot: Record<string, unknown>;
  approval_version: number;
  resolution_channel?: string | null;
  execution_state: ApprovalExecutionState;
}

export interface CreateApprovalAuthorityInput {
  account_id: string;
  employee_id: string;
  assignment_id?: string | null;
  action_key: string;
  summary: string;
  risk_level: ApprovalRiskLevel;
  refs?: Record<string, string>;
  resource_class?: ApprovalResourceBinding["resource_class"];
  resource_id?: string;
  channel?: "sms" | "web" | null;
  expiry_seconds?: number;
}

export interface ResolveApprovalAuthorityInput {
  approval_id: string;
  resolver_principal_id: string;
  resolution: ApprovalResolution;
  channel: "sms" | "web";
  authenticated_by: string;
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

function normalizeApprovalRow(row: Record<string, unknown>): ApprovalAuthorityRow {
  return {
    approval_id: String(row.id ?? row.approval_id ?? ""),
    assignment_id: String(row.assignment_id ?? ""),
    account_id: String(row.account_id ?? ""),
    employee_id: String(row.employee_id ?? ""),
    requester_principal_id: String(row.requester_principal_id ?? ""),
    requester_principal_class: String(row.requester_principal_class ?? "employee") as ApprovalAuthorityRow["requester_principal_class"],
    action_key: String(row.action_key ?? ""),
    resource_class: String(row.resource_class ?? ""),
    resource_id: String(row.resource_id ?? ""),
    snapshot_hash: String(row.snapshot_hash ?? ""),
    policy_version: String(row.policy_version ?? ""),
    required_resolver_roles: Array.isArray(row.required_resolver_roles) ? row.required_resolver_roles.map(String) : [],
    required_resolver_action: String(row.required_resolver_action ?? ""),
    risk_level: String(row.risk_level ?? "medium") as ApprovalRiskLevel,
    expires_at: String(row.expires_at ?? ""),
    status: String(row.status ?? "legacy") as ApprovalAuthorityRow["status"],
    resolution: row.resolution ? String(row.resolution) as ApprovalResolution : null,
    resolved_by_principal_id: row.resolved_by_principal_id ? String(row.resolved_by_principal_id) : null,
    resolved_by_role: row.resolved_by_role ? String(row.resolved_by_role) : null,
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    revoked_at: row.revoked_at ? String(row.revoked_at) : null,
    command_intent_id: String(row.command_intent_id ?? ""),
    command_id: String(row.command_id ?? ""),
    effect_key: String(row.effect_key ?? ""),
    execution_state: String(row.execution_state ?? "not_started") as ApprovalExecutionState,
    execution_receipt_id: row.execution_receipt_id ? String(row.execution_receipt_id) : null,
    summary: String(row.summary ?? ""),
    refs: row.refs && typeof row.refs === "object" ? row.refs as Record<string, string> : {},
    channel: row.channel ? String(row.channel) : null,
    snapshot: row.snapshot && typeof row.snapshot === "object" ? row.snapshot as Record<string, unknown> : {},
    approval_version: Number(row.approval_version ?? 1),
    resolution_channel: row.resolution_channel ? String(row.resolution_channel) : null,
  };
}

export function approvalResourceFromInput(input: Pick<CreateApprovalAuthorityInput, "action_key" | "refs" | "resource_class" | "resource_id">): ApprovalResourceBinding {
  if (input.resource_class && input.resource_id) {
    return { resource_class: input.resource_class, resource_id: input.resource_id };
  }
  const refs = input.refs ?? {};
  if (input.action_key === "send_estimate_email" || input.action_key === "send_email") {
    const id = refs.draft_id ?? refs.outbound_email_id;
    if (!id) throw new Error("approval_email_draft_ref_required");
    return { resource_class: "outbound_email", resource_id: id };
  }
  if (input.action_key === "send_deposit_invoice" || input.action_key === "send_invoice") {
    const id = refs.stripe_invoice_row_id;
    if (!id) throw new Error("approval_stripe_invoice_ref_required");
    return { resource_class: "stripe_invoice", resource_id: id };
  }
  if (input.action_key.startsWith("commit_quickbooks_")) {
    const id = refs.quickbooks_pending_write_id;
    if (!id) throw new Error("approval_quickbooks_write_ref_required");
    return { resource_class: "quickbooks_pending_write", resource_id: id };
  }
  throw new Error(`approval_action_not_supported:${input.action_key}`);
}

async function resolveAssignment(db: SupabaseClient, input: { account_id: string; employee_id: string; assignment_id?: string | null }): Promise<string> {
  if (input.assignment_id) return input.assignment_id;
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
  if (!assignmentId) throw new Error("approval_assignment_not_unique");
  return assignmentId;
}

async function employeePrincipalId(db: SupabaseClient, employeeId: string): Promise<string> {
  const result = await db.from("employee_principals").select("id,status").eq("employee_id", employeeId).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id || result.data.status !== "active") throw new Error("approval_requester_principal_missing");
  return String(result.data.id);
}

async function ensureResourceAssignment(
  db: SupabaseClient,
  resource: ApprovalResourceBinding,
  input: { assignment_id: string; account_id: string; employee_id: string },
): Promise<void> {
  if (resource.resource_class === "outbound_email") {
    const row = await db.from("outbound_emails")
      .select("id,assignment_id,connector_accounts!inner(account_id,employee_id)")
      .eq("id", resource.resource_id)
      .maybeSingle();
    if (row.error) throw row.error;
    const connector = row.data?.connector_accounts as unknown as { account_id?: string; employee_id?: string } | { account_id?: string; employee_id?: string }[] | null;
    const scope = Array.isArray(connector) ? connector[0] : connector;
    if (!row.data?.id || scope?.account_id !== input.account_id || scope?.employee_id !== input.employee_id) {
      throw new Error("approval_resource_wrong_assignment");
    }
    if (row.data.assignment_id && row.data.assignment_id !== input.assignment_id) throw new Error("approval_resource_wrong_assignment");
    if (!row.data.assignment_id) {
      const update = await db.from("outbound_emails").update({ assignment_id: input.assignment_id }).eq("id", resource.resource_id).is("assignment_id", null);
      if (update.error) throw update.error;
    }
    return;
  }
  if (resource.resource_class === "stripe_invoice") {
    const row = await db.from("stripe_invoices")
      .select("id,assignment_id,stripe_connections!inner(account_id,employee_id)")
      .eq("id", resource.resource_id)
      .maybeSingle();
    if (row.error) throw row.error;
    const connection = row.data?.stripe_connections as unknown as { account_id?: string; employee_id?: string } | { account_id?: string; employee_id?: string }[] | null;
    const scope = Array.isArray(connection) ? connection[0] : connection;
    if (!row.data?.id || scope?.account_id !== input.account_id || scope?.employee_id !== input.employee_id) {
      throw new Error("approval_resource_wrong_assignment");
    }
    if (row.data.assignment_id && row.data.assignment_id !== input.assignment_id) throw new Error("approval_resource_wrong_assignment");
    if (!row.data.assignment_id) {
      const update = await db.from("stripe_invoices").update({ assignment_id: input.assignment_id }).eq("id", resource.resource_id).is("assignment_id", null);
      if (update.error) throw update.error;
    }
    return;
  }
  const row = await db.from("quickbooks_pending_writes")
    .select("id,assignment_id,account_id,employee_id")
    .eq("id", resource.resource_id)
    .maybeSingle();
  if (row.error) throw row.error;
  if (!row.data?.id || row.data.account_id !== input.account_id || row.data.employee_id !== input.employee_id) {
    throw new Error("approval_resource_wrong_assignment");
  }
  if (row.data.assignment_id && row.data.assignment_id !== input.assignment_id) throw new Error("approval_resource_wrong_assignment");
  if (!row.data.assignment_id) {
    const update = await db.from("quickbooks_pending_writes").update({ assignment_id: input.assignment_id }).eq("id", resource.resource_id).is("assignment_id", null);
    if (update.error) throw update.error;
  }
}

export async function loadApprovalSnapshot(
  db: SupabaseClient,
  input: { assignment_id: string; action_key: string; resource_class: string; resource_id: string },
): Promise<{ snapshot: Record<string, unknown>; snapshot_hash: string }> {
  const snapshotResult = await db.rpc("amtech_approval_snapshot", {
    p_assignment_id: input.assignment_id,
    p_action_key: input.action_key,
    p_resource_class: input.resource_class,
    p_resource_id: input.resource_id,
  });
  if (snapshotResult.error) throw snapshotResult.error;
  const snapshot = firstRow<Record<string, unknown>>(snapshotResult.data) ?? snapshotResult.data as Record<string, unknown>;
  if (!snapshot || typeof snapshot !== "object") throw new Error("approval_snapshot_missing");
  const hashResult = await db.rpc("amtech_approval_snapshot_hash", { p_snapshot: snapshot });
  if (hashResult.error) throw hashResult.error;
  const snapshotHash = typeof hashResult.data === "string"
    ? hashResult.data
    : Array.isArray(hashResult.data)
      ? String(hashResult.data[0] ?? "")
      : String(hashResult.data ?? "");
  if (!/^sha256:[0-9a-f]{64}$/.test(snapshotHash)) throw new Error("approval_snapshot_hash_invalid");
  return { snapshot, snapshot_hash: snapshotHash };
}

export async function createApprovalAuthorityRequest(
  db: SupabaseClient,
  input: CreateApprovalAuthorityInput,
): Promise<ApprovalAuthorityRow> {
  const assignmentId = await resolveAssignment(db, input);
  const requesterPrincipalId = await employeePrincipalId(db, input.employee_id);
  const resource = approvalResourceFromInput(input);
  await ensureResourceAssignment(db, resource, {
    assignment_id: assignmentId,
    account_id: input.account_id,
    employee_id: input.employee_id,
  });
  const approvalId = newId(ID_PREFIX.approval);
  const commandIntentId = newId(ID_PREFIX.commandIntent);
  const commandId = newId(ID_PREFIX.durableCommand);
  const effectKey = `approval:${approvalId}:${input.action_key}`;
  const ttlSeconds = Math.max(60, Math.min(input.expiry_seconds ?? 24 * 60 * 60, 7 * 24 * 60 * 60));
  const result = await db.rpc("create_approval_authority_request", {
    p_approval_id: approvalId,
    p_account_id: input.account_id,
    p_employee_id: input.employee_id,
    p_assignment_id: assignmentId,
    p_requester_principal_id: requesterPrincipalId,
    p_requester_principal_class: "employee",
    p_action_key: input.action_key,
    p_resource_class: resource.resource_class,
    p_resource_id: resource.resource_id,
    p_summary: input.summary,
    p_risk_level: input.risk_level,
    p_channel: input.channel ?? null,
    p_expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    p_command_intent_id: commandIntentId,
    p_command_id: commandId,
    p_effect_key: effectKey,
  });
  if (result.error) throw result.error;
  const row = firstRow<Record<string, unknown>>(result.data);
  if (!row) throw new Error("approval_request_not_persisted");
  return normalizeApprovalRow(row);
}

export async function loadApprovalAuthority(db: SupabaseClient, approvalId: string): Promise<ApprovalAuthorityRow | null> {
  const result = await db.from("approvals").select("*").eq("id", approvalId).maybeSingle();
  if (result.error) throw result.error;
  return result.data ? normalizeApprovalRow(result.data as Record<string, unknown>) : null;
}

export async function resolveHumanPrincipalForUser(db: SupabaseClient, userId: string): Promise<string> {
  const result = await db.from("human_principals").select("id,status").eq("user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id || result.data.status !== "active") throw new Error("approval_human_principal_missing");
  return String(result.data.id);
}

export async function resolveApprovalAuthority(
  db: SupabaseClient,
  input: ResolveApprovalAuthorityInput,
): Promise<{ approval: ApprovalAuthorityRow; duplicate: boolean }> {
  const approval = await loadApprovalAuthority(db, input.approval_id);
  if (!approval) throw new Error("approval_not_found");
  const current = await loadApprovalSnapshot(db, {
    assignment_id: approval.assignment_id,
    action_key: approval.action_key,
    resource_class: approval.resource_class,
    resource_id: approval.resource_id,
  });
  const result = await db.rpc("resolve_approval_authority", {
    p_approval_id: input.approval_id,
    p_resolver_principal_id: input.resolver_principal_id,
    p_resolution: input.resolution,
    p_channel: input.channel,
    p_current_snapshot_hash: current.snapshot_hash,
    p_authenticated_by: input.authenticated_by,
  });
  if (result.error) throw result.error;
  const resolved = await loadApprovalAuthority(db, input.approval_id);
  if (!resolved) throw new Error("approval_resolution_missing");
  const response = firstRow<Record<string, unknown>>(result.data);
  return { approval: resolved, duplicate: Boolean(response?.duplicate) };
}

export async function assertApprovedActionExecution(
  db: SupabaseClient,
  input: { approval_id: string; action_key: string; resource_class: string; resource_id: string },
): Promise<ApprovalAuthorityRow> {
  const approval = await loadApprovalAuthority(db, input.approval_id);
  if (!approval) throw new Error("approval_not_found");
  const current = await loadApprovalSnapshot(db, {
    assignment_id: approval.assignment_id,
    action_key: input.action_key,
    resource_class: input.resource_class,
    resource_id: input.resource_id,
  });
  const result = await db.rpc("assert_approved_action_execution", {
    p_approval_id: input.approval_id,
    p_action_key: input.action_key,
    p_resource_class: input.resource_class,
    p_resource_id: input.resource_id,
    p_current_snapshot_hash: current.snapshot_hash,
  });
  if (result.error) throw result.error;
  const row = firstRow<Record<string, unknown>>(result.data);
  if (!row) throw new Error("approval_execution_not_authorized");
  return normalizeApprovalRow(row);
}

async function syncApprovalReceipt(db: SupabaseClient, approval: ApprovalAuthorityRow): Promise<void> {
  const receipt = await db.from("effect_receipts")
    .select("id")
    .eq("command_id", approval.command_id)
    .eq("effect_key", approval.effect_key)
    .maybeSingle();
  if (receipt.error) throw receipt.error;
  if (!receipt.data?.id) return;
  const recorded = await db.rpc("record_approval_execution_receipt", {
    p_approval_id: approval.approval_id,
    p_receipt_id: String(receipt.data.id),
  });
  if (recorded.error) throw recorded.error;
}

export async function executeApprovedAction<T>(
  db: SupabaseClient,
  input: {
    approval_id: string;
    action_key: string;
    resource_class: string;
    resource_id: string;
    provider: string;
    operation: string;
    capability_class: ProviderCapabilityClass;
    request: Record<string, unknown>;
    provider_idempotency_key?: string | null;
    apply: () => Promise<DurableEffectApplyResult<T>>;
  },
): Promise<{ result: T; replayed: boolean; receipt_id: string; approval: ApprovalAuthorityRow }> {
  const approval = await assertApprovedActionExecution(db, input);
  try {
    const execution = await executeDurableCommandEffect<T>(db, {
      assignment_id: approval.assignment_id,
      command_id: approval.command_id,
      effect_key: approval.effect_key,
      provider: input.provider,
      operation: input.operation,
      capability_class: input.capability_class,
      request: {
        approval_id: approval.approval_id,
        approval_snapshot_hash: approval.snapshot_hash,
        action_key: approval.action_key,
        resource_class: approval.resource_class,
        resource_id: approval.resource_id,
        ...input.request,
      },
      provider_idempotency_key: input.provider_idempotency_key ?? null,
      apply: input.apply,
    });
    const recorded = await db.rpc("record_approval_execution_receipt", {
      p_approval_id: approval.approval_id,
      p_receipt_id: execution.receipt_id,
    });
    if (recorded.error) throw recorded.error;
    return {
      result: execution.result,
      replayed: execution.replayed,
      receipt_id: execution.receipt_id,
      approval: (await loadApprovalAuthority(db, approval.approval_id)) ?? approval,
    };
  } catch (error) {
    await syncApprovalReceipt(db, approval).catch(() => {});
    throw error;
  }
}
