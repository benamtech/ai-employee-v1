import {
  failed,
  needsConfirmation,
  ok,
  type ApprovalRiskLevel,
  type ToolName,
} from "@amtech/shared";
import type { ToolContext, ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import {
  createApprovalAuthorityRequest,
  loadApprovalAuthority,
  resolveApprovalAuthority,
  type ApprovalResourceBinding,
} from "../lib/approval-authority.js";

interface RequestApprovalAuthorityInput {
  account_id: string;
  employee_id: string;
  action_key: string;
  summary: string;
  risk_level: ApprovalRiskLevel;
  refs?: Record<string, string>;
  resource_class?: ApprovalResourceBinding["resource_class"];
  resource_id?: string;
  channel?: "sms" | "web";
  expiry_seconds?: number;
}

interface ResolveApprovalAuthorityToolInput {
  account_id: string;
  employee_id: string;
  approval_id: string;
  owner_response: "approved" | "rejected" | "yes" | "no";
  channel?: "sms" | "web";
}

function normalizedResolution(value: string): "approved" | "rejected" | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "approved" || normalized === "yes") return "approved";
  if (normalized === "rejected" || normalized === "no") return "rejected";
  return null;
}

const requestApproval: ToolHandler = async (ctx, raw) => {
  const input = raw as RequestApprovalAuthorityInput;
  if (!input?.account_id || !input?.employee_id || !input?.action_key || !input?.summary || !input?.risk_level) {
    return failed("validation_failed", "account_id, employee_id, action_key, summary, and risk_level are required.");
  }
  try {
    const approval = await createApprovalAuthorityRequest(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      action_key: input.action_key,
      summary: input.summary,
      risk_level: input.risk_level,
      refs: input.refs ?? {},
      resource_class: input.resource_class,
      resource_id: input.resource_id,
      channel: input.channel ?? null,
      expiry_seconds: input.expiry_seconds,
    });
    const audit_id = await writeAudit(ctx.db, {
      account_id: approval.account_id,
      employee_id: approval.employee_id,
      assignment_id: approval.assignment_id,
      actor: ctx.actor,
      action: "tool:request_approval",
      resource: approval.approval_id,
      result: "needs_confirmation",
      details: {
        action_key: approval.action_key,
        resource_class: approval.resource_class,
        resource_id: approval.resource_id,
        snapshot_hash: approval.snapshot_hash,
        policy_version: approval.policy_version,
        required_resolver_roles: approval.required_resolver_roles,
        command_id: approval.command_id,
        effect_key: approval.effect_key,
      },
    });
    return needsConfirmation({
      action_key: approval.action_key,
      summary: approval.summary,
      risk_level: approval.risk_level === "critical" ? "high" : approval.risk_level,
      refs: { ...approval.refs, resource_class: approval.resource_class, resource_id: approval.resource_id },
      approval_id: approval.approval_id,
    }, {
      account_id: approval.account_id,
      employee_id: approval.employee_id,
      assignment_id: approval.assignment_id,
      changed_resources: [`approval:${approval.approval_id}`],
      proof: {
        approval_id: approval.approval_id,
        assignment_id: approval.assignment_id,
        snapshot_hash: approval.snapshot_hash,
        policy_version: approval.policy_version,
        command_id: approval.command_id,
        effect_key: approval.effect_key,
        expires_at: approval.expires_at,
      },
      user_facing_summary_hint: approval.summary,
      next_suggested_action: "Wait for an authorized human resolver to approve or reject this exact snapshot.",
      audit_id,
    });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: "tool:request_approval",
      result: message.includes("wrong_assignment") || message.includes("not_unique") ? "denied" : "failed",
      details: { reason: message },
    });
    return failed(
      message.includes("wrong_assignment") || message.includes("not_unique") ? "unauthorized" : "validation_failed",
      "Could not create an immutable approval request for that resource.",
      { account_id: input.account_id, employee_id: input.employee_id, assignment_id: ctx.assignment_id ?? null, audit_id },
    );
  }
};

