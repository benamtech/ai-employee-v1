import { createDecipheriv, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

export const statePath = join(process.cwd(), "infra", ".local", "state.json");

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.includes("<-- PASTE")) throw new Error(`${name} missing.`);
  return value;
}

export function maybeEnv(name, fallback = undefined) {
  return process.env[name] || fallback;
}

export async function loadState() {
  if (!existsSync(statePath)) throw new Error(`state missing: run npm run local:bootstrap first (${statePath})`);
  return JSON.parse(await readFile(statePath, "utf8"));
}

export function serviceClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function managerBase(state = {}) {
  return (process.env.MANAGER_BASE_URL ?? process.env.MANAGER_API_ORIGIN ?? state.manager_base_url ?? "http://localhost:8080").replace(/\/$/, "");
}

export function webBase() {
  return (process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_APP_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function fetchJson(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { text }; }
  return { res, json };
}

export function internalHeaders() {
  const token = process.env.MANAGER_INTERNAL_TOKEN;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function openSecret(ref) {
  const raw = requiredEnv("SECRET_REF_MASTER_KEY");
  const key = createHash("sha256").update(raw).digest();
  const parsed = JSON.parse(Buffer.from(ref, "base64url").toString("utf8"));
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parsed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.ct, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function run(command, args, options = {}) {
  const res = spawnSync(command, args, { encoding: "utf8", stdio: "pipe", ...options });
  return {
    ok: res.status === 0,
    status: res.status,
    out: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
  };
}

export function printResult(name, ok, detail = "") {
  console.log(`${ok ? "pass" : "fail"} ${name}${detail ? ` - ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

export async function runtimeForEmployee(employeeId) {
  const db = serviceClient();
  const { data: runtime, error: runtimeError } = await db
    .from("runtime_endpoints")
    .select("*")
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (runtimeError) throw runtimeError;
  if (!runtime) throw new Error(`runtime_endpoints missing for ${employeeId}`);

  const { data: secret, error: secretError } = await db
    .from("runtime_endpoint_secrets")
    .select("api_key_ref")
    .eq("runtime_endpoint_id", runtime.id)
    .maybeSingle();
  if (secretError) throw secretError;
  if (!secret?.api_key_ref) throw new Error(`runtime secret missing for ${runtime.id}`);

  return {
    runtime,
    bearer: openSecret(secret.api_key_ref),
    baseUrl: (runtime.api_base_url ?? runtime.webchat_api_url ?? "").replace(/\/$/, ""),
  };
}

