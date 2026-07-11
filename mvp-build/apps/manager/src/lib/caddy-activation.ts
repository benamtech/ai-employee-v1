import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import type { ProfileBuildParams } from "@amtech/shared";
import { runCommandString } from "./command-runner.js";

export interface CaddyActivationResult {
  file: string;
  upstream: string;
  validation_output: string;
  reload_output: string;
  smoke_output?: string;
  rolled_back?: boolean;
}

function caddyClientsDir(): string {
  const dir = process.env.CADDY_CLIENTS_DIR;
  if (!dir) throw new Error("CADDY_CLIENTS_DIR missing.");
  return dir;
}

function publicBaseDomain(): string {
  return process.env.PUBLIC_BASE_DOMAIN ?? "amtechai.com";
}

function upstreamHost(params: ProfileBuildParams): string {
  const template = process.env.CADDY_EMPLOYEE_UPSTREAM_HOST ?? "localhost";
  return template
    .replaceAll("{{EMPLOYEE_ID}}", params.employee_id)
    .replaceAll("{{CLIENT_ID}}", params.client_id);
}

export function renderCaddySnippet(params: ProfileBuildParams): { snippet: string; upstream: string } {
  const upstream = `${upstreamHost(params)}:${params.gateway_port}`;
  return {
    upstream,
    snippet: `${params.client_id}.agents.${publicBaseDomain()} {\n\treverse_proxy ${upstream}\n}\n`,
  };
}

async function readOptional(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function restore(file: string, backup: string | null): Promise<void> {
  if (backup === null) await rm(file, { force: true });
  else await writeFile(file, backup, "utf8");
}

async function validateCaddy(cwd: string): Promise<string> {
  const command = process.env.CADDY_VALIDATE_COMMAND;
  if (!command) return "validation:skipped";
  return (await runCommandString(command, cwd, "Caddy validation")).output;
}

async function reloadCaddy(cwd: string): Promise<string> {
  const command = process.env.CADDY_RELOAD_COMMAND;
  if (!command) return "reload:skipped";
  return (await runCommandString(command, cwd, "Caddy reload")).output;
}

async function smokeCaddy(cwd: string): Promise<string | undefined> {
  const command = process.env.CADDY_SMOKE_COMMAND;
  if (!command) return undefined;
  return (await runCommandString(command, cwd, "Caddy smoke")).output;
}

export async function writeCaddySnippetFile(params: ProfileBuildParams): Promise<{ file: string; relative_file: string; upstream: string }> {
  const dir = caddyClientsDir();
  await mkdir(dir, { recursive: true });
  const { snippet, upstream } = renderCaddySnippet(params);
  const file = join(dir, `${params.client_id}.caddy`);
  await writeFile(file, snippet, "utf8");
  return { file, relative_file: relative(process.cwd(), file), upstream };
}

export async function activateCaddySnippet(params: ProfileBuildParams): Promise<CaddyActivationResult> {
  const dir = caddyClientsDir();
  await mkdir(dir, { recursive: true });
  const { snippet, upstream } = renderCaddySnippet(params);
  const file = join(dir, `${params.client_id}.caddy`);
  const backupFile = `${file}.rollback`;
  const backup = await readOptional(file);
  if (backup !== null) await writeFile(backupFile, backup, "utf8");
  else await rm(backupFile, { force: true });

  await writeFile(file, snippet, "utf8");
  try {
    const validation_output = await validateCaddy(process.cwd());
    const reload_output = await reloadCaddy(process.cwd());
    const smoke_output = await smokeCaddy(process.cwd());
    await rm(backupFile, { force: true });
    return {
      file: relative(process.cwd(), file),
      upstream,
      validation_output,
      reload_output,
      ...(smoke_output ? { smoke_output } : {}),
    };
  } catch (err) {
    await restore(file, backup);
    let rollback = "rollback_reload:skipped";
    try {
      rollback = await reloadCaddy(process.cwd());
    } catch (rollbackErr) {
      rollback = `rollback_reload_failed:${String((rollbackErr as Error).message ?? rollbackErr)}`;
    }
    await rm(backupFile, { force: true });
    const message = String((err as Error).message ?? err);
    const failure = new Error(`caddy_activation_failed:${message}; ${rollback}`);
    (failure as Error & { caddy_file?: string }).caddy_file = relative(process.cwd(), file);
    throw failure;
  }
}
