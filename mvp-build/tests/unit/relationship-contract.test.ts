import { describe, expect, it } from "vitest";
import { LaborRelationshipSchema } from "../../packages/shared/src/labor-relationship-record.js";
import {
  AssignmentPrincipalSchema,
  AuthorizationDecisionRequestSchema,
  EmployeeAssignmentSchema,
  ExecutionContextSchema,
  RESTRICTED_LAUNCH_TOPOLOGY,
  assignmentAllowedByLaunchTopology,
  relationshipIsCurrent,
} from "../../packages/shared/src/relationship-contract.js";

const provenance = {
  source: "explicit" as const,
  sourceRef: "operator-approved-test",
  confidence: "high" as const,
  recordedAt: "2026-07-18T00:00:00.000Z",
};

const assignment = {
  id: "asn_alpha",
  organizationId: "org_alpha",
  accountId: "acct_alpha",
  employeePrincipalId: "epr_alpha",
  status: "active" as const,
  startsAt: "2026-07-18T00:00:00.000Z",
  endsAt: null,
  policyVersion: "assignment-policy-v1",
  provenance,
};

describe("labor relationship contract", () => {
  it("keeps employee identity distinct from assignment and commercial/account scope", () => {
    expect(EmployeeAssignmentSchema.parse(assignment)).toEqual(assignment);
    expect(assignment.employeePrincipalId).not.toBe(assignment.accountId);
    expect(assignment.id).not.toBe(assignment.employeePrincipalId);
  });

  it("represents employment, management, supervision, and assignment custody explicitly", () => {
    for (const relationshipType of ["employment", "supervision"] as const) {
      expect(
        LaborRelationshipSchema.parse({
          id: `rel_${relationshipType}`,
          relationshipType,
          subjectPrincipalId: "epr_alpha",
          subjectPrincipalClass: "employee",
          organizationId: "org_alpha",
          accountId: "acct_alpha",
          assignmentId: "asn_alpha",
          role: relationshipType === "employment" ? "employee" : "supervised_employee",
          status: "active",
          startsAt: "2026-07-18T00:00:00.000Z",
          endsAt: null,
          policyVersion: "labor-v1",
          provenance,
        }).relationshipType,
      ).toBe(relationshipType);
    }

    expect(
      LaborRelationshipSchema.safeParse({
        id: "rel_bademployment",
        relationshipType: "employment",
        subjectPrincipalId: "hpr_owner",
        subjectPrincipalClass: "human",
        organizationId: "org_alpha",
        accountId: "acct_alpha",
        assignmentId: null,
        role: "employee",
        status: "active",
        startsAt: "2026-07-18T00:00:00.000Z",
        endsAt: null,
        policyVersion: "labor-v1",
        provenance,
      }).success,
    ).toBe(false);

    expect(
      LaborRelationshipSchema.safeParse({
        id: "rel_badcustody",
        relationshipType: "custody",
        subjectPrincipalId: "hpr_owner",
        subjectPrincipalClass: "human",
        organizationId: "org_alpha",
        accountId: "acct_alpha",
        assignmentId: null,
        role: "connector_custodian",
        status: "active",
        startsAt: "2026-07-18T00:00:00.000Z",
        endsAt: null,
        policyVersion: "labor-v1",
        provenance,
      }).success,
    ).toBe(false);
  });

  it("requires explicit assignment context for customer work", () => {
    expect(
      ExecutionContextSchema.safeParse({
        kind: "assignment",
        organizationId: "org_alpha",
        accountId: "acct_alpha",
      }).success,
    ).toBe(false);

    expect(
      ExecutionContextSchema.parse({
        kind: "assignment",
        assignmentId: "asn_alpha",
        organizationId: "org_alpha",
        accountId: "acct_alpha",
      }),
    ).toMatchObject({ kind: "assignment", assignmentId: "asn_alpha" });
  });

  it("binds authorization requests to actor, assignment, action, policy, risk, and correlation", () => {
    const result = AuthorizationDecisionRequestSchema.parse({
      actorPrincipalId: "hpr_owner",
      actorClass: "human",
      context: {
        kind: "assignment",
        assignmentId: "asn_alpha",
        organizationId: "org_alpha",
        accountId: "acct_alpha",
      },
      resourceClass: "employee_message",
      resourceId: "msg_alpha",
      action: "read",
      policyVersion: "authorization-v1",
      correlationId: "corr_alpha",
      requestedAt: "2026-07-18T00:00:00.000Z",
      risk: { class: "low", channel: "web", stepUpSatisfied: false },
    });

    expect(result.actorPrincipalId).toBe("hpr_owner");
    expect(result.context.kind).toBe("assignment");
    expect(result.action).toBe("read");
  });

  it("treats revoked, suspended, expired, and ended relationships as non-current", () => {
    expect(relationshipIsCurrent(assignment, new Date("2026-07-18T01:00:00.000Z"))).toBe(true);

    for (const status of ["revoked", "suspended", "expired", "ended"] as const) {
      expect(
        relationshipIsCurrent(
          { ...assignment, status },
          new Date("2026-07-18T01:00:00.000Z"),
        ),
      ).toBe(false);
    }

    expect(
      relationshipIsCurrent(
        { ...assignment, endsAt: "2026-07-18T00:30:00.000Z" },
        new Date("2026-07-18T01:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("makes principal role and relationship state explicit", () => {
    const principal = AssignmentPrincipalSchema.parse({
      id: "aspr_owner",
      assignmentId: "asn_alpha",
      principalId: "hpr_owner",
      principalClass: "human",
      role: "owner",
      status: "active",
      startsAt: "2026-07-18T00:00:00.000Z",
      endsAt: null,
      policyVersion: "authorization-v1",
      provenance,
    });

    expect(principal.role).toBe("owner");
    expect(principal.assignmentId).toBe("asn_alpha");
  });

  it("fails closed on cross-organization assignments in the restricted launch topology", () => {
    expect(RESTRICTED_LAUNCH_TOPOLOGY.allowCrossOrganizationAssignments).toBe(false);
    expect(
      assignmentAllowedByLaunchTopology({
        employerOrganizationId: "org_alpha",
        beneficiaryOrganizationId: "org_alpha",
      }),
    ).toBe(true);
    expect(
      assignmentAllowedByLaunchTopology({
        employerOrganizationId: "org_alpha",
        beneficiaryOrganizationId: "org_beta",
      }),
    ).toBe(false);
  });
});
