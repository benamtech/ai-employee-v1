#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { hostname } from "node:os";

const [action, archiveArg] = process.argv.slice(2);
const proofDir = process.env.AMTECH_PROOF_DIR ?? "infra/proofs";
const backupDir = process.env.AMTECH_BACKUP_DIR ?? "/tmp/amtech-backups";
const hermesHome = process.env.HERMES_HOME ?? "/var/lib/amtech/hermes";
const clientsDir = process.env.AMTECH_CLIENTS_DIR ?? "/var/lib/amtech/clients";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed: ${`${res.stdout ?? ""}${res.stderr ?? ""}`.trim()}`);
  }
  return String(res.stdout ?? "").trim();
}

function sha256(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function gitSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function proof(kind, status, extra) {
  mkdirSync(proofDir, { recursive: true });
  const path = join(proofDir, `${kind}-${stamp()}.json`);
  const body = { kind, status, checked_at: new Date().toISOString(), host: hostname(), git_sha: gitSha(), ...extra };
  writeFileSync(path, JSON.stringify(body, null, 2));
  console.log(`proof_json:${path}`);
  return body;
}

function ensureReadableDir(path) {
  if (!existsSync(path)) throw new Error(`missing_dir:${path}`);
  if (!statSync(path).isDirectory()) throw new Error(`not_a_dir:${path}`);
}

async function backup() {
  ensureReadableDir(hermesHome);
  ensureReadableDir(clientsDir);
  mkdirSync(backupDir, { recursive: true });
  const archive = join(backupDir, `amtech-vps-state-${stamp()}.tar.gz`);
  run("tar", [
    "-C", "/",
    "-czf", archive,
    resolve(hermesHome).replace(/^\//, ""),
    resolve(clientsDir).replace(/^\//, ""),
  ]);
  const manifest = {
    archive,
    sha256: sha256(archive),
    bytes: statSync(archive).size,
    roots: { hermes_home: hermesHome, clients_dir: clientsDir },
  };
  writeFileSync(`${archive}.json`, JSON.stringify(manifest, null, 2));
  writeFileSync(`${archive}.sha256`, `${manifest.sha256}  ${basename(archive)}\n`);
  console.log(`PASS backup archive:${archive} bytes:${manifest.bytes}`);
  proof("backup", "pass", manifest);
}

async function restore() {
  const archive = archiveArg ?? process.env.AMTECH_RESTORE_ARCHIVE;
  if (!archive) throw new Error("restore requires archive path argument or AMTECH_RESTORE_ARCHIVE");
  if (!existsSync(archive)) throw new Error(`archive_not_found:${archive}`);
  const expected = process.env.AMTECH_RESTORE_SHA256;
  const actual = sha256(archive);
  if (expected && expected !== actual) throw new Error(`sha256_mismatch expected:${expected} actual:${actual}`);
  const target = process.env.AMTECH_RESTORE_ROOT ?? "/";
  if (process.env.AMTECH_RESTORE_APPLY !== "1") {
    console.log(`DRY RUN restore archive:${archive} sha256:${actual}`);
    console.log("Set AMTECH_RESTORE_APPLY=1 to extract.");
    proof("restore", "dry_run", { archive, sha256: actual, target });
    return;
  }
  run("tar", ["-C", target, "-xzf", archive]);
  console.log(`PASS restore archive:${archive} target:${target}`);
  proof("restore", "pass", { archive, sha256: actual, target });
}

try {
  if (action === "backup") await backup();
  else if (action === "restore") await restore();
  else {
    console.error("Usage: backup-restore.mjs <backup|restore> [archive]");
    process.exit(2);
  }
} catch (err) {
  console.error(`FAIL ${String(err?.message ?? err)}`);
  proof(action === "restore" ? "restore" : "backup", "fail", { error: String(err?.message ?? err) });
  process.exit(1);
}
