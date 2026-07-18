#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, runMeasured } from "./lib.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: pnpm test\nRuns every unit/source test plus blank-PostgreSQL integration tests in parallel, denies non-loopback network access, and enforces the local 10s/4GB budget. It never installs packages or pulls images.");
  process.exit(0);
}
if (!existsSync(join(ROOT, "mvp-build", "node_modules"))) {
  console.error("mvp-build/node_modules missing. Run: npm --prefix mvp-build ci");
  process.exit(1);
}
await runMeasured({
  label: "test",
  command: process.execPath,
  args: [join(ROOT, "scripts", "local-prod", "test-runner.mjs")],
  budgetSeconds: Number(process.env.LOCAL_PROD_TEST_BUDGET_SECONDS ?? 10),
  maxRssMb: Number(process.env.LOCAL_PROD_TEST_MAX_RSS_MB ?? 4096),
});
