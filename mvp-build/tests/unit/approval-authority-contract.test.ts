import { describe, expect, it } from "vitest";
import {
  evaluateApprovalResolution,
  validateApprovedActionExecution,
  type ApprovalAuthorityPolicyRecord,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type ImmutableApprovalRequestRecord,
} from "../../packages/shared/src/index.js";

const now = new Date("2026-07-18T16:00:00.000Z");
const snapshotHash = `sha256:${"a".repeat(64)}`;

const approval: ImmutableApprovalRequestRecord = {
  approval_id: "appr_s7_1",
  assignment_id: "asn_s7_1",
  account_id: "acct_s7_1",
  employee_id: "emp_s7_1",
  requester_principal_id: "epr_s7_1",
  requester_principal_class: "employee",
  action_key: "send_estimate_email",
  resource_class: "outbound_email",
  resource_id: "email_s7_1",
  snapshot_hash: snapshotHash,
  policy_version: "authorization-v1",
  required_resolver_roles: ["owner", "approver"],
  required_resolver_action: "approval:resolve:send_estimate_email",
  risk_level: "medium",
  expires_at: "2026-07-19T16:00:00.000Z",
  status: "pending",
  command_intent_id: "intent_s7_1",
  command_id: "cmd_s7_1",
  effect_key: "approval:appr_s7_1:send_estimate_email",
  execution_state: "not_started",
};

const assignments: AssignmentPrincipalRecord[] = [
  {
    assignment_id: approval.assignment_id,
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    principal_id: "hpr_owner",
    role: "owner",
    status: "active",
  },
  {
    assignment_id: approval.assignment_id,
    account_id: approval.account_id,
    employee_id: approval.employee_id,
    principal_id: "epr_s7_1",
    role: "employee",
    status: "active",
  },
];

const grants: AssignmentResourceGrantRecord[] = [
  {
    assignment_id: approval.assignment_id,
    resource_class: "approval",
    resource_id: approval.approval_id,
    actions: [approval.required_resolver_action],
  },
];

const policies: ApprovalAuthorityPolicyRecord[] = [
  {
    assignment_id: approval.assignment_id,
    policy_version: approval.policy_version,
    action: approval.action_key,
    required_roles: ["owner", "approver"],
    risk_class: "medium",
    step_up_required: true,
    status: "active",
    starts_at: "2026-07-01T00:00:00.000Z",
  },
];

describe("S7 approval authority contract", () => {
  it("allows one current human resolver with exact assignment, role, grant, policy, and snapshot", () => {
    const decision = evaluateApprovalResolution({
      approval,
      resolver: { principal_id: "hpr_owner", kind: "human" },
      resolver_class: "human",
      resolution: "approved",
      current_snapshot_hash: snapshotHash,
      assignments,
      grants,
      policies,
      now,
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.resolver_role).toBe("owner");
      expect(decision.duplicate).toBe(false);
      expect(decision.evidence.snapshot_checked).toBe(true);
      expect(decision.evidence.current_authority_checked).toBe(true);
      expect(decision.evidence.command_effect_checked).toBe(true);
    }
  });

  it("denies employee self-approval and non-human resolvers", () => {
    const employee = evaluateApprovalResolution({
      approval,
      resolver: { principal_id: "epr_s7_1", kind: "employee" },
      resolver_class: "employee",
      resolution: "approved",
      current_snapshot_hash: snapshotHash,
      assignments,
      grants,
      policies,
      now,
    });
    expect(employee.ok).toBe(false);
    if (!employee.ok) expect(employee.reason).toBe("resolver_must_be_human");

    const selfApproval = evaluateApprovalResolution({
      approval: { ...approval, requester_principal_id: "hpr_owner", requester_principal_class: "human" },
      resolver: { principal_id: "hpr_owner", kind: "human" },
      resolver_class: "human",
      resolution: "approved",
      current_snapshot_hash: snapshotHash,
      assignments,
      grants,
      policies,
      now,
    });
    expect(selfApproval.ok).toBe(false);
    if (!selfApproval.ok) expect(selfApproval.reason).toBe("employee_self_approval");
  });

  it("denies changed snapshots, expired requests, revoked roles, and changed policy", () => {
    const changed = evaluateApprovalResolution({
      approval,
      resolver: { principal_id: "hpr_owner", kind: "human" },
      resolver_class: "human",
      resolution: "approved",
      current_snapshot_hash: `sha256:${"b".repeat(64)}`,
      assignments,
      grants,
      policies,
      now,
    });
    expect(changed.ok).toBe(false);
    if (!changed.ok) expect(changed.reason).toBe("snapshot_changed");

    const expired = evaluateApprovalResolution({
      approval: { ...approval, expires_at: "2026-07-18T15:59:59.000Z" },
      resolver: { principal_id: "hpr_owner", kind: "human" },
      resolver_class: "human",
      resolution: "approved",
      current_snapshot_hash: snapshotHash,
      assignments,
      grants,
      policies,
      now,
    });
    expect(expired.ok).toBe(false);
    if (!expired.ok) expect(expired.reason).toBe("approval_expired");

    const revokedRole = evaluateApprovalResolution({
      approval,
      resolver: { principal_id: "hpr_owner", kind: "human" },
      resolver_class: "human",
      resolution: "approved",
      current_snapshot_hash: snapshotHash,
      assignments: assignments.map((row) => row.principal_id === "hpr_owner" ? { ...row, status: "revoked" } : row),
      grants,
      policies,
      now,
    });
    expect(revokedRole.ok).toBe(false);
    if (!revokedRole.ok) expect(revokedRole.reason).toBe("resolver_grant_missing");

    const changedPolicy = evaluateApprovalResolution({
      approval,
      resolver: { principal_id: "hpr_owner", kind: "human" },
      resolver_class: "human",
      resolution: "approved",
      current_snapshot_hash: snapshotHash,
      assignments,
      grants,
      policies: policies.map((row) => ({ ...row, policy_version: "authorization-v2" })),
      now,
    });
    expect(changedPolicy.ok).toBe(false);
    if (!changedPolicy.ok) expect(changedPolicy.reason).toBe("authority_policy_changed");
  });

  it("requires exact approved resource and revalidates current authority before execution", () => {
    const resolved: ImmutableApprovalRequestRecord = {
      ...approval,
      status: "approved",
      resolution: "approved",
      resolved_by_principal_id: "hpr_owner",
      resolved_by_role: "owner",
      resolved_at: now.toISOString(),
    };
    const accepted = validateApprovedActionExecution({
      approval: resolved,
      action_key: approval.action_key,
      resource_class: approval.resource_class,
      resource_id: approval.resource_id,
      current_snapshot_hash: snapshotHash,
      resolver_principal_id: "hpr_owner",
      assignments,
      grants,
      policies,
      now,
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.command_id).toBe(approval.command_id);
      expect(accepted.effect_key).toBe(approval.effect_key);
    }

    const wrongResource = validateApprovedActionExecution({
      approval: resolved,
      action_key: approval.action_key,
      resource_class: approval.resource_class,
      resource_id: "email_other",
      current_snapshot_hash: snapshotHash,
      resolver_principal_id: "hpr_owner",
      assignments,
      grants,
      policies,
      now,
    });
    expect(wrongResource.ok).toBe(false);
    if (!wrongResource.ok) expect(wrongResource.reason).toBe("approval_execution_scope_mismatch");
  });
});
