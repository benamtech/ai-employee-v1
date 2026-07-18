import {
  resolveAssignmentScope,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeEvidence,
  type HumanPrincipal,
} from "./assignment-resolver.js";

export type ApprovalRiskLevel = "low" | "medium" | "high" | "critical";
export type ApprovalResolution = "approved" | "rejected";
export type ApprovalRequestStatus = "pending" | "approved" | "rejected" | "expired" | "revoked";
export type ApprovalExecutionState = "not_started" | "executing" | "succeeded" | "failed" | "ambiguous" | "cancelled";

export type ApprovalAuthorityDenialReason =
  | "approval_not_pending"
  | "approval_expired"
  | "approval_revoked"
  | "resolver_must_be_human"
  | "employee_self_approval"
  | "snapshot_changed"
  | "authority_policy_missing"
  | "authority_policy_changed"
  | "risk_policy_mismatch"
  | "resolver_role_not_permitted"
  | "resolver_grant_missing"
  | "approval_command_missing"
  | "approval_not_approved"
  | "approval_execution_scope_mismatch"
  | "approval_execution_already_terminal";

export interface ApprovalAuthorityPolicyRecord {
  assignment_id: string;
  policy_version: string;
  action: string;
  required_roles: readonly string[];
  risk_class: ApprovalRiskLevel | string;
  step_up_required: boolean;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface ImmutableApprovalRequestRecord {
  approval_id: string;
  assignment_id: string;
  account_id: string;
  employee_id: string;
  requester_principal_id: string;
  requester_principal_class: "employee" | "human" | "service" | "platform";
  action_key: string;
  resource_class: string;
  resource_id: string;
  snapshot_hash: string;
  policy_version: string;
  required_resolver_roles: readonly string[];
  required_resolver_action: string;
  risk_level: ApprovalRiskLevel;
  expires_at: string;
  status: ApprovalRequestStatus;
  resolution?: ApprovalResolution | null;
  resolved_by_principal_id?: string | null;
  resolved_by_role?: string | null;
  resolved_at?: string | null;
  revoked_at?: string | null;
  command_intent_id: string;
  command_id: string;
  effect_key: string;
  execution_state?: ApprovalExecutionState | null;
  execution_receipt_id?: string | null;
}

export interface ApprovalAuthorityEvidence {
  approval_id: string;
  assignment_id: string;
  resolver_principal_id: string;
  resolver_role?: string;
  policy_version: string;
  snapshot_hash: string;
  assignment_scope?: AssignmentScopeEvidence;
  current_authority_checked: boolean;
  snapshot_checked: boolean;
  command_effect_checked: boolean;
  duplicate?: boolean;
}

export type ApprovalAuthorityDecision =
  | {
      ok: true;
      status: 200;
      approval: ImmutableApprovalRequestRecord;
      resolution: ApprovalResolution;
      resolver_role: string;
      duplicate: boolean;
      evidence: ApprovalAuthorityEvidence;
    }
  | {
      ok: false;
      status: 403 | 409 | 410;
      reason: ApprovalAuthorityDenialReason;
      evidence: ApprovalAuthorityEvidence;
    };

export type ApprovalExecutionDecision =
  | {
      ok: true;
      status: 200;
      approval: ImmutableApprovalRequestRecord;
      command_intent_id: string;
      command_id: string;
      effect_key: string;
      evidence: ApprovalAuthorityEvidence;
    }
  | {
      ok: false;
      status: 403 | 409 | 410;
      reason: ApprovalAuthorityDenialReason;
      evidence: ApprovalAuthorityEvidence;
    };

const currentStatuses = new Set(["active", "current"]);
const terminalExecutionStates = new Set<ApprovalExecutionState>(["succeeded", "failed", "ambiguous", "cancelled"]);
const riskRank: Record<ApprovalRiskLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };

function timestampAtOrBefore(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now.getTime();
}

function timestampAfter(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > now.getTime();
}

function policyCurrent(policy: ApprovalAuthorityPolicyRecord, now: Date): boolean {
  return currentStatuses.has(policy.status) &&
    !timestampAfter(policy.starts_at, now) &&
    !timestampAtOrBefore(policy.ends_at, now);
}

function baseEvidence(approval: ImmutableApprovalRequestRecord, resolver: HumanPrincipal): ApprovalAuthorityEvidence {
  return {
    approval_id: approval.approval_id,
    assignment_id: approval.assignment_id,
    resolver_principal_id: resolver.principal_id,
    policy_version: approval.policy_version,
    snapshot_hash: approval.snapshot_hash,
    current_authority_checked: false,
    snapshot_checked: false,
    command_effect_checked: false,
  };
}

