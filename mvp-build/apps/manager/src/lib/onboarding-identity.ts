import { createHash, createHmac, randomUUID } from "node:crypto";
import type {
  OnboardingBusinessAddress,
  OnboardingIdentityDecision,
  StartOnboardingIdentityVerification,
} from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { sealSecret } from "./secrets.js";
import {
  createMiddeskBusiness,
  getMiddeskBusiness,
  type OnboardingProviderDecision,
} from "./onboarding-identity-provider.js";

export interface SafeOnboardingIdentity {
  id: string;
  account_id: string;
  owner_principal_id: string;
  employee_principal_id: string | null;
  business_type: string;
  business_name: string;
  business_address: OnboardingBusinessAddress;
  tax_id_last4: string;
  verified_at: string | null;
  verification_method: "middesk_tin";
  provider: "middesk";
  provider_business_id: string | null;
  provider_status: string | null;
  status: "pending" | "verified" | "rejected" | "revoked" | "expired";
  policy_version: string;
  audit_correlation_id: string;
  immutable_snapshot_hash: string | null;
}

export interface IdentityVerificationStartResult {
  identity: SafeOnboardingIdentity;
  attempt_id: string | null;
  attempt_status: string;
  retry_after_at: string | null;
  duplicate: boolean;
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

function requiredPepper(): string {
  const value = process.env.ONBOARDING_IDENTITY_PEPPER ?? process.env.SIGNING_SECRET;
  if (!value || value.length < 16) throw new Error("ONBOARDING_IDENTITY_PEPPER_missing_or_short");
  return value;
}

export function normalizeUsTaxId(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{9}$/.test(digits)) throw new Error("tax_id_must_be_9_digits");
  return digits;
}

export function taxIdFingerprint(taxId: string): string {
  return `sha256:${createHmac("sha256", requiredPepper()).update(normalizeUsTaxId(taxId)).digest("hex")}`;
}

