#!/usr/bin/env node
/**
 * Recreate / list employees for live testing.
 *
 *   node infra/scripts/local/test/reprovision.mjs list
 *       List every employee (id, name, business, container status, MCP-tools wired?).
 *
 *   node infra/scripts/local/test/reprovision.mjs from <sourceEmployeeId>
 *       Provision a FRESH employee (new id) reusing an existing employee's manifest
 *       + account. The freshly rendered profile picks up the current template, so it
 *       gets the Manager MCP tools (platform_toolsets.api_server + mcp_servers.amtech_
 *       manager) that older employees provisioned before that fix are missing.
 *
 * Requires the Manager up (:8080) and MANAGER_INTERNAL_TOKEN + DATABASE_URL in env
 * (run after `set -a && source .env && set +a`, or via `npm run live:*`). The new
 * employee's container is started by the provisioner, so keep bridge + worker up.
 */
import { Client } from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Self-load the gitignored .env so this works via `npm run` (which doesn't source
// it) as well as from an already-sourced shell. Existing env wins.
(function loadEnv() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
    for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env — rely on ambient env */ }
})();

const MANAGER = (process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");
const TOKEN = process.env.MANAGER_INTERNAL_TOKEN;
const [cmd, arg] = process.argv.slice(2);

function db() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  return c.connect().then(() => c);
}

async function containersByEmp() {
  // best-effort docker status without a docker lib: shell out.
  const { execSync } = await import("node:child_process");
  const map = {};
  try {
    const out = execSync('docker ps -a --filter "name=amtech-hermes-" --format "{{.Names}}\t{{.Status}}"', { encoding: "utf8" });
    for (const line of out.split("\n")) {
      const [name, status] = line.split("\t");
      if (name) map[name.replace("amtech-hermes-", "")] = status;
    }
  } catch { /* docker not available */ }
  return map;
}

async function list() {
  const c = await db();
  const rows = (await c.query(
    "select e.id, e.name, e.status, a.display_name as business from employees e left join accounts a on a.id=e.account_id order by e.created_at desc",
  )).rows;
  await c.end();
  const cmap = await containersByEmp();
  console.log(`EMPLOYEES (${rows.length}):`);
  for (const r of rows) {
    console.log(`  ${r.id}  name=${r.name}  business=${r.business ?? "?"}  status=${r.status}  container=${cmap[r.id] ?? "none"}`);
  }
  console.log("\nRecreate one with MCP tools:  node infra/scripts/local/test/reprovision.mjs from <id>");
}

async function fromSource(sourceId) {
  if (!TOKEN) throw new Error("MANAGER_INTERNAL_TOKEN not set (source .env first)");
  const c = await db();
  const emp = (await c.query("select account_id from employees where id=$1", [sourceId])).rows[0];
  if (!emp) { await c.end(); throw new Error(`employee ${sourceId} not found`); }
  const man = (await c.query(
    "select manifest, transcript_ref from employee_manifests where employee_id=$1 order by created_at desc limit 1",
    [sourceId],
  )).rows[0];
  await c.end();
  if (!man) throw new Error(`no manifest for ${sourceId}`);

  const idempotency_key = `reprovision:${sourceId}:${Date.now()}`;
  const body = { account_id: emp.account_id, manifest: man.manifest, idempotency_key, transcript_ref: man.transcript_ref ?? null };
  console.log(`provisioning a fresh employee from ${sourceId} (account ${emp.account_id})...`);
  const res = await fetch(`${MANAGER}/manager/tools/provision_employee`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const newId = json.employee_id ?? json?.proof?.employee_id;
  if (!res.ok || !newId) {
    console.error("PROVISION FAILED:", res.status, JSON.stringify(json).slice(0, 500));
    process.exit(1);
  }
  console.log(`NEW EMPLOYEE: ${newId}`);
  console.log(`  result=${json.result ?? "?"}  validation=${json?.proof?.validation_status ?? "?"}`);
  console.log(`  web route: /agent/${newId}`);
  console.log(`  LOG IN + OPEN:  http://localhost:3000/api/dev/login?employeeId=${newId}`);
  console.log(`  (verify tools wired + container up:  npm run live:status)`);
}

try {
  if (cmd === "list") await list();
  else if (cmd === "from" && arg) await fromSource(arg);
  else { console.error("usage: reprovision.mjs list | from <sourceEmployeeId>"); process.exit(1); }
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
