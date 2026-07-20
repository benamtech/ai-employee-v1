export type CapabilityProbeStatus = "passed" | "failed" | "skipped" | "unknown";

export interface CapabilityEvidenceInput {
  capability_key: string;
  advertised: boolean;
  runtime_reported: boolean;
  dependency_ready: boolean;
  credential_ready: boolean;
  network_ready: boolean;
  policy_ready: boolean;
  entitlement_ready: boolean;
  authority_version_matches: boolean;
  connector_ready?: boolean;
  connector_required?: boolean;
  live_probe_status: CapabilityProbeStatus;
  evidence_checked_at: string;
  max_evidence_age_ms: number;
  now?: string;
  evidence?: Record<string, unknown>;
}

export interface EffectiveCapabilityDecision extends CapabilityEvidenceInput {
  connector_ready: boolean;
  evidence_fresh: boolean;
  effective: boolean;
  failed_dimensions: string[];
}

function evidenceFresh(input: CapabilityEvidenceInput): boolean {
  const checked = new Date(input.evidence_checked_at).getTime();
  const now = new Date(input.now ?? new Date().toISOString()).getTime();
  return Number.isFinite(checked)
    && Number.isFinite(now)
    && input.max_evidence_age_ms > 0
    && checked <= now
    && now - checked <= input.max_evidence_age_ms;
}

/**
 * Effective capability is the intersection of independently observed, current
 * evidence. Discovery is broad; execution fails closed on missing, skipped, stale,
 * version-mismatched, unhealthy, or unprobed evidence.
 */
export function decideEffectiveCapability(input: CapabilityEvidenceInput): EffectiveCapabilityDecision {
  const connectorReady = input.connector_required ? Boolean(input.connector_ready) : true;
  const fresh = evidenceFresh(input);
  const dimensions: Array<[string, boolean]> = [
    ["advertised", input.advertised],
    ["runtime_reported", input.runtime_reported],
    ["dependency_ready", input.dependency_ready],
    ["credential_ready", input.credential_ready],
    ["network_ready", input.network_ready],
    ["policy_ready", input.policy_ready],
    ["entitlement_ready", input.entitlement_ready],
    ["authority_version_matches", input.authority_version_matches],
    ["connector_ready", connectorReady],
    ["live_probe_passed", input.live_probe_status === "passed"],
    ["evidence_fresh", fresh],
  ];
  const failed_dimensions = dimensions.filter(([, ready]) => !ready).map(([name]) => name);
  return {
    ...input,
    connector_ready: connectorReady,
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
  authority_version: string;
  checked_at?: string;
  capabilities: CapabilityEvidenceInput[];
}): EffectiveCapabilityReport {
  const checkedAt = input.checked_at ?? new Date().toISOString();
  const capabilities = input.capabilities.map((capability) => decideEffectiveCapability({
    ...capability,
    now: capability.now ?? checkedAt,
  }));
  return {
    report_id: input.report_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    authority_version: input.authority_version,
    checked_at: checkedAt,
    capabilities,
    effective_toolsets: capabilities.filter((item) => item.effective).map((item) => item.capability_key),
    denied_toolsets: capabilities
      .filter((item) => !item.effective)
      .map((item) => ({ capability_key: item.capability_key, failed_dimensions: item.failed_dimensions })),
  };
}
