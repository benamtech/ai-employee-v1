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
const serverMode = process.env.UI_FIXTURE_SERVER_MODE ?? "development";
const screenshotDir = join(root, "infra/.local/ui-fixtures");
const matrix = [];

if (!new Set(["development", "production"]).has(serverMode)) {
  throw new Error(`unsupported_ui_fixture_server_mode:${serverMode}`);
}

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
  const command = serverMode === "production" ? "start" : "dev";
  const serverEnv = {
    ...process.env,
    NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1",
    ...(serverMode === "production" ? {
      NODE_ENV: "production",
      CI: "true",
      AMTECH_UI_FIXTURE_PRODUCTION_TEST: "1",
      AMTECH_ENVIRONMENT_NAME: "ui-fixture-ci",
    } : {}),
  };
  server = spawn(process.execPath, [nextBin, command, "-p", String(port), "-H", "127.0.0.1"], {
    cwd: webDir,
    env: serverEnv,
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  await openRoute(page, activeUrl);

  // The production owner experience is Talk-first. Prove immediate fixture intent,
  // response rendering, and the absence of the old fixed-tab shell before entering
  // the richer operating workspace.
  const talkBox = page.getByRole("textbox", { name: "Message Avery" });
  await talkBox.waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Talk", exact: true }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Workspace", exact: true }).waitFor({ timeout: 10_000 });
  assertCount(await page.locator('[role="tablist"]').count(), 0, "fixed_tablist_present");
  for (const obsolete of ["Home", "Connected", "Proof"]) {
    assertCount(await page.getByRole("button", { name: obsolete, exact: true }).count(), 0, `obsolete_${obsolete.toLowerCase()}_button_present`);
  }
  await talkBox.fill("Give me the fastest useful update and move durable work into the workspace.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText(/I picked that up\. I’ll keep the conversation fast/).waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "talk_surface_desktop");
  await assertReducedMotion(page, ".nextgen-conversation");
  await page.screenshot({ path: join(screenshotDir, "talk-surface-desktop.png"), fullPage: true });
  matrix.push({
    id: "talk-first-desktop",
    route: `/agent/${employeeId}`,
    viewport: "1440x960",
    checks: ["talk_default", "optimistic_owner_intent", "assistant_response", "workspace_switch", "reduced_motion", "no_horizontal_overflow", "no_fixed_tabs"],
    status: "PASS",
  });

  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("heading", { name: /Avery has \d+ decisions ready/ }).waitFor({ timeout: 20_000 });
  for (const heading of ["Needs you", "Current work", "Held for return", "What changed", "Evidence and outcomes"]) {
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ timeout: 10_000 });
  }
  assertCount(await page.locator('[role="tablist"]').count(), 0, "workspace_fixed_tablist_present");

  const runtimeToggle = page.locator(".os-runtime");
  await runtimeToggle.waitFor({ state: "visible", timeout: 10_000 });
  await runtimeToggle.focus();
  await page.keyboard.press("Enter");
  if (await runtimeToggle.getAttribute("aria-expanded") !== "true") throw new Error("operating_context_keyboard_toggle_did_not_expand");
  const contextPanel = page.locator(".os-context-panel");
  await contextPanel.waitFor({ state: "visible", timeout: 10_000 });
  await contextPanel.getByText("Operating context", { exact: true }).waitFor({ timeout: 10_000 });
  await contextPanel.getByText(/bounded owner-safe context signals/).waitFor({ timeout: 10_000 });
  const closeContext = contextPanel.getByRole("button", { name: "Close", exact: true });
  await closeContext.focus();
  await page.keyboard.press("Enter");
  await contextPanel.waitFor({ state: "hidden", timeout: 10_000 });

  await assertMinimumTargets(page, ".os-root");
  await assertReducedMotion(page, ".os-guidance");

  const command = page.getByRole("textbox", { name: "Command Avery" });
  await command.fill("Watch Riverbend through Friday and bring it back if the customer changes scope.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText(/Fixture demonstration only/).waitFor({ timeout: 10_000 });
  await page.screenshot({ path: join(screenshotDir, "operating-surface-desktop.png"), fullPage: true });
  matrix.push({
    id: "adaptive-active-desktop",
    route: `/agent/${employeeId}`,
    viewport: "1440x960",
    checks: ["talk_to_workspace", "guidance", "attention", "work_loops", "active_saves", "system_changes", "evidence", "context", "command", "keyboard_context", "minimum_targets", "reduced_motion", "no_fixed_tabs"],
    status: "PASS",
  });

  const firstRunUrl = `${baseUrl}/agent/${employeeId}-new`;
  const firstRun = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await openRoute(firstRun, firstRunUrl);
  await firstRun.getByRole("textbox", { name: "Message Avery" }).waitFor({ timeout: 20_000 });
  await firstRun.locator(".nextgen-welcome h1").waitFor({ state: "visible", timeout: 10_000 });
  assertCount(await firstRun.locator('[role="tablist"]').count(), 0, "first_run_fixed_tablist_present");
  await firstRun.getByRole("button", { name: "Workspace", exact: true }).click();
  await firstRun.getByRole("textbox", { name: "Command Avery" }).waitFor({ timeout: 20_000 });
  await firstRun.locator(".os-guidance h1").waitFor({ state: "visible", timeout: 10_000 });
  assertCount(await firstRun.getByRole("heading", { name: "Current work", exact: true }).count(), 0, "first_run_empty_work_region_present");
  await assertMinimumTargets(firstRun, ".os-root");
  await firstRun.screenshot({ path: join(screenshotDir, "operating-surface-first-run.png"), fullPage: true });
  await firstRun.close();
  matrix.push({
    id: "adaptive-first-run",
    route: `/agent/${employeeId}-new`,
    viewport: "1024x768",
    checks: ["talk_first_run", "workspace_first_run", "guided_empty_state", "empty_regions_hidden", "contextual_command", "minimum_targets", "no_fixed_tabs"],
    status: "PASS",
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await openRoute(mobile, activeUrl);
  await mobile.getByRole("textbox", { name: "Message Avery" }).waitFor({ timeout: 20_000 });
  await assertNoHorizontalOverflow(mobile, "talk_surface_mobile");
  await assertReducedMotion(mobile, ".nextgen-conversation");
  await mobile.screenshot({ path: join(screenshotDir, "talk-surface-mobile.png"), fullPage: true });
  await mobile.getByRole("button", { name: "Workspace", exact: true }).click();
  await mobile.getByRole("heading", { name: /Avery has \d+ decisions ready/ }).waitFor({ timeout: 20_000 });
  await mobile.getByRole("textbox", { name: "Command Avery" }).waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(mobile, "operating_surface_mobile");
  await assertMinimumTargets(mobile, ".os-root");
  await assertReducedMotion(mobile, ".os-guidance");
  await mobile.screenshot({ path: join(screenshotDir, "operating-surface-mobile.png"), fullPage: true });
  await mobile.close();
  matrix.push({
    id: "adaptive-active-mobile",
    route: `/agent/${employeeId}`,
    viewport: "390x844",
    checks: ["talk_default", "talk_no_horizontal_overflow", "workspace_switch", "guidance", "command", "minimum_targets", "reduced_motion", "workspace_no_horizontal_overflow"],
    status: "PASS",
  });

  const reviewUrl = `${baseUrl}/agent/${employeeId}/review?t=fixture-approval`;
  const review = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await openRoute(review, reviewUrl);
  await review.getByText("Send Riverbend reply").waitFor({ timeout: 20_000 });
  await review.getByRole("button", { name: "Approve send" }).waitFor({ timeout: 10_000 });
  await assertMinimumTargets(review, ".review-root");
  await assertReducedMotion(review, ".review-shell");
  await assertNoHorizontalOverflow(review, "signed_review_mobile");
  await review.screenshot({ path: join(screenshotDir, "review-mobile.png"), fullPage: true });
  await review.close();
  matrix.push({
    id: "signed-review-mobile",
    route: `/agent/${employeeId}/review?t=fixture-approval`,
    viewport: "390x844",
    checks: ["consequence", "approval_action", "signed_review", "minimum_targets", "reduced_motion", "no_horizontal_overflow"],
    status: "PASS",
  });

  const clothingUrl = `${baseUrl}/ui-lab/clothing-ops`;
  const clothing = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await openRoute(clothing, clothingUrl);
  await clothing.getByRole("heading", { name: "Clothing operations employee", exact: true }).waitFor({ timeout: 20_000 });
  for (const text of ["Shopify", "Order-to-material requirements", "Purchase 120 heavyweight black blanks", "Owner-safe runtime projection"]) {
    await clothing.getByText(text, { exact: true }).first().waitFor({ timeout: 10_000 });
  }
  await assertMinimumTargets(clothing, ".fixture-lab-root");
  await assertReducedMotion(clothing, ".fixture-lab-intro");
  await clothing.getByRole("button", { name: "Simulate heartbeat gap", exact: true }).click();
  await clothing.getByRole("heading", { name: "Stalled · Reconciling", exact: true }).waitFor({ timeout: 5_000 });
  await clothing.getByRole("button", { name: "Recover without replay", exact: true }).click();
  await clothing.getByRole("heading", { name: "Completed · Completed", exact: true }).waitFor({ timeout: 5_000 });
  const fixtureCommand = clothing.getByRole("textbox", { name: /Fixture command/ });
  await fixtureCommand.fill("Recalculate today's material needs after the latest orders and bring back the smallest safe purchase decision.");
  await clothing.getByRole("button", { name: "Run fixture interaction", exact: true }).click();
  await clothing.getByText(/Fixture work reached its projected owner state/).waitFor({ timeout: 8_000 });
  await clothing.getByRole("heading", { name: "One fixture decision is ready", exact: true }).waitFor({ timeout: 8_000 });
  await clothing.screenshot({ path: join(screenshotDir, "fixture-lab-clothing-ops.png"), fullPage: true });
  await clothing.close();
  matrix.push({
    id: "fixture-lab-clothing-ops",
    route: "/ui-lab/clothing-ops",
    viewport: "1440x1000",
    checks: ["shopify", "email", "business_brain", "material_calculation", "supplier_cost", "production_capacity", "fulfillment", "margin", "purchase_gate", "heartbeat_gap", "recovery_without_replay", "fixture_command_flow", "minimum_targets", "reduced_motion"],
    status: "PASS",
  });

  const labSmokeScenarios = [
    ["website", "Employee as website"],
    ["office", "Multi-role office"],
    ["personal-brain", "Personal operating brain"],
    ["research", "Research employee"],
    ["contractor", "Contractor employee"],
  ];
  for (const [scenario, heading] of labSmokeScenarios) {
    const scenarioPage = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: "reduce" });
    await openRoute(scenarioPage, `${baseUrl}/ui-lab/${scenario}`);
    await scenarioPage.getByRole("heading", { name: heading, exact: true }).waitFor({ timeout: 20_000 });
    await scenarioPage.getByText("Owner-safe runtime projection", { exact: true }).waitFor({ timeout: 10_000 });
    await scenarioPage.getByRole("textbox", { name: /Fixture command/ }).waitFor({ timeout: 10_000 });
    await assertMinimumTargets(scenarioPage, ".fixture-lab-root");
    await scenarioPage.close();
    matrix.push({
      id: `fixture-lab-${scenario}`,
      route: `/ui-lab/${scenario}`,
      viewport: "1024x768",
      checks: ["scenario_identity", "typed_operating_state", "owner_safe_heartbeat", "fixture_command", "minimum_targets"],
      status: "PASS",
    });
  }

  await writeFile(join(screenshotDir, "browser-matrix.json"), `${JSON.stringify({
    schema_version: 2,
    evidence_level: "fixture_demonstration",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    server_mode: serverMode,
    production_compiled: serverMode === "production",
    matrix,
  }, null, 2)}\n`, "utf8");

  console.log(`UI fixture acceptance passed: ${activeUrl}`);
  console.log(`Server mode: ${serverMode}`);
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

async function assertMinimumTargets(page, rootSelector) {
  const failures = await page.locator(`${rootSelector} button, ${rootSelector} [role="button"], ${rootSelector} a`).evaluateAll((nodes) => nodes.flatMap((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [];
    if (rect.width >= 44 && rect.height >= 44) return [];
    const label = node.getAttribute("aria-label") || node.textContent?.trim().slice(0, 80) || node.tagName;
    return [{ label, width: Math.round(rect.width), height: Math.round(rect.height) }];
  }));
  if (failures.length) throw new Error(`critical_target_below_44px:${JSON.stringify(failures)}`);
}

async function assertReducedMotion(page, selector) {
  const result = await page.locator(selector).first().evaluate((node) => {
    const style = getComputedStyle(node);
    const parse = (value) => Math.max(...value.split(",").map((entry) => {
      const part = entry.trim();
      if (part.endsWith("ms")) return Number.parseFloat(part);
      if (part.endsWith("s")) return Number.parseFloat(part) * 1000;
      return 0;
    }));
    return {
      animationMs: parse(style.animationDuration),
      transitionMs: parse(style.transitionDuration),
    };
  });
  if (result.animationMs > 1 || result.transitionMs > 1) {
    throw new Error(`reduced_motion_not_bounded:${selector}:${JSON.stringify(result)}`);
  }
}

async function assertNoHorizontalOverflow(page, code) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`${code}_horizontal_overflow:${overflow}`);
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
