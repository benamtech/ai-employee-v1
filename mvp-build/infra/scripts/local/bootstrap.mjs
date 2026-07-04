#!/usr/bin/env node
/**
 * Local VPS-faithful bootstrap — provision one employee end-to-end, no SMS.
 *
 * Runs the REAL Manager tools (create_account → provision_employee), the same
 * path production uses. The only shortcut is phone verification: we insert a
 * verified_phones row directly (service role) instead of Twilio Verify, and the
 * provisioner skips the SMS webhook + first SMS (PROVISIONER_SKIP_SMS=1).
 *
 * Prereqs: Manager running on MANAGER_BASE_URL, Supabase env set, migrations
 * applied. Prints the employee id, owner session token, and Work Surface URL.
 *
 * Usage:  set -a && source .env && set +a && node infra/scripts/local/bootstrap.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

function need(k) {
  const v = process.env[k];
  if (!v) { console.error(`Missing env ${k} (source your .env first)`); process.exit(1); }
  return v;
}

const SUPABASE_URL = need("SUPABASE_URL");
const SERVICE_ROLE = need("SUPABASE_SERVICE_ROLE_KEY");
const MANAGER = (process.env.MANAGER_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const INTERNAL = process.env.MANAGER_INTERNAL_TOKEN;

const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

async function tool(name, body) {
  const res = await fetch(`${MANAGER}/manager/tools/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(INTERNAL ? { Authorization: `Bearer ${INTERNAL}` } : {}) },
    body: JSON.stringify(body),
  }).catch((e) => { console.error(`Manager unreachable at ${MANAGER}: ${e.message}`); process.exit(1); });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const phone = process.env.LOCAL_OWNER_PHONE ?? "+15705550123";
const email = process.env.LOCAL_OWNER_EMAIL ?? `owner+${Date.now()}@amtech.local`;
const password = process.env.LOCAL_OWNER_PASSWORD ?? randomBytes(12).toString("base64url");
const business = process.env.LOCAL_BUSINESS ?? "Test Painting Co";
const phoneId = `phone_${randomBytes(12).toString("hex")}`;

console.log("1/3  Inserting verified_phones row (bypasses Twilio Verify locally)…");
{
  const { error } = await db.from("verified_phones").insert({
    id: phoneId, phone_e164: phone, verification_method: "sms_inbound", consent_channel: "sms", twilio_proof: {},
  });
  if (error) { console.error("  verified_phones insert failed:", error.message); process.exit(1); }
}

console.log("2/3  create_account…");
const acct = await tool("create_account", {
  email, password_or_auth_ref: password, verified_phone_ref: phoneId,
  business_display_name: business, timezone: "America/New_York",
});
if (acct.json?.status !== "ok") { console.error("  create_account failed:", JSON.stringify(acct.json, null, 2)); process.exit(1); }
const accountId = acct.json.proof.account_id;
const ownerToken = acct.json.proof.owner_session_token;

console.log("3/3  provision_employee (real tool → render → Caddy → Docker runtime)…");
const manifest = {
  employee_type: "contractor_estimator",
  profile_package_key: "contractor_estimator",
  business_display_name: business,
  business_kind: process.env.LOCAL_BUSINESS_KIND ?? "painting",
  timezone: "America/New_York",
  owner_name: process.env.LOCAL_OWNER_NAME ?? "Test Owner",
  verified_phone_e164: phone,
  verification_method: "sms_inbound",
  consent_channel: "sms",
  employee_name: process.env.LOCAL_EMPLOYEE_NAME ?? "Sam",
  top_workflows: ["estimates", "follow-up"],
  tools_mentioned: [],
  seed_skills: ["estimate", "invoice", "daily-checkin"],
  pricing_facts: [], branding_facts: [], customer_job_facts: [],
};
const prov = await tool("provision_employee", { account_id: accountId, idempotency_key: `local-${Date.now()}`, manifest });
const empId = prov.json?.employee_id ?? prov.json?.proof?.employee_id ?? null;
console.log(`  provision status: ${prov.json?.status}  employee: ${empId}`);
if (prov.json?.status === "failed") {
  console.error("  provision failed (this is expected until Docker + the hermes-agent image are up):");
  console.error("  ", JSON.stringify(prov.json?.proof ?? prov.json, null, 2));
}

console.log("\n=== LOCAL EMPLOYEE ===");
console.log("employee_id         :", empId);
console.log("account_id          :", accountId);
console.log("owner login         :", email, "/", password);
console.log("owner_session_token :", ownerToken);
console.log("Work Surface URL    : http://localhost:3000/agent/" + empId);
console.log("\nTerminal chat:");
console.log(`  OWNER_SESSION_TOKEN='${ownerToken}' EMPLOYEE_ID='${empId}' \\`);
console.log(`    MANAGER_INTERNAL_TOKEN='${INTERNAL ?? ""}' node infra/scripts/local/chat.mjs "hi, what can you do?"`);
console.log("\nBrowser: set cookie  amtech_owner_session=<owner_session_token>  on http://localhost:3000, then open the Work Surface URL.");