function deny(
  approval: ImmutableApprovalRequestRecord,
  resolver: HumanPrincipal,
  reason: ApprovalAuthorityDenialReason,
  status: 403 | 409 | 410 = 403,
  evidence: Partial<ApprovalAuthorityEvidence> = {},
): ApprovalAuthorityDecision {
  return {
    ok: false,
    status,
    reason,
    evidence: { ...baseEvidence(approval, resolver), ...evidence },
  };
}

function executionDeny(
  approval: ImmutableApprovalRequestRecord,
  resolverPrincipalId: string,
  reason: ApprovalAuthorityDenialReason,
  status: 403 | 409 | 410 = 403,
  evidence: Partial<ApprovalAuthorityEvidence> = {},
): ApprovalExecutionDecision {
  return {
    ok: false,
    status,
    reason,
    evidence: {
      ...baseEvidence(approval, { principal_id: resolverPrincipalId, kind: "human" }),
      ...evidence,
    },
  };
}

function currentPolicy(
  approval: ImmutableApprovalRequestRecord,
  policies: readonly ApprovalAuthorityPolicyRecord[],
  now: Date,
): ApprovalAuthorityPolicyRecord | null {
  const matching = policies.filter((policy) =>
    policy.assignment_id === approval.assignment_id &&
    policy.action === approval.action_key &&
    policy.policy_version === approval.policy_version &&
    policyCurrent(policy, now),
  );
  return matching.length === 1 ? matching[0]! : null;
}

export function approvalSnapshotHashIsValid(value: string): boolean {
  return /^sha256:[0-9a-f]{64}$/.test(value);
}

export function evaluateApprovalResolution(input: {
  approval: ImmutableApprovalRequestRecord;
  resolver: HumanPrincipal;
  resolver_class: "human" | "employee" | "service" | "platform";
  resolution: ApprovalResolution;
  current_snapshot_hash: string;
  assignments: readonly AssignmentPrincipalRecord[];
  grants: readonly AssignmentResourceGrantRecord[];
  policies: readonly ApprovalAuthorityPolicyRecord[];
  now?: Date;
}): ApprovalAuthorityDecision {
  const now = input.now ?? new Date();
  const approval = input.approval;
  const base = baseEvidence(approval, input.resolver);

  if (approval.revoked_at || approval.status === "revoked") {
    return deny(approval, input.resolver, "approval_revoked", 410);
  }
  if (timestampAtOrBefore(approval.expires_at, now) || approval.status === "expired") {
    return deny(approval, input.resolver, "approval_expired", 410);
  }
  if (approval.status !== "pending") {
    const duplicate = approval.resolution === input.resolution;
    if (duplicate && approval.resolved_by_principal_id === input.resolver.principal_id && approval.resolved_by_role) {
      return {
        ok: true,
        status: 200,
        approval,
        resolution: input.resolution,
        resolver_role: approval.resolved_by_role,
        duplicate: true,
        evidence: {
          ...base,
          resolver_role: approval.resolved_by_role,
          current_authority_checked: true,
          snapshot_checked: true,
          command_effect_checked: input.resolution === "approved",
          duplicate: true,
        },
      };
    }
    return deny(approval, input.resolver, "approval_not_pending", 409);
  }
  if (input.resolver_class !== "human" || input.resolver.kind === "employee") {
    return deny(approval, input.resolver, "resolver_must_be_human");
  }
  if (approval.requester_principal_id === input.resolver.principal_id) {
    return deny(approval, input.resolver, "employee_self_approval");
  }
  if (!approvalSnapshotHashIsValid(input.current_snapshot_hash) || input.current_snapshot_hash !== approval.snapshot_hash) {
    return deny(approval, input.resolver, "snapshot_changed", 409, { snapshot_checked: true });
  }

  const policy = currentPolicy(approval, input.policies, now);
  if (!policy) {
    const sameAction = input.policies.some((candidate) =>
      candidate.assignment_id === approval.assignment_id && candidate.action === approval.action_key,
    );
    return deny(
      approval,
      input.resolver,
      sameAction ? "authority_policy_changed" : "authority_policy_missing",
      sameAction ? 409 : 403,
      { snapshot_checked: true, current_authority_checked: true },
    );
  }
  const policyRoles = new Set(policy.required_roles);
  if (approval.required_resolver_roles.length === 0 || approval.required_resolver_roles.some((role) => !policyRoles.has(role))) {
    return deny(approval, input.resolver, "authority_policy_changed", 409, {
      snapshot_checked: true,
      current_authority_checked: true,
    });
  }
  const policyRisk = policy.risk_class in riskRank ? policy.risk_class as ApprovalRiskLevel : null;
  if (!policyRisk || riskRank[approval.risk_level] < riskRank[policyRisk]) {
    return deny(approval, input.resolver, "risk_policy_mismatch", 409, {
      snapshot_checked: true,
      current_authority_checked: true,
    });
  }

  const scope = resolveAssignmentScope({
    principal: input.resolver,
    assignments: input.assignments,
    grants: input.grants,
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    assignment_id: approval.assignment_id,
    allowed_roles: approval.required_resolver_roles,
    resource_class: "approval",
    resource_id: approval.approval_id,
    action: approval.required_resolver_action,
    now,
  });
  if (!scope.ok) {
    const reason = scope.reason === "wrong_role" ? "resolver_role_not_permitted" : "resolver_grant_missing";
    return deny(approval, input.resolver, reason, scope.status === 410 ? 410 : 403, {
      snapshot_checked: true,
      current_authority_checked: true,
      assignment_scope: scope.evidence,
    });
  }
  if (input.resolution === "approved" && (!approval.command_intent_id || !approval.command_id || !approval.effect_key)) {
    return deny(approval, input.resolver, "approval_command_missing", 409, {
      snapshot_checked: true,
      current_authority_checked: true,
      assignment_scope: scope.evidence,
    });
  }

  return {
    ok: true,
    status: 200,
    approval,
    resolution: input.resolution,
    resolver_role: scope.assignment.role,
    duplicate: false,
    evidence: {
      ...base,
      resolver_role: scope.assignment.role,
      snapshot_checked: true,
      current_authority_checked: true,
      command_effect_checked: input.resolution === "approved",
      assignment_scope: scope.evidence,
      duplicate: false,
    },
  };
}

