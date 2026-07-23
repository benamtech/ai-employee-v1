import type { SupabaseClient } from "@amtech/db";
import { assertWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";
import { resolveRuntimeApi } from "./hermes-client.js";
import { executeHermesTurnLive } from "./hermes-live-turn.js";
import { runEmployeeTurn } from "./turn-queue.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation, startWorkRun } from "./metering.js";
import { recordSessionOccupancy, rotateSessionIfNeeded } from "./session-rotation.js";
import { buildOwnerTurnSystemMessage, type OwnerDecisionTurnContext } from "./owner-turn-context.js";
import { publishProgress, type ProgressScope } from "./progress-bus.js";
import { recoverEmployeeRuntime } from "./runtime-recovery.js";

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deliverToRuntime(apiUrl: string, body: string, channel: "sms" | "web"): Promise<string> {
  throw new Error(`legacy_runtime_path_removed:${channel}:${apiUrl ? "api_url_supplied" : "missing_api_url"}`);
}

export async function deliverOwnerTurnToRuntime(
  db: SupabaseClient,
  params: {
    account_id: string;
    employee_id: string;
    assignment_id: string;
    body: string;
    channel: "sms" | "web";
    idempotency_key: string;
    decision_context?: OwnerDecisionTurnContext | null;
  },
): Promise<{ status: "succeeded" | "queued" | "duplicate" | "failed"; reply?: string; job_id: string; error?: string; run_id: string }> {
  const runId = await startWorkRun(db, {
    account_id: params.account_id, employee_id: params.employee_id,
    trigger_type: "owner_message", trigger_ref: params.idempotency_key,
  });
  const progressScope: ProgressScope = {
    account_id: params.account_id,
    employee_id: params.employee_id,
    assignment_id: params.assignment_id,
  };
  const startedAt = Date.now();
  async function executeOwnerTurn(runId: string) {
    const api = await resolveRuntimeApi(db, params.employee_id);
    const systemMessage = await buildOwnerTurnSystemMessage(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      assignment_id: params.assignment_id,
      channel: params.channel,
      decision_context: params.decision_context ?? null,
    });
    const messageId = `assistant:${runId}`;
    const turn = await executeHermesTurnLive(api, {
      input: params.body,
      system_message: systemMessage,
      work_run_id: runId,
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
    await recordExternalRuntimeRun(db, runId, { provider: "hermes", external_run_id: turn.external_run_id ?? null });
    await recordSessionOccupancy(db, {
      account_id: params.account_id, employee_id: params.employee_id,
      transcript_session_id: api.sessionId, memory_session_key: api.sessionKey,
      usage: turn.usage,
    });
    return turn;
  }
  async function executeOwnerTurnAfterRecovery(runId: string) {
    let last: unknown;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        return await executeOwnerTurn(runId);
      } catch (err) {
        last = err;
        if (String((err as Error).message ?? err) !== "runtime_unreachable") throw err;
        await sleep(1000);
      }
    }
    throw last;
  }
  const result = await runEmployeeTurn(
    db,
    {
      account_id: params.account_id,
      employee_id: params.employee_id,
      assignment_id: params.assignment_id,
      kind: params.channel === "sms" ? "owner_sms_chat" : "owner_web_chat",
      idempotency_key: params.idempotency_key,
      input: {
        body: params.body,
        channel: params.channel,
        decision_context_id: params.decision_context?.context_id ?? null,
        approval_id: params.decision_context?.approval_id ?? null,
        owner_message_id: params.decision_context?.owner_message_id ?? null,
      },
      run_id: runId,
    },
    async () => {
      await rotateSessionIfNeeded(db, { account_id: params.account_id, employee_id: params.employee_id });
      let turn: Awaited<ReturnType<typeof executeOwnerTurn>>;
      try {
        turn = await executeOwnerTurn(runId);
      } catch (err) {
        if (String((err as Error).message ?? err) !== "runtime_unreachable") throw err;
        publishProgress(progressScope, { kind: "work_progress", run_id: runId, verb: "Restarting employee", state: "started" });
        await recoverEmployeeRuntime(db, { account_id: params.account_id, employee_id: params.employee_id });
        turn = await executeOwnerTurnAfterRecovery(runId);
      }
      return { reply: turn.text, usage: turn.usage ?? {}, runtime_mode: turn.mode, external_run_id: turn.external_run_id ?? null };
    },
  );
  await recordToolInvocation(db, {
    run_id: runId, account_id: params.account_id, employee_id: params.employee_id,
    tool_name: "owner_chat_turn", actor: "owner", status: result.status, latency_ms: Date.now() - startedAt,
    error_code: result.status === "failed" ? "turn_failed" : null,
  });
  if (result.status === "succeeded" || result.status === "duplicate") await finishWorkRun(db, runId, "succeeded");
  else if (result.status === "failed") await finishWorkRun(db, runId, "failed");
  publishProgress(progressScope, { kind: "run_completed", run_id: runId, status: result.status });
  return { status: result.status, job_id: result.job_id, reply: String(result.output?.reply ?? ""), error: result.error, run_id: runId };
}

export interface RuntimeEventPayload {
  account_id: string;
  employee_id: string;
  event_type: string;
  provider_id?: string | null;
  safe_summary: string;
  normalized_payload?: Record<string, unknown>;
  suggested_next_action?: string;
}

export async function wakeEmployeeForEvent(apiUrl: string, payload: RuntimeEventPayload): Promise<WorkEventDescriptor> {
  throw new Error(`legacy_wake_path_removed:${apiUrl ? payload.event_type : "missing_api_url"}`);
}
