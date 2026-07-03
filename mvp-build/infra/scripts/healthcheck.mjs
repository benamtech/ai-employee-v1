#!/usr/bin/env node
/**
 * Per-employee runtime health (infra/scripts/README.md, Phase 1). Reads the live DB
 * and (best-effort) pings the runtime webchat endpoint + provisioner. Surfaces what
 * 10-security-ops-observability.md "Observability" requires: provisioning status,
 * runtime reachability, SMS in/out, connector status, artifact storage.
 *
 *   node infra/scripts/healthcheck.mjs                 # all live employees
 *   node infra/scripts/healthcheck.mjs --employee emp_123
 *
 * Exit non-zero if any checked employee has a critical problem.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const argv = process.argv.slice(2);
const onlyArg = argv.find((a) => a.startsWith("--employee"));
const onlyId = onlyArg ? onlyArg.split("=")[1] ?? argv[argv.indexOf(onlyArg) + 1] : null;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("healthcheck: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required.");
  process.exit(2);
}
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let q = db.from("employees").select("*");
q = onlyId ? q.eq("id", onlyId) : q.eq("status", "live");
const { data: employees, error } = await q.order("created_at", { ascending: false }).limit(onlyId ? 1 : 100);
if (error) { console.error(`healthcheck: ${error.message}`); process.exit(1); }
if (!employees?.length) { console.log("No matching employees."); process.exit(0); }

async function ping(url) {
  if (!url) return "no-url";
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok ? `ok (${res.status})` : `unhealthy (${res.status})`;
  } catch (e) {
    return `unreachable (${e.message.slice(0, 40)})`;
  }
}

function id(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function statusFor({ backend, webchatOk, smsPresent, provisioningState }) {
  if (!webchatOk || provisioningState === "failed") return "unhealthy";
  if (backend === "local" || !smsPresent || provisioningState !== "success") return "degraded";
  return "healthy";
}

let problems = 0;
for (const emp of employees) {
  console.log(`\n■ ${emp.id} — ${emp.name ?? "(unnamed)"} [${emp.status}]`);
  const issues = [];

  const { data: rt } = await db.from("runtime_endpoints").select("*").eq("employee_id", emp.id).maybeSingle();
  if (!rt) issues.push("no runtime endpoint");
  else {
    console.log(`  runtime: sms=${rt.sms_number_e164 ?? "—"} backend=${rt.backend_type} webchat=${rt.webchat_api_url ?? "—"}`);
    const webchatPing = await ping(rt.webchat_api_url);
    const webchatOk = webchatPing.startsWith("ok");
    console.log(`  webchat ping: ${webchatPing}`);
    if (!rt.sms_number_e164) issues.push("no SMS number assigned");
    if (rt.backend_type === "local") issues.push("local backend (dev/demo only)");
    if (!webchatOk) issues.push("webchat unreachable");

    const { data: jobForSnapshot } = await db.from("provisioning_jobs").select("state,failure_state").eq("employee_id", emp.id).maybeSingle();
    const snapshotStatus = statusFor({
      backend: rt.backend_type,
      webchatOk,
      smsPresent: Boolean(rt.sms_number_e164),
      provisioningState: jobForSnapshot?.state ?? null,
    });
    const { error: snapshotError } = await db.from("runtime_health_checks").insert({
      id: id("rth"),
      runtime_endpoint_id: rt.id,
      account_id: emp.account_id,
      employee_id: emp.id,
      backend_type: rt.backend_type ?? "unknown",
      status: snapshotStatus,
      checked_at: new Date().toISOString(),
      details: {
        runner_type: "healthcheck_script",
        webchat_ping: webchatPing,
        sms_number_present: Boolean(rt.sms_number_e164),
        provisioning_state: jobForSnapshot?.state ?? null,
        provisioning_failure_state: jobForSnapshot?.failure_state ?? null,
      },
    });
    if (snapshotError) issues.push(`runtime health snapshot failed: ${snapshotError.message}`);
    const { error: runtimeUpdateError } = await db.from("runtime_endpoints").update({
      health: {
        status: snapshotStatus,
        checked_at: new Date().toISOString(),
        webchat_ok: webchatOk,
        backend_type: rt.backend_type ?? "unknown",
        sms_number_present: Boolean(rt.sms_number_e164),
      },
    }).eq("id", rt.id);
    if (runtimeUpdateError) issues.push(`runtime health update failed: ${runtimeUpdateError.message}`);
  }

  const { data: job } = await db.from("provisioning_jobs").select("state,failure_state").eq("employee_id", emp.id).maybeSingle();
  console.log(`  provisioning: ${job?.state ?? "none"}${job?.failure_state ? ` (${job.failure_state})` : ""}`);
  if (job && job.state !== "success") issues.push(`provisioning ${job.state}`);

  const { count: inCount } = await db.from("employee_messages").select("id", { head: true, count: "exact" }).eq("employee_id", emp.id).eq("direction", "to_employee");
  const { count: outCount } = await db.from("employee_messages").select("id", { head: true, count: "exact" }).eq("employee_id", emp.id).eq("direction", "to_owner");
  console.log(`  SMS/web messages: ${inCount ?? 0} in · ${outCount ?? 0} out`);

  const { data: conns } = await db.from("connector_accounts").select("provider,status,last_error").eq("employee_id", emp.id);
  for (const con of conns ?? []) {
    console.log(`  connector ${con.provider}: ${con.status}${con.last_error ? ` (last_error)` : ""}`);
    if (con.status === "error" || con.status === "disconnected") issues.push(`connector ${con.provider} ${con.status}`);
  }

  const { count: artCount } = await db.from("artifacts").select("id", { head: true, count: "exact" }).eq("employee_id", emp.id).not("storage_ref", "is", null);
  console.log(`  artifacts (stored): ${artCount ?? 0}`);

  if (issues.length) {
    problems += 1;
    console.log(`  ⚠ issues: ${issues.join("; ")}`);
  } else {
    console.log("  ✓ healthy");
  }
}

console.log(`\nChecked ${employees.length} employee(s); ${problems} with issues.`);
process.exit(problems > 0 ? 1 : 0);
