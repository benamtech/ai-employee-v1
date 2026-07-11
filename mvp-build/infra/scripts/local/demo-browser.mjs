#!/usr/bin/env node
/**
 * Open a real (headed) Chromium window on the local desktop, pre-authenticated on
 * an employee's Work Surface, and keep it open for a live/screen-recorded demo.
 * The person drives the browser by hand; a Haiku model-worker answers via the bridge.
 *
 *   OWNER_SESSION_TOKEN=... EMPLOYEE_ID=emp_... node infra/scripts/local/demo-browser.mjs
 */
import { chromium } from "@playwright/test";

const WEB = (process.env.WEB_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const token = process.env.OWNER_SESSION_TOKEN;
const employeeId = process.env.EMPLOYEE_ID;
if (!token || !employeeId) { console.error("Set OWNER_SESSION_TOKEN and EMPLOYEE_ID."); process.exit(1); }

const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
const context = await browser.newContext({ viewport: null });
await context.addCookies([{ name: "amtech_owner_session", value: token, url: WEB, sameSite: "Lax" }]);
const page = await context.newPage();
await page.goto(`${WEB}/agent/${employeeId}`, { waitUntil: "domcontentloaded" });
console.log(`[demo-browser] open on ${WEB}/agent/${employeeId} — window is live; drive it by hand.`);
console.log("[demo-browser] leave this process running; kill it to close the window.");
await new Promise(() => {}); // keep the window open until the process is killed
