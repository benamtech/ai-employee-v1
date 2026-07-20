import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["tests/unit/setup-env.ts"],
    // Provider mocks are allowed ONLY in unit tests, never in MVP acceptance
    // (00-source-of-truth-and-rules.md "Realness Rules"). Integration/golden-path
    // tests run against real provider test creds and are excluded from `test:unit`.
    exclude: ["tests/integration/**", "tests/golden-path/**", "node_modules/**"],
  },
});
