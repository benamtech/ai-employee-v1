/**
 * Single dispatch path for Manager tools, shared by every transport (the HTTP
 * `/manager/tools/:name` route and the Manager MCP server). Validates input
 * against the runtime zod schema, blocks scheduler-only tools, builds the tool
 * context, and runs the existing registry handler — so gates, audit,
 * secrets-by-reference, and the approval flow (all inside the handlers) are
 * reused verbatim regardless of transport.
 */
import { getToolSchema, failed, type ToolEnvelope, type ToolName } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";

/** Tools that mutate every account's queue — the scheduler runner invokes these
 *  via /manager/scheduler/run, never a per-tool transport (HTTP or MCP). */
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

export async function runManagerTool(
  name: ToolName,
  rawInput: unknown,
  opts: { actor?: ToolContext["actor"] } = {},
): Promise<RunToolOutcome> {
  if (SCHEDULER_ONLY_TOOLS.has(name)) return { kind: "scheduler_only" };
  const handler = TOOL_REGISTRY.get(name);
  if (!handler) return { kind: "unknown_tool" };

  const parsed = getToolSchema(name).safeParse(rawInput ?? {});
  if (!parsed.success) {
    const raw = (rawInput ?? {}) as { account_id?: string; employee_id?: string };
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return {
      kind: "invalid_input",
      envelope: failed("validation_failed", detail || "invalid input", {
        account_id: raw.account_id ?? null,
        employee_id: raw.employee_id ?? null,
      }),
    };
  }

  const input = parsed.data as Record<string, unknown>;
  const ctx: ToolContext = {
    db: serviceClient(),
    account_id: (input.account_id as string) ?? null,
    employee_id: (input.employee_id as string) ?? null,
    actor: opts.actor ?? "manager",
  };
  const envelope = await handler(ctx, input);
  return { kind: "ok", envelope };
}
