import type { SupabaseClient } from "@amtech/db";
import {
  enforceOwnerSessionAssignment,
  listOwnerSessionAssignments,
  type AssignmentAction,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeDecision,
  type OwnerSessionRecord,
} from "@amtech/shared";

interface AssignmentPrincipalJoinRow {
  assignment_id: string;
  principal_id: string;
  role: string;
  status: string;
  policy_version?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  employee_assignments?: {
    id?: string;
    account_id?: string;
    status?: string;
    policy_version?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    employee_principals?: { employee_id?: string } | Array<{ employee_id?: string }> | null;
  } | Array<{
    id?: string;
    account_id?: string;
    status?: string;
    policy_version?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    employee_principals?: { employee_id?: string } | Array<{ employee_id?: string }> | null;
  }> | null;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function earliestEnd(...values: Array<string | null | undefined>): string | null {
  const current = values
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(String(value))))
    .sort((left, right) => Date.parse(left) - Date.parse(right));
  return current[0] ?? null;
}

export async function loadOwnerAssignmentRecords(
  db: SupabaseClient,
  session: OwnerSessionRecord,
  employeeId?: string | null,
): Promise<AssignmentPrincipalRecord[]> {
  if (!session.human_principal_id) return [];
  let query = db.from("assignment_principals")
    .select("assignment_id,principal_id,role,status,policy_version,starts_at,ends_at,employee_assignments!inner(id,account_id,status,policy_version,starts_at,ends_at,employee_principals!inner(employee_id))")
    .eq("principal_id", session.human_principal_id)
    .eq("principal_class", "human")
    .eq("employee_assignments.account_id", session.account_id);
  if (employeeId) query = query.eq("employee_assignments.employee_principals.employee_id", employeeId);
  const result = await query;
  if (result.error) throw result.error;
  return ((result.data ?? []) as unknown as AssignmentPrincipalJoinRow[]).flatMap((row) => {
    const assignment = first(row.employee_assignments);
    const employeePrincipal = first(assignment?.employee_principals);
    if (!assignment?.id || !assignment.account_id || !employeePrincipal?.employee_id) return [];
    const bothActive = row.status === "active" && assignment.status === "active";
    return [{
      assignment_id: String(assignment.id),
      account_id: String(assignment.account_id),
      employee_id: String(employeePrincipal.employee_id),
      principal_id: String(row.principal_id),
      role: String(row.role),
      status: bothActive ? "active" : String(row.status !== "active" ? row.status : assignment.status ?? "revoked"),
      revoked_at: bothActive ? null : new Date().toISOString(),
      expires_at: earliestEnd(row.ends_at, assignment.ends_at),
    }];
  });
}

export async function loadOwnerResourceGrants(
  db: SupabaseClient,
  session: OwnerSessionRecord,
  assignmentIds: readonly string[],
  resourceClass?: string | null,
  resourceId?: string | null,
): Promise<AssignmentResourceGrantRecord[]> {
  if (!session.human_principal_id || assignmentIds.length === 0) return [];
  let query = db.from("assignment_resource_grants")
    .select("assignment_id,principal_id,resource_class,resource_id,actions,status,starts_at,ends_at")
    .in("assignment_id", [...assignmentIds])
    .or(`principal_id.is.null,principal_id.eq.${session.human_principal_id}`);
  if (resourceClass) query = query.eq("resource_class", resourceClass);
  if (resourceId) query = query.or(`resource_id.is.null,resource_id.eq.${resourceId}`);
  const result = await query;
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({
    assignment_id: String(row.assignment_id),
    resource_class: String(row.resource_class),
    resource_id: row.resource_id ? String(row.resource_id) : null,
    actions: Array.isArray(row.actions) ? row.actions.map(String) : [],
    revoked_at: row.status === "active" ? null : new Date().toISOString(),
    expires_at: row.ends_at ? String(row.ends_at) : null,
  }));
}

export interface ResolveOwnerRequestInput {
  session: OwnerSessionRecord;
  employee_id: string;
  assignment_id?: string | null;
  resource_class: string;
  resource_id?: string | null;
  action: AssignmentAction;
  allowed_roles?: readonly string[];
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
}

export async function resolveOwnerRequest(
  db: SupabaseClient,
  input: ResolveOwnerRequestInput,
): Promise<AssignmentScopeDecision> {
  const assignments = await loadOwnerAssignmentRecords(db, input.session, input.employee_id);
  const grants = await loadOwnerResourceGrants(
    db,
    input.session,
    assignments.map((row) => row.assignment_id),
    input.resource_class,
    input.resource_id ?? null,
  );
  return enforceOwnerSessionAssignment({
    session: input.session,
    assignments,
    grants,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id ?? null,
    resource_class: input.resource_class,
    resource_id: input.resource_id ?? null,
    action: input.action,
    allowed_roles: input.allowed_roles ?? ["owner", "manager", "operator", "viewer", "billing", "approver"],
    require_command_effect: input.require_command_effect,
    command_effect_intent_id: input.command_effect_intent_id,
  });
}

export async function authorizeOwnerAssignment(
  db: SupabaseClient,
  input: ResolveOwnerRequestInput,
): Promise<AssignmentScopeDecision> {
  return resolveOwnerRequest(db, input);
}

export async function loadOwnerCommandPolicyVersion(
  db: SupabaseClient,
  session: OwnerSessionRecord,
  assignmentId: string,
): Promise<string> {
  if (!session.human_principal_id) throw new Error("owner_human_principal_required");
  const result = await db.from("assignment_principals")
    .select("policy_version,status,starts_at,ends_at,employee_assignments!inner(id,status,starts_at,ends_at,policy_version)")
    .eq("assignment_id", assignmentId)
    .eq("principal_id", session.human_principal_id)
    .eq("principal_class", "human")
    .maybeSingle();
  if (result.error) throw result.error;
  const row = result.data as {
    policy_version?: string | null;
    status?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    employee_assignments?: { policy_version?: string | null; status?: string | null; starts_at?: string | null; ends_at?: string | null } | Array<{ policy_version?: string | null; status?: string | null; starts_at?: string | null; ends_at?: string | null }> | null;
  } | null;
  const assignment = first(row?.employee_assignments);
  const now = Date.now();
  const current = (status?: string | null, startsAt?: string | null, endsAt?: string | null) =>
    status === "active" &&
    (!startsAt || Date.parse(startsAt) <= now) &&
    (!endsAt || Date.parse(endsAt) > now);
  if (!row || !assignment || !current(row.status, row.starts_at, row.ends_at) || !current(assignment.status, assignment.starts_at, assignment.ends_at)) {
    throw new Error("owner_assignment_command_authority_not_current");
  }
  if (!row.policy_version || row.policy_version !== assignment.policy_version) {
    throw new Error("owner_assignment_command_policy_mismatch");
  }
  return row.policy_version;
}

export async function listOwnerAssignments(
  db: SupabaseClient,
  session: OwnerSessionRecord,
): Promise<readonly AssignmentPrincipalRecord[]> {
  const assignments = await loadOwnerAssignmentRecords(db, session);
  return listOwnerSessionAssignments({ session, assignments });
}

export function ownerAssignmentDeniedStatus(decision: AssignmentScopeDecision): 401 | 403 | 409 | 410 {
  return decision.ok ? 403 : decision.status;
}
