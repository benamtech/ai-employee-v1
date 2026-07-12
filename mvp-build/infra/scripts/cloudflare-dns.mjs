#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const DEFAULT_DOMAIN = "amtechai.com";
const DEFAULT_TTL = 300;
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";

export function redact(value) {
  if (typeof value === "string") {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
      .replace(/([A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]{20,})/g, "[redacted]")
      .replace(/(sk_(live|test)_[A-Za-z0-9]+)/g, "[redacted]");
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = /(token|secret|authorization|key)/i.test(key) && key !== "secrets_logged" ? "[redacted]" : redact(child);
    }
    return out;
  }
  return value;
}

function boolEnv(name) {
  return ["1", "true", "yes"].includes(String(process.env[name] ?? "").toLowerCase());
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitInfo() {
  try {
    const sha = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
    return { sha, dirty };
  } catch {
    return { sha: null, dirty: null };
  }
}

function recordKey(record) {
  return `${record.type}:${record.name}`;
}

function normalizeRecord(record) {
  return {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: Number(record.ttl ?? DEFAULT_TTL),
    proxied: Boolean(record.proxied),
  };
}

export function desiredRecords(input = {}) {
  const domain = input.domain ?? process.env.AMTECH_PUBLIC_DOMAIN ?? DEFAULT_DOMAIN;
  const ipv4 = input.ipv4 ?? process.env.AMTECH_PUBLIC_IPV4;
  const ipv6 = input.ipv6 ?? process.env.AMTECH_PUBLIC_IPV6;
  const includeAaaa = Boolean(input.includeAaaa ?? boolEnv("CLOUDFLARE_ENABLE_AAAA"));
  const ttl = Number(input.ttl ?? process.env.CLOUDFLARE_DNS_TTL ?? DEFAULT_TTL);
  const wwwMode = input.wwwMode ?? process.env.CLOUDFLARE_WWW_MODE ?? "cname";
  const proxied = Boolean(input.proxied ?? boolEnv("CLOUDFLARE_PROXIED"));

  if (!ipv4) throw new Error("AMTECH_PUBLIC_IPV4_required");

  const records = [
    { type: "A", name: domain, content: ipv4, ttl, proxied },
    { type: "A", name: `api.${domain}`, content: ipv4, ttl, proxied: Boolean(input.apiProxied ?? false) },
    { type: "A", name: `agent.${domain}`, content: ipv4, ttl, proxied },
    { type: "A", name: `*.agents.${domain}`, content: ipv4, ttl, proxied: Boolean(input.wildcardProxied ?? false) },
  ];

  if (wwwMode === "a") records.splice(1, 0, { type: "A", name: `www.${domain}`, content: ipv4, ttl, proxied });
  else records.splice(1, 0, { type: "CNAME", name: `www.${domain}`, content: domain, ttl, proxied });

  if (includeAaaa) {
    if (!ipv6) throw new Error("AMTECH_PUBLIC_IPV6_required_for_AAAA");
    for (const name of [domain, `api.${domain}`, `agent.${domain}`, `*.agents.${domain}`]) {
      records.push({ type: "AAAA", name, content: ipv6, ttl, proxied });
    }
    if (wwwMode === "a") records.push({ type: "AAAA", name: `www.${domain}`, content: ipv6, ttl, proxied });
  }

  return records.map(normalizeRecord).sort((a, b) => recordKey(a).localeCompare(recordKey(b)));
}

export function diffRecords(desired, existing = []) {
  const byKey = new Map(existing.map((record) => [recordKey(record), record]));
  const changes = [];
  for (const target of desired) {
    const current = byKey.get(recordKey(target));
    if (!current) {
      changes.push({ action: "create", desired: target });
      continue;
    }
    const normalized = normalizeRecord(current);
    if (
      normalized.content !== target.content ||
      normalized.ttl !== target.ttl ||
      normalized.proxied !== target.proxied
    ) {
      changes.push({ action: "update", id: current.id, before: normalized, desired: target });
    }
  }
  return changes;
}

export class CloudflareClient {
  constructor({ token, baseUrl = "https://api.cloudflare.com/client/v4" } = {}) {
    this.token = token;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request(path, options = {}) {
    if (!this.token) throw new Error("CLOUDFLARE_API_TOKEN_required");
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const message = JSON.stringify(redact(json)).slice(0, 1000);
      throw new Error(`cloudflare_api_failed:${res.status}:${message}`);
    }
    return json.result;
  }

  async zoneByName(name) {
    const result = await this.request(`/zones?name=${encodeURIComponent(name)}&status=active&per_page=1`);
    return Array.isArray(result) ? result[0] : null;
  }

  async listDnsRecords(zoneId) {
    const result = await this.request(`/zones/${zoneId}/dns_records?per_page=500`);
    return Array.isArray(result) ? result.map(normalizeRecordWithId) : [];
  }

  async createDnsRecord(zoneId, record) {
    return this.request(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  async updateDnsRecord(zoneId, id, record) {
    return this.request(`/zones/${zoneId}/dns_records/${id}`, {
      method: "PUT",
      body: JSON.stringify(record),
    });
  }
}

function normalizeRecordWithId(record) {
  return { id: record.id, ...normalizeRecord(record) };
}

export async function buildPlan({ env = process.env, client } = {}) {
  const domain = env.AMTECH_PUBLIC_DOMAIN ?? DEFAULT_DOMAIN;
  const desired = desiredRecords({
    domain,
    ipv4: env.AMTECH_PUBLIC_IPV4,
    ipv6: env.AMTECH_PUBLIC_IPV6,
    includeAaaa: ["1", "true", "yes"].includes(String(env.CLOUDFLARE_ENABLE_AAAA ?? "").toLowerCase()),
    ttl: env.CLOUDFLARE_DNS_TTL ?? DEFAULT_TTL,
    wwwMode: env.CLOUDFLARE_WWW_MODE ?? "cname",
    proxied: ["1", "true", "yes"].includes(String(env.CLOUDFLARE_PROXIED ?? "").toLowerCase()),
  });
  const zoneName = env.CLOUDFLARE_ZONE_NAME ?? domain;
  if (!client) {
    return { zone_name: zoneName, zone_id: env.CLOUDFLARE_ZONE_ID ?? null, desired, existing: [], diff: desired.map((record) => ({ action: "create", desired: record })), api_checked: false };
  }
  const zone = env.CLOUDFLARE_ZONE_ID ? { id: env.CLOUDFLARE_ZONE_ID, name: zoneName } : await client.zoneByName(zoneName);
  if (!zone?.id) throw new Error("cloudflare_zone_not_found");
  const existing = await client.listDnsRecords(zone.id);
  return { zone_name: zoneName, zone_id: zone.id, desired, existing, diff: diffRecords(desired, existing), api_checked: true };
}

function applyAllowed(argv, env) {
  return argv.includes("--apply") && env.CLOUDFLARE_DNS_APPLY_CONFIRM === (env.CLOUDFLARE_ZONE_NAME ?? env.AMTECH_PUBLIC_DOMAIN ?? DEFAULT_DOMAIN);
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const apply = argv.includes("--apply");
  const mock = argv.includes("--mock") || env.CLOUDFLARE_DNS_MOCK === "1";
  const client = mock ? null : new CloudflareClient({ token: env.CLOUDFLARE_API_TOKEN });
  const plan = await buildPlan({ env, client });
  const allowed = applyAllowed(argv, env);
  const applied = [];

  if (apply && !allowed) {
    throw new Error("apply_requires_--apply_and_CLOUDFLARE_DNS_APPLY_CONFIRM");
  }

  if (apply && client) {
    for (const change of plan.diff) {
      if (change.action === "create") {
        const result = await client.createDnsRecord(plan.zone_id, change.desired);
        applied.push({ action: "create", id: result.id, record: change.desired });
      } else if (change.action === "update") {
        const result = await client.updateDnsRecord(plan.zone_id, change.id, change.desired);
        applied.push({ action: "update", id: result.id, record: change.desired });
      }
    }
  }

  const git = gitInfo();
  const proof = redact({
    kind: "cloudflare_dns_desired_state",
    proof_tier: client ? "limited_live_infra" : "static",
    status: apply ? "applied" : "dry_run",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git,
    environment_name: env.AMTECH_ENVIRONMENT_NAME ?? env.NODE_ENV ?? "local",
    zone_name: plan.zone_name,
    zone_id: plan.zone_id,
    api_checked: plan.api_checked,
    desired_records: plan.desired,
    diff: plan.diff,
    applied,
    secrets_logged: false,
    apply_confirmed: allowed,
  });

  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `cloudflare-dns-${stamp()}.json`);
  writeFileSync(path, JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof, null, 2));
  console.log(`proof_json:${path}`);
  return proof;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(redact(String(err?.message ?? err)));
    process.exit(1);
  });
}
