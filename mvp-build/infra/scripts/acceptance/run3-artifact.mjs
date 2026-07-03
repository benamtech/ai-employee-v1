#!/usr/bin/env node
/**
 * Acceptance Run 3 — Estimate Artifact (doc 03 §3).
 * Asserts: an artifact with a Supabase Storage ref, a signed artifact link row
 * (token_hash stored, never the raw token), and an `artifact:access` audit row
 * proving the signed link was opened at least once.
 */
import { runById, runnability, serviceDb, resolveEmployee, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(3);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const employee = await resolveEmployee(db);
  if (!employee) return mkResult(RUN, STATUS.FAIL, { notes: ["no live employee (set SMOKE_EMPLOYEE_ID)"] });

  const proofs = {};
  const fails = [];

  const { data: artifact } = await db
    .from("artifacts").select("*")
    .eq("employee_id", employee.id).not("storage_ref", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!artifact) {
    return mkResult(RUN, STATUS.FAIL, { notes: ["no artifact with a storage_ref (have the employee produce an estimate PDF)"] });
  }
  proofs.artifact = `${artifact.id} (${artifact.kind})`;
  proofs.storage_ref = artifact.storage_ref;

  const { data: link } = await db
    .from("artifact_links").select("*")
    .eq("artifact_id", artifact.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!link?.token_hash) fails.push("signed artifact link (token_hash)");
  else proofs.artifact_link = `${link.id} (access_count=${link.access_count})`;

  const { data: access } = await db
    .from("audit_log").select("*")
    .eq("employee_id", employee.id).eq("action", "artifact:access")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!access) fails.push("audit artifact:access row (open the signed link once)");
  else proofs.audit_access = access.id;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, { proofs, notes: fails.map((f) => `missing proof: ${f}`) });
}

await runMain(import.meta.url, verify);
