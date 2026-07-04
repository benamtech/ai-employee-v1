import { ID_PREFIX, newId, type ToolEnvelope } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import type { ToolContext } from "../tools/types.js";
import { eventTools } from "../tools/events.stub.js";
import { gmailTools } from "../tools/gmail.stub.js";
import { recordRuntimeHealthSnapshots } from "./runtime-health.js";
import { drainQueuedTurns } from "./turn-drain.js";

export const SCHEDULER_JOB_KEYS = [
  "dispatch_due_reminders",
  "renew_expiring_watches",
  "dispatch_daily_briefs",
  "runtime_health_checks",
  "drain_employee_turns",
] as const;

export type SchedulerJobKey = (typeof SCHEDULER_JOB_KEYS)[number];

export interface SchedulerRunInput {
  job_key?: SchedulerJobKey | "all";
  account_id?: string;
  employee_id?: string;
  now?: string;
  limit?: number;
  within_seconds?: number;
  runner_type?: "hermes_jobs" | "scheduler_tick" | "manual" | "manager";
  external_job_id?: string;
}

export interface SchedulerJobResult {
  job_key: SchedulerJobKey;
  job_run_id: string;
  status: "ok" | "failed";
  proof: Record<string, unknown>;
  error?: string;
}

function isSchedulerJobKey(value: unknown): value is SchedulerJobKey {
  return typeof value === "string" && (SCHEDULER_JOB_KEYS as readonly string[]).includes(value);
}

function safeError(err: unknown): string {
  return String((err as Error).message ?? err).slice(0, 240);
}

async function updateRun(
  db: SupabaseClient,
  id: string,
  patch: { status: "ok" | "failed"; proof: Record<string, unknown>; error?: string },
): Promise<void> {
  await db.from("hermes_job_runs").update({
    status: patch.status,
    proof: patch.proof,
    error: patch.error ?? null,
    finished_at: new Date().toISOString(),
  }).eq("id", id);
}

async function callEnvelopeJob(
  key: SchedulerJobKey,
  ctx: ToolContext,
  input: SchedulerRunInput,
): Promise<ToolEnvelope> {
  if (key === "dispatch_due_reminders") {
    return eventTools.dispatch_due_reminders!(ctx, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      now: input.now,
      limit: input.limit,
    });
  }
  if (key === "renew_expiring_watches") {
    return gmailTools.renew_expiring_watches!(ctx, {
      now: input.now,
      limit: input.limit,
      within_seconds: input.within_seconds,
    });
  }
  if (key === "dispatch_daily_briefs") {
    return eventTools.dispatch_daily_briefs!(ctx, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      now: input.now,
      limit: input.limit,
    });
  }
  throw new Error(`Unsupported envelope job: ${key}`);
}

export async function runSchedulerJob(
  db: SupabaseClient,
  key: SchedulerJobKey,
  input: SchedulerRunInput = {},
): Promise<SchedulerJobResult> {
  const jobRunId = newId(ID_PREFIX.jobRun);
  const runnerType = input.runner_type ?? "manager";
  await db.from("hermes_job_runs").insert({
    id: jobRunId,
    job_key: key,
    account_id: input.account_id ?? null,
    employee_id: input.employee_id ?? null,
    status: "started",
    runner_type: runnerType,
    external_job_id: input.external_job_id ?? null,
    proof: { runner_type: runnerType },
    started_at: new Date().toISOString(),
  });

  try {
    let proof: Record<string, unknown>;
    if (key === "runtime_health_checks") {
      const health = await recordRuntimeHealthSnapshots(db, {
        account_id: input.account_id,
        employee_id: input.employee_id,
        runner_type: runnerType,
      });
      proof = {
        checked: health.checked,
        healthy: health.healthy,
        degraded: health.degraded,
        unhealthy: health.unhealthy,
      };
    } else if (key === "drain_employee_turns") {
      const drained = await drainQueuedTurns(db, { limit: input.limit });
      proof = {
        drained: drained.length,
        delivered: drained.filter((r) => r.status === "delivered").length,
        failed: drained.filter((r) => r.status === "failed").length,
        skipped: drained.filter((r) => r.status === "skipped").length,
      };
    } else {
      const envelope = await callEnvelopeJob(key, {
        db,
        account_id: input.account_id ?? null,
        employee_id: input.employee_id ?? null,
        actor: "scheduler",
      }, input);
      if (envelope.status === "failed") {
        throw new Error(String(envelope.proof?.failure_message ?? envelope.proof?.failure_code ?? `${key}_failed`));
      }
      proof = envelope.proof ?? {};
    }
    await updateRun(db, jobRunId, { status: "ok", proof: { ...proof, runner_type: runnerType } });
    return { job_key: key, job_run_id: jobRunId, status: "ok", proof };
  } catch (err) {
    const error = safeError(err);
    const proof = { runner_type: runnerType, error };
    await updateRun(db, jobRunId, { status: "failed", proof, error });
    return { job_key: key, job_run_id: jobRunId, status: "failed", proof, error };
  }
}

export async function runSchedulerCycle(
  db: SupabaseClient,
  input: SchedulerRunInput = {},
): Promise<{ results: SchedulerJobResult[] }> {
  const requested = input.job_key ?? "all";
  const keys = requested === "all" || !requested
    ? [...SCHEDULER_JOB_KEYS]
    : isSchedulerJobKey(requested)
      ? [requested]
      : (() => { throw new Error(`Unknown scheduler job: ${requested}`); })();
  const results: SchedulerJobResult[] = [];
  for (const key of keys) {
    results.push(await runSchedulerJob(db, key, input));
  }
  return { results };
}
