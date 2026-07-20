export type CapabilityProbeStatus = "passed" | "failed" | "skipped" | "unknown";

export interface CapabilityEvidenceInput {
  capability_key: string;
  advertised: boolean;
  runtime_reported: boolean;
  dependency_ready: boolean;
  credential_ready: boolean;
  network_ready: boolean;
  policy_ready: boolean;
  entitlement_ready?: boolean;
  authority_version_matches?: boolean;
  connector_ready?: boolean;
  connector_required?: boolean;
  live_probe_status: CapabilityProbeStatus;
  evidence_checked_at?: string;
  max_evidence_age_ms?: number;
  now?: string;
  evidence?: Record<string, unknown>;
}

export interface EffectiveCapabilityDecision extends CapabilityEvidenceInput {
  entitlement_ready: boolean;
  authority_version_matches: boolean;
  connector_ready: boolean;
  evidence_checked_at: string;
  max_evidence_age_ms: number;
  evidence_fresh: boolean;
  effective: boolean;
  failed_dimensions: string[];
}

function evidenceFresh(input: CapabilityEvidenceInput, checkedAt: string, maxAgeMs: number): boolean {
  const checked = new Date(checkedAt).getTime();
  const now = new Date(input.now ?? new Date().toISOString()).getTime();
  return Number.isFinite(checked)
    && Number.isFinite(now)
    && maxAgeMs > 0
    && checked <= now
    && now - checked <= maxAgeMs;
}

/**
 * Effective capability is the intersection of independently observed, current
 * evidence. Legacy callers that have not supplied a newly required dimension remain
 * source-compatible but fail closed rather than silently upgrading to effective.
 */
export function decideEffectiveCapability(input: CapabilityEvidenceInput): EffectiveCapabilityDecision {
  const connectorReady = input.connector_required ? Boolean(input.connector_ready) : true;
  const entitlementReady = input.entitlement_ready === true;
  const authorityMatches = input.authority_version_matches === true;
  const checkedAt = input.evidence_checked_at ?? "";
  const maxAgeMs = Number(input.max_evidence_age_ms ?? 0);
  const fresh = evidenceFresh(input, checkedAt, maxAgeMs);
  const dimensions: Array<[string, boolean]> = [
    ["advertised", input.advertised],
    ["runtime_reported", input.runtime_reported],
    ["dependency_ready", input.dependency_ready],
    ["credential_ready", input.credential_ready],
    ["network_ready", input.network_ready],
    ["policy_ready", input.policy_ready],
    ["entitlement_ready", entitlementReady],
    ["authority_version_matches", authorityMatches],
    ["connector_ready", connectorReady],
    ["live_probe_passed", input.live_probe_status === "passed"],
    ["evidence_fresh", fresh],
  ];
  const failed_dimensions = dimensions.filter(([, ready]) => !ready).map(([name]) => name);
  return {
    ...input,
    entitlement_ready: entitlementReady,
    authority_version_matches: authorityMatches,
    connector_ready: connectorReady,
    evidence_checked_at: checkedAt,
    max_evidence_age_ms: maxAgeMs,
    evidence_fresh: fresh,
    effective: failed_dimensions.length === 0,
    failed_dimensions,
  };
}

export interface EffectiveCapabilityReport {
  report_id: string;
  account_id: string;
  employee_id: string;
  assignment_id: string;
  authority_version: string;
  checked_at: string;
  capabilities: EffectiveCapabilityDecision[];
  effective_toolsets: string[];
  denied_toolsets: Array<{ capability_key: string; failed_dimensions: string[] }>;
}

export function buildEffectiveCapabilityReport(input: {
  report_id: string;
  account_id: string;
  employee_id: string;
  assignment_id: string;
  authority_version?: string;
  checked_at?: string;
  capabilities: CapabilityEvidenceInput[];
}): EffectiveCapabilityReport {
  const checkedAt = input.checked_at ?? new Date().toISOString();
  const capabilities = input.capabilities.map((capability) => decideEffectiveCapability({
    ...capability,
    evidence_checked_at: capability.evidence_checked_at ?? checkedAt,
    now: capability.now ?? checkedAt,
  }));
  return {
    report_id: input.report_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    authority_version: input.authority_version ?? "unbound",
    checked_at: checkedAt,
    capabilities,
    effective_toolsets: capabilities.filter((item) => item.effective).map((item) => item.capability_key),
    denied_toolsets: capabilities
      .filter((item) => !item.effective)
      .map((item) => ({ capability_key: item.capability_key, failed_dimensions: item.failed_dimensions })),
  };
}
