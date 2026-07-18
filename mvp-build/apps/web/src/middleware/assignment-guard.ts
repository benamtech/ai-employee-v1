import { NextResponse, type NextRequest } from "next/server";
import {
  enforceOwnerSessionAssignment,
  listOwnerSessionAssignments,
  type AssignmentAction,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeDecision,
  type OwnerSessionRecord,
} from "@amtech/shared";

export interface WebAssignmentGuardLoaders {
  ownerSession(token: string): Promise<OwnerSessionRecord | null>;
  assignmentPrincipals(input: { account_id?: string | null; employee_id?: string | null; principal_id?: string | null }): Promise<readonly AssignmentPrincipalRecord[]>;
  resourceGrants(input: { assignment_ids: readonly string[]; resource_class?: string | null; resource_id?: string | null }): Promise<readonly AssignmentResourceGrantRecord[]>;
}

export interface WebAssignmentGuardRequest {
  owner_session_token?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  resource_class?: string | null;
  resource_id?: string | null;
  action?: AssignmentAction | null;
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
}

export interface WebAssignmentGuardAccepted {
  ok: true;
  session: OwnerSessionRecord;
  decision: Extract<AssignmentScopeDecision, { ok: true }>;
}

export interface WebAssignmentGuardDenied {
  ok: false;
  decision: Extract<AssignmentScopeDecision, { ok: false }>;
}

export type WebAssignmentGuardResult = WebAssignmentGuardAccepted | WebAssignmentGuardDenied;

export function ownerSessionTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get("amtech_owner_session")?.value ?? null;
}

export function webAssignmentDeniedResponse(decision: Extract<AssignmentScopeDecision, { ok: false }>): NextResponse {
  return NextResponse.json({ error: decision.reason, assignment_scope: decision.evidence }, { status: decision.status });
}

export async function enforceWebOwnerAssignment(
  loaders: WebAssignmentGuardLoaders,
  request: WebAssignmentGuardRequest,
): Promise<WebAssignmentGuardResult> {
  const token = String(request.owner_session_token ?? "");
  const session = token ? await loaders.ownerSession(token) : null;
  if (!session) {
    return {
      ok: false,
      decision: {
        ok: false,
        status: 401,
        reason: "missing_principal",
        evidence: { principal_id: "", grant_checked: false, command_effect_checked: Boolean(request.require_command_effect) },
      },
    };
  }

  const assignments = await loaders.assignmentPrincipals({
    account_id: session.account_id,
    employee_id: request.employee_id,
    principal_id: session.human_principal_id ?? session.user_id,
  });
  const grants = await loaders.resourceGrants({
    assignment_ids: assignments.map((assignment) => assignment.assignment_id),
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
  return decision.ok ? { ok: true, session, decision } : { ok: false, decision };
}

export async function listWebOwnerAssignments(loaders: Pick<WebAssignmentGuardLoaders, "ownerSession" | "assignmentPrincipals">, ownerSessionToken: string | null | undefined) {
  const session = ownerSessionToken ? await loaders.ownerSession(ownerSessionToken) : null;
  if (!session) return [];
  const assignments = await loaders.assignmentPrincipals({ account_id: session.account_id, principal_id: session.human_principal_id ?? session.user_id });
  return listOwnerSessionAssignments({ session, assignments });
}
