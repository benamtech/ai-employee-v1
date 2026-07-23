/**
 * Turn drain lane. Owner chat turns are normally executed on the request path that
 * enqueued them. When an employee is already busy, this scheduled drain processes
 * queued owner turns FIFO and projects the same assignment-scoped token stream used
 * by the immediate Web path.
 */
import type { SupabaseClient } from "@amtech/db";
import { ID_PREFIX, newId } from "@amtech/shared";
import { resolveRuntimeApi } from "./hermes-client.js";
import { executeHermesTurnLive } from "./hermes-live-turn.js";
import { claimAnyQueuedTurn, completeEmployeeTurn } from "./turn-queue.js";
import { routeEmployeeIntent } from "./channel-router.js";
import { mustWrite } from "./db.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation } from "./metering.js";
import { recordSessionOccupancy, rotateSessionIfNeeded } from "./session-rotation.js";
import { buildOwnerTurnSystemMessage, type OwnerDecisionTurnContext } from "./owner-turn-context.js";
import { loadApprovalAuthority } from "./approval-authority.js";
import { publishProgress, type ProgressScope } from "./progress-bus.js";
import { recoverEmployeeRuntime } from "./runtime-recovery.js";

export interface DrainResult {
  job_id: string;
  employee_id: string;
  status: "delivered" | "failed" | "skipped";
  error?: string;
}

const MAX_TURN_ATTEMPTS = 5;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ReapResult {
  requeued: number;
  failed: number;
}

async function loadQueuedDecisionContext(db: SupabaseClient, input: {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  job_input: unknown;
}): Promise<OwnerDecisionTurnContext | null> {
  const raw = input.job_input && typeof input.job_input === "object"
    ? input.job_input as Record<string, unknown>
    : {};
  const contextId = typeof raw.decision_context_id === "string" ? raw.decision_context_id : "";
  const approvalId = typeof raw.approval_id === "string" ? raw.approval_id : "";
  const ownerMessageId = typeof raw.owner_message_id === "string" ? raw.owner_message_id : "";
  if (!contextId && !approvalId && !ownerMessageId) return null;
  if (!contextId || !approvalId || !ownerMessageId) throw new Error("queued_owner_decision_context_incomplete");

  const context = await db.from("channel_decision_contexts")
    .select("id,approval_id,account_id,employee_id,assignment_id,human_principal_id,status,expires_at")
    .eq("id", contextId)
    .eq("approval_id", approvalId)
    .eq("account_id", input.account_id)
    .eq("employee_id", input.employee_id)
    .eq("assignment_id", input.assignment_id)
    .maybeSingle();
  if (context.error) throw context.error;
  if (!context.data?.id) throw new Error("queued_owner_decision_context_scope_mismatch");
  if (context.data.status !== "open" || Date.parse(String(context.data.expires_at)) <= Date.now()) return null;

  const approval = await loadApprovalAuthority(db, approvalId);
  if (
    !approval
    || approval.status !== "pending"
    || approval.account_id !== input.account_id
    || approval.employee_id !== input.employee_id
    || approval.assignment_id !== input.assignment_id
  ) return null;

  return {
    context_id: contextId,
    approval_id: approval.approval_id,
    owner_message_id: ownerMessageId,
    human_principal_id: String(context.data.human_principal_id ?? ""),
    action_key: approval.action_key,
    summary: approval.summary,
    risk_level: approval.risk_level,
    resource_class: approval.resource_class,
    resource_id: approval.resource_id,
    snapshot_hash: approval.snapshot_hash,
    expires_at: approval.expires_at,
  };
}

