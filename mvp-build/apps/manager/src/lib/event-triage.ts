import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { orThrow, mustWrite } from "./db.js";

export type TriageDecision = "notify" | "batch" | "ignore" | "repair";

export interface TriageInput {
  account_id?: string | null;
  employee_id?: string | null;
  source: string;
  event_type: string;
  provider_id?: string | null;
  normalized_payload?: Record<string, unknown>;
  safe_summary: string;
  /** Explicit "don't interrupt the owner" signal — replaces the legacy `[SILENT]`
   *  prefix smuggled into safe_summary, which could leak to the Work Surface. */
  triage_hint?: "silent";
}

export async function isSourceSuppressed(db: SupabaseClient, input: TriageInput): Promise<boolean> {
  const now = new Date().toISOString();
  const data = orThrow(
    await db.from("event_source_suppressions").select("id,account_id,event_type,expires_at").eq("source", input.source).eq("active", true),
    "event_source_suppressions.scan",
  );
  return ((data ?? []) as Array<{ account_id?: string | null; event_type?: string | null; expires_at?: string | null }>).some((row) => {
    if (row.account_id && row.account_id !== input.account_id) return false;
    if (row.event_type && row.event_type !== input.event_type) return false;
    if (row.expires_at && row.expires_at < now) return false;
    return true;
  });
}

export async function decideTriage(db: SupabaseClient, input: TriageInput): Promise<TriageDecision> {
  if (await isSourceSuppressed(db, input)) return "ignore";
  if (!input.account_id || !input.employee_id) return "repair";
  // Explicit silent hint preferred; keep the legacy prefix as a back-compat fallback.
  if (input.triage_hint === "silent" || input.safe_summary.trim().startsWith("[SILENT]")) return "batch";
  return "notify";
}

export async function enqueueRepair(db: SupabaseClient, input: TriageInput & { inbound_event_id?: string | null; reason: string }) {
  const id = newId(ID_PREFIX.repairQueue);
  await mustWrite(
    db.from("event_repair_queue").insert({
      id,
      account_id: input.account_id ?? null,
      employee_id: input.employee_id ?? null,
      source: input.source,
      event_type: input.event_type,
      provider_id: input.provider_id ?? null,
      inbound_event_id: input.inbound_event_id ?? null,
      reason: input.reason,
      details: { safe_summary: input.safe_summary },
    }),
    "event_repair_queue.insert",
  );
  return id;
}

export async function recordBatchCandidate(db: SupabaseClient, input: TriageInput): Promise<string> {
  const batchKey = `${input.source}:${input.event_type}`;
  const existing = orThrow(
    await db.from("event_batches").select("id,event_count").eq("account_id", input.account_id).eq("batch_key", batchKey).eq("status", "open").maybeSingle(),
    "event_batches.lookup",
  );
  if (existing) {
    const row = existing as { id: string; event_count?: number };
    await mustWrite(
      db.from("event_batches").update({ event_count: Number(row.event_count ?? 0) + 1 }).eq("id", row.id),
      "event_batches.increment",
    );
    return row.id;
  }
  const id = newId(ID_PREFIX.eventBatch);
  await mustWrite(
    db.from("event_batches").insert({
      id,
      account_id: input.account_id,
      employee_id: input.employee_id,
      batch_key: batchKey,
      event_count: 1,
    }),
    "event_batches.insert",
  );
  return id;
}
