#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { cpus, hostname, totalmem } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

async function httpCheck(name, url, attempts = 30, headers = {}) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    const started = Date.now();
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000), redirect: "manual" });
      last = { name, status: res.status >= 200 && res.status < 400 ? "pass" : "fail", http_status: res.status, url, ms: Date.now() - started };
      if (last.status === "pass") return last;
    } catch (err) {
      last = { name, status: "fail", url, error: String(err?.message ?? err), ms: Date.now() - started };
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
  }
  return last ?? { name, status: "fail", url, error: "not_checked" };
}

function curlCheck(name, url, extraArgs = []) {
  const result = spawnSync("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "10", ...extraArgs, url], {
    cwd: root,
    encoding: "utf8",
  });
  const statusCode = Number((result.stdout ?? "").trim());
  return {
    name,
    status: result.status === 0 && statusCode >= 200 && statusCode < 400 ? "pass" : "fail",
    http_status: Number.isFinite(statusCode) ? statusCode : null,
    url,
    exit_code: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 5000),
  };
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

function compose(argsList, options = {}) {
  return run("compose", "docker", [
    "compose",
    "-f",
    "infra/deploy/docker-compose.yml",
    "--env-file",
    "infra/deploy/.env.production",
    ...argsList,
  ], options);
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
  const checks = [result];
  const proof = {
    kind: "production_normal_up",
    target,
    status: result.status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: gitSha(),
    delegated_script: "infra/scripts/prod-like-normal-employee-up.mjs",
    command: `node ${forwarded.join(" ")}`,
    notes: {
      shape: "Local production-like: Cloudflare named tunnel -> Caddy tunnel origin -> Web/Manager production containers -> Docker employee fleet.",
      acceptance: "This starts the stack. Launch proof still requires real onboarding, Verify, account creation, employee provisioning, and provider-backed reply.",
    },
    checks,
  };
  const proofPath = writeProof(proof);
  console.log(`proof_json:${proofPath}`);
  if (result.status !== "pass") process.exit(1);
}

async function runVps() {
  const checks = [];
  checks.push(hardwareCheck());
  checks.push(run("deploy_env_prepare", "node", [
    "infra/scripts/prod-like-normal-employee-up.mjs",
    "--skip-compose",
    "--skip-tunnel",
    `--web-origin=${webOrigin}`,
    `--api-origin=${apiOrigin}`,
  ]));
  checks.push(run("docker_network_create", "docker", ["network", "create", "amtech_runtime"]));
  if (checks.at(-1)?.status === "fail" && /already exists/i.test(checks.at(-1)?.output ?? "")) {
    checks[checks.length - 1].status = "pass";
  }
  if (downFirst) checks.push(compose(["down"]));
  const upArgs = ["up", "-d"];
  if (!noBuild) upArgs.push("--build");
  checks.push(compose(upArgs, { stdio: "inherit" }));
  checks.push(await httpCheck("manager_health", "http://127.0.0.1:8080/health"));
  checks.push(await httpCheck("web_health", "http://127.0.0.1:3000/create-ai-employee"));
  checks.push(curlCheck("caddy_agent_route", "http://agent.amtechai.com/create-ai-employee", ["--resolve", "agent.amtechai.com:80:127.0.0.1"]));
  checks.push(curlCheck("caddy_api_route", "http://api.amtechai.com/health", ["--resolve", "api.amtechai.com:80:127.0.0.1"]));
  checks.push(compose(["exec", "-T", "caddy", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]));
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
    compose_files: ["infra/deploy/docker-compose.yml"],
    vps_target: { cores: 8, memory_gb: 64 },
    notes: {
      shape: "VPS production: public DNS -> Caddy production origin with ACME -> Web/Manager production containers -> Docker employee fleet.",
      prerequisites: "DNS for agent.amtechai.com/api.amtechai.com points at the VPS, ports 80/443 are open, and infra/deploy/.env.production contains real production secrets.",
      acceptance: "This starts the stack. Launch proof still requires real onboarding, Verify, account creation, employee provisioning, and provider-backed reply.",
    },
    checks,
  };
  const proofPath = writeProof(proof);
  printChecks(checks);
  console.log(`proof_json:${proofPath}`);
  if (failed) process.exit(1);
}

if (!["local-tunnel", "vps"].includes(target)) {
  console.error("Unsupported --target. Use --target=local-tunnel or --target=vps.");
  process.exit(2);
}

if (target === "local-tunnel") await runLocalTunnel();
else await runVps();
