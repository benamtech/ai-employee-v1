import {
  ID_PREFIX,
  failed,
  needsConfirmation,
  newId,
  type ApprovalRiskLevel,
} from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { approvalAuthorityTools } from "./approval-authority.stub.js";
import { writeAudit } from "../lib/audit.js";

interface ArtifactApprovalInput {
  account_id: string;
  employee_id: string;
  action_key: string;
  summary: string;
  risk_level: ApprovalRiskLevel;
  refs?: Record<string, string>;
  resource_class?: string;
  resource_id?: string;
  channel?: "sms" | "web";
  expiry_seconds?: number;
}

function scalarString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

async function requestArtifactApproval(ctx: Parameters<ToolHandler>[0], input: ArtifactApprovalInput) {
  if (!ctx.assignment_id) return failed("unauthorized", "Artifact approval requires an assignment-bound employee principal.", {
    account_id: input.account_id,
    employee_id: input.employee_id,
  });
  const artifactId = input.resource_id ?? input.refs?.artifact_id;
  if (!artifactId) return failed("validation_failed", "artifact_id is required for artifact publish approval.", {
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: ctx.assignment_id,
  });

  const [assignment, principal, artifact] = await Promise.all([
    ctx.db.from("employee_assignments")
      .select("id,account_id,employee_principal_id,policy_version,status,starts_at,ends_at")
      .eq("id", ctx.assignment_id)
      .eq("account_id", input.account_id)
      .maybeSingle(),
    ctx.db.from("employee_principals")
      .select("id,employee_id,status")
      .eq("employee_id", input.employee_id)
      .maybeSingle(),
    ctx.db.from("artifacts")
      .select("id,assignment_id,account_id,employee_id,current_revision_id,validation_status")
      .eq("id", artifactId)
      .eq("assignment_id", ctx.assignment_id)
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .maybeSingle(),
  ]);
  if (assignment.error) throw assignment.error;
  if (principal.error) throw principal.error;
  if (artifact.error) throw artifact.error;
  if (!assignment.data?.id || assignment.data.status !== "active" || !principal.data?.id || principal.data.status !== "active" || assignment.data.employee_principal_id !== principal.data.id) {
    return failed("unauthorized", "Artifact approval requester is not the current assignment employee.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id,
    });
  }
  if (!artifact.data?.id || !artifact.data.current_revision_id || artifact.data.validation_status !== "passed") {
    return failed("validation_failed", "The current artifact revision must exist and pass validation before publish approval.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id,
      proof: { artifact_id: artifactId, validation_status: artifact.data?.validation_status ?? null },
    });
  }

  const approvalId = newId(ID_PREFIX.approval);
  const commandIntentId = newId(ID_PREFIX.commandIntent);
  const commandId = newId(ID_PREFIX.durableCommand);
  const effectKey = `approval:${approvalId}:publish_artifact_sandbox`;
  const ttlSeconds = Math.max(60, Math.min(input.expiry_seconds ?? 24 * 60 * 60, 7 * 24 * 60 * 60));
  const result = await ctx.db.rpc("create_approval_authority_request", {
    p_approval_id: approvalId,
    p_account_id: input.account_id,
    p_employee_id: input.employee_id,
    p_assignment_id: ctx.assignment_id,
    p_requester_principal_id: principal.data.id,
    p_requester_principal_class: "employee",
    p_action_key: "publish_artifact_sandbox",
    p_resource_class: "artifact",
    p_resource_id: artifactId,
    p_summary: input.summary,
    p_risk_level: input.risk_level,
    p_channel: input.channel ?? null,
    p_expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    p_command_intent_id: commandIntentId,
    p_command_id: commandId,
    p_effect_key: effectKey,
  });
  if (result.error) throw result.error;
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row || typeof row !== "object") throw new Error("artifact_approval_request_not_persisted");
  const approval = row as Record<string, unknown>;
  const snapshotHash = scalarString(approval.snapshot_hash);
  const expiresAt = scalarString(approval.expires_at);
  const policyVersion = scalarString(assignment.data.policy_version);
  const audit_id = await writeAudit(ctx.db, {
    assignment_id: ctx.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    actor: ctx.actor,
    action: "tool:request_approval",
    resource: approvalId,
    result: "needs_confirmation",
    details: {
      action_key: "publish_artifact_sandbox",
      resource_class: "artifact",
      resource_id: artifactId,
      current_revision_id: artifact.data.current_revision_id,
      snapshot_hash: snapshotHash,
      command_id: commandId,
      effect_key: effectKey,
    },
  });
  return needsConfirmation({
    action_key: "publish_artifact_sandbox",
    summary: input.summary,
    risk_level: input.risk_level === "critical" ? "high" : input.risk_level,
    refs: { ...(input.refs ?? {}), artifact_id: artifactId, resource_class: "artifact", resource_id: artifactId },
    approval_id: approvalId,
  }, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: ctx.assignment_id,
    changed_resources: [`approval:${approvalId}`, `artifact:${artifactId}`],
    proof: {
      approval_id: approvalId,
      artifact_id: artifactId,
      current_revision_id: String(artifact.data.current_revision_id),
      snapshot_hash: snapshotHash,
      policy_version: policyVersion,
      command_id: commandId,
      effect_key: effectKey,
      expires_at: expiresAt,
    },
    user_facing_summary_hint: input.summary,
    next_suggested_action: "Wait for an authorized human to approve the exact validated artifact revision.",
    audit_id,
  });
}

/** Preserve the canonical approval handler for every existing resource and extend
 * only the artifact publish action through the same DB snapshot/command protocol. */
export const requestApprovalWithArtifactSupport: ToolHandler = async (ctx, raw) => {
  const input = raw as ArtifactApprovalInput;
  const artifactRequest = input.action_key === "publish_artifact_sandbox" || input.resource_class === "artifact";
  if (!artifactRequest) {
    const canonical = approvalAuthorityTools.request_approval;
    if (!canonical) return failed("provider_error", "Approval handler is unavailable.");
    return canonical(ctx, raw);
  }
  if (!input.account_id || !input.employee_id || !input.summary || !input.risk_level) {
    return failed("validation_failed", "account_id, employee_id, summary, and risk_level are required.");
  }
  try {
    return await requestArtifactApproval(ctx, input);
  } catch (error) {
    const message = String((error as Error).message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:request_approval",
      result: "failed",
      details: { action_key: "publish_artifact_sandbox", reason: message },
    });
    return failed("validation_failed", "Could not create an immutable approval request for this artifact revision.", {
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      audit_id,
      proof: { failure_reason: message },
    });
  }
};
