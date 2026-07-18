import { z } from "zod";

export const OnboardingIdentityStatus = z.enum(["pending", "verified", "rejected", "revoked", "expired"]);
export type OnboardingIdentityStatus = z.infer<typeof OnboardingIdentityStatus>;

export const OnboardingVerificationMethod = z.enum(["middesk_tin"]);
export type OnboardingVerificationMethod = z.infer<typeof OnboardingVerificationMethod>;

export const OnboardingBusinessAddress = z.object({
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(2).max(3),
  postal_code: z.string().min(5).max(10),
  country: z.string().length(2).default("US"),
}).strict();
export type OnboardingBusinessAddress = z.infer<typeof OnboardingBusinessAddress>;

export const StartOnboardingIdentityVerification = z.object({
  owner_session_token: z.string().min(1),
  business_type: z.string().min(1).max(120),
  business_name: z.string().min(1).max(240),
  business_address: OnboardingBusinessAddress,
  tax_id: z.string().min(1).max(32),
  idempotency_key: z.string().min(8).max(160),
  audit_correlation_id: z.string().min(8).max(160).optional(),
}).strict();
export type StartOnboardingIdentityVerification = z.infer<typeof StartOnboardingIdentityVerification>;

export interface OnboardingIdentity {
  id: string;
  accountId: string;
  ownerPrincipalId: string;
  employeePrincipalId: string | null;
  businessType: string;
  taxIdLast4: string;
  verifiedAt: string | null;
  verificationMethod: OnboardingVerificationMethod;
  status: OnboardingIdentityStatus;
  policyVersion: string;
  auditCorrelationId: string;
  immutableSnapshotHash: string | null;
}

export interface OnboardingIdentityDecision {
  allowed: boolean;
  error: "identity_unverified" | "identity_rejected_permanent" | "identity_revoked" | null;
  identityId: string | null;
  policyVersion: string | null;
}
