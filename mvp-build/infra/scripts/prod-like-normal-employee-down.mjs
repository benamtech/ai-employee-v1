#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const stopEmployees = process.argv.includes("--employees");

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
  run("cloudflare_tunnel_rm", "docker", ["rm", "-f", "amtech-cloudflared-agent"]),
  run("compose_down", "docker", [
    "compose",
    "-f",
    "infra/deploy/docker-compose.yml",
    "-f",
    "infra/deploy/docker-compose.tunnel.yml",
    "--env-file",
    "infra/deploy/.env.production",
    "down",
  ]),
];

if (stopEmployees) {
  const list = run("employee_container_list", "docker", ["ps", "-a", "--filter", "name=amtech-hermes-", "--format", "{{.Names}}"]);
  checks.push(list);
  for (const name of list.output.split("\n").map((line) => line.trim()).filter(Boolean)) {
    checks.push(run(`employee_rm:${name}`, "docker", ["rm", "-f", name]));
  }
}

const proof = {
  kind: "prod_like_normal_employee_down",
  status: checks.some((check) => check.status === "fail") ? "fail" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  stopped_employees: stopEmployees,
  checks,
};

mkdirSync(join(root, proofDir), { recursive: true });
const path = join(proofDir, `prod-like-normal-down-${stamp()}.json`);
writeFileSync(join(root, path), JSON.stringify(proof, null, 2));

for (const check of checks) {
  console.log(`${check.status === "pass" ? "PASS" : "FAIL"} ${check.name}${check.output ? ` ${check.output.split("\n")[0]}` : ""}`);
}
console.log(`proof_json:${path}`);
if (proof.status !== "pass") process.exit(1);
