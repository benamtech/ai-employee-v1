import { describe, expect, it } from "vitest";
import {
  enforceOwnerSessionAssignment,
  resolveAssignmentScope,
  resolveSmsChannelAssignment,
  validateSignedResourceDurableBoundary,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type OwnerSessionRecord,
} from "../../packages/shared/src/index.js";

const now = new Date("2026-07-18T12:00:00.000Z");
const future = "2026-07-18T13:00:00.000Z";

const ownerSession: OwnerSessionRecord = {
  session_id: "owner_session_1",
  user_id: "user_1",
  account_id: "acct_1",
  human_principal_id: "human_1",
  expires_at: future,
};

const assignments: AssignmentPrincipalRecord[] = [
  {
    assignment_id: "assign_1",
    account_id: "acct_1",
    employee_id: "emp_1",
    principal_id: "human_1",
    role: "owner",
    status: "current",
  },
  {
    assignment_id: "assign_2",
    account_id: "acct_2",
    employee_id: "emp_2",
    principal_id: "human_2",
    role: "owner",
    status: "current",
  },
  {
    assignment_id: "assign_support",
    account_id: "acct_1",
    employee_id: "emp_3",
    principal_id: "human_support",
    role: "support",
    status: "current",
  },
  {
    assignment_id: "assign_revoked",
    account_id: "acct_1",
    employee_id: "emp_revoked",
    principal_id: "human_1",
    role: "owner",
    status: "current",
    revoked_at: "2026-07-18T11:59:00.000Z",
  },
];

const grants: AssignmentResourceGrantRecord[] = [
  {
    assignment_id: "assign_1",
    resource_class: "employee",
    resource_id: "emp_1",
    actions: ["read", "message:create", "stream:read", "materialize"],
  },
  {
    assignment_id: "assign_1",
    resource_class: "artifact",
    resource_id: "artifact_1",
    actions: ["artifact:read"],
  },
  {
    assignment_id: "assign_1",
    resource_class: "preview",
    resource_id: "approval_1",
    actions: ["preview:resolve", "preview:action"],
  },
  {
    assignment_id: "assign_1",
    resource_class: "channel:sms",
    resource_id: "+15550001111",
    actions: ["sms:ingest", "sms:reply"],
  },
];

describe("S2 owner route assignment enforcement", () => {
  it("passes only through owner_session -> principal -> current assignment -> resource grant", () => {
    const decision = enforceOwnerSessionAssignment({
      session: ownerSession,
      assignments,
      grants,
      employee_id: "emp_1",
      resource_class: "employee",
      resource_id: "emp_1",
      action: "message:create",
      require_command_effect: true,
      command_effect_intent_id: "cmd_1",
      now,
    });

    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.assignment.assignment_id).toBe("assign_1");
      expect(decision.evidence.grant_checked).toBe(true);
      expect(decision.evidence.command_effect_checked).toBe(true);
    }
  });

  it("denies wrong account, wrong employee, wrong role, revoked assignment, and missing C3 intent", () => {
    const wrongAccount = resolveAssignmentScope({
      principal: { principal_id: "human_1" },
      assignments,
      account_id: "acct_2",
      employee_id: "emp_1",
      now,
    });
    expect(wrongAccount.ok).toBe(false);
    if (!wrongAccount.ok) expect(wrongAccount.reason).toBe("wrong_account");

    const wrongEmployee = enforceOwnerSessionAssignment({ session: ownerSession, assignments, employee_id: "emp_2", now });
    expect(wrongEmployee.ok).toBe(false);
    if (!wrongEmployee.ok) expect(wrongEmployee.reason).toBe("wrong_employee");

    const wrongRole = resolveAssignmentScope({
      principal: { principal_id: "human_support" },
      assignments,
      account_id: "acct_1",
      employee_id: "emp_3",
      allowed_roles: ["owner"],
      now,
    });
    expect(wrongRole.ok).toBe(false);
    if (!wrongRole.ok) expect(wrongRole.reason).toBe("wrong_role");

    const revoked = enforceOwnerSessionAssignment({ session: ownerSession, assignments, employee_id: "emp_revoked", now });
    expect(revoked.ok).toBe(false);
    if (!revoked.ok) expect(revoked.reason).toBe("wrong_employee");

    const missingC3 = enforceOwnerSessionAssignment({
      session: ownerSession,
      assignments,
      grants,
      employee_id: "emp_1",
      resource_class: "employee",
      resource_id: "emp_1",
      action: "message:create",
      require_command_effect: true,
      now,
    });
    expect(missingC3.ok).toBe(false);
    if (!missingC3.ok) expect(missingC3.reason).toBe("missing_command_effect_intent");
  });
});

