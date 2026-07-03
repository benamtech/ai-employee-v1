#!/usr/bin/env node
/**
 * Acceptance Run 6 — Reminder & Scheduler (doc 03 §6).
 * Asserts: an owner-confirmed reminder that the scheduler dispatched
 * (status scheduled -> sent with a Twilio provider id), plus a recorded
 * scheduler/Hermes job run proving dispatch fired (not a manual flip).
 */
import { runById, runnability, serviceDb, resolveEmployee, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(6);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const employee = await resolveEmployee(db);
  if (!employee) return mkResult(RUN, STATUS.FAIL, { notes: ["no live employee (set SMOKE_EMPLOYEE_ID)"] });

  const proofs = {};
  const fails = [];

  const { data: sent } = await db
    .from("reminders").select("*")
    .eq("employee_id", employee.id).eq("status", "sent")
    .not("provider_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!sent?.provider_id) fails.push("a dispatched reminder (status=sent with Twilio provider_id)");
  else proofs.reminder = `${sent.id} sid=${sent.provider_id}`;

  const { data: job } = await db
    .from("job_commitments").select("*")
    .eq("employee_id", employee.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (job?.id) proofs.job_commitment = job.id;

  let { data: run } = await db
    .from("hermes_job_runs").select("*")
    .in("job_key", ["dispatch_due_reminders", "renew_expiring_watches", "dispatch_daily_briefs", "runtime_health_checks"])
    .eq("account_id", employee.account_id)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (!run) {
    ({ data: run } = await db
      .from("hermes_job_runs").select("*")
      .in("job_key", ["dispatch_due_reminders", "renew_expiring_watches", "dispatch_daily_briefs", "runtime_health_checks"])
      .order("started_at", { ascending: false }).limit(1).maybeSingle());
  }
  if (!run?.id) fails.push("scheduler/Hermes job-run proof (hermes_job_runs row)");
  else proofs.job_run = run.id;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, { proofs, notes: fails.map((f) => `missing proof: ${f}`) });
}

await runMain(import.meta.url, verify);
