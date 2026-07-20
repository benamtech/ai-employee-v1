import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@amtech/db";
import {
  buildEffectiveCapabilityReport,
  type CapabilityEvidenceInput,
  type EffectiveCapabilityReport,
  type HermesToolsetInfo,
  type HermesToolsets,
} from "@amtech/shared";
import { getCapabilities, getHealth, getToolsets, resolveRuntimeApi } from "./hermes-client.js";

function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 26)}`;
}

function toolsetRows(value: HermesToolsets | null): Array<[string, HermesToolsetInfo]> {
  const raw = value?.toolsets;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => item?.name ? [[item.name, item] as [string, HermesToolsetInfo]] : []);
  }
  return Object.entries(raw).map(([name, item]) => [name, item]);
}

function healthPassed(status: unknown): boolean {
  return ["ok", "healthy", "ready", "pass", "passed"].includes(String(status ?? "").toLowerCase());
}

/**
 * Collect reported/runtime evidence only. Live probes remain `unknown`, therefore
 * no capability becomes effective merely because Hermes advertises it or a host
 * environment variable exists.
 */
export async function collectRuntimeCapabilityEvidence(
  db: SupabaseClient,
  input: {
    account_id: string;
    employee_id: string;
    assignment_id: string;
    advertised_toolsets?: string[];
  },
): Promise<EffectiveCapabilityReport> {
  const api = await resolveRuntimeApi(db, input.employee_id);
  const [health, capabilities, toolsets] = await Promise.all([
    getHealth(api),
    getCapabilities(api),
    getToolsets(api),
  ]);
  const networkReady = healthPassed(health.status);
  const advertised = new Set(input.advertised_toolsets ?? []);
  const rows = toolsetRows(toolsets);
  const names = new Set([...advertised, ...rows.map(([name]) => name)]);
  const byName = new Map(rows);
  const evidence: CapabilityEvidenceInput[] = [...names].sort().map((capability_key) => {
    const runtime = byName.get(capability_key);
    return {
      capability_key,
      advertised: advertised.has(capability_key),
      runtime_reported: Boolean(runtime),
      dependency_ready: Boolean(runtime && runtime.enabled !== false && runtime.configured !== false),
      credential_ready: false,
      network_ready: networkReady,
      policy_ready: true,
      connector_ready: true,
      connector_required: false,
      live_probe_status: "unknown",
      evidence: {
        runtime_endpoint_id: api.runtime_endpoint_id,
        runtime_health: health.status ?? "unknown",
        runtime_platform: capabilities?.platform ?? null,
        runtime_model: capabilities?.model ?? null,
        reported_tools: runtime?.tools ?? [],
        reason: "live_probe_required_before_effective",
      },
    };
  });
  return buildEffectiveCapabilityReport({
    report_id: id("caprep"),
    account_id: input.account_id,
    employee_id: input.employee_id,
    assignment_id: input.assignment_id,
    capabilities: evidence,
  });
}

export async function persistEffectiveCapabilityReport(
  db: SupabaseClient,
  report: EffectiveCapabilityReport,
): Promise<EffectiveCapabilityReport> {
  if (!report.capabilities.length) return report;
  const rows = report.capabilities.map((item) => ({
    id: id("capev"),
    report_id: report.report_id,
    assignment_id: report.assignment_id,
    account_id: report.account_id,
    employee_id: report.employee_id,
    capability_key: item.capability_key,
    advertised: item.advertised,
    runtime_reported: item.runtime_reported,
    dependency_ready: item.dependency_ready,
    credential_ready: item.credential_ready,
    network_ready: item.network_ready,
    policy_ready: item.policy_ready,
    connector_ready: item.connector_ready,
    live_probe_status: item.live_probe_status,
    effective: item.effective,
    evidence: { ...(item.evidence ?? {}), failed_dimensions: item.failed_dimensions },
    checked_at: report.checked_at,
  }));
  const inserted = await db.from("effective_capability_evidence").insert(rows);
  if (inserted.error) throw inserted.error;
  return report;
}

export async function latestEffectiveCapabilityReport(
  db: SupabaseClient,
  employeeId: string,
  assignmentId: string,
): Promise<EffectiveCapabilityReport | null> {
  const latest = await db.from("effective_capability_evidence")
    .select("report_id,checked_at")
    .eq("employee_id", employeeId)
    .eq("assignment_id", assignmentId)
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw latest.error;
  if (!latest.data?.report_id) return null;
  const result = await db.from("effective_capability_evidence")
    .select("*")
    .eq("report_id", latest.data.report_id)
    .order("capability_key");
  if (result.error) throw result.error;
  const rows = result.data ?? [];
  const first = rows[0];
  if (!first) return null;
  return {
    report_id: String(first.report_id),
    account_id: String(first.account_id),
    employee_id: String(first.employee_id),
    assignment_id: String(first.assignment_id),
    checked_at: String(first.checked_at),
    capabilities: rows.map((row) => ({
      capability_key: String(row.capability_key),
      advertised: Boolean(row.advertised),
      runtime_reported: Boolean(row.runtime_reported),
      dependency_ready: Boolean(row.dependency_ready),
      credential_ready: Boolean(row.credential_ready),
      network_ready: Boolean(row.network_ready),
      policy_ready: Boolean(row.policy_ready),
      connector_ready: Boolean(row.connector_ready),
      live_probe_status: row.live_probe_status,
      effective: Boolean(row.effective),
      failed_dimensions: Array.isArray(row.evidence?.failed_dimensions) ? row.evidence.failed_dimensions.map(String) : [],
      evidence: row.evidence ?? {},
    })),
    effective_toolsets: rows.filter((row) => row.effective).map((row) => String(row.capability_key)),
    denied_toolsets: rows.filter((row) => !row.effective).map((row) => ({
      capability_key: String(row.capability_key),
      failed_dimensions: Array.isArray(row.evidence?.failed_dimensions) ? row.evidence.failed_dimensions.map(String) : [],
    })),
  };
}
