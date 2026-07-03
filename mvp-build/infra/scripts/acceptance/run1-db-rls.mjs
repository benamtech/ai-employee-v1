#!/usr/bin/env node
/**
 * Acceptance Run 1 — Database & RLS (doc 03 §1).
 * Confirms migrations 0001–0008 are applied (service client can reach a table from
 * each migration era). RLS cross-account DENIAL is proven separately by the live
 * integration test `npm run test:integration` (tests/integration/rls-cross-account.test.ts);
 * this verifier does not — and must not — claim that part on its own.
 */
import { runById, runnability, serviceDb, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(1);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const proofs = {};
  const probes = [
    ["accounts", "0001 base"],
    ["artifacts", "0004 artifacts"],
    ["gmail_watches", "0005 gmail"],
    ["reminders", "0006 reminders"],
    ["hermes_job_runs", "0007 repair/jobs"],
    ["runtime_health_checks", "0008 runtime/scheduler"],
  ];
  for (const [table, label] of probes) {
    const { error } = await db.from(table).select("id", { head: true, count: "exact" });
    if (error) {
      return mkResult(RUN, STATUS.FAIL, {
        proofs,
        notes: [`migration not applied: ${table} (${label}) — ${error.message}`, "run `npm run db:migrate`"],
      });
    }
    proofs[`table:${table}`] = `present (${label})`;
  }
  return mkResult(RUN, STATUS.PASS, {
    proofs,
    notes: ["RLS cross-account DENIAL proof is separate: `npm run test:integration` (rls-cross-account.test.ts)."],
  });
}

await runMain(import.meta.url, verify);