const resolveApproval: ToolHandler = async (ctx, raw) => {
  const input = raw as ResolveApprovalAuthorityToolInput;
  const resolution = normalizedResolution(String(input?.owner_response ?? ""));
  if (!input?.account_id || !input?.employee_id || !input?.approval_id || !resolution) {
    return failed("validation_failed", "account_id, employee_id, approval_id, and approved/rejected owner_response are required.");
  }
  if (ctx.actor === "employee" || ctx.principal_class !== "human" || !ctx.principal_id) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      resource: input.approval_id,
      result: "denied",
      details: { reason: "authenticated_human_principal_required" },
    });
    return failed("unauthorized", "Approval resolution requires a current authenticated human principal.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      audit_id,
    });
  }
  try {
    const existing = await loadApprovalAuthority(ctx.db, input.approval_id);
    if (!existing || existing.account_id !== input.account_id || existing.employee_id !== input.employee_id) {
      throw new Error("approval_not_found_or_wrong_assignment");
    }
    if (ctx.assignment_id && existing.assignment_id !== ctx.assignment_id) throw new Error("approval_wrong_assignment");
    const resolved = await resolveApprovalAuthority(ctx.db, {
      approval_id: input.approval_id,
      resolver_principal_id: ctx.principal_id,
      resolution,
      channel: input.channel ?? "web",
      authenticated_by: ctx.authenticated_by ?? "manager:human-principal",
    });
    const approval = resolved.approval;
    const audit_id = await writeAudit(ctx.db, {
      account_id: approval.account_id,
      employee_id: approval.employee_id,
      assignment_id: approval.assignment_id,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      resource: approval.approval_id,
      result: "ok",
      details: {
        resolution,
        resolver_principal_id: ctx.principal_id,
        resolver_role: approval.resolved_by_role ?? null,
        snapshot_hash: approval.snapshot_hash,
        command_id: resolution === "approved" ? approval.command_id : null,
        duplicate: resolved.duplicate,
      },
    });
    return ok({
      account_id: approval.account_id,
      employee_id: approval.employee_id,
      assignment_id: approval.assignment_id,
      changed_resources: [`approval:${approval.approval_id}`],
      proof: {
        approval_id: approval.approval_id,
        resolution,
        resolver_principal_id: ctx.principal_id,
        resolver_role: approval.resolved_by_role ?? null,
        snapshot_hash: approval.snapshot_hash,
        command_id: resolution === "approved" ? approval.command_id : null,
        effect_key: resolution === "approved" ? approval.effect_key : null,
        duplicate: resolved.duplicate,
      },
      user_facing_summary_hint: `Approval ${resolution}.`,
      next_suggested_action: resolution === "approved"
        ? "Execute only the immutable approved resource through its registered command."
        : "Do not perform the rejected action.",
      audit_id,
    });
  } catch (error) {
    const reason = String((error as Error)?.message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: "tool:resolve_approval",
      resource: input.approval_id,
      result: "denied",
      details: { reason, resolver_principal_id: ctx.principal_id },
    });
    return failed("unauthorized", "Approval resolution was denied by the current assignment authority policy.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      audit_id,
      proof: { denial_reason: reason },
    });
  }
};

const getApprovalStatus: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; approval_id: string };
  if (!input?.account_id || !input?.employee_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, and approval_id are required.");
  }
  const approval = await loadApprovalAuthority(ctx.db, input.approval_id);
  if (!approval || approval.account_id !== input.account_id || approval.employee_id !== input.employee_id) {
    return failed("validation_failed", "Approval not found.", { account_id: input.account_id, employee_id: input.employee_id });
  }
  if (ctx.assignment_id && approval.assignment_id !== ctx.assignment_id) {
    return failed("unauthorized", "Approval is outside this assignment.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id,
    });
  }
  const audit_id = await writeAudit(ctx.db, {
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    assignment_id: approval.assignment_id,
    actor: ctx.actor,
    action: "tool:get_approval_status",
    resource: approval.approval_id,
    result: "ok",
    details: { status: approval.status, resolution: approval.resolution, execution_state: approval.execution_state },
  });
  return ok({
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    assignment_id: approval.assignment_id,
    proof: {
      approval_id: approval.approval_id,
      status: approval.status,
      resolution: approval.resolution ?? null,
      action_key: approval.action_key,
      resource_class: approval.resource_class,
      resource_id: approval.resource_id,
      snapshot_hash: approval.snapshot_hash,
      policy_version: approval.policy_version,
      execution_state: approval.execution_state,
      execution_receipt_id: approval.execution_receipt_id ?? null,
      expires_at: approval.expires_at,
    },
    user_facing_summary_hint: approval.resolution
      ? `Approval ${approval.resolution}; execution is ${approval.execution_state}.`
      : "Approval is pending an authorized human decision.",
    audit_id,
  });
};

export const approvalAuthorityTools: Partial<Record<ToolName, ToolHandler>> = {
  request_approval: requestApproval,
  resolve_approval: resolveApproval,
  get_approval_status: getApprovalStatus,
};
