import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, join } from "node:path";

export function arg(name, fallback = undefined) {
  const prefix = `${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

export function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

export function requireEnv(...names) {
  const values = {};
  for (const name of names.flat()) {
    const value = process.env[name];
    if (!value) throw new Error(`required_environment_missing:${name}`);
    values[name] = value;
  }
  return values;
}

export function requireArg(name) {
  const value = arg(name);
  if (!value) throw new Error(`required_argument_missing:${name}`);
  return value;
}

export function requireDestructiveApproval(employeeId) {
  if (!hasFlag("--allow-destructive")) throw new Error("destructive_proof_requires_--allow-destructive");
  const allowed = process.env.AMTECH_ACCEPT_DESTRUCTIVE_EMPLOYEE;
  if (!allowed || allowed !== employeeId) throw new Error("destructive_employee_allowlist_mismatch");
  if (process.env.AMTECH_ACCEPT_DESTRUCTIVE_CONFIRM !== `I_ACCEPT_${employeeId}`) {
    throw new Error("destructive_employee_confirmation_missing");
  }
}

export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: options.timeout ?? 120_000, env: { ...process.env, ...(options.env ?? {}) }, cwd: options.cwd ?? process.cwd() });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0 && !options.allowFailure) throw new Error(`command_failed:${command}:${args.join(" ")}:${output.slice(0, 500)}`);
  return { ok: result.status === 0, status: result.status, output };
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: options.signal ?? AbortSignal.timeout(options.timeout ?? 20_000) });
  const text = await response.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text.slice(0, 500) }; }
  return { response, json };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(label, fn, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 1_000;
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    last = await fn();
    if (last?.done) return last.value;
    await sleep(intervalMs);
  }
  throw new Error(`wait_timeout:${label}:${JSON.stringify(redact(last)).slice(0, 300)}`);
}

const REDACT_KEY = /(secret|token|authorization|password|api[_-]?key|cookie|phone_e164|email_address)/i;
const PUBLIC_HASH_KEY = /(?:^|_)(?:git_sha|sha(?:256)?|hash|digest|image_id)(?:$|_)/i;
const PUBLIC_LITERAL_KEY = /^(?:kind|status|host|architecture|os|runtime_user|requested_image|platform|provider|operation)$/i;
const PUBLIC_LITERAL_VALUE = /^[A-Za-z0-9._:/@+ -]{1,500}$/;
const REDACT_VALUE = /(?:Bearer\s+)?[A-Za-z0-9_=-]{28,}/g;
const PUBLIC_HASH_VALUE = /^(?:(?:[A-Za-z0-9._/-]+)@)?sha256:[a-f0-9]{64}$/i;
const PUBLIC_GIT_SHA_VALUE = /^[a-f0-9]{7,64}$/i;

function isPublicHash(value) {
  return typeof value === "string" && (PUBLIC_HASH_VALUE.test(value) || PUBLIC_GIT_SHA_VALUE.test(value));
}

function isPublicLiteral(value) {
  return typeof value === "string" && PUBLIC_LITERAL_VALUE.test(value);
}

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      if (REDACT_KEY.test(key)) return [key, "[REDACTED]"];
      if (PUBLIC_HASH_KEY.test(key) && isPublicHash(item)) return [key, item];
      if (PUBLIC_LITERAL_KEY.test(key) && isPublicLiteral(item)) return [key, item];
      return [key, redact(item)];
    }));
  }
  if (typeof value === "string") return value.replace(REDACT_VALUE, "[REDACTED]");
  return value;
}

export async function readProof(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeProof(kind, status, evidence, options = {}) {
  const proofDir = options.proofDir ?? arg("--proof-dir", process.env.AMTECH_PROOF_DIR ?? "infra/proofs");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = options.path ?? join(proofDir, `${kind}-${timestamp}.json`);
  await mkdir(dirname(path), { recursive: true });
  const body = redact({
    kind,
    status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    git_sha: process.env.GITHUB_SHA ?? process.env.AMTECH_RELEASE_SHA ?? null,
    evidence,
  });
  await writeFile(path, `${JSON.stringify(body, null, 2)}\n`, "utf8");
  console.log(`proof_json:${path}`);
  return { path, body };
}

export function assert(condition, code, detail = undefined) {
  if (!condition) throw new Error(`${code}${detail === undefined ? "" : `:${JSON.stringify(redact(detail))}`}`);
}
