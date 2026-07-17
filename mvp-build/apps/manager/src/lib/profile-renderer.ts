import { chmod, mkdir, readFile, readdir, rm, stat, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProfileBuildParams, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";
import { computeApiServerToolsets, modelGatewayPolicySummary, renderableDirectMcpConnectors, toYamlFlowList } from "@amtech/shared";
import { activateCaddySnippet, writeCaddySnippetFile } from "./caddy-activation.js";
import { runCommandString } from "./command-runner.js";
import { assertProfileTreeIntegrity, computeProfileChecksum } from "./runtime-profile-integrity.js";
import { buildNativeMemoryFiles, renderProfileContextMarkdown, renderSlotMarkdown } from "./memory-seed.js";

const TEXT_EXTENSIONS = new Set([".md", ".yaml", ".yml", ".json", ".tpl", ".txt", ".example"]);

function workspaceRoot(): string {
  return process.env.AMTECH_MVP_ROOT ?? process.cwd();
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function localDirectModelModeAllowed(params: ProfileBuildParams): boolean {
  return !isProduction()
    && params.runtime_backend === "local"
    && process.env.ALLOW_LOCAL_DIRECT_PROVIDER_MODEL === "1"
    && process.env.HERMES_MODEL_PROVIDER === "custom";
}

function requireModelGatewayToken(params: ProfileBuildParams, renderSecrets: ProvisionerRequest["render_secrets"] = {}): string {
  const token = renderSecrets.model_gateway_token;
  if (token) return token;
  if (localDirectModelModeAllowed(params)) return "";
  throw new Error("model_gateway_token missing; production provisioning must use an employee-scoped model gateway credential.");
}

function gatewayModelConfigBlock(params: ProfileBuildParams, renderSecrets: ProvisionerRequest["render_secrets"] = {}): string {
  const token = requireModelGatewayToken(params, renderSecrets);
  if (localDirectModelModeAllowed(params)) {
    return [
      "model:",
      "  provider: custom",
      `  base_url: ${process.env.HERMES_MODEL_BASE_URL ?? "http://127.0.0.1:8091/v1"}`,
      "  api_key: bridge-local-dummy",
      `  default: ${process.env.HERMES_MODEL_DEFAULT ?? "bridge-agent"}`,
      "models:",
      `  default: ${process.env.HERMES_MODEL_DEFAULT ?? "bridge-agent"}`,
      "  compression: claude-haiku-4-5",
    ].join("\n");
  }

  const policy = params.model_gateway;
  if (!policy.gateway_url || !policy.model_alias) throw new Error("model_gateway policy missing gateway_url or model_alias.");
  return [
    "model:",
    "  provider: custom",
    `  base_url: ${policy.gateway_url}`,
    `  api_key: ${token}`,
    `  default: ${policy.model_alias}`,
    "models:",
    `  default: ${policy.model_alias}`,
    "  compression: claude-haiku-4-5",
  ].join("\n");
}

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

function delegationConfigBlock(): string {
  return [
    "delegation:",
    "  max_iterations: 50",
    "  max_concurrent_children: 3",
    "  max_spawn_depth: 1",
    "  orchestrator_enabled: true",
  ].join("\n");
}

function hooksBlock(): string {
  return [
    "hooks_auto_accept: true",
    "hooks:",
    "  pre_llm_call:",
    "    - command: \"node hooks/pre-session-context.mjs\"",
  ].join("\n");
}

function connectorMcpServersBlock(params: ProfileBuildParams): string {
  return renderableDirectMcpConnectors(params.direct_mcp_connectors ?? [])
    .map((c) => [`  ${c.name}:`, `    url: \"${c.url}\"`].join("\n"))
    .join("\n");
}

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
  const managerOrigin = employeeManagerOrigin(runtimeBackend);
  const memories = buildNativeMemoryFiles(params.profile_context);
  const gatewayToken = requireModelGatewayToken(params, renderSecrets);
  return {
    CLIENT_ID: params.client_id,
    ACCOUNT_ID: params.account_id,
    EMPLOYEE_ID: params.employee_id,
    PROFILE_PACKAGE_KEY: params.profile_package_key,
    RUNTIME_BACKEND: runtimeBackend,
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
    PROFILE_CONTEXT_MARKDOWN: renderProfileContextMarkdown(params.profile_context),
    BUSINESS_IDENTITY_CONTEXT: renderSlotMarkdown(params.profile_context, "business_identity"),
    OWNER_IDENTITY_CONTEXT: renderSlotMarkdown(params.profile_context, "owner_identity"),
    WORKFLOW_CONTEXT: renderSlotMarkdown(params.profile_context, "workflows"),
    TOOL_CONTEXT: renderSlotMarkdown(params.profile_context, "tools"),
    DURABLE_FACTS_CONTEXT: renderSlotMarkdown(params.profile_context, "durable_facts"),
    STANDING_PREFERENCES_CONTEXT: renderSlotMarkdown(params.profile_context, "standing_preferences"),
    LIVE_STATE_POINTERS_CONTEXT: renderSlotMarkdown(params.profile_context, "live_state_pointers"),
    MEMORY_SEED: memories.memory_md,
    USER_SEED: memories.user_md,
    MANAGER_API_ORIGIN: managerOrigin,
    MANAGER_MCP_TOKEN: renderSecrets.manager_mcp_token ?? "",
    HERMES_DOCKER_NETWORK: process.env.HERMES_DOCKER_NETWORK ?? "",
    MODEL_CONFIG: gatewayModelConfigBlock(params, renderSecrets),
    MODEL_GATEWAY_URL: params.model_gateway.gateway_url,
    MODEL_GATEWAY_TOKEN: gatewayToken,
    MODEL_GATEWAY_MODEL_ALIAS: params.model_gateway.model_alias,
    MODEL_GATEWAY_CREDENTIAL_VERSION: String(params.model_gateway.credential_version),
    MODEL_GATEWAY_POLICY_JSON: JSON.stringify(modelGatewayPolicySummary(params.model_gateway)),
    COMPRESSION_CONFIG: compressionConfigBlock(),
    DELEGATION_CONFIG: delegationConfigBlock(),
    HOOKS: hooksBlock(),
    PLATFORM_TOOLSETS: toYamlFlowList(computeApiServerToolsets({
      runtimeBackend,
      hasBrowserbaseKey: Boolean(process.env.BROWSERBASE_API_KEY),
      hasVisionKey: Boolean(process.env.OPENROUTER_API_KEY),
      hasImageGenKey: Boolean(process.env.FAL_KEY),
      hasTtsKey: Boolean(process.env.ELEVENLABS_API_KEY),
    })),
    MANAGER_MCP_URL: process.env.MANAGER_MCP_URL ?? `${managerOrigin}/manager/mcp`,
    CONNECTOR_MCP_SERVERS: connectorMcpServersBlock(params),
  };
}

function render(content: string, params: ProfileBuildParams, renderSecrets?: ProvisionerRequest["render_secrets"]): string {
  let out = content;
  for (const [key, value] of Object.entries(profileTokenMap(params, renderSecrets))) out = out.replaceAll(`{{${key}}}`, value);
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
      if (["node_modules", "dist", ".next", "plugins"].includes(entry)) continue;
      await copyRendered(join(src, entry), join(dst, entry === ".env.tpl" ? ".env" : entry), params, renderSecrets);
    }
    return;
  }
  await mkdir(join(dst, ".."), { recursive: true });
  if (isText(src)) await writeFile(dst, render(await readFile(src, "utf8"), params, renderSecrets), "utf8");
  else await copyFile(src, dst);
}

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

