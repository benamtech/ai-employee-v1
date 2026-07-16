/**
 * Turn drain lane. Owner chat turns are normally executed on the request path that
 * enqueued them. When a turn arrives while the employee brain is busy it is left
 * queued (its request returns "working on it"); this drain — run from the scheduler —
 * processes those stragglers in FIFO order and delivers each reply out-of-band through
 * the Channel/Session/Presence router, so a queued owner message is never left
 * unanswered. Event-wake turns are not drainable (they deliver inline within their own
 * claim and carry event context that a bare drain lacks); a queued one is failed closed.
 */
import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId } from "@amtech/shared";
import { executeHermesTurnStreaming, resolveRuntimeApi } from "./hermes-client.js";
import { claimAnyQueuedTurn, completeEmployeeTurn } from "./turn-queue.js";
import { routeEmployeeIntent } from "./channel-router.js";
import { mustWrite } from "./db.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation } from "./metering.js";
import { recordSessionOccupancy, rotateSessionIfNeeded } from "./session-rotation.js";
import { buildOwnerTurnSystemMessage } from "./owner-turn-context.js";
import { publishProgress } from "./progress-bus.js";
import { recoverEmployeeRuntime } from "./runtime-recovery.js";

export interface DrainResult {
  job_id: string;
  employee_id: string;
  status: "delivered" | "failed" | "skipped";
  error?: string;
}

/** Owner-chat turns are safe to retry; a straggler is re-run by the drain lane. */
const MAX_TURN_ATTEMPTS = 5;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ReapResult {
  requeued: number;
  failed: number;
}

/**
 * Recover turns stuck in `running` because their worker died mid-execution (crash,
 * OOM, redeploy). The claim lease has expired but the job row is still `running`, so
 * the drain lane (which only claims `queued`) never re-picks it and the owner's
 * message is silently lost with no reply and no error. This scheduled reaper requeues
 * owner-chat turns under the attempt budget (the drain lane then re-runs them); past
 * the budget it fails the turn and tells the owner to resend. Event-wake turns carry
 * lost event context and aren't drainable, so they are failed directly.
 */
export async function reapStuckTurns(db: SupabaseClient, opts: { limit?: number } = {}): Promise<ReapResult> {
  const limit = opts.limit ?? 50;
  const nowIso = new Date().toISOString();
  const { data } = await db
    .from("employee_turn_jobs")
    .select("id,account_id,employee_id,kind,attempts,run_id,lease_token")
    .eq("status", "running")
    .lt("lease_expires_at", nowIso)
    .limit(limit);
  const stuck = (data ?? []) as Array<{ id: string; account_id?: string | null; employee_id: string; kind: string; attempts?: number; run_id?: string | null; lease_token?: string | null }>;
  let requeued = 0;
  let failed = 0;
  for (const job of stuck) {
    // Drop the dead worker's stale lock so the employee is unblocked either way.
    if (job.lease_token) {
      await db.from("employee_turn_locks").delete().eq("employee_id", job.employee_id).eq("lease_token", job.lease_token);
    }
    // job.lease_token is guaranteed set here (this row was read with
    // status='running', which only the claim RPC sets, always together with a
    // lease_token). Guarding both writes below on it (like
    // complete_employee_turn_job's WHERE clause does) closes a lost-update
    // race: a worker that's genuinely still finishing right as its lease
    // crosses the reap threshold must not have its legitimate completion
    // clobbered back to queued/failed by this scan.
    const isOwnerTurn = job.kind === "owner_web_chat" || job.kind === "owner_sms_chat";
    if (isOwnerTurn && Number(job.attempts ?? 0) < MAX_TURN_ATTEMPTS) {
      const requeuedRows = await mustWrite(
        db.from("employee_turn_jobs")
          .update({ status: "queued", lease_token: null, lease_expires_at: null, available_at: nowIso })
          .eq("id", job.id)
          .eq("lease_token", job.lease_token)
          .eq("status", "running")
          .select("id"),
        "employee_turn_jobs.reap_requeue",
      );
      if (!requeuedRows || (requeuedRows as unknown[]).length === 0) {
        // Lost the race: the job legitimately completed (or was reclaimed)
        // between our stale-turn scan and this write. Not a real reap.
        continue;
      }
      requeued += 1;
      continue;
    }
    const failedRows = await mustWrite(
      db.from("employee_turn_jobs")
        .update({ status: "failed", lease_token: null, lease_expires_at: null, error: "reaped_max_attempts" })
        .eq("id", job.id)
        .eq("lease_token", job.lease_token)
        .eq("status", "running")
        .select("id"),
      "employee_turn_jobs.reap_fail",
    );
    if (!failedRows || (failedRows as unknown[]).length === 0) {
      // Same lost-race case on the fail path: don't finish/notify a run that
      // isn't the reaper's to close.
      continue;
    }
    await finishWorkRun(db, job.run_id ?? null, "failed");
    if (isOwnerTurn && job.account_id) {
      await routeEmployeeIntent(db, {
        account_id: job.account_id,
        employee_id: job.employee_id,
        intent_key: `reap:${job.id}`,
        move: "notify",
        text: "I hit a snag finishing your last message and couldn't complete it. Please send it again and I'll pick it right back up.",
        run_id: job.run_id ?? null,
      });
    }
    failed += 1;
  }
  return { requeued, failed };
}

