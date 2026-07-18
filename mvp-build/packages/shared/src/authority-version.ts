export type AuthorityScopeType =
  | "human_principal"
  | "employee_assignment"
  | "assignment_principal"
  | "resource_grant"
  | "preview_link"
  | "connector_binding";

export interface AuthorityVersionRecord {
  scope_type: AuthorityScopeType | string;
  scope_id: string;
  current_version: number;
  revoked_at?: string | null;
  reason?: string | null;
  updated_at?: string | null;
}

export interface IssuedAuthoritySnapshot {
  scope_type: AuthorityScopeType | string;
  scope_id: string;
  issued_version: number;
  issued_at?: string | null;
}

export type AuthorityVersionDenialReason =
  | "authority_scope_mismatch"
  | "authority_version_invalid"
  | "authority_revoked"
  | "authority_version_stale";

export type AuthorityVersionDecision =
  | {
      ok: true;
      current_version: number;
      issued_version: number;
    }
  | {
      ok: false;
      reason: AuthorityVersionDenialReason;
      current_version: number;
      issued_version: number;
    };

export function evaluateAuthorityVersion(input: {
  issued: IssuedAuthoritySnapshot;
  current: AuthorityVersionRecord;
}): AuthorityVersionDecision {
  const issuedVersion = Number(input.issued.issued_version);
  const currentVersion = Number(input.current.current_version);
  if (
    input.issued.scope_type !== input.current.scope_type ||
    input.issued.scope_id !== input.current.scope_id
  ) {
    return {
      ok: false,
      reason: "authority_scope_mismatch",
      current_version: currentVersion,
      issued_version: issuedVersion,
    };
  }
  if (
    !Number.isSafeInteger(issuedVersion) ||
    !Number.isSafeInteger(currentVersion) ||
    issuedVersion < 1 ||
    currentVersion < 1
  ) {
    return {
      ok: false,
      reason: "authority_version_invalid",
      current_version: currentVersion,
      issued_version: issuedVersion,
    };
  }
  if (input.current.revoked_at) {
    return {
      ok: false,
      reason: "authority_revoked",
      current_version: currentVersion,
      issued_version: issuedVersion,
    };
  }
  if (currentVersion > issuedVersion) {
    return {
      ok: false,
      reason: "authority_version_stale",
      current_version: currentVersion,
      issued_version: issuedVersion,
    };
  }
  return {
    ok: true,
    current_version: currentVersion,
    issued_version: issuedVersion,
  };
}
