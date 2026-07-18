import {
  authorizedAssignmentsForPrincipal,
  resolveAssignmentScope,
  type AssignmentAction,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeDecision,
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
  return Array.from(new Set([
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
  const scopedAssignments = input.assignments.filter((assignment) => aliases.includes(assignment.principal_id));
  const principal: HumanPrincipal = {
    principal_id: input.session.human_principal_id ?? input.session.user_id,
    user_id: input.session.user_id,
    kind: "human",
  };

  return resolveAssignmentScope({
    principal,
    assignments: scopedAssignments.map((assignment) => ({ ...assignment, principal_id: principal.principal_id })),
    grants: input.grants,
    account_id: input.session.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    allowed_roles: input.allowed_roles ?? ["owner", "operator"],
    resource_class: input.resource_class,
    resource_id: input.resource_id,
    action: input.action,
    require_command_effect: input.require_command_effect,
    command_effect_intent_id: input.command_effect_intent_id,
    now,
  });
}

export function listOwnerSessionAssignments(params: {
  session: OwnerSessionRecord | null | undefined;
  assignments: readonly AssignmentPrincipalRecord[];
  now?: Date;
}): readonly AssignmentPrincipalRecord[] {
  if (!params.session || params.session.revoked_at || isExpired(params.session.expires_at, params.now ?? new Date())) return [];
  const aliases = ownerSessionPrincipalAliases(params.session);
  return aliases.flatMap((principal_id) =>
    authorizedAssignmentsForPrincipal({
      principal: { principal_id, user_id: params.session?.user_id, kind: "human" },
      assignments: params.assignments,
      account_id: params.session?.account_id,
      now: params.now,
    }),
  );
}
