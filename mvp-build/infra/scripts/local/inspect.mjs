#!/usr/bin/env node
/**
 * local:inspect — one command that tells you what the live local employee is
 * actually doing, so a chat-only hallucinated action (e.g. "Connecting Gmail now..."
 * with no connect_email tool call) is obvious instead of invisible.
 *
 * It reconciles three views of "which employee": the local state file, the newest
 * employee in the DB, and the running Hermes container — and warns on mismatch. It
 * hits the runtime /health + /v1/capabilities with the sealed bearer (never printing
 * it), and dumps the last N rows across the message/turn/run/tool/event/connector
 * tables. The load-bearing heuristic: if the employee TALKED about connecting a tool
 * but there is no connect_email tool_invocation and no connector row, it says so.
 *
 *   set -a && source .env && set +a
 *   node infra/scripts/local/inspect.mjs                # discover employee
 *   node infra/scripts/local/inspect.mjs --employee emp_123
 *
 * Never prints secrets. Read-only except that it does not write anything.
 */
import { createClient } from "@supabase/supabase-js";
import { createDecipheriv, createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = resolve(HERE, "../../.local/state.json");
const MANAGER = (process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");
const WEB = (process.env.WEB_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");

const argv = process.argv.slice(2);
const onlyArg = argv.find((a) => a.startsWith("--employee"));
const argEmployee = onlyArg ? (onlyArg.split("=")[1] ?? argv[argv.indexOf(onlyArg) + 1]) : null;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("inspect: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required (source your .env).");
  process.exit(2);
}
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function masterKey() {
  const raw = process.env.SECRET_REF_MASTER_KEY;
  if (!raw || raw.length < 16) return null;
  return createHash("sha256").update(raw).digest();
}
function openSecret(ref) {
  const key = masterKey();
  if (!key || !ref) return null;
  try {
    const parsed = JSON.parse(Buffer.from(ref, "base64url").toString("utf8"));
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parsed.iv, "base64"));
    decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(parsed.ct, "base64")), decipher.final()]).toString("utf8");
  } catch { return null; }
}

function readState() {
  try { return JSON.parse(readFileSync(STATE_PATH, "utf8")); } catch { return null; }
}

async function ping(url, init) {
  try {
    const res = await fetch(url, { method: "GET", ...(init ?? {}) });
    return { ok: res.ok, status: res.status };
  } catch (e) { return { ok: false, status: 0, err: String(e.message ?? e).slice(0, 40) }; }
}

function dockerHermes() {
  try {
    const out = execSync("docker ps --filter name=hermes- --format '{{.Names}}\t{{.Ports}}\t{{.Status}}'", {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!out) return [];
    return out.split("\n").map((l) => {
      const [name, ports, ...st] = l.split("\t");
      return { name, ports, status: st.join(" "), employee_id: name.replace(/^hermes-/, "") };
    });
  } catch { return null; } // docker absent/unreachable
}

async function rows(table, { employeeId, limit = 5, order = "created_at" } = {}) {
  try {
    let q = db.from(table).select("*");
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data, error } = await q.order(order, { ascending: false }).limit(limit);
    if (error) return { error: error.message };
    return { data: data ?? [] };
  } catch (e) { return { error: String(e.message ?? e) }; }
}

function line(label, value) { console.log(`  ${label.padEnd(22)} ${value}`); }
function section(title) { console.log(`\n== ${title} ==`); }

// ---- Resolve which employee ---------------------------------------------------
const state = readState();
const containers = dockerHermes();
const newest = (await rows("employees", { limit: 1 })).data?.[0] ?? null;
const employeeId =
  argEmployee ||
  state?.employee_id ||
  newest?.id ||
  containers?.[0]?.employee_id ||
  null;

console.log("AMTECH local inspect");
section("Which employee");
line("chosen", employeeId ?? "(none found)");
line("state.json", state?.employee_id ?? "(no state file)");
line("newest in DB", newest?.id ?? "(none)");
line("running containers", containers === null ? "(docker unavailable)" : containers.length ? containers.map((c) => c.employee_id).join(", ") : "(none)");
if (containers && containers.length && newest && !containers.some((c) => c.employee_id === newest.id)) {
  console.log("  [WARN] newest DB employee is not the running container — you may be testing a stale employee.");
}
if (state?.employee_id && newest && state.employee_id !== newest.id) {
  console.log("  [WARN] state.json employee differs from newest DB employee.");
}
if (!employeeId) { console.log("\nNo employee to inspect."); process.exit(0); }

// ---- Processes / ports --------------------------------------------------------
section("Processes / ports");
const mgr = await ping(`${MANAGER}/health`);
line("Manager (:8080)", mgr.ok ? `up (${mgr.status})` : `down (${mgr.status || mgr.err})`);
const web = await ping(`${WEB}/`);
line("Web (:3000)", web.ok ? `up (${web.status})` : `down (${web.status || web.err})`);
if (containers && containers.length) {
  const mine = containers.find((c) => c.employee_id === employeeId);
  line("this container", mine ? `${mine.name} ${mine.ports} ${mine.status}` : "(not running)");
}

