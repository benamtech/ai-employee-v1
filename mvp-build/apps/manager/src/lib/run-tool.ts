/**
 * Single dispatch path for Manager tools, shared by every transport. Authenticated
 * principal context is supplied by the transport that actually verified it; the
 * dispatcher never rediscovers authority from an unrelated active link or from
 * model-controlled input.
 */
import { getToolSchema, failed, type ToolEnvelope, type ToolName } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";

export const SCHEDULER_ONLY_TOOLS = new Set<ToolName>([
  "dispatch_due_reminders",
  "dispatch_daily_briefs",
  "renew_expiring_watches",
]);

export type RunToolOutcome =
  | { kind: "unknown_tool" }
  | { kind: "scheduler_only" }
  | { kind: "invalid_input"; envelope: ToolEnvelope }
  | { kind: "ok"; envelope: ToolEnvelope };

export interface RunManagerToolOptions {
  actor?: ToolContext["actor"];
  assignment_id?: string | null;
  principal_id?: string | null;
  principal_class?: ToolContext["principal_class"];
  authenticated_by?: string | null;
}

export async function runManagerTool(
  name: ToolName,
  rawInput: unknown,
  opts: RunManagerToolOptions = {},
): Promise<RunToolOutcome> {
  if (SCHEDULER_ONLY_TOOLS.has(name)) return { kind: "scheduler_only" };
  const handler = TOOL_REGISTRY.get(name);
  if (!handler) return { kind: "unknown_tool" };

  const parsed = getToolSchema(name).safeParse(rawInput ?? {});
  if (!parsed.success) {
    const raw = (rawInput ?? {}) as { account_id?: string; employee_id?: string };
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    return {
      kind: "invalid_input",
      envelope: failed("validation_failed", detail || "invalid input", {
        account_id: raw.account_id ?? null,
        employee_id: raw.employee_id ?? null,
        assignment_id: opts.assignment_id ?? null,
      }),
    };
  }

  const input = parsed.data as Record<string, unknown>;
  const ctx: ToolContext = {
    db: serviceClient(),
    account_id: (input.account_id as string) ?? null,
    employee_id: (input.employee_id as string) ?? null,
    assignment_id: opts.assignment_id ?? null,
    principal_id: opts.principal_id ?? null,
    principal_class: opts.principal_class ?? null,
    authenticated_by: opts.authenticated_by ?? null,
    actor: opts.actor ?? "manager",
  };
  const envelope = await handler(ctx, input);
  return { kind: "ok", envelope };
}
