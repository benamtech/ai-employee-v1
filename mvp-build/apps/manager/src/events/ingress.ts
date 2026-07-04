import type { SupabaseClient } from "@amtech/db";
import { EVENT_TYPES, ID_PREFIX } from "@amtech/shared";
import { deliverEmployeeEvent } from "../lib/employee-events.js";
import { enqueueRepair } from "../lib/event-triage.js";
import { writeAudit } from "../lib/audit.js";
import { finishWorkRun, startWorkRun, type WorkRunStatus } from "../lib/metering.js";
import { getEventSource, type NormalizedEvent } from "./registry.js";
import "./adapters/index.js";

export interface IngestEventInput {
  source: "gmail" | "stripe" | "manager" | string;
  payload: unknown;
  edgeContext?: Record<string, unknown>;
}

function classifyRoute(event: NormalizedEvent): "deliver_only" | "wake_employee" {
  if (event.event_type === EVENT_TYPES.gmailReplyReceived) return "wake_employee";
  return "deliver_only";
}

/** Raw-provider field names that must never enter the brain as facts. Matched
 *  against object KEYS (recursively), not arbitrary value substrings — a customer
 *  who writes "authorization" in their reply is fine; a key named `access_token`
 *  is not. */
const FORBIDDEN_FACT_KEYS = ["raw", "rfc822", "payment_intent", "client_secret", "authorization", "access_token", "refresh_token"];

function collectKeys(value: unknown, acc: string[]): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { for (const item of value) collectKeys(item, acc); return; }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    acc.push(k.toLowerCase());
    collectKeys(v, acc);
  }
}

function assertSafeFact(event: NormalizedEvent): void {
  const payload = event.normalized_payload ?? {};
  if (JSON.stringify(payload).length > 8_000) throw new Error("safe_fact_too_large");
  const keys: string[] = [];
  collectKeys(payload, keys);
  for (const key of keys) {
    const hit = FORBIDDEN_FACT_KEYS.find((f) => key.includes(f));
    if (hit) throw new Error(`unsafe_fact:${hit}`);
  }
}

async function repair(db: SupabaseClient, source: string, reason: string, payload: unknown) {
  const maybe = payload as Partial<NormalizedEvent> | null;
  return enqueueRepair(db, {
    account_id: maybe?.account_id ?? null,
    employee_id: maybe?.employee_id ?? null,
    source,
    event_type: maybe?.event_type ?? "unknown",
    provider_id: maybe?.provider_id ?? null,
    normalized_payload: {},
    safe_summary: "Event could not be safely normalized.",
    reason,
  });
}

export async function ingestEvent(db: SupabaseClient, input: IngestEventInput) {
  const adapter = getEventSource(input.source);
  if (!adapter) {
    const repairId = await repair(db, input.source, "unknown_source", input.payload);
    await writeAudit(db, { account_id: null, employee_id: null, actor: "manager", action: "event:ingest", result: "failed", details: { source: input.source, reason: "unknown_source", repair_id: repairId } });
    return { event_id: repairId, message_id: "", delivery_status: "pending" as const, duplicate: false };
  }

  const verified = await adapter.verify(input.payload as never);
  if (!verified.ok) {
    const repairId = await repair(db, input.source, verified.reason, input.payload);
    return { event_id: repairId, message_id: "", delivery_status: "pending" as const, duplicate: false };
  }

  const event = await adapter.normalize(db, input.payload as never);
  if (!event) {
    const repairId = await repair(db, input.source, "normalize_failed", input.payload);
    return { event_id: repairId, message_id: "", delivery_status: "pending" as const, duplicate: false };
  }

  try {
    assertSafeFact(event);
  } catch (err) {
    const repairId = await repair(db, input.source, String((err as Error).message ?? err), event);
    return { event_id: repairId, message_id: "", delivery_status: "pending" as const, duplicate: false };
  }

  // Open the correlated work run at the true entry point so the whole chain
  // (ingest -> triage -> wake -> deliver) shares one run_id.
  const runId = await startWorkRun(db, {
    account_id: event.account_id ?? null,
    employee_id: event.employee_id ?? null,
    trigger_type: "provider_event",
    trigger_ref: adapter.dedupeKey(event),
    summary_safe: event.safe_summary,
  });

  try {
    const result = await deliverEmployeeEvent(db, {
      account_id: event.account_id ?? "",
      employee_id: event.employee_id ?? "",
      event_type: event.event_type,
      provider_id: event.provider_id ?? null,
      idempotency_key: adapter.dedupeKey(event),
      run_id: runId,
      normalized_payload: event.normalized_payload,
      safe_summary: event.safe_summary,
      suggested_next_action: event.suggested_next_action,
      actor: "manager",
      work_event_descriptor: event.work_event_descriptor,
      channel: event.channel,
      routing_mode: event.routing_mode ?? classifyRoute(event),
      triage_hint: event.triage_hint,
    });
    const status: WorkRunStatus = result.event_id.startsWith(`${ID_PREFIX.repairQueue}_`) ? "failed" : "succeeded";
    await finishWorkRun(db, runId, status);
    return result;
  } catch (err) {
    await finishWorkRun(db, runId, "failed");
    throw err;
  }
}
