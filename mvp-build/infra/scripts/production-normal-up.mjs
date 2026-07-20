#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, hostname, totalmem } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRODUCTION_COMPOSE_FILE,
  PRODUCTION_CONTROL_SERVICES,
  productionComposeArgs,
} from "./production-topology.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const prefix = `${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const target = argValue("--target", process.env.AMTECH_DEPLOY_TARGET ?? "local-tunnel");
const noBuild = args.includes("--no-build");
const downFirst = args.includes("--down-first") || !args.includes("--no-down-first");
const requireTunnel = args.includes("--require-tunnel") || target === "local-tunnel";
const webOrigin = argValue("--web-origin", process.env.PUBLIC_WEB_ORIGIN ?? "https://agent.amtechai.com");
const apiOrigin = argValue("--api-origin", process.env.API_PUBLIC_ORIGIN ?? "https://api.amtechai.com");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" });
  return result.stdout?.trim() || null;
}

function run(name, command, argsList, options = {}) {
  const result = spawnSync(command, argsList, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    env: { ...process.env, ...options.env },
  });
  return {
    name,
    status: result.status === 0 ? "pass" : "fail",
    command: `${command} ${argsList.join(" ")}`,
    exit_code: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 5000),
  };
}

function compose(name, argsList, options = {}) {
  return run(name, "docker", productionComposeArgs(argsList), options);
}

async function httpCheck(name, url, attempts = 30) {
  let last = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const started = Date.now();
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "manual" });
      last = {
        name,
        status: response.status >= 200 && response.status < 400 ? "pass" : "fail",
        http_status: response.status,
        url,
        ms: Date.now() - started,
      };
      if (last.status === "pass") return last;
    } catch (err) {
      last = { name, status: "fail", url, error: String(err?.message ?? err), ms: Date.now() - started };
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
  }
  return last ?? { name, status: "fail", url, error: "not_checked" };
}

function writeProof(proof) {
  mkdirSync(join(root, proofDir), { recursive: true });
  const path = join(proofDir, `production-normal-up-${target}-${stamp()}.json`);
  writeFileSync(join(root, path), JSON.stringify(proof, null, 2));
  return path;
}

function printChecks(checks) {
  for (const check of checks) {
    const prefix = check.status === "pass" ? "PASS" : check.status === "skip" ? "SKIP" : check.status === "warn" ? "WARN" : "FAIL";
    console.log(`${prefix} ${check.name}${check.reason ? ` ${check.reason}` : ""}`);
  }
}

function hardwareCheck() {
  const cores = cpus().length;
  const memoryGb = Math.round((totalmem() / 1024 / 1024 / 1024) * 10) / 10;
  const ok = cores >= 8 && memoryGb >= 60;
  return {
    name: "vps_capacity_8core_64gb",
    status: ok ? "pass" : "warn",
    cores,
    memory_gb: memoryGb,
    reason: ok ? undefined : "target VPS shape is 8 cores and 64 GB RAM; this host is below that",
  };
}

async function runLocalTunnel() {
  const forwarded = [
    "infra/scripts/prod-like-normal-employee-up.mjs",
    ...(downFirst ? ["--down-first"] : []),
    ...(noBuild ? ["--no-build"] : []),
    ...(requireTunnel ? ["--require-tunnel"] : []),
    `--web-origin=${webOrigin}`,
    `--api-origin=${apiOrigin}`,
  ];
  const result = run("prod_like_normal_up", "node", forwarded, { stdio: "inherit" });
  const proof = {
    kind: "production_normal_up",
    target,
    status: result.status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    compose_files: [PRODUCTION_COMPOSE_FILE],
    control_services: PRODUCTION_CONTROL_SERVICES,
    delegated_script: "infra/scripts/prod-like-normal-employee-up.mjs",
    command: `node ${forwarded.join(" ")}`,
    notes: {
      shape: "Local production-like: Cloudflare named tunnel -> host-network Caddy -> loopback Web/Manager -> canonical control plane -> isolated Hermes employee networks.",
      acceptance: "This starts and smokes the canonical stack. Launch proof still requires real onboarding, provider-backed work, channels, commercial reconciliation, recovery, and rollback evidence.",
    },
    checks: [result],
  };
  const proofPath = writeProof(proof);
  console.log(`proof_json:${proofPath}`);
  if (result.status !== "pass") process.exit(1);
}

async function runVps() {
  const checks = [hardwareCheck()];
  checks.push(run("deploy_env_prepare", "node", [
    "infra/scripts/prod-like-normal-employee-up.mjs",
    "--skip-compose",
    "--skip-tunnel",
    `--web-origin=${webOrigin}`,
    `--api-origin=${apiOrigin}`,
  ]));
  checks.push(compose("compose_config", ["config", "--quiet"]));
  if (downFirst) checks.push(compose("compose_down", ["down"]));
  const upArgs = ["up", "-d"];
  if (!noBuild) upArgs.push("--build");
  checks.push(compose("compose_up", upArgs, { stdio: "inherit" }));
  checks.push(run("canonical_deploy_smoke", "node", ["infra/scripts/deploy-smoke.mjs"], {
    stdio: "inherit",
    env: { WRITE_PROOF_JSON: "0" },
  }));
  checks.push(await httpCheck("public_agent_route", `${webOrigin.replace(/\/$/, "")}/create-ai-employee`, 15));
  checks.push(await httpCheck("public_api_health", `${apiOrigin.replace(/\/$/, "")}/health`, 15));

  const failed = checks.some((check) => check.status === "fail");
  const proof = {
    kind: "production_normal_up",
    target,
    status: failed ? "fail" : "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    public_origin: webOrigin,
    public_api_origin: apiOrigin,
    compose_files: [PRODUCTION_COMPOSE_FILE],
    control_services: PRODUCTION_CONTROL_SERVICES,
    vps_target: { cores: 8, memory_gb: 64 },
    notes: {
      shape: "VPS production: public DNS -> host-network Caddy -> loopback Web/Manager/Model Gateway -> signed Unix-socket Host Provisioner -> isolated Hermes employee networks.",
      prerequisites: "DNS points at the VPS, ports 80/443 are open, and infra/deploy/.env.production contains managed production coordinates and secrets.",
      acceptance: "Stack startup and smoke are not launch acceptance; exact-SHA live database, provider, browser/channel, commercial, recovery, rollback, and attestation gates remain separate.",
    },
    checks,
  };
  const proofPath = writeProof(proof);
  printChecks(checks);
  console.log(`proof_json:${proofPath}`);
  if (failed) process.exit(1);
}

if (!['local-tunnel', 'vps'].includes(target)) {
  console.error("Unsupported --target. Use --target=local-tunnel or --target=vps.");
  process.exit(2);
}

if (target === "local-tunnel") await runLocalTunnel();
else await runVps();
