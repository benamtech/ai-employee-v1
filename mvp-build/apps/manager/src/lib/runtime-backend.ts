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