async function deployPlugins(packageKey: string, hermesHome: string): Promise<string[]> {
  const src = join(packageRoot(packageKey), "plugins");
  let entries: string[];
  try {
    entries = await readdir(src);
  } catch {
    return [];
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
  profile_checksum: string;
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
  requireModelGatewayToken(params, req.render_secrets);
  const generated_path = join(hermesHome, "profiles", profile_id);
  await rm(generated_path, { recursive: true, force: true });
  await copyRendered(packageRoot(req.profile_package_key), generated_path, params, req.render_secrets);
  await mkdir(params.workspace_dir, { recursive: true });
  await mkdir(join(params.workspace_dir, "output"), { recursive: true });
  await writeFile(join(generated_path, "profile-build-params.json"), JSON.stringify({ ...params, model_gateway: modelGatewayPolicySummary(params.model_gateway) }, null, 2), "utf8");
  const validationCommand = process.env.PROFILE_VALIDATION_COMMAND ?? `node ${join(workspaceRoot(), "infra", "scripts", "profile-validate.mjs")} .`;
  const validation_output = (await runCommandString(validationCommand, generated_path, "profile validation")).output;
  const deployed_plugins = await deployPlugins(req.profile_package_key, hermesHome);
  const integrity = await assertProfileTreeIntegrity(generated_path);
  return { profile_id, profile_checksum: integrity.checksum, generated_path, workspace_dir: params.workspace_dir, validation_output, deployed_plugins };
}

export async function rotateRenderedModelGatewayCredential(req: ProvisionerRequest): Promise<{ profile_id: string; generated_path: string; profile_checksum: string }> {
  const params = buildParams(req);
  const hermesHome = process.env.HERMES_HOME;
  if (!hermesHome) throw new Error("HERMES_HOME missing.");
  const token = requireModelGatewayToken(params, req.render_secrets);
  const profile_id = `client_${params.employee_id}`;
  const generated_path = join(hermesHome, "profiles", profile_id);
  const configPath = join(generated_path, "config.yaml");
  const envPath = join(generated_path, ".env");
  const config = await readFile(configPath, "utf8");
  const nextConfig = config.replace(/(^\s*api_key:\s*).+$/m, `$1${token}`);
  if (nextConfig === config) throw new Error("model_gateway_api_key_slot_missing");
  await chmod(configPath, 0o640);
  await writeFile(configPath, nextConfig, "utf8");
  try {
    const env = await readFile(envPath, "utf8");
    await chmod(envPath, 0o640);
    await writeFile(envPath, env.replace(/^MODEL_GATEWAY_TOKEN=.*$/m, `MODEL_GATEWAY_TOKEN=${token}`), "utf8");
  } catch {
    // config.yaml is authoritative for Hermes; .env token is diagnostic and best-effort.
  }
  const integrity = await assertProfileTreeIntegrity(generated_path);
  return { profile_id, generated_path, profile_checksum: integrity.checksum };
}

export async function inspectRenderedProfile(params: ProfileBuildParams): Promise<{ profile_id: string; generated_path: string; profile_checksum: string | null; exists: boolean }> {
  const hermesHome = process.env.HERMES_HOME;
  if (!hermesHome) throw new Error("HERMES_HOME missing.");
  const profile_id = `client_${params.employee_id}`;
  const generated_path = join(hermesHome, "profiles", profile_id);
  try {
    await stat(generated_path);
    return { profile_id, generated_path, profile_checksum: await computeProfileChecksum(generated_path), exists: true };
  } catch {
    return { profile_id, generated_path, profile_checksum: null, exists: false };
  }
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
  return { status: "failed", failure_state: failureState, logs: [String((err as Error).message ?? err)] };
}
