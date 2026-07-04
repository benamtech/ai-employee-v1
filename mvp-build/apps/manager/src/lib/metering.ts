/**
 * Metering foundation (Phase 6). Records immutable usage FACTS and correlates a
 * chain of work under one `run_id`. It is NOT billing (Phase 11 derives invoices)
 * and NOT authorization.
 *
 * Discipline (mirrors audit_log / usage_events in db.ts): metering writes are
 * best-effort TELEMETRY. A failed meter write must never abort or throw into the
 * owner-facing action it is measuring — every helper swallows its own errors and,
 * where relevant, still returns a usable id. Do NOT wrap these in mustWrite.
 *
 * Raw meter rows are Manager-only (0013: RLS on, no select policy). No provider
 * secrets or raw bodies enter these tables — hashes/ids/safe metadata only.
 */
import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";

export type WorkRunTrigger = "owner_message" | "provider_event" | "scheduled_job" | "repair" | "provision" | "system";
export type WorkRunStatus = "started" | "succeeded" | "failed" | "cancelled" | "needs_approval";
export type MeterCategory = "model" | "hermes_runtime" | "manager_tool" | "provider_api" | "sms" | "storage" | "artifact" | "scheduler";
export type MeterUnit = "input_tokens" | "output_tokens" | "cached_tokens" | "tool_call" | "sms_segment" | "api_call" | "byte" | "second" | "cent";

/** Start a correlated unit of work and return its run_id. The id is returned even
 *  if the insert fails, so the caller can still thread correlation through the chain. */
export async function startWorkRun(
  db: SupabaseClient,
  input: { account_id?: string | null; employee_id?: string | null; trigger_type: WorkRunTrigger; trigger_ref?: string | null; summary_safe?: string | null },
): Promise<string> {
  const id = newId(ID_PREFIX.workRun);
  try {
    await db.from("work_runs").insert({
      id,
      account_id: input.account_id ?? null,
      employee_id: input.employee_id ?? null,
      trigger_type: input.trigger_type,
      trigger_ref: input.trigger_ref ?? null,
      status: "started",
      summary_safe: input.summary_safe ?? null,
    });
  } catch { /* best-effort telemetry */ }
  return id;
}

export async function finishWorkRun(db: SupabaseClient, runId: string | null | undefined, status: WorkRunStatus): Promise<void> {
  if (!runId) return;
  try {
    await db.from("work_runs").update({ status, finished_at: new Date().toISOString() }).eq("id", runId);
  } catch { /* best-effort telemetry */ }
}

export async function recordExternalRuntimeRun(
  db: SupabaseClient,
  runId: string | null | undefined,
  input: { provider: string; external_run_id?: string | null },
): Promise<void> {
  if (!runId || !input.external_run_id) return;
  try {
    await db.from("work_runs").update({
      runtime_provider: input.provider,
      external_runtime_run_id: input.external_run_id,
    }).eq("id", runId);
  } catch { /* best-effort telemetry */ }
}

export async function recordMeterEvent(
  db: SupabaseClient,
  input: {
    run_id?: string | null; account_id?: string | null; employee_id?: string | null;
    category: MeterCategory; provider?: string | null; feature_key: string;
    quantity?: number; unit: MeterUnit; cost_micros?: number;
    request_id?: string | null; provider_id?: string | null; status?: string | null;
    latency_ms?: number | null; metadata_safe?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await db.from("meter_events").insert({
      id: newId(ID_PREFIX.meterEvent),
      run_id: input.run_id ?? null,
      account_id: input.account_id ?? null,
      employee_id: input.employee_id ?? null,
      category: input.category,
      provider: input.provider ?? null,
      feature_key: input.feature_key,
      quantity: input.quantity ?? 0,
      unit: input.unit,
      cost_micros: input.cost_micros ?? 0,
      request_id: input.request_id ?? null,
      provider_id: input.provider_id ?? null,
      status: input.status ?? null,
      latency_ms: input.latency_ms ?? null,
      metadata_safe: input.metadata_safe ?? {},
    });
  } catch { /* best-effort telemetry */ }
}

export async function recordToolInvocation(
  db: SupabaseClient,
  input: {
    run_id?: string | null; account_id?: string | null; employee_id?: string | null;
    tool_name: string; actor?: string | null; status?: string | null; latency_ms?: number | null;
    provider_proof_id?: string | null; approval_id?: string | null; error_code?: string | null;
    input_hash?: string | null; output_hash?: string | null;
  },
): Promise<void> {
  try {
    await db.from("tool_invocations").insert({
      id: newId(ID_PREFIX.toolInvocation),
      run_id: input.run_id ?? null,
      account_id: input.account_id ?? null,
      employee_id: input.employee_id ?? null,
      tool_name: input.tool_name,
      actor: input.actor ?? null,
      input_hash: input.input_hash ?? null,
      output_hash: input.output_hash ?? null,
      approval_id: input.approval_id ?? null,
      status: input.status ?? null,
      latency_ms: input.latency_ms ?? null,
      provider_proof_id: input.provider_proof_id ?? null,
      error_code: input.error_code ?? null,
    });
  } catch { /* best-effort telemetry */ }
}
