import { defineConfig } from "vitest/config";

/**
 * Integration tests run against REAL provider creds (Supabase/Twilio/Stripe/Gmail)
 * and are excluded from `test:unit`. Each test self-gates on the env it needs
 * (describe.skipIf), so a missing live env produces a clean skip, never a mock pass.
 * Provider mocks are forbidden here (00-source-of-truth-and-rules.md "Realness Rules").
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules/**"],
    // Real network round-trips (auth admin, sign-in, cleanup) need more headroom.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