export function hashProviderPayload(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function policyVersion(): string {
  return process.env.ONBOARDING_IDENTITY_POLICY_VERSION ?? "onboarding-identity-v1";
}

function safeIdentity(row: Record<string, unknown>): SafeOnboardingIdentity {
  return {
    id: String(row.id),
    account_id: String(row.account_id),
    owner_principal_id: String(row.owner_principal_id),
    employee_principal_id: row.employee_principal_id ? String(row.employee_principal_id) : null,
    business_type: String(row.business_type),
    business_name: String(row.business_name),
    business_address: row.business_address as OnboardingBusinessAddress,
    tax_id_last4: String(row.tax_id_last4),
    verified_at: row.verified_at ? String(row.verified_at) : null,
    verification_method: "middesk_tin",
    provider: "middesk",
    provider_business_id: row.provider_business_id ? String(row.provider_business_id) : null,
    provider_status: row.provider_status ? String(row.provider_status) : null,
    status: String(row.status) as SafeOnboardingIdentity["status"],
    policy_version: String(row.policy_version),
    audit_correlation_id: String(row.audit_correlation_id),
    immutable_snapshot_hash: row.immutable_snapshot_hash ? String(row.immutable_snapshot_hash) : null,
  };
}

export async function loadOnboardingIdentity(
  db: SupabaseClient,
  accountId: string,
  ownerPrincipalId: string,
): Promise<SafeOnboardingIdentity | null> {
  const result = await db.from("onboarding_identities")
    .select("id,account_id,owner_principal_id,employee_principal_id,business_type,business_name,business_address,tax_id_last4,verified_at,verification_method,provider,provider_business_id,provider_status,status,policy_version,audit_correlation_id,immutable_snapshot_hash")
    .eq("account_id", accountId)
    .eq("owner_principal_id", ownerPrincipalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data ? safeIdentity(result.data as Record<string, unknown>) : null;
}

export async function onboardingIdentityDecision(
  db: SupabaseClient,
  accountId: string,
  ownerPrincipalId: string,
): Promise<OnboardingIdentityDecision> {
  const result = await db.rpc("amtech_onboarding_identity_decision", {
    p_account_id: accountId,
    p_owner_principal_id: ownerPrincipalId,
  });
  if (result.error) throw result.error;
  const row = firstRow<Record<string, unknown>>(result.data);
  return {
    allowed: Boolean(row?.allowed),
    error: (row?.error ? String(row.error) : null) as OnboardingIdentityDecision["error"],
    identityId: row?.identity_id ? String(row.identity_id) : null,
    policyVersion: row?.policy_version ? String(row.policy_version) : null,
  };
}

async function applyProviderDecision(
  db: SupabaseClient,
  input: {
    provider_event_id: string;
    provider_event_type: string;
    provider_business_id: string;
    provider_status: string;
    decision: OnboardingProviderDecision;
    payload: unknown;
  },
): Promise<{ identity_id: string; status: string; duplicate: boolean }> {
  const completed = await db.rpc("complete_onboarding_identity_verification", {
    p_provider_event_row_id: `oiw_${randomUUID()}`,
    p_provider_event_id: input.provider_event_id,
    p_provider_event_type: input.provider_event_type,
    p_provider_business_id: input.provider_business_id,
    p_payload_hash: hashProviderPayload(input.payload),
    p_result: input.decision,
    p_provider_status: input.provider_status,
  });
  if (completed.error) throw completed.error;
  const row = firstRow<Record<string, unknown>>(completed.data);
  if (!row?.identity_id) throw new Error("identity_provider_completion_missing");
  return {
    identity_id: String(row.identity_id),
    status: String(row.status),
    duplicate: Boolean(row.duplicate),
  };
}

export async function startOnboardingIdentityVerification(
  db: SupabaseClient,
  accountId: string,
  ownerPrincipalId: string,
  input: StartOnboardingIdentityVerification,
): Promise<IdentityVerificationStartResult> {
  const taxId = normalizeUsTaxId(input.tax_id);
  const identityId = `oid_${randomUUID()}`;
  const attemptId = `oia_${randomUUID()}`;
  const correlationId = input.audit_correlation_id ?? `corr_${randomUUID()}`;
  const reserved = await db.rpc("reserve_onboarding_identity_verification", {
    p_identity_id: identityId,
    p_attempt_id: attemptId,
    p_account_id: accountId,
    p_owner_principal_id: ownerPrincipalId,
    p_business_type: input.business_type.trim(),
    p_business_name: input.business_name.trim(),
    p_business_address: input.business_address,
    p_tax_id_secret_ref: sealSecret(taxId),
    p_tax_id_fingerprint: taxIdFingerprint(taxId),
    p_tax_id_last4: taxId.slice(-4),
    p_verification_method: "middesk_tin",
    p_provider: "middesk",
    p_policy_version: policyVersion(),
    p_audit_correlation_id: correlationId,
    p_idempotency_key: input.idempotency_key,
  });
  if (reserved.error) throw reserved.error;
  const reservation = firstRow<Record<string, unknown>>(reserved.data);
  if (!reservation?.identity_id) throw new Error("identity_reservation_missing");

  const existing = await loadOnboardingIdentity(db, accountId, ownerPrincipalId);
  if (!existing) throw new Error("identity_row_missing_after_reservation");
  const attemptStatus = String(reservation.attempt_status ?? "requested");
  if (attemptStatus === "rate_limited" || attemptStatus === "verified" || Boolean(reservation.duplicate)) {
    return {
      identity: existing,
      attempt_id: reservation.attempt_id ? String(reservation.attempt_id) : null,
      attempt_status: attemptStatus,
      retry_after_at: reservation.retry_after_at ? String(reservation.retry_after_at) : null,
      duplicate: Boolean(reservation.duplicate),
    };
  }

  try {
    const provider = await createMiddeskBusiness({
      business_name: input.business_name.trim(),
      tax_id: taxId,
      address: input.business_address,
      idempotency_key: input.idempotency_key,
    });
    const submitted = await db.rpc("mark_onboarding_identity_provider_submission", {
      p_attempt_id: String(reservation.attempt_id),
      p_provider_business_id: provider.business_id,
      p_provider_status: provider.provider_status,
      p_provider_request_id: provider.request_id,
    });
    if (submitted.error) throw submitted.error;
    if (provider.decision !== "pending") {
      await applyProviderDecision(db, {
        provider_event_id: `create:${provider.business_id}:${provider.provider_status}`,
        provider_event_type: "business.created",
        provider_business_id: provider.business_id,
        provider_status: provider.provider_status,
        decision: provider.decision,
        payload: provider.raw,
      });
    }
  } catch (error) {
    await db.from("onboarding_identity_attempts")
      .update({
        status: "failed",
        error_code: String((error as Error).message ?? error).slice(0, 160),
        completed_at: new Date().toISOString(),
      })
      .eq("id", String(reservation.attempt_id));
    throw error;
  }

  const identity = await loadOnboardingIdentity(db, accountId, ownerPrincipalId);
  if (!identity) throw new Error("identity_row_missing_after_provider_submission");
  return {
    identity,
    attempt_id: String(reservation.attempt_id),
    attempt_status: identity.status === "verified" ? "verified" : "submitted",
    retry_after_at: null,
    duplicate: false,
  };
}

export async function processMiddeskIdentityWebhook(
  db: SupabaseClient,
  event: Record<string, unknown>,
): Promise<{ identity_id: string; status: string; duplicate: boolean }> {
  const data = event.data && typeof event.data === "object" ? event.data as Record<string, unknown> : {};
  const object = data.object && typeof data.object === "object" ? data.object as Record<string, unknown> : {};
  const eventId = String(event.id ?? "");
  const eventType = String(event.type ?? "");
  const businessId = String(object.id ?? data.business_id ?? event.business_id ?? "");
  if (!eventId || !businessId || !["business.created", "business.updated", "tin.retried"].includes(eventType)) {
    throw new Error("middesk_identity_event_invalid");
  }
  const business = await getMiddeskBusiness(businessId);
  return applyProviderDecision(db, {
    provider_event_id: eventId,
    provider_event_type: eventType,
    provider_business_id: business.business_id,
    provider_status: business.provider_status,
    decision: business.decision,
    payload: business.raw,
  });
}
