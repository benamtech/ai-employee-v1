export type AssignmentPrincipalRole = "owner" | "operator" | "employee" | "support" | "admin" | "system";

export type AssignmentPrincipalStatus = "current" | "active" | "pending" | "revoked" | "expired" | "disabled";

export type AssignmentAction =
  | "*"
  | "read"
  | "write"
  | "message:create"
  | "stream:read"
  | "artifact:read"
  | "preview:resolve"
  | "preview:action"
  | "sms:ingest"
  | "sms:reply"
  | "materialize"
  | string;

export type AssignmentDenialReason =
  | "missing_principal"
  | "no_current_assignment"
  | "ambiguous_assignment"
  | "wrong_account"
  | "wrong_employee"
  | "wrong_assignment"
  | "wrong_role"
  | "revoked_or_expired_assignment"
  | "missing_resource_grant"
  | "wrong_resource"
  | "action_not_permitted"
  | "missing_command_effect_intent"
  | "invalid_signature"
  | "expired_token"
  | "missing_durable_resource"
  | "durable_resource_unscoped"
  | "token_resource_mismatch"
  | "terminal_action_replayed"
  | "missing_phone_binding"
  | "revoked_or_expired_channel";

export interface HumanPrincipal {
  principal_id: string;
  user_id?: string | null;
  phone_e164?: string | null;
  kind?: "human" | "employee" | "platform" | "system";
}

export interface AssignmentPrincipalRecord {
  assignment_id: string;
  account_id: string;
  employee_id: string;
  principal_id: string;
  role: AssignmentPrincipalRole | string;
  status: AssignmentPrincipalStatus | string;
  revoked_at?: string | null;
  expires_at?: string | null;
}

export interface AssignmentResourceGrantRecord {
  assignment_id: string;
  resource_class: string;
  resource_id?: string | null;
  actions: readonly AssignmentAction[];
  revoked_at?: string | null;
  expires_at?: string | null;
}

export interface AssignmentScopeRequest {
  principal: HumanPrincipal;
  assignments: readonly AssignmentPrincipalRecord[];
  grants?: readonly AssignmentResourceGrantRecord[];
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  allowed_roles?: readonly string[];
  resource_class?: string | null;
  resource_id?: string | null;
  action?: AssignmentAction | null;
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
  now?: Date;
}

export interface AssignmentScopeEvidence {
  principal_id: string;
  assignment_id?: string;
  account_id?: string;
  employee_id?: string;
  resource_class?: string;
  resource_id?: string | null;
  action?: AssignmentAction | null;
  grant_checked: boolean;
  command_effect_checked: boolean;
}

export type AssignmentScopeDecision =
  | {
      ok: true;
      status: 200;
      assignment: AssignmentPrincipalRecord;
      grant?: AssignmentResourceGrantRecord;
      evidence: AssignmentScopeEvidence;
    }
  | {
      ok: false;
      status: 401 | 403 | 409 | 410;
      reason: AssignmentDenialReason;
      evidence: AssignmentScopeEvidence;
    };

const currentAssignmentStatuses = new Set(["current", "active"]);

function timestampIsPast(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now.getTime();
}

function isCurrentAssignment(assignment: AssignmentPrincipalRecord, now: Date): boolean {
  return currentAssignmentStatuses.has(assignment.status) &&
    !assignment.revoked_at &&
    !timestampIsPast(assignment.expires_at, now);
}

function isCurrentGrant(grant: AssignmentResourceGrantRecord, now: Date): boolean {
  return !grant.revoked_at && !timestampIsPast(grant.expires_at, now);
}

function actionAllowed(actions: readonly AssignmentAction[], action: AssignmentAction | null | undefined): boolean {
  if (!action) return true;
  return actions.includes("*") || actions.includes(action);
}

function deny(
  input: Pick<AssignmentScopeRequest, "principal" | "resource_class" | "resource_id" | "action" | "require_command_effect">,
  reason: AssignmentDenialReason,
  status: 401 | 403 | 409 | 410 = 403,
): AssignmentScopeDecision {
  return {
    ok: false,
    status,
    reason,
    evidence: {
      principal_id: input.principal?.principal_id ?? "",
      resource_class: input.resource_class ?? undefined,
      resource_id: input.resource_id ?? undefined,
      action: input.action,
      grant_checked: Boolean(input.resource_class || input.action),
      command_effect_checked: Boolean(input.require_command_effect),
    },
  };
}

