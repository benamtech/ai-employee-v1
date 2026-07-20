import { failed, type ToolName } from "@amtech/shared";
import type { ToolHandler } from "./types.js";
import { qboTools } from "./qbo.stub.js";
import { promoteLegacyApprovalAuthority } from "../lib/approval-promotion.js";
import { writeAudit } from "../lib/audit.js";

const previewNames = ["create_expense", "create_bill", "create_invoice", "create_payment"] as const;
type PreviewName = (typeof previewNames)[number];

function promotedPreview(name: PreviewName): ToolHandler {
  const legacy = qboTools[name];
  if (!legacy) throw new Error(`missing_qbo_preview_handler:${name}`);
  return async (ctx, raw) => {
    const envelope = await legacy(ctx, raw);
    if (envelope.status !== "needs_confirmation") return envelope;
    const approvalId = String(envelope.proof.approval_id ?? envelope.required_confirmation?.approval_id ?? "");
    const pendingWriteId = String(envelope.proof.quickbooks_pending_write_id ?? envelope.required_confirmation?.refs?.quickbooks_pending_write_id ?? "");
    const actionKey = String(envelope.required_confirmation?.action_key ?? "");
    if (!approvalId || !pendingWriteId || !actionKey || !envelope.account_id || !envelope.employee_id) {
      return failed("validation_failed", "QuickBooks preview did not produce a promotable approval binding.", {
        account_id: envelope.account_id,
        employee_id: envelope.employee_id,
        audit_id: envelope.audit_id,
      });
    }
    try {
      const legacyRow = await ctx.db.from("approvals").select("expires_at,channel").eq("id", approvalId).maybeSingle();
      if (legacyRow.error) throw legacyRow.error;
      const approval = await promoteLegacyApprovalAuthority(ctx.db, {
        approval_id: approvalId,
        account_id: envelope.account_id,
        employee_id: envelope.employee_id,
        action_key: actionKey,
        resource_class: "quickbooks_pending_write",
        resource_id: pendingWriteId,
        summary: envelope.required_confirmation?.summary ?? envelope.user_facing_summary_hint,
        risk_level: "high",
        channel: legacyRow.data?.channel ?? null,
        expires_at: String(legacyRow.data?.expires_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
      });
      return {
        ...envelope,
        assignment_id: approval.assignment_id,
        proof: {
          ...envelope.proof,
          assignment_id: approval.assignment_id,
          approval_id: approval.approval_id,
          snapshot_hash: approval.snapshot_hash,
          policy_version: approval.policy_version,
          command_id: approval.command_id,
          effect_key: approval.effect_key,
        },
        next_suggested_action: "Wait for an authorized human to approve this immutable QuickBooks snapshot, then commit it through the registered command.",
      };
    } catch (error) {
      const reason = String((error as Error)?.message ?? error);
      const audit_id = await writeAudit(ctx.db, {
        account_id: envelope.account_id,
        employee_id: envelope.employee_id,
        assignment_id: ctx.assignment_id ?? null,
        actor: ctx.actor,
        action: `tool:${name}:promote_approval`,
        resource: pendingWriteId,
        result: "failed",
        details: { approval_id: approvalId, reason },
      });
      return failed("validation_failed", "QuickBooks preview was staged, but its approval could not be promoted to the S7 authority protocol.", {
        account_id: envelope.account_id,
        employee_id: envelope.employee_id,
        assignment_id: ctx.assignment_id ?? null,
        audit_id,
        proof: { approval_id: approvalId, pending_write_id: pendingWriteId, failure_reason: reason },
      });
    }
  };
}

export const qboApprovalPromotionTools: Partial<Record<ToolName, ToolHandler>> = Object.fromEntries(
  previewNames.map((name) => [name, promotedPreview(name)]),
) as Partial<Record<ToolName, ToolHandler>>;
