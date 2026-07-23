#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const contractPath = resolve("validation/ws09-capacity-pilot-groundwork.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const out = resolve(process.env.AMTECH_CAPACITY_GROUNDWORK_OUT ?? "infra/proofs/capacity-groundwork.json");
const capacityPath = process.env.AMTECH_CAPACITY_PROOF;
const queuePath = process.env.AMTECH_QUEUE_TELEMETRY;
const ssePath = process.env.AMTECH_SSE_TELEMETRY;
const connectionPath = process.env.AMTECH_CONNECTION_TELEMETRY;

function optional(path) { return path && existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null; }
function nums(values) { return values.map(Number).filter(Number.isFinite); }
function median(values) {
  const sorted = nums(values).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
function ratioToMedian(values) {
  const valuesNumber = nums(values);
  const middle = median(valuesNumber);
  return !middle || !valuesNumber.length ? null : Math.max(...valuesNumber) / middle;
}
function jain(values) {
  const valuesNumber = nums(values).filter((value) => value >= 0);
  if (!valuesNumber.length) return null;
  const sum = valuesNumber.reduce((left, right) => left + right, 0);
  const squares = valuesNumber.reduce((left, right) => left + right * right, 0);
  return squares === 0 ? 1 : (sum * sum) / (valuesNumber.length * squares);
}
function samples(packet) { return Array.isArray(packet?.samples) ? packet.samples : []; }

const capacity = optional(capacityPath);
const queue = optional(queuePath);
const sse = optional(ssePath);
const connections = optional(connectionPath);
const missing = [
  !capacity && "capacity_proof",
  !queue && "queue_telemetry",
  !sse && "sse_telemetry",
  !connections && "connection_telemetry",
].filter(Boolean);
const cleanTiers = (capacity?.tiers_run ?? []).filter((tier) => tier.status === "pass");
const largestClean = cleanTiers.at(-1)?.tier ?? null;
const runtimeSamples = cleanTiers.at(-1)?.samples ?? [];
const queueSamples = samples(queue);
const sseSamples = samples(sse);
const host = capacity?.host_resources ?? {};
const freeMemoryRatio = Number.isFinite(host.free_mem_bytes) && Number.isFinite(host.total_mem_bytes) && host.total_mem_bytes > 0
  ? host.free_mem_bytes / host.total_mem_bytes : null;
const loadPerCpu = Array.isArray(host.loadavg) && Number.isFinite(host.cpu_count) && host.cpu_count > 0
  ? Number(host.loadavg[0]) / host.cpu_count : null;
const reconnectRatios = sseSamples.map((sample) => {
  const active = Number(sample.active_connections ?? 0);
  const reconnects = Number(sample.reconnects ?? 0);
  const disconnects = Number(sample.disconnects ?? 0);
  const denominator = Math.max(1, active + disconnects);
  return reconnects / denominator;
});
const pressure = runtimeSamples.map((sample) => Math.max(1,
  Number(sample.pss_kb ?? 0) / 1024
  + Number(sample.fd_count ?? 0)
  + Number(sample.log_bytes ?? 0) / 1024 / 1024));
const fairness = {
  resource_distribution_jain_index: jain(pressure),
  pss_max_to_median: ratioToMedian(runtimeSamples.map((sample) => sample.pss_kb)),
  queue_max_to_median: ratioToMedian(queueSamples.map((sample) => sample.depth)),
  sse_reconnect_max_to_median: ratioToMedian(reconnectRatios),
};
const threshold = contract.thresholds;
const hardStops = [
  largestClean !== null && largestClean < contract.mvp_target.employee_runtime_range[0] && "clean_tier_below_25",
  freeMemoryRatio !== null && freeMemoryRatio < threshold.minimum_free_memory_ratio && "free_memory_ratio_below_threshold",
  loadPerCpu !== null && loadPerCpu > threshold.maximum_load_per_cpu && "load_per_cpu_above_threshold",
  queueSamples.some((sample) => Number(sample.depth) > threshold.maximum_queue_depth) && "queue_depth_above_threshold",
  queueSamples.some((sample) => Number(sample.oldest_age_ms) > threshold.maximum_queue_oldest_age_ms) && "queue_oldest_age_above_threshold",
  reconnectRatios.some((ratio) => ratio > threshold.maximum_sse_reconnect_ratio) && "sse_reconnect_ratio_above_threshold",
  sseSamples.some((sample) => Number(sample.buffered_events) > threshold.maximum_buffered_sse_events_per_employee) && "sse_buffer_above_threshold",
  Number(connections?.database_total) > threshold.maximum_database_connections && "database_connections_above_threshold",
  fairness.resource_distribution_jain_index !== null && fairness.resource_distribution_jain_index < contract.fairness.minimum_jain_index && "fairness_below_threshold",
  Object.values(fairness).some((value) => value !== null && value > contract.fairness.maximum_skew_ratio) && "noisy_neighbor_skew_above_threshold",
].filter(Boolean);
let saturation_state = "healthy_candidate";
if (missing.length) saturation_state = "unmeasured";
else if (largestClean === null || largestClean < 25) saturation_state = "unproven";
else if (hardStops.length) saturation_state = "saturated";
else if (largestClean < 30 || freeMemoryRatio < 0.25 || loadPerCpu > 0.65) saturation_state = "watch";

const report = {
  schema: "amtech.ws09-capacity-groundwork-report.v1",
  status: saturation_state === "healthy_candidate" ? "candidate_only" : "incomplete_or_blocked",
  generated_at: new Date().toISOString(),
  target: contract.mvp_target,
  future_pressure_only: contract.future_pressure_only,
  input_packets: { capacity: capacityPath ?? null, queue: queuePath ?? null, sse: ssePath ?? null, connections: connectionPath ?? null },
  missing_telemetry: missing,
  largest_clean_tier: largestClean,
  host: { free_memory_ratio: freeMemoryRatio, load_per_cpu: loadPerCpu },
  connection_accounting: connections,
  queue_accounting: { employee_samples: queueSamples.length, max_depth: queueSamples.length ? Math.max(...queueSamples.map((sample) => Number(sample.depth))) : null, max_oldest_age_ms: queueSamples.length ? Math.max(...queueSamples.map((sample) => Number(sample.oldest_age_ms))) : null },
  sse_accounting: { employee_samples: sseSamples.length, total_active: sseSamples.reduce((sum, sample) => sum + Number(sample.active_connections ?? 0), 0), total_buffered_events: sseSamples.reduce((sum, sample) => sum + Number(sample.buffered_events ?? 0), 0), maximum_reconnect_ratio: reconnectRatios.length ? Math.max(...reconnectRatios) : null },
  fairness,
  saturation_state,
  hard_stop_reasons: hardStops,
  pilot_stop: {
    authority: contract.pilot_stop.authority,
    required: saturation_state === "saturated" || saturation_state === "unproven",
    actions: contract.pilot_stop.actions,
    rollback_command: contract.pilot_stop.rollback_command,
    incident_owner_required: contract.pilot_stop.incident_owner_required,
    customer_exit_state: contract.pilot_stop.customer_exit_state,
  },
  evidence_classes: { schema: "source", measurements: missing.length ? "incomplete" : "provided_not_independently_accepted", capacity: "not_established", pilot: "not_established", production: "not_established" },
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, out, saturation_state, missing_telemetry: missing, hard_stop_reasons: hardStops }, null, 2));
if (saturation_state === "saturated") process.exit(1);
