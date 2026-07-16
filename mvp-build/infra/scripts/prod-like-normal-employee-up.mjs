#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const deployEnvPath = join(root, "infra", "deploy", ".env.production");
const deployEnvExamplePath = join(root, "infra", "deploy", ".env.production.example");
const localEnvPath = join(root, ".env");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const composeFile = "infra/deploy/docker-compose.yml";
const tunnelComposeFile = "infra/deploy/docker-compose.tunnel.yml";
const cloudflaredCertPath = "infra/.local/cloudflared/cert.pem";
const tunnelName = "amtech-tunnel";
const tunnelContainerName = "amtech-tunnel";

const args = new Set(process.argv.slice(2));
const argValue = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const webOrigin = argValue("--web-origin", process.env.PUBLIC_WEB_ORIGIN ?? "https://agent.amtechai.com");
const apiOrigin = argValue("--api-origin", process.env.API_PUBLIC_ORIGIN ?? "https://api.amtechai.com");
const managerHealthUrl = argValue("--manager-url", "http://127.0.0.1:8080");
const webHealthUrl = argValue("--web-url", "http://127.0.0.1:3000");
const caddyHealthUrl = argValue("--caddy-url", "http://127.0.0.1");
const noBuild = args.has("--no-build");
const downFirst = args.has("--down-first");
const skipCompose = args.has("--skip-compose");
const skipTunnel = args.has("--skip-tunnel");
const requireTunnel = args.has("--require-tunnel");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" });
  return result.stdout?.trim() || null;
}

function parseEnvText(text) {
  const values = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return values;
}

function readEnv(path) {
  if (!existsSync(path)) return {};
  return parseEnvText(readFileSync(path, "utf8"));
}

function isPlaceholder(value) {
  return !value || /^change-me/.test(String(value)) || /change-me/.test(String(value));
}

function hasRealValue(value) {
  return value !== undefined && value !== null && value !== "" && !isPlaceholder(value);
}

function setEnvValue(lines, key, value) {
  const nextLine = `${key}=${value}`;
  let replaced = false;
  const next = lines.map((line) => {
    if (line.match(new RegExp(`^${key}=`))) {
      replaced = true;
      return nextLine;
    }
    return line;
  });
  if (!replaced) next.push(nextLine);
  return next;
}

function putEnv(linesState, key, value, { overwrite = true, secret = false } = {}) {
  if (value === undefined || value === null || value === "") return;
  if (!overwrite && hasRealValue(linesState.current[key])) return;
  linesState.lines = setEnvValue(linesState.lines, key, value);
  linesState.current[key] = String(value);
  linesState.changed.push(secret ? `${key}=[set]` : `${key}=${value}`);
}

