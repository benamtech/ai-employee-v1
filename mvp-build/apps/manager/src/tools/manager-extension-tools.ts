import { z } from "zod";
import { failed, ok } from "@amtech/shared";
import type { ToolContext, ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { resolveOwnerChannelDecision } from "../lib/channel-decisions.js";

export const MANAGER_EXTENSION_TOOL_NAMES = [
  "resolve_owner_channel_decision",
] as const;

export type ManagerExtensionToolName = (typeof MANAGER_EXTENSION_TOOL_NAMES)[number];

const SCHEMAS: Record<ManagerExtensionToolName, z.ZodTypeAny> = {
  resolve_owner_channel_decision: z.object({
    account_id: z.string().min(1),
    employee_id: z.string().min(1),
    owner_message_id: z.string().min(1),
    decision_context_id: z.string().min(1),
    approval_id: z.string().min(1),
    resolution: z.enum(["approved", "rejected"]),
    interpretation: z.string().max(500).optional(),
  }).strict(),
};

export function isManagerExtensionToolName(value: string): value is ManagerExtensionToolName {
  return (MANAGER_EXTENSION_TOOL_NAMES as readonly string[]).includes(value);
}

export function getManagerExtensionToolSchema(name: string): z.ZodTypeAny | null {
  return isManagerExtensionToolName(name) ? SCHEMAS[name] : null;
}

function optionalScalar(value: unknown): string | null {
  if (typeof value === "string") return value || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

const resolveOwnerDecision: ToolHandler = async (ctx: ToolContext, raw: unknown) => {
  const input = raw as {
    account_id: string;
    employee_id: string;
    owner_message_id: string;
    decision_context_id: string;
    approval_id: string;
    resolution: "approved" | "rejected";
    interpretation?: string;
  };
  if (ctx.actor !== "employee" || ctx.principal_class !== "employee" || !ctx.assignment_id || !ctx.principal_id) {
    return failed("unauthorized", "Only the bound employee runtime may translate its owner conversation into a channel decision.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
    });
  }

  try {
    const resolved = await resolveOwnerChannelDecision(ctx.db, input);
    const resolvedAssignmentId = String(resolved.assignment_id ?? "");
    if (!resolvedAssignmentId || resolvedAssignmentId !== ctx.assignment_id) {
      throw new Error("channel_decision_runtime_assignment_mismatch");
    }
    const resolverRole = optionalScalar(resolved.resolver_role);
    const commandId = input.resolution === "approved" ? optionalScalar(resolved.command_id) : null;
    const effectKey = input.resolution === "approved" ? optionalScalar(resolved.effect_key) : null;
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:resolve_owner_channel_decision",
      resource: input.approval_id,
      result: "ok",
      details: {
        resolution: input.resolution,
        owner_message_id: input.owner_message_id,
        decision_context_id: input.decision_context_id,
        resolver_role: resolverRole,
        duplicate: Boolean(resolved.duplicate),
        interpretation: input.interpretation?.slice(0, 300) ?? null,
        natural_language_interpreted_by: "hermes",
      },
    });
    return ok({
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id,
      changed_resources: [
        `approval:${input.approval_id}`,
        `channel_decision_context:${input.decision_context_id}`,
        `employee_message:${input.owner_message_id}`,
      ],
      proof: {
        approval_id: input.approval_id,
        resolution: input.resolution,
        owner_message_id: input.owner_message_id,
        decision_context_id: input.decision_context_id,
        resolver_role: resolverRole,
        command_id: commandId,
        effect_key: effectKey,
        duplicate: Boolean(resolved.duplicate),
      },
      user_facing_summary_hint: input.resolution === "approved"
        ? "Your approval was recorded. I can continue with the exact held action."
        : "Your rejection was recorded. I will not perform the held action.",
      next_suggested_action: input.resolution === "approved"
        ? "Continue only the exact workflow covered by this approval."
        : "Offer a safe revision or alternative if the owner asked for one.",
      audit_id,
    });
  } catch (error) {
    const reason = String((error as Error)?.message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      assignment_id: ctx.assignment_id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      actor: ctx.actor,
      action: "tool:resolve_owner_channel_decision",
      resource: input.approval_id,
      result: "denied",
      details: {
        reason,
        owner_message_id: input.owner_message_id,
        decision_context_id: input.decision_context_id,
      },
    });
    return failed("unauthorized", "That reply could not be proven against the current approval context. Ask one concise clarifying question instead.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id,
      proof: { denial_reason: reason },
      audit_id,
    });
  }
};

export const managerExtensionTools: Record<ManagerExtensionToolName, ToolHandler> = {
  resolve_owner_channel_decision: resolveOwnerDecision,
};
