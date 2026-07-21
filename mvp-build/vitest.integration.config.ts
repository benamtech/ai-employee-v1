import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against REAL provider creds (Supabase/Twilio/Stripe/Gmail)
 * and are excluded from `test:unit`. Each test self-gates on the env it needs
 * (describe.skipIf), so a missing live env produces a clean skip, never a mock pass.
 * Provider mocks are forbidden here (00-source-of-truth-and-rules.md "Realness Rules").
 * Workspace aliases keep collection source-exact on a clean checkout without making
 * an unrelated prebuild a prerequisite for PostgreSQL integration evidence.
 */
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
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
