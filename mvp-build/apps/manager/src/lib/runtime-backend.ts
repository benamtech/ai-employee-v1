export const RUNTIME_BACKENDS = ["docker", "local", "ssh", "vm"] as const;

export type RuntimeBackend = (typeof RUNTIME_BACKENDS)[number];

export function resolveRuntimeBackend(value = process.env.HERMES_BACKEND_TYPE): RuntimeBackend {
  const backend = (value ?? "docker").trim().toLowerCase();
  if ((RUNTIME_BACKENDS as readonly string[]).includes(backend)) return backend as RuntimeBackend;
  throw new Error(`Unsupported HERMES_BACKEND_TYPE: ${value}`);
}

export function isProductionRuntimeBackend(backend: RuntimeBackend): boolean {
  return backend !== "local";
}

/**
 * Provisioning-time admission check: `local` runs the employee directly on the
 * Manager host with no container isolation — acceptable for the dev/demo loop,
 * never for a real tenant. Default-deny: requires an explicit opt-in flag AND
 * is hard-vetoed in production regardless of the flag. NODE_ENV alone is not a
 * trustworthy signal here — there is no Dockerfile/systemd/pm2 config in this
 * repo that sets NODE_ENV=production for the Manager process, and this exact
 * failure mode (a NODE_ENV-only guard silently left open) already happened
 * once for denyInternal (see server.ts's comment on MANAGER_INTERNAL_TOKEN).
 */
export function isLocalRuntimeBackendAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV === "production") return false;
  return env.ALLOW_LOCAL_RUNTIME_BACKEND === "1" || env.ALLOW_LOCAL_RUNTIME_BACKEND === "true";
}
