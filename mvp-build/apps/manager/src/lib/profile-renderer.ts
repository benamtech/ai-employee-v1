import { mkdir, readFile, readdir, rm, stat, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProfileBuildParams, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import { computeApiServerToolsets, toYamlFlowList } from "@amtech/shared";
import { activateCaddySnippet, writeCaddySnippetFile } from "./caddy-activation.js";
import { runCommandString } from "./command-runner.js";

const TEXT_EXTENSIONS = new Set([".md", ".yaml", ".yml", ".json", ".tpl", ".txt", ".example"]);

function workspaceRoot(): string {
  return process.env.AMTECH_MVP_ROOT ?? process.cwd();
}

/**
 * The rendered config.yaml model block. Production ships `claude-opus-4-8`. When
 * HERMES_MODEL_PROVIDER is set (local no-key testing), the employee's model is
 * pointed at the agent-in-the-loop bridge instead — the "you-are-the-LLM" design
 * where the persistent Haiku worker answers every model call (see
 * infra/local/agent-model-bridge.md). The paired OPENAI_API_KEY/OPENAI_BASE_URL
 * env come from the .env.tpl MODEL_BRIDGE_* tokens below.
 */
function modelConfigBlock(): string {
  const provider = process.env.HERMES_MODEL_PROVIDER;
  if (provider) {
    const def = process.env.HERMES_MODEL_DEFAULT ?? "bridge-agent";
    const baseUrl = process.env.HERMES_MODEL_BASE_URL ?? "http://host.docker.internal:8091/v1";
    return [
      "model:",
      `  provider: ${provider}`,
      `  default: ${def}`,
      `  base_url: ${baseUrl}`,
      "models:",
      `  default: ${def}`,
      "  compression: claude-haiku-4-5",
    ].join("\n");
  }
  return ["models:", "  default: claude-opus-4-8", "  compression: claude-haiku-4-5"].join("\n");
}

/**
 * Resolve the Manager control-plane origin a *provisioned employee* must use to
 * call back on. For a Dockerized employee, host loopback URLs (localhost /
 * 127.0.0.1) point at the container's own loopback, not the host — so anything
 * baked into config.yaml / .env at render time (the Manager MCP server URL, the
 * MANAGER_API_ORIGIN callback base) is unreachable and the employee comes up
 * tool-less. Rewrite loopback to `host.docker.internal` for docker backends,
 * mirroring the model base_url which already uses it. `local` backends run on
 * the host directly, so their loopback origin is correct and left untouched.
 * An explicit DOCKER_MANAGER_API_ORIGIN override wins (matches
 * infra/scripts/local/start-hermes-container.sh).
 */
function employeeManagerOrigin(runtimeBackend: string): string {
  const hostOrigin = process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080";
  if (runtimeBackend !== "docker") return hostOrigin;
  const override = process.env.DOCKER_MANAGER_API_ORIGIN;
  if (override) return override;
  return hostOrigin.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, "//host.docker.internal");
}

function packageRoot(packageKey: string): string {
  const configured = process.env.PROFILE_PACKAGES_DIR;
  if (configured) return join(configured, packageKey);
  if (packageKey === "contractor_estimator") return join(workspaceRoot(), "packages", "agent-template");
  return join(workspaceRoot(), "packages", "profile-packages", packageKey);
}

export function profileTokenMap(params: ProfileBuildParams, renderSecrets: ProvisionerRequest["render_secrets"] = {}): Record<string, string> {
  const runtimeBackend = params.runtime_backend ?? "docker";
  // Container-facing Manager origin: the URL an employee actually reaches the
  // control plane on. Baked at render time, so it must already be correct for
  // the runtime backend (see employeeManagerOrigin) — the container-start `-e`
  // override is too late for values compiled into config.yaml.
  const managerOrigin = employeeManagerOrigin(runtimeBackend);
  return {
    CLIENT_ID: params.client_id,
    ACCOUNT_ID: params.account_id,
    EMPLOYEE_ID: params.employee_id,
    PROFILE_PACKAGE_KEY: params.profile_package_key,
    RUNTIME_BACKEND: runtimeBackend,
    // Hermes' OWN terminal/file execution backend (config.yaml terminal.backend).
    // A Manager-provisioned employee already runs INSIDE its isolation runtime
    // (the Docker container for the docker backend), so Hermes must execute
    // terminal/file tools in-process ("local") — the container IS the sandbox.
    // Rendering "docker" here makes Hermes attempt docker-in-docker against a
    // socket that isn't mounted; check_terminal_requirements then fails and
    // silently gates terminal/file tools off. The Manager's runtime_backend stays
    // the real blast-radius tier and still drives the toolset policy that ENABLES
    // `terminal` only when isolated. Mounting the host docker socket instead would
    // hand the employee host-root — a deliberate non-goal.
    TERMINAL_BACKEND: process.env.HERMES_TERMINAL_BACKEND ?? "local",
    BUSINESS_DISPLAY_NAME: params.business_display_name,
    BUSINESS_KIND: params.business_kind,
    OWNER_NAME: params.owner_name,
    OWNER_PHONE_E164: params.owner_phone_e164,
    EMPLOYEE_NAME: params.employee_name,
    TIMEZONE: params.timezone,
    WORKSPACE_DIR: params.workspace_dir,
    WEBHOOK_URL: params.webhook_url,
    GATEWAY_PORT: String(params.gateway_port),
    EMPLOYEE_NUMBER_E164: process.env.TWILIO_EMPLOYEE_NUMBER ?? process.env.TWILIO_TEST_NUMBER ?? "",
    API_SERVER_KEY: params.api_server_key ?? "",
    TOP_WORKFLOWS: params.top_workflows.join(", "),
    TOOLS_MENTIONED: params.tools_mentioned.join(", "),
    SEED_SKILLS: params.seed_skills.join(", "),
    PRICING_NOTES: "_(learned as we go)_",
    BRANDING_NOTES: "_(learned as we go)_",
    MANAGER_API_ORIGIN: managerOrigin,
    MANAGER_MCP_TOKEN: renderSecrets.manager_mcp_token ?? "",
    // Model wiring. Local no-key testing (HERMES_MODEL_PROVIDER set) points the
    // employee at the bridge + a dummy OpenAI-compatible key; production leaves
    // these empty (real provider key is a Manager-injected secret ref).
    MODEL_CONFIG: modelConfigBlock(),
    MODEL_BRIDGE_BASE_URL: process.env.HERMES_MODEL_PROVIDER ? (process.env.HERMES_MODEL_BASE_URL ?? "http://host.docker.internal:8091/v1") : "",
    MODEL_BRIDGE_API_KEY: process.env.HERMES_MODEL_PROVIDER ? (process.env.HERMES_MODEL_API_KEY ?? "bridge-local-dummy") : "",
    // Hermes reads api_server tools from config.yaml platform_toolsets.api_server.
    // With no block it falls back to terminal/file/web only — so we render the
    // safe set, tied to backend blast radius + provider-key availability.
    PLATFORM_TOOLSETS: toYamlFlowList(
      computeApiServerToolsets({
        runtimeBackend: params.runtime_backend ?? "docker",
        hasBrowserbaseKey: Boolean(process.env.BROWSERBASE_API_KEY),
        hasVisionKey: Boolean(process.env.OPENROUTER_API_KEY),
        hasImageGenKey: Boolean(process.env.FAL_KEY),
        hasTtsKey: Boolean(process.env.ELEVENLABS_API_KEY),
      }),
    ),
    // Employee reaches the Manager control plane natively as an MCP server
    // (mcp_servers.amtech_manager in the rendered config.yaml).
    MANAGER_MCP_URL: process.env.MANAGER_MCP_URL ?? `${managerOrigin}/manager/mcp`,
  };
}

