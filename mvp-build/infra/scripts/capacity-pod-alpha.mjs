#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { Client } from "pg";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname, loadavg, totalmem, freemem, cpus } from "node:os";

(function loadEnv() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // rely on ambient env
  }
})();

const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const tiers = (process.env.POD_ALPHA_TIERS ?? "5,10,20,30")
  .split(",")
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);
const allowStart = process.env.CAPACITY_ALLOW_START === "1";
const network = process.env.HERMES_DOCKER_NETWORK ?? "amtech_runtime";
const managerUrl = (process.env.MANAGER_SMOKE_URL ?? process.env.MANAGER_API_ORIGIN ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const caddyUrl = (process.env.CADDY_SMOKE_URL ?? "http://127.0.0.1").replace(/\/$/, "");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(cmd, args, opts = {}) {
  const started = Date.now();
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  return { code: res.status, stdout: String(res.stdout ?? ""), stderr: String(res.stderr ?? ""), ms: Date.now() - started };
}

async function db() {
  if (!process.env.DATABASE_URL) return null;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

async function employees(client) {
  if (!client) return [];
  const sql = `
    select
      e.id,
      e.account_id,
      e.name,
      epb.generated_path,
      re.gateway_port
    from employees e
    left join lateral (
      select * from employee_profile_builds b
      where b.employee_id = e.id and b.generated_path is not null
      order by b.created_at desc
      limit 1
    ) epb on true
    left join lateral (
      select * from runtime_endpoints r
      where r.employee_id = e.id
      order by r.created_at desc
      limit 1
    ) re on true
    where e.status in ('live','provisioning','suspended')
    order by e.created_at asc
  `;
  return (await client.query(sql)).rows;
}

function containerName(employeeId) {
  return `amtech-hermes-${employeeId}`;
}

function dockerInspect(name) {
  const res = run("docker", ["inspect", name]);
  if (res.code !== 0) return null;
  return JSON.parse(res.stdout)[0] ?? null;
}

function dockerStats(name) {
  const res = run("docker", ["stats", "--no-stream", "--format", "{{json .}}", name]);
  if (res.code !== 0 || !res.stdout.trim()) return null;
  try {
    return JSON.parse(res.stdout.trim().split("\n")[0]);
  } catch {
    return null;
  }
}

function fdCount(pid) {
  if (!pid || !existsSync(`/proc/${pid}/fd`)) return null;
  return run("bash", ["-lc", `ls /proc/${pid}/fd | wc -l`]).stdout.trim();
}

function pssKb(pid) {
  if (!pid || !existsSync(`/proc/${pid}/smaps_rollup`)) return null;
  const text = readFileSync(`/proc/${pid}/smaps_rollup`, "utf8");
  const line = text.split("\n").find((l) => l.startsWith("Pss:"));
  return line ? Number(line.replace(/\D+/g, "")) : null;
}

function logBytes(id) {
  if (!id) return null;
  const res = run("docker", ["inspect", id, "--format", "{{.LogPath}}"]);
  const path = res.stdout.trim();
  if (res.code !== 0 || !path || !existsSync(path)) return null;
  return statSync(path).size;
}

function startEmployee(row) {
  if (!row.generated_path) return { status: "skip", reason: "generated_path_missing" };
  if (!allowStart) return { status: "skip", reason: "CAPACITY_ALLOW_START not set" };
  const command = process.env.HERMES_RUNTIME_COMMAND;
  if (!command) return { status: "fail", reason: "HERMES_RUNTIME_COMMAND missing" };
  const res = run("bash", ["-lc", `${command} ${row.generated_path}`]);
  return { status: res.code === 0 ? "pass" : "fail", ms: res.ms, output: `${res.stdout}${res.stderr}`.trim().slice(0, 1000) };
}

async function httpLatency(name, url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return { name, status: res.ok || res.status < 500 ? "pass" : "fail", http_status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { name, status: "fail", error: String(err?.message ?? err), ms: Date.now() - started };
  }
}

function dockerDns(alias) {
  const res = run("docker", ["run", "--rm", "--network", network, "busybox:1.36", "getent", "hosts", alias]);
  return { status: res.code === 0 ? "pass" : "fail", ms: res.ms, output: `${res.stdout}${res.stderr}`.trim().slice(0, 1000) };
}

function collect(row) {
  const name = containerName(row.id);
  const inspect = dockerInspect(name);
  const stats = dockerStats(name);
  const pid = inspect?.State?.Pid ?? null;
  return {
    employee_id: row.id,
    container: name,
    container_id: inspect?.Id?.slice(0, 12) ?? null,
    running: inspect?.State?.Running ?? false,
    restart_count: inspect?.RestartCount ?? null,
    pid,
    fd_count: fdCount(pid),
    pss_kb: pssKb(pid),
    docker_stats: stats,
    log_bytes: logBytes(inspect?.Id),
    dns: dockerDns(name),
  };
}

function percentile(values, p) {
  const nums = values.map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const idx = Math.min(nums.length - 1, Math.ceil((p / 100) * nums.length) - 1);
  return nums[idx];
}

function summarize(samples) {
  return {
    count: samples.length,
    running: samples.filter((s) => s.running).length,
    p95_pss_kb: percentile(samples.map((s) => s.pss_kb), 95),
    p99_pss_kb: percentile(samples.map((s) => s.pss_kb), 99),
    p95_fd_count: percentile(samples.map((s) => s.fd_count), 95),
    p99_fd_count: percentile(samples.map((s) => s.fd_count), 99),
    p95_log_bytes: percentile(samples.map((s) => s.log_bytes), 95),
    p99_log_bytes: percentile(samples.map((s) => s.log_bytes), 99),
    dns_failures: samples.filter((s) => s.dns.status !== "pass").length,
  };
}

const proof = {
  kind: "pod_alpha_capacity",
  status: "not_run",
  checked_at: new Date().toISOString(),
  host: hostname(),
  host_resources: {
    cpu_count: cpus().length,
    total_mem_bytes: totalmem(),
    free_mem_bytes: freemem(),
    loadavg: loadavg(),
  },
  allow_start: allowStart,
  tiers,
  manager_latency: await httpLatency("manager-health", `${managerUrl}/health`),
  caddy_latency: await httpLatency("caddy", caddyUrl),
  tiers_run: [],
  cap_recommendation: null,
  caveat: "Capacity is only valid up to the largest clean tier on this host; do not extrapolate 30-50 employees without clean p95/p99 evidence.",
};

try {
  const client = await db();
  const rows = await employees(client);
  if (client) await client.end();
  if (!rows.length) throw new Error("no_employee_profiles_found");

  for (const tier of tiers) {
    if (rows.length < tier) {
      proof.tiers_run.push({ tier, status: "skip", reason: `only_${rows.length}_employees_available` });
      break;
    }
    const selected = rows.slice(0, tier);
    const starts = selected.map(startEmployee);
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.CAPACITY_SETTLE_MS ?? 5000)));
    const samples = selected.map(collect);
    const summary = summarize(samples);
    const clean = summary.running === tier && summary.dns_failures === 0;
    proof.tiers_run.push({ tier, status: clean ? "pass" : "fail", starts, summary, samples });
    if (!clean) break;
  }

  const cleanTiers = proof.tiers_run.filter((t) => t.status === "pass");
  const largest = cleanTiers.at(-1);
  proof.status = cleanTiers.length ? "pass" : "fail";
  proof.cap_recommendation = largest
    ? { max_clean_tier: largest.tier, recommended_cap: Math.max(1, Math.floor(largest.tier * 0.8)), basis: "80_percent_of_largest_clean_tier_until_longer_soak_exists" }
    : null;
} catch (err) {
  proof.status = "fail";
  proof.error = String(err?.message ?? err);
}

mkdirSync(proofDir, { recursive: true });
const path = join(proofDir, `pod-alpha-capacity-${stamp()}.json`);
writeFileSync(path, JSON.stringify(proof, null, 2));
console.log(`${proof.status === "pass" ? "PASS" : "FAIL"} pod-alpha-capacity tiers:${proof.tiers_run.length}`);
console.log(`proof_json:${path}`);
if (proof.status !== "pass") process.exit(1);
