export type CapabilityProbeStatus = "passed" | "failed" | "skipped" | "unknown";

export interface CapabilityEvidenceInput {
  capability_key: string;
  advertised: boolean;
  runtime_reported: boolean;
  dependency_ready: boolean;
  credential_ready: boolean;
  network_ready: boolean;
  policy_ready: boolean;
  connector_ready?: boolean;
  connector_required?: boolean;
  live_probe_status: CapabilityProbeStatus;
  evidence?: Record<string, unknown>;
}

export interface EffectiveCapabilityDecision extends CapabilityEvidenceInput {
  connector_ready: boolean;
  effective: boolean;
  failed_dimensions: string[];
}

/**
 * Effective capability is the intersection of independently observed evidence.
 * Profile YAML and host key presence may contribute to `advertised`, but can never
 * make the decision effective without a runtime report and successful live probe.
 */
export function decideEffectiveCapability(input: CapabilityEvidenceInput): EffectiveCapabilityDecision {
  const connectorReady = input.connector_required ? Boolean(input.connector_ready) : true;
  const dimensions: Array<[string, boolean]> = [
    ["advertised", input.advertised],
    ["runtime_reported", input.runtime_reported],
    ["dependency_ready", input.dependency_ready],
    ["credential_ready", input.credential_ready],
    ["network_ready", input.network_ready],
    ["policy_ready", input.policy_ready],
    ["connector_ready", connectorReady],
    ["live_probe_passed", input.live_probe_status === "passed"],
  ];
  const failed_dimensions = dimensions.filter(([, ready]) => !ready).map(([name]) => name);
  return {
    ...input,
    connector_ready: connectorReady,
    effective: failed_dimensions.length === 0,
    failed_dimensions,
  };
}

export interface EffectiveCapabilityReport {
  report_id: string;
  account_id: string;
  employee_id: string;
  assignment_id: string;
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
  checked_at?: string;
  capabilities: CapabilityEvidenceInput[];
}): EffectiveCapabilityReport {
  const capabilities = input.capabilities.map(decideEffectiveCapability);
  return {
    report_id: input.report_id,
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    checked_at: input.checked_at ?? new Date().toISOString(),
    capabilities,
    effective_toolsets: capabilities.filter((item) => item.effective).map((item) => item.capability_key),
    denied_toolsets: capabilities
      .filter((item) => !item.effective)
      .map((item) => ({ capability_key: item.capability_key, failed_dimensions: item.failed_dimensions })),
  };
}
