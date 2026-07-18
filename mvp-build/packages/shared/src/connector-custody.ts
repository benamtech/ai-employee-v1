import {
  resolveAssignmentScope,
  type AssignmentAction,
  type AssignmentPrincipalRecord,
  type AssignmentResourceGrantRecord,
  type AssignmentScopeDecision,
  type HumanPrincipal,
} from "./assignment-resolver.js";
import type { ProviderCapabilityClass } from "./command-effect.js";

export type ConnectorBindingStatus = "pending" | "active" | "current" | "revoked" | "expired" | "disabled";

export interface ProviderVerificationRecord {
  verified: boolean;
  provider: string;
  verification_ref?: string | null;
  verified_at?: string | null;
}

export interface ConnectorBindingRecord {
  binding_id: string;
  provider: string;
  external_subject: string;
  assignment_id?: string | null;
  account_id: string;
  employee_id: string;
  principal_id: string;
  resource_class: string;
  resource_id?: string | null;
  status: ConnectorBindingStatus | string;
  policy_version: string;
  capability_class: ProviderCapabilityClass;
  revoked_at?: string | null;
  expires_at?: string | null;
}

export interface ConnectorEventDedupeRecord {
  provider: string;
  external_event_id: string;
  payload_hash: string;
  assignment_id: string;
  command_intent_id?: string | null;
  processing_state: "received" | "processing" | "processed" | "failed" | "ambiguous" | string;
}

export type ConnectorCustodyDenialReason =
  | "invalid_provider_verification"
  | "missing_connector_binding"
  | "ambiguous_connector_binding"
  | "revoked_or_expired_connector_binding"
  | "connector_binding_unscoped"
  | "connector_event_conflict"
  | "missing_command_effect_intent"
  | "assignment_scope_denied";

export interface ConnectorCustodyEvidence {
  provider: string;
  external_event_id: string;
  verification_ref?: string;
  binding_id?: string;
  assignment_id?: string;
  payload_hash: string;
  duplicate: boolean;
  grant_checked: boolean;
  command_effect_checked: boolean;
}

export type ConnectorCustodyDecision =
  | {
      ok: true;
      status: 200;
      duplicate: boolean;
      binding: ConnectorBindingRecord;
      assignment: AssignmentPrincipalRecord;
      scope: Extract<AssignmentScopeDecision, { ok: true }>;
      evidence: ConnectorCustodyEvidence;
    }
  | {
      ok: false;
      status: 403 | 409 | 410;
      reason: ConnectorCustodyDenialReason;
      scope_reason?: string;
      evidence: ConnectorCustodyEvidence;
    };

function timestampIsPast(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now.getTime();
}

function currentBinding(binding: ConnectorBindingRecord, now: Date): boolean {
  return (binding.status === "active" || binding.status === "current") &&
    !binding.revoked_at &&
    !timestampIsPast(binding.expires_at, now);
}

function evidenceFor(input: {
  verification: ProviderVerificationRecord;
  external_event_id: string;
  payload_hash: string;
  binding?: ConnectorBindingRecord;
  duplicate?: boolean;
  grant_checked?: boolean;
  command_effect_checked?: boolean;
}): ConnectorCustodyEvidence {
  const evidence: ConnectorCustodyEvidence = {
    provider: input.verification.provider,
    external_event_id: input.external_event_id,
    payload_hash: input.payload_hash,
    duplicate: Boolean(input.duplicate),
    grant_checked: Boolean(input.grant_checked),
    command_effect_checked: Boolean(input.command_effect_checked),
  };
  if (input.verification.verification_ref) evidence.verification_ref = input.verification.verification_ref;
  if (input.binding) {
    evidence.binding_id = input.binding.binding_id;
    if (input.binding.assignment_id) evidence.assignment_id = input.binding.assignment_id;
  }
  return evidence;
}

