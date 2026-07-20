import { describe, expect, it } from "vitest";
import {
  ASSIGNMENT_SCOPE_REGISTRY,
  CONSEQUENTIAL_SURFACE_CATEGORIES,
  FORBIDDEN_AUTHORIZERS,
  assignmentScopeSubjectsByCategory,
  enabledCustomerConsequentialSurfaces,
  validateAssignmentScopeRegistry,
  type ConsequentialSurfaceScope,
} from "../../packages/shared/src/authorization-scope-registry.js";

describe("Lane 1 assignment scope registry", () => {
  it("covers every consequential surface category named by the current Lane 1 handoff", () => {
    const result = validateAssignmentScopeRegistry();

    expect(result.ok, result.problems.join("\n")).toBe(true);
    for (const category of CONSEQUENTIAL_SURFACE_CATEGORIES) {
      expect(result.categories[category], `missing category ${category}`).toBeGreaterThan(0);
    }
  });

  it("rejects forbidden authorizers as allowed authorization bases", () => {
    const badRegistry: ConsequentialSurfaceScope[] = [
      ...ASSIGNMENT_SCOPE_REGISTRY,
      {
        key: "route:bad-account-only",
        category: "manager_route",
        subject: "bad account-only route",
        source: "test",
        laneOwner: "Lane 1",
        enabled: true,
        customerConsequential: true,
        scopeRequirement: "assignment_resolver",
        authorizationContract: "C2",
        allowedAuthorizers: ["account_membership_only"],
        deniedAuthorizers: FORBIDDEN_AUTHORIZERS,
        requiredEvidence: ["cross-assignment-denial", "revocation-denial"],
        notes: "negative control",
      },
    ];

    const result = validateAssignmentScopeRegistry(badRegistry);
    expect(result.ok).toBe(false);
    expect(result.problems.join("\n")).toContain("allows forbidden authorizer");
  });

  it("requires commercial rows to be explicitly assignment-scoped", () => {
    const badRegistry: ConsequentialSurfaceScope[] = ASSIGNMENT_SCOPE_REGISTRY.map((item) =>
      item.key === "commercial:meter-events"
        ? { ...item, scopeRequirement: "assignment_resolver" }
        : item,
    );

    const result = validateAssignmentScopeRegistry(badRegistry);
    expect(result.ok).toBe(false);
    expect(result.problems.join("\n")).toContain("commercial:meter-events is commercial but does not require explicit assignment");
  });

  it("keeps the public estimator non-canonical and out of release proof", () => {
    const publicClaimSubjects = assignmentScopeSubjectsByCategory("public_claim");
    expect(publicClaimSubjects).toContain("public estimator and prod-like public estimator scripts");

    const estimator = ASSIGNMENT_SCOPE_REGISTRY.find((item) => item.key === "public:estimator");
    expect(estimator).toMatchObject({ enabled: false, scopeRequirement: "noncanonical_diagnostic" });
    expect(estimator?.requiredEvidence).toContain("must-not-enter-release-proof");
  });

  it("makes every enabled customer-consequential surface require assignment, platform, or system context evidence", () => {
    const surfaces = enabledCustomerConsequentialSurfaces();
    expect(surfaces.length).toBeGreaterThan(20);

    for (const surface of surfaces) {
      expect(surface.scopeRequirement).not.toBe("noncanonical_diagnostic");
      expect(surface.requiredEvidence.length, surface.key).toBeGreaterThanOrEqual(2);
      expect(surface.deniedAuthorizers.length, surface.key).toBeGreaterThan(0);
    }
  });
});
