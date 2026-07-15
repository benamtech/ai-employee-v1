import type { SupabaseClient } from "@amtech/db";
import { executeHermesTurn, resolveRuntimeApi } from "./hermes-client.js";
import { finishWorkRun, recordExternalRuntimeRun, recordToolInvocation, startWorkRun } from "./metering.js";
import { runEmployeeTurn } from "./turn-queue.js";
import {
  mapPublicEstimatorArtifacts,
  recordPublicEstimatorMessage,
  type PublicEstimatorSession,
} from "./public-estimator.js";

export interface PublicEstimatorTurnResult {
  status: "succeeded" | "queued" | "duplicate" | "failed";
  reply?: string;
  job_id: string;
  run_id: string;
  external_run_id?: string | null;
  mapped_artifact_ids: string[];
  error?: string;
}

function publicEstimatorSystemMessage(session: PublicEstimatorSession, runId: string): string {
  return [
    "You are Avery, an AMTECH estimator employee materialized on a public website for a contractor prospect.",
    "The visitor is the contractor or business owner testing AMTECH, not the homeowner/customer.",
    "Collect only the missing job facts needed for a practical estimate draft. Ask concise follow-up questions when details are missing.",
    "When enough facts exist, call create_estimate_artifact with line items, assumptions, low-confidence flags, and recommended total or range.",
    `When creating an estimate artifact, set created_run to ${runId}.`,
    "Use account_id and employee_id from your bound Manager identity. Do not ask the visitor for internal ids.",
    "Do not send anything to a homeowner or customer. Do not create invoices, move money, or present the result as a guaranteed final price.",
    "Do not mention Hermes, Manager, MCP, tools, runtime, schema, database, tokens, stack traces, or providers.",
    "After a useful draft exists, offer to email the contractor visitor their own AMTECH draft and suggest making this estimator remember their pricing, format, materials, service area, and follow-up rules for the next job.",
    `Public visitor session: ${session.id}.`,
  ].join("\n");
}

export async function deliverPublicEstimatorTurnToRuntime(
  db: SupabaseClient,
  params: {
    session: PublicEstimatorSession;
    body: string;
    idempotency_key: string;
  },
): Promise<PublicEstimatorTurnResult> {
  const runId = await startWorkRun(db, {
    account_id: params.session.account_id,
    employee_id: params.session.employee_id,
    trigger_type: "owner_message",
    trigger_ref: params.idempotency_key,
  });
  const startedAt = Date.now();
  const since = new Date(Date.now() - 1000).toISOString();
  const result = await runEmployeeTurn(
    db,
    {
      account_id: params.session.account_id,
      employee_id: params.session.employee_id,
      kind: "public_estimator_chat",
      idempotency_key: params.idempotency_key,
      input: {
        body: params.body,
        visitor_session_id: params.session.id,
        transcript_session_id: params.session.transcript_session_id,
        memory_session_key: params.session.memory_session_key,
      },
      run_id: runId,
    },
    async () => {
      const ownerApi = await resolveRuntimeApi(db, params.session.employee_id);
      const api = {
        ...ownerApi,
        sessionId: params.session.transcript_session_id,
        sessionKey: params.session.memory_session_key,
      };
      const turn = await executeHermesTurn(api, {
        input: params.body,
        system_message: publicEstimatorSystemMessage(params.session, runId),
        work_run_id: runId,
      });
      await recordExternalRuntimeRun(db, runId, { provider: "hermes", external_run_id: turn.external_run_id ?? null });
      const mapped = await mapPublicEstimatorArtifacts(db, params.session, {
        since,
        run_id: runId,
      });
      return {
        reply: turn.text,
        usage: turn.usage ?? {},
        runtime_mode: turn.mode,
        external_run_id: turn.external_run_id ?? null,
        mapped_artifact_ids: mapped,
      };
    },
  );

  await recordToolInvocation(db, {
    run_id: runId,
    account_id: params.session.account_id,
    employee_id: params.session.employee_id,
    tool_name: "public_estimator_chat",
    actor: "owner",
    status: result.status,
    latency_ms: Date.now() - startedAt,
    error_code: result.status === "failed" ? "turn_failed" : null,
  });
  if (result.status === "succeeded" || result.status === "duplicate") await finishWorkRun(db, runId, "succeeded");
  else if (result.status === "failed") await finishWorkRun(db, runId, "failed");

  const reply = String(result.output?.reply ?? "");
  if (reply && (result.status === "succeeded" || result.status === "duplicate")) {
    await recordPublicEstimatorMessage(db, params.session, {
      direction: "employee",
      body: reply,
      status: "delivered",
      turn_job_id: result.job_id,
      work_run_id: runId,
      external_run_id: String(result.output?.external_run_id ?? "") || null,
    });
  }
  return {
    status: result.status,
    job_id: result.job_id,
    run_id: runId,
    reply,
    external_run_id: String(result.output?.external_run_id ?? "") || null,
    mapped_artifact_ids: (result.output?.mapped_artifact_ids as string[] | undefined) ?? [],
    error: result.error,
  };
}
