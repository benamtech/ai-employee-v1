import { mkdir, readFile, readdir, rm, stat, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProfileBuildParams, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import { computeApiServerToolsets, renderableDirectMcpConnectors, toYamlFlowList } from "@amtech/shared";
import { activateCaddySnippet, writeCaddySnippetFile } from "./caddy-activation.js";
import { runCommandString } from "./command-runner.js";
import {
  buildNativeMemoryFiles,
  renderProfileContextMarkdown,
  renderSlotMarkdown,
} from "./memory-seed.js";

const TEXT_EXTENSIONS = new Set([".md", ".yaml", ".yml", ".json", ".tpl", ".txt", ".example"]);

function workspaceRoot(): string {
  return process.env.AMTECH_MVP_ROOT ?? process.cwd();
}

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return "";
}

function renderedModelConfig(): { provider: string; model: string; baseUrl: string; apiKey: string } | null {
  const provider = process.env.HERMES_MODEL_PROVIDER;
  if (!provider) return null;
  if (provider === "openai_compatible") {
    return {
      provider: "custom",
      model: firstEnv("HERMES_MODEL_DEFAULT", "XAI_MODEL", "xai_model", "ORCHESTRATOR_MODEL") || "grok-4.3",
      baseUrl: firstEnv("HERMES_MODEL_BASE_URL", "ORCHESTRATOR_API_BASE_URL") || "https://api.x.ai/v1",
      apiKey: firstEnv("HERMES_MODEL_API_KEY", "XAI_API_TOKEN", "XAI_API_KEY", "xai_api_key", "ORCHESTRATOR_API_KEY"),
    };
  }
  if (provider === "custom") {
    return {
      provider,
      model: process.env.HERMES_MODEL_DEFAULT ?? "bridge-agent",
      baseUrl: process.env.HERMES_MODEL_BASE_URL ?? "http://host.docker.internal:8091/v1",
      apiKey: process.env.HERMES_MODEL_API_KEY ?? "bridge-local-dummy",
    };
  }
  return {
    provider,
    model: process.env.HERMES_MODEL_DEFAULT ?? "claude-opus-4-8",
    baseUrl: process.env.HERMES_MODEL_BASE_URL ?? "",
    apiKey: "",
  };
}

/**
 * The rendered config.yaml model block. Hermes names arbitrary OpenAI-compatible
 * endpoints `custom`; deployment env may still use `openai_compatible` because
 * the onboarding orchestrator uses that vocabulary for xAI/Grok.
 */
function modelConfigBlock(): string {
  const config = renderedModelConfig();
  if (config) {
    const lines = [
      "model:",
      `  provider: ${config.provider}`,
      `  default: ${config.model}`,
      "models:",
      `  default: ${config.model}`,
      "  compression: claude-haiku-4-5",
    ];
    if (config.baseUrl) lines.splice(3, 0, `  base_url: ${config.baseUrl}`);
    return lines.join("\n");
  }
  return ["models:", "  default: claude-opus-4-8", "  compression: claude-haiku-4-5"].join("\n");
}

/**
 * CE-2 compression block (safety net; CE-3 rotation trips first).
 *
 * Hermes compresses at `threshold x context_length` (default 0.50) with a lossy
 * structured summary; we NEVER disable it (it is the parachute). Keys are the
 * documented Hermes defaults (configuration reference). This block is deliberately
 * MODEL-AGNOSTIC: `threshold` is a *fraction* Hermes applies to whatever the
 * model's window is, and CE-3 rotates at a smaller fraction (0.40), so rotation
 * beats compression for every model without any per-model tuning here.
 */
function compressionConfigBlock(): string {
  return [
    "compression:",
    "  enabled: true",
    "  threshold: 0.50",
    "  target_ratio: 0.20",
    "  protect_last_n: 20",
    "  protect_first_n: 3",
    "  hygiene_hard_message_limit: 5000",
  ].join("\n");
}

/**
 * CE-2 delegation block. Enables the Hermes `delegate_task` tool so the employee
 * can run heavy multi-step sub-work in an ISOLATED child context and only the
 * child's bounded summary re-enters the parent conversation — in-turn context
 * isolation (delegate_task is synchronous; it does not free the owner turn lane).
 * `delegate_task` is exposed by configuring this block, NOT by a platform_toolsets
 * entry (there is no valid "delegation" toolset name), so platform-toolsets.ts is
 * intentionally untouched. Model/provider are omitted so children inherit the
 * employee's configured model rather than duplicating provider secrets.
 */
function delegationConfigBlock(): string {
  return [
    "delegation:",
    "  max_iterations: 50",
    "  max_concurrent_children: 3",
    "  max_spawn_depth: 1",
    "  orchestrator_enabled: true",
  ].join("\n");
}

/**
 * CE-2 hooks block (tokenized so compression/hooks render together instead of a
 * hardcoded single entry). `pre_llm_call` is the CE-1 once-per-session reference
 * primer (a fail-open shell hook). The tool-output HYGIENE transforms are NOT here
 * — `transform_tool_result`/`transform_terminal_output` are Hermes plugin-only
 * hooks (see packages/agent-template/plugins/amtech-hygiene), not shell hooks.
 */
function hooksBlock(): string {
  return [
    "hooks_auto_accept: true",
    "hooks:",
    "  pre_llm_call:",
    "    - command: \"node hooks/pre-session-context.mjs\"",
  ].join("\n");
}

