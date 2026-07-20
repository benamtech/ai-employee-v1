#!/usr/bin/env node
import { spawn } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node scripts/local-prod/test-runner.mjs\nRuns the full unit/source suite and blank-PostgreSQL integration suite in parallel. Unit tests are denied external network access; integration tests may use loopback only.");
  process.exit(0);
}

const offlineGuard = pathToFileURL(join(ROOT, "scripts", "local-prod", "offline-guard.mjs")).href;
const jobs = [
  {
    name: "unit",
    command: "npm",
    args: ["--prefix", "mvp-build", "run", "test:unit"],
    env: { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --import=${offlineGuard}`.trim(), LOCAL_PROD_OFFLINE: "1" },
  },
  {
    name: "postgres",
    command: process.execPath,
    args: [join(ROOT, "scripts", "local-prod", "postgres-test.mjs")],
    env: { LOCAL_PROD_OFFLINE: "1", LOCAL_PROD_ALLOW_LOOPBACK: "1" },
  },
];
const children = new Map();
let failed = false;
for (const job of jobs) {
  const child = spawn(job.command, job.args, {
    cwd: ROOT,
    env: { ...process.env, ...job.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.set(job.name, child);
  child.stdout.on("data", (chunk) => process.stdout.write(`[${job.name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${job.name}] ${chunk}`));
}
const results = await Promise.all([...children.entries()].map(([name, child]) => new Promise((resolve) => {
  child.on("exit", (code, signal) => resolve({ name, code: code ?? (signal ? 128 : 1) }));
  child.on("error", () => resolve({ name, code: 127 }));
})));
for (const result of results) if (result.code !== 0) failed = true;
if (failed) {
  console.error(JSON.stringify({ status: "fail", results }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "pass", results }, null, 2));
