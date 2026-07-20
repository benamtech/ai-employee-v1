import { z } from "zod";
import {
  PrincipalActorClassSchema,
  RelationshipProvenanceSchema,
  RelationshipStatusSchema,
} from "./relationship-contract.js";

const prefixedId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[a-z0-9]+$`), `expected ${prefix}_ prefixed id`);

export const LaborRelationshipSchema = z
  .object({
    id: prefixedId("rel"),
    relationshipType: z.enum(["employment", "management", "supervision", "custody"]),
    subjectPrincipalId: z.string().min(1),
    subjectPrincipalClass: PrincipalActorClassSchema,
    organizationId: prefixedId("org"),
    accountId: prefixedId("acct").nullable(),
    assignmentId: prefixedId("asn").nullable(),
    role: z.string().min(1).nullable(),
    status: RelationshipStatusSchema,
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    policyVersion: z.string().min(1),
    provenance: RelationshipProvenanceSchema,
  })
  .superRefine((relationship, context) => {
    if (
      ["employment", "supervision"].includes(relationship.relationshipType) &&
      relationship.subjectPrincipalClass !== "employee"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjectPrincipalClass"],
        message: `${relationship.relationshipType} requires an employee principal`,
      });
    }

    if (relationship.relationshipType === "custody" && relationship.assignmentId === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignmentId"],
        message: "custody requires an explicit assignment",
      });
    }
  });

export type LaborRelationship = z.infer<typeof LaborRelationshipSchema>;