/**
 * CE-4 custody policy at render time. Renders extra config.yaml `mcp_servers`
 * entries ONLY for read-only connectors (`renderableDirectMcpConnectors` drops any
 * write/money/customer-facing connector — default-deny). Money/customer/write
 * connectors are therefore structurally incapable of a direct-MCP path; they stay
 * behind `amtech_manager` + the approval gate. Renders "" when there are none, so
 * the token collapses to a blank line under `mcp_servers:`.
 */
function connectorMcpServersBlock(params: ProfileBuildParams): string {
  const allowed = renderableDirectMcpConnectors(params.direct_mcp_connectors ?? []);
  return allowed
    .map((c) => [`  ${c.name}:`, `    url: "${c.url}"`].join("\n"))
    .join("\n");
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
  const context = params.profile_context;
  const memories = buildNativeMemoryFiles(context);
  const modelConfig = renderedModelConfig();
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
    PROFILE_CONTEXT_MARKDOWN: renderProfileContextMarkdown(context),
    BUSINESS_IDENTITY_CONTEXT: renderSlotMarkdown(context, "business_identity"),
    OWNER_IDENTITY_CONTEXT: renderSlotMarkdown(context, "owner_identity"),
    WORKFLOW_CONTEXT: renderSlotMarkdown(context, "workflows"),
    TOOL_CONTEXT: renderSlotMarkdown(context, "tools"),
    DURABLE_FACTS_CONTEXT: renderSlotMarkdown(context, "durable_facts"),
    STANDING_PREFERENCES_CONTEXT: renderSlotMarkdown(context, "standing_preferences"),
    LIVE_STATE_POINTERS_CONTEXT: renderSlotMarkdown(context, "live_state_pointers"),
    MEMORY_SEED: memories.memory_md,
    USER_SEED: memories.user_md,
    MANAGER_API_ORIGIN: managerOrigin,
    MANAGER_MCP_TOKEN: renderSecrets.manager_mcp_token ?? "",
    HERMES_DOCKER_NETWORK: process.env.HERMES_DOCKER_NETWORK ?? "",
    // Model wiring. Hermes calls arbitrary OpenAI-compatible endpoints `custom`;
    // deployment may set HERMES_MODEL_PROVIDER=openai_compatible for xAI/Grok,
    // which is translated above and injected here as OPENAI_* env.
    MODEL_CONFIG: modelConfigBlock(),
    // CE-2: compression parachute (rotation trips first), delegation for in-turn
    // context isolation, and the tokenized hooks block (primer only; hygiene
    // transforms are a Hermes plugin, not a shell hook).
    COMPRESSION_CONFIG: compressionConfigBlock(),
    DELEGATION_CONFIG: delegationConfigBlock(),
    HOOKS: hooksBlock(),
    MODEL_BRIDGE_BASE_URL: modelConfig?.provider === "custom" ? modelConfig.baseUrl : "",
    MODEL_BRIDGE_API_KEY: modelConfig?.provider === "custom" ? modelConfig.apiKey : "",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
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
    // CE-4: read-only connectors wired directly (write/money/customer refused).
    CONNECTOR_MCP_SERVERS: connectorMcpServersBlock(params),
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
      // Hermes discovers plugins at $HERMES_HOME/plugins, NOT inside a profile
      // dir — so the package `plugins/` is deployed separately (deployPlugins),
      // not rendered into the profile (would be dead weight + token-mangled).
      if (entry === "plugins") continue;
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

/** Plain recursive copy (no token render) — used to deploy Hermes plugins whose
 *  `.py`/`.yaml` files must land verbatim. */
async function copyDir(src: string, dst: string): Promise<void> {
  const s = await stat(src);
  if (s.isDirectory()) {
    await mkdir(dst, { recursive: true });
    for (const entry of await readdir(src)) {
      if (entry === "__pycache__" || entry === "node_modules") continue;
      await copyDir(join(src, entry), join(dst, entry));
    }
    return;
  }
  await mkdir(join(dst, ".."), { recursive: true });
  await copyFile(src, dst);
}

/**
 * Deploy the package's Hermes plugins (e.g. amtech-hygiene) into
 * `$HERMES_HOME/plugins/<name>` where Hermes auto-discovers them at startup.
 * Returns the deployed plugin names. Verbatim copy — plugins are employee-agnostic
 * (no per-employee tokens), so they are NOT rendered. Enabling a discovered plugin
 * (config vs `hermes plugins enable`) is a live-Hermes verification item.
 */
async function deployPlugins(packageKey: string, hermesHome: string): Promise<string[]> {
  const src = join(packageRoot(packageKey), "plugins");
  let entries: string[];
  try {
    entries = await readdir(src);
  } catch {
    return []; // package ships no plugins
  }
  const deployed: string[] = [];
  for (const entry of entries) {
    const entrySrc = join(src, entry);
    if (!(await stat(entrySrc)).isDirectory()) continue;
    await copyDir(entrySrc, join(hermesHome, "plugins", entry));
    deployed.push(entry);
  }
  return deployed;
}

export function buildParams(req: ProvisionerRequest): ProfileBuildParams {
  return req.params;
}

export async function renderProfilePackage(req: ProvisionerRequest): Promise<{
  profile_id: string;
  generated_path: string;
  workspace_dir: string;
  validation_output: string;
  deployed_plugins: string[];
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
  // CE-2: deploy Hermes plugins (tool-output hygiene transforms) into
  // $HERMES_HOME/plugins where Hermes discovers them.
  const deployed_plugins = await deployPlugins(req.profile_package_key, hermesHome);
  return { profile_id, generated_path, workspace_dir: params.workspace_dir, validation_output, deployed_plugins };
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
