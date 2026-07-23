#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { hostname, tmpdir } from "node:os";

const [action, archiveArg] = process.argv.slice(2);
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const backupDir = process.env.AMTECH_BACKUP_DIR ?? "/tmp/amtech-backups";
const hermesHome = resolve(process.env.HERMES_HOME ?? "/var/lib/amtech/hermes");
const clientsDir = resolve(process.env.AMTECH_CLIENTS_DIR ?? "/var/lib/amtech/clients");

function stamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", env: process.env, ...options });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:${output.slice(0, 3000)}`);
  return String(result.stdout ?? "").trim();
}
function sha256(path) { const hash = createHash("sha256"); hash.update(readFileSync(path)); return hash.digest("hex"); }
function gitSha() { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }
function proof(kind, status, extra) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `${kind}-${stamp()}.json`);
  writeFileSync(path, JSON.stringify({ kind, status, checked_at: new Date().toISOString(), host: hostname(), git_sha: gitSha(), ...extra }, null, 2));
  console.log(`proof_json:${path}`);
}
function ensureDir(path) {
  if (!existsSync(path)) throw new Error(`missing_dir:${path}`);
  if (!statSync(path).isDirectory()) throw new Error(`not_a_dir:${path}`);
}
function databaseSnapshot(url) {
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
function secretVersions() {
  const value = JSON.parse(process.env.AMTECH_SECRET_VERSION_REFS ?? "{}");
  if (!value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length) throw new Error("backup_secret_version_refs_required");
  for (const [name, version] of Object.entries(value)) if (!name || typeof version !== "string" || !version.trim()) throw new Error("backup_secret_version_ref_invalid");
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
function filesystemEntries(archive) {
  return run("tar", ["-tzf", archive]).split("\n").map((entry) => entry.trim()).filter(Boolean).sort();
}

async function backup() {
  ensureDir(hermesHome); ensureDir(clientsDir);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("backup_database_url_required");
  const releaseManifest = resolve(process.env.AMTECH_RELEASE_MANIFEST ?? "infra/proofs/release-manifest.json");
  if (!existsSync(releaseManifest)) throw new Error("backup_release_manifest_required");
  if (!process.env.AMTECH_RELEASE_PUBLIC_KEY_PEM || !process.env.AMTECH_RELEASE_EXPECTED_PUBLIC_KEY_FINGERPRINT) throw new Error("backup_release_trust_material_required");
  run(process.execPath, ["infra/scripts/verify-release-manifest.mjs", releaseManifest]);

  mkdirSync(backupDir, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "amtech-backup-"));
  try {
    const databaseDump = join(work, "database.dump");
    const filesystemArchive = join(work, "filesystem.tar.gz");
    const releaseCopy = join(work, "release-manifest.json");
    const manifestPath = join(work, "backup-manifest.json");
    run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", databaseDump, databaseUrl]);
    run("tar", ["-C", "/", "-czf", filesystemArchive, hermesHome.replace(/^\//, ""), clientsDir.replace(/^\//, "")]);
    writeFileSync(releaseCopy, readFileSync(releaseManifest));
    const release = JSON.parse(readFileSync(releaseManifest, "utf8"));
    const backupId = `backup_${randomUUID().replaceAll("-", "")}`;
    const manifest = {
      schema: "amtech.backup-manifest.v2",
      backup_id: backupId,
      created_at: new Date().toISOString(),
      source_git_sha: gitSha(),
      release_git_sha: release.git_sha,
      release_manifest_digest: release.payload_digest,
      release_public_key_fingerprint: release.signature.public_key_fingerprint,
      migration_head: release.migration_head,
      database: { file: "database.dump", sha256: sha256(databaseDump), bytes: statSync(databaseDump).size },
      filesystem: { file: "filesystem.tar.gz", sha256: sha256(filesystemArchive), bytes: statSync(filesystemArchive).size, roots: [hermesHome, clientsDir] },
      filesystem_entries: filesystemEntries(filesystemArchive),
      secret_versions: secretVersions(),
      accepted_work: databaseSnapshot(databaseUrl),
      evidence_classes: { backup_bundle: "runtime_local_only", managed_backup: "not_established", restore: "not_established", production: "not_established" },
    };
    if (manifest.accepted_work.projected_proofs !== manifest.accepted_work.refindable_projected_proofs) throw new Error("backup_contains_unrefindable_projected_proof");
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const bundle = join(backupDir, `amtech-backup-${backupId}.tar.gz`);
    run("tar", ["-C", work, "-czf", bundle, "backup-manifest.json", "database.dump", "filesystem.tar.gz", "release-manifest.json"]);
    writeFileSync(`${bundle}.sha256`, `${sha256(bundle)}  ${basename(bundle)}\n`);
    console.log(`PASS backup bundle:${bundle} bytes:${statSync(bundle).size}`);
    proof("backup", "pass", { backup_id: backupId, bundle, bundle_sha256: sha256(bundle), manifest, evidence_classes: manifest.evidence_classes });
  } finally { rmSync(work, { recursive: true, force: true }); }
}

async function restore() {
  const bundle = resolve(archiveArg ?? process.env.AMTECH_RESTORE_ARCHIVE ?? "");
  if (!bundle || !existsSync(bundle)) throw new Error("restore_bundle_required");
  const expected = process.env.AMTECH_RESTORE_SHA256;
  const actual = sha256(bundle);
  if (!expected || expected !== actual) throw new Error(`restore_bundle_sha256_mismatch:${actual}`);
  const work = mkdtempSync(join(tmpdir(), "amtech-restore-"));
  try {
    run("tar", ["-C", work, "-xzf", bundle]);
    const manifestPath = join(work, "backup-manifest.json");
    if (!existsSync(manifestPath)) throw new Error("restore_backup_manifest_missing");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.schema !== "amtech.backup-manifest.v2") throw new Error("restore_backup_manifest_invalid");
    for (const [section, file] of [["database", "database.dump"], ["filesystem", "filesystem.tar.gz"]]) {
      const path = join(work, file);
      if (!existsSync(path) || sha256(path) !== manifest[section].sha256) throw new Error(`restore_${section}_digest_mismatch`);
    }
    const releasePath = join(work, "release-manifest.json");
    if (!process.env.AMTECH_RELEASE_PUBLIC_KEY_PEM || !process.env.AMTECH_RELEASE_EXPECTED_PUBLIC_KEY_FINGERPRINT) throw new Error("restore_release_trust_material_required");
    run(process.execPath, ["infra/scripts/verify-release-manifest.mjs", releasePath], { env: { ...process.env, AMTECH_RELEASE_VERIFY_REPOSITORY: "0", AMTECH_RELEASE_VERIFY_LOCAL_IMAGES: "0" } });
    const currentSecrets = secretVersions();
    if (JSON.stringify(currentSecrets) !== JSON.stringify(manifest.secret_versions)) throw new Error("restore_secret_version_mismatch");
    if (process.env.AMTECH_RESTORE_APPLY !== "1") {
      proof("restore", "dry_run", { backup_id: manifest.backup_id, bundle, bundle_sha256: actual, release_manifest_digest: manifest.release_manifest_digest, proof_refinding: "not_run", evidence_classes: { restore_plan: "locally_proven", restore: "not_established" } });
      return;
    }
    if (process.env.AMTECH_RESTORE_ALLOW_REPLACE !== "1") throw new Error("restore_replace_confirmation_required");
    const databaseUrl = process.env.AMTECH_RESTORE_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("restore_database_url_required");
    const target = resolve(process.env.AMTECH_RESTORE_ROOT ?? "/");
    run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--exit-on-error", "--dbname", databaseUrl, join(work, "database.dump")]);
    run("tar", ["-C", target, "-xzf", join(work, "filesystem.tar.gz")]);
    const verificationManifest = join(work, "verification-manifest.json");
    writeFileSync(verificationManifest, JSON.stringify(manifest));
    run(process.execPath, ["infra/scripts/restore-verify.mjs", verificationManifest], { env: { ...process.env, AMTECH_RESTORE_DATABASE_URL: databaseUrl, AMTECH_RESTORE_ROOT: target } });
    proof("restore", "pass", { backup_id: manifest.backup_id, bundle, bundle_sha256: actual, database: "restored", filesystem: "restored", secret_versions: "matched", release_manifest_digest: manifest.release_manifest_digest, proof_refinding: "pass", evidence_classes: { restore_continuity: "runtime_local_only", managed_restore: "not_established", production: "not_established" } });
  } finally { rmSync(work, { recursive: true, force: true }); }
}

try {
  if (action === "backup") await backup();
  else if (action === "restore") await restore();
  else throw new Error("usage:backup-restore.mjs <backup|restore> [bundle]");
} catch (error) {
  const message = String(error?.message ?? error);
  console.error(`FAIL ${message}`);
  proof(action === "restore" ? "restore" : "backup", "fail", { reason: message });
  process.exit(1);
}
