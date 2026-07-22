#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants as fsConstants } from "node:fs";
import http from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const valueAfter = (flag, fallback) => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
};
const port = Number(valueAfter("--port", process.env.UI_LAB_PORT ?? "3000"));
const host = valueAfter("--host", process.env.UI_LAB_HOST ?? "127.0.0.1");
const shouldOpen = args.has("--open");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const tscBin = join(root, "node_modules", "typescript", "bin", "tsc");
const children = [];

if (args.has("--doctor")) {
  runDoctor();
  runChecked(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "doctor"], "UI variant doctor");
  process.exit(0);
}

runDoctor();
runChecked("npm", ["run", "build", "--workspace", "@amtech/shared"], "shared contract build");
runChecked(process.execPath, [join(root, "scripts", "ui-lab-registry.mjs"), "validate"], "UI Lab registry validation");
runChecked(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "doctor"], "UI variant doctor");

const env = {
  ...process.env,
  NODE_ENV: "development",
  NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1",
  AMTECH_UI_LAB_WRITE: "1",
  AMTECH_ENVIRONMENT_NAME: "ui-lab-local",
  AMTECH_PRODUCTION_LIKE: "0",
  AMTECH_MVP_BUILD_ROOT: root,
};

children.push(spawnLogged("variant-watch", process.execPath, [join(root, "scripts", "ui-variant.mjs"), "watch"], env));
children.push(spawnLogged("shared-watch", process.execPath, [tscBin, "-p", join(root, "packages", "shared", "tsconfig.json"), "--watch", "--preserveWatchOutput"], env));
children.push(spawnLogged("web-types", process.execPath, [tscBin, "-p", join(root, "apps", "web", "tsconfig.json"), "--noEmit", "--watch", "--preserveWatchOutput"], env));
children.push(spawnLogged("next", process.execPath, [nextBin, "dev", join(root, "apps", "web"), "-p", String(port), "-H", host, "--turbopack"], env));

const url = `http://${host}:${port}/ui-lab`;
await waitForUrl(url, 60_000);
process.stdout.write(`\nUI Lab is ready.\n  Workbench: ${url}\n  Variant gallery: http://${host}:${port}/ui-lab/variants\n  Direct variant example: http://${host}:${port}/ui-lab/variant/radical-canvas/clothing-ops\n  Repository writes: enabled only for this loopback development process\n  Stop: Ctrl+C\n\n`);
if (shouldOpen) openUrl(url);

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => shutdown(signal));
}
process.on("exit", () => shutdown());

function runDoctor() {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isInteger(major) || major < 20) throw new Error(`ui_lab_requires_node_20_or_newer:actual_${process.versions.node}`);
  for (const path of [nextBin, tscBin, join(root, "apps", "web", "package.json"), join(root, "ui-lab", "assignments.json"), join(root, "scripts", "ui-variant.mjs"), join(root, "apps", "web", "ui-variants", "contract.ts")]) {
    try {
      accessSync(path, fsConstants.R_OK);
    } catch {
      throw new Error(`ui_lab_required_path_missing:${path}:run_npm_install_from_${root}`);
    }
  }
  const git = spawnSync("git", ["--version"], { cwd: root, encoding: "utf8" });
  if (git.status !== 0) throw new Error("ui_lab_git_required");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`ui_lab_invalid_port:${port}`);
  if (!new Set(["127.0.0.1", "localhost", "::1"]).has(host)) {
    throw new Error(`ui_lab_write_harness_requires_loopback_host:${host}`);
  }
  process.stdout.write(`UI Lab doctor PASS: node=${process.versions.node} host=${host} port=${port}\n`);
}

function runChecked(command, commandArgs, label) {
  const result = spawnSync(command, commandArgs, { cwd: root, env: process.env, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`ui_lab_startup_failed:${label}:exit_${result.status}`);
}

function spawnLogged(label, command, commandArgs, childEnv) {
  const child = spawn(command, commandArgs, {
    cwd: root,
    env: childEnv,
    stdio: ["inherit", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => prefix(label, chunk, process.stdout));
  child.stderr.on("data", (chunk) => prefix(label, chunk, process.stderr));
  child.on("exit", (code, signal) => {
    if (code && !shuttingDown) {
      process.stderr.write(`[${label}] exited code=${code} signal=${signal ?? "none"}\n`);
      shutdown("SIGTERM", 1);
    }
  });
  return child;
}

function prefix(label, chunk, stream) {
  const text = String(chunk);
  for (const line of text.split(/(?<=\n)/)) {
    if (line) stream.write(`[${label}] ${line}`);
  }
}

function waitForUrl(target, timeoutMs) {
  const started = Date.now();
  return new Promise((resolvePromise, reject) => {
    const attempt = () => {
      const request = http.get(target, (response) => {
        response.resume();
        if ((response.statusCode ?? 500) < 500) resolvePromise();
        else retry();
      });
      request.on("error", retry);
      request.setTimeout(1500, () => request.destroy());
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) reject(new Error(`ui_lab_server_start_timeout:${target}`));
      else setTimeout(attempt, 250);
    };
    attempt();
  });
}

function openUrl(target) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const commandArgs = process.platform === "win32" ? ["/c", "start", "", target] : [target];
  const child = spawn(command, commandArgs, { detached: true, stdio: "ignore" });
  child.unref();
}

let shuttingDown = false;
function shutdown(signal = "SIGTERM", exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  if (exitCode) process.exitCode = exitCode;
}
