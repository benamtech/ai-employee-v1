#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { PRODUCTION_CONTAINER_NAMES } from "../production-topology.mjs";

const employeeA = process.env.EMPLOYEE_A_ID;
const employeeB = process.env.EMPLOYEE_B_ID;
const mutate = process.argv.includes("--mutate");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const timeoutMs = Number(process.env.ISOLATION_TEST_TIMEOUT_MS ?? 180_000);
const pollMs = Number(process.env.ISOLATION_TEST_POLL_MS ?? 2_000);

function required(value, name) {
  if (!value) throw new Error(`${name} missing`);
  return value;
}

function assertDisposableEmployees() {
  const allow = process.env.AMTECH_ALLOW_DESTRUCTIVE_ISOLATION_TEST === "1";
  const disposable = new Set((process.env.AMTECH_DISPOSABLE_EMPLOYEE_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (!allow) throw new Error("AMTECH_ALLOW_DESTRUCTIVE_ISOLATION_TEST=1 is required for --mutate");
  if (!disposable.has(employeeA) || !disposable.has(employeeB)) {
    throw new Error("EMPLOYEE_A_ID and EMPLOYEE_B_ID must both appear in AMTECH_DISPOSABLE_EMPLOYEE_IDS");
  }
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    env: { ...process.env, ...options.env },
    timeout: options.timeout ?? 30_000,
  });
}

function resultText(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 8_000);
}

function docker(args, { allowFailure = false, timeout } = {}) {
  const result = run("docker", args, { timeout });
  if (!allowFailure && result.status !== 0) {
    throw new Error(resultText(result) || `docker ${args.join(" ")} failed`);
  }
  return result;
}

function containerName(employeeId) {
  return `amtech-hermes-${employeeId}`;
}

function networkName(employeeId) {
  return `amtech-employee-${employeeId}`;
}

