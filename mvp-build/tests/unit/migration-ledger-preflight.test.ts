import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectMigrationLedger, inspectRepositoryMigrationLedger } from "../../packages/db/migration-ledger.mjs";

const temporaryDirectories: string[] = [];

function makeLedger(count = 72) {
  const directory = mkdtempSync(join(tmpdir(), "amtech-migrations-"));
  temporaryDirectories.push(directory);
  for (let number = 1; number <= count; number += 1) {
    const prefix = number.toString().padStart(4, "0");
    writeFileSync(join(directory, `${prefix}_migration_${prefix}.sql`), `select ${number};\n`);
  }
  return directory;
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    rmSync(temporaryDirectories.pop()!, { recursive: true, force: true });
  }
});

describe("DB-P0-01 migration ledger preflight", () => {
  it("inventories the repository ledger through immutable head 0072", () => {
    const ledger = inspectRepositoryMigrationLedger();
    expect(ledger.appliedHead).toBe(72);
    expect(ledger.migrationCount).toBeGreaterThanOrEqual(72);
    expect(ledger.entries[0]?.number).toBe(1);
    expect(ledger.entries[71]?.number).toBe(72);
    expect(ledger.ledgerSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(ledger.entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
  });

  it("produces the same ledger hash for unchanged contents", () => {
    const directory = makeLedger();
    expect(inspectMigrationLedger(directory).ledgerSha256).toBe(inspectMigrationLedger(directory).ledgerSha256);
  });

  it("rejects a missing applied migration", () => {
    const directory = makeLedger(71);
    expect(() => inspectMigrationLedger(directory)).toThrow("missing applied migration: 0072");
  });

  it("rejects duplicate migration numbers", () => {
    const directory = makeLedger();
    writeFileSync(join(directory, "0072_duplicate.sql"), "select 72;\n");
    expect(() => inspectMigrationLedger(directory)).toThrow("duplicate migration number: 0072");
  });

  it("changes the ledger hash when an applied migration changes", () => {
    const directory = makeLedger();
    const before = inspectMigrationLedger(directory).ledgerSha256;
    writeFileSync(join(directory, "0042_migration_0042.sql"), "select 420;\n");
    expect(inspectMigrationLedger(directory).ledgerSha256).not.toBe(before);
  });
});
