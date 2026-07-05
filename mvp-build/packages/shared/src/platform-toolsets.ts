/**
 * Hermes api_server toolset policy.
 *
 * Hermes resolves a provisioned employee's tools from `config.yaml`
 * `platform_toolsets.api_server` (gateway/platforms/api_server.py). With no such
 * block, Hermes falls back to a tiny default (terminal/file/web), so a
 * frontier-model employee runs nearly tool-less. This module is the single
 * source of the SAFE toolset we render into every profile.
 *
 * Enablement is tied to BOTH runtime-backend blast radius AND provider-key
 * availability — enabling a keyless toolset just yields dead/erroring tools.
 * Money- and customer-facing safety is NEVER expressed here: it stays enforced
 * by the Manager approval gate regardless of what Hermes exposes.
 */

/** Always-on base set: research, files, skills, planning, memory, recall.
 *  None of these leave the business or move money on their own. */
export const HERMES_API_SERVER_BASE_TOOLSETS = [
  "web",
  "search",
  "file",
  "skills",
  "todo",
  "memory",
  "session_search",
] as const;

export interface ToolsetPolicyInput {
  /** "docker" | "local" | "ssh" | "vm" — anything but `local` is isolated. */
  runtimeBackend: string;
  hasBrowserbaseKey?: boolean;
  hasVisionKey?: boolean;
  hasImageGenKey?: boolean;
  hasTtsKey?: boolean;
}

/**
 * The api_server toolset for a provisioned contractor employee.
 *
 * Deliberately OFF until proven via `GET /v1/toolsets` on a live api_server
 * employee (never assume — Realness Rule):
 *   - `cronjob`    — catalog marks it CLI-only; confirm api_server support first.
 *   - `skills_hub` — online-registry install is user-driven only, not autonomous.
 *   - `terminal`/`browser` on `local` — unsandboxed blast radius; require isolation.
 */
export function computeApiServerToolsets(input: ToolsetPolicyInput): string[] {
  const isolated = input.runtimeBackend.trim().toLowerCase() !== "local";
  const set: string[] = [...HERMES_API_SERVER_BASE_TOOLSETS];
  if (isolated) set.push("terminal");
  if (isolated && input.hasBrowserbaseKey) set.push("browser");
  if (input.hasVisionKey) set.push("vision");
  if (input.hasImageGenKey) set.push("image_gen");
  if (input.hasTtsKey) set.push("tts");
  return set;
}

/** Render a toolset list as a YAML flow sequence for `{{PLATFORM_TOOLSETS}}`. */
export function toYamlFlowList(items: string[]): string {
  return `[${items.join(", ")}]`;
}
