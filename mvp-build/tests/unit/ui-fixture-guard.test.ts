import { describe, expect, it } from "vitest";
import {
  assertUiFixturesAllowed,
  isCompiledFixtureCiTest,
  uiFixtureMode,
  type UiFixtureEnv,
} from "../../apps/web/app/_lib/ui-fixtures.js";

const requested = (overrides: Partial<UiFixtureEnv> = {}): UiFixtureEnv => ({
  NEXT_PUBLIC_AMTECH_UI_FIXTURES: "1",
  NODE_ENV: "development",
  ...overrides,
});

describe("UI fixture production boundary", () => {
  it("allows ordinary local development fixtures", () => {
    expect(uiFixtureMode(requested())).toBe(true);
  });

  it("denies fixture data in production by default", () => {
    expect(() => assertUiFixturesAllowed(requested({ NODE_ENV: "production" })))
      .toThrow("not allowed in production-like environments");
  });

  it("does not treat CI alone as sufficient authority", () => {
    expect(() => assertUiFixturesAllowed(requested({ NODE_ENV: "production", CI: "true" })))
      .toThrow("not allowed in production-like environments");
  });

  it("allows only the exact compiled fixture browser-test tuple", () => {
    const env = requested({
      NODE_ENV: "production",
      CI: "true",
      AMTECH_UI_FIXTURE_PRODUCTION_TEST: "1",
      AMTECH_ENVIRONMENT_NAME: "ui-fixture-ci",
    });
    expect(isCompiledFixtureCiTest(env)).toBe(true);
    expect(uiFixtureMode(env)).toBe(true);
  });

  it("denies the escape hatch under staging, pod, or production names", () => {
    for (const name of ["staging", "prod", "production", "employee-pod"]) {
      const env = requested({
        NODE_ENV: "production",
        CI: "true",
        AMTECH_UI_FIXTURE_PRODUCTION_TEST: "1",
        AMTECH_ENVIRONMENT_NAME: name,
      });
      expect(isCompiledFixtureCiTest(env)).toBe(false);
      expect(() => assertUiFixturesAllowed(env)).toThrow("not allowed in production-like environments");
    }
  });
});