export async function drainQueuedTurns(db: SupabaseClient, opts: { limit?: number } = {}): Promise<DrainResult[]> {
  const limit = opts.limit ?? 10;
  const results: DrainResult[] = [];
  for (let i = 0; i < limit; i += 1) {
    const job = await claimAnyQueuedTurn(db);
    if (!job) break;
    if (job.kind === "employee_event_wake") {
      await completeEmployeeTurn(db, job, "failed", {}, "event_wake_not_drainable");
      await finishWorkRun(db, job.run_id ?? null, "failed");
      results.push({ job_id: job.id, employee_id: job.employee_id, status: "skipped" });
      continue;
    }
    if (Number(job.attempts ?? 0) > MAX_TURN_ATTEMPTS) {
      await completeEmployeeTurn(db, job, "failed", {}, "max_turn_attempts_exhausted");
      await finishWorkRun(db, job.run_id ?? null, "failed");
      if (job.account_id) {
        await routeEmployeeIntent(db, {
          account_id: job.account_id,
          employee_id: job.employee_id,
          intent_key: `drain-failed:${job.id}`,
          move: "notify",
          text: "I hit a snag finishing your queued message and couldn't complete it. Please send it again and I'll pick it right back up.",
          run_id: job.run_id ?? null,
        });
      }
      results.push({ job_id: job.id, employee_id: job.employee_id, status: "failed", error: "max_turn_attempts_exhausted" });
      continue;
    }
    const startedAt = Date.now();
    try {
      // CE-3: rotate before the turn if the transcript is full (under the lock).
      await rotateSessionIfNeeded(db, { account_id: job.account_id ?? "", employee_id: job.employee_id });
      const api = await resolveRuntimeApi(db, job.employee_id);
      const body = String((job.input as { body?: unknown }).body ?? "");
      const channel = job.kind === "owner_sms_chat" ? "sms" : "web";
      const accountId = job.account_id ?? "";
      const employeeId = job.employee_id;
      const systemMessage = await buildOwnerTurnSystemMessage(db, {
        account_id: accountId,
        employee_id: employeeId,
        channel,
      });
      const runId = job.run_id ?? job.id;
      const execute = () => executeHermesTurnStreaming(api, {
        input: body,
        system_message: systemMessage,
        work_run_id: job.run_id ?? null,
      }, (p) => publishProgress(job.employee_id, { run_id: runId, verb: p.verb, state: p.state }));
      async function executeWithRecovery() {
        try {
          return await execute();
        } catch (err) {
          if (String((err as Error).message ?? err) !== "runtime_unreachable") throw err;
          publishProgress(employeeId, { run_id: runId, verb: "Restarting employee", state: "started" });
          await recoverEmployeeRuntime(db, { account_id: accountId, employee_id: employeeId });
          let last: unknown = err;
          for (let attempt = 0; attempt < 12; attempt += 1) {
            try {
              return await execute();
            } catch (retryErr) {
              last = retryErr;
              if (String((retryErr as Error).message ?? retryErr) !== "runtime_unreachable") throw retryErr;
              await sleep(1000);
            }
          }
          throw last;
        }
      }
      const turn = await executeWithRecovery();
      await recordExternalRuntimeRun(db, job.run_id ?? null, { provider: "hermes", external_run_id: turn.external_run_id ?? null });
      await recordSessionOccupancy(db, {
        account_id: job.account_id ?? "", employee_id: job.employee_id,
        transcript_session_id: api.sessionId, memory_session_key: api.sessionKey,
        usage: turn.usage,
      });
      const messageId = newId(ID_PREFIX.message);
      await mustWrite(
        db.from("employee_messages").insert({
          id: messageId,
          employee_id: job.employee_id,
          direction: "to_owner",
          source: "employee",
          channel,
          body: turn.text,
          status: "pending",
        }),
        "employee_messages.insert.drain",
      );
      await routeEmployeeIntent(db, {
        account_id: job.account_id ?? "",
        employee_id: job.employee_id,
        intent_key: `turn:${job.id}`,
        move: "notify",
        text: turn.text,
        message_id: messageId,
        run_id: job.run_id ?? null,
      });
      await completeEmployeeTurn(db, job, "succeeded", { reply: turn.text, message_id: messageId });
      await recordToolInvocation(db, {
        run_id: job.run_id ?? null,
        account_id: job.account_id ?? null,
        employee_id: job.employee_id,
        tool_name: "drain_owner_turn",
        actor: "manager",
        status: "succeeded",
        latency_ms: Date.now() - startedAt,
        provider_proof_id: turn.external_run_id ?? null,
      });
      await finishWorkRun(db, job.run_id ?? null, "succeeded");
      results.push({ job_id: job.id, employee_id: job.employee_id, status: "delivered" });
    } catch (err) {
      const message = String((err as Error).message ?? err);
      await completeEmployeeTurn(db, job, "failed", {}, message);
      await recordToolInvocation(db, {
        run_id: job.run_id ?? null,
        account_id: job.account_id ?? null,
        employee_id: job.employee_id,
        tool_name: "drain_owner_turn",
        actor: "manager",
        status: "failed",
        latency_ms: Date.now() - startedAt,
        error_code: "drain_failed",
      });
      await finishWorkRun(db, job.run_id ?? null, "failed");
      results.push({ job_id: job.id, employee_id: job.employee_id, status: "failed", error: message });
    }
  }
  return results;
}
