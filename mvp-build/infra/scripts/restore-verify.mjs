#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";

const manifestPath = resolve(process.argv[2] ?? process.env.AMTECH_BACKUP_MANIFEST ?? "");
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const restoreRoot = resolve(process.env.AMTECH_RESTORE_ROOT ?? "/");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", env: process.env });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:${output.slice(0, 3000)}`);
  return output;
}
function dbSnapshot(url) {
  const sql = `select jsonb_build_object(
    'effect_receipts', (select count(*) from effect_receipts),
    'commercial_usage_receipts', (select count(*) from commercial_usage_receipts),
    'effect_proof_projections', (select count(*) from effect_proof_projections),
    'projected_proofs', (select count(*) from effect_proof_projections where state='projected'),
    'refindable_projected_proofs', (select count(*) from effect_proof_projections where state='projected' and proof_ref is not null and output_ref is not null),
    'accepted_gateway_requests', (select count(*) from model_gateway_request_reservations where state='accepted'),
    'accepted_gateway_committed_minor', (select coalesce(sum(committed_amount_minor),0) from model_gateway_request_reservations where state='accepted')
  )::text;`;
  return JSON.parse(run("psql", [url, "-XAt", "-v", "ON_ERROR_STOP=1", "-c", sql]));
}
function proof(status, extra) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `restore-verify-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(path, JSON.stringify({ kind: "restore_verify", status, checked_at: new Date().toISOString(), host: hostname(), ...extra }, null, 2));
  console.log(`proof_json:${path}`);
}

try {
  if (!manifestPath || !existsSync(manifestPath)) throw new Error("backup_manifest_required");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schema !== "amtech.backup-manifest.v2") throw new Error("backup_manifest_schema_invalid");
  const url = process.env.AMTECH_RESTORE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("restore_database_url_required");
  const actualSecrets = JSON.parse(process.env.AMTECH_SECRET_VERSION_REFS ?? "{}");
  if (JSON.stringify(sort(actualSecrets)) !== JSON.stringify(sort(manifest.secret_versions ?? {}))) {
    throw new Error("restore_secret_version_mismatch");
  }
  const snapshot = dbSnapshot(url);
  if (JSON.stringify(snapshot) !== JSON.stringify(manifest.accepted_work)) {
    throw new Error(`restore_durable_truth_mismatch:${JSON.stringify({ expected: manifest.accepted_work, actual: snapshot })}`);
  }
  if (snapshot.projected_proofs !== snapshot.refindable_projected_proofs) {
    throw new Error("restore_proof_refinding_incomplete");
  }
  const missing = (manifest.filesystem_entries ?? [])
    .map((entry) => resolve(restoreRoot, entry))
    .filter((path) => !existsSync(path));
  if (missing.length) throw new Error(`restore_filesystem_entries_missing:${missing.slice(0, 20).join(",")}`);
  proof("pass", {
    backup_id: manifest.backup_id,
    release_manifest_digest: manifest.release_manifest_digest,
    durable_truth: snapshot,
    filesystem_entry_count: manifest.filesystem_entries.length,
    secret_versions: manifest.secret_versions,
    evidence_classes: { restore_continuity: "runtime_local_only", target_host: "not_established", production: "not_established" },
  });
  console.log(JSON.stringify({ status: "ok", backup_id: manifest.backup_id, proof_refinding: "complete", durable_truth: snapshot }, null, 2));
} catch (error) {
  const message = String(error?.message ?? error);
  proof("fail", { reason: message, manifest: manifestPath });
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function sort(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
