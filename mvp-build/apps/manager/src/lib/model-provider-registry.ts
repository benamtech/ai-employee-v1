export interface ModelProviderRoute {
  profile_key: string;
  provider: string;
  base_url: string;
  api_key: string;
  model: string;
}

interface ModelProviderProfileDefinition {
  key: string;
  provider: string;
  base_url_env: "MODEL_GATEWAY_UPSTREAM_BASE_URL";
  api_key_env: "MODEL_GATEWAY_PROVIDER_API_KEY";
  model_env: "MODEL_GATEWAY_UPSTREAM_MODEL";
}

const MODEL_PROVIDER_PROFILES: Readonly<Record<string, ModelProviderProfileDefinition>> = Object.freeze({
  openai_compatible: {
    key: "openai_compatible",
    provider: "openai_compatible",
    base_url_env: "MODEL_GATEWAY_UPSTREAM_BASE_URL",
    api_key_env: "MODEL_GATEWAY_PROVIDER_API_KEY",
    model_env: "MODEL_GATEWAY_UPSTREAM_MODEL",
  },
  openai: {
    key: "openai",
    provider: "openai",
    base_url_env: "MODEL_GATEWAY_UPSTREAM_BASE_URL",
    api_key_env: "MODEL_GATEWAY_PROVIDER_API_KEY",
    model_env: "MODEL_GATEWAY_UPSTREAM_MODEL",
  },
  xai: {
    key: "xai",
    provider: "xai",
    base_url_env: "MODEL_GATEWAY_UPSTREAM_BASE_URL",
    api_key_env: "MODEL_GATEWAY_PROVIDER_API_KEY",
    model_env: "MODEL_GATEWAY_UPSTREAM_MODEL",
  },
  openrouter: {
    key: "openrouter",
    provider: "openrouter",
    base_url_env: "MODEL_GATEWAY_UPSTREAM_BASE_URL",
    api_key_env: "MODEL_GATEWAY_PROVIDER_API_KEY",
    model_env: "MODEL_GATEWAY_UPSTREAM_MODEL",
  },
});

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing.`);
  return value;
}

function normalizeProfileKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function validateBaseUrl(value: string): string {
  const parsed = new URL(value);
  const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !localHttp) throw new Error("model_provider_base_url_must_be_https_or_loopback");
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

export function registeredModelProviderProfiles(): Array<{ key: string; provider: string }> {
  return Object.values(MODEL_PROVIDER_PROFILES).map(({ key, provider }) => ({ key, provider }));
}

export function resolveModelProviderRoute(allowedProviders: readonly string[]): ModelProviderRoute {
  const configuredKey = normalizeProfileKey(
    process.env.MODEL_GATEWAY_PROVIDER_PROFILE
      ?? process.env.MODEL_GATEWAY_PROVIDER
      ?? "openai_compatible",
  );
  const profile = MODEL_PROVIDER_PROFILES[configuredKey];
  if (!profile) throw new Error("model_provider_profile_not_registered");
  if (!allowedProviders.includes(profile.provider)) throw new Error("provider_not_allowed");

  return {
    profile_key: profile.key,
    provider: profile.provider,
    base_url: validateBaseUrl(requiredEnv(profile.base_url_env)),
    api_key: requiredEnv(profile.api_key_env),
    model: requiredEnv(profile.model_env),
  };
}