function containerId(employeeId) {
  const result = docker(["inspect", containerName(employeeId), "--format", "{{.Id}}"], { allowFailure: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

function containerEnv(employeeId) {
  const result = docker(["inspect", containerName(employeeId), "--format", "{{json .Config.Env}}"]);
  return Object.fromEntries(JSON.parse(result.stdout).map((entry) => {
    const index = entry.indexOf("=");
    return index === -1 ? [entry, ""] : [entry.slice(0, index), entry.slice(index + 1)];
  }));
}

function networkInspection(employeeId) {
  const result = docker(["network", "inspect", networkName(employeeId)]);
  return JSON.parse(result.stdout)[0];
}

function networkContainerNames(inspection) {
  return Object.values(inspection?.Containers ?? {}).map((entry) => entry?.Name).filter(Boolean).sort();
}

function employeeNetworkIp(employeeId) {
  const result = docker([
    "inspect",
    containerName(employeeId),
    "--format",
    `{{(index .NetworkSettings.Networks "${networkName(employeeId)}").IPAddress}}`,
  ]);
  return result.stdout.trim();
}

function pythonInside(employeeId, code, { expectFailure = false } = {}) {
  const result = docker(["exec", containerName(employeeId), "python3", "-c", code], { allowFailure: expectFailure, timeout: 15_000 });
  if (expectFailure && result.status === 0) throw new Error(`unexpected_success:${code}`);
  if (!expectFailure && result.status !== 0) throw new Error(resultText(result) || `python check failed in ${employeeId}`);
  return { exit_code: result.status, output: resultText(result) };
}

async function hostHealth(employeeId) {
  const env = containerEnv(employeeId);
  const port = Number(env.API_SERVER_PORT);
  if (!port) throw new Error(`API_SERVER_PORT missing for ${employeeId}`);
  const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`host_loopback_health_failed:${employeeId}:${response.status}`);
  return { employee_id: employeeId, port, http_status: response.status };
}

function assertNetwork(employeeId, otherEmployeeId) {
  const inspection = networkInspection(employeeId);
  const names = networkContainerNames(inspection);
  const expected = [
    PRODUCTION_CONTAINER_NAMES.manager,
    PRODUCTION_CONTAINER_NAMES.modelGateway,
    containerName(employeeId),
  ];
  const unexpectedEmployees = names.filter((name) => name.startsWith("amtech-hermes-") && name !== containerName(employeeId));
  if (inspection.Internal !== true) throw new Error(`${networkName(employeeId)} is not internal`);
  if (!expected.every((name) => names.includes(name))) throw new Error(`${networkName(employeeId)} missing expected peers:${JSON.stringify({ names, expected })}`);
  if (unexpectedEmployees.length > 0 || names.includes(containerName(otherEmployeeId))) {
    throw new Error(`${networkName(employeeId)} contains cross-employee peers:${unexpectedEmployees.join(",")}`);
  }
  return { network: networkName(employeeId), internal: inspection.Internal, containers: names };
}

function assertControlReachability(employeeId) {
  const manager = pythonInside(employeeId, "import urllib.request; r=urllib.request.urlopen('http://amtech-manager:8080/health', timeout=5); raise SystemExit(0 if r.status < 500 else 1)");
  const gateway = pythonInside(employeeId, "import urllib.request; r=urllib.request.urlopen('http://amtech-model-gateway:8092/health', timeout=5); raise SystemExit(0 if r.status < 500 else 1)");
  return { employee_id: employeeId, manager, model_gateway: gateway };
}

function assertCrossEmployeeDenial(sourceEmployeeId, targetEmployeeId) {
  const targetIp = employeeNetworkIp(targetEmployeeId);
  const targetPort = Number(containerEnv(targetEmployeeId).API_SERVER_PORT);
  if (!targetIp || !targetPort) throw new Error(`target runtime coordinates missing:${targetEmployeeId}`);
  const dns = pythonInside(sourceEmployeeId, `import socket; socket.getaddrinfo('${containerName(targetEmployeeId)}', ${targetPort})`, { expectFailure: true });
  const direct = pythonInside(sourceEmployeeId, `import socket; s=socket.create_connection(('${targetIp}', ${targetPort}), 3); s.close()`, { expectFailure: true });
  return { source_employee_id: sourceEmployeeId, target_employee_id: targetEmployeeId, target_ip: targetIp, target_port: targetPort, dns, direct };
}

function assertInternetEgressDenied(employeeId) {
  return {
    employee_id: employeeId,
    result: pythonInside(employeeId, "import socket; s=socket.create_connection(('1.1.1.1', 443), 3); s.close()", { expectFailure: true }),
  };
}

function queueLifecycle(action, employeeId) {
  const result = run("node", ["infra/scripts/employee-lifecycle.mjs", action, employeeId], { timeout: 30_000 });
  if (result.status !== 0) throw new Error(resultText(result) || `lifecycle ${action} failed to queue`);
  return JSON.parse(result.stdout.trim().split("\n").at(-1));
}

async function waitFor(predicate, description) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`timeout_waiting_for_${description}${lastError ? `:${String(lastError?.message ?? lastError)}` : ""}`);
}

async function replacementAndNeighborContinuity() {
  assertDisposableEmployees();
  const oldA = required(containerId(employeeA), "employee A container");
  const oldB = required(containerId(employeeB), "employee B container");
  const queued = queueLifecycle("replace", employeeA);
  const newA = await waitFor(async () => {
    const current = containerId(employeeA);
    if (!current || current === oldA) return null;
    await hostHealth(employeeA);
    return current;
  }, "employee_A_replacement");
  const currentB = containerId(employeeB);
  if (currentB !== oldB) throw new Error(`employee B changed during A replacement:${oldB}:${currentB}`);
  const bHealth = await hostHealth(employeeB);
  assertNetwork(employeeB, employeeA);
  return { queued, old_employee_a_container_id: oldA, new_employee_a_container_id: newA, employee_b_container_id: currentB, employee_b_health: bHealth };
}

