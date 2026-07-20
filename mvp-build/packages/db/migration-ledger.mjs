import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APPLIED_HEAD = 72;
const MIGRATION_NAME = /^(\d{4})_[a-z0-9][a-z0-9_]*\.sql$/;

export function inspectMigrationLedger(migrationsDir) {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const entries = files.map((name) => {
    const match = MIGRATION_NAME.exec(name);
    if (!match) throw new Error(`invalid migration filename: ${name}`);
    const number = Number(match[1]);
    const content = readFileSync(join(migrationsDir, name));
    return {
      number,
      name,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  });

  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.number)) throw new Error(`duplicate migration number: ${entry.number.toString().padStart(4, "0")}`);
    seen.add(entry.number);
  }

  for (let number = 1; number <= APPLIED_HEAD; number += 1) {
    if (!seen.has(number)) throw new Error(`missing applied migration: ${number.toString().padStart(4, "0")}`);
  }

  for (let index = 0; index < entries.length; index += 1) {
    const expected = index + 1;
    if (entries[index].number !== expected) {
      throw new Error(`out-of-order migration ledger: expected ${expected.toString().padStart(4, "0")}, found ${entries[index].name}`);
    }
  }

  const ledgerSha256 = createHash("sha256")
    .update(entries.map(({ name, sha256 }) => `${name}\t${sha256}`).join("\n"))
    .digest("hex");

  return {
    appliedHead: APPLIED_HEAD,
    migrationCount: entries.length,
    ledgerSha256,
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
