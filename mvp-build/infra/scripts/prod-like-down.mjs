#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const composeFile = process.env.COMPOSE_FILE ?? "infra/deploy/docker-compose.yml";
const envFile = process.env.COMPOSE_ENV_FILE ?? "infra/deploy/.env.production";
const stopEmployee = process.argv.includes("--employee");
const employeeId = process.env.PUBLIC_ESTIMATOR_EMPLOYEE_ID ?? "emp_5omv4ihbvggc8ibe31nj43";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(name, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  return {
    name,
    status: result.status === 0 ? "pass" : "fail",
    command: `${command} ${args.join(" ")}`,
    exit_code: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().slice(0, 4000),
  };
}

const checks = [
  run("compose_down", "docker", ["compose", "-f", composeFile, "--env-file", envFile, "down"]),
];

if (stopEmployee) {
  checks.push(run("employee_runtime_stop", "docker", ["rm", "-f", `amtech-hermes-${employeeId}`]));
}

const proof = {
  kind: "prod_like_down",
  status: checks.some((check) => check.status === "fail") ? "fail" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  compose_file: composeFile,
  env_file: envFile,
  employee_id: stopEmployee ? employeeId : undefined,
  checks,
};

mkdirSync(join(root, proofDir), { recursive: true });
const path = join(proofDir, `prod-like-down-${stamp()}.json`);
writeFileSync(join(root, path), JSON.stringify(proof, null, 2));

for (const check of checks) {
  console.log(`${check.status === "pass" ? "PASS" : "FAIL"} ${check.name}${check.output ? ` ${check.output.split("\n")[0]}` : ""}`);
}
console.log(`proof_json:${path}`);
if (proof.status !== "pass") process.exit(1);
