#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
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

const browser = await chromium.launch({ headless: !headed });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const url = `${baseUrl}/agent/${employeeId}`;
  await waitForAppRoute(url);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.getByText("Avery is here.").waitFor({ timeout: 20_000 });
  await page.getByRole("heading", { name: "Needs your say" }).waitFor({ timeout: 10_000 });
  await page.getByText("Riverbend reply is ready").waitFor({ timeout: 10_000 });

  await page.locator(".featured-review").getByRole("button", { name: "Approve send" }).waitFor({ timeout: 10_000 });

  const screenshotDir = join(root, "infra/.local/ui-fixtures");
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: join(screenshotDir, "work-surface-desktop.png"), fullPage: true });

  await page.getByRole("button", { name: "Talk", exact: true }).click();
  await page.getByPlaceholder("Tell Avery what happened or what you want done...").fill("Add a fixture note for the UI review.");
  await page.getByRole("button", { name: "Send to Avery", exact: true }).click();
  await page.getByText("I picked that up.").waitFor({ timeout: 10_000 });

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.locator(".featured-review").getByRole("button", { name: "Approve send" }).scrollIntoViewIfNeeded();
  await page.locator(".featured-review").getByRole("button", { name: "Approve send" }).click();
  await page.locator(".avery-banner").getByText("Approved. Avery can continue.").waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Connected", exact: true }).click();
  await page.getByRole("heading", { name: "What Avery can do" }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Proof", exact: true }).click();
  await page.locator(".proof-list").getByText("Approved. Avery can continue.").waitFor({ timeout: 10_000 });
  await page.screenshot({ path: join(screenshotDir, "proof-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await mobile.getByText("Avery is here.").waitFor({ timeout: 20_000 });
  await mobile.screenshot({ path: join(screenshotDir, "work-surface-mobile.png"), fullPage: false });
  await mobile.close();

  // Signed mobile review surface (Phase 3), fixture mode — no Manager/creds.
  const reviewUrl = `${baseUrl}/agent/${employeeId}/review?t=fixture-approval`;
  const review = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await waitForAppRoute(reviewUrl);
  await review.goto(reviewUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await review.getByText("Send Riverbend reply").waitFor({ timeout: 20_000 });
  await review.getByRole("button", { name: "Approve send" }).waitFor({ timeout: 10_000 });
  await review.screenshot({ path: join(screenshotDir, "review-mobile.png"), fullPage: true });
  await review.close();

  console.log(`UI fixture smoke passed: ${url}`);
  console.log(`Screenshots: ${screenshotDir}`);

  if (keepOpen) {
    console.log("Keeping headed browser open. Press Ctrl+C to stop.");
    await new Promise(() => {});
  }
} finally {
  if (!keepOpen) await browser.close();
  if (server && !keepOpen) server.kill("SIGTERM");
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
    const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    if (res.ok || res.status < 500) return;
    throw new Error(`status_${res.status}`);
  } catch (error) {
    throw new Error(`ui_fixture_route_unavailable:${url}:${error instanceof Error ? error.message : String(error)}`);
  }
}
