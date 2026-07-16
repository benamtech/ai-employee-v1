#!/usr/bin/env node
/**
 * REAL-USER-PATH browser onboarding. Drives the actual /create-ai-employee page
 * as a coding agent (or a contractor) would — typing the owner's words into the
 * chat, verifying the phone (dev bypass), creating the account, and provisioning —
 * then opens the Work Surface. This is the true browser front door, distinct from
 * 05-browser.mjs which uses a bootstrap-injected owner-session cookie (bypass path).
 *
 * Data varies each run (contractor-fixtures.mjs) so the form/flow can't be fooled
 * by copy-pasted input. Headful debugging: LOCAL_BROWSER_HEADLESS=0.
 *
 * Prereqs: web + Manager up, Docker up, TWILIO_VERIFY_DEV_BYPASS=1, and a funded
 * orchestrator model key for the conversational step (same funded-key blocker as
 * the Phase 5 runtime gate). Without the key the harness reports the exact
 * remediation and exits — it does not fake success.
 */
import { printResult, webBase } from "./_lib.mjs";
import { pickFixture, conversationTurns } from "../contractor-fixtures.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, join } from "node:path";

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("Playwright not installed. Run `npm run local:browser-install`.");
  process.exit(1);
}

const DEV_CODE = process.env.TWILIO_VERIFY_DEV_CODE ?? "000000";
const WEB = webBase();
const fx = pickFixture();
const password = process.env.ONBOARD_PASSWORD ?? `local-${fx.idempotency_stamp}`;
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const statePath = join(process.cwd(), "infra", ".local", "state.json");
const keepOpen = process.env.LOCAL_BROWSER_KEEP_OPEN === "1";
const manualMode = process.env.LOCAL_BROWSER_MANUAL === "1";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function writeProof(proof) {
  await mkdir(proofDir, { recursive: true });
  const path = join(proofDir, `browser-onboard-normal-${stamp()}.json`);
  await writeFile(path, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  return path;
}

const browser = await chromium.launch({ headless: process.env.LOCAL_BROWSER_HEADLESS !== "0" });
try {
  const page = await (await browser.newContext()).newPage();
  let proofWritten = false;
  const captured = {
    session_id: null,
    manifest: {},
    account_id: null,
    employee_id: null,
    owner_email: fx.owner_email,
    web_route: null,
  };
  async function persistSuccess(employeeId) {
    if (proofWritten || !employeeId) return null;
    proofWritten = true;
    const state = {
      account_id: captured.account_id,
      employee_id: employeeId,
      owner_email: captured.owner_email,
      web_route: captured.web_route ?? `/agent/${employeeId}`,
      manager_base_url: process.env.MANAGER_BASE_URL ?? process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080",
      onboarded_via: manualMode ? "browser-manual-real-user-path" : "browser-real-user-path",
      business_kind: captured.manifest?.business_kind ?? fx.business_kind,
      business_display_name: captured.manifest?.business_display_name ?? fx.business_display_name,
      timezone: captured.manifest?.timezone ?? fx.timezone,
      owner_session_token: null,
      note: "Owner session cookie is held in the headed browser; token intentionally not persisted by browser harness.",
    };
    await mkdir(dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    const path = await writeProof({
      kind: "browser_onboard_normal_employee",
      status: "pass",
      checked_at: new Date().toISOString(),
      host: hostname(),
      public_origin: WEB,
      session_id: captured.session_id,
      account_id: captured.account_id,
      employee_id: employeeId,
      owner_email: captured.owner_email,
      business_display_name: state.business_display_name,
      business_kind: state.business_kind,
      timezone: state.timezone,
      fixture_key: fx.fixture_key,
      mode: manualMode ? "manual" : "scripted",
      state_path: statePath,
      secrets_logged: false,
    });
    console.log(`proof_json:${path}`);
    return path;
  }
  page.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("/api/front-door/")) return;
    let json = {};
    try {
      json = await response.json();
    } catch {
      return;
    }
    if (url.includes("/api/front-door/message")) {
      captured.session_id = json.session_id ?? captured.session_id;
      captured.manifest = json.manifest_draft ?? captured.manifest;
    }
    if (url.includes("/api/front-door/send-code")) {
      captured.verification_attempt_id = json?.proof?.verification_attempt_id ?? captured.verification_attempt_id;
    }
    if (url.includes("/api/front-door/check-code")) {
      captured.verified_phone_ref = json?.proof?.verified_phone_ref ?? captured.verified_phone_ref;
    }
    if (url.includes("/api/front-door/create-account")) {
      captured.account_id = json?.proof?.account_id ?? captured.account_id;
    }
    if (url.includes("/api/front-door/provision")) {
      captured.employee_id = json.employee_id ?? json?.proof?.employee_id ?? captured.employee_id;
      captured.web_route = json?.proof?.web_route ?? (captured.employee_id ? `/agent/${captured.employee_id}` : captured.web_route);
      if (captured.employee_id) {
        await persistSuccess(captured.employee_id);
        await page.goto(`${WEB}/agent/${captured.employee_id}`, { waitUntil: "networkidle" }).catch(() => {});
        console.log(`[browser-onboard] provisioned ${captured.employee_id}; owner browser is on /agent/${captured.employee_id}`);
      }
    }
  });
  await page.goto(`${WEB}/create-ai-employee`, { waitUntil: "networkidle" });
  console.log(`[browser-onboard] fixture: ${fx.business_kind} — ${fx.business_display_name}`);
  if (manualMode) {
    console.log(`[browser-onboard] manual mode: use the headed browser at ${WEB}/create-ai-employee and answer the live onboarding messages yourself.`);
    console.log("[browser-onboard] this process will capture session/account/employee ids from the real browser responses and keep the browser open.");
    await new Promise(() => {});
  }

  // 1. Conversation — type the owner's words; the orchestrator builds the manifest.
  const chat = page.getByPlaceholder("Reply here...");
  const assistantMessages = page.locator(".fl-msg:not(.owner)");
  for (const turn of conversationTurns(fx)) {
    const before = await assistantMessages.count();
    await chat.fill(turn);
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await assistantMessages.nth(before).waitFor({ timeout: 60_000 });
    const reply = await assistantMessages.nth(before).innerText();
    if (/onboarding error/i.test(reply)) {
      printResult("browser real-user onboarding", false,
        "orchestrator model unavailable — set a funded ORCHESTRATOR_API_KEY / XAI_API_KEY / OPENAI_API_KEY (same funded-key blocker as Phase 5). Bypass path: npm run local:acceptance:browser");
      process.exit(1);
    }
  }

  // 2-3. Phone verify (dev bypass).
  await page.getByPlaceholder("+15705551234").fill(fx.phone_e164);
  const sendCodeResponse = page.waitForResponse((response) => response.url().includes("/api/front-door/send-code"), { timeout: 30_000 });
  await page.getByRole("button", { name: "Send code" }).click();
  await sendCodeResponse;
  await page.getByPlaceholder("Code").fill(DEV_CODE);
  const checkCodeResponse = page.waitForResponse((response) => response.url().includes("/api/front-door/check-code"), { timeout: 30_000 });
  await page.getByRole("button", { name: "Confirm" }).click();
  const checkJson = await (await checkCodeResponse).json().catch(() => ({}));
  if (checkJson?.status !== "ok" || !checkJson?.proof?.verified_phone_ref) {
    printResult("browser phone verification", false, JSON.stringify(checkJson).slice(0, 300));
    process.exit(1);
  }

  // 4. Account.
  await page.getByPlaceholder("owner@example.com").fill(fx.owner_email);
  await page.getByPlaceholder("Password").fill(password);
  const createAccountResponse = page.waitForResponse((response) => response.url().includes("/api/front-door/create-account"), { timeout: 30_000 });
  await page.getByRole("button", { name: "Create account" }).click();
  const createJson = await (await createAccountResponse).json().catch(() => ({}));
  if (createJson?.status !== "ok" || !createJson?.proof?.account_id) {
    printResult("browser create account", false, JSON.stringify(createJson).slice(0, 300));
    process.exit(1);
  }

  // 5. Provision.
  const provisionResponse = page.waitForResponse((response) => response.url().includes("/api/front-door/provision"), { timeout: 120_000 });
  await page.getByRole("button", { name: /Provision employee|Start your employee|Start employee/i }).click();
  const provisionJson = await (await provisionResponse).json().catch(() => ({}));
  await page.waitForTimeout(2_000);
  const status = await page.locator("pre").innerText();
  const empMatch = status.match(/emp_[a-z0-9]+/i);
  const employeeId = captured.employee_id ?? provisionJson.employee_id ?? provisionJson?.proof?.employee_id ?? empMatch?.[0] ?? null;
  const ok = /provision|employee|live|started/i.test(status) && !/failed/i.test(status) && Boolean(employeeId);

  let proofPath = null;
  if (ok && employeeId) {
    await page.goto(`${WEB}/agent/${employeeId}`, { waitUntil: "networkidle" }).catch(() => {});
    proofPath = await persistSuccess(employeeId);
  }
  printResult("browser real-user onboarding", Boolean(ok && employeeId), employeeId ?? status.split("\n").slice(-3).join(" | "));
  if (ok && employeeId && keepOpen) {
    console.log(`[browser-onboard] keeping headed browser open on ${WEB}/agent/${employeeId}`);
    await new Promise(() => {});
  }
} finally {
  if (!keepOpen) await browser.close();
}
