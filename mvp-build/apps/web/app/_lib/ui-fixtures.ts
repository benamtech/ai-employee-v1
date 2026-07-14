export interface UiFixtureEnv {
  NEXT_PUBLIC_AMTECH_UI_FIXTURES?: string;
  NODE_ENV?: string;
  AMTECH_ENVIRONMENT_NAME?: string;
  AMTECH_PRODUCTION_LIKE?: string;
}

const PRODUCTION_LIKE_NAME = /(^|[-_])(pod|prod|production|staging)([-_]|$)/i;

export function isUiFixtureRequested(env: UiFixtureEnv = process.env): boolean {
  return env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";
}

export function isProductionLikeEnvironment(env: UiFixtureEnv = process.env): boolean {
  if (env.NODE_ENV === "production") return true;
  if (env.AMTECH_PRODUCTION_LIKE === "1") return true;
  return PRODUCTION_LIKE_NAME.test(env.AMTECH_ENVIRONMENT_NAME ?? "");
}

export function assertUiFixturesAllowed(env: UiFixtureEnv = process.env): void {
  if (!isUiFixtureRequested(env)) return;
  if (!isProductionLikeEnvironment(env)) return;
  throw new Error("NEXT_PUBLIC_AMTECH_UI_FIXTURES is not allowed in production-like environments");
}

export function uiFixtureMode(env: UiFixtureEnv = process.env): boolean {
  const enabled = isUiFixtureRequested(env);
  if (enabled) assertUiFixturesAllowed(env);
  return enabled;
}