async function teardownAndNeighborContinuity() {
  assertDisposableEmployees();
  const stableB = required(containerId(employeeB), "employee B container");
  const queued = queueLifecycle("teardown", employeeA);
  await waitFor(() => {
    const noContainer = containerId(employeeA) === null;
    const network = docker(["network", "inspect", networkName(employeeA)], { allowFailure: true });
    return noContainer && network.status !== 0;
  }, "employee_A_teardown");
  const currentB = containerId(employeeB);
  if (currentB !== stableB) throw new Error(`employee B changed during A teardown:${stableB}:${currentB}`);
  const bHealth = await hostHealth(employeeB);
  assertNetwork(employeeB, employeeA);
  return { queued, employee_a_container_absent: true, employee_a_network_absent: true, employee_b_container_id: currentB, employee_b_health: bHealth };
}

function writeProof(proof) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `target-host-two-employee-isolation-${stamp()}.json`);
  writeFileSync(path, JSON.stringify(proof, null, 2));
  console.log(`proof_json:${path}`);
}

const startedAt = new Date().toISOString();
const checks = [];
let status = "pass";
let error = null;

try {
  required(employeeA, "EMPLOYEE_A_ID");
  required(employeeB, "EMPLOYEE_B_ID");
  if (employeeA === employeeB) throw new Error("EMPLOYEE_A_ID and EMPLOYEE_B_ID must differ");

  checks.push({ name: "employee_A_network", status: "pass", evidence: assertNetwork(employeeA, employeeB) });
  checks.push({ name: "employee_B_network", status: "pass", evidence: assertNetwork(employeeB, employeeA) });
  checks.push({ name: "employee_A_control_reachability", status: "pass", evidence: assertControlReachability(employeeA) });
  checks.push({ name: "employee_B_control_reachability", status: "pass", evidence: assertControlReachability(employeeB) });
  checks.push({ name: "A_to_B_denied", status: "pass", evidence: assertCrossEmployeeDenial(employeeA, employeeB) });
  checks.push({ name: "B_to_A_denied", status: "pass", evidence: assertCrossEmployeeDenial(employeeB, employeeA) });
  checks.push({ name: "employee_A_internet_egress_denied", status: "pass", evidence: assertInternetEgressDenied(employeeA) });
  checks.push({ name: "employee_B_internet_egress_denied", status: "pass", evidence: assertInternetEgressDenied(employeeB) });
  checks.push({ name: "host_loopback_employee_A", status: "pass", evidence: await hostHealth(employeeA) });
  checks.push({ name: "host_loopback_employee_B", status: "pass", evidence: await hostHealth(employeeB) });

  if (mutate) {
    checks.push({ name: "replace_A_preserves_B", status: "pass", evidence: await replacementAndNeighborContinuity() });
    checks.push({ name: "teardown_A_preserves_B", status: "pass", evidence: await teardownAndNeighborContinuity() });
  } else {
    checks.push({ name: "replacement_and_teardown", status: "skip", reason: "run with --mutate plus explicit disposable-employee allowlist" });
  }
} catch (err) {
  status = "fail";
  error = String(err?.message ?? err);
  checks.push({ name: "target_host_two_employee_isolation", status: "fail", error });
}

const proof = {
  kind: "target_host_two_employee_isolation",
  status,
  checked_at: new Date().toISOString(),
  started_at: startedAt,
  host: hostname(),
  git_sha: gitSha(),
  employee_a_id: employeeA ?? null,
  employee_b_id: employeeB ?? null,
  mutation_enabled: mutate,
  checks,
  error,
};
writeProof(proof);

for (const check of checks) {
  const prefix = check.status === "pass" ? "PASS" : check.status === "skip" ? "SKIP" : "FAIL";
  console.log(`${prefix} ${check.name}${check.reason ? ` ${check.reason}` : ""}${check.error ? ` ${check.error}` : ""}`);
}

if (status !== "pass") process.exit(1);
