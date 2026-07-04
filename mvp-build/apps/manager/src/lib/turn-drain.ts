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
import { executeHermesTurn, resolveRuntimeApi } from "./hermes-client.js";
import { claimAnyQueuedTurn, completeEmployeeTurn } from "./turn-queue.js";
import { routeEmployeeIntent } from "./channel-router.js";
import { mustWrite } from "./db.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation } from "./metering.js";

export interface DrainResult {
  job_id: string;
  employee_id: string;
  status: "delivered" | "failed" | "skipped";
  error?: string;
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
    const startedAt = Date.now();
    try {
      const api = await resolveRuntimeApi(db, job.employee_id);
      const body = String((job.input as { body?: unknown }).body ?? "");
      const turn = await executeHermesTurn(api, { input: body, work_run_id: job.run_id ?? null });
      await recordExternalRuntimeRun(db, job.run_id ?? null, { provider: "hermes", external_run_id: turn.external_run_id ?? null });
      const messageId = newId(ID_PREFIX.message);
      await mustWrite(
        db.from("employee_messages").insert({
          id: messageId,
          employee_id: job.employee_id,
          direction: "to_owner",
          source: "employee",
          channel: job.kind === "owner_sms_chat" ? "sms" : "web",
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
