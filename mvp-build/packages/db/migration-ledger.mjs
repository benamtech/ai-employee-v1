import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APPLIED_HEAD = 79;
const MIGRATION_NAME = /^(\d{4})([a-z]?)_[a-z0-9][a-z0-9_]*\.sql$/;

/**
 * Historical migration sequences that were already applied as more than one
 * ordered file before the immutable ledger contract existed. New duplicate
 * sequence numbers are rejected; these exact sets are preserved by filename
 * and content hash rather than being renumbered or rewritten.
 */
const APPROVED_HISTORICAL_SEQUENCE_FILES = Object.freeze({
  31: Object.freeze([
    "0031_public_estimator.sql",
    "0031_runtime_boundary_foundations.sql",
  ]),
  44: Object.freeze([
    "0044_connector_binding_scope_dimensions.sql",
    "0044b_connector_compatibility_timestamps.sql",
  ]),
  57: Object.freeze([
    "0057_platform_command_actor_enforcement.sql",
    "0057a_authority_surface_categories.sql",
  ]),
  58: Object.freeze([
    "0058_authority_version_revocation_spine.sql",
    "0058_platform_command_session_lease_binding.sql",
  ]),
  59: Object.freeze([
    "0059_authority_version_operational_closure.sql",
    "0059_platform_command_exact_lease_resolution.sql",
  ]),
});

function sameNames(actual, expected) {
  return actual.length === expected.length && actual.every((name, index) => name === expected[index]);
}

export function inspectMigrationLedger(migrationsDir) {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const entries = files.map((name) => {
    const match = MIGRATION_NAME.exec(name);
    if (!match) throw new Error(`invalid migration filename: ${name}`);
    const number = Number(match[1]);
    const suffix = match[2] ?? "";
    const content = readFileSync(join(migrationsDir, name));
    return {
      number,
      identifier: `${match[1]}${suffix}`,
      suffix,
      name,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  });

  for (let index = 1; index < entries.length; index += 1) {
    if (entries[index].number < entries[index - 1].number) {
      throw new Error(`out-of-order migration ledger: ${entries[index - 1].name} before ${entries[index].name}`);
    }
  }

  const byNumber = new Map();
  for (const entry of entries) {
    const group = byNumber.get(entry.number) ?? [];
    group.push(entry);
    byNumber.set(entry.number, group);
  }

  for (const [number, group] of byNumber) {
    const names = group.map((entry) => entry.name).sort();
    if (group.length === 1) continue;
    const approved = APPROVED_HISTORICAL_SEQUENCE_FILES[number];
    if (!approved || number > APPLIED_HEAD || !sameNames(names, [...approved].sort())) {
      throw new Error(`unapproved duplicate migration sequence: ${number.toString().padStart(4, "0")}`);
    }
  }

  for (let number = 1; number <= APPLIED_HEAD; number += 1) {
    if (!byNumber.has(number)) throw new Error(`missing applied migration: ${number.toString().padStart(4, "0")}`);
  }

  const ledgerSha256 = createHash("sha256")
    .update(entries.map(({ name, sha256 }) => `${name}\t${sha256}`).join("\n"))
    .digest("hex");

  return {
    appliedHead: APPLIED_HEAD,
    migrationCount: entries.length,
    ledgerSha256,
    historicalSupplementalSequences: Object.keys(APPROVED_HISTORICAL_SEQUENCE_FILES).map(Number),
    entries,
  };
}

export function inspectRepositoryMigrationLedger() {
  const here = dirname(fileURLToPath(import.meta.url));
  return inspectMigrationLedger(join(here, "migrations"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(inspectRepositoryMigrationLedger(), null, 2)}\n`);
}
