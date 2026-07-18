import type { Context } from "hono";
import {
  enforceOwnerSessionAssignment,
  resolveSmsChannelAssignment,
  validateSignedResourceDurableBoundary,
  type AssignmentAction,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeDecision,
  type DurableScopedResource,
  type OwnerSessionRecord,
  type SignedResourcePossession,
  type SmsPhoneBinding,
} from "@amtech/shared";

export interface ManagerAssignmentGuardLoaders {
  ownerSession(token: string): Promise<OwnerSessionRecord | null>;
  assignmentPrincipals(input: { account_id?: string | null; employee_id?: string | null; principal_id?: string | null }): Promise<readonly AssignmentPrincipalRecord[]>;
  resourceGrants(input: { assignment_ids: readonly string[]; resource_class?: string | null; resource_id?: string | null }): Promise<readonly AssignmentResourceGrantRecord[]>;
}

export interface ManagerOwnerAssignmentRequest {
  owner_session_token: string | null | undefined;
  employee_id?: string | null;
  assignment_id?: string | null;
  resource_class?: string | null;
  resource_id?: string | null;
  action?: AssignmentAction | null;
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
}

export interface ManagerAssignmentGuardAccepted {
  ok: true;
  session: OwnerSessionRecord;
  decision: Extract<AssignmentScopeDecision, { ok: true }>;
}

export interface ManagerAssignmentGuardDenied {
  ok: false;
  decision: Extract<AssignmentScopeDecision, { ok: false }>;
}

export type ManagerAssignmentGuardResult = ManagerAssignmentGuardAccepted | ManagerAssignmentGuardDenied;

function denied(decision: AssignmentScopeDecision): ManagerAssignmentGuardDenied {
  if (decision.ok) throw new Error("manager_assignment_guard_expected_denial");
  return { ok: false, decision };
}

export function managerAssignmentDeniedResponse(c: Context, decision: Extract<AssignmentScopeDecision, { ok: false }>): Response {
  return c.json({ error: decision.reason, assignment_scope: decision.evidence }, decision.status);
}

export async function enforceManagerOwnerAssignment(
  loaders: ManagerAssignmentGuardLoaders,
  request: ManagerOwnerAssignmentRequest,
): Promise<ManagerAssignmentGuardResult> {
  const token = String(request.owner_session_token ?? "");
  const session = token ? await loaders.ownerSession(token) : null;
  if (!session) {
    return denied({
      ok: false,
      status: 401,
      reason: "missing_principal",
      evidence: { principal_id: "", grant_checked: false, command_effect_checked: Boolean(request.require_command_effect) },
    });
  }

  const assignments = await loaders.assignmentPrincipals({
    account_id: session.account_id,
    employee_id: request.employee_id,
    principal_id: session.human_principal_id ?? session.user_id,
  });
  const assignmentIds = assignments.map((assignment) => assignment.assignment_id);
  const grants = await loaders.resourceGrants({
    assignment_ids: assignmentIds,
    resource_class: request.resource_class,
    resource_id: request.resource_id,
  });
  const decision = enforceOwnerSessionAssignment({
    session,
    assignments,
    grants,
    employee_id: request.employee_id,
    assignment_id: request.assignment_id,
    resource_class: request.resource_class,
    resource_id: request.resource_id,
    action: request.action,
    require_command_effect: request.require_command_effect,
    command_effect_intent_id: request.command_effect_intent_id,
  });
  return decision.ok ? { ok: true, session, decision } : denied(decision);
}

export function createManagerAssignmentGuard(loaders: ManagerAssignmentGuardLoaders, requestFromContext: (c: Context) => ManagerOwnerAssignmentRequest) {
  return async (c: Context, next: () => Promise<void>): Promise<Response | void> => {
    const result = await enforceManagerOwnerAssignment(loaders, requestFromContext(c));
    if (!result.ok) return managerAssignmentDeniedResponse(c, result.decision);
    c.set("assignment_scope", result.decision.evidence);
    await next();
  };
}

export function enforceManagerSignedResourceBoundary(params: {
  token: SignedResourcePossession;
  durable_resource?: DurableScopedResource | null;
  terminal_action?: boolean;
  allow_idempotent_terminal_replay?: boolean;
}) {
  return validateSignedResourceDurableBoundary(params);
}

export function enforceManagerSmsAssignment(params: {
  twilio_signature_verified: boolean;
  phone_binding?: SmsPhoneBinding | null;
  assignments: readonly AssignmentPrincipalRecord[];
  grants?: readonly AssignmentResourceGrantRecord[];
  employee_id: string;
  action?: AssignmentAction;
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
}) {
  return resolveSmsChannelAssignment(params);
}
