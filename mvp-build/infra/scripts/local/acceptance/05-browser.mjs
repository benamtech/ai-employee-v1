#!/usr/bin/env node
import { loadState, printResult, webBase } from "./_lib.mjs";

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("Playwright is not installed. Run `npm install` after the package.json update.");
  process.exit(1);
}

const state = await loadState();
const browser = await chromium.launch({ headless: process.env.LOCAL_BROWSER_HEADLESS !== "0" });
try {
  const context = await browser.newContext();
  await context.addCookies([{
    name: "amtech_owner_session",
    value: state.owner_session_token,
    url: webBase(),
    httpOnly: true,
    sameSite: "Lax",
  }]);
  const page = await context.newPage();
  await page.goto(`${webBase()}${state.web_route}`, { waitUntil: "networkidle" });
  await page.getByText("Talk to your employee").waitFor({ timeout: 15_000 });
  const input = page.getByPlaceholder("Text your employee...");
  await input.fill(process.env.LOCAL_ACCEPTANCE_BROWSER_MESSAGE ?? "Write a concise estimate intake question for a repaint lead.");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText("Employee:").waitFor({ timeout: 120_000 });
  const body = await page.locator("main").innerText();
  printResult("browser Work Surface chat", body.includes("Employee:"), body.split("\n").slice(-8).join(" | "));
} finally {
  await browser.close();
}

