#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const baseUrl = process.env.UI_FIXTURE_BASE_URL ?? "http://127.0.0.1:3200";
const evidenceDir = join(root, "infra/.local/ui-fixtures");

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  throw new Error("playwright_not_installed");
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: process.env.UI_HEADLESS !== "0" });
const matrix = [];

try {
  const login = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await login.goto(`${baseUrl}/login?next=/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  await login.getByRole("heading", { name: "Return to your AI employee", exact: true }).waitFor({ timeout: 15_000 });
  await login.getByLabel("Email", { exact: true }).waitFor();
  await login.getByLabel("Password", { exact: true }).waitFor();
  await login.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  await assertMinimumTargets(login, ".login-root");
  await assertNoHorizontalOverflow(login, "login_mobile");
  await assertCanonicalTypography(login, ".login-root");
  await assertLightSurface(login, ".login-root");
  await login.screenshot({ path: join(evidenceDir, "product-shell-login-mobile.png"), fullPage: true });
  matrix.push({
    id: "product-shell-login-mobile",
    route: "/login?next=/dashboard",
    viewport: "390x844",
    checks: ["persistent_labels", "minimum_targets", "no_horizontal_overflow", "canonical_typography", "light_surface"],
    status: "PASS",
  });
  await login.close();

  const dashboard = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: "reduce" });
  await dashboard.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 30_000 });
  await dashboard.getByRole("heading", { name: "Sign in to open your employees.", exact: true }).waitFor({ timeout: 15_000 });
  await dashboard.getByRole("link", { name: "Sign in", exact: true }).waitFor();
  await assertMinimumTargets(dashboard, ".dash-root");
  await assertNoHorizontalOverflow(dashboard, "dashboard_unauthenticated_desktop");
  await assertCanonicalTypography(dashboard, ".dash-root");
  await assertLightSurface(dashboard, ".dash-root");
  await dashboard.screenshot({ path: join(evidenceDir, "product-shell-dashboard-unauthenticated.png"), fullPage: true });
  matrix.push({
    id: "product-shell-dashboard-unauthenticated",
    route: "/dashboard",
    viewport: "1440x960",
    checks: ["unauthenticated_boundary", "minimum_targets", "no_horizontal_overflow", "canonical_typography", "light_surface"],
    status: "PASS",
  });
  await dashboard.close();

  await writeFile(join(evidenceDir, "product-shell-browser-matrix.json"), `${JSON.stringify({
    schema_version: 1,
    evidence_level: "compiled_product_shell",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    matrix,
  }, null, 2)}\n`, "utf8");

  console.log("Product shell browser acceptance passed.");
} finally {
  await browser.close();
}

async function assertMinimumTargets(page, rootSelector) {
  const failures = await page.locator(`${rootSelector} button, ${rootSelector} [role="button"], ${rootSelector} a`).evaluateAll((nodes) => nodes.flatMap((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [];
    if (rect.width >= 44 && rect.height >= 44) return [];
    return [{
      label: node.getAttribute("aria-label") || node.textContent?.trim() || node.tagName,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }];
  }));
  if (failures.length) throw new Error(`minimum_target_failure:${JSON.stringify(failures)}`);
}

async function assertNoHorizontalOverflow(page, code) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (result.scrollWidth > result.clientWidth + 1) {
    throw new Error(`${code}:horizontal_overflow:${result.scrollWidth}:${result.clientWidth}`);
  }
}

async function assertCanonicalTypography(page, rootSelector) {
  const families = await page.locator(rootSelector).evaluate((node) => {
    const values = new Set();
    values.add(getComputedStyle(node).fontFamily);
    node.querySelectorAll("*").forEach((child) => values.add(getComputedStyle(child).fontFamily));
    return [...values];
  });
  const forbidden = families.filter((family) => /IBM Plex Mono|ui-monospace|monospace/i.test(family));
  if (forbidden.length) throw new Error(`forbidden_product_typography:${JSON.stringify(forbidden)}`);
}

async function assertLightSurface(page, rootSelector) {
  const background = await page.locator(rootSelector).evaluate((node) => getComputedStyle(node).backgroundColor);
  const match = background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return;
  const [, r, g, b] = match.map(Number);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luminance < 0.65) throw new Error(`product_surface_not_light:${background}`);
}
