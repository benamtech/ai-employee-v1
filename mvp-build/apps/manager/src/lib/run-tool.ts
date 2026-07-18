/**
 * Single dispatch path for Manager tools, shared by every transport. The caller
 * supplies authenticated principal context; model input never does. The legacy
 * signed-preview route identifies itself as actor=owner, so this dispatcher
 * resolves the one principal-bound durable preview row before invoking S7.
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

async function signedPreviewAuthority(
  db: ReturnType<typeof serviceClient>,
  name: ToolName,
  input: Record<string, unknown>,
  opts: RunManagerToolOptions,
): Promise<RunManagerToolOptions> {
  if (name !== "resolve_approval" || opts.actor !== "owner" || opts.principal_id) return opts;
  const approvalId = String(input.approval_id ?? "");
  const channel = String(input.channel ?? "");
  if (!approvalId || channel !== "sms") return opts;
  const rows = await db.from("preview_links")
    .select("id,assignment_id,resolver_principal_id,policy_version,approval_snapshot_hash,resource_type,resource_id,revoked_at,consumed_at,expires_at")
    .eq("resource_type", "approval")
    .eq("resource_id", approvalId)
    .is("revoked_at", null)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(2);
  if (rows.error) throw rows.error;
  const current = rows.data ?? [];
  if (current.length !== 1) return opts;
  const link = current[0]!;
  if (!link.assignment_id || !link.resolver_principal_id || !link.policy_version || !link.approval_snapshot_hash) return opts;
  return {
    ...opts,
    assignment_id: String(link.assignment_id),
    principal_id: String(link.resolver_principal_id),
    principal_class: "human",
    authenticated_by: `signed_preview_link:${link.id}`,
  };
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
  const db = serviceClient();
  const authority = await signedPreviewAuthority(db, name, input, opts);
  const ctx: ToolContext = {
    db,
    account_id: (input.account_id as string) ?? null,
    employee_id: (input.employee_id as string) ?? null,
    assignment_id: authority.assignment_id ?? null,
    principal_id: authority.principal_id ?? null,
    principal_class: authority.principal_class ?? null,
    authenticated_by: authority.authenticated_by ?? null,
    actor: authority.actor ?? "manager",
  };
  const envelope = await handler(ctx, input);
  return { kind: "ok", envelope };
}
