export type PlatformPrincipalRole =
  | "platform_owner"
  | "platform_operator"
  | "support_readonly"
  | "billing_operator"
  | "security_reviewer";

export type PlatformAdminActionClass = "read" | "support_read" | "support_write" | "security_write" | "billing_write";

export type PlatformAdminDenialReason =
  | "platform_authority_disabled"
  | "platform_session_missing"
  | "platform_session_expired"
  | "platform_session_revoked"
  | "platform_principal_not_current"
  | "platform_session_version_stale"
  | "platform_audience_mismatch"
  | "platform_role_denied"
  | "platform_step_up_required"
  | "support_lease_required"
  | "support_lease_expired"
  | "support_lease_revoked"
  | "support_lease_scope_mismatch"
  | "support_reason_required"
  | "mutable_header_identity_denied";

export interface PlatformPrincipalRecord {
  principal_id: string;
  user_id: string;
  role: PlatformPrincipalRole;
  status: string;
  session_version: number;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface PlatformAdminSessionRecord {
  session_id: string;
  principal_id: string;
  audience: string;
  session_version: number;
  authenticated_at: string;
  step_up_at?: string | null;
  expires_at: string;
  revoked_at?: string | null;
}

export interface PlatformSupportLeaseRecord {
  lease_id: string;
  principal_id: string;
  account_id: string;
  employee_id?: string | null;
  assignment_id?: string | null;
  allowed_actions: readonly string[];
  reason: string;
  starts_at: string;
  expires_at: string;
  revoked_at?: string | null;
}

export interface PlatformAdminAuthorityEvidence {
  principal_id?: string;
  session_id?: string;
  lease_id?: string;
  role?: PlatformPrincipalRole;
  action: string;
  action_class: PlatformAdminActionClass;
  audience: string;
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  step_up_checked: boolean;
  lease_checked: boolean;
  durable_identity_checked: boolean;
  groundwork_only: true;
}

export type PlatformAdminAuthorityDecision =
  | { ok: true; status: 200; evidence: PlatformAdminAuthorityEvidence; principal: PlatformPrincipalRecord; session: PlatformAdminSessionRecord; lease?: PlatformSupportLeaseRecord }
  | { ok: false; status: 401 | 403 | 409 | 410 | 503; reason: PlatformAdminDenialReason; evidence: PlatformAdminAuthorityEvidence };

const currentStatuses = new Set(["active", "current"]);

function parsedTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function current(status: string, startsAt: string | null | undefined, endsAt: string | null | undefined, now: Date): boolean {
  if (!currentStatuses.has(status)) return false;
  const starts = parsedTimestamp(startsAt);
  const ends = parsedTimestamp(endsAt);
  if (startsAt && starts === null) return false;
  if (endsAt && ends === null) return false;
  if (starts !== null && starts > now.getTime()) return false;
  if (ends !== null && ends <= now.getTime()) return false;
  return true;
}

function baseEvidence(input: {
  action: string;
  action_class: PlatformAdminActionClass;
  audience: string;
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  principal?: PlatformPrincipalRecord | null;
  session?: PlatformAdminSessionRecord | null;
  lease?: PlatformSupportLeaseRecord | null;
}): PlatformAdminAuthorityEvidence {
  return {
    principal_id: input.principal?.principal_id,
    session_id: input.session?.session_id,
    lease_id: input.lease?.lease_id,
    role: input.principal?.role,
    action: input.action,
    action_class: input.action_class,
    audience: input.audience,
    account_id: input.account_id ?? null,
    employee_id: input.employee_id ?? null,
    assignment_id: input.assignment_id ?? null,
    step_up_checked: false,
    lease_checked: false,
    durable_identity_checked: false,
    groundwork_only: true,
  };
}

function deny(
  reason: PlatformAdminDenialReason,
  status: 401 | 403 | 409 | 410 | 503,
  evidence: PlatformAdminAuthorityEvidence,
): PlatformAdminAuthorityDecision {
  return { ok: false, status, reason, evidence };
}

export function evaluatePlatformAdminAuthority(input: {
  enabled: boolean;
  mutable_header_identity_present?: boolean;
  principal?: PlatformPrincipalRecord | null;
  session?: PlatformAdminSessionRecord | null;
  lease?: PlatformSupportLeaseRecord | null;
  audience: string;
  action: string;
  action_class: PlatformAdminActionClass;
  allowed_roles: readonly PlatformPrincipalRole[];
  account_id?: string | null;
  employee_id?: string | null;
  assignment_id?: string | null;
  require_step_up?: boolean;
  step_up_max_age_seconds?: number;
  require_support_lease?: boolean;
  now?: Date;
}): PlatformAdminAuthorityDecision {
  const now = input.now ?? new Date();
  const evidence = baseEvidence(input);
  if (!input.enabled) return deny("platform_authority_disabled", 503, evidence);
  if (input.mutable_header_identity_present) return deny("mutable_header_identity_denied", 403, evidence);
  if (!input.session) return deny("platform_session_missing", 401, evidence);
  if (input.session.revoked_at) return deny("platform_session_revoked", 410, evidence);
  const sessionExpiry = parsedTimestamp(input.session.expires_at);
  if (sessionExpiry === null || sessionExpiry <= now.getTime()) return deny("platform_session_expired", 410, evidence);
  if (input.session.audience !== input.audience) return deny("platform_audience_mismatch", 403, evidence);
  if (!input.principal || input.session.principal_id !== input.principal.principal_id || !current(input.principal.status, input.principal.starts_at, input.principal.ends_at, now)) {
    return deny("platform_principal_not_current", 403, { ...evidence, durable_identity_checked: true });
  }
  if (input.session.session_version !== input.principal.session_version) {
    return deny("platform_session_version_stale", 410, { ...evidence, durable_identity_checked: true });
  }
  if (!input.allowed_roles.includes(input.principal.role)) {
    return deny("platform_role_denied", 403, { ...evidence, durable_identity_checked: true });
  }

  const stepUpRequired = Boolean(input.require_step_up)
    || input.action_class === "support_write"
    || input.action_class === "security_write"
    || input.action_class === "billing_write";
  if (stepUpRequired) {
    const maxAge = Math.max(60, input.step_up_max_age_seconds ?? 900) * 1000;
    const stepUpAt = parsedTimestamp(input.session.step_up_at);
    const stepUpAge = stepUpAt === null ? Number.POSITIVE_INFINITY : now.getTime() - stepUpAt;
    if (stepUpAt === null || stepUpAge < 0 || stepUpAge > maxAge) {
      return deny("platform_step_up_required", 403, {
        ...evidence,
        durable_identity_checked: true,
        step_up_checked: true,
      });
    }
  }

  const leaseRequired = Boolean(input.require_support_lease)
    || input.action_class === "support_read"
    || input.action_class === "support_write";
  if (leaseRequired) {
    if (!input.lease) return deny("support_lease_required", 403, { ...evidence, durable_identity_checked: true, step_up_checked: stepUpRequired, lease_checked: true });
    if (input.lease.revoked_at) return deny("support_lease_revoked", 410, { ...evidence, durable_identity_checked: true, step_up_checked: stepUpRequired, lease_checked: true });
    const leaseStart = parsedTimestamp(input.lease.starts_at);
    const leaseExpiry = parsedTimestamp(input.lease.expires_at);
    if (leaseStart === null || leaseExpiry === null || leaseExpiry <= now.getTime() || leaseStart > now.getTime()) {
      return deny("support_lease_expired", 410, { ...evidence, durable_identity_checked: true, step_up_checked: stepUpRequired, lease_checked: true });
    }
    const employeeScopeMatches = input.employee_id ? input.lease.employee_id === input.employee_id : true;
    const assignmentScopeMatches = input.assignment_id ? input.lease.assignment_id === input.assignment_id : true;
    const scopeMatches = input.lease.principal_id === input.principal.principal_id
      && input.lease.account_id === input.account_id
      && employeeScopeMatches
      && assignmentScopeMatches
      && input.lease.allowed_actions.includes(input.action);
    if (!scopeMatches) {
      return deny("support_lease_scope_mismatch", 403, { ...evidence, durable_identity_checked: true, step_up_checked: stepUpRequired, lease_checked: true });
    }
    if (input.lease.reason.trim().length < 8) {
      return deny("support_reason_required", 409, { ...evidence, durable_identity_checked: true, step_up_checked: stepUpRequired, lease_checked: true });
    }
  }

  return {
    ok: true,
    status: 200,
    principal: input.principal,
    session: input.session,
    ...(input.lease ? { lease: input.lease } : {}),
    evidence: {
      ...evidence,
      durable_identity_checked: true,
      step_up_checked: stepUpRequired,
      lease_checked: leaseRequired,
    },
  };
}
