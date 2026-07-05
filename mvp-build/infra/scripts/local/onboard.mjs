#!/usr/bin/env node
/**
 * Drive the REAL onboarding front door, end-to-end, headless — the same
 * endpoints the /create-ai-employee page calls. Nothing about the employee is
 * hardcoded: the conversational orchestrator builds the manifest from a
 * simulated owner conversation. The ONLY shortcut is phone verification, which
 * uses the dev bypass code (TWILIO_VERIFY_DEV_BYPASS=1) instead of a real SMS.
 *
 * Steps (each is a real production endpoint via the web proxy):
 *   1. POST /api/front-door/message      → orchestrator conversation → manifest_draft
 *   2. POST /api/front-door/send-code    → send_phone_verification (dev: no SMS)
 *   3. POST /api/front-door/check-code   → check_phone_code (dev code) → verified_phone_ref
 *   4. POST /api/front-door/create-account → account + owner session
 *   5. POST /api/front-door/provision    → provision_employee → Docker Hermes container
 *
 * Prereqs: web (:3000) + Manager (:8080) running, migrations applied, Docker up.
 * Usage:  node infra/scripts/local/onboard.mjs
 */
import { randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = resolve(HERE, "../../.local/state.json");
const WEB = (process.env.WEB_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const DEV_CODE = process.env.TWILIO_VERIFY_DEV_CODE ?? "000000";
const phone = process.env.ONBOARD_PHONE ?? "+15705550123";
const email = process.env.ONBOARD_EMAIL ?? `owner+${Date.now()}@amtech.local`;
const password = process.env.ONBOARD_PASSWORD ?? randomBytes(12).toString("base64url");

// A realistic owner conversation — the *only* scripted input. The orchestrator
// (an LLM) extracts the business facts and builds the manifest itself.
const OWNER_TURNS = [
  "Hey — I run a painting business near Scranton PA called Palaskas Painting. Been at it about 8 years, it's me plus two guys.",
  "The repeat computer work that eats my time is writing estimates and then following up with customers who go quiet. I mostly live in Gmail and my phone.",
  "We do around $300k a year, typical job is $2,000 to $8,000. Ideal customer is a homeowner interior/exterior repaint. What kills me is chasing people who ghost after I send an estimate.",
  "Let's call the assistant Casey. Eastern time. I think that's everything you need.",
];

async function post(path, body) {
  const res = await fetch(`${WEB}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((e) => { console.error(`web unreachable at ${WEB}: ${e.message}`); process.exit(1); });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function fail(step, r) {
  console.error(`\n[onboard] ${step} failed (HTTP ${r.status}):`);
  console.error(JSON.stringify(r.json, null, 2));
  process.exit(1);
}

console.log(`[onboard] 1/5  Conversational onboarding (${OWNER_TURNS.length} owner turns → orchestrator builds the manifest)…`);
let sessionId = null;
let manifest = {};
for (const message of OWNER_TURNS) {
  const r = await post("/api/front-door/message", { session_id: sessionId, surface: "web", message });
  if (r.status !== 200 || r.json.error) fail("orchestrator message", r);
  sessionId = r.json.session_id ?? sessionId;
  manifest = r.json.manifest_draft ?? manifest;
  console.log(`   you> ${message}`);
  console.log(`   AMTECH> ${r.json.assistant_message ?? ""}`);
}
console.log("   manifest_draft:", JSON.stringify({
  business_display_name: manifest.business_display_name,
  business_kind: manifest.business_kind,
  owner_name: manifest.owner_name,
  employee_name: manifest.employee_name,
  timezone: manifest.timezone,
}));

console.log("[onboard] 2/5  send-code (phone verification — dev bypass, no SMS)…");
const send = await post("/api/front-door/send-code", { phone_e164: phone, session_id: sessionId });
if (send.json?.status !== "ok") fail("send-code", send);
const attemptId = send.json.proof.verification_attempt_id;

console.log(`[onboard] 3/5  check-code (dev code ${DEV_CODE})…`);
const check = await post("/api/front-door/check-code", { verification_attempt_id: attemptId, code: DEV_CODE });
if (check.json?.status !== "ok") fail("check-code", check);
const verifiedPhoneRef = check.json.proof.verified_phone_ref;

console.log("[onboard] 4/5  create-account…");
const acct = await post("/api/front-door/create-account", {
  email, password_or_auth_ref: password, verified_phone_ref: verifiedPhoneRef,
  business_display_name: manifest.business_display_name, timezone: manifest.timezone ?? "America/New_York",
});
if (acct.json?.status !== "ok") fail("create-account", acct);
const accountId = acct.json.proof.account_id;
const ownerToken = acct.json.proof.owner_session_token;

console.log("[onboard] 5/5  provision_employee (real tool → render → Caddy → Docker Hermes)…");
const prov = await post("/api/front-door/provision", {
  account_id: accountId,
  manifest: { ...manifest, account_id: accountId, verified_phone_e164: phone, verification_method: "twilio_verify", consent_channel: "web", owner_email: email },
  transcript_ref: sessionId,
  idempotency_key: `${accountId}:${sessionId}`,
});
const empId = prov.json?.employee_id ?? prov.json?.proof?.employee_id ?? null;
console.log(`   provision status: ${prov.json?.status}  employee: ${empId}`);
if (prov.json?.status === "failed") {
  console.error("   provision failed (check docker logs hermes-<emp> if the container didn't come up):");
  console.error("   ", JSON.stringify(prov.json?.proof ?? prov.json, null, 2));
}

// Persist local state so chat.mjs / inspect.mjs stop relying on copy-paste. This is
// a local dev convenience file (gitignored) — the owner_session_token is a local
// session token, not a provider secret.
try {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({
    employee_id: empId, account_id: accountId, owner_session_token: ownerToken,
    owner_email: email, web_origin: WEB, work_surface_url: `${WEB}/agent/${empId}`,
    updated_at: new Date().toISOString(),
  }, null, 2));
  console.log(`\n[onboard] wrote ${STATE_PATH}`);
} catch (e) {
  console.error(`[onboard] could not write state file: ${e.message}`);
}

console.log("\n=== ONBOARDED EMPLOYEE ===");
console.log("employee_id         :", empId);
console.log("account_id          :", accountId);
console.log("owner login         :", email, "/", password);
console.log("owner_session_token :", ownerToken);
console.log("Work Surface URL    : http://localhost:3000/agent/" + empId);
console.log("\nTerminal chat:");
console.log(`  OWNER_SESSION_TOKEN='${ownerToken}' EMPLOYEE_ID='${empId}' \\`);
console.log(`    MANAGER_INTERNAL_TOKEN="$MANAGER_INTERNAL_TOKEN" node infra/scripts/local/chat.mjs "hi, what can you do?"`);
console.log("\nBrowser: open http://localhost:3000/create-ai-employee to do this by hand, or set");
console.log("cookie amtech_owner_session=<owner_session_token> and open the Work Surface URL.");
