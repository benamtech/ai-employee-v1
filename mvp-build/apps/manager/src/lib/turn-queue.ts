import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { insertDedup, mustWrite, orThrow } from "./db.js";

export type EmployeeTurnKind = "owner_web_chat" | "owner_sms_chat" | "employee_event_wake" | "public_estimator_chat";

export interface EmployeeTurnInput {
  account_id?: string | null;
  employee_id: string;
  assignment_id?: string | null;
  kind: EmployeeTurnKind;
  idempotency_key: string;
  input: Record<string, unknown>;
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

async function existingByKey(db: SupabaseClient, key: string, assignmentId?: string | null): Promise<any | null> {
  let query = db.from("employee_turn_jobs").select("*").eq("idempotency_key", key);
  query = assignmentId ? query.eq("assignment_id", assignmentId) : query.is("assignment_id", null);
  return orThrow(await query.maybeSingle(), "employee_turn_jobs.by_key") as any | null;
}

/**
 * Migration 0053 added assignment scope to durable turn jobs after the original
 * claim RPC signatures had already been applied. Migration 0073 returns that
 * scope directly. During a rolling deploy against a pre-0073 database, recover
 * only from the exact durable claimed row and fail closed on any mismatch.
 */
async function hydrateClaimedTurnScope(db: SupabaseClient, row: any): Promise<ClaimedTurnJob> {
  const claimed = { ...row, input: row?.input ?? {} } as ClaimedTurnJob;
  if (claimed.kind === "public_estimator_chat" || claimed.assignment_id) return claimed;
  const durable = orThrow(
    await db.from("employee_turn_jobs")
      .select("id,account_id,employee_id,assignment_id,kind")
      .eq("id", claimed.id)
      .maybeSingle(),
    "employee_turn_jobs.claim_scope_hydration",
  ) as {
    id?: string;
    account_id?: string | null;
    employee_id?: string;
    assignment_id?: string | null;
    kind?: EmployeeTurnKind;
  } | null;
  if (
    !durable?.id ||
    durable.id !== claimed.id ||
    durable.employee_id !== claimed.employee_id ||
    durable.kind !== claimed.kind ||
    (claimed.account_id && durable.account_id && claimed.account_id !== durable.account_id)
  ) {
    throw new Error("employee_turn_claim_scope_mismatch");
  }
  if (!durable.assignment_id) throw new Error("employee_turn_claim_assignment_missing");
  return {
    ...claimed,
    account_id: durable.account_id ?? claimed.account_id ?? null,
    assignment_id: durable.assignment_id,
  };
}

export async function enqueueEmployeeTurn(db: SupabaseClient, input: EmployeeTurnInput): Promise<{ id: string; duplicate: boolean; status: string; output?: Record<string, unknown> }> {
  const id = newId(ID_PREFIX.turnJob);
  const ins = await insertDedup(
    db.from("employee_turn_jobs").insert({
      id,
      account_id: input.account_id ?? null,
      employee_id: input.employee_id,
      assignment_id: input.assignment_id ?? null,
      kind: input.kind,
      idempotency_key: input.idempotency_key,
      input: input.input,
      run_id: input.run_id ?? null,
      status: "queued",
    }),
    "employee_turn_jobs.insert",
  );
  if (ins.conflict) {
    const existing = await existingByKey(db, input.idempotency_key, input.assignment_id);
    return { id: existing?.id ?? "", duplicate: true, status: existing?.status ?? "duplicate", output: existing?.output ?? undefined };
  }
  return { id, duplicate: false, status: "queued" };
}

export async function claimNextEmployeeTurn(db: SupabaseClient, employeeId: string, assignmentId?: string | null): Promise<ClaimedTurnJob | null> {
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
    if (!row) return null;
    const claimed = await hydrateClaimedTurnScope(db, row);
    if (assignmentId && claimed.assignment_id !== assignmentId) {
      await releaseEmployeeTurn(db, claimed);
      return null;
    }
    return claimed;
  }

  let pending = db.from("employee_turn_jobs").select("*").eq("employee_id", employeeId).eq("status", "queued");
  pending = assignmentId ? pending.eq("assignment_id", assignmentId) : pending.is("assignment_id", null);
  const row = orThrow(
    await pending.order("created_at", { ascending: true }).limit(1).maybeSingle(),
    "employee_turn_jobs.claim.fake",
  ) as any | null;
  if (!row) return null;
  const leaseToken = workerId();
  await mustWrite(
    db.from("employee_turn_jobs").update({ status: "running", attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken }).eq("id", row.id),
    "employee_turn_jobs.claim.fake_update",
  );
  return hydrateClaimedTurnScope(db, { ...row, attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken, input: row.input ?? {} });
}

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
    return row ? hydrateClaimedTurnScope(db, row) : null;
  }
  const row = orThrow(
    await db.from("employee_turn_jobs").select("*").eq("status", "queued").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    "employee_turn_jobs.claim_any.fake",
  ) as any | null;
  if (!row) return null;
  const leaseToken = workerId();
  await mustWrite(
    db.from("employee_turn_jobs").update({ status: "running", attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken }).eq("id", row.id),
    "employee_turn_jobs.claim_any.fake_update",
  );
  return hydrateClaimedTurnScope(db, { ...row, attempts: Number(row.attempts ?? 0) + 1, lease_token: leaseToken, input: row.input ?? {} });
}

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
  if (input.kind !== "public_estimator_chat" && !input.assignment_id) {
    throw new Error("employee_turn_assignment_required");
  }
  const enqueued = await enqueueEmployeeTurn(db, input);
  if (enqueued.duplicate) {
    if (enqueued.status === "succeeded") return { status: "duplicate", job_id: enqueued.id, output: enqueued.output as T };
    return { status: "queued", job_id: enqueued.id };
  }

  const claimed = await claimNextEmployeeTurn(db, input.employee_id, input.assignment_id);
  if (!claimed) return { status: "queued", job_id: enqueued.id };
  if (claimed.id !== enqueued.id) {
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
