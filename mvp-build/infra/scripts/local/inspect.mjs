#!/usr/bin/env node
/**
 * Live employee tool-surface inspector. Prints the ground truth of what a
 * provisioned Hermes employee can actually do — /health, /v1/capabilities, and
 * the resolved /v1/toolsets — so we never claim a tool is available without
 * seeing it (Realness Rule).
 *
 * Usage:
 *   npm run local:inspect -- --base http://localhost:8710 --key <API_SERVER_KEY>
 * or via env:
 *   HERMES_API_BASE_URL=... API_SERVER_KEY=... npm run local:inspect
 *
 * Note: the api_server /v1/toolsets route lists BASE toolsets only
 * (include_default_mcp_servers=False), so the Manager MCP tools will NOT show
 * here even though the employee can call them. Confirm MCP separately.
 */

function argOf(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const base = (argOf("--base") ?? process.env.HERMES_API_BASE_URL ?? "http://localhost:8710").replace(/\/$/, "");
const key = argOf("--key") ?? process.env.API_SERVER_KEY ?? process.env.HERMES_API_TOKEN ?? "";

if (!key) {
  console.log("blocked  no bearer — pass --key or set API_SERVER_KEY (a booted employee's api_server key).");
  process.exitCode = 1;
}

async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, error: String(err?.message ?? err) };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeToolsets(body) {
  const raw = body?.toolsets ?? body;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([name, v]) => ({ name, ...(v && typeof v === "object" ? v : {}) }));
  }
  return [];
}

async function main() {
  console.log(`inspect  employee api_server at ${base}\n`);

  const health = await getJson("/health");
  console.log(`${health.ok ? "ok      " : "blocked "} /health          ${health.ok ? JSON.stringify(health.body?.status ?? health.body) : health.error ?? `HTTP ${health.status}`}`);

  const caps = await getJson("/v1/capabilities");
  console.log(`${caps.ok ? "ok      " : "blocked "} /v1/capabilities ${caps.ok ? `platform=${caps.body?.platform ?? "?"} model=${caps.body?.model ?? "?"}` : caps.error ?? `HTTP ${caps.status}`}`);

  const toolsets = await getJson("/v1/toolsets");
  if (!toolsets.ok) {
    console.log(`blocked  /v1/toolsets     ${toolsets.error ?? `HTTP ${toolsets.status}`}`);
    process.exitCode = 1;
    return;
  }
  const list = normalizeToolsets(toolsets.body);
  const enabled = list.filter((t) => t.enabled !== false);
  console.log(`ok       /v1/toolsets     ${enabled.length}/${list.length} enabled\n`);
  for (const t of list) {
    const state = t.enabled === false ? "off " : t.configured === false ? "warn" : "on  ";
    const tools = Array.isArray(t.tools) ? ` (${t.tools.length} tools)` : "";
    console.log(`  ${state} ${t.name ?? "?"}${tools}`);
  }
}

main().catch((err) => {
  console.error(`inspect failed: ${String(err?.message ?? err)}`);
  process.exitCode = 1;
});