export function authorizedAssignmentsForPrincipal(params: {
  principal: HumanPrincipal;
  assignments: readonly AssignmentPrincipalRecord[];
  account_id?: string | null;
  now?: Date;
}): readonly AssignmentPrincipalRecord[] {
  const now = params.now ?? new Date();
  if (!params.principal.principal_id) return [];
  return params.assignments.filter((assignment) =>
    assignment.principal_id === params.principal.principal_id &&
    (!params.account_id || assignment.account_id === params.account_id) &&
    isCurrentAssignment(assignment, now),
  );
}

export function resolveAssignmentScope(input: AssignmentScopeRequest): AssignmentScopeDecision {
  const now = input.now ?? new Date();
  if (!input.principal?.principal_id) return deny(input, "missing_principal", 401);

  const principalAssignments = input.assignments.filter((assignment) =>
    assignment.principal_id === input.principal.principal_id,
  );
  const currentAssignments = principalAssignments.filter((assignment) => isCurrentAssignment(assignment, now));

  if (principalAssignments.length > 0 && currentAssignments.length === 0) {
    return deny(input, "revoked_or_expired_assignment", 410);
  }

  let candidates = currentAssignments;
  if (input.assignment_id) {
    candidates = candidates.filter((assignment) => assignment.assignment_id === input.assignment_id);
    if (candidates.length === 0) return deny(input, "wrong_assignment");
  }
  if (input.account_id) {
    const filtered = candidates.filter((assignment) => assignment.account_id === input.account_id);
    if (filtered.length === 0) return deny(input, "wrong_account");
    candidates = filtered;
  }
  if (input.employee_id) {
    const filtered = candidates.filter((assignment) => assignment.employee_id === input.employee_id);
    if (filtered.length === 0) return deny(input, "wrong_employee");
    candidates = filtered;
  }

  if (candidates.length === 0) return deny(input, "no_current_assignment", 403);
  if (candidates.length > 1 && !input.assignment_id && !input.employee_id) return deny(input, "ambiguous_assignment", 403);

  const assignment = candidates[0];
  if (!assignment) return deny(input, "no_current_assignment", 403);

  if (input.allowed_roles?.length && !input.allowed_roles.includes(assignment.role)) {
    return deny(input, "wrong_role", 403);
  }

  let grant: AssignmentResourceGrantRecord | undefined;
  if (input.resource_class || input.action) {
    const grants = (input.grants ?? []).filter((item) =>
      item.assignment_id === assignment.assignment_id &&
      isCurrentGrant(item, now) &&
      (!input.resource_class || item.resource_class === input.resource_class) &&
      (!input.resource_id || !item.resource_id || item.resource_id === input.resource_id),
    );
    grant = grants.find((item) => actionAllowed(item.actions, input.action));
    if (!grant) {
      const classMatched = grants.some((item) => !input.resource_class || item.resource_class === input.resource_class);
      return deny(input, classMatched ? "action_not_permitted" : "missing_resource_grant", 403);
    }
  }

  if (input.require_command_effect && !input.command_effect_intent_id) {
    return deny(input, "missing_command_effect_intent", 403);
  }

  return {
    ok: true,
    status: 200,
    assignment,
    grant,
    evidence: {
      principal_id: input.principal.principal_id,
      assignment_id: assignment.assignment_id,
      account_id: assignment.account_id,
      employee_id: assignment.employee_id,
      resource_class: input.resource_class ?? undefined,
      resource_id: input.resource_id ?? undefined,
      action: input.action,
      grant_checked: Boolean(input.resource_class || input.action),
      command_effect_checked: Boolean(input.require_command_effect),
    },
  };
}

export interface SignedResourcePossession {
  signature_valid: boolean;
  subject: string;
  resource_class: string;
  resource_id: string;
  account_id: string;
  employee_id: string;
  expires_at?: string | null;
  revoked_at?: string | null;
}

export interface DurableScopedResource {
  resource_class: string;
  resource_id: string;
  account_id: string;
  employee_id: string;
  assignment_id?: string | null;
  consumed_at?: string | null;
  revoked_at?: string | null;
  expires_at?: string | null;
}

