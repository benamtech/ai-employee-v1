#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

if (process.argv.includes("--help") || process.argv.includes("-h") || process.argv.length < 3) {
  console.log("Usage: node infra/scripts/with-git-sha.mjs <node-script> [args...]\nRuns an existing operator script with AMTECH_GIT_SHA bound to the exact clean repository HEAD.");
  process.exit(process.argv.length < 3 ? 2 : 0);
}

const cwd = process.cwd();
const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8", timeout: 5000 });
if (revision.status !== 0 || !/^[a-f0-9]{40}$/.test(revision.stdout.trim())) {
  console.error("exact Git HEAD is required");
  process.exit(1);
}
const status = spawnSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd, encoding: "utf8", timeout: 5000 });
if (status.status !== 0 || status.stdout.trim()) {
  console.error("tracked working tree must be clean before an exact-SHA deploy operator runs");
  process.exit(1);
}

const [script, ...args] = process.argv.slice(2);
const child = spawnSync(process.execPath, [resolve(cwd, script), ...args], {
  cwd,
  env: { ...process.env, AMTECH_GIT_SHA: revision.stdout.trim() },
  stdio: "inherit",
});
process.exit(child.status ?? 1);
