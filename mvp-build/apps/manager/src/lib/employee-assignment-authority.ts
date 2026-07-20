import type { SupabaseClient } from "@amtech/db";
import {
  resolveAssignmentScope,
  type AssignmentAction,
  type AssignmentScopeDecision,
} from "@amtech/shared";
import type { ToolContext } from "../tools/types.js";

export async function authorizeEmployeeTool(
  db: SupabaseClient,
  ctx: ToolContext,
  input: {
    account_id: string;
    employee_id: string;
    action: AssignmentAction;
    resource_class?: string;
    resource_id?: string | null;
  },
): Promise<AssignmentScopeDecision> {
  if (!ctx.assignment_id || !ctx.principal_id || ctx.principal_class !== "employee") {
    return resolveAssignmentScope({
      principal: { principal_id: ctx.principal_id ?? "", kind: "employee" },
      assignments: [],
      assignment_id: ctx.assignment_id ?? null,
      account_id: input.account_id,
      employee_id: input.employee_id,
      resource_class: input.resource_class ?? "employee",
      resource_id: input.resource_id ?? input.employee_id,
      action: input.action,
    });
  }
  const assignment = await db.from("employee_assignments")
    .select("id,account_id,status,starts_at,ends_at,employee_principals!inner(id,employee_id,status)")
    .eq("id", ctx.assignment_id)
    .eq("account_id", input.account_id)
    .eq("employee_principals.id", ctx.principal_id)
    .eq("employee_principals.employee_id", input.employee_id)
    .maybeSingle();
  if (assignment.error) throw assignment.error;
  const principalJoin = assignment.data?.employee_principals as unknown as
    | { id?: string; employee_id?: string; status?: string }
    | Array<{ id?: string; employee_id?: string; status?: string }>
    | null;
  const principal = Array.isArray(principalJoin) ? principalJoin[0] : principalJoin;
  const assignmentPrincipal = await db.from("assignment_principals")
    .select("role,status,starts_at,ends_at")
    .eq("assignment_id", ctx.assignment_id)
    .eq("principal_id", ctx.principal_id)
    .eq("principal_class", "employee")
    .maybeSingle();
  if (assignmentPrincipal.error) throw assignmentPrincipal.error;
  const grant = await db.from("assignment_resource_grants")
    .select("assignment_id,resource_class,resource_id,actions,status,ends_at")
    .eq("assignment_id", ctx.assignment_id)
    .or(`principal_id.is.null,principal_id.eq.${ctx.principal_id}`)
    .eq("resource_class", input.resource_class ?? "employee")
    .or(`resource_id.is.null,resource_id.eq.${input.resource_id ?? input.employee_id}`);
  if (grant.error) throw grant.error;
  const bothActive = assignment.data?.status === "active"
    && principal?.status === "active"
    && assignmentPrincipal.data?.status === "active";
  return resolveAssignmentScope({
    principal: { principal_id: ctx.principal_id, kind: "employee" },
    assignments: assignment.data?.id && principal?.employee_id && assignmentPrincipal.data
      ? [{
          assignment_id: String(assignment.data.id),
          account_id: String(assignment.data.account_id),
          employee_id: String(principal.employee_id),
          principal_id: ctx.principal_id,
          role: String(assignmentPrincipal.data.role),
          status: bothActive ? "active" : "revoked",
          revoked_at: bothActive ? null : new Date().toISOString(),
          expires_at: assignmentPrincipal.data.ends_at
            ? String(assignmentPrincipal.data.ends_at)
            : assignment.data.ends_at ? String(assignment.data.ends_at) : null,
        }]
      : [],
    grants: (grant.data ?? []).map((row) => ({
      assignment_id: String(row.assignment_id),
      resource_class: String(row.resource_class),
      resource_id: row.resource_id ? String(row.resource_id) : null,
      actions: Array.isArray(row.actions) ? row.actions.map(String) : [],
      revoked_at: row.status === "active" ? null : new Date().toISOString(),
      expires_at: row.ends_at ? String(row.ends_at) : null,
    })),
    assignment_id: ctx.assignment_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    allowed_roles: ["operator", "employee"],
    resource_class: input.resource_class ?? "employee",
    resource_id: input.resource_id ?? input.employee_id,
    action: input.action,
  });
}
