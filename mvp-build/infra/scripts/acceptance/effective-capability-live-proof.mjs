#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const employeeId = process.env.EMPLOYEE_ID;
const accountId = process.env.ACCOUNT_ID;
const assignmentId = process.env.ASSIGNMENT_ID;
const managerToken = process.env.MANAGER_INTERNAL_TOKEN;
const managerOrigin = (process.env.MANAGER_API_ORIGIN ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const allowBillable = process.env.AMTECH_ALLOW_BILLABLE_CAPABILITY_PROBE === "1";

function required(value, name) {
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function run(command, args, { allowFailure = false, timeout = 30_000 } = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", env: process.env, timeout });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${`${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000)}`);
  }
  return result;
}

function docker(args, options) {
  return run("docker", args, options);
}

function gitSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function containerName() {
  return `amtech-hermes-${employeeId}`;
}

function containerEnv() {
  const inspected = docker(["inspect", containerName(), "--format", "{{json .Config.Env}}"]).stdout;
  return Object.fromEntries(JSON.parse(inspected).map((entry) => {
    const index = entry.indexOf("=");
    return index === -1 ? [entry, ""] : [entry.slice(0, index), entry.slice(index + 1)];
  }));
}

async function runtimeJson(path, init = {}) {
  const env = containerEnv();
  const port = Number(env.API_SERVER_PORT);
  const token = env.API_SERVER_BEARER_TOKEN ?? env.HERMES_API_TOKEN;
  if (!port || !token) throw new Error("runtime_api_coordinates_missing");
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    ...init,
    signal: AbortSignal.timeout(Number(process.env.CAPABILITY_PROBE_TIMEOUT_MS ?? 120_000)),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = await response.json().catch(() => ({}));
  return { response, json, port };
}

function toolsetsFrom(value) {
  const raw = value?.toolsets;
  if (Array.isArray(raw)) return raw.filter((item) => item?.name).map((item) => [String(item.name), item]);
  if (raw && typeof raw === "object") return Object.entries(raw);
  return [];
}

function substrateProbe() {
  const marker = `amtech-capability-${Date.now()}`;
  const script = [
    "set -eu",
    "test -w /workspace",
    "test -w /opt/data",
    "mkdir -p /workspace/.amtech-proofs /opt/data/memories /opt/data/sessions /opt/data/checkpoints",
    `printf %s '${marker}' > /workspace/.amtech-proofs/effective-capability`,
    `printf %s '${marker}' > /opt/data/memories/effective-capability`,
    `printf %s '${marker}' > /opt/data/sessions/effective-capability`,
    `printf %s '${marker}' > /opt/data/checkpoints/effective-capability`,
    `test \"$(cat /workspace/.amtech-proofs/effective-capability)\" = '${marker}'`,
    `test \"$(cat /opt/data/memories/effective-capability)\" = '${marker}'`,
    `test \"$(cat /opt/data/sessions/effective-capability)\" = '${marker}'`,
    `test \"$(cat /opt/data/checkpoints/effective-capability)\" = '${marker}'`,
    "test -d /opt/data/plugins",
    "rm -f /workspace/.amtech-proofs/effective-capability /opt/data/memories/effective-capability /opt/data/sessions/effective-capability /opt/data/checkpoints/effective-capability",
  ].join("\n");
  docker(["exec", containerName(), "/bin/sh", "-euc", script]);
  const plugins = docker(["exec", containerName(), "/bin/sh", "-euc", "find /opt/data/plugins -mindepth 1 -maxdepth 1 -type d -printf '%f\\n' | sort"], { allowFailure: true });
  return { marker, workspace: true, opt_data: true, plugin_directories: plugins.stdout.trim().split("\n").filter(Boolean) };
}

async function fileToolProbe(capabilities) {
  if (!allowBillable) return { status: "skipped", reason: "AMTECH_ALLOW_BILLABLE_CAPABILITY_PROBE=1 required" };
  const sessionId = `amtech-capability-proof-${Date.now()}`;
  const marker = `file-tool-marker-${Date.now()}`;
  const session = await runtimeJson("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ id: sessionId, title: "AMTECH effective capability proof" }),
  });
  if (!session.response.ok && session.response.status !== 409) {
    return { status: "failed", reason: `session_create_${session.response.status}`, response: session.json };
  }
  const prompt = [
    "This is a production capability proof.",
    `Use the native file tool, not shell prose, to write exactly ${marker} to /workspace/.amtech-file-tool-proof.`,
    "Read the file back with the file tool and respond with only the marker.",
  ].join(" ");
  const chat = await runtimeJson(`/api/sessions/${encodeURIComponent(sessionId)}/chat`, {
    method: "POST",
    body: JSON.stringify({ input: prompt, system_message: "Perform the requested safe capability probe exactly." }),
  });
  const inspected = docker(["exec", containerName(), "/bin/sh", "-euc", "cat /workspace/.amtech-file-tool-proof"], { allowFailure: true });
  docker(["exec", containerName(), "/bin/sh", "-euc", "rm -f /workspace/.amtech-file-tool-proof"], { allowFailure: true });
  const output = String(chat.json?.output ?? chat.json?.text ?? chat.json?.message ?? chat.json?.response ?? "");
  const passed = chat.response.ok && inspected.status === 0 && inspected.stdout.trim() === marker && output.includes(marker);
  return {
    status: passed ? "passed" : "failed",
    marker,
    http_status: chat.response.status,
    file_observed: inspected.status === 0 ? inspected.stdout.trim() : null,
    response_marker_observed: output.includes(marker),
    capabilities_platform: capabilities?.platform ?? null,
  };
}