describe("S3 signed resource durable assignment boundary", () => {
  const token = {
    signature_valid: true,
    subject: "approval_1",
    resource_class: "preview",
    resource_id: "approval_1",
    account_id: "acct_1",
    employee_id: "emp_1",
    expires_at: future,
  };

  it("treats signature as possession only and requires durable resource assignment", () => {
    const missing = validateSignedResourceDurableBoundary({ token, durable_resource: null, now });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe("missing_durable_resource");

    const unscoped = validateSignedResourceDurableBoundary({
      token,
      durable_resource: { resource_class: "preview", resource_id: "approval_1", account_id: "acct_1", employee_id: "emp_1" },
      now,
    });
    expect(unscoped.ok).toBe(false);
    if (!unscoped.ok) expect(unscoped.reason).toBe("durable_resource_unscoped");
  });

  it("denies wrong resources, wrong assignments, and replayed terminal actions", () => {
    const mismatch = validateSignedResourceDurableBoundary({
      token,
      durable_resource: { resource_class: "preview", resource_id: "approval_2", account_id: "acct_1", employee_id: "emp_1", assignment_id: "assign_1" },
      now,
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.reason).toBe("token_resource_mismatch");

    const replay = validateSignedResourceDurableBoundary({
      token,
      durable_resource: { resource_class: "preview", resource_id: "approval_1", account_id: "acct_1", employee_id: "emp_1", assignment_id: "assign_1", consumed_at: "2026-07-18T12:00:00.000Z" },
      terminal_action: true,
      now,
    });
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.reason).toBe("terminal_action_replayed");

    const durable = validateSignedResourceDurableBoundary({
      token,
      durable_resource: { resource_class: "preview", resource_id: "approval_1", account_id: "acct_1", employee_id: "emp_1", assignment_id: "assign_2" },
      now,
    });
    expect(durable.ok).toBe(true);
    if (durable.ok) {
      const grantDecision = resolveAssignmentScope({
        principal: { principal_id: "human_1" },
        assignments,
        grants,
        assignment_id: durable.assignment_id,
        resource_class: "preview",
        resource_id: "approval_1",
        action: "preview:action",
        now,
      });
      expect(grantDecision.ok).toBe(false);
      if (!grantDecision.ok) expect(grantDecision.reason).toBe("wrong_assignment");
    }
  });
});

describe("S4 SMS/channel resolver assignment enforcement", () => {
  it("requires Twilio signature plus current phone/channel binding", () => {
    const invalidSignature = resolveSmsChannelAssignment({
      twilio_signature_verified: false,
      phone_binding: { phone_e164: "+15550001111", principal_id: "human_1", account_id: "acct_1", assignment_id: "assign_1", status: "current" },
      assignments,
      grants,
      employee_id: "emp_1",
      now,
    });
    expect(invalidSignature.ok).toBe(false);
    if (!invalidSignature.ok) expect(invalidSignature.reason).toBe("invalid_signature");

    const revokedChannel = resolveSmsChannelAssignment({
      twilio_signature_verified: true,
      phone_binding: { phone_e164: "+15550001111", principal_id: "human_1", account_id: "acct_1", assignment_id: "assign_1", status: "revoked" },
      assignments,
      grants,
      employee_id: "emp_1",
      now,
    });
    expect(revokedChannel.ok).toBe(false);
    if (!revokedChannel.ok) expect(revokedChannel.reason).toBe("revoked_or_expired_channel");
  });

  it("makes phone-only authorization impossible and preserves web/SMS assignment semantics", () => {
    const phoneOnly = resolveSmsChannelAssignment({
      twilio_signature_verified: true,
      phone_binding: { phone_e164: "+15550001111", principal_id: "human_1", account_id: "acct_1", status: "current" },
      assignments: [],
      grants,
      employee_id: "emp_1",
      now,
    });
    expect(phoneOnly.ok).toBe(false);
    if (!phoneOnly.ok) expect(["no_current_assignment", "wrong_account"]).toContain(phoneOnly.reason);

    const wrongEmployee = resolveSmsChannelAssignment({
      twilio_signature_verified: true,
      phone_binding: { phone_e164: "+15550001111", principal_id: "human_1", account_id: "acct_1", assignment_id: "assign_1", status: "current" },
      assignments,
      grants,
      employee_id: "emp_2",
      now,
    });
    expect(wrongEmployee.ok).toBe(false);
    if (!wrongEmployee.ok) expect(wrongEmployee.reason).toBe("wrong_employee");

    const ok = resolveSmsChannelAssignment({
      twilio_signature_verified: true,
      phone_binding: { phone_e164: "+15550001111", principal_id: "human_1", account_id: "acct_1", assignment_id: "assign_1", status: "current" },
      assignments,
      grants,
      employee_id: "emp_1",
      action: "sms:ingest",
      now,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.assignment.assignment_id).toBe("assign_1");
  });
});
