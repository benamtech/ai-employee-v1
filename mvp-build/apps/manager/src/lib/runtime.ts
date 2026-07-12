import type { SupabaseClient } from "@amtech/db";
import { assertWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";
import { executeHermesTurn, resolveRuntimeApi } from "./hermes-client.js";
import { runEmployeeTurn } from "./turn-queue.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation, startWorkRun } from "./metering.js";
import { recordSessionOccupancy, rotateSessionIfNeeded } from "./session-rotation.js";

export async function deliverToRuntime(apiUrl: string, body: string, channel: "sms" | "web"): Promise<string> {
  throw new Error(`legacy_runtime_path_removed:${channel}:${apiUrl ? "api_url_supplied" : "missing_api_url"}`);
}

export async function deliverOwnerTurnToRuntime(
  db: SupabaseClient,
  params: {
    account_id: string;
    employee_id: string;
    body: string;
    channel: "sms" | "web";
    idempotency_key: string;
  },
): Promise<{ status: "succeeded" | "queued" | "duplicate" | "failed"; reply?: string; job_id: string; error?: string; run_id: string }> {
  const runId = await startWorkRun(db, {
    account_id: params.account_id, employee_id: params.employee_id,
    trigger_type: "owner_message", trigger_ref: params.idempotency_key,
  });
  const startedAt = Date.now();
  const result = await runEmployeeTurn(
    db,
    {
      account_id: params.account_id,
      employee_id: params.employee_id,
      kind: params.channel === "sms" ? "owner_sms_chat" : "owner_web_chat",
      idempotency_key: params.idempotency_key,
      input: { body: params.body, channel: params.channel },
      run_id: runId,
    },
    async () => {
      // CE-3: rotate the transcript BEFORE the turn if the prior turn filled it,
      // so this turn runs fresh and re-primes; both calls run under the turn lock.
      await rotateSessionIfNeeded(db, { account_id: params.account_id, employee_id: params.employee_id });
      const api = await resolveRuntimeApi(db, params.employee_id);
      const turn = await executeHermesTurn(api, { input: params.body, work_run_id: runId });
      await recordExternalRuntimeRun(db, runId, { provider: "hermes", external_run_id: turn.external_run_id ?? null });
      await recordSessionOccupancy(db, {
        account_id: params.account_id, employee_id: params.employee_id,
        transcript_session_id: api.sessionId, memory_session_key: api.sessionKey,
        usage: turn.usage,
      });
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
