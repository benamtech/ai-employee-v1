#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
const option = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] ?? fallback : fallback; };
const flag = (name) => process.argv.includes(name);
const agent = option("--agent", "claude");
const scenario = option("--scenario", "clothing-ops");
const port = Number(option("--port", "3000"));
const host = "127.0.0.1";
const variantDir = join(root, "apps", "web", "ui-variants", slug ?? "");
const children = [];

if (!slug || !/^[a-z][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) fail("Usage: node scripts/ui-variant-collaborator.mjs <variant-slug> [--agent claude|codex|cursor|none] [--scenario clothing-ops] [--install]");
if (flag("--install")) {
  run("npm", ["install"], root, "dependency installation");
  run("npm", ["run", "local:browser-install"], root, "browser installation");
}
if (!existsSync(join(root, "node_modules"))) fail(`Dependencies are missing. Run: cd ${root} && npm install`);
if (!existsSync(variantDir)) run(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "new", slug], root, "variant scaffold");
run(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "validate", slug], root, "variant validation");
run(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "generate"], root, "registry generation");

const env = { ...process.env, UI_LAB_PORT: String(port), UI_LAB_HOST: host };
children.push(spawnLogged("variant-watch", process.execPath, [join(root, "scripts", "ui-variant.mjs"), "watch"], root, env));
children.push(spawnLogged("ui-lab", process.execPath, [join(root, "scripts", "ui-lab-dev.mjs"), "--port", String(port), "--host", host], root, env));
const url = `http://${host}:${port}/ui-lab/variant/${slug}/${scenario}`;
await waitForUrl(url, 90_000);
openUrl(url);

const prompt = spawnSync(process.execPath, [join(root, "scripts", "ui-variant.mjs"), "prompt", slug], { cwd: root, encoding: "utf8" }).stdout.trim();
process.stdout.write(`\nAMTECH UI variant workspace ready.\n  Folder: ${variantDir}\n  Live URL: ${url}\n  Agent: ${agent}\n  Stop everything: Ctrl+C\n\n`);
if (agent !== "none") launchAgent(agent, prompt);
else process.stdout.write(`Start an agent inside the folder and paste:\n\n${prompt}\n`);

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => shutdown(signal));

function launchAgent(name, promptText) {
  const command = name === "cursor" ? "cursor-agent" : name;
  const check = spawnSync(command, ["--version"], { cwd: variantDir, encoding: "utf8" });
  if (check.error || check.status !== 0) {
    process.stderr.write(`\n${command} is not installed or not on PATH.\n`);
    if (name === "claude") process.stderr.write("Install: npm install -g @anthropic-ai/claude-code\n");
    else if (name === "codex") process.stderr.write("Install: npm install -g @openai/codex\n");
    else process.stderr.write("Install Cursor CLI, then run cursor-agent from the variant folder.\n");
    process.stderr.write(`Paste this prompt after launch:\n\n${promptText}\n`);
    return;
  }
  const child = spawn(command, [promptText], { cwd: variantDir, env: process.env, stdio: "inherit" });
  children.push(child);
  child.on("exit", () => process.stdout.write(`\n${command} exited. UI Lab remains available until Ctrl+C.\n`));
}

function run(command, args, cwd, label) {
  const result = spawnSync(command, args, { cwd, env: process.env, stdio: "inherit" });
  if (result.status !== 0) fail(`${label} failed with exit ${result.status}`);
}
function spawnLogged(label, command, args, cwd, env) {
  const child = spawn(command, args, { cwd, env, stdio: ["inherit", "pipe", "pipe"] });
  child.stdout.on("data", (chunk) => prefix(label, chunk, process.stdout));
  child.stderr.on("data", (chunk) => prefix(label, chunk, process.stderr));
  child.on("exit", (code) => { if (code && !shuttingDown) { process.stderr.write(`[${label}] exited ${code}\n`); shutdown("SIGTERM", 1); } });
  return child;
}
function prefix(label, chunk, stream) { for (const line of String(chunk).split(/(?<=\n)/)) if (line) stream.write(`[${label}] ${line}`); }
function waitForUrl(target, timeout) { const started=Date.now(); return new Promise((resolvePromise,reject)=>{ const attempt=()=>{ const request=http.get(target,(response)=>{response.resume(); if((response.statusCode??500)<500)resolvePromise(); else retry();}); request.on("error",retry); request.setTimeout(1500,()=>request.destroy());}; const retry=()=>Date.now()-started>timeout?reject(new Error(`UI Lab did not start: ${target}`)):setTimeout(attempt,300); attempt(); }); }
function openUrl(target) { const command=process.platform==="darwin"?"open":process.platform==="win32"?"cmd":"xdg-open"; const args=process.platform==="win32"?["/c","start","",target]:[target]; const child=spawn(command,args,{detached:true,stdio:"ignore"}); child.unref(); }
let shuttingDown=false;
function shutdown(signal="SIGTERM",code=0){ if(shuttingDown)return; shuttingDown=true; for(const child of children) if(!child.killed) child.kill(signal); if(code)process.exitCode=code; }
function fail(message){ throw new Error(message); }
