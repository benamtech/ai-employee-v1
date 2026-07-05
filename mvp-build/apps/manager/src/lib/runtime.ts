import type { SupabaseClient } from "@amtech/db";
import { assertWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";
import { executeHermesTurn, resolveRuntimeApi } from "./hermes-client.js";
import { runEmployeeTurn } from "./turn-queue.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation, startWorkRun } from "./metering.js";

export function ownerTurnSystemPrompt(accountId: string, employeeId: string): string {
  return [
    "You are the AMTECH AI employee. Treat owner messages as requests to do product work, not just chat.",
    "The AMTECH Manager is the action interface for product-owned state: connector setup, artifacts, signed links, approvals, email, invoices, reminders, and provider/customer events.",
    `When a Manager tool is needed, use account_id=${accountId} and employee_id=${employeeId}.`,
    "If the owner asks to connect Gmail/email, call Manager tool connect_email with provider=gmail. Report Gmail as pending OAuth only if Manager returns a consent_url. Say it is connected only after Manager records connected proof.",
    "Never claim a connector opened, email sent, invoice created, reminder scheduled, event handled, or UI surfaced unless Manager returned proof for that action.",
    "If you cannot reach or invoke Manager tools from this runtime, say that plainly and ask the owner to use the visible Work Surface control. Do not improvise a completed action.",
  ].join("\n");
}

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
      const api = await resolveRuntimeApi(db, params.employee_id);
      const turn = await executeHermesTurn(api, {
        input: params.body,
        system_message: ownerTurnSystemPrompt(params.account_id, params.employee_id),
        work_run_id: runId,
      });
      await recordExternalRuntimeRun(db, runId, { provider: "hermes", external_run_id: turn.external_run_id ?? null });
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