async function persistReport(report) {
  const response = await fetch(`${managerOrigin}/manager/internal/effective-capabilities/report`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${required(managerToken, "MANAGER_INTERNAL_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`capability_report_persist_failed:${response.status}:${JSON.stringify(json).slice(0, 1000)}`);
  return json;
}

let status = "pass";
let error = null;
let proof;
try {
  required(employeeId, "EMPLOYEE_ID");
  required(accountId, "ACCOUNT_ID");
  required(assignmentId, "ASSIGNMENT_ID");
  const substrate = substrateProbe();
  const [health, capabilities, toolsets] = await Promise.all([
    runtimeJson("/health"),
    runtimeJson("/v1/capabilities"),
    runtimeJson("/v1/toolsets"),
  ]);
  if (!health.response.ok) throw new Error(`runtime_health_failed:${health.response.status}`);
  const fileProbe = await fileToolProbe(capabilities.json);
  const rows = toolsetsFrom(toolsets.json);
  const capabilityRows = rows.map(([name, info]) => {
    const fileLike = name === "file" || (Array.isArray(info?.tools) && info.tools.some((tool) => /file|write|read/i.test(String(tool))));
    const live = fileLike ? fileProbe.status : "skipped";
    const credentialRequired = ["web", "search", "browser", "vision", "image_generation", "tts"].includes(name);
    return {
      capability_key: name,
      advertised: true,
      runtime_reported: true,
      dependency_ready: info?.enabled !== false && info?.configured !== false,
      credential_ready: credentialRequired ? false : true,
      network_ready: !credentialRequired,
      policy_ready: true,
      connector_ready: true,
      connector_required: false,
      live_probe_status: live,
      evidence: {
        reported_tools: info?.tools ?? [],
        runtime_health: health.json,
        substrate,
        ...(fileLike ? { file_tool_probe: fileProbe } : { reason: credentialRequired ? "provider_and_network_probe_required" : "capability_specific_live_probe_not_executed" }),
      },
    };
  });
  const reportInput = {
    report_id: `caprep_${Date.now()}`,
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    capabilities: capabilityRows,
  };
  const persisted = await persistReport(reportInput);
  proof = {
    kind: "effective_capability_live_proof",
    status: "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    employee_id: employeeId,
    account_id: accountId,
    assignment_id: assignmentId,
    billable_probe_enabled: allowBillable,
    runtime: { health: health.json, capabilities: capabilities.json, toolsets: toolsets.json },
    substrate,
    file_tool_probe: fileProbe,
    persisted_report: persisted,
  };
} catch (err) {
  status = "fail";
  error = String(err?.message ?? err);
  proof = {
    kind: "effective_capability_live_proof",
    status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    employee_id: employeeId ?? null,
    account_id: accountId ?? null,
    assignment_id: assignmentId ?? null,
    error,
  };
}

mkdirSync(proofDir, { recursive: true });
const path = join(proofDir, `effective-capability-live-${stamp()}.json`);
writeFileSync(path, JSON.stringify(proof, null, 2));
console.log(`proof_json:${path}`);
console.log(`${status === "pass" ? "PASS" : "FAIL"} effective_capability_live${error ? ` ${error}` : ""}`);
if (status !== "pass") process.exit(1);
