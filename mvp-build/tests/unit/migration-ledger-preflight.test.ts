import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectMigrationLedger, inspectRepositoryMigrationLedger } from "../../packages/db/migration-ledger.mjs";

const temporaryDirectories: string[] = [];

function makeLedger(count = 73) {
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
  it("inventories the repository ledger through immutable head 0073 including approved historical supplements", () => {
    const ledger = inspectRepositoryMigrationLedger();
    expect(ledger.appliedHead).toBe(73);
    expect(ledger.migrationCount).toBeGreaterThan(73);
    expect(ledger.entries[0]?.number).toBe(1);
    expect(ledger.entries.some((entry) => entry.name === "0044b_connector_compatibility_timestamps.sql" && entry.number === 44 && entry.suffix === "b")).toBe(true);
    expect(ledger.entries.some((entry) => entry.name === "0073_turn_claim_assignment_scope.sql" && entry.number === 73)).toBe(true);
    expect(ledger.historicalSupplementalSequences).toEqual([31, 44, 57, 58, 59]);
    expect(ledger.ledgerSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(ledger.entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
  });

  it("produces the same ledger hash for unchanged contents", () => {
    const directory = makeLedger();
    expect(inspectMigrationLedger(directory).ledgerSha256).toBe(inspectMigrationLedger(directory).ledgerSha256);
  });

  it("rejects a missing applied migration", () => {
    const directory = makeLedger(72);
    expect(() => inspectMigrationLedger(directory)).toThrow("missing applied migration: 0073");
  });

  it("rejects an unapproved duplicate migration sequence", () => {
    const directory = makeLedger();
    writeFileSync(join(directory, "0073_duplicate.sql"), "select 73;\n");
    expect(() => inspectMigrationLedger(directory)).toThrow("unapproved duplicate migration sequence: 0073");
  });

  it("does not accept a lookalike supplemental file outside the immutable historical allowlist", () => {
    const directory = makeLedger();
    writeFileSync(join(directory, "0044b_unapproved.sql"), "select 44;\n");
    expect(() => inspectMigrationLedger(directory)).toThrow("unapproved duplicate migration sequence: 0044");
  });

  it("changes the ledger hash when an applied migration changes", () => {
    const directory = makeLedger();
    const before = inspectMigrationLedger(directory).ledgerSha256;
    writeFileSync(join(directory, "0042_migration_0042.sql"), "select 420;\n");
    expect(inspectMigrationLedger(directory).ledgerSha256).not.toBe(before);
  });
});
