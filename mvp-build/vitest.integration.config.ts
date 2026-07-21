import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against real provider/database boundaries and are excluded
 * from unit tests. Missing provider credentials produce explicit skips. Direct
 * PostgreSQL suites share one disposable ledger, so files run serially; queue and
 * fixed-identity tests create their own run-scoped data or isolated database.
 */
if (!process.env.STAGING_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.STAGING_DATABASE_URL = process.env.DATABASE_URL;
}

export default defineConfig({
  resolve: {
    alias: {
      "@amtech/shared": fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url)),
      "@amtech/db": fileURLToPath(new URL("./packages/db/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules/**"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