function writeMergedDeployEnv() {
  if (!existsSync(deployEnvPath)) {
    const seed = existsSync(deployEnvExamplePath) ? readFileSync(deployEnvExamplePath, "utf8") : "";
    writeFileSync(deployEnvPath, seed, "utf8");
  }

  const localEnv = readEnv(localEnvPath);
  const current = readEnv(deployEnvPath);
  const state = { lines: readFileSync(deployEnvPath, "utf8").split("\n"), current, changed: [] };
  const put = (key, value, opts) => putEnv(state, key, value, opts);

  for (const key of [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SIGNING_SECRET",
    "MANAGER_INTERNAL_TOKEN",
    "PROVISIONER_TOKEN",
    "SECRET_REF_MASTER_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_TEST_NUMBER",
    "TWILIO_TEST_TO_PHONE",
    "TWILIO_VERIFY_SERVICE_SID",
    "TWILIO_VERIFY_DEV_BYPASS",
    "TWILIO_VERIFY_DEV_CODE",
    "XAI_API_TOKEN",
    "XAI_MODEL",
    "XAI_API_KEY",
    "xai_api_key",
    "xai_model",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_TUNNEL_TOKEN",
  ]) {
    if (hasRealValue(localEnv[key]) && (!hasRealValue(current[key]) || args.has("--refresh-env"))) {
      put(key, localEnv[key], { overwrite: true, secret: /(TOKEN|KEY|SECRET|DATABASE_URL)/.test(key) });
    }
  }

  const xaiToken = localEnv.XAI_API_TOKEN ?? current.XAI_API_TOKEN ?? localEnv.XAI_API_KEY ?? current.XAI_API_KEY ?? localEnv.xai_api_key ?? current.xai_api_key;
  const xaiModel = localEnv.XAI_MODEL ?? current.XAI_MODEL ?? localEnv.xai_model ?? current.xai_model ?? "grok-4.3";
  if (hasRealValue(xaiToken)) {
    put("XAI_API_TOKEN", xaiToken, { overwrite: true, secret: true });
    put("XAI_API_KEY", xaiToken, { overwrite: true, secret: true });
    put("xai_api_key", xaiToken, { overwrite: true, secret: true });
    put("ORCHESTRATOR_API_KEY", xaiToken, { overwrite: true, secret: true });
    put("ORCHESTRATOR_PROVIDER", "openai_compatible");
    put("ORCHESTRATOR_API_BASE_URL", "https://api.x.ai/v1");
  }
  put("XAI_MODEL", xaiModel);
  put("xai_model", xaiModel);
  put("ORCHESTRATOR_MODEL", xaiModel);
  put("HERMES_MODEL_PROVIDER", "openai_compatible");
  put("HERMES_MODEL_DEFAULT", xaiModel);

  put("PUBLIC_BASE_DOMAIN", "amtechai.com");
  put("NODE_ENV", "production");
  put("MANAGER_API_ORIGIN", "http://manager:8080");
  put("PROVISIONER_ORIGIN", "http://manager:8080");
  put("DOCKER_MANAGER_API_ORIGIN", "http://manager:8080");
  put("DOCKER_MANAGER_BASE_URL", "http://manager:8080");
  put("PUBLIC_WEB_ORIGIN", webOrigin);
  put("AGENT_WEB_ORIGIN", webOrigin);
  put("WEB_APP_ORIGIN", webOrigin);
  put("CADDY_CLIENTS_DIR", "/var/lib/amtech/caddy/clients");
  put("CADDY_VALIDATE_COMMAND", "docker exec amtech-ai-employee-caddy-1 caddy validate --config /etc/caddy/Caddyfile");
  put("CADDY_RELOAD_COMMAND", "docker exec amtech-ai-employee-caddy-1 caddy reload --config /etc/caddy/Caddyfile");
  put("CADDY_EMPLOYEE_UPSTREAM_HOST", "amtech-hermes-{{EMPLOYEE_ID}}");
  put("CLOUDFLARE_ZONE_NAME", "amtechai.com", { overwrite: !hasRealValue(current.CLOUDFLARE_ZONE_NAME) });
  put("AMTECH_PUBLIC_DOMAIN", "amtechai.com", { overwrite: !hasRealValue(current.AMTECH_PUBLIC_DOMAIN) });
  put("HERMES_DOCKER_NETWORK", "amtech_runtime");
  put("HERMES_BACKEND_TYPE", "docker");
  put("HERMES_RUNTIME_COMMAND", "/app/infra/scripts/deploy/start-hermes-container.sh");
  put("AMTECH_PROOF_DIR", proofDir);
  put("LOCAL_MODEL_BRIDGE", "", { overwrite: true });

  state.lines = state.lines.filter((line) => !line.startsWith("LOCAL_MODEL_BRIDGE="));
  writeFileSync(deployEnvPath, `${state.lines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
  return { changed: state.changed, env: state.current };
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
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
  };
}

function deriveTunnelTokenFromCert() {
  const certFullPath = join(root, cloudflaredCertPath);
  if (!existsSync(certFullPath)) {
    return { status: "gated", reason: `${cloudflaredCertPath} missing` };
  }
  const result = spawnSync("docker", [
    "run",
    "--rm",
    "--user",
    "0",
    "--network",
    "host",
    "-v",
    `${certFullPath}:/cert.pem:ro`,
    "cloudflare/cloudflared:latest",
    "tunnel",
    "--origincert",
    "/cert.pem",
    "token",
    tunnelName,
  ], { cwd: root, encoding: "utf8" });
  const token = (result.stdout ?? "").split("\n").map((line) => line.trim()).filter(Boolean).at(-1) ?? "";
  if (result.status !== 0 || !hasRealValue(token)) {
    return {
      status: "fail",
      reason: "could not derive token from origin cert",
      output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
    };
  }
  return { status: "pass", token };
}

function compose(argsList, options = {}) {
  return run("compose", "docker", [
    "compose",
    "-f",
    composeFile,
    "-f",
    tunnelComposeFile,
    "--env-file",
    "infra/deploy/.env.production",
    ...argsList,
  ], options);
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
  const result = spawnSync("curl", [
    "-sS",
    "-o",
    "/dev/null",
    "-w",
    "%{http_code}",
    "--max-time",
    "10",
    ...extraArgs,
    url,
  ], { cwd: root, encoding: "utf8" });
  const statusCode = Number((result.stdout ?? "").trim());
  return {
    name,
    status: result.status === 0 && statusCode >= 200 && statusCode < 400 ? "pass" : "fail",
    http_status: Number.isFinite(statusCode) ? statusCode : null,
    url,
    command: `curl ${extraArgs.join(" ")} ${url}`.replace(/\s+/g, " ").trim(),
    exit_code: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
  };
}

function dockerNetwork() {
  const inspect = run("docker_network_inspect", "docker", ["network", "inspect", "amtech_runtime"]);
  if (inspect.status === "pass") return inspect;
  return run("docker_network_create", "docker", ["network", "create", "amtech_runtime"]);
}

function tunnelCheck(env) {
  if (skipTunnel) return { name: "cloudflare_named_tunnel", status: "skip", reason: "skipped by --skip-tunnel" };
  let token = env.CLOUDFLARE_TUNNEL_TOKEN;
  let token_source = "env:CLOUDFLARE_TUNNEL_TOKEN";
  if (!hasRealValue(token)) {
    const derived = deriveTunnelTokenFromCert();
    if (derived.status !== "pass") return { ...derived, name: "cloudflare_named_tunnel" };
    token = derived.token;
    token_source = cloudflaredCertPath;
  }
  run("cloudflare_tunnel_rm", "docker", ["rm", "-f", tunnelContainerName]);
  const started = run("cloudflare_tunnel_start", "docker", [
    "run",
    "-d",
    "--name",
    tunnelContainerName,
    "--network",
    "host",
    "--restart",
    "unless-stopped",
    "-e",
    "TUNNEL_TOKEN",
    "cloudflare/cloudflared:latest",
    "tunnel",
    "--no-autoupdate",
    "run",
  ], { env: { TUNNEL_TOKEN: token } });
  if (started.status !== "pass") return { ...started, name: "cloudflare_named_tunnel" };
  return { name: "cloudflare_named_tunnel", status: "pass", container: tunnelContainerName, tunnel: tunnelName, token_source, public_hosts: [webOrigin, apiOrigin] };
}

function writeProof(proof) {
  mkdirSync(join(root, proofDir), { recursive: true });
  const path = join(proofDir, `prod-like-normal-up-${stamp()}.json`);
  writeFileSync(join(root, path), JSON.stringify(proof, null, 2));
  return path;
}

const checks = [];
const { changed, env } = writeMergedDeployEnv();
checks.push({ name: "deploy_env_prepared", status: "pass", path: "infra/deploy/.env.production", changed });

if (downFirst && !skipCompose) checks.push(compose(["down"]));
if (!skipCompose) {
  checks.push(dockerNetwork());
  const upArgs = ["up", "-d"];
  if (!noBuild) upArgs.push("--build");
  checks.push(compose(upArgs, { stdio: "inherit" }));
  checks.push(await httpCheck("manager_health", `${managerHealthUrl.replace(/\/$/, "")}/health`));
  checks.push(await httpCheck("web_health", webHealthUrl));
  checks.push(curlCheck("caddy_agent_route", "http://agent.amtechai.com/create-ai-employee", ["--resolve", "agent.amtechai.com:80:127.0.0.1"]));
  checks.push(curlCheck("caddy_api_route", "http://api.amtechai.com/health", ["--resolve", "api.amtechai.com:80:127.0.0.1"]));
  checks.push(compose(["exec", "-T", "caddy", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]));
  checks.push(tunnelCheck(env));
  checks.push(await httpCheck("public_agent_route", `${webOrigin.replace(/\/$/, "")}/create-ai-employee`, 10));
  checks.push(await httpCheck("public_api_health", `${apiOrigin.replace(/\/$/, "")}/health`, 10));
}

const failed = checks.some((check) => check.status === "fail");
const gated = checks.some((check) => check.status === "gated");
const proof = {
  kind: "prod_like_normal_employee_up",
  status: failed ? "fail" : gated ? "partial" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  git_sha: gitSha(),
  public_origin: webOrigin,
  public_api_origin: apiOrigin,
  compose_files: [composeFile, tunnelComposeFile],
  notes: {
    success_target: "brand-new normal employee only; public estimator scripts and ids are not acceptance evidence",
    tunnel_origin: "Cloudflare named tunnel points at local Caddy, not directly at Next.js",
    browser_auth: "production mode requires the real owner cookie minted by create-account; /api/dev/login is intentionally not used",
    provider_acceptance: "This script does not claim provider-accepted LLM proof.",
  },
  checks,
};
const proofPath = writeProof(proof);

for (const check of checks) {
  const prefix = check.status === "pass" ? "PASS" : check.status === "gated" ? "GATED" : check.status === "skip" ? "SKIP" : "FAIL";
  console.log(`${prefix} ${check.name}${check.reason ? ` ${check.reason}` : ""}`);
}
console.log(`proof_json:${proofPath}`);

if (failed || (requireTunnel && gated)) process.exit(1);