function deny(
  input: Parameters<typeof evidenceFor>[0],
  reason: ConnectorCustodyDenialReason,
  status: 403 | 409 | 410 = 403,
  scopeReason?: string,
): ConnectorCustodyDecision {
  const denied: Extract<ConnectorCustodyDecision, { ok: false }> = {
    ok: false,
    status,
    reason,
    evidence: evidenceFor(input),
  };
  if (scopeReason) denied.scope_reason = scopeReason;
  return denied;
}

export function resolveConnectorCustody(input: {
  verification: ProviderVerificationRecord;
  external_event_id: string;
  external_subject: string;
  payload_hash: string;
  bindings: readonly ConnectorBindingRecord[];
  assignments: readonly AssignmentPrincipalRecord[];
  grants: readonly AssignmentResourceGrantRecord[];
  dedupe_record?: ConnectorEventDedupeRecord | null;
  action?: AssignmentAction;
  command_effect_intent_id?: string | null;
  now?: Date;
}): ConnectorCustodyDecision {
  const now = input.now ?? new Date();
  const baseEvidence = {
    verification: input.verification,
    external_event_id: input.external_event_id,
    payload_hash: input.payload_hash,
    command_effect_checked: true,
  };

  if (!input.verification.verified || !input.verification.verification_ref || input.verification.provider.trim() === "") {
    return deny(baseEvidence, "invalid_provider_verification");
  }
  if (!input.command_effect_intent_id) {
    return deny(baseEvidence, "missing_command_effect_intent");
  }

  const providerBindings = input.bindings.filter((binding) =>
    binding.provider === input.verification.provider && binding.external_subject === input.external_subject,
  );
  if (providerBindings.length === 0) return deny(baseEvidence, "missing_connector_binding");

  const activeBindings = providerBindings.filter((binding) => currentBinding(binding, now));
  if (activeBindings.length === 0) {
    const inactiveBinding = providerBindings[0];
    return inactiveBinding
      ? deny({ ...baseEvidence, binding: inactiveBinding }, "revoked_or_expired_connector_binding", 410)
      : deny(baseEvidence, "missing_connector_binding");
  }
  if (activeBindings.length !== 1) {
    return deny(baseEvidence, "ambiguous_connector_binding", 409);
  }

  const binding = activeBindings[0];
  if (!binding) return deny(baseEvidence, "missing_connector_binding");
  if (!binding.assignment_id) {
    return deny({ ...baseEvidence, binding }, "connector_binding_unscoped");
  }

  let duplicate = false;
  if (input.dedupe_record) {
    const dedupe = input.dedupe_record;
    if (
      dedupe.provider !== input.verification.provider ||
      dedupe.external_event_id !== input.external_event_id ||
      dedupe.assignment_id !== binding.assignment_id ||
      dedupe.payload_hash !== input.payload_hash ||
      (dedupe.command_intent_id && dedupe.command_intent_id !== input.command_effect_intent_id)
    ) {
      return deny({ ...baseEvidence, binding }, "connector_event_conflict", 409);
    }
    duplicate = true;
  }

  const principal: HumanPrincipal = {
    principal_id: binding.principal_id,
  };
  const scope = resolveAssignmentScope({
    principal,
    assignments: input.assignments,
    grants: input.grants,
    account_id: binding.account_id,
    employee_id: binding.employee_id,
    assignment_id: binding.assignment_id,
    allowed_roles: ["owner", "manager", "operator", "approver", "viewer", "billing"],
    resource_class: binding.resource_class,
    resource_id: binding.resource_id,
    action: input.action ?? "connector:event:ingest",
    require_command_effect: true,
    command_effect_intent_id: input.command_effect_intent_id,
    now,
  });
  if (!scope.ok) {
    return deny(
      { ...baseEvidence, binding, duplicate, grant_checked: true },
      "assignment_scope_denied",
      scope.status === 410 ? 410 : scope.status === 409 ? 409 : 403,
      scope.reason,
    );
  }

  return {
    ok: true,
    status: 200,
    duplicate,
    binding,
    assignment: scope.assignment,
    scope,
    evidence: evidenceFor({
      ...baseEvidence,
      binding,
      duplicate,
      grant_checked: true,
    }),
  };
}
