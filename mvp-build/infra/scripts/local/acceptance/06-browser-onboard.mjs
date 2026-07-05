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

const browser = await chromium.launch({ headless: process.env.LOCAL_BROWSER_HEADLESS !== "0" });
try {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${WEB}/create-ai-employee`, { waitUntil: "networkidle" });
  console.log(`[browser-onboard] fixture: ${fx.business_kind} — ${fx.business_display_name}`);

  // 1. Conversation — type the owner's words; the orchestrator builds the manifest.
  const chat = page.getByPlaceholder("Tell me what your business does...");
  for (const turn of conversationTurns(fx)) {
    const before = await page.getByText("AMTECH:").count();
    await chat.fill(turn);
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByText("AMTECH:").nth(before).waitFor({ timeout: 60_000 });
    const reply = await page.getByText("AMTECH:").nth(before).innerText();
    if (/onboarding error/i.test(reply)) {
      printResult("browser real-user onboarding", false,
        "orchestrator model unavailable — set a funded ORCHESTRATOR_API_KEY / XAI_API_KEY / OPENAI_API_KEY (same funded-key blocker as Phase 5). Bypass path: npm run local:acceptance:browser");
      process.exit(1);
    }
  }

  // 2-3. Phone verify (dev bypass).
  await page.getByPlaceholder("+15705551234").fill(fx.phone_e164);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByPlaceholder("Code").fill(DEV_CODE);
  await page.getByRole("button", { name: "Check code" }).click();
  await page.getByText(/verified/i).waitFor({ timeout: 20_000 });

  // 4. Account.
  await page.getByPlaceholder("owner@example.com").fill(fx.owner_email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText(/account created/i).waitFor({ timeout: 20_000 });

  // 5. Provision.
  await page.getByRole("button", { name: "Provision employee" }).click();
  await page.waitForTimeout(2_000);
  const status = await page.locator("pre").innerText();
  const empMatch = status.match(/emp_[a-z0-9]+/i);
  const ok = /provision|employee|live/i.test(status) && !/failed/i.test(status);

  if (ok && empMatch) {
    await page.goto(`${WEB}/agent/${empMatch[0]}`, { waitUntil: "networkidle" }).catch(() => {});
  }
  printResult("browser real-user onboarding", Boolean(ok && empMatch), empMatch ? empMatch[0] : status.split("\n").slice(-3).join(" | "));
} finally {
  await browser.close();
}
