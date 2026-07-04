import type { SupabaseClient } from "@amtech/db";
import { assertWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";
import { executeHermesTurn, resolveRuntimeApi } from "./hermes-client.js";
import { runEmployeeTurn } from "./turn-queue.js";
import { recordExternalRuntimeRun, recordToolInvocation } from "./metering.js";

export interface WakeDescriptorPayload {
  account_id: string;
  employee_id: string;
  source_event_id: string;
  event_type: string;
  provider_id?: string | null;
  safe_summary: string;
  normalized_payload: Record<string, unknown>;
  suggested_next_action?: string;
  /** Metering correlation id threaded through the work chain (Phase 6). */
  run_id?: string | null;
}

function extractJson(text: string): unknown {
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  const candidate = fences.length ? fences[fences.length - 1]![1] : null;
  if (candidate) return JSON.parse(candidate);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
  throw new Error("descriptor_json_missing");
}

function systemPrompt(payload: WakeDescriptorPayload, retryError?: string): string {
  return [
    "INTERNAL WORK EVENT - not a message from your owner. Do not converse.",
    "Return EXACTLY ONE fenced ```json block and no other prose.",
    "JSON shape: {\"move\":\"notify|question|review\",\"title\":\"<=60 chars\",\"summary\":\"owner-safe summary\",\"deliverable\":{...optional},\"suggested_next_action\":\"optional\"}.",
    "If the next step sends email, asks the customer, changes schedule, or moves money, include a deliverable with acceptance containing approve.",
    "Never invent account_id, employee_id, source_event_id, approval_id, or provider ids. Manager stamps identity and proof.",
    retryError ? `Previous descriptor failed validation: ${retryError}` : "",
    `EVENT_TYPE: ${payload.event_type}`,
    `SAFE_SUMMARY: ${payload.safe_summary}`,
    `FACTS_JSON: ${JSON.stringify(payload.normalized_payload)}`,
    payload.suggested_next_action ? `SUGGESTED_NEXT_ACTION: ${payload.suggested_next_action}` : "",
  ].filter(Boolean).join("\n");
}

function stampDescriptor(raw: unknown, payload: WakeDescriptorPayload): WorkEventDescriptor {
  const value = raw as Partial<WorkEventDescriptor>;
  return assertWorkEventDescriptor({
    ...value,
    account_id: payload.account_id,
    employee_id: payload.employee_id,
    source_event_id: payload.source_event_id,
    proof: {
      ...(value.proof ?? {}),
      ...(payload.provider_id ? { provider_id: payload.provider_id } : {}),
    },
  } as WorkEventDescriptor);
}

export async function wakeEmployeeForDescriptor(db: SupabaseClient, payload: WakeDescriptorPayload): Promise<WorkEventDescriptor> {
  const startedAt = Date.now();
  const turn = await runEmployeeTurn(
    db,
    {
      account_id: payload.account_id,
      employee_id: payload.employee_id,
      kind: "employee_event_wake",
      idempotency_key: `wake:${payload.source_event_id}`,
      input: { event_type: payload.event_type, source_event_id: payload.source_event_id },
      run_id: payload.run_id ?? null,
    },
    async () => {
      const api = await resolveRuntimeApi(db, payload.employee_id);
      let retryError: string | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const res = await executeHermesTurn(api, {
          input: "Produce the work-event descriptor for the internal event.",
          system_message: systemPrompt(payload, retryError),
          work_run_id: payload.run_id ?? null,
        });
        await recordExternalRuntimeRun(db, payload.run_id ?? null, { provider: "hermes", external_run_id: res.external_run_id ?? null });
        try {
          const descriptor = stampDescriptor(extractJson(res.text), payload);
          return { descriptor, runtime_mode: res.mode, external_run_id: res.external_run_id ?? null };
        } catch (err) {
          retryError = String((err as Error).message ?? err);
        }
      }
      throw new Error(`wake_descriptor_invalid:${retryError ?? "unknown"}`);
    },
  );
  await recordToolInvocation(db, {
    run_id: payload.run_id ?? null,
    account_id: payload.account_id,
    employee_id: payload.employee_id,
    tool_name: "wake_employee",
    actor: "manager",
    status: turn.status,
    latency_ms: Date.now() - startedAt,
    provider_proof_id: payload.provider_id ?? null,
    error_code: turn.status === "failed" ? "wake_failed" : null,
  });
  if (turn.status !== "succeeded" && turn.status !== "duplicate") {
    throw new Error(turn.error ?? `wake_turn_${turn.status}`);
  }
  const descriptor = turn.output?.descriptor as WorkEventDescriptor | undefined;
  if (!descriptor) throw new Error("wake_descriptor_missing");
  return assertWorkEventDescriptor(descriptor);
}
