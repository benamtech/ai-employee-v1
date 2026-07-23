#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import {
  PRODUCTION_COMPOSE_FILE,
  PRODUCTION_CONTAINER_NAMES,
  PRODUCTION_CONTROL_SERVICES,
  productionComposeArgs,
} from "./production-topology.mjs";

const baseManager = process.env.MANAGER_SMOKE_URL ?? "http://127.0.0.1:8080";
const baseModelGateway = process.env.MODEL_GATEWAY_SMOKE_URL ?? "http://127.0.0.1:8092";
const baseWeb = process.env.WEB_SMOKE_URL ?? "http://127.0.0.1:3000";
const baseCaddy = process.env.CADDY_SMOKE_URL ?? "http://127.0.0.1";
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const employeeId = process.env.EMPLOYEE_ID;
const writeProof = process.env.WRITE_PROOF_JSON !== "0";

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function dockerCompose(args) {
  return spawnSync("docker", productionComposeArgs(args), { encoding: "utf8" });
}

function composeConfig() {
  const result = dockerCompose(["config", "--quiet"]);
  return {
    name: "compose:config",
    status: result.status === 0 ? "pass" : "fail",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
  };
}

async function httpCheck(name, url, { web = false, proxy = false } = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: proxy ? "manual" : "follow",
    });
    const ok = res.ok || ((web || proxy) && res.status < 500) || (proxy && res.type === "opaqueredirect");
    return {
      name,
      status: ok ? "pass" : "fail",
      http_status: res.status || (res.type === "opaqueredirect" ? 308 : 0),
      url,
      ms: Date.now() - started,
    };
  } catch (err) {
    return { name, status: "fail", url, error: String(err?.message ?? err), ms: Date.now() - started };
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function composeHealthOnce(service) {
  const ps = dockerCompose(["ps", "-q", service]);
  if (ps.status !== 0 || !ps.stdout.trim()) {
    return {
      name: `compose:${service}`,
      status: "fail",
      error: `${ps.stdout ?? ""}${ps.stderr ?? ""}`.trim() || "container_not_found",
    };
  }
  const id = ps.stdout.trim().split("\n")[0];
  const inspect = spawnSync(
    "docker",
    ["inspect", id, "--format", "{{.State.Status}}\t{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}"],
    { encoding: "utf8" },
  );
  if (inspect.status !== 0) {
    return {
      name: `compose:${service}`,
      status: "fail",
      container_id: id,
      error: `${inspect.stdout ?? ""}${inspect.stderr ?? ""}`.trim(),
    };
  }
  const [container_state, health] = inspect.stdout.trim().split("\t");
  // Every canonical production service declares a health check. A running
  // container with no health state is partial topology, never release health.
  const ok = container_state === "running" && health === "healthy";
  return { name: `compose:${service}`, status: ok ? "pass" : "fail", container_id: id, container_state, health };
}

async function composeHealth(service, attempts = 12) {
  let last = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    last = composeHealthOnce(service);
    if (last.status === "pass") return last;
    await sleep(2500);
  }
  return last ?? { name: `compose:${service}`, status: "fail", error: "not_checked" };
}

function provisionerSocket() {
  const result = dockerCompose([
    "exec",
    "-T",
    "host-provisioner",
    "test",
    "-S",
    "/run/amtech-provisioner/provisioner.sock",
  ]);
  return {
    name: "host-provisioner:unix-socket",
    status: result.status === 0 ? "pass" : "fail",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
  };
}

function caddyValidate() {
  const result = dockerCompose(["exec", "-T", "caddy", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]);
  return {
    name: "caddy:validate",
    status: result.status === 0 ? "pass" : "fail",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
  };
}

function employeeNetworkTopology() {
  if (!employeeId) {
    return { name: "employee-network:topology", status: "skip", reason: "EMPLOYEE_ID not set" };
  }
  const network = `amtech-employee-${employeeId}`;
  const result = spawnSync("docker", ["network", "inspect", network], { encoding: "utf8" });
  if (result.status !== 0) {
    return {
      name: "employee-network:topology",
      status: "fail",
      network,
      error: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() || "network_not_found",
    };
  }
  try {
    const [inspection] = JSON.parse(result.stdout);
    const names = Object.values(inspection?.Containers ?? {})
      .map((entry) => entry?.Name)
      .filter(Boolean)
      .sort();
    const expected = [
      PRODUCTION_CONTAINER_NAMES.manager,
      PRODUCTION_CONTAINER_NAMES.modelGateway,
      `amtech-hermes-${employeeId}`,
    ];
    const unexpectedEmployees = names.filter(
      (name) => name.startsWith("amtech-hermes-") && name !== `amtech-hermes-${employeeId}`,
    );
    const ok = expected.every((name) => names.includes(name)) && unexpectedEmployees.length === 0;
    return {
      name: "employee-network:topology",
      status: ok ? "pass" : "fail",
      network,
      containers: names,
      expected,
      unexpected_employee_containers: unexpectedEmployees,
    };
  } catch (err) {
    return { name: "employee-network:topology", status: "fail", network, error: `invalid_inspect_json:${String(err)}` };
  }
}

function gitSha() {
  try {
    const value = process.env.AMTECH_GIT_SHA
      ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    return /^[a-f0-9]{40}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

const checks = [
  composeConfig(),
  await httpCheck("manager-health", `${baseManager.replace(/\/$/, "")}/health`),
  await httpCheck("model-gateway-health", `${baseModelGateway.replace(/\/$/, "")}/health`),
  await httpCheck("web", baseWeb, { web: true }),
  await httpCheck("caddy", baseCaddy, { proxy: true }),
  await composeHealth("manager"),
  await composeHealth("model-gateway"),
  await composeHealth("host-provisioner"),
  await composeHealth("web"),
  await composeHealth("caddy"),
  provisionerSocket(),
  caddyValidate(),
  employeeNetworkTopology(),
];

for (const check of checks) {
  const prefix = check.status === "pass" ? "PASS" : check.status === "skip" ? "SKIP" : "FAIL";
  console.log(`${prefix} ${check.name}${check.http_status ? ` ${check.http_status}` : ""}${check.error ? ` ${check.error}` : ""}`);
}

const exactGitSha = gitSha();
if (!exactGitSha) checks.push({ name: "release:exact-git-sha", status: "fail", error: "exact_git_sha_unavailable" });
const proof = {
  kind: "deploy_smoke",
  status: checks.some((check) => check.status === "fail") ? "fail" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  git_sha: exactGitSha,
  compose_file: PRODUCTION_COMPOSE_FILE,
  control_services: PRODUCTION_CONTROL_SERVICES,
  checks,
};

if (writeProof) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `deploy-smoke-${nowStamp()}.json`);
  writeFileSync(path, JSON.stringify(proof, null, 2));
  console.log(`proof_json:${path}`);
}

if (proof.status !== "pass") process.exit(1);
