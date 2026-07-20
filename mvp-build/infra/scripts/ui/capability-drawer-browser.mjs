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
const serverMode = process.env.UI_FIXTURE_SERVER_MODE ?? "development";
const screenshotDir = join(root, "infra/.local/ui-fixtures");

if (!new Set(["development", "production"]).has(serverMode)) {
  throw new Error(`unsupported_ui_fixture_server_mode:${serverMode}`);
}

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("Playwright is not installed. Run npm install and install Chromium first.");
  process.exit(1);
}

let server;
let serverError;
if (!(await serverReady())) {
  const command = serverMode === "production" ? "start" : "dev";
  server = spawn(process.execPath, [nextBin, command, "-p", String(port), "-H", "127.0.0.1"], {
    cwd: webDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1",
      ...(serverMode === "production" ? {
        NODE_ENV: "production",
        CI: "true",
        AMTECH_UI_FIXTURE_PRODUCTION_TEST: "1",
        AMTECH_ENVIRONMENT_NAME: "ui-fixture-ci",
      } : {}),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.on("error", (error) => { serverError = error; });
  if (process.env.UI_FIXTURE_LOGS === "1") {
    server.stdout?.on("data", (chunk) => process.stdout.write(chunk));
    server.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  }
  await waitForServer();
}

await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: process.env.UI_HEADLESS !== "0" });
const evidence = {
  schema_version: 2,
  evidence_level: "compiled_fixture_interaction",
  generated_at: new Date().toISOString(),
  route: `/agent/${employeeId}`,
  server_mode: serverMode,
  production_compiled: serverMode === "production",
  checks: [],
};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  const directToolRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/manager/mcp") || url.includes("tools/call")) directToolRequests.push(url);
  });
  await page.goto(`${baseUrl}/agent/${employeeId}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.getByRole("textbox", { name: "Message Avery" }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("heading", { name: /Avery has \d+ decisions ready/ }).waitFor({ timeout: 20_000 });
  evidence.checks.push("talk_first_workspace_entry");

  const launch = page.getByRole("button", { name: /Ways to move this work/ });
  await launch.waitFor({ timeout: 10_000 });
  await launch.click();
  const drawer = page.getByRole("complementary", { name: "Tools mapped to current work" });
  await drawer.waitFor({ state: "visible", timeout: 10_000 });
  await drawer.getByRole("heading", { name: "How this employee can move the work", exact: true }).waitFor();
  await drawer.getByText("AMTECH Manager · manager mcp", { exact: true }).first().waitFor();
  await drawer.getByText("Draft customer email", { exact: true }).waitFor();
  await drawer.getByText("Browser research", { exact: true }).waitFor();
  await drawer.getByText("Live browser probe required", { exact: true }).waitFor();
  evidence.checks.push("server_identity", "task_mapping", "blocked_runtime_evidence");

  const stage = drawer.getByRole("button", { name: "Use for this work", exact: true }).first();
  await stage.click();
  const textarea = drawer.locator(".tc-compose textarea");
  await textarea.waitFor({ state: "visible" });
  const value = (await textarea.inputValue()).toLowerCase();
  if (!value.includes("draft customer email") || !value.includes("show the resulting evidence")) {
    throw new Error(`staged_instruction_missing_capability_and_evidence:${value}`);
  }
  if (directToolRequests.length) throw new Error(`browser_direct_tool_execution:${JSON.stringify(directToolRequests)}`);
  evidence.checks.push("editable_staged_instruction", "no_browser_mcp_execution");

  const send = drawer.getByRole("button", { name: "Send to employee", exact: true });
  if (await send.isDisabled()) throw new Error("staged_instruction_send_disabled");
  await assertMinimumTargets(page, ".tc-drawer");
  await page.screenshot({ path: join(screenshotDir, "capability-drawer-desktop.png"), fullPage: true });
  evidence.checks.push("minimum_targets", "desktop_render");
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await mobile.goto(`${baseUrl}/agent/${employeeId}`, { waitUntil: "networkidle", timeout: 90_000 });
  await mobile.getByRole("textbox", { name: "Message Avery" }).waitFor({ timeout: 20_000 });
  await mobile.getByRole("button", { name: "Workspace", exact: true }).click();
  await mobile.getByRole("button", { name: /Ways to move this work/ }).waitFor({ timeout: 20_000 });
  await mobile.getByRole("button", { name: /Ways to move this work/ }).click();
  const mobileDrawer = mobile.getByRole("complementary", { name: "Tools mapped to current work" });
  await mobileDrawer.waitFor({ state: "visible", timeout: 10_000 });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`capability_drawer_mobile_horizontal_overflow:${overflow}`);
  await assertMinimumTargets(mobile, ".tc-drawer");
  await mobile.screenshot({ path: join(screenshotDir, "capability-drawer-mobile.png"), fullPage: true });
  evidence.checks.push("mobile_workspace_entry", "mobile_no_overflow", "mobile_minimum_targets");
  await mobile.close();

  evidence.status = "PASS";
  await writeFile(join(screenshotDir, "capability-drawer-browser.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(`Capability drawer fixture acceptance passed: ${baseUrl}/agent/${employeeId}`);
} catch (error) {
  evidence.status = "FAIL";
  evidence.error = error instanceof Error ? error.message : String(error);
  await writeFile(join(screenshotDir, "capability-drawer-browser.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  throw error;
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}

async function assertMinimumTargets(page, rootSelector) {
  const failures = await page.locator(`${rootSelector} button, ${rootSelector} [role="button"], ${rootSelector} a`).evaluateAll((nodes) => nodes.flatMap((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [];
    if (rect.width >= 44 && rect.height >= 44) return [];
    const label = node.getAttribute("aria-label") || node.textContent?.trim().slice(0, 80) || node.tagName;
    return [{ label, width: Math.round(rect.width), height: Math.round(rect.height) }];
  }));
  if (failures.length) throw new Error(`capability_drawer_target_below_44px:${JSON.stringify(failures)}`);
}

async function serverReady() {
  const url = new URL(baseUrl);
  const readyPort = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: url.hostname, port: readyPort, timeout: 1000 }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.on("error", () => resolve(false));
  });
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (serverError) throw serverError;
    if (server?.exitCode !== null) throw new Error(`ui_fixture_server_exited:${server.exitCode ?? "unknown"}`);
    if (await serverReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server?.kill("SIGTERM");
  throw new Error(`ui_fixture_server_timeout:${baseUrl}`);
}