export type SignedResourceBoundaryDecision =
  | { ok: true; status: 200; assignment_id: string; evidence: Record<string, unknown> }
  | { ok: false; status: 403 | 409 | 410; reason: AssignmentDenialReason; evidence: Record<string, unknown> };

export function validateSignedResourceDurableBoundary(params: {
  token: SignedResourcePossession;
  durable_resource?: DurableScopedResource | null;
  terminal_action?: boolean;
  allow_idempotent_terminal_replay?: boolean;
  now?: Date;
}): SignedResourceBoundaryDecision {
  const now = params.now ?? new Date();
  const evidence = {
    resource_class: params.token.resource_class,
    resource_id: params.token.resource_id,
    subject: params.token.subject,
    signature_valid: params.token.signature_valid,
    durable_lookup_present: Boolean(params.durable_resource),
  };

  if (!params.token.signature_valid) return { ok: false, status: 403, reason: "invalid_signature", evidence };
  if (params.token.revoked_at || timestampIsPast(params.token.expires_at, now)) {
    return { ok: false, status: 410, reason: "expired_token", evidence };
  }
  const durable = params.durable_resource;
  if (!durable) return { ok: false, status: 403, reason: "missing_durable_resource", evidence };
  if (!durable.assignment_id) return { ok: false, status: 403, reason: "durable_resource_unscoped", evidence };
  if (durable.revoked_at || timestampIsPast(durable.expires_at, now)) {
    return { ok: false, status: 410, reason: "expired_token", evidence };
  }
  if (
    params.token.resource_class !== durable.resource_class ||
    params.token.resource_id !== durable.resource_id ||
    params.token.account_id !== durable.account_id ||
    params.token.employee_id !== durable.employee_id ||
    params.token.subject !== durable.resource_id
  ) {
    return { ok: false, status: 403, reason: "token_resource_mismatch", evidence };
  }
  if (params.terminal_action && durable.consumed_at && !params.allow_idempotent_terminal_replay) {
    return { ok: false, status: 409, reason: "terminal_action_replayed", evidence };
  }
  return { ok: true, status: 200, assignment_id: durable.assignment_id, evidence: { ...evidence, assignment_id: durable.assignment_id } };
}

export interface SmsPhoneBinding {
  phone_e164: string;
  principal_id: string;
  account_id: string;
  assignment_id?: string | null;
  status?: "current" | "active" | "revoked" | "expired" | string;
  revoked_at?: string | null;
  expires_at?: string | null;
}

export function resolveSmsChannelAssignment(params: {
  twilio_signature_verified: boolean;
  phone_binding?: SmsPhoneBinding | null;
  assignments: readonly AssignmentPrincipalRecord[];
  grants?: readonly AssignmentResourceGrantRecord[];
  employee_id: string;
  action?: AssignmentAction;
  now?: Date;
  require_command_effect?: boolean;
  command_effect_intent_id?: string | null;
}): AssignmentScopeDecision {
  const now = params.now ?? new Date();
  const principal: HumanPrincipal = { principal_id: params.phone_binding?.principal_id ?? "", phone_e164: params.phone_binding?.phone_e164, kind: "human" };
  if (!params.twilio_signature_verified) return deny({ principal, action: params.action }, "invalid_signature", 403);
  if (!params.phone_binding) return deny({ principal, action: params.action }, "missing_phone_binding", 403);
  if (params.phone_binding.revoked_at || timestampIsPast(params.phone_binding.expires_at, now) || params.phone_binding.status === "revoked" || params.phone_binding.status === "expired") {
    return deny({ principal, action: params.action }, "revoked_or_expired_channel", 410);
  }
  return resolveAssignmentScope({
    principal,
    assignments: params.assignments,
    grants: params.grants,
    account_id: params.phone_binding.account_id,
    employee_id: params.employee_id,
    assignment_id: params.phone_binding.assignment_id ?? undefined,
    allowed_roles: ["owner", "operator"],
    resource_class: "channel:sms",
    resource_id: params.phone_binding.phone_e164,
    action: params.action ?? "sms:ingest",
    require_command_effect: params.require_command_effect,
    command_effect_intent_id: params.command_effect_intent_id,
    now,
  });
}
