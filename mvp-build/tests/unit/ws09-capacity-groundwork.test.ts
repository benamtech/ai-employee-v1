import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contract = JSON.parse(readFileSync(resolve("validation/ws09-capacity-pilot-groundwork.json"), "utf8"));

describe("WS09 bounded capacity groundwork", () => {
  it("keeps 25-30 as the MVP target and 200-500 as future pressure only", () => {
    expect(contract.mvp_target).toEqual({ linux_hosts: 1, memory_gib: 64, employee_runtime_range: [25, 30] });
    expect(contract.future_pressure_only.employee_runtime_range).toEqual([200, 500]);
    expect(contract.future_pressure_only.implemented).toBe(false);
    expect(contract.future_pressure_only.accepted).toBe(false);
    expect(contract.pilot_stop.authority).toBe("platform_operator");
    expect(contract.pilot_stop.actions).toContain("preserve current durable work");
    expect(contract.pilot_stop.rollback_command).toBe("npm run deploy:rollback");
  });

  it("produces a healthy candidate descriptor only with complete clean telemetry", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-capacity-"));
    try {
      const capacity = join(directory, "capacity.json");
      const queue = join(directory, "queue.json");
      const sse = join(directory, "sse.json");
      const connections = join(directory, "connections.json");
      const output = join(directory, "report.json");
      const runtimeSamples = Array.from({ length: 30 }, (_, index) => ({ employee_id: `emp_${index}`, pss_kb: 250000 + index * 100, fd_count: 20, log_bytes: 1000, running: true, dns: { status: "pass" } }));
      writeFileSync(capacity, JSON.stringify({ host_resources: { cpu_count: 8, total_mem_bytes: 64 * 1024 ** 3, free_mem_bytes: 24 * 1024 ** 3, loadavg: [2, 2, 2] }, tiers_run: [{ tier: 30, status: "pass", samples: runtimeSamples }] }));
      writeFileSync(queue, JSON.stringify({ samples: runtimeSamples.map(({ employee_id }) => ({ employee_id, depth: 2, oldest_age_ms: 1000, throughput_per_minute: 5 })) }));
      writeFileSync(sse, JSON.stringify({ samples: runtimeSamples.map(({ employee_id }) => ({ employee_id, active_connections: 1, disconnects: 0, reconnects: 0, buffered_events: 0 })) }));
      writeFileSync(connections, JSON.stringify({ database_total: 40, database_by_state: { active: 10, idle: 30 }, manager_open_sockets: 32, gateway_open_sockets: 30 }));
      execFileSync(process.execPath, ["infra/scripts/capacity-fairness.mjs"], { env: { ...process.env, AMTECH_CAPACITY_PROOF: capacity, AMTECH_QUEUE_TELEMETRY: queue, AMTECH_SSE_TELEMETRY: sse, AMTECH_CONNECTION_TELEMETRY: connections, AMTECH_CAPACITY_GROUNDWORK_OUT: output } });
      const report = JSON.parse(readFileSync(output, "utf8"));
      expect(report.saturation_state).toBe("healthy_candidate");
      expect(report.largest_clean_tier).toBe(30);
      expect(report.missing_telemetry).toEqual([]);
      expect(report.pilot_stop.required).toBe(false);
      expect(report.evidence_classes.capacity).toBe("not_established");
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("does not convert missing telemetry into zero or acceptance", () => {
    const directory = mkdtempSync(join(tmpdir(), "amtech-capacity-missing-"));
    const output = join(directory, "report.json");
    try {
      execFileSync(process.execPath, ["infra/scripts/capacity-fairness.mjs"], { env: { ...process.env, AMTECH_CAPACITY_GROUNDWORK_OUT: output } });
      const report = JSON.parse(readFileSync(output, "utf8"));
      expect(report.saturation_state).toBe("unmeasured");
      expect(report.missing_telemetry).toEqual(["capacity_proof", "queue_telemetry", "sse_telemetry", "connection_telemetry"]);
      expect(report.evidence_classes.measurements).toBe("incomplete");
      expect(report.evidence_classes.pilot).toBe("not_established");
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
