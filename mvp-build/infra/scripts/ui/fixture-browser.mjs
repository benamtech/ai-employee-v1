#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import net from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");
const webDir = join(root, "apps/web");
const nextBin = join(root, "node_modules/next/dist/bin/next");
const port = Number(process.env.UI_FIXTURE_PORT ?? 3200);
const baseUrl = process.env.UI_FIXTURE_BASE_URL ?? `http://127.0.0.1:${port}`;
const employeeId = process.env.UI_FIXTURE_EMPLOYEE_ID ?? "emp_ui_fixture";
const headed = process.argv.includes("--headed") || process.env.UI_HEADLESS === "0";
const keepOpen = process.argv.includes("--keep-open");
const screenshotDir = join(root, "infra/.local/ui-fixtures");
const matrix = [];

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("Playwright is not installed. Run `npm install` in mvp-build, then `npm run local:browser-install` if Chromium is missing.");
  process.exit(1);
}

let server;
let serverError;
if (!(await serverReady())) {
  server = spawn(process.execPath, [nextBin, "dev", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: webDir,
    env: { ...process.env, NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1" },
    stdio: keepOpen ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  server.on("error", (error) => {
    serverError = error;
    console.error(`Failed to start fixture Next server: ${error.message}`);
  });
  if (!keepOpen) {
    server.stdout?.on("data", (chunk) => {
      if (process.env.UI_FIXTURE_LOGS === "1") process.stdout.write(chunk);
    });
    server.stderr?.on("data", (chunk) => {
      if (process.env.UI_FIXTURE_LOGS === "1") process.stderr.write(chunk);
    });
  }
  await waitForServer();
}

await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: !headed });
try {
  const activeUrl = `${baseUrl}/agent/${employeeId}`;
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await openRoute(page, activeUrl);
  await page.getByRole("heading", { name: /Avery has \d+ decisions ready/ }).waitFor({ timeout: 20_000 });
  for (const heading of ["Needs you", "Current work", "Held for return", "What changed", "Evidence and outcomes"]) {
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ timeout: 10_000 });
  }
  assertCount(await page.locator('[role="tablist"]').count(), 0, "fixed_tablist_present");
  for (const obsolete of ["Home", "Talk", "Connected", "Proof"]) {
    assertCount(await page.getByRole("button", { name: obsolete, exact: true }).count(), 0, `obsolete_${obsolete.toLowerCase()}_button_present`);
  }

  const runtimeToggle = page.locator(".os-runtime");
  await runtimeToggle.click();
  await runtimeToggle.waitFor({ state: "visible", timeout: 10_000 });
  if (await runtimeToggle.getAttribute("aria-expanded") !== "true") throw new Error("operating_context_toggle_did_not_expand");
  const contextPanel = page.locator(".os-context-panel");
  await contextPanel.waitFor({ state: "visible", timeout: 10_000 });
  await contextPanel.getByText("Operating context", { exact: true }).waitFor({ timeout: 10_000 });
  await contextPanel.getByText(/bounded owner-safe context signals/).waitFor({ timeout: 10_000 });
  await contextPanel.getByRole("button", { name: "Close", exact: true }).click();

  const command = page.getByRole("textbox", { name: "Command Avery" });
  await command.fill("Watch Riverbend through Friday and bring it back if the customer changes scope.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText(/Fixture demonstration only/).waitFor({ timeout: 10_000 });
  await page.screenshot({ path: join(screenshotDir, "operating-surface-desktop.png"), fullPage: true });
  matrix.push({
    id: "adaptive-active-desktop",
    route: `/agent/${employeeId}`,
    viewport: "1440x960",
    checks: ["guidance", "attention", "work_loops", "active_saves", "system_changes", "evidence", "context", "command", "no_fixed_tabs"],
    status: "PASS",
  });

  const firstRunUrl = `${baseUrl}/agent/${employeeId}-new`;
  const firstRun = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await openRoute(firstRun, firstRunUrl);
  await firstRun.getByRole("heading", { name: "Avery is ready", exact: true }).waitFor({ timeout: 20_000 });
  await firstRun.getByRole("textbox", { name: "Command Avery" }).waitFor({ timeout: 10_000 });
  assertCount(await firstRun.getByRole("heading", { name: "Current work", exact: true }).count(), 0, "first_run_empty_work_region_present");
  assertCount(await firstRun.locator('[role="tablist"]').count(), 0, "first_run_fixed_tablist_present");
  await firstRun.screenshot({ path: join(screenshotDir, "operating-surface-first-run.png"), fullPage: true });
  await firstRun.close();
  matrix.push({
    id: "adaptive-first-run",
    route: `/agent/${employeeId}-new`,
    viewport: "1024x768",
    checks: ["guided_empty_state", "empty_regions_hidden", "contextual_command", "no_fixed_tabs"],
    status: "PASS",
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await openRoute(mobile, activeUrl);
  await mobile.getByRole("heading", { name: /Avery has \d+ decisions ready/ }).waitFor({ timeout: 20_000 });
  await mobile.getByRole("textbox", { name: "Command Avery" }).waitFor({ timeout: 10_000 });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`mobile_horizontal_overflow:${overflow}`);
  await mobile.screenshot({ path: join(screenshotDir, "operating-surface-mobile.png"), fullPage: true });
  await mobile.close();
  matrix.push({
    id: "adaptive-active-mobile",
    route: `/agent/${employeeId}`,
    viewport: "390x844",
    checks: ["guidance", "command", "no_horizontal_overflow"],
    status: "PASS",
  });

  const reviewUrl = `${baseUrl}/agent/${employeeId}/review?t=fixture-approval`;
  const review = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await openRoute(review, reviewUrl);
  await review.getByText("Send Riverbend reply").waitFor({ timeout: 20_000 });
  await review.getByRole("button", { name: "Approve send" }).waitFor({ timeout: 10_000 });
  await review.screenshot({ path: join(screenshotDir, "review-mobile.png"), fullPage: true });
  await review.close();
  matrix.push({
    id: "signed-review-mobile",
    route: `/agent/${employeeId}/review?t=fixture-approval`,
    viewport: "390x844",
    checks: ["consequence", "approval_action", "signed_review"],
    status: "PASS",
  });

  await writeFile(join(screenshotDir, "browser-matrix.json"), `${JSON.stringify({
    schema_version: 1,
    evidence_level: "fixture_demonstration",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    matrix,
  }, null, 2)}\n`, "utf8");

  console.log(`UI fixture acceptance passed: ${activeUrl}`);
  console.log(`Evidence: ${screenshotDir}`);

  if (keepOpen) {
    console.log("Keeping headed browser open. Press Ctrl+C to stop.");
    await new Promise(() => {});
  }
} finally {
  if (!keepOpen) await browser.close();
  if (server && !keepOpen) server.kill("SIGTERM");
}

function assertCount(actual, expected, code) {
  if (actual !== expected) throw new Error(`${code}:expected_${expected}:actual_${actual}`);
}

async function openRoute(page, url) {
  await waitForAppRoute(url);
  await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
}

async function serverReady() {
  const url = new URL(baseUrl);
  const readyPort = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: url.hostname, port: readyPort, timeout: 1000 }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 45_000) {
    if (serverError) throw serverError;
    if (server?.exitCode !== null) throw new Error(`ui_fixture_server_exited:${server.exitCode ?? "unknown"}`);
    if (await serverReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server?.kill("SIGTERM");
  throw new Error(`ui_fixture_server_timeout:${baseUrl}`);
}

async function waitForAppRoute(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    if (response.ok || response.status < 500) return;
    throw new Error(`status_${response.status}`);
  } catch (error) {
    throw new Error(`ui_fixture_route_unavailable:${url}:${error instanceof Error ? error.message : String(error)}`);
  }
}