export function validateApprovedActionExecution(input: {
  approval: ImmutableApprovalRequestRecord;
  action_key: string;
  resource_class: string;
  resource_id: string;
  current_snapshot_hash: string;
  resolver_principal_id: string;
  assignments: readonly AssignmentPrincipalRecord[];
  grants: readonly AssignmentResourceGrantRecord[];
  policies: readonly ApprovalAuthorityPolicyRecord[];
  now?: Date;
}): ApprovalExecutionDecision {
  const approval = input.approval;
  const now = input.now ?? new Date();
  if (approval.revoked_at || approval.status === "revoked") {
    return executionDeny(approval, input.resolver_principal_id, "approval_revoked", 410);
  }
  if (timestampAtOrBefore(approval.expires_at, now) || approval.status === "expired") {
    return executionDeny(approval, input.resolver_principal_id, "approval_expired", 410);
  }
  if (approval.status !== "approved" || approval.resolution !== "approved" || !approval.resolved_by_role) {
    return executionDeny(approval, input.resolver_principal_id, "approval_not_approved");
  }
  if (
    approval.action_key !== input.action_key ||
    approval.resource_class !== input.resource_class ||
    approval.resource_id !== input.resource_id
  ) {
    return executionDeny(approval, input.resolver_principal_id, "approval_execution_scope_mismatch");
  }
  if (input.current_snapshot_hash !== approval.snapshot_hash) {
    return executionDeny(approval, input.resolver_principal_id, "snapshot_changed", 409, { snapshot_checked: true });
  }
  if (approval.execution_state && terminalExecutionStates.has(approval.execution_state) && !approval.execution_receipt_id) {
    return executionDeny(approval, input.resolver_principal_id, "approval_execution_already_terminal", 409, {
      snapshot_checked: true,
    });
  }

  const authority = evaluateApprovalResolution({
    approval: { ...approval, status: "pending", resolution: null },
    resolver: { principal_id: input.resolver_principal_id, kind: "human" },
    resolver_class: "human",
    resolution: "approved",
    current_snapshot_hash: input.current_snapshot_hash,
    assignments: input.assignments,
    grants: input.grants,
    policies: input.policies,
    now,
  });
  if (!authority.ok) {
    return executionDeny(approval, input.resolver_principal_id, authority.reason, authority.status, authority.evidence);
  }
  if (!approval.command_intent_id || !approval.command_id || !approval.effect_key) {
    return executionDeny(approval, input.resolver_principal_id, "approval_command_missing", 409, authority.evidence);
  }

  return {
    ok: true,
    status: 200,
    approval,
    command_intent_id: approval.command_intent_id,
    command_id: approval.command_id,
    effect_key: approval.effect_key,
    evidence: {
      ...authority.evidence,
      command_effect_checked: true,
    },
  };
}
