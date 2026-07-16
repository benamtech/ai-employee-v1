#!/usr/bin/env node
/**
 * Validate production normal-employee proof against live infrastructure and DB
 * state. Output is intentionally proof-oriented and redacted.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const proofPath = process.argv.find((arg) => arg.startsWith("--proof="))?.slice("--proof=".length);
if (!proofPath) {
  console.error("usage: npm run prod:normal:validate -- --proof=infra/proofs/production-onboarding-....json");
  process.exit(2);
}

function parseEnvText(text) {
  const values = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return values;
}

function readEnv(path) {
  return existsSync(path) ? parseEnvText(readFileSync(path, "utf8")) : {};
}

function check(name, pass, detail = "") {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    ok: result.status === 0,
    out: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

async function head(url, headers = {}) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual", headers, signal: AbortSignal.timeout(10_000) });
    return { ok: res.status < 500, status: res.status, headers: Object.fromEntries(res.headers.entries()) };
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

const proof = JSON.parse(readFileSync(proofPath, "utf8"));
const env = { ...readEnv(".env"), ...readEnv("infra/deploy/.env.production"), ...process.env };
const checks = [];
const publicOrigin = (proof.public_origin ?? env.PUBLIC_WEB_ORIGIN ?? "https://agent.amtechai.com").replace(/\/$/, "");

const docker = run("docker", ["ps", "-a", "--format", "{{.Names}}\t{{.Status}}\t{{.Ports}}"]);
check("docker_list", docker.ok, docker.out.split("\n").slice(0, 12).join(" | "));
for (const name of ["amtech-ai-employee-manager-1", "amtech-ai-employee-web-1", "amtech-ai-employee-caddy-1"]) {
  check(`container:${name}`, docker.out.includes(name) && /Up|healthy/.test(docker.out.split("\n").find((line) => line.includes(name)) ?? ""), name);
}
for (const employee of proof.employees ?? []) {
  check(`container:amtech-hermes-${employee.id}`, docker.out.includes(`amtech-hermes-${employee.id}`), employee.id);
}

const managerHealth = await fetch("http://127.0.0.1:8080/health", { signal: AbortSignal.timeout(5_000) })
  .then(async (res) => ({ ok: res.ok, body: await res.text() }))
  .catch((err) => ({ ok: false, body: String(err?.message ?? err) }));
check("manager_health", managerHealth.ok, managerHealth.body.slice(0, 200));

const origin = await head("http://127.0.0.1/create-ai-employee", { Host: "agent.amtechai.com" });
check("caddy_origin_agent_route", origin.ok && (origin.status === 200 || origin.status === 308), `status=${origin.status ?? origin.error}`);
const publicHead = await head(`${publicOrigin}/create-ai-employee`);
check("public_ingress", publicHead.ok && publicHead.status >= 200 && publicHead.status < 400, `status=${publicHead.status ?? publicHead.error}`);

const supabaseUrl = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  check("supabase_env", false, "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
} else {
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const accountIds = [...new Set((proof.accounts ?? []).map((a) => a.id).filter(Boolean))];
  const employeeIds = [...new Set((proof.employees ?? []).map((e) => e.id).filter(Boolean))];

  if (accountIds.length) {
    const { data: accounts, error } = await db.from("accounts").select("id,display_name").in("id", accountIds);
    check("db_accounts_exist", !error && (accounts ?? []).length === accountIds.length, error?.message ?? `${accounts?.length ?? 0}/${accountIds.length}`);
  }
  if (employeeIds.length) {
    const { data: employees, error } = await db.from("employees").select("id,account_id,status,web_route").in("id", employeeIds);
    check("db_employees_exist", !error && (employees ?? []).length === employeeIds.length, error?.message ?? `${employees?.length ?? 0}/${employeeIds.length}`);
    const { data: endpoints } = await db.from("runtime_endpoints").select("employee_id,public_web_route,gateway_port,backend_type,health,sms_number_e164").in("employee_id", employeeIds);
    check("db_runtime_endpoint_per_employee", (endpoints ?? []).length === employeeIds.length, `${endpoints?.length ?? 0}/${employeeIds.length}`);
    check("db_runtime_endpoint_distinct", new Set((endpoints ?? []).map((r) => `${r.gateway_port}:${r.public_web_route}`)).size === (endpoints ?? []).length, "gateway/route uniqueness");
    const { data: jobs } = await db.from("provisioning_jobs").select("id,employee_id,state,failure_state").in("employee_id", employeeIds);
    check("db_provisioning_job_per_employee", (jobs ?? []).length >= employeeIds.length, `${jobs?.length ?? 0}/${employeeIds.length}`);
    const { data: creds } = await db.from("employee_mcp_credentials").select("id,employee_id,status").in("employee_id", employeeIds).eq("status", "active");
    check("db_active_mcp_per_employee", (creds ?? []).length >= employeeIds.length, `${creds?.length ?? 0}/${employeeIds.length}`);
    for (const employee of employees ?? []) {
      check(`employee_account_binding:${employee.id}`, accountIds.length === 0 || accountIds.includes(employee.account_id), employee.account_id);
    }
  }
  if (accountIds.length) {
    const { data: phones } = await db.from("verified_phones").select("id,account_id,phone_e164,twilio_proof").in("account_id", accountIds);
    const byAccountPhone = new Set();
    let duplicateInsideAccount = false;
    for (const phone of phones ?? []) {
      const key = `${phone.account_id}:${phone.phone_e164}`;
      if (byAccountPhone.has(key)) duplicateInsideAccount = true;
      byAccountPhone.add(key);
    }
    check("phone_no_duplicate_inside_account", !duplicateInsideAccount, "unique(account_id, phone_e164)");
    const founderPhoneRows = (phones ?? []).filter((p) => p.phone_e164 === "+18058869173");
    if (accountIds.length > 1) check("phone_reuse_across_accounts_allowed", new Set(founderPhoneRows.map((p) => p.account_id)).size > 1, `${founderPhoneRows.length} rows`);
    check("phone_no_dev_bypass_in_proof", !(proof.verification_attempts ?? []).some((p) => p.dev_bypass) && !(proof.verified_phones ?? []).some((p) => p.dev_bypass), "real Twilio required");
  }
}

const failed = checks.filter((c) => c.status === "fail");
for (const c of checks) console.log(`${c.status === "pass" ? "PASS" : "FAIL"} ${c.name}${c.detail ? ` ${c.detail}` : ""}`);
console.log(`validated_proof:${proofPath}`);
if (failed.length) process.exit(1);
