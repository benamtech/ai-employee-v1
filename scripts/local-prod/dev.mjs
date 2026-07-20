#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, gitSha, readJson, writeProof, writeSdrt } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm dev\nStarts the full existing production topology locally from prebuilt exact-SHA images only: manager, model gateway, socket-isolated host provisioner, web, and Caddy. Performs direct health and image-identity checks under the 5s cold-start budget. It never builds, pulls, installs, migrates, tunnels, or deploys remotely.");
  process.exit(0);
}
const sha = gitSha();
const budgetMs = Number(process.env.LOCAL_PROD_DEV_BUDGET_SECONDS ?? 5) * 1000;
const mvp = join(ROOT, "mvp-build");
const compose = ["compose", "-f", "infra/deploy/docker-compose.production.yml", "--env-file", "infra/deploy/.env.production"];
function run(args, options = {}) {
  return spawnSync("docker", [...compose, ...args], { cwd: mvp, encoding: "utf8", stdio: options.stdio ?? "pipe", env: { ...process.env, AMTECH_GIT_SHA: sha }, timeout: options.timeout });
}
function requireProof(kind) {
  const path = join(ROOT, "local-prod", "reports", `${kind}.json`);
  const proof = readJson(path);
  if (!proof || proof.status !== "pass" || proof.git_sha !== sha) throw new Error(`${kind} proof missing, failed, or not from exact SHA ${sha}`);
  return proof;
}
async function healthy(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(500) });
    return response.status >= 200 && response.status < 400;
  } catch { return false; }
}
function containerRecord(service) {
  const container = run(["ps", "-q", service]);
  const id = container.stdout?.trim();
  if (container.status !== 0 || !id) return { service, status: "missing", healthy: false };
  const inspect = spawnSync("docker", ["inspect", id, "--format", "{{json .}}"], { cwd: ROOT, encoding: "utf8", timeout: 1000 });
  if (inspect.status !== 0) return { service, status: "inspect_failed", healthy: false };
  const row = JSON.parse(inspect.stdout);
  const revision = row?.Config?.Labels?.["org.opencontainers.image.revision"] ?? null;
  const state = row?.State?.Health?.Status ?? row?.State?.Status ?? "unknown";
  return {
    service,
    status: revision === sha ? "pass" : "revision_mismatch",
    healthy: state === "healthy" || (service === "caddy" && state === "running"),
    runtime_state: state,
    container_id: id,
    image: row?.Config?.Image ?? null,
    image_id: row?.Image ?? null,
    revision,
  };
}

const findings = [];
const started = Date.now();
try {
  if (sha === "unknown") throw new Error("Git SHA unavailable");
  requireProof("build-artifacts");
  requireProof("test");
  const preflight = spawnSync(process.execPath, [join(ROOT, "scripts", "local-prod", "preflight.mjs"), "--deploy", "--strict"], { cwd: ROOT, stdio: "inherit", env: process.env });
  if (preflight.status !== 0) throw new Error("deploy preflight failed");

  const services = ["manager", "model-gateway", "host-provisioner", "web", "caddy"];
  const up = run(["up", "-d", "--no-build", "--pull", "never", "--no-deps", ...services], { stdio: "inherit", timeout: Math.max(1000, budgetMs) });
  if (up.status !== 0) throw new Error(`compose start failed (${up.status ?? "timeout"})`);

  let manager = false;
  let gateway = false;
  let web = false;
  let caddy = false;
  let records = [];
  while (Date.now() - started < budgetMs) {
    [manager, gateway, web] = await Promise.all([
      healthy("http://127.0.0.1:8080/health"),
      healthy("http://127.0.0.1:8092/health"),
      healthy("http://127.0.0.1:3000"),
    ]);
    const caddyCheck = run(["exec", "-T", "caddy", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"], { timeout: 750 });
    caddy = caddyCheck.status === 0;
    records = services.map(containerRecord);
    const provisioner = records.find((record) => record.service === "host-provisioner");
    if (manager && gateway && web && caddy && provisioner?.healthy && records.every((record) => record.status === "pass")) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const elapsedMs = Date.now() - started;
  const provisioner = records.find((record) => record.service === "host-provisioner");
  const pass = manager && gateway && web && caddy && provisioner?.healthy && records.every((record) => record.status === "pass") && elapsedMs <= budgetMs;
  if (!pass) throw new Error(`local production failed health/revision/budget: manager=${manager} gateway=${gateway} provisioner=${provisioner?.runtime_state} web=${web} caddy=${caddy} elapsed_ms=${elapsedMs}`);
  const { proof, latest } = writeProof("dev", {
    status: "pass",
    elapsed_ms: elapsedMs,
    budget_ms: budgetMs,
    health: { manager, model_gateway: gateway, host_provisioner: provisioner?.healthy ?? false, web, caddy },
    identities: records,
    topology: "full production docker-compose.production.yml; control network; Unix-socket provisioner; local loopback ports; no tunnel",
  });
  const sdrt = writeSdrt("dev", proof);
  console.log(`Local production is healthy on exact SHA ${sha}.`);
  console.log(`proof_json:${latest}`);
  console.log(`proof_sdrt:${sdrt}`);
} catch (error) {
  const elapsedMs = Date.now() - started;
  findings.push({ id: "dev_start_failed", severity: "critical", vector: "local_prod_fidelity", mitigation: "Resolve preflight, exact-SHA image, health, socket-provisioner, or cold-start failures; rerun build/test before dev.", test_case_id: "LP-DEV-001", perf_impact: `${elapsedMs}ms`, evidence: { error: String(error?.message ?? error) } });
  const down = run(["down", "--remove-orphans"], { stdio: "inherit", timeout: 10000 });
  const { proof, latest } = writeProof("dev", { status: "blocked", elapsed_ms: elapsedMs, budget_ms: budgetMs, findings, rollback_exit_code: down.status });
  const sdrt = writeSdrt("dev", proof);
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`proof_json:${latest}`);
  console.error(`proof_sdrt:${sdrt}`);
  process.exit(1);
}
