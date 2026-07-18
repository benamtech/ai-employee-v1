import { describe, expect, it } from "vitest";
import {
  evaluatePlatformAdminAuthority,
  type PlatformAdminSessionRecord,
  type PlatformPrincipalRecord,
  type PlatformSupportLeaseRecord,
} from "../../packages/shared/src/index.js";

const now = new Date("2026-07-18T19:00:00.000Z");
const principal: PlatformPrincipalRecord = {
  principal_id: "ppr_owner",
  user_id: "user_owner",
  role: "platform_owner",
  status: "active",
  session_version: 4,
  starts_at: "2026-07-01T00:00:00.000Z",
};
const session: PlatformAdminSessionRecord = {
  session_id: "pads_owner",
  principal_id: principal.principal_id,
  audience: "manager-admin",
  session_version: 4,
  authenticated_at: "2026-07-18T18:30:00.000Z",
  step_up_at: "2026-07-18T18:55:00.000Z",
  expires_at: "2026-07-18T20:00:00.000Z",
};
const lease: PlatformSupportLeaseRecord = {
  lease_id: "psl_owner",
  principal_id: principal.principal_id,
  account_id: "acct_target",
  employee_id: "emp_target",
  assignment_id: "asn_target",
  allowed_actions: ["employee:inspect", "employee:repair"],
  reason: "Customer requested incident investigation.",
  starts_at: "2026-07-18T18:50:00.000Z",
  expires_at: "2026-07-18T19:30:00.000Z",
};

function decide(overrides: Partial<Parameters<typeof evaluatePlatformAdminAuthority>[0]> = {}) {
  return evaluatePlatformAdminAuthority({
    enabled: true,
    principal,
    session,
    lease,
    audience: "manager-admin",
    action: "employee:repair",
    action_class: "support_write",
    allowed_roles: ["platform_owner", "platform_operator"],
    account_id: "acct_target",
    employee_id: "emp_target",
    assignment_id: "asn_target",
    now,
    ...overrides,
  });
}

describe("S8 platform authority groundwork", () => {
  it("stays fail-closed while the registry and issuance path are disabled", () => {
    const decision = decide({ enabled: false });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.status).toBe(503);
      expect(decision.reason).toBe("platform_authority_disabled");
      expect(decision.evidence.groundwork_only).toBe(true);
    }
  });

  it("never accepts mutable header identity as platform authority", () => {
    const decision = decide({ mutable_header_identity_present: true });
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.reason).toBe("mutable_header_identity_denied");
  });

  it("requires current versioned principal, correct audience, role, and recent step-up", () => {
    const stale = decide({ session: { ...session, session_version: 3 } });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.reason).toBe("platform_session_version_stale");

    const audience = decide({ session: { ...session, audience: "other-admin" } });
    expect(audience.ok).toBe(false);
    if (!audience.ok) expect(audience.reason).toBe("platform_audience_mismatch");

    const role = decide({ principal: { ...principal, role: "support_readonly" } });
    expect(role.ok).toBe(false);
    if (!role.ok) expect(role.reason).toBe("platform_role_denied");

    const noStepUp = decide({ session: { ...session, step_up_at: null } });
    expect(noStepUp.ok).toBe(false);
    if (!noStepUp.ok) expect(noStepUp.reason).toBe("platform_step_up_required");
  });

  it("requires a current action-scoped support lease with a concrete reason", () => {
    const missing = decide({ lease: null });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe("support_lease_required");

    const expired = decide({ lease: { ...lease, expires_at: "2026-07-18T18:59:59.000Z" } });
    expect(expired.ok).toBe(false);
    if (!expired.ok) expect(expired.reason).toBe("support_lease_expired");

    const wrongAssignment = decide({ lease: { ...lease, assignment_id: "asn_other" } });
    expect(wrongAssignment.ok).toBe(false);
    if (!wrongAssignment.ok) expect(wrongAssignment.reason).toBe("support_lease_scope_mismatch");

    const noReason = decide({ lease: { ...lease, reason: "" } });
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.reason).toBe("support_reason_required");
  });

  it("defines the future allow path without enabling any live route", () => {
    const decision = decide();
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.evidence).toMatchObject({
        principal_id: principal.principal_id,
        session_id: session.session_id,
        lease_id: lease.lease_id,
        step_up_checked: true,
        lease_checked: true,
        durable_identity_checked: true,
        groundwork_only: true,
      });
    }
  });
});
