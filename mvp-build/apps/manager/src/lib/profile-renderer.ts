import { mkdir, readFile, readdir, stat, writeFile, copyFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawn } from "node:child_process";
import type { ProfileBuildParams, ProvisionerRequest, ProvisionerResult } from "@amtech/shared";

const TEXT_EXTENSIONS = new Set([".md", ".yaml", ".yml", ".json", ".tpl", ".txt", ".example"]);

function workspaceRoot(): string {
  return process.env.AMTECH_MVP_ROOT ?? process.cwd();
}

function packageRoot(packageKey: string): string {
  const configured = process.env.PROFILE_PACKAGES_DIR;
  if (configured) return join(configured, packageKey);
  if (packageKey === "contractor_estimator") return join(workspaceRoot(), "packages", "agent-template");
  return join(workspaceRoot(), "packages", "profile-packages", packageKey);
}

export function profileTokenMap(params: ProfileBuildParams): Record<string, string> {
  return {
    CLIENT_ID: params.client_id,
    ACCOUNT_ID: params.account_id,
    EMPLOYEE_ID: params.employee_id,
    PROFILE_PACKAGE_KEY: params.profile_package_key,
    RUNTIME_BACKEND: params.runtime_backend ?? "docker",
    BUSINESS_DISPLAY_NAME: params.business_display_name,
    BUSINESS_KIND: params.business_kind,
    OWNER_NAME: params.owner_name,
    OWNER_PHONE_E164: params.owner_phone_e164,
    EMPLOYEE_NAME: params.employee_name,
    TIMEZONE: params.timezone,
    WORKSPACE_DIR: params.workspace_dir,
    WEBHOOK_URL: params.webhook_url,
    GATEWAY_PORT: String(params.gateway_port),
    TOP_WORKFLOWS: params.top_workflows.join(", "),
    TOOLS_MENTIONED: params.tools_mentioned.join(", "),
    SEED_SKILLS: params.seed_skills.join(", "),
    PRICING_NOTES: "_(learned as we go)_",
    BRANDING_NOTES: "_(learned as we go)_",
    MANAGER_API_ORIGIN: process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080",
    MANAGER_INTERNAL_TOKEN: process.env.MANAGER_INTERNAL_TOKEN ?? "",
  };
}

function render(content: string, params: ProfileBuildParams): string {
  let out = content;
  for (const [key, value] of Object.entries(profileTokenMap(params))) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

function isText(path: string): boolean {
  return [...TEXT_EXTENSIONS].some((ext) => path.toLowerCase().endsWith(ext));
}

async function copyRendered(src: string, dst: string, params: ProfileBuildParams): Promise<void> {
  const s = await stat(src);
  if (s.isDirectory()) {
    await mkdir(dst, { recursive: true });
    for (const entry of await readdir(src)) {
      if (entry === "node_modules" || entry === "dist" || entry === ".next") continue;
      await copyRendered(join(src, entry), join(dst, entry === ".env.tpl" ? ".env.EXAMPLE" : entry), params);
    }
    return;
  }
  await mkdir(join(dst, ".."), { recursive: true });
  if (isText(src)) {
    await writeFile(dst, render(await readFile(src, "utf8"), params), "utf8");
  } else {
    await copyFile(src, dst);
  }
}

async function runCommand(command: string | undefined, cwd: string, label: string): Promise<string> {
  if (!command) throw new Error(`${label} command missing.`);
  const [bin, ...args] = command.split(" ").filter(Boolean);
  if (!bin) throw new Error(`${label} command empty.`);
  return await new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, shell: false, env: process.env });
    let out = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { out += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out.trim() || "ok");
      else reject(new Error(out.trim() || `${command} exited ${code}`));
    });
  });
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
  const generated_path = join(hermesHome, "profiles", profile_id);
  await copyRendered(packageRoot(req.profile_package_key), generated_path, params);
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
  const validation_output = await runCommand(validationCommand, generated_path, "profile validation");
  return { profile_id, generated_path, workspace_dir: params.workspace_dir, validation_output };
}

export async function runRuntimeStart(generatedPath: string): Promise<string> {
  return runCommand(process.env.HERMES_RUNTIME_COMMAND, generatedPath, "Hermes runtime start");
}

export async function writeCaddySnippet(params: ProfileBuildParams): Promise<string> {
  const dir = process.env.CADDY_CLIENTS_DIR;
  if (!dir) throw new Error("CADDY_CLIENTS_DIR missing.");
  await mkdir(dir, { recursive: true });
  const snippet = `${params.client_id}.agents.${process.env.PUBLIC_BASE_DOMAIN ?? "amtechai.com"} {\n\treverse_proxy localhost:${params.gateway_port}\n}\n`;
  const file = join(dir, `${params.client_id}.caddy`);
  await writeFile(file, snippet, "utf8");
  return relative(process.cwd(), file);
}

export function failureResult(failureState: string, err: unknown): ProvisionerResult {
  return {
    status: "failed",
    failure_state: failureState,
    logs: [String((err as Error).message ?? err)],
  };
}
