import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";

export const ROOT = resolve(new URL("../..", import.meta.url).pathname);
export const REPORT_DIR = join(ROOT, "local-prod", "reports");

export function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function gitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

export function writeProof(kind, payload) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const proof = {
    schema_version: "local-prod-proof-v1",
    kind,
    checked_at: new Date().toISOString(),
    git_sha: gitSha(),
    ...payload,
  };
  const latest = join(REPORT_DIR, `${kind}.json`);
  const historical = join(REPORT_DIR, `${kind}-${stamp()}.json`);
  const text = `${JSON.stringify(proof, null, 2)}\n`;
  writeFileSync(latest, text, { mode: 0o600 });
  writeFileSync(historical, text, { mode: 0o600 });
  return { proof, latest, historical };
}

export function toSdrt(proof) {
  const lines = [
    "@S|audit_schema|v2|D0:criticality|D1:effort|D2:gate_number|D3:perf_baseline",
  ];
  for (const finding of proof.findings ?? []) {
    const id = finding.id ?? `finding_${lines.length}`;
    lines.push(`@E|${id}|type:gap|severity:${finding.severity}|vector:${finding.vector}|perf_impact:${finding.perf_impact}`);
    lines.push(`@R|blocks|src:${id}|dst:s9_readiness|severity:${finding.severity}`);
    lines.push(`@M|mitigates|src:${id}|dst:${finding.test_case_id}|mitigation:${String(finding.mitigation).replaceAll("|", "/")}`);
  }
  lines.push(`@C|s9_go_no_go|scope:decision|active:${proof.status ?? "unknown"}|projection:[D0,D1,D2,D3]`);
  return `${lines.join("\n")}\n`;
}

export function writeSdrt(kind, proof) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const path = join(REPORT_DIR, `${kind}.sdrt`);
  writeFileSync(path, toSdrt(proof), { mode: 0o600 });
  return path;
}

export function readJson(path, fallback = null) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

export function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const result = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    result[key] = value;
  }
  return result;
}

export function placeholder(value) {
  return !value || /^(change[-_ ]?me|replace[-_ ]?me|paste|todo)/i.test(String(value)) || /<[^>]+>/.test(String(value));
}

export function commandAvailable(command, args = ["--version"]) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: "utf8", timeout: 5000 });
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n")[0] ?? "" };
}

export function walk(dir, predicate = () => true) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "dist", "out", "coverage", "reports"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
}

export function directoryBytes(path) {
  if (!existsSync(path)) return 0;
  const stat = statSync(path);
  if (stat.isFile()) return stat.size;
  return readdirSync(path).reduce((sum, name) => sum + directoryBytes(join(path, name)), 0);
}

export function displayPath(path) {
  return relative(ROOT, path) || ".";
}

export async function runMeasured({ label, command, args, budgetSeconds, maxRssMb, env = {}, cwd = ROOT, stdio = "inherit" }) {
  const started = Date.now();
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio,
    detached: false,
  });
  let peakRssKb = 0;
  const sample = setInterval(() => {
    const ps = spawnSync("ps", ["-eo", "pid=,ppid=,rss="], { encoding: "utf8" });
    if (ps.status !== 0) return;
    const rows = ps.stdout.trim().split(/\n/).flatMap((line) => {
      const [pid, ppid, rss] = line.trim().split(/\s+/).map(Number);
      return Number.isFinite(pid) ? [{ pid, ppid, rss }] : [];
    });
    const descendants = new Set([child.pid]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const row of rows) if (descendants.has(row.ppid) && !descendants.has(row.pid)) { descendants.add(row.pid); changed = true; }
    }
    const rss = rows.filter((row) => descendants.has(row.pid)).reduce((sum, row) => sum + (row.rss || 0), 0);
    peakRssKb = Math.max(peakRssKb, rss);
  }, 100);
  const exitCode = await new Promise((resolveExit) => {
    child.on("exit", (code, signal) => resolveExit(code ?? (signal ? 128 : 1)));
    child.on("error", () => resolveExit(127));
  });
  clearInterval(sample);
  const elapsedMs = Date.now() - started;
  const performance = {
    elapsed_ms: elapsedMs,
    peak_rss_mb: Math.round((peakRssKb / 1024) * 10) / 10,
    budget_seconds: budgetSeconds,
    max_rss_mb: maxRssMb,
  };
  const budgetPass = elapsedMs <= budgetSeconds * 1000 && performance.peak_rss_mb <= maxRssMb;
  const result = {
    label,
    command: [command, ...args].join(" "),
    exit_code: exitCode,
    status: exitCode === 0 && budgetPass ? "pass" : "fail",
    budget_pass: budgetPass,
    performance,
  };
  writeProof(label, result);
  if (exitCode !== 0 || !budgetPass) process.exitCode = exitCode || 1;
  return result;
}

export function ensureDirectory(path) {
  mkdirSync(dirname(path), { recursive: true });
}
