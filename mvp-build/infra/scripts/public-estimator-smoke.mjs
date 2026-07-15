#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const args = new Set(process.argv.slice(2));
const argValue = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const webBase = argValue("--web-url", process.env.PUBLIC_ESTIMATOR_WEB_URL ?? "http://127.0.0.1:3000");
const estimatorPath = argValue("--path", process.env.PUBLIC_ESTIMATOR_PATH ?? "/estimator");
const message = argValue("--message", "Hi Avery, I need a draft estimate for repainting two bedrooms and a hallway. Walls only, average condition, no ceiling.");
const sendMessage = args.has("--send-message");
const requireMessageSuccess = args.has("--require-message-success");

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root, encoding: "utf8" });
  return result.stdout?.trim() || null;
}

function redactJson(value) {
  if (Array.isArray(value)) return value.map(redactJson);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = /(token|secret|authorization|cookie)/i.test(key) ? "[redacted]" : redactJson(child);
    }
    return out;
  }
  return value;
}

function captureCookie(headers, current) {
  const setCookie = headers.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie")] : []);
  const cookieParts = [...current.split(";").map((part) => part.trim()).filter(Boolean)];
  for (const cookie of setCookie) {
    const first = cookie.split(";")[0];
    const name = first.split("=")[0];
    const next = cookieParts.filter((part) => !part.startsWith(`${name}=`));
    next.push(first);
    cookieParts.length = 0;
    cookieParts.push(...next);
  }
  return cookieParts.join("; ");
}

async function request(name, path, options = {}, cookie = "") {
  const started = Date.now();
  try {
    const res = await fetch(`${webBase.replace(/\/$/, "")}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(options.headers ?? {}),
      },
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text.slice(0, 1000) };
    }
    return {
      check: {
        name,
        status: res.status < 500 ? "pass" : "fail",
        http_status: res.status,
        ms: Date.now() - started,
        response: redactJson(json),
      },
      cookie: captureCookie(res.headers, cookie),
      json,
    };
  } catch (err) {
    return {
      check: { name, status: "fail", error: String(err?.message ?? err), ms: Date.now() - started },
      cookie,
      json: null,
    };
  }
}

const checks = [];
let cookie = "";

const page = await request("estimator_page", estimatorPath, { method: "GET", headers: {} }, cookie);
checks.push({ ...page.check, status: page.check.http_status && page.check.http_status < 500 ? "pass" : "fail" });
cookie = page.cookie;

const session = await request("session_create_or_resume", "/api/public-estimator/session", { method: "POST", body: "{}" }, cookie);
checks.push(session.check);
cookie = session.cookie;
const visitorSessionId = session.json?.visitor_session_id;

if (visitorSessionId) {
  const draft = await request(
    "current_draft_initial",
    `/api/public-estimator/current-draft?visitor_session_id=${encodeURIComponent(visitorSessionId)}`,
    { method: "GET", headers: {} },
    cookie,
  );
  checks.push(draft.check);
}

if (sendMessage && visitorSessionId) {
  const turn = await request(
    "message_turn",
    "/api/public-estimator/message",
    { method: "POST", body: JSON.stringify({ visitor_session_id: visitorSessionId, message }) },
    cookie,
  );
  const status = turn.check.http_status && turn.check.http_status < 500 ? "pass" : requireMessageSuccess ? "fail" : "provider_or_runtime_gated";
  checks.push({ ...turn.check, status });
}

const hardFail = checks.some((check) => check.status === "fail");
const gated = checks.some((check) => check.status === "provider_or_runtime_gated");
const proof = {
  kind: "public_estimator_web_smoke",
  status: hardFail ? "fail" : gated ? "partial" : "pass",
  checked_at: new Date().toISOString(),
  host: hostname(),
  git_sha: gitSha(),
  web_url: webBase,
  estimator_path: estimatorPath,
  sent_message: sendMessage,
  visitor_session_id: visitorSessionId ?? null,
  status_boundary: {
    pass_without_message: "Web/API/session path is working; no LLM provider call was attempted.",
    partial_with_message: "Message path reached a provider/runtime-dependent leg but did not complete.",
    provider_accepted: "Only claim separately when a real provider proof id is captured.",
  },
  checks,
};

mkdirSync(join(root, proofDir), { recursive: true });
const proofPath = join(proofDir, `public-estimator-web-smoke-${stamp()}.json`);
writeFileSync(join(root, proofPath), JSON.stringify(proof, null, 2));

for (const check of checks) {
  const prefix = check.status === "pass" ? "PASS" : check.status === "provider_or_runtime_gated" ? "GATED" : "FAIL";
  console.log(`${prefix} ${check.name}${check.http_status ? ` ${check.http_status}` : ""}${check.error ? ` ${check.error}` : ""}`);
}
console.log(`proof_json:${proofPath}`);
if (hardFail || (requireMessageSuccess && gated)) process.exit(1);
