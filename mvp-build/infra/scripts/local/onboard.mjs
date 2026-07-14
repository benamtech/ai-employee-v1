#!/usr/bin/env node
/**
 * REAL-USER-PATH onboarding harness. Drives the exact endpoints the
 * /create-ai-employee page calls, end-to-end, against local Web (:3000) → Manager
 * (:8080). Nothing about the employee is hardcoded: a varied contractor fixture
 * (contractor-fixtures.mjs) supplies the owner's words, and the orchestrator LLM
 * builds the manifest itself. The only local shortcut is phone verification, which
 * uses the gated dev bypass (TWILIO_VERIFY_DEV_BYPASS=1, fail-closed in prod)
 * instead of a real Twilio SMS.
 *
 * Steps (each a real production endpoint via the web proxy):
 *   1. POST /api/front-door/message        → orchestrator conversation → manifest
 *   2. POST /api/front-door/send-code       → send_phone_verification (dev bypass)
 *   3. POST /api/front-door/check-code      → check_phone_code (dev code) → phone ref
 *   4. POST /api/front-door/create-account  → account + owner session
 *   5. POST /api/front-door/provision       → provision_employee → Docker Hermes
 *
 * Prereqs: web + Manager running, migrations applied, Docker up, and
 *   TWILIO_VERIFY_DEV_BYPASS=1 in the Manager env.
 * The conversational step (1) requires a funded orchestrator model key
 *   (ORCHESTRATOR_API_KEY / ANTHROPIC_API_KEY / XAI_API_KEY / OPENAI_API_KEY). Without it the harness
 *   stops honestly at step 1 with the exact remediation — the same funded-key
 *   blocker as the Phase 5 runtime gate. Use local:bootstrap for the no-model
 *   BYPASS path.
 *
 * Never prints secrets: the owner session token is written only to the gitignored
 * infra/.local/state.json, never to stdout.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { statePath, webBase } from "./acceptance/_lib.mjs";
import { pickFixture, conversationTurns } from "./contractor-fixtures.mjs";

const WEB = webBase();
const DEV_CODE = process.env.TWILIO_VERIFY_DEV_CODE ?? "000000";

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${WEB}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(`\n[onboard] web unreachable at ${WEB} — is 'npm run web:dev' running? (${e.message})`);
    process.exit(1);
  }
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function fail(step, r, hint) {
  console.error(`\n[onboard] ${step} failed (HTTP ${r.status}).`);
  if (hint) console.error(`[onboard] → ${hint}`);
  // Print the response WITHOUT secrets (it is a manager error envelope, not a token).
  console.error(JSON.stringify(r.json, null, 2));
  process.exit(1);
}

const fx = pickFixture();
console.log(`[onboard] fixture: ${fx.business_kind} — ${fx.business_display_name} (owner ${fx.owner_name}, assistant ${fx.employee_name})`);

// 1. Conversational onboarding — the orchestrator builds the manifest from the owner's words.
console.log(`[onboard] 1/5  conversational onboarding (${conversationTurns(fx).length} owner turns)…`);
let sessionId = null;
let manifest = {};
for (const message of conversationTurns(fx)) {
  const r = await post("/api/front-door/message", { session_id: sessionId, surface: "web", message });
  if (r.status !== 200 || r.json.error) {
    fail("orchestrator message", r,
      "The conversational front door needs a funded orchestrator model key " +
      "(ORCHESTRATOR_API_KEY / ANTHROPIC_API_KEY / XAI_API_KEY / OPENAI_API_KEY). This is the same funded-key " +
      "blocker as the Phase 5 runtime gate. For the no-model path use: npm run local:bootstrap");
  }
  sessionId = r.json.session_id ?? sessionId;
  manifest = r.json.manifest_draft ?? manifest;
  console.log(`   you> ${message}`);
  console.log(`   AMTECH> ${r.json.assistant_message ?? ""}`);
}
console.log(`   manifest_draft: ${JSON.stringify({
  business_display_name: manifest.business_display_name,
  business_kind: manifest.business_kind,
  employee_name: manifest.employee_name,
  timezone: manifest.timezone,
})}`);

// 2. send-code (dev bypass — no real SMS).
console.log("[onboard] 2/5  send-code (phone verification — dev bypass, no SMS)…");
const send = await post("/api/front-door/send-code", { phone_e164: fx.phone_e164, session_id: sessionId });
if (send.json?.status !== "ok" || !send.json?.proof?.verification_attempt_id) {
  fail("send-code", send, "Set TWILIO_VERIFY_DEV_BYPASS=1 in the Manager env for the local no-SMS path.");
}
const attemptId = send.json.proof.verification_attempt_id;

// 3. check-code (dev code).
console.log(`[onboard] 3/5  check-code (dev code)…`);
const check = await post("/api/front-door/check-code", { verification_attempt_id: attemptId, code: DEV_CODE });
if (check.json?.status !== "ok" || !check.json?.proof?.verified_phone_ref) {
  fail("check-code", check, `Dev code mismatch — expected TWILIO_VERIFY_DEV_CODE (default 000000).`);
}
const verifiedPhoneRef = check.json.proof.verified_phone_ref;

// 4. create-account.
console.log("[onboard] 4/5  create-account…");
const password = process.env.ONBOARD_PASSWORD ?? `local-${fx.idempotency_stamp}`;
const acct = await post("/api/front-door/create-account", {
  email: fx.owner_email,
  password_or_auth_ref: password,
  verified_phone_ref: verifiedPhoneRef,
  business_display_name: manifest.business_display_name ?? fx.business_display_name,
  timezone: manifest.timezone ?? fx.timezone,
});
if (acct.json?.status !== "ok" || !acct.json?.proof?.account_id) fail("create-account", acct);
const accountId = acct.json.proof.account_id;
const ownerToken = acct.json.proof.owner_session_token;

// 5. provision_employee.
console.log("[onboard] 5/5  provision_employee (real tool → render → Caddy → Docker Hermes)…");
const prov = await post("/api/front-door/provision", {
  account_id: accountId,
  manifest: { ...manifest, account_id: accountId, verified_phone_e164: fx.phone_e164, verification_method: "twilio_verify", consent_channel: "web", owner_email: fx.owner_email },
  transcript_ref: sessionId,
  idempotency_key: `onboard:${accountId}:${fx.idempotency_stamp}`,
});
const empId = prov.json?.employee_id ?? prov.json?.proof?.employee_id ?? null;
console.log(`   provision status: ${prov.json?.status}  employee: ${empId ?? "(none)"}`);
if (prov.json?.status === "failed" || !empId) {
  fail("provision", prov, "If the container didn't come up, check `docker logs amtech-hermes-<employee_id>`.");
}

// Persist state (token to gitignored file only; never to stdout).
const state = {
  account_id: accountId,
  employee_id: empId,
  owner_session_token: ownerToken,
  owner_session_expires_at: acct.json.proof?.owner_session_expires_at ?? null,
  web_route: prov.json?.proof?.web_route ?? `/agent/${empId}`,
  manager_base_url: process.env.MANAGER_BASE_URL ?? process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080",
  onboarded_via: "real-user-path",
  business_kind: fx.business_kind,
  sms_skipped: true,
};
await mkdir(dirname(statePath), { recursive: true });
await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

console.log("\n=== ONBOARDED EMPLOYEE (real user path) ===");
console.log("employee_id      :", empId);
console.log("account_id       :", accountId);
console.log("business         :", fx.business_display_name, `(${fx.business_kind})`);
console.log("owner login      :", fx.owner_email);
console.log("Work Surface URL :", `${WEB}${state.web_route}`);
console.log(`state written    : ${statePath} (owner session token stored there, not printed)`);
console.log("\nNext:");
console.log("  npm run local:acceptance:runtime          # /health + /v1/capabilities");
console.log('  npm run local:chat -- "Before pricing anything, what setup do you still need?"');
