import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId, type ApprovalRiskLevel } from "@amtech/shared";
import { loadApprovalAuthority, type ApprovalAuthorityRow } from "./approval-authority.js";

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

async function resolveAssignment(db: SupabaseClient, accountId: string, employeeId: string): Promise<string> {
  const result = await db.rpc("amtech_default_assignment_for_employee_account", {
    p_employee_id: employeeId,
    p_account_id: accountId,
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

async function requesterPrincipal(db: SupabaseClient, employeeId: string): Promise<string> {
  const result = await db.from("employee_principals").select("id,status").eq("employee_id", employeeId).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data?.id || result.data.status !== "active") throw new Error("approval_requester_principal_missing");
  return String(result.data.id);
}

export async function promoteLegacyApprovalAuthority(
  db: SupabaseClient,
  input: {
    approval_id: string;
    account_id: string;
    employee_id: string;
    action_key: string;
    resource_class: "quickbooks_pending_write";
    resource_id: string;
    summary: string;
    risk_level: ApprovalRiskLevel;
    channel?: "sms" | "web" | null;
    expires_at: string;
  },
): Promise<ApprovalAuthorityRow> {
  const assignmentId = await resolveAssignment(db, input.account_id, input.employee_id);
  const principalId = await requesterPrincipal(db, input.employee_id);
  const resource = await db.from("quickbooks_pending_writes")
    .select("id,assignment_id,account_id,employee_id")
    .eq("id", input.resource_id)
    .maybeSingle();
  if (resource.error) throw resource.error;
  if (!resource.data?.id || resource.data.account_id !== input.account_id || resource.data.employee_id !== input.employee_id) {
    throw new Error("approval_resource_wrong_assignment");
  }
  if (resource.data.assignment_id && resource.data.assignment_id !== assignmentId) throw new Error("approval_resource_wrong_assignment");
  if (!resource.data.assignment_id) {
    const update = await db.from("quickbooks_pending_writes")
      .update({ assignment_id: assignmentId })
      .eq("id", input.resource_id)
      .is("assignment_id", null);
    if (update.error) throw update.error;
  }

  const result = await db.rpc("promote_legacy_approval_authority_request", {
    p_approval_id: input.approval_id,
    p_account_id: input.account_id,
    p_employee_id: input.employee_id,
    p_assignment_id: assignmentId,
    p_requester_principal_id: principalId,
    p_requester_principal_class: "employee",
    p_action_key: input.action_key,
    p_resource_class: input.resource_class,
    p_resource_id: input.resource_id,
    p_summary: input.summary,
    p_risk_level: input.risk_level,
    p_channel: input.channel ?? null,
    p_expires_at: input.expires_at,
    p_command_intent_id: newId(ID_PREFIX.commandIntent),
    p_command_id: newId(ID_PREFIX.durableCommand),
    p_effect_key: `approval:${input.approval_id}:${input.action_key}`,
  });
  if (result.error) throw result.error;
  if (!firstRow<Record<string, unknown>>(result.data)) throw new Error("approval_promotion_not_persisted");
  const approval = await loadApprovalAuthority(db, input.approval_id);
  if (!approval) throw new Error("approval_promotion_missing");
  return approval;
}
