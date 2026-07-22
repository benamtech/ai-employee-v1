#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { accessSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const slug = normalize(args.find((item) => !item.startsWith("--")) ?? "");
const agent = valueAfter("--agent", "none");
const scenario = valueAfter("--scenario", "clothing-ops");
const port = Number(valueAfter("--port", process.env.UI_LAB_PORT ?? "3000"));
const create = args.includes("--new");
const noOpen = args.includes("--no-open");

if (!slug) throw new Error("usage:node scripts/ui-collab.mjs <variant-slug> [--new] [--agent claude|codex|cursor|none] [--scenario clothing-ops]");
if (create) runChecked(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "new", slug]);
runChecked(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "validate", slug]);
runChecked(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "generate"]);

const variantDir = join(root, "apps", "web", "ui-variants", slug);
accessSync(join(variantDir, "variant.json"));
const url = `http://127.0.0.1:${port}/ui-lab/variants/${slug}/${scenario}`;
const lab = spawn(process.execPath, [join(root, "scripts", "ui-lab-dev.mjs"), "--port", String(port)], { cwd: root, stdio: "inherit", env: process.env });
await waitForUrl(url, 90_000);
console.log(`\nAMTECH UI collaborator session ready\n  Variant folder: ${variantDir}\n  Workbench: ${url}\n  Agent: ${agent}\n`);
if (!noOpen) openUrl(url);
if (agent !== "none") {
  const command = agent === "cursor" ? "cursor-agent" : agent;
  const prompt = spawnSync(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "prompt", slug], { cwd: root, encoding: "utf8" }).stdout.trim();
  console.log(`Starting ${command} inside the variant folder. Initial prompt:\n\n${prompt}\n`);
  const child = spawn(command, [prompt], { cwd: variantDir, stdio: "inherit", env: { ...process.env, AMTECH_UI_VARIANT: slug, AMTECH_UI_LAB_URL: url } });
  child.on("exit", (code) => { if (code) process.exitCode = code; });
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => { lab.kill(signal); process.exit(); });
await new Promise((resolvePromise) => lab.on("exit", resolvePromise));

function valueAfter(flag, fallback) { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] ?? fallback : fallback; }
function normalize(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function runChecked(command, commandArgs) { const result = spawnSync(command, commandArgs, { cwd: root, stdio: "inherit", env: process.env }); if (result.status !== 0) throw new Error(`ui_collab_command_failed:${commandArgs.join(" ")}`); }
function waitForUrl(target, timeoutMs) { const started = Date.now(); return new Promise((resolvePromise, reject) => { const attempt = () => { const request = http.get(target, (response) => { response.resume(); if ((response.statusCode ?? 500) < 500) resolvePromise(); else retry(); }); request.on("error", retry); request.setTimeout(1500, () => request.destroy()); }; const retry = () => Date.now() - started > timeoutMs ? reject(new Error(`ui_collab_timeout:${target}`)) : setTimeout(attempt, 300); attempt(); }); }
function openUrl(target) { const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open"; const commandArgs = process.platform === "win32" ? ["/c", "start", "", target] : [target]; const child = spawn(command, commandArgs, { detached: true, stdio: "ignore" }); child.unref(); }
