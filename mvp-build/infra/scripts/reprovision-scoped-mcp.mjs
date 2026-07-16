#!/usr/bin/env node

import { randomBytes, createHash } from "node:crypto";
import { Client } from "pg";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";

(function loadEnv() {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // rely on ambient env
  }
})();

const employeeId = process.argv.find((arg) => arg.startsWith("emp_")) ?? process.env.EMPLOYEE_ID ?? process.env.LOCAL_EMPLOYEE_ID;
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const provisionerOrigin = (process.env.REPROVISIONER_ORIGIN
  ?? process.env.MANAGER_SMOKE_URL
  ?? process.env.MANAGER_API_ORIGIN
  ?? process.env.PROVISIONER_ORIGIN
  ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const managerOrigin = (process.env.MANAGER_SMOKE_URL
  ?? process.env.MANAGER_API_ORIGIN
  ?? "http://127.0.0.1:8080").replace(/\/$/, "");

const TEXT_EXTENSIONS = new Set([".env", ".md", ".yaml", ".yml", ".json", ".txt", ".tpl", ".example"]);
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function id(prefix, len = 22) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}_${out}`;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function clientSlug(id) {
  return id.replace(/^emp_/, "client-").slice(0, 40);
}

function publicTwilioWebhookUrl(employeeId) {
  const webhookBase = process.env.SMS_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (webhookBase) return `${webhookBase}/${employeeId}`;
  const managerOrigin = (process.env.MANAGER_API_ORIGIN ?? "https://api.amtechai.com").replace(/\/$/, "");
  return `${managerOrigin}/webhooks/twilio/${employeeId}`;
}

async function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

function parseEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function readProfileParams(generatedPath) {
  if (!generatedPath) return null;
  const file = join(generatedPath, "profile-build-params.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

function packageRoot(packageKey) {
  const configured = process.env.PROFILE_PACKAGES_DIR;
  if (configured) return join(configured, packageKey);
  if (packageKey === "contractor_estimator") return join(process.cwd(), "packages", "agent-template");
  return join(process.cwd(), "packages", "profile-packages", packageKey);
}

function packageProfileContext(packageKey) {
  const file = join(packageRoot(packageKey), "purpose.profile-context.json");
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8"));
}

function latestManifestParams(row, endpoint, build) {
  const manifest = row.manifest ?? {};
  const params = readProfileParams(build?.generated_path) ?? {};
  const env = parseEnv(build?.generated_path ? join(build.generated_path, ".env") : "");
  const profilePackageKey = row.profile_package_key ?? manifest.profile_package_key ?? "contractor_estimator";
  return {
    client_id: params.client_id ?? clientSlug(row.employee_id),
    account_id: row.account_id,
    employee_id: row.employee_id,
    profile_package_key: profilePackageKey,
    runtime_backend: endpoint?.backend_type ?? params.runtime_backend ?? process.env.HERMES_BACKEND_TYPE ?? "docker",
    business_display_name: params.business_display_name ?? manifest.business_display_name ?? row.business_display_name ?? row.employee_id,
    business_kind: params.business_kind ?? manifest.business_kind ?? "contractor",
    owner_name: params.owner_name ?? manifest.owner_name ?? "Owner",
    owner_phone_e164: params.owner_phone_e164 ?? manifest.verified_phone_e164 ?? "",
    employee_name: params.employee_name ?? manifest.employee_name ?? row.employee_name ?? "Sage",
    timezone: params.timezone ?? manifest.timezone ?? "America/New_York",
    workspace_dir: params.workspace_dir ?? `${process.env.AMTECH_CLIENTS_DIR ?? "/var/lib/amtech/clients"}/${row.employee_id}/workspace`,
    webhook_url: params.webhook_url ?? endpoint?.twilio_webhook_url ?? publicTwilioWebhookUrl(row.employee_id),
    gateway_port: Number(params.gateway_port ?? endpoint?.gateway_port ?? env.API_SERVER_PORT),
    top_workflows: params.top_workflows ?? manifest.top_workflows ?? [],
    tools_mentioned: params.tools_mentioned ?? manifest.tools_mentioned ?? [],
    seed_skills: params.seed_skills ?? manifest.seed_skills ?? [],
    api_server_key: params.api_server_key ?? env.API_SERVER_KEY ?? randomBytes(32).toString("base64url"),
    profile_context: params.profile_context ?? manifest.profile_context ?? packageProfileContext(profilePackageKey),
  };
}

function scanForInternalToken(root) {
  const hits = [];
  if (!root || !existsSync(root)) return hits;
  function walk(path) {
    const s = statSync(path);
    if (s.isDirectory()) {
      for (const entry of readdirSync(path)) {
        if (entry === "node_modules" || entry === ".git") continue;
        walk(join(path, entry));
      }
      return;
    }
    const ext = extname(path).toLowerCase();
    const name = path.split("/").pop();
    if (!TEXT_EXTENSIONS.has(ext) && !TEXT_EXTENSIONS.has(name)) return;
    const text = readFileSync(path, "utf8");
    if (text.includes("MANAGER_INTERNAL_TOKEN")) hits.push(path);
  }
  walk(root);
  return hits;
}

async function mintCredential(client, accountId, employeeId) {
  const token = `mcp_${randomBytes(32).toString("base64url")}`;
  const credentialId = id("mcpc");
  await client.query("begin");
  try {
    await client.query(
      "update employee_mcp_credentials set status='revoked', revoked_at=now(), updated_at=now() where employee_id=$1 and status='active'",
      [employeeId],
    );
    await client.query(
      `insert into employee_mcp_credentials
       (id, account_id, employee_id, token_hash, token_prefix, audience, status)
       values ($1, $2, $3, $4, $5, '/manager/mcp', 'active')`,
      [credentialId, accountId, employeeId, hashToken(token), token.slice(0, 12)],
    );
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
  return { token, credential_id: credentialId, token_prefix: token.slice(0, 12) };
}

async function loadEmployee(client, id) {
  const sql = `
    select
      e.id as employee_id,
      e.account_id,
      e.name as employee_name,
      e.profile_id,
      e.profile_package_key,
      a.display_name as business_display_name,
      m.id as manifest_id,
      m.manifest,
      m.profile_package_key as manifest_profile_package_key
    from employees e
    left join accounts a on a.id = e.account_id
    left join lateral (
      select * from employee_manifests em
      where em.employee_id = e.id
      order by em.created_at desc
      limit 1
    ) m on true
    where e.id = $1
  `;
  return (await client.query(sql, [id])).rows[0] ?? null;
}

async function latestEndpoint(client, id) {
  return (await client.query(
    "select * from runtime_endpoints where employee_id=$1 order by created_at desc limit 1",
    [id],
  )).rows[0] ?? null;
}

async function latestBuild(client, id) {
  return (await client.query(
    "select * from employee_profile_builds where employee_id=$1 order by created_at desc limit 1",
    [id],
  )).rows[0] ?? null;
}

async function callProvisioner(req) {
  const token = process.env.PROVISIONER_TOKEN;
  if (!token) throw new Error("PROVISIONER_TOKEN missing");
  const res = await fetch(`${provisionerOrigin}/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(req),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== "ok") {
    const err = new Error(`provisioner_failed:${res.status}:${json.failure_state ?? "unknown"}`);
    err.provisioner_http_status = res.status;
    err.provisioner_result = json;
    throw err;
  }
  return json;
}

