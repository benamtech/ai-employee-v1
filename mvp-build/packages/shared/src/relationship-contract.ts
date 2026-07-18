import { z } from "zod";

const prefixedId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[a-z0-9]+$`), `expected ${prefix}_ prefixed id`);

export const RelationshipStatusSchema = z.enum([
  "pending",
  "active",
  "suspended",
  "revoked",
  "expired",
  "ended",
]);
export type RelationshipStatus = z.infer<typeof RelationshipStatusSchema>;

export const PrincipalActorClassSchema = z.enum(["human", "employee", "service", "platform"]);
export type PrincipalActorClass = z.infer<typeof PrincipalActorClassSchema>;

export const AssignmentRoleSchema = z.enum([
  "owner",
  "manager",
  "operator",
  "approver",
  "viewer",
  "billing",
]);
export type AssignmentRole = z.infer<typeof AssignmentRoleSchema>;

export const RelationshipTypeSchema = z.enum([
  "employment",
  "management",
  "access",
  "authority",
  "custody",
  "payer",
  "beneficiary",
  "supervision",
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const RelationshipProvenanceSchema = z.object({
  source: z.enum(["explicit", "backfill_inferred", "system"]),
  sourceRef: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  recordedAt: z.string().datetime({ offset: true }),
});
export type RelationshipProvenance = z.infer<typeof RelationshipProvenanceSchema>;

export const OrganizationSchema = z.object({
  id: prefixedId("org"),
  displayName: z.string().min(1),
  status: z.enum(["active", "suspended", "closed"]),
  createdAt: z.string().datetime({ offset: true }),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const HumanPrincipalSchema = z.object({
  id: prefixedId("hpr"),
  userId: prefixedId("user"),
  status: z.enum(["active", "suspended", "disabled"]),
  createdAt: z.string().datetime({ offset: true }),
});
export type HumanPrincipal = z.infer<typeof HumanPrincipalSchema>;

export const EmployeePrincipalSchema = z.object({
  id: prefixedId("epr"),
  employeeId: prefixedId("emp"),
  status: z.enum(["active", "suspended", "retired"]),
  createdAt: z.string().datetime({ offset: true }),
});
export type EmployeePrincipal = z.infer<typeof EmployeePrincipalSchema>;

export const AccountOrganizationRelationshipSchema = z.object({
  id: prefixedId("rel"),
  organizationId: prefixedId("org"),
  accountId: prefixedId("acct"),
  relationshipType: z.literal("management"),
  status: RelationshipStatusSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  provenance: RelationshipProvenanceSchema,
});
export type AccountOrganizationRelationship = z.infer<
  typeof AccountOrganizationRelationshipSchema
>;

export const EmployeeAssignmentSchema = z.object({
  id: prefixedId("asn"),
  organizationId: prefixedId("org"),
  accountId: prefixedId("acct"),
  employeePrincipalId: prefixedId("epr"),
  status: RelationshipStatusSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  policyVersion: z.string().min(1),
  provenance: RelationshipProvenanceSchema,
});
export type EmployeeAssignment = z.infer<typeof EmployeeAssignmentSchema>;

export const AssignmentPrincipalSchema = z.object({
  id: prefixedId("aspr"),
  assignmentId: prefixedId("asn"),
  principalId: z.string().min(1),
  principalClass: PrincipalActorClassSchema,
  role: AssignmentRoleSchema,
  status: RelationshipStatusSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  policyVersion: z.string().min(1),
  provenance: RelationshipProvenanceSchema,
});
export type AssignmentPrincipal = z.infer<typeof AssignmentPrincipalSchema>;

export const AssignmentResourceGrantSchema = z.object({
  id: prefixedId("grant"),
  assignmentId: prefixedId("asn"),
  principalId: z.string().min(1).nullable(),
  resourceClass: z.string().min(1),
  resourceId: z.string().min(1).nullable(),
  actions: z.array(z.string().min(1)).min(1),
  status: RelationshipStatusSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  policyVersion: z.string().min(1),
  provenance: RelationshipProvenanceSchema,
});
export type AssignmentResourceGrant = z.infer<typeof AssignmentResourceGrantSchema>;

export const AssignmentAuthorityPolicySchema = z.object({
  id: prefixedId("apol"),
  assignmentId: prefixedId("asn"),
  policyVersion: z.string().min(1),
  action: z.string().min(1),
  requiredRoles: z.array(AssignmentRoleSchema).min(1),
  riskClass: z.enum(["low", "medium", "high", "critical"]),
  stepUpRequired: z.boolean(),
  status: RelationshipStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
});
export type AssignmentAuthorityPolicy = z.infer<typeof AssignmentAuthorityPolicySchema>;

export const CommercialRelationshipSchema = z.object({
  id: prefixedId("crel"),
  assignmentId: prefixedId("asn"),
  relationshipType: z.enum(["payer", "beneficiary"]),
  organizationId: prefixedId("org"),
  accountId: prefixedId("acct").nullable(),
  status: RelationshipStatusSchema,
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  provenance: RelationshipProvenanceSchema,
});
export type CommercialRelationship = z.infer<typeof CommercialRelationshipSchema>;

export const ExecutionContextSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("assignment"),
    assignmentId: prefixedId("asn"),
    organizationId: prefixedId("org"),
    accountId: prefixedId("acct"),
  }),
  z.object({
    kind: z.literal("platform"),
    platformContext: z.string().min(1),
  }),
  z.object({
    kind: z.literal("system"),
    systemContext: z.string().min(1),
  }),
]);
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

export const AuthorizationDecisionRequestSchema = z.object({
  actorPrincipalId: z.string().min(1),
  actorClass: PrincipalActorClassSchema,
  context: ExecutionContextSchema,
  resourceClass: z.string().min(1),
  resourceId: z.string().min(1).nullable(),
  action: z.string().min(1),
  policyVersion: z.string().min(1),
  correlationId: z.string().min(1),
  requestedAt: z.string().datetime({ offset: true }),
  risk: z.object({
    class: z.enum(["low", "medium", "high", "critical"]),
    channel: z.string().min(1),
    stepUpSatisfied: z.boolean(),
  }),
});
export type AuthorizationDecisionRequest = z.infer<
  typeof AuthorizationDecisionRequestSchema
>;

export const AuthorizationDecisionSchema = z.object({
  allowed: z.boolean(),
  reasonCode: z.string().min(1),
  policyVersion: z.string().min(1),
  actorPrincipalId: z.string().min(1),
  context: ExecutionContextSchema,
  correlationId: z.string().min(1),
  decidedAt: z.string().datetime({ offset: true }),
  evidence: z.array(z.string().min(1)),
});
export type AuthorizationDecision = z.infer<typeof AuthorizationDecisionSchema>;

export const RESTRICTED_LAUNCH_TOPOLOGY = Object.freeze({
  allowCrossOrganizationAssignments: false,
  allowMarketplaceAssignments: false,
  requireExplicitAssignmentForEveryHuman: true,
  requireAssignmentContextForCustomerWork: true,
});

export function relationshipIsCurrent(
  relationship: Pick<EmployeeAssignment | AssignmentPrincipal | AssignmentResourceGrant, "status" | "startsAt" | "endsAt">,
  at = new Date(),
): boolean {
  if (relationship.status !== "active") return false;
  const point = at.getTime();
  const starts = Date.parse(relationship.startsAt);
  const ends = relationship.endsAt ? Date.parse(relationship.endsAt) : Number.POSITIVE_INFINITY;
  return Number.isFinite(starts) && starts <= point && point < ends;
}

export function assignmentAllowedByLaunchTopology(input: {
  employerOrganizationId: string;
  beneficiaryOrganizationId: string;
}): boolean {
  return (
    RESTRICTED_LAUNCH_TOPOLOGY.allowCrossOrganizationAssignments ||
    input.employerOrganizationId === input.beneficiaryOrganizationId
  );
}
