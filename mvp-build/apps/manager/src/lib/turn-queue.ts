import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { insertDedup, mustWrite, orThrow } from "./db.js";

export type EmployeeTurnKind = "owner_web_chat" | "owner_sms_chat" | "employee_event_wake" | "public_estimator_chat";

export interface EmployeeTurnInput {
  account_id?: string | null;
  employee_id: string;
  kind: EmployeeTurnKind;
  idempotency_key: string;
  input: Record<string, unknown>;
  /** Metering correlation id threaded through the work chain (Phase 6). */
  run_id?: string | null;
}

export interface ClaimedTurnJob extends EmployeeTurnInput {
  id: string;
  attempts: number;
  lease_token: string;
}

function workerId(): string {
  return `${process.pid}:${Math.random().toString(36).slice(2)}`;
}

async function existingByKey(db: SupabaseClient, key: string): Promise<any | null> {
  return orThrow(
    await db.from("employee_turn_jobs").select("*").eq("idempotency_key", key).maybeSingle(),
    "employee_turn_jobs.by_key",
  ) as any | null;
}

export async function enqueueEmployeeTurn(db: SupabaseClient, input: EmployeeTurnInput): Promise<{ id: string; duplicate: boolean; status: string; output?: Record<string, unknown> }> {
  const id = newId(ID_PREFIX.turnJob);
  const ins = await insertDedup(
    db.from("employee_turn_jobs").insert({
      id,
      account_id: input.account_id ?? null,
      employee_id: input.employee_id,
      kind: input.kind,
      idempotency_key: input.idempotency_key,
      input: input.input,
      run_id: input.run_id ?? null,
      status: "queued",
    }),
    "employee_turn_jobs.insert",
  );
  if (ins.conflict) {
    const existing = await existingByKey(db, input.idempotency_key);
    return { id: existing?.id ?? "", duplicate: true, status: existing?.status ?? "duplicate", output: existing?.output ?? undefined };
  }
  return { id, duplicate: false, status: "queued" };
}

export async function claimNextEmployeeTurn(db: SupabaseClient, employeeId: string): Promise<ClaimedTurnJob | null> {
  const rpc = (db as any).rpc;
  if (typeof rpc === "function") {
    const rows = orThrow(
      await rpc.call(db, "claim_employee_turn_job_for_employee", {
        p_employee_id: employeeId,
        p_worker_id: workerId(),
        p_lease_seconds: Math.ceil(Number(process.env.HERMES_TURN_TIMEOUT_MS ?? 120_000) / 1000) + 30,
      }),
      "employee_turn_jobs.claim",
    ) as any[] | null;
    const row = rows?.[0];
    return row ? { ...row, input: row.input ?? {} } as ClaimedTurnJob : null;
  }

  const row = (orThrow(
    await db.from("employee_turn_jobs").select("*").eq("employee_id", employeeId).eq("status", "queued").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    "employee_turn_jobs.claim.fake",
  ) as any | null);
  if (!row) return null;
  const leaseToken = workerId();
  await mustWrite(
    db.from("employee_turn_jobs").update({ status: "running", attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken }).eq("id", row.id),
    "employee_turn_jobs.claim.fake_update",
  );
  return { ...row, attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken, input: row.input ?? {} } as ClaimedTurnJob;
}

/** Claim the oldest queued turn for ANY employee whose brain is free (drain lane). */
export async function claimAnyQueuedTurn(db: SupabaseClient): Promise<ClaimedTurnJob | null> {
  const rpc = (db as any).rpc;
  if (typeof rpc === "function") {
    const rows = orThrow(
      await rpc.call(db, "claim_employee_turn_job", {
        p_worker_id: workerId(),
        p_lease_seconds: Math.ceil(Number(process.env.HERMES_TURN_TIMEOUT_MS ?? 120_000) / 1000) + 30,
      }),
      "employee_turn_jobs.claim_any",
    ) as any[] | null;
    const row = rows?.[0];
    return row ? { ...row, input: row.input ?? {} } as ClaimedTurnJob : null;
  }
  const row = (orThrow(
    await db.from("employee_turn_jobs").select("*").eq("status", "queued").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    "employee_turn_jobs.claim_any.fake",
  ) as any | null);
  if (!row) return null;
  const leaseToken = workerId();
  await mustWrite(
    db.from("employee_turn_jobs").update({ status: "running", attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken }).eq("id", row.id),
    "employee_turn_jobs.claim_any.fake_update",
  );
  return { ...row, attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken, input: row.input ?? {} } as ClaimedTurnJob;
}

/** Return a claimed-but-not-ours turn to the queue so it is never orphaned in
 *  `running`. Clears the lease and drops the per-employee lock. */
export async function releaseEmployeeTurn(db: SupabaseClient, job: ClaimedTurnJob): Promise<void> {
  await mustWrite(
    db.from("employee_turn_jobs").update({ status: "queued", lease_token: null, lease_expires_at: null }).eq("id", job.id),
    "employee_turn_jobs.release",
  );
  await db.from("employee_turn_locks").delete().eq("employee_id", job.employee_id).eq("lease_token", job.lease_token);
}

export async function completeEmployeeTurn(db: SupabaseClient, job: ClaimedTurnJob, status: "succeeded" | "failed", output: Record<string, unknown> = {}, error?: string): Promise<void> {
  const rpc = (db as any).rpc;
  if (typeof rpc === "function") {
    await mustWrite(
      rpc.call(db, "complete_employee_turn_job", {
        p_job_id: job.id,
        p_lease_token: job.lease_token,
        p_status: status,
        p_output: output,
        p_error: error ?? null,
      }),
      "employee_turn_jobs.complete",
    );
    return;
  }
  await mustWrite(
    db.from("employee_turn_jobs").update({ status, output, error: error ?? null, lease_token: null }).eq("id", job.id),
    "employee_turn_jobs.complete.fake",
  );
}

export async function runEmployeeTurn<T extends Record<string, unknown>>(
  db: SupabaseClient,
  input: EmployeeTurnInput,
  execute: (job: ClaimedTurnJob) => Promise<T>,
): Promise<{ status: "succeeded" | "queued" | "duplicate" | "failed"; job_id: string; output?: T; error?: string }> {
  const enqueued = await enqueueEmployeeTurn(db, input);
  if (enqueued.duplicate) {
    if (enqueued.status === "succeeded") return { status: "duplicate", job_id: enqueued.id, output: enqueued.output as T };
    return { status: "queued", job_id: enqueued.id };
  }

  const claimed = await claimNextEmployeeTurn(db, input.employee_id);
  if (!claimed) return { status: "queued", job_id: enqueued.id };
  if (claimed.id !== enqueued.id) {
    // We claimed an older queued turn for this employee, not our own. Don't run
    // someone else's turn on this request (its reply would go to the wrong caller)
    // and don't leave it stranded in `running` — release it for the drain lane.
    await releaseEmployeeTurn(db, claimed);
    return { status: "queued", job_id: enqueued.id };
  }
  try {
    const output = await execute(claimed);
    await completeEmployeeTurn(db, claimed, "succeeded", output);
    return { status: "succeeded", job_id: claimed.id, output };
  } catch (err) {
    const message = String((err as Error).message ?? err);
    await completeEmployeeTurn(db, claimed, "failed", {}, message);
    return { status: "failed", job_id: claimed.id, error: message };
  }
}
