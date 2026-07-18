#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node scripts/local-prod/build-runner.mjs\nInternal runner: npm workspace build followed by exact-SHA production compose image build.");
  process.exit(0);
}
const sha = process.env.AMTECH_GIT_SHA;
if (!sha) throw new Error("AMTECH_GIT_SHA required");
function run(command, args, cwd = ROOT) {
  const result = spawnSync(command, args, { cwd, env: process.env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("npm", ["--prefix", "mvp-build", "run", "build"]);
run("docker", [
  "compose",
  "-f", "infra/deploy/docker-compose.yml",
  "--env-file", "infra/deploy/.env.production",
  "build",
  "--parallel",
], join(ROOT, "mvp-build"));
