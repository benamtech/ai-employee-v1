#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const baseManager = process.env.MANAGER_SMOKE_URL ?? "http://127.0.0.1:8080";
const baseWeb = process.env.WEB_SMOKE_URL ?? "http://127.0.0.1:3000";
const baseCaddy = process.env.CADDY_SMOKE_URL ?? "http://127.0.0.1";
const composeFile = process.env.COMPOSE_FILE ?? "infra/deploy/docker-compose.yml";
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const employeeAlias = process.env.EMPLOYEE_DNS_ALIAS;
const writeProof = process.env.WRITE_PROOF_JSON !== "0";

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function dockerCompose(args) {
  return spawnSync("docker", ["compose", "-f", composeFile, ...args], { encoding: "utf8" });
}

async function httpCheck(name, url, { web = false, proxy = false } = {}) {
  const started = Date.now();
  try {
    // `redirect: "manual"` so a reverse proxy that enforces HTTPS (Caddy answers
    // :80 with a 308 -> https) counts as REACHABLE. Following the redirect would
    // chase into the HTTPS leg, whose cert can't be provisioned on a host without
    // public DNS (ACME NXDOMAIN) — a TLS failure that says nothing about whether
    // Caddy is up and routing. A 3xx from the proxy is itself proof it is.
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: proxy ? "manual" : "follow" });
    const ok = res.ok || ((web || proxy) && res.status < 500) || (proxy && res.type === "opaqueredirect");
    return { name, status: ok ? "pass" : "fail", http_status: res.status || (res.type === "opaqueredirect" ? 308 : 0), url, ms: Date.now() - started };
  } catch (err) {
    return { name, status: "fail", url, error: String(err?.message ?? err), ms: Date.now() - started };
  }
}

function composeHealth(service) {
  const ps = dockerCompose(["ps", "-q", service]);
  if (ps.status !== 0 || !ps.stdout.trim()) {
    return { name: `compose:${service}`, status: "fail", error: `${ps.stdout}${ps.stderr}`.trim() || "container_not_found" };
  }
  const id = ps.stdout.trim().split("\n")[0];
  const inspect = spawnSync("docker", ["inspect", id, "--format", "{{.State.Status}}\t{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}"], { encoding: "utf8" });
  if (inspect.status !== 0) {
    return { name: `compose:${service}`, status: "fail", container_id: id, error: `${inspect.stdout}${inspect.stderr}`.trim() };
  }
  const [container_state, health] = inspect.stdout.trim().split("\t");
  const ok = container_state === "running" && (health === "healthy" || health === "none");
  return { name: `compose:${service}`, status: ok ? "pass" : "fail", container_id: id, container_state, health };
}

function caddyValidate() {
  const res = dockerCompose(["exec", "-T", "caddy", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]);
  return {
    name: "caddy:validate",
    status: res.status === 0 ? "pass" : "fail",
    output: `${res.stdout}${res.stderr}`.trim().slice(0, 4000),
  };
}

function dockerDns(alias) {
  if (!alias) return { name: "docker-dns:employee-alias", status: "skip", reason: "EMPLOYEE_DNS_ALIAS not set" };
  const res = dockerCompose(["exec", "-T", "caddy", "getent", "hosts", alias]);
  return {
    name: "docker-dns:employee-alias",
    status: res.status === 0 ? "pass" : "fail",
    alias,
    output: `${res.stdout}${res.stderr}`.trim().slice(0, 4000),
  };
}

function gitSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const checks = [
  await httpCheck("manager-health", `${baseManager.replace(/\/$/, "")}/health`),
  await httpCheck("web", baseWeb, { web: true }),
  await httpCheck("caddy", baseCaddy, { proxy: true }),
  composeHealth("manager"),
  composeHealth("web"),
  composeHealth("caddy"),
  caddyValidate(),
  dockerDns(employeeAlias),
];

for (const check of checks) {
  const prefix = check.status === "pass" ? "PASS" : check.status === "skip" ? "SKIP" : "FAIL";
  console.log(`${prefix} ${check.name}${check.http_status ? ` ${check.http_status}` : ""}${check.error ? ` ${check.error}` : ""}`);
}

const proof = {
  kind: "deploy_smoke",
  status: checks.some((c) => c.status === "fail") ? "fail" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  git_sha: gitSha(),
  compose_file: composeFile,
  checks,
};

if (writeProof) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `deploy-smoke-${nowStamp()}.json`);
  writeFileSync(path, JSON.stringify(proof, null, 2));
  console.log(`proof_json:${path}`);
}

if (proof.status !== "pass") process.exit(1);
