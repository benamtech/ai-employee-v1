import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  buildEffectiveCapabilityReport,
  resolveManagedSetupForCapability,
  type EffectiveCapabilityDecision,
  type ToolName,
} from "@amtech/shared";
import type { EmployeeMcpIdentity } from "./mcp-auth.js";
import { checkFeature } from "./entitlements.js";
import { persistEffectiveCapabilityReport } from "./effective-capability-evidence.js";

const CONNECTOR_BOOTSTRAP_TOOLS = new Set<string>([
  "connect_email",
  "complete_gmail_oauth",
  "run_email_connector_test",
  "connect_quickbooks",
  "complete_quickbooks_oauth",
  "run_quickbooks_connector_test",
  "connect_stripe",
  "create_stripe_account_link",
  "complete_stripe_onboarding",
  "get_stripe_connection_status",
  "regenerate_stripe_onboarding_link",
]);

const CONNECTOR_BINDING_MAX_AGE_MS = Math.max(
  60_000,
  Number(process.env.CONNECTOR_CAPABILITY_BINDING_MAX_AGE_MS ?? 24 * 60 * 60_000),
);
const EXECUTION_EVIDENCE_MAX_AGE_MS = Math.max(
  30_000,
  Number(process.env.MCP_EXECUTION_EVIDENCE_MAX_AGE_MS ?? 5 * 60_000),
);

function recent(value: unknown, now: number, maxAgeMs: number): boolean {
  const at = Date.parse(String(value ?? ""));
  return Number.isFinite(at) && at <= now && now - at <= maxAgeMs;
}

export interface McpCapabilityAuthorityDecision {
  ok: boolean;
  capability: EffectiveCapabilityDecision;
  report_id: string;
}

/**
 * Last interception before a runtime-discovered MCP tool executes. Discovery may be
 * broad, but execution is re-derived from current assignment authority, entitlement,
 * connector custody, provider verification freshness, and a live Manager request.
 */
export async function authorizeManagerMcpToolExecution(
  db: SupabaseClient,
  identity: EmployeeMcpIdentity,
  toolName: ToolName,
): Promise<McpCapabilityAuthorityDecision> {
  const checkedAt = new Date().toISOString();
  const now = Date.parse(checkedAt);
  const setup = resolveManagedSetupForCapability(toolName);
  const bootstrap = CONNECTOR_BOOTSTRAP_TOOLS.has(toolName)
    || setup?.start_tool === toolName
    || setup?.continuation?.tool === toolName;
  const connectorRequired = Boolean(setup && !bootstrap);
  const entitlement = await checkFeature(db, {
    account_id: identity.account_id,
    employee_id: identity.employee_id,
  }, toolName);

  let connectorReady = !connectorRequired;
  let liveProbePassed = !connectorRequired;
  let connectorEvidence: Record<string, unknown> = {
    connector_required: connectorRequired,
    connector_bootstrap: bootstrap,
  };

  if (connectorRequired && setup) {
    const binding = await db.from("connector_bindings")
      .select("id,provider,status,policy_version,provider_verification_ref,provider_verified_at,updated_at,revoked_at")
      .eq("assignment_id", identity.assignment_id)
      .eq("account_id", identity.account_id)
      .eq("employee_id", identity.employee_id)
      .eq("provider", setup.provider)
      .eq("status", "active")
      .eq("policy_version", identity.policy_version)
      .is("revoked_at", null)
      .order("provider_verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (binding.error) throw binding.error;
    const verifiedAt = binding.data?.provider_verified_at ?? binding.data?.updated_at ?? null;
    connectorReady = Boolean(binding.data?.id);
    liveProbePassed = connectorReady && recent(verifiedAt, now, CONNECTOR_BINDING_MAX_AGE_MS);
    connectorEvidence = {
      ...connectorEvidence,
      connector_binding_id: binding.data?.id ?? null,
      provider: setup.provider,
      provider_verification_ref: binding.data?.provider_verification_ref ?? null,
      provider_verified_at: verifiedAt,
      binding_fresh: liveProbePassed,
    };
  }

  const report = buildEffectiveCapabilityReport({
    report_id: `caprep_mcp_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
    account_id: identity.account_id,
    employee_id: identity.employee_id,
    assignment_id: identity.assignment_id,
    authority_version: String(identity.authority_version),
    checked_at: checkedAt,
    capabilities: [{
      capability_key: `manager_tool:${toolName}`,
      advertised: true,
      runtime_reported: true,
      dependency_ready: true,
      credential_ready: true,
      network_ready: true,
      policy_ready: Boolean(identity.policy_version),
      entitlement_ready: entitlement.decision === "allow",
      authority_version_matches: true,
      connector_required: connectorRequired,
      connector_ready: connectorReady,
      live_probe_status: liveProbePassed ? "passed" : "unknown",
      evidence_checked_at: checkedAt,
      max_evidence_age_ms: EXECUTION_EVIDENCE_MAX_AGE_MS,
      evidence: {
        source: "manager_mcp_execution_interceptor",
        credential_id: identity.credential_id,
        policy_version: identity.policy_version,
        authority_version: identity.authority_version,
        entitlement_decision: entitlement.decision,
        ...connectorEvidence,
      },
    }],
  });
  await persistEffectiveCapabilityReport(db, report);
  const capability = report.capabilities[0]!;
  return { ok: capability.effective, capability, report_id: report.report_id };
}
