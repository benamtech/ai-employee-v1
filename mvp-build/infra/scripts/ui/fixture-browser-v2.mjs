#!/usr/bin/env node
import { execFileSync } from "node:child_process";
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

if (!new Set(["development", "production"]).has(serverMode)) throw new Error(`unsupported_ui_fixture_server_mode:${serverMode}`);

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
    AMTECH_UI_LAB_WRITE: serverMode === "development" ? "1" : "0",
    ...(serverMode === "production" ? {
      NODE_ENV: "production",
      CI: "true",
      AMTECH_UI_FIXTURE_PRODUCTION_TEST: "1",
      AMTECH_ENVIRONMENT_NAME: "ui-fixture-ci",
    } : {
      NODE_ENV: "development",
      AMTECH_ENVIRONMENT_NAME: "ui-lab-browser",
    }),
  };
  const commandArgs = [nextBin, command, "-p", String(port), "-H", "127.0.0.1"];
  if (serverMode === "development") commandArgs.push("--turbopack");
  server = spawn(process.execPath, commandArgs, {
    cwd: webDir,
    env: serverEnv,
    stdio: keepOpen ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  server.on("error", (error) => {
    serverError = error;
    console.error(`Failed to start fixture Next server: ${error.message}`);
  });
  if (!keepOpen) {
    server.stdout?.on("data", (chunk) => { if (process.env.UI_FIXTURE_LOGS === "1") process.stdout.write(chunk); });
    server.stderr?.on("data", (chunk) => { if (process.env.UI_FIXTURE_LOGS === "1") process.stderr.write(chunk); });
  }
  await waitForServer();
}

await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: !headed });
try {
  await verifyOwnerClient(browser);
  await verifyUiLabWorkbench(browser);
  const gitSha = resolveGitSha();
  const evidence = {
    schema: "amtech.ui-lab-evidence.v1",
    status: "PASS",
    git_sha: gitSha,
    generated_at: new Date().toISOString(),
    evidence_level: serverMode === "production" ? "compiled_browser" : "development_browser",
    base_url: baseUrl,
    server_mode: serverMode,
    production_compiled: serverMode === "production",
    matrix,
  };
  await writeFile(join(screenshotDir, "browser-matrix.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  await writeFile(join(screenshotDir, `ui-lab-evidence-${gitSha}.json`), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(`UI fixture and workbench acceptance passed at ${gitSha}`);
  console.log(`Evidence: ${screenshotDir}`);
  if (keepOpen) {
    console.log("Keeping headed browser open. Press Ctrl+C to stop.");
    await new Promise(() => {});
  }
} finally {
  if (!keepOpen) await browser.close();
  if (server && !keepOpen) server.kill("SIGTERM");
}

async function verifyOwnerClient(browser) {
  const activeUrl = `${baseUrl}/agent/${employeeId}`;
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  await openRoute(page, activeUrl);
  const talkBox = page.getByRole("textbox", { name: "Message Avery" });
  await talkBox.waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Talk", exact: true }).waitFor();
  await page.getByRole("button", { name: "Workspace", exact: true }).waitFor();
  assertCount(await page.locator('[role="tablist"]').count(), 0, "fixed_tablist_present");
  await talkBox.fill("Give me the fastest useful update and move durable work into the workspace.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByText(/I picked that up\. I’ll keep the conversation fast/).waitFor({ timeout: 10_000 });
  await assertNoHorizontalOverflow(page, "talk_surface_desktop");
  await assertReducedMotion(page, ".nextgen-conversation");
  await page.screenshot({ path: join(screenshotDir, "talk-surface-desktop.png"), fullPage: true });
  matrix.push({ id: "talk-first-desktop", route: `/agent/${employeeId}`, viewport: "1440x960", checks: ["talk_default", "optimistic_owner_intent", "assistant_response", "workspace_switch", "reduced_motion", "no_horizontal_overflow"], status: "PASS" });

  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("heading", { name: /Avery has \d+ decisions ready/ }).waitFor({ timeout: 20_000 });
  for (const heading of ["Needs you", "Current work", "Held for return", "What changed", "Evidence and outcomes"]) {
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ timeout: 10_000 });
  }
  await assertMinimumTargets(page, ".os-root");
  await assertNoHorizontalOverflow(page, "workspace_desktop");
  await page.screenshot({ path: join(screenshotDir, "operating-surface-desktop.png"), fullPage: true });
  matrix.push({ id: "workspace-desktop", route: `/agent/${employeeId}`, viewport: "1440x960", checks: ["workspace_regions", "minimum_targets", "no_horizontal_overflow"], status: "PASS" });
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await openRoute(mobile, activeUrl);
  await mobile.getByRole("textbox", { name: "Message Avery" }).waitFor({ timeout: 20_000 });
  await assertNoHorizontalOverflow(mobile, "talk_surface_mobile");
  await mobile.getByRole("button", { name: "Workspace", exact: true }).click();
  await mobile.getByRole("textbox", { name: "Command Avery" }).waitFor({ timeout: 20_000 });
  await assertNoHorizontalOverflow(mobile, "workspace_mobile");
  await assertMinimumTargets(mobile, ".os-root");
  await mobile.screenshot({ path: join(screenshotDir, "operating-surface-mobile.png"), fullPage: true });
  await mobile.close();
  matrix.push({ id: "owner-client-mobile", route: `/agent/${employeeId}`, viewport: "390x844", checks: ["talk", "workspace", "minimum_targets", "no_horizontal_overflow"], status: "PASS" });

  const review = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await openRoute(review, `${baseUrl}/agent/${employeeId}/review?t=fixture-approval`);
  await review.getByText("Send Riverbend reply").waitFor({ timeout: 20_000 });
  await review.getByRole("button", { name: "Approve send" }).waitFor();
  await assertMinimumTargets(review, ".review-root");
  await assertNoHorizontalOverflow(review, "signed_review_mobile");
  await review.screenshot({ path: join(screenshotDir, "review-mobile.png"), fullPage: true });
  await review.close();
  matrix.push({ id: "signed-review-mobile", route: `/agent/${employeeId}/review?t=fixture-approval`, viewport: "390x844", checks: ["consequence", "approval_action", "minimum_targets", "no_horizontal_overflow"], status: "PASS" });
}

async function verifyUiLabWorkbench(browser) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 }, reducedMotion: "reduce" });
  await openRoute(page, `${baseUrl}/ui-lab/fixtures`);
  await page.getByRole("heading", { name: "Fixture gallery", exact: true }).waitFor({ timeout: 20_000 });
  await page.getByText("Explicit fixture evidence", { exact: true }).waitFor();
  await page.getByRole("link", { name: /Clothing operations employee/ }).waitFor();
  await assertNoHorizontalOverflow(page, "ui_lab_fixtures_desktop");

  await openRoute(page, `${baseUrl}/ui-lab/clothing-ops`);
  await page.waitForURL(/\/ui-lab\/fixtures\?scenario=clothing-ops/, { timeout: 20_000 });

  await openRoute(page, `${baseUrl}/ui-lab/preview/clothing-ops?adapter=owner_web&theme=studio&layout=canvas&components=editorial&density=balanced&mode=workspace_fixture`);
  await page.locator('[data-ui-adapter="owner_web"]').waitFor({ timeout: 30_000 });
  await page.locator('[data-ui-theme="studio"]').waitFor({ timeout: 20_000 });
  await page.getByRole("textbox", { name: /Command/ }).waitFor({ timeout: 20_000 });
  await assertMinimumTargets(page, ".ui-lab-preview-root");
  await assertNoHorizontalOverflow(page, "ui_lab_fixture_preview_desktop");
  await page.screenshot({ path: join(screenshotDir, "ui-lab-fixture-preview-clothing-ops.png"), fullPage: true });

  const registryResponse = await page.request.get(`${baseUrl}/api/ui-lab/presets`);
  if (!registryResponse.ok()) throw new Error(`ui_lab_registry_get_failed:${registryResponse.status()}`);
  const registry = await registryResponse.json();
  if (!registry.presets.some((preset) => preset.preset_ref === "ecommerce-manager@v0001")) throw new Error("ui_lab_seed_preset_missing");
  if (serverMode === "production") {
    const writeResponse = await page.request.post(`${baseUrl}/api/ui-lab/presets`, { data: {} });
    if (writeResponse.status() !== 403) throw new Error(`ui_lab_production_write_not_denied:${writeResponse.status()}`);
  }
  await page.close();
  matrix.push({ id: "ui-lab-fixtures-clothing", route: "/ui-lab/fixtures + /ui-lab/preview/clothing-ops", viewport: "1600x1050", checks: ["explicit_fixture_route", "legacy_redirect", "production_preview", "registry_read", "write_guard"], status: "PASS" });

  for (const scenario of ["website", "office", "personal-brain", "research", "contractor"]) {
    const scenarioPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await openRoute(scenarioPage, `${baseUrl}/ui-lab/${scenario}`);
    await scenarioPage.waitForURL(new RegExp(`/ui-lab/fixtures\\?scenario=${scenario}`), { timeout: 20_000 });
    await scenarioPage.getByRole("heading", { name: "Fixture gallery", exact: true }).waitFor({ timeout: 20_000 });
    await assertNoHorizontalOverflow(scenarioPage, `ui_lab_fixture_redirect_${scenario}`);
    await scenarioPage.close();
    matrix.push({ id: `ui-lab-${scenario}`, route: `/ui-lab/${scenario}`, viewport: "1280x900", checks: ["legacy_redirect", "explicit_fixture_route", "no_horizontal_overflow"], status: "PASS" });
  }
}

function resolveGitSha() {
  const candidate = process.env.GITHUB_SHA ?? "";
  if (/^[0-9a-f]{40}$/.test(candidate)) return candidate;
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
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
    return { animationMs: parse(style.animationDuration), transitionMs: parse(style.transitionDuration) };
  });
  if (result.animationMs > 1 || result.transitionMs > 1) throw new Error(`reduced_motion_not_bounded:${selector}:${JSON.stringify(result)}`);
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
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host: url.hostname, port: readyPort, timeout: 1000 }, () => {
      socket.end();
      resolvePromise(true);
    });
    socket.on("timeout", () => { socket.destroy(); resolvePromise(false); });
    socket.on("error", () => resolvePromise(false));
  });
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (serverError) throw serverError;
    if (server?.exitCode !== null) throw new Error(`ui_fixture_server_exited:${server.exitCode ?? "unknown"}`);
    if (await serverReady()) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
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
