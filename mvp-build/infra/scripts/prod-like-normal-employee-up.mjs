#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRODUCTION_COMPOSE_FILE,
  PRODUCTION_CONTAINER_NAMES,
  PRODUCTION_CONTROL_SERVICES,
  PRODUCTION_ENV_FILE,
  PRODUCTION_TUNNEL_OVERLAY_FILE,
  productionComposeArgs,
} from "./production-topology.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const deployEnvPath = join(root, PRODUCTION_ENV_FILE);
const deployEnvExamplePath = join(root, "infra", "deploy", ".env.production.example");
const localEnvPath = join(root, ".env");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
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
const modelGatewayHealthUrl = argValue("--model-gateway-url", "http://127.0.0.1:8092");
const webHealthUrl = argValue("--web-url", "http://127.0.0.1:3000");
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

function removeEnv(linesState, key) {
  const before = linesState.lines.length;
  linesState.lines = linesState.lines.filter((line) => !line.startsWith(`${key}=`));
  delete linesState.current[key];
  if (linesState.lines.length !== before) linesState.changed.push(`${key}=[removed]`);
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

  const xaiToken = localEnv.XAI_API_TOKEN
    ?? current.XAI_API_TOKEN
    ?? localEnv.XAI_API_KEY
    ?? current.XAI_API_KEY
    ?? localEnv.xai_api_key
    ?? current.xai_api_key;
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
  put("MANAGER_API_ORIGIN", `http://${PRODUCTION_CONTAINER_NAMES.manager}:8080`);
  put("DOCKER_MANAGER_API_ORIGIN", `http://${PRODUCTION_CONTAINER_NAMES.manager}:8080`);
  put("DOCKER_MANAGER_BASE_URL", `http://${PRODUCTION_CONTAINER_NAMES.manager}:8080`);
  put("MODEL_GATEWAY_EMPLOYEE_BASE_URL", `http://${PRODUCTION_CONTAINER_NAMES.modelGateway}:8092/v1`);
  put("PROVISIONER_SOCKET_PATH", "/run/amtech-provisioner/provisioner.sock");
  put("MANAGER_CONTAINER_NAME", PRODUCTION_CONTAINER_NAMES.manager);
  put("MODEL_GATEWAY_CONTAINER_NAME", PRODUCTION_CONTAINER_NAMES.modelGateway);
  put("PUBLIC_WEB_ORIGIN", webOrigin);
  put("AGENT_WEB_ORIGIN", webOrigin);
  put("WEB_APP_ORIGIN", webOrigin);
  put("CADDY_CLIENTS_DIR", "/var/lib/amtech/caddy/clients");
  put("CADDY_VALIDATE_COMMAND", `docker exec ${PRODUCTION_CONTAINER_NAMES.caddy} caddy validate --config /etc/caddy/Caddyfile`);
  put("CADDY_RELOAD_COMMAND", `docker exec ${PRODUCTION_CONTAINER_NAMES.caddy} caddy reload --config /etc/caddy/Caddyfile`);
  put("CADDY_EMPLOYEE_UPSTREAM_HOST", "localhost");
  put("CLOUDFLARE_ZONE_NAME", "amtechai.com", { overwrite: !hasRealValue(current.CLOUDFLARE_ZONE_NAME) });
  put("AMTECH_PUBLIC_DOMAIN", "amtechai.com", { overwrite: !hasRealValue(current.AMTECH_PUBLIC_DOMAIN) });
  put("HERMES_BACKEND_TYPE", "docker");
  put("HERMES_RUNTIME_COMMAND", "/app/infra/scripts/deploy/start-hermes-container.sh");
  put("AMTECH_PROOF_DIR", proofDir);

  removeEnv(state, "PROVISIONER_ORIGIN");
  removeEnv(state, "HERMES_DOCKER_NETWORK");
  removeEnv(state, "LOCAL_MODEL_BRIDGE");

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

function compose(name, argsList, options = {}) {
  return run(name, "docker", productionComposeArgs(argsList, [PRODUCTION_TUNNEL_OVERLAY_FILE]), options);
}

function deriveTunnelTokenFromCert() {
  const certFullPath = join(root, cloudflaredCertPath);
  if (!existsSync(certFullPath)) return { status: "gated", reason: `${cloudflaredCertPath} missing` };
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

function provisionerSocket() {
  const result = compose("host_provisioner_socket", [
    "exec",
    "-T",
    "host-provisioner",
    "test",
    "-S",
    "/run/amtech-provisioner/provisioner.sock",
  ]);
  return { ...result, name: "host_provisioner_socket" };
}

function tunnelCheck(env) {
  if (skipTunnel) return { name: "cloudflare_named_tunnel", status: "skip", reason: "skipped by --skip-tunnel" };
  let token = env.CLOUDFLARE_TUNNEL_TOKEN;
  let tokenSource = "env:CLOUDFLARE_TUNNEL_TOKEN";
  if (!hasRealValue(token)) {
    const derived = deriveTunnelTokenFromCert();
    if (derived.status !== "pass") return { ...derived, name: "cloudflare_named_tunnel" };
    token = derived.token;
    tokenSource = cloudflaredCertPath;
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
  return {
    name: "cloudflare_named_tunnel",
    status: "pass",
    container: tunnelContainerName,
    tunnel: tunnelName,
    token_source: tokenSource,
    public_hosts: [webOrigin, apiOrigin],
  };
}

function writeProof(proof) {
  mkdirSync(join(root, proofDir), { recursive: true });
  const path = join(proofDir, `prod-like-normal-up-${stamp()}.json`);
  writeFileSync(join(root, path), JSON.stringify(proof, null, 2));
  return path;
}

const checks = [];
const { changed, env } = writeMergedDeployEnv();
checks.push({ name: "deploy_env_prepared", status: "pass", path: PRODUCTION_ENV_FILE, changed });

if (!skipCompose) {
  checks.push(compose("compose_config", ["config", "--quiet"]));
  if (downFirst) checks.push(compose("compose_down", ["down"]));
  const upArgs = ["up", "-d"];
  if (!noBuild) upArgs.push("--build");
  checks.push(compose("compose_up", upArgs, { stdio: "inherit" }));
  checks.push(run("canonical_deploy_smoke", "node", ["infra/scripts/deploy-smoke.mjs"], {
    stdio: "inherit",
    env: { WRITE_PROOF_JSON: "0" },
  }));
  checks.push(await httpCheck("manager_health", `${managerHealthUrl.replace(/\/$/, "")}/health`));
  checks.push(await httpCheck("model_gateway_health", `${modelGatewayHealthUrl.replace(/\/$/, "")}/health`));
  checks.push(await httpCheck("web_health", webHealthUrl));
  checks.push(provisionerSocket());
  checks.push(curlCheck("caddy_agent_route", "http://agent.amtechai.com/create-ai-employee", ["--resolve", "agent.amtechai.com:80:127.0.0.1"]));
  checks.push(curlCheck("caddy_api_route", "http://api.amtechai.com/health", ["--resolve", "api.amtechai.com:80:127.0.0.1"]));
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
  compose_files: [PRODUCTION_COMPOSE_FILE, PRODUCTION_TUNNEL_OVERLAY_FILE],
  control_services: PRODUCTION_CONTROL_SERVICES,
  notes: {
    success_target: "brand-new normal employee only; public estimator scripts and IDs are not acceptance evidence",
    topology: "host-network Caddy, five-service control plane, signed Host Provisioner Unix socket, and per-employee internal bridges",
    browser_auth: "production mode requires the real owner cookie minted by create-account; /api/dev/login is intentionally not used",
    provider_acceptance: "This script does not claim provider-accepted LLM or external-effect proof.",
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
