import {
  authorizedAssignmentsForPrincipal,
  resolveAssignmentScope,
  type AssignmentAction,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeDecision,
  type AssignmentScopeRequest,
  type HumanPrincipal,
} from "./assignment-resolver.js";

export interface OwnerSessionRecord {
  session_id: string;
  user_id: string;
  account_id: string;
  human_principal_id?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
}

export interface OwnerSessionAssignmentRequest {
  session: OwnerSessionRecord | null | undefined;
  assignments: readonly AssignmentPrincipalRecord[];
  grants?: readonly AssignmentResourceGrantRecord[];
  employee_id?: string | null;
  assignment_id?: string | null;
  resource_class?: string | null;
  resource_id?: string | null;
  action?: AssignmentAction | null;
  allowed_roles?: readonly string[];
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
  now?: Date;
}

export function ownerSessionPrincipalAliases(session: OwnerSessionRecord): readonly string[] {
  return Array.from(new Set<string>([
    session.human_principal_id,
    session.user_id,
    `user:${session.user_id}`,
    `human:${session.user_id}`,
  ].filter((value): value is string => typeof value === "string" && value.trim() !== "")));
}

function isExpired(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now.getTime();
}

function deniedSessionDecision(
  reason: "missing_principal" | "revoked_or_expired_assignment",
  status: 401 | 410,
): AssignmentScopeDecision {
  return {
    ok: false,
    status,
    reason,
    evidence: {
      principal_id: "",
      grant_checked: false,
      command_effect_checked: false,
    },
  };
}

export function enforceOwnerSessionAssignment(input: OwnerSessionAssignmentRequest): AssignmentScopeDecision {
  const now = input.now ?? new Date();
  if (!input.session) return deniedSessionDecision("missing_principal", 401);
  if (input.session.revoked_at || isExpired(input.session.expires_at, now)) {
    return deniedSessionDecision("revoked_or_expired_assignment", 410);
  }

  const aliases = ownerSessionPrincipalAliases(input.session);
  const principal: HumanPrincipal = {
    principal_id: input.session.human_principal_id ?? input.session.user_id,
    user_id: input.session.user_id,
    kind: "human",
  };
  const scopedAssignments = input.assignments
    .filter((assignment) => aliases.includes(assignment.principal_id))
    .map((assignment) => ({ ...assignment, principal_id: principal.principal_id }));

  const request: AssignmentScopeRequest = {
    principal,
    assignments: scopedAssignments,
    account_id: input.session.account_id,
    allowed_roles: input.allowed_roles ?? ["owner", "operator"],
    now,
  };
  if (input.grants) request.grants = input.grants;
  if (input.employee_id !== undefined) request.employee_id = input.employee_id;
  if (input.assignment_id !== undefined) request.assignment_id = input.assignment_id;
  if (input.resource_class !== undefined) request.resource_class = input.resource_class;
  if (input.resource_id !== undefined) request.resource_id = input.resource_id;
  if (input.action !== undefined) request.action = input.action;
  if (input.require_command_effect !== undefined) request.require_command_effect = input.require_command_effect;
  if (input.command_effect_intent_id !== undefined) request.command_effect_intent_id = input.command_effect_intent_id;
  return resolveAssignmentScope(request);
}

export function listOwnerSessionAssignments(params: {
  session: OwnerSessionRecord | null | undefined;
  assignments: readonly AssignmentPrincipalRecord[];
  now?: Date;
}): readonly AssignmentPrincipalRecord[] {
  const session = params.session;
  if (!session || session.revoked_at || isExpired(session.expires_at, params.now ?? new Date())) return [];
  const aliases = ownerSessionPrincipalAliases(session);
  return aliases.flatMap((principal_id) =>
    authorizedAssignmentsForPrincipal({
      principal: { principal_id, user_id: session.user_id, kind: "human" },
      assignments: params.assignments,
      account_id: session.account_id,
      now: params.now,
    }),
  );
}
