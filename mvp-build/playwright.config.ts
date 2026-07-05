import { defineConfig } from "@playwright/test";

/**
 * Headed browser acceptance for the Work Surface. Unlike the HTTP smoke scripts,
 * this drives the real UI and asserts UI/DB state (a connector card / status), not
 * just that some "Employee:" text appeared. Env-gated like the other live checks:
 * needs a running stack (web :3000, Manager :8080) and a provisioned employee.
 * Run: `npm i` (to install @playwright/test) then `HEADED=1 npm run test:e2e`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: (process.env.WEB_ORIGIN ?? "http://localhost:3000").replace(/\/$/, ""),
    headless: !process.env.HEADED,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
});
