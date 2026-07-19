export interface UiFixtureEnv {
  NEXT_PUBLIC_AMTECH_UI_FIXTURES?: string;
  NODE_ENV?: string;
  AMTECH_ENVIRONMENT_NAME?: string;
  AMTECH_PRODUCTION_LIKE?: string;
  AMTECH_UI_FIXTURE_PRODUCTION_TEST?: string;
  CI?: string;
}

const PRODUCTION_LIKE_NAME = /(^|[-_])(pod|prod|production|staging)([-_]|$)/i;
const COMPILED_FIXTURE_TEST_ENVIRONMENT = "ui-fixture-ci";

export function isUiFixtureRequested(env: UiFixtureEnv = process.env): boolean {
  return env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";
}

export function isProductionLikeEnvironment(env: UiFixtureEnv = process.env): boolean {
  if (env.NODE_ENV === "production") return true;
  if (env.AMTECH_PRODUCTION_LIKE === "1") return true;
  return PRODUCTION_LIKE_NAME.test(env.AMTECH_ENVIRONMENT_NAME ?? "");
}

/**
 * Allows fixture data in a compiled Next production build only inside the
 * exact CI browser-test tuple. This is not a staging or deployment mode: the
 * environment name is deliberately non-production-like and every condition
 * must be present at both build and server start.
 */
export function isCompiledFixtureCiTest(env: UiFixtureEnv = process.env): boolean {
  return env.NODE_ENV === "production"
    && env.CI === "true"
    && env.AMTECH_UI_FIXTURE_PRODUCTION_TEST === "1"
    && env.AMTECH_ENVIRONMENT_NAME === COMPILED_FIXTURE_TEST_ENVIRONMENT;
}

export function assertUiFixturesAllowed(env: UiFixtureEnv = process.env): void {
  if (!isUiFixtureRequested(env)) return;
  if (!isProductionLikeEnvironment(env)) return;
  if (isCompiledFixtureCiTest(env)) return;
  throw new Error("NEXT_PUBLIC_AMTECH_UI_FIXTURES is not allowed in production-like environments");
}

export function uiFixtureMode(env: UiFixtureEnv = process.env): boolean {
  const enabled = isUiFixtureRequested(env);
  if (enabled) assertUiFixturesAllowed(env);
  return enabled;
}