function redact(value) {
  if (typeof value === "string") {
    return value
      .replace(/(Bearer\s+|mcp_|re_|cfat_)[A-Za-z0-9._-]+/g, "$1[redacted]")
      .replace(/(token|secret|key)(=|:)[^\s,}]+/gi, "$1$2[redacted]");
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = /(token|secret|authorization|api_key)/i.test(key) ? "[redacted]" : redact(child);
    return out;
  }
  return value;
}

async function mcpToolList(token) {
  const res = await fetch(`${managerOrigin}/manager/mcp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  const text = await res.text();
  const json = JSON.parse(text.split("\n").reverse().find((l) => l.startsWith("data:"))?.slice(5).trim() || text);
  if (!res.ok || !Array.isArray(json?.result?.tools)) {
    throw new Error(`mcp_tools_list_failed:${res.status}:${text.slice(0, 800)}`);
  }
  return json.result.tools.map((tool) => tool.name);
}

function writeProof(body) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `reprovision-scoped-mcp-${stamp()}.json`);
  writeFileSync(path, JSON.stringify(body, null, 2));
  console.log(`proof_json:${path}`);
}

try {
  if (!employeeId) throw new Error("employee id required: pass emp_... or set EMPLOYEE_ID");
  const client = await db();
  const employee = await loadEmployee(client, employeeId);
  if (!employee) throw new Error(`employee_not_found:${employeeId}`);
  const endpoint = await latestEndpoint(client, employeeId);
  const build = await latestBuild(client, employeeId);
  if (!employee.manifest_id) throw new Error(`employee_manifest_missing:${employeeId}`);
  const params = latestManifestParams(employee, endpoint, build);
  if (!Number.isFinite(params.gateway_port)) throw new Error(`gateway_port_missing:${employeeId}`);

  const minted = await mintCredential(client, employee.account_id, employeeId);
  const result = await callProvisioner({
    account_id: employee.account_id,
    employee_id: employeeId,
    manifest_id: employee.manifest_id,
    profile_package_key: params.profile_package_key,
    render_secrets: { manager_mcp_token: minted.token },
    options: {
      sms: {
        enabled: process.env.REPROVISION_SMS_ENABLED === "1",
        configure_webhook: process.env.REPROVISION_SMS_CONFIGURE_WEBHOOK === "1",
        send_first_message: process.env.REPROVISION_SMS_SEND_FIRST_MESSAGE === "1",
      },
    },
    params,
  });

  const generatedPath = result.generated_path ?? build?.generated_path ?? join(process.env.HERMES_HOME ?? "", "profiles", `client_${employeeId}`);
  const internalTokenHits = scanForInternalToken(generatedPath);
  if (internalTokenHits.length) throw new Error(`manager_internal_token_rendered:${internalTokenHits.join(",")}`);
  const tools = await mcpToolList(minted.token);
  if (!tools.includes("create_estimate_artifact")) throw new Error("mcp_tool_list_missing_create_estimate_artifact");

  let needsReprovisionCleared = false;
  try {
    await client.query("update employees set needs_reprovision=false, status='live', profile_id=$2 where id=$1", [employeeId, result.profile_id ?? `client_${employeeId}`]);
    needsReprovisionCleared = true;
  } catch (err) {
    if (!String(err?.message ?? err).includes("needs_reprovision")) throw err;
    await client.query("update employees set status='live', profile_id=$2 where id=$1", [employeeId, result.profile_id ?? `client_${employeeId}`]);
  }
  if (build?.id) {
    await client.query(
      `update employee_profile_builds
       set generated_path=$2, validation_status=$3, install_status='installed', validation_output=$4, smoke_output=$5, updated_at=now()
       where id=$1`,
      [build.id, generatedPath, result.validation_status ?? "passed", result.validation_output ?? null, result.smoke_output ?? null],
    );
  }
  await client.end();

  const proof = {
    kind: "reprovision_scoped_mcp",
    status: "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    employee_id: employeeId,
    account_id: employee.account_id,
    credential_id: minted.credential_id,
    token_prefix: minted.token_prefix,
    raw_token_logged: false,
    generated_path: generatedPath,
    profile_id: result.profile_id ?? `client_${employeeId}`,
    validation_status: result.validation_status ?? null,
    mcp_tool_count: tools.length,
    required_tools_present: ["create_estimate_artifact", "request_approval"].every((name) => tools.includes(name)),
    manager_internal_token_hits: internalTokenHits,
    needs_reprovision_cleared: needsReprovisionCleared,
  };
  console.log(`PASS reprovision-scoped-mcp employee:${employeeId} credential:${minted.credential_id} tools:${tools.length}`);
  writeProof(proof);
} catch (err) {
  const provisionerResult = err?.provisioner_result ? redact(err.provisioner_result) : undefined;
  const proof = {
    kind: "reprovision_scoped_mcp",
    status: "fail",
    checked_at: new Date().toISOString(),
    host: hostname(),
    employee_id: employeeId ?? null,
    error: String(err?.message ?? err),
    provisioner_http_status: err?.provisioner_http_status ?? undefined,
    provisioner_result: provisionerResult,
  };
  console.error(`FAIL reprovision-scoped-mcp ${proof.error}`);
  writeProof(proof);
  process.exit(1);
}