/** Recover jobs left running after a worker crash without clobbering a late valid completion. */
export async function reapStuckTurns(db: SupabaseClient, opts: { limit?: number } = {}): Promise<ReapResult> {
  const limit = opts.limit ?? 50;
  const nowIso = new Date().toISOString();
  const { data } = await db
    .from("employee_turn_jobs")
    .select("id,account_id,employee_id,assignment_id,kind,attempts,run_id,lease_token")
    .eq("status", "running")
    .lt("lease_expires_at", nowIso)
    .limit(limit);
  const stuck = (data ?? []) as Array<{
    id: string;
    account_id?: string | null;
    employee_id: string;
    assignment_id?: string | null;
    kind: string;
    attempts?: number;
    run_id?: string | null;
    lease_token?: string | null;
  }>;
  let requeued = 0;
  let failed = 0;
  for (const job of stuck) {
    if (job.lease_token) {
      await db.from("employee_turn_locks").delete().eq("employee_id", job.employee_id).eq("lease_token", job.lease_token);
    }
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
      if (!requeuedRows || (requeuedRows as unknown[]).length === 0) continue;
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
    if (!failedRows || (failedRows as unknown[]).length === 0) continue;
    await finishWorkRun(db, job.run_id ?? null, "failed");
    if (isOwnerTurn && job.account_id) {
      await routeEmployeeIntent(db, {
        account_id: job.account_id,
        employee_id: job.employee_id,
        assignment_id: job.assignment_id ?? null,
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
          assignment_id: job.assignment_id ?? null,
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
    const accountId = job.account_id ?? "";
    const employeeId = job.employee_id;
    const assignmentId = job.assignment_id ?? "";
    const runId = job.run_id ?? job.id;
    const progressScope: ProgressScope | null = accountId && assignmentId
      ? { account_id: accountId, employee_id: employeeId, assignment_id: assignmentId }
      : null;

    try {
      if (!progressScope) throw new Error("queued_owner_turn_scope_missing");
      await rotateSessionIfNeeded(db, { account_id: accountId, employee_id: employeeId });
      const api = await resolveRuntimeApi(db, employeeId);
      const body = String((job.input as { body?: unknown }).body ?? "");
      const channel = job.kind === "owner_sms_chat" ? "sms" : "web";
      const decisionContext = await loadQueuedDecisionContext(db, {
        account_id: accountId,
        employee_id: employeeId,
        assignment_id: assignmentId,
        job_input: job.input,
      });
      const systemMessage = await buildOwnerTurnSystemMessage(db, {
        account_id: accountId,
        employee_id: employeeId,
        assignment_id: assignmentId,
        channel,
        decision_context: decisionContext,
      });
      const messageId = `assistant:${runId}`;

      const execute = () => executeHermesTurnLive(api, {
        input: body,
        system_message: systemMessage,
        work_run_id: job.run_id ?? null,
      }, (event) => {
        if (event.kind === "assistant_delta") {
          publishProgress(progressScope, {
            kind: "assistant_delta",
            run_id: runId,
            message_id: messageId,
            sequence: event.sequence,
            delta: event.delta,
          });
          return;
        }
        publishProgress(progressScope, {
          kind: "work_progress",
          run_id: runId,
          verb: event.verb,
          state: event.state,
        });
      });

      async function executeWithRecovery() {
        try {
          return await execute();
        } catch (err) {
          if (String((err as Error).message ?? err) !== "runtime_unreachable") throw err;
          publishProgress(progressScope!, { kind: "work_progress", run_id: runId, verb: "Restarting employee", state: "started" });
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
        account_id: accountId,
        employee_id: employeeId,
        transcript_session_id: api.sessionId,
        memory_session_key: api.sessionKey,
        usage: turn.usage,
      });
      const durableMessageId = newId(ID_PREFIX.message);
      await mustWrite(
        db.from("employee_messages").insert({
          id: durableMessageId,
          assignment_id: assignmentId,
          account_id: accountId,
          employee_id: employeeId,
          direction: "to_owner",
          source: "employee",
          channel,
          body: turn.text,
          status: "pending",
        }),
        "employee_messages.insert.drain",
      );
      await routeEmployeeIntent(db, {
        account_id: accountId,
        employee_id: employeeId,
        assignment_id: assignmentId,
        intent_key: `turn:${job.id}`,
        move: "notify",
        text: turn.text,
        message_id: durableMessageId,
        run_id: job.run_id ?? null,
      });
      await completeEmployeeTurn(db, job, "succeeded", { reply: turn.text, message_id: durableMessageId });
      await recordToolInvocation(db, {
        run_id: job.run_id ?? null,
        account_id: accountId,
        employee_id: employeeId,
        tool_name: "drain_owner_turn",
        actor: "manager",
        status: "succeeded",
        latency_ms: Date.now() - startedAt,
        provider_proof_id: turn.external_run_id ?? null,
      });
      await finishWorkRun(db, job.run_id ?? null, "succeeded");
      publishProgress(progressScope, { kind: "run_completed", run_id: runId, status: "succeeded" });
      results.push({ job_id: job.id, employee_id: employeeId, status: "delivered" });
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
      if (progressScope) publishProgress(progressScope, { kind: "run_completed", run_id: runId, status: "failed" });
      results.push({ job_id: job.id, employee_id: job.employee_id, status: "failed", error: message });
    }
  }
  return results;
}
