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
const composeFile = "infra/deploy/docker-compose.yml";
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";

const args = new Set(process.argv.slice(2));
const argValue = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const employeeId = argValue("--employee-id", process.env.PUBLIC_ESTIMATOR_EMPLOYEE_ID ?? "emp_5omv4ihbvggc8ibe31nj43");
const accountId = argValue("--account-id", process.env.PUBLIC_ESTIMATOR_ACCOUNT_ID ?? "acct_x7kt6lu4hjl0r9fzjj5q3b");
const webOrigin = argValue("--web-origin", process.env.PUBLIC_WEB_ORIGIN ?? "http://localhost:3000");
const managerHealthUrl = argValue("--manager-url", "http://127.0.0.1:8080");
const webHealthUrl = argValue("--web-url", "http://127.0.0.1:3000");
const noBuild = args.has("--no-build");
const downFirst = args.has("--down-first");
const skipCompose = args.has("--skip-compose");
const requireCaddy = args.has("--require-caddy");
const reprovisionEmployee = args.has("--reprovision-employee");

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
  return !value || /^change-me/.test(value) || /change-me/.test(value);
}

function hasRealValue(value) {
  return value !== undefined && value !== null && value !== "" && !isPlaceholder(String(value));
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

function writeMergedDeployEnv() {
  if (!existsSync(deployEnvPath)) {
    const seed = existsSync(deployEnvExamplePath) ? readFileSync(deployEnvExamplePath, "utf8") : "";
    writeFileSync(deployEnvPath, seed, "utf8");
  }

  const localEnv = readEnv(localEnvPath);
  const current = readEnv(deployEnvPath);
  let lines = readFileSync(deployEnvPath, "utf8").split("\n");
  const changed = [];

  function put(key, value, { overwrite = true, secret = false } = {}) {
    if (value === undefined || value === null || value === "") return;
    if (!overwrite && hasRealValue(current[key])) return;
    lines = setEnvValue(lines, key, value);
    current[key] = String(value);
    changed.push(secret ? `${key}=[set]` : `${key}=${value}`);
  }

  const copyIfUseful = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SIGNING_SECRET",
    "MANAGER_INTERNAL_TOKEN",
    "PROVISIONER_TOKEN",
    "ANTHROPIC_API_KEY",
    "HERMES_MODEL_PROVIDER",
    "HERMES_MODEL_DEFAULT",
    "HERMES_MODEL_BASE_URL",
    "HERMES_MODEL_API_KEY",
    "ORCHESTRATOR_PROVIDER",
    "ORCHESTRATOR_API_BASE_URL",
    "ORCHESTRATOR_API_KEY",
    "ORCHESTRATOR_MODEL",
    "RESEND_API_KEY",
    "PUBLIC_ESTIMATOR_FROM_EMAIL",
    "PUBLIC_ESTIMATOR_REPLY_TO",
    "PUBLIC_ESTIMATOR_SENDING_DOMAIN",
    "PUBLIC_ESTIMATOR_EMAIL_ENABLED",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ZONE_NAME",
  ];
  for (const key of copyIfUseful) {
    if (hasRealValue(localEnv[key]) && (!hasRealValue(current[key]) || args.has("--refresh-env"))) {
      put(key, localEnv[key], { overwrite: true, secret: /(TOKEN|KEY|SECRET|DATABASE_URL)/.test(key) });
    }
  }

  put("NODE_ENV", "production");
  put("MANAGER_API_ORIGIN", "http://manager:8080");
  put("PROVISIONER_ORIGIN", "http://manager:8080");
  put("DOCKER_MANAGER_API_ORIGIN", "http://manager:8080");
  put("DOCKER_MANAGER_BASE_URL", "http://manager:8080");
  put("CADDY_CLIENTS_DIR", "/var/lib/amtech/caddy/clients");
  put("CADDY_VALIDATE_COMMAND", "docker exec amtech-ai-employee-caddy-1 caddy validate --config /etc/caddy/Caddyfile");
  put("CADDY_RELOAD_COMMAND", "docker exec amtech-ai-employee-caddy-1 caddy reload --config /etc/caddy/Caddyfile");
  put("CLOUDFLARE_ZONE_NAME", "amtechai.com", { overwrite: !hasRealValue(current.CLOUDFLARE_ZONE_NAME) });
  put("AMTECH_PUBLIC_DOMAIN", "amtechai.com", { overwrite: !hasRealValue(current.AMTECH_PUBLIC_DOMAIN) });
  put("PUBLIC_WEB_ORIGIN", webOrigin);
  put("HERMES_DOCKER_NETWORK", "amtech_runtime");
  put("HERMES_BACKEND_TYPE", "docker");
  put("HERMES_RUNTIME_COMMAND", "/app/infra/scripts/deploy/start-hermes-container.sh");
  put("PUBLIC_ESTIMATOR_EMPLOYEE_ID", employeeId);
  put("PUBLIC_ESTIMATOR_ACCOUNT_ID", accountId);
  put("AMTECH_PROOF_DIR", proofDir);
  put("LOCAL_MODEL_BRIDGE", "", { overwrite: true });

  lines = lines.filter((line) => !line.startsWith("LOCAL_MODEL_BRIDGE="));
  writeFileSync(deployEnvPath, `${lines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
  return { changed, env: current };
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

function compose(argsList, options = {}) {
  return run(`compose:${argsList.join(" ")}`, "docker", ["compose", "-f", composeFile, "--env-file", "infra/deploy/.env.production", ...argsList], options);
}

async function httpCheck(name, url, attempts = 30) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    const started = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "manual" });
      last = { name, status: res.status < 500 ? "pass" : "fail", http_status: res.status, url, ms: Date.now() - started };
      if (last.status === "pass") return last;
    } catch (err) {
      last = { name, status: "fail", url, error: String(err?.message ?? err), ms: Date.now() - started };
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
  }
  return last ?? { name, status: "fail", url, error: "not_checked" };
}

function caddyTokenState(env) {
  const token = env.CLOUDFLARE_API_TOKEN;
  if (!hasRealValue(token)) return { name: "caddy_dns_token", status: "gated", reason: "CLOUDFLARE_API_TOKEN missing or placeholder" };
  return { name: "caddy_dns_token", status: "pass" };
}

function dockerNetwork() {
  const inspect = run("docker-network:inspect", "docker", ["network", "inspect", "amtech_runtime"]);
  if (inspect.status === "pass") return inspect;
  return run("docker-network:create", "docker", ["network", "create", "amtech_runtime"]);
}

function reprovision(env) {
  if (!reprovisionEmployee) {
    return { name: "employee_reprovision", status: "skip", reason: "Pass --reprovision-employee to rotate scoped MCP, render profile, activate Caddy, and restart Hermes." };
  }
  if (!hasRealValue(env.CLOUDFLARE_API_TOKEN)) {
    return { name: "employee_reprovision", status: "gated", reason: "CLOUDFLARE_API_TOKEN missing; production provisioner requires Caddy activation." };
  }
  return run("employee_reprovision", "node", ["infra/scripts/reprovision-scoped-mcp.mjs", employeeId], {
    env: {
      ...env,
      PROVISIONER_ORIGIN: managerHealthUrl,
      MANAGER_API_ORIGIN: managerHealthUrl,
      MANAGER_SMOKE_URL: managerHealthUrl,
      REPROVISIONER_ORIGIN: managerHealthUrl,
    },
  });
}

function writeProof(proof) {
  mkdirSync(join(root, proofDir), { recursive: true });
  const path = join(proofDir, `prod-like-public-estimator-up-${stamp()}.json`);
  writeFileSync(join(root, path), JSON.stringify(proof, null, 2));
  return path;
}

const checks = [];
const { changed, env } = writeMergedDeployEnv();
checks.push({ name: "deploy_env_prepared", status: "pass", path: "infra/deploy/.env.production", changed });
checks.push(caddyTokenState(env));

if (downFirst && !skipCompose) checks.push(compose(["down"], { stdio: "pipe" }));
if (!skipCompose) {
  checks.push(dockerNetwork());
  const upArgs = ["up", "-d"];
  if (!noBuild) upArgs.push("--build");
  checks.push(compose(upArgs, { stdio: "inherit" }));
  checks.push(await httpCheck("manager_health", `${managerHealthUrl.replace(/\/$/, "")}/health`));
  checks.push(await httpCheck("web_health", webHealthUrl));
  if (checks.find((check) => check.name === "caddy_dns_token")?.status === "gated") {
    checks.push(compose(["stop", "caddy"]));
  } else {
    checks.push(compose(["exec", "-T", "caddy", "caddy", "validate", "--config", "/etc/caddy/Caddyfile"]));
  }
  checks.push(reprovision(env));
}

const failed = checks.some((check) => check.status === "fail");
const gated = checks.some((check) => check.status === "gated");
const proof = {
  kind: "prod_like_public_estimator_up",
  status: failed ? "fail" : gated ? "partial" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  git_sha: gitSha(),
  employee_id: employeeId,
  account_id: accountId,
  compose_file: composeFile,
  notes: {
    caddy_missing_token_behavior: "When CLOUDFLARE_API_TOKEN is absent, Caddy is stopped after compose up to avoid a restart loop.",
    reprovision_behavior: "Employee reprovision is opt-in with --reprovision-employee because it activates Caddy, restarts Hermes, and may perform production provider side effects.",
    model_bridge: "LOCAL_MODEL_BRIDGE is removed from the deploy env; this path expects real provider env such as ANTHROPIC_API_KEY.",
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

if (failed || (requireCaddy && gated)) process.exit(1);
