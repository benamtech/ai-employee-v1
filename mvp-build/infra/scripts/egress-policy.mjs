#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const apply = process.argv.includes("--apply") || process.env.AMTECH_EGRESS_APPLY === "1";
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const network = process.env.HERMES_DOCKER_NETWORK ?? "amtech_runtime";
const managerHost = process.env.EGRESS_MANAGER_HOST ?? "manager";
const managerPort = process.env.EGRESS_MANAGER_PORT ?? "8080";
const allowCidrs = (process.env.EGRESS_ALLOW_CIDRS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: "utf8" });
  return { code: res.status, output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim() };
}

function dockerJson(args) {
  const res = run("docker", args);
  if (res.code !== 0) throw new Error(res.output || `docker ${args.join(" ")} failed`);
  return JSON.parse(res.output);
}

function employeeContainers() {
  const res = run("docker", [
    "ps",
    "--filter", "label=com.amtech.kind=employee-runtime",
    "--format", "{{.ID}}\t{{.Names}}",
  ]);
  if (res.code !== 0) throw new Error(res.output);
  return res.output.split("\n").map((line) => {
    const [id, name] = line.split("\t");
    return id && name ? { id, name } : null;
  }).filter(Boolean);
}

function ipFor(containerName) {
  const data = dockerJson(["inspect", containerName]);
  return data?.[0]?.NetworkSettings?.Networks?.[network]?.IPAddress ?? null;
}

function managerIp() {
  const res = run("docker", ["compose", "-f", process.env.COMPOSE_FILE ?? "infra/deploy/docker-compose.yml", "ps", "-q", "manager"]);
  const id = res.output.split("\n")[0]?.trim();
  if (res.code === 0 && id) {
    const data = dockerJson(["inspect", id]);
    const ip = data?.[0]?.NetworkSettings?.Networks?.[network]?.IPAddress;
    if (ip) return ip;
  }
  const byName = run("docker", ["inspect", managerHost]);
  if (byName.code === 0) {
    const data = JSON.parse(byName.output);
    return data?.[0]?.NetworkSettings?.Networks?.[network]?.IPAddress ?? null;
  }
  return null;
}

function rulesFor(sourceIp, destManagerIp) {
  const base = [
    ["-I", "DOCKER-USER", "1", "-s", sourceIp, "-m", "conntrack", "--ctstate", "ESTABLISHED,RELATED", "-j", "ACCEPT"],
    ["-I", "DOCKER-USER", "2", "-s", sourceIp, "-d", destManagerIp, "-p", "tcp", "--dport", managerPort, "-j", "ACCEPT"],
    ["-I", "DOCKER-USER", "3", "-s", sourceIp, "-d", "169.254.169.254/32", "-j", "DROP"],
    ["-I", "DOCKER-USER", "4", "-s", sourceIp, "-d", "127.0.0.0/8", "-j", "DROP"],
    ["-I", "DOCKER-USER", "5", "-s", sourceIp, "-d", "10.0.0.0/8", "-j", "DROP"],
    ["-I", "DOCKER-USER", "6", "-s", sourceIp, "-d", "172.16.0.0/12", "-j", "DROP"],
    ["-I", "DOCKER-USER", "7", "-s", sourceIp, "-d", "192.168.0.0/16", "-j", "DROP"],
  ];
  let index = 8;
  for (const cidr of allowCidrs) {
    base.push(["-I", "DOCKER-USER", String(index++), "-s", sourceIp, "-d", cidr, "-j", "ACCEPT"]);
  }
  base.push(["-I", "DOCKER-USER", String(index), "-s", sourceIp, "-j", "DROP"]);
  return base;
}

try {
  const manager = managerIp();
  if (!manager) throw new Error("manager_container_ip_not_found");
  const employees = employeeContainers().map((c) => ({ ...c, ip: ipFor(c.name) })).filter((c) => c.ip);
  const commands = [];
  const applied = [];
  for (const employee of employees) {
    for (const args of rulesFor(employee.ip, manager)) {
      commands.push(["iptables", ...args]);
      if (apply) {
        const res = run("iptables", args);
        applied.push({ employee: employee.name, args, status: res.code === 0 ? "ok" : "failed", output: res.output });
        if (res.code !== 0) throw new Error(`iptables_failed:${res.output}`);
      }
    }
  }

  const proof = {
    kind: "egress_policy",
    status: apply ? "pass" : "dry_run",
    checked_at: new Date().toISOString(),
    host: hostname(),
    network,
    manager_ip: manager,
    manager_port: managerPort,
    allow_cidrs: allowCidrs,
    employee_count: employees.length,
    employees,
    commands: commands.map((cmd) => cmd.join(" ")),
    applied,
    warning: "Domain allowlisting for provider APIs still requires a proxy or resolved CIDR maintenance; this first pass blocks arbitrary employee egress at DOCKER-USER.",
  };
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `egress-policy-${stamp()}.json`);
  writeFileSync(path, JSON.stringify(proof, null, 2));
  console.log(`${apply ? "PASS" : "DRY RUN"} egress-policy employees:${employees.length}`);
  console.log(`proof_json:${path}`);
} catch (err) {
  const proof = {
    kind: "egress_policy",
    status: "fail",
    checked_at: new Date().toISOString(),
    host: hostname(),
    error: String(err?.message ?? err),
  };
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `egress-policy-${stamp()}.json`);
  writeFileSync(path, JSON.stringify(proof, null, 2));
  console.error(`FAIL egress-policy ${proof.error}`);
  console.log(`proof_json:${path}`);
  process.exit(1);
}
