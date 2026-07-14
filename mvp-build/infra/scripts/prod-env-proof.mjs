#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";

const PROOF_KINDS = {
  deploy_smoke: "core",
  caddy_activation_rollback_proof: "caddy_activation",
  caddy_wildcard_dns01_proof: "caddy_wildcard",
  cloudflare_dns_desired_state: "cloudflare_dns",
  pod_alpha_capacity: "capacity",
  egress_policy: "egress",
  backup_restore: "backup_restore",
  red_health: "red_health",
};

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function gitInfo() {
  try {
    return {
      sha: execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim(),
      dirty: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0,
    };
  } catch {
    return { sha: null, dirty: null };
  }
}

function redact(value) {
  if (typeof value === "string") return value.replace(/(Bearer\s+|mcp_|sk_(live|test)_|whsec_|ya29\.)[A-Za-z0-9._-]+/g, "$1[redacted]");
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = /(token|secret|authorization|signature)/i.test(key) ? "[redacted]" : redact(child);
    return out;
  }
  return value;
}

export function loadProofs(dir = proofDir) {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        try {
          const proof = JSON.parse(readFileSync(join(dir, name), "utf8"));
          return [{ ...proof, proof_path: join(dir, name) }];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

function latestByKind(proofs) {
  const latest = {};
  for (const proof of proofs) {
    const kind = proof.kind;
    if (!kind || kind === "production_environment_proof") continue;
    const key = PROOF_KINDS[kind] ?? kind;
    const checked = Date.parse(proof.checked_at ?? proof.timestamp ?? 0);
    const previous = latest[key];
    const previousChecked = Date.parse(previous?.checked_at ?? previous?.timestamp ?? 0);
    if (!previous || checked >= previousChecked) latest[key] = proof;
  }
  return latest;
}

function statusFromProof(proof) {
  if (!proof) return "skipped";
  const status = String(proof.status ?? "").toLowerCase();
  if (["pass", "applied", "dry_run", "ok"].includes(status)) return "pass";
  if (["fail", "failed", "error"].includes(status)) return "fail";
  return "warn";
}

function item(name, proof, reason) {
  return {
    name,
    status: statusFromProof(proof),
    proof_kind: proof?.kind ?? null,
    proof_path: proof?.proof_path ?? null,
    checked_at: proof?.checked_at ?? null,
    reason: proof ? undefined : reason,
  };
}

function isProductionLikeEnv(env) {
  if (env.NODE_ENV === "production") return true;
  if (env.AMTECH_PRODUCTION_LIKE === "1") return true;
  return /(^|[-_])(pod|prod|production|staging)([-_]|$)/i.test(env.AMTECH_ENVIRONMENT_NAME ?? "");
}

function uiFixtureItem(env) {
  const enabled = env.NEXT_PUBLIC_AMTECH_UI_FIXTURES === "1";
  const productionLike = isProductionLikeEnv(env);
  return {
    name: "ui_fixture_mode",
    status: enabled && productionLike ? "fail" : "pass",
    enabled,
    production_like: productionLike,
    reason: enabled && productionLike
      ? "NEXT_PUBLIC_AMTECH_UI_FIXTURES must not be enabled in production-like or pod-like environments"
      : enabled
        ? "fixture mode is enabled for local UI proof only"
        : undefined,
  };
}

function proofSummary(proof) {
  if (!proof) return undefined;
  return {
    kind: proof.kind ?? null,
    status: proof.status ?? null,
    proof_tier: proof.proof_tier ?? null,
    checked_at: proof.checked_at ?? null,
    proof_path: proof.proof_path ?? null,
  };
}

export function summarizeEnvironment(proofs, env = process.env) {
  const latest = latestByKind(proofs);
  const items = [
    item("core_compose", latest.core, "deploy:smoke has not produced proof yet"),
    item("runtime_network", latest.core ?? latest.egress, "no amtech_runtime proof found"),
    item("caddy_activation", latest.caddy_activation, "ops:caddy-proof has not produced proof yet"),
    item("caddy_wildcard_dns01", latest.caddy_wildcard, "ops:caddy-wildcard-proof has not produced proof yet"),
    item("cloudflare_desired_state", latest.cloudflare_dns, "dns:cloudflare:plan has not produced proof yet"),
    item("employee_fleet_routing", latest.capacity ?? latest.core, "capacity/deploy proof has not covered employee routing yet"),
    item("backup_restore", latest.backup_restore, "ops:backup/ops:restore proof not found"),
    item("red_health", latest.red_health, "ops:red-health proof not found"),
    item("egress", latest.egress, "ops:egress-policy proof not found"),
    uiFixtureItem(env),
  ];
  const failed = items.some((check) => check.status === "fail");
  const skipped = items.some((check) => check.status === "skipped");
  const proofTier = latest.cloudflare_dns?.proof_tier === "limited_live_infra" || latest.core?.proof_tier === "limited_live_infra"
    ? "limited_live_infra"
    : latest.core || latest.capacity
      ? "local_mirror"
      : "static";
  return redact({
    kind: "production_environment_proof",
    proof_tier: proofTier,
    status: failed ? "fail" : skipped ? "needs_proof" : "pass",
    checked_at: new Date().toISOString(),
    host: hostname(),
    git: gitInfo(),
    environment_name: env.AMTECH_ENVIRONMENT_NAME ?? env.NODE_ENV ?? "local",
    network_name: env.HERMES_DOCKER_NETWORK ?? "amtech_runtime",
    public_domain: env.AMTECH_PUBLIC_DOMAIN ?? "amtechai.com",
    checks: items,
    latest_proofs: Object.fromEntries(Object.entries(latest).map(([key, proof]) => [key, proofSummary(proof)])),
    status_boundary: {
      static: "script/config checks only",
      local_mirror: "local Docker/Caddy routing proof without public DNS or provider runtime",
      limited_live_infra: "Cloudflare/Caddy/Docker proof where credentials/host allow",
      provider_runtime_live: "not claimed by this script",
    },
  });
}

export async function main() {
  const proof = summarizeEnvironment(loadProofs());
  mkdirSync(proofDir, { recursive: true });
  const proofPath = join(proofDir, `prod-env-proof-${stamp()}.json`);
  writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof, null, 2));
  console.log(`proof_json:${proofPath}`);
  if (proof.status === "fail") process.exit(1);
  return proof;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(String(err?.message ?? err));
    process.exit(1);
  });
}
