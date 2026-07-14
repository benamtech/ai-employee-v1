import { describe, expect, it } from "vitest";
import {
  assertUiFixturesAllowed,
  isProductionLikeEnvironment,
  isUiFixtureRequested,
  uiFixtureMode,
} from "../../apps/web/app/_lib/ui-fixtures";

describe("UI fixture mode policy", () => {
  it("allows fixture mode for local UI development", () => {
    const env = { NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1", NODE_ENV: "development", AMTECH_ENVIRONMENT_NAME: "local" };
    expect(isUiFixtureRequested(env)).toBe(true);
    expect(isProductionLikeEnvironment(env)).toBe(false);
    expect(uiFixtureMode(env)).toBe(true);
  });

  it("rejects fixture mode in production", () => {
    const env = { NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1", NODE_ENV: "production", AMTECH_ENVIRONMENT_NAME: "local" };
    expect(() => assertUiFixturesAllowed(env)).toThrow(/not allowed/);
  });

  it("rejects fixture mode in pod-like, staging, or explicit production-like environments", () => {
    for (const env of [
      { NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1", NODE_ENV: "development", AMTECH_ENVIRONMENT_NAME: "pod-alpha" },
      { NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1", NODE_ENV: "development", AMTECH_ENVIRONMENT_NAME: "staging" },
      { NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1", NODE_ENV: "development", AMTECH_PRODUCTION_LIKE: "1" },
    ]) {
      expect(() => assertUiFixturesAllowed(env)).toThrow(/not allowed/);
    }
  });

  it("does not block production-like environments when fixture mode is disabled", () => {
    const env = { NODE_ENV: "production", AMTECH_ENVIRONMENT_NAME: "pod-alpha" };
    expect(uiFixtureMode(env)).toBe(false);
  });
});