// ---- Runtime health with bearer ----------------------------------------------
section("Runtime (Hermes) health");
const { data: rtRow } = await db.from("runtime_endpoints").select("*").eq("employee_id", employeeId).maybeSingle();
if (!rtRow) {
  line("runtime_endpoint", "(none)");
} else {
  const base = (rtRow.api_base_url ?? rtRow.webchat_api_url ?? "").replace(/\/$/, "");
  line("base_url", base || "(none)");
  line("backend_type", rtRow.backend_type ?? "?");
  const { data: secretRow } = await db.from("runtime_endpoint_secrets").select("api_key_ref").eq("runtime_endpoint_id", rtRow.id).maybeSingle();
  const bearer = openSecret(secretRow?.api_key_ref) ?? process.env.HERMES_API_TOKEN ?? null;
  if (!base) {
    line("health", "(no base url)");
  } else if (!bearer) {
    line("health", "(no bearer — set SECRET_REF_MASTER_KEY to unseal, or HERMES_API_TOKEN)");
  } else {
    const auth = { headers: { Authorization: `Bearer ${bearer}` } };
    const h = await ping(`${base}/health`, auth);
    line("/health", h.ok ? `ok (${h.status})` : `unhealthy (${h.status || h.err})`);
    const c = await ping(`${base}/v1/capabilities`, auth);
    line("/v1/capabilities", c.ok ? `ok (${c.status})` : `unavailable (${c.status || c.err})`);
  }
}

// ---- Recent activity ----------------------------------------------------------
async function dump(title, table, fmt, limit = 5) {
  const r = await rows(table, { employeeId, limit });
  section(title);
  if (r.error) { console.log(`  (table unavailable: ${r.error})`); return r; }
  if (!r.data.length) { console.log("  (none)"); return r; }
  for (const row of r.data) console.log(`  - ${fmt(row)}`);
  return r;
}

const msgs = await dump("Recent messages", "employee_messages", (m) =>
  `${(m.direction ?? "?").padEnd(11)} ${(m.channel ?? "").padEnd(4)} ${String(m.body ?? "").replace(/\s+/g, " ").slice(0, 80)}`, 8);
await dump("Recent turn jobs", "employee_turn_jobs", (j) => `${(j.kind ?? j.status ?? "?")} status=${j.status ?? "?"}`);
await dump("Recent work runs", "work_runs", (w) => `${w.trigger_type ?? "?"} status=${w.status ?? "?"} run=${w.id ?? w.run_id ?? ""}`);
const tools = await dump("Recent tool invocations", "tool_invocations", (t) => `${(t.tool_name ?? "?").padEnd(24)} actor=${t.actor ?? "?"} status=${t.status ?? "?"}`, 12);
const conns = await dump("Connectors", "connector_accounts", (c) => `${c.provider ?? "?"} ${c.status ?? "?"}${c.external_email ? ` <${c.external_email}>` : ""}${c.last_error ? " last_error" : ""}`);
await dump("Approvals", "approvals", (a) => `${a.action_key ?? "?"} ${a.resolution ?? "pending"}`);
await dump("Inbound events", "inbound_events", (e) => `${e.event_type ?? "?"} ${e.status ?? "?"}`, 8);
await dump("Delivery decisions", "delivery_decisions", (d) => `${d.move ?? d.intent_key ?? "?"} ${d.chosen_channel ?? d.delivery_status ?? ""}`);
await dump("Event repair queue", "event_repair_queue", (r) => `${r.event_type ?? "?"} ${r.reason ?? ""}`);
await dump("Event batches", "event_batches", (b) => `${b.batch_key ?? "?"} count=${b.event_count ?? "?"} ${b.status ?? ""}`);
await dump("Audit log", "audit_log", (a) => `${a.action ?? "?"} ${a.result ?? ""}`, 8);

// ---- The hallucinated-action heuristic ---------------------------------------
section("Consistency check");
const connectorTalk = (msgs.data ?? []).some((m) => /connect|connector|gmail|hook up|link up/i.test(String(m.body ?? "")));
const hasConnectInvocation = (tools.data ?? []).some((t) => String(t.tool_name ?? "").includes("connect_email"));
const hasConnectorRow = (conns.data ?? []).length > 0;
if (connectorTalk && !hasConnectInvocation && !hasConnectorRow) {
  console.log("  [WARN] The employee TALKED about connecting a tool, but there is no connect_email");
  console.log("         tool_invocation and no connector_accounts row. This is a chat-only action —");
  console.log("         the model claimed work it never performed. Use the Connect button or verify the tool path.");
} else if (connectorTalk && hasConnectorRow) {
  console.log("  [ok] Connector talk is backed by a real connector row.");
} else {
  console.log("  [ok] No unbacked connector claims detected in recent messages.");
}
console.log("");
