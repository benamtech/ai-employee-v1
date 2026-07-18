#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { ROOT, commandAvailable, parseEnvFile, placeholder, writeProof, writeSdrt } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm preflight [--deploy] [--strict]\nChecks tools, lock authority, environment, images, hardware, and production topology without building or starting services.");
  process.exit(0);
}

const strict = process.argv.includes("--strict");
const deploy = process.argv.includes("--deploy");
const findings = [];
const checks = [];
const add = (id, ok, detail, severity = "high", vector = "configuration", mitigation = "Resolve the failed preflight check.", perfImpact = "none") => {
  checks.push({ id, status: ok ? "pass" : "fail", detail });
  if (!ok) findings.push({ id, severity, vector, mitigation, test_case_id: `LP-${id.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-")}`, perf_impact: perfImpact });
};

const nodeMajor = Number(process.versions.node.split(".")[0]);
add("node_22", nodeMajor >= 22, `node ${process.versions.node}`, "critical", "runtime_drift", "Install Node 22+ using mise.", "all scripts");
for (const [name, args] of [["npm", ["--version"]], ["pnpm", ["--version"]], ["python3", ["--version"]], ["git", ["--version"]], ["docker", ["--version"]], ["curl", ["--version"]]]) {
  const result = commandAvailable(name, args);
  add(`tool_${name}`, result.ok, result.output || `${name} unavailable`, name === "docker" && !deploy ? "medium" : "high", "toolchain", `Install ${name} and ensure it is on PATH.`, name === "docker" ? "local integration/deploy" : "all scripts");
}

add("root_package", existsSync(join(ROOT, "package.json")), "root pnpm orchestration exists", "critical", "entrypoint_drift", "Restore root package.json.", "all scripts");
add("npm_lock_authority", existsSync(join(ROOT, "mvp-build", "package-lock.json")), "mvp-build/package-lock.json is canonical", "critical", "supply_chain", "Use npm ci inside mvp-build; do not generate a second application lock.", "dependency install");
add("no_pnpm_app_lock", !existsSync(join(ROOT, "mvp-build", "pnpm-lock.yaml")), "mvp-build has no competing pnpm lock", "critical", "supply_chain", "Remove competing mvp-build pnpm lock and retain package-lock.json.", "dependency install");
add("compose", existsSync(join(ROOT, "mvp-build", "infra", "deploy", "docker-compose.yml")), "production compose present", "critical", "topology", "Restore production compose.", "local deploy");
add("env_example", existsSync(join(ROOT, ".env.example")), "root .env.example present", "high", "configuration", "Restore documented environment template.", "operator setup");

const env = { ...parseEnvFile(join(ROOT, ".env")), ...process.env };
const required = [
  "DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MANAGER_INTERNAL_TOKEN",
  "SIGNING_SECRET", "SECRET_REF_MASTER_KEY", "MODEL_GATEWAY_SIGNING_SECRET",
  "MODEL_GATEWAY_PROVIDER_API_KEY", "MODEL_GATEWAY_UPSTREAM_BASE_URL",
  "PROVISIONER_TOKEN", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID",
];
for (const key of required) add(`env_${key.toLowerCase()}`, !placeholder(env[key]), `${key} ${placeholder(env[key]) ? "missing/placeholder" : "set"}`, "critical", "secret_or_config", `Set ${key} from a secret store or local .env; never commit the value.`, "runtime/deploy");

const cores = cpus().length;
const memoryGb = Math.round(totalmem() / 1024 / 1024 / 1024 * 10) / 10;
add("hardware_cpu", cores >= 8, `${cores} logical CPUs; production target >=8`, "medium", "capacity", "Use a host with >=8 logical CPUs or record an explicit reduced-capacity profile.", "parallel build/test/runtime");
add("hardware_memory", memoryGb >= 16, `${memoryGb} GB RAM; local minimum 16 GB, target 64 GB`, "medium", "capacity", "Use >=16 GB RAM; 64 GB is the fleet target.", "build/runtime fleet");

if (deploy) {
  const images = ["amtech-manager", "amtech-web", "hermes-agent"];
  for (const image of images) {
    const result = commandAvailable("docker", ["image", "inspect", image]);
    add(`image_${image}`, result.ok, result.ok ? `${image} present` : `${image} absent; building is intentionally not automatic`, "critical", "artifact_freshness", `Run pnpm build on this exact SHA before pnpm dev.`, "cold start");
  }
  add("production_env", existsSync(join(ROOT, "mvp-build", "infra", "deploy", ".env.production")), "mvp-build/infra/deploy/.env.production present", "critical", "deployment_config", "Generate and review .env.production without printing secrets.", "local deploy");
}

const status = findings.some((f) => f.severity === "critical") || (strict && findings.length) ? "blocked" : findings.length ? "needs_review" : "pass";
const { proof, latest } = writeProof("preflight", { status, mode: deploy ? "deploy" : "source", checks, findings });
const sdrt = writeSdrt("preflight", proof);
for (const check of checks) console.log(`${check.status === "pass" ? "PASS" : "FAIL"} ${check.id} ${check.detail}`);
console.log(`proof_json:${latest}`);
console.log(`proof_sdrt:${sdrt}`);
if (status === "blocked" || (strict && status !== "pass")) process.exit(1);