function render(content: string, params: ProfileBuildParams, renderSecrets?: ProvisionerRequest["render_secrets"]): string {
  let out = content;
  for (const [key, value] of Object.entries(profileTokenMap(params, renderSecrets))) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

function isText(path: string): boolean {
  return [...TEXT_EXTENSIONS].some((ext) => path.toLowerCase().endsWith(ext));
}

async function copyRendered(src: string, dst: string, params: ProfileBuildParams, renderSecrets?: ProvisionerRequest["render_secrets"]): Promise<void> {
  const s = await stat(src);
  if (s.isDirectory()) {
    await mkdir(dst, { recursive: true });
    for (const entry of await readdir(src)) {
      if (entry === "node_modules" || entry === "dist" || entry === ".next") continue;
      await copyRendered(join(src, entry), join(dst, entry === ".env.tpl" ? ".env" : entry), params, renderSecrets);
    }
    return;
  }
  await mkdir(join(dst, ".."), { recursive: true });
  if (isText(src)) {
    await writeFile(dst, render(await readFile(src, "utf8"), params, renderSecrets), "utf8");
  } else {
    await copyFile(src, dst);
  }
}

export function buildParams(req: ProvisionerRequest): ProfileBuildParams {
  return req.params;
}

export async function renderProfilePackage(req: ProvisionerRequest): Promise<{
  profile_id: string;
  generated_path: string;
  workspace_dir: string;
  validation_output: string;
}> {
  const params = buildParams(req);
  const profile_id = `client_${params.employee_id}`;
  const hermesHome = process.env.HERMES_HOME;
  if (!hermesHome) throw new Error("HERMES_HOME missing.");
  if (!req.render_secrets?.manager_mcp_token) throw new Error("manager_mcp_token missing.");
  const generated_path = join(hermesHome, "profiles", profile_id);
  await rm(generated_path, { recursive: true, force: true });
  await copyRendered(packageRoot(req.profile_package_key), generated_path, params, req.render_secrets);
  await mkdir(params.workspace_dir, { recursive: true });
  await mkdir(join(params.workspace_dir, "output"), { recursive: true });
  await writeFile(
    join(generated_path, "profile-build-params.json"),
    JSON.stringify(params, null, 2),
    "utf8",
  );
  const validationCommand =
    process.env.PROFILE_VALIDATION_COMMAND ??
    `node ${join(workspaceRoot(), "infra", "scripts", "profile-validate.mjs")} .`;
  const validation_output = (await runCommandString(validationCommand, generated_path, "profile validation")).output;
  return { profile_id, generated_path, workspace_dir: params.workspace_dir, validation_output };
}

export async function runRuntimeStart(generatedPath: string): Promise<string> {
  return (await runCommandString(process.env.HERMES_RUNTIME_COMMAND, generatedPath, "Hermes runtime start")).output;
}

export async function writeCaddySnippet(params: ProfileBuildParams): Promise<string> {
  return (await writeCaddySnippetFile(params)).relative_file;
}

export async function writeAndActivateCaddySnippet(params: ProfileBuildParams): Promise<string> {
  const activated = await activateCaddySnippet(params);
  return `${activated.file} upstream:${activated.upstream} validate:${activated.validation_output} reload:${activated.reload_output}${activated.smoke_output ? ` smoke:${activated.smoke_output}` : ""}`;
}

export function failureResult(failureState: string, err: unknown): ProvisionerResult {
  return {
    status: "failed",
    failure_state: failureState,
    logs: [String((err as Error).message ?? err)],
  };
}
