#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { join, resolve } from "node:path";
import {
  PRODUCTION_COMPOSE_FILE,
  PRODUCTION_CONTROL_SERVICES,
  PRODUCTION_ENV_FILE,
} from "./production-topology.mjs";
import { RELEASE_SERVICES } from "./release-manifest-contract.mjs";

const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const manifestPath = resolve(process.env.AMTECH_PREVIOUS_RELEASE_MANIFEST ?? "");
const apply = process.env.AMTECH_ROLLBACK_APPLY === "1";

function stamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", env: process.env, ...options });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:${output.slice(0, 3000)}`);
  return output;
}
function digest(path) {
  return createHash("sha256").update(readFileSync(resolve(path))).digest("hex");
}
function proof(status, extra) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `deploy-rollback-${stamp()}.json`);
  writeFileSync(path, JSON.stringify({
    kind: "deploy_rollback",
    status,
    checked_at: new Date().toISOString(),
    host: hostname(),
    compose_file: PRODUCTION_COMPOSE_FILE,
    control_services: PRODUCTION_CONTROL_SERVICES,
    ...extra,
  }, null, 2));
  console.log(`proof_json:${path}`);
}
function databaseSnapshot() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("rollback_database_url_required");
  const sql = `select jsonb_build_object(
    'effect_receipts', (select count(*) from effect_receipts),
    'commercial_usage_receipts', (select count(*) from commercial_usage_receipts),
    'effect_proof_projections', (select count(*) from effect_proof_projections),
    'accepted_gateway_requests', (select count(*) from model_gateway_request_reservations where state='accepted'),
    'accepted_gateway_committed_minor', (select coalesce(sum(committed_amount_minor),0) from model_gateway_request_reservations where state='accepted')
  )::text;`;
  return JSON.parse(run("psql", [url, "-XAt", "-v", "ON_ERROR_STOP=1", "-c", sql]));
}
function databaseMigrationHead() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("rollback_database_url_required");
  const sql = `select coalesce(lpad(max((substring(name from '^([0-9]{4})'))::int)::text,4,'0'),'0000') from _migrations;`;
  const value = run("psql", [url, "-XAt", "-v", "ON_ERROR_STOP=1", "-c", sql]).trim();
  if (!/^\d{4}$/.test(value)) throw new Error("rollback_database_migration_head_invalid");
  return value;
}
function assertConfigurationCompatibility(manifest) {
  const checks = [
    [manifest.compose.path, manifest.compose.sha256, "compose"],
    ["infra/caddy/production.Caddyfile", manifest.configuration.caddyfile_sha256, "caddyfile"],
    ["infra/scripts/production-topology.mjs", manifest.configuration.topology_sha256, "topology"],
  ];
  const mismatches = checks
    .filter(([path, expected]) => !existsSync(resolve(path)) || digest(path) !== expected)
    .map(([, , label]) => label);
  if (mismatches.length) throw new Error(`rollback_release_configuration_mismatch:${mismatches.join(",")}`);
}

let previousSha = null;
try {
  if (!manifestPath || !existsSync(manifestPath)) throw new Error("previous_release_manifest_required");
  if (!process.env.AMTECH_RELEASE_PUBLIC_KEY_PEM) throw new Error("previous_release_public_key_required");
  if (!process.env.AMTECH_RELEASE_EXPECTED_PUBLIC_KEY_FINGERPRINT) throw new Error("previous_release_trusted_fingerprint_required");

  run(process.execPath, ["infra/scripts/verify-release-manifest.mjs", manifestPath], {
    env: { ...process.env, AMTECH_RELEASE_VERIFY_REPOSITORY: "0" },
  });
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  previousSha = manifest.git_sha;
  if (!/^[a-f0-9]{40}$/.test(previousSha)) throw new Error("rollback_previous_exact_git_sha_required");
  const missing = RELEASE_SERVICES.filter((service) => !manifest.images?.[service]?.ref);
  if (missing.length) throw new Error(`rollback_manifest_images_missing:${missing.join(",")}`);
  assertConfigurationCompatibility(manifest);
  const currentMigrationHead = databaseMigrationHead();
  if (currentMigrationHead !== manifest.migration_head) {
    throw new Error(`rollback_migration_head_mismatch:database=${currentMigrationHead}:release=${manifest.migration_head}`);
  }

  const plan = [
    ["docker", ["compose", "-f", PRODUCTION_COMPOSE_FILE, "--env-file", PRODUCTION_ENV_FILE, "config", "--quiet"]],
    ["docker", ["compose", "-f", PRODUCTION_COMPOSE_FILE, "--env-file", PRODUCTION_ENV_FILE, "stop", "caddy", "web", "manager", "model-gateway", "host-provisioner"]],
    ["docker", ["compose", "-f", PRODUCTION_COMPOSE_FILE, "--env-file", PRODUCTION_ENV_FILE, "up", "-d", "host-provisioner", "model-gateway", "manager", "web", "caddy"]],
    [process.execPath, ["infra/scripts/deploy-smoke.mjs"]],
  ];

  if (!apply) {
    for (const [command, args] of plan) console.log(`AMTECH_GIT_SHA=${previousSha} ${command} ${args.join(" ")}`);
    proof("plan_only", {
      previous_release_sha: previousSha,
      previous_manifest_digest: manifest.payload_digest,
      database_migration_head: currentMigrationHead,
      configuration_compatibility: "exact_hash_match",
      image_identity: "signed_manifest_exact_refs",
      apply_required: true,
      commands: plan.map(([command, args]) => `AMTECH_GIT_SHA=${previousSha} ${command} ${args.join(" ")}`),
      evidence_classes: { rollback_plan: "locally_proven", rollback_rehearsal: "not_established" },
    });
    process.exit(0);
  }

  const before = databaseSnapshot();
  const originalSha = process.env.AMTECH_GIT_SHA;
  process.env.AMTECH_GIT_SHA = previousSha;
  try {
    for (const [command, args] of plan) run(command, args);
  } finally {
    if (originalSha === undefined) delete process.env.AMTECH_GIT_SHA;
    else process.env.AMTECH_GIT_SHA = originalSha;
  }
  const after = databaseSnapshot();
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("rollback_accepted_work_conservation_failed");

  proof("pass", {
    previous_release_sha: previousSha,
    previous_manifest_digest: manifest.payload_digest,
    database_migration_head: currentMigrationHead,
    configuration_compatibility: "exact_hash_match",
    image_identity: "signed_manifest_exact_refs",
    accepted_work_before: before,
    accepted_work_after: after,
    smoke: "pass",
    evidence_classes: { source: "represented", rollback_rehearsal: "runtime_local_only", target_host: "not_established", production: "not_established" },
  });
} catch (error) {
  const message = String(error?.message ?? error);
  console.error(`FAIL ${message}`);
  proof("fail", { reason: message, previous_release_sha: previousSha, retry_permission: "blocked_until_nonacceptance_or_operator_compatibility_proof" });
  process.exit(1);
}
