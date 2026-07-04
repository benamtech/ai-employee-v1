import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { orThrow, mustWrite } from "./db.js";

export type TriageDecision = "notify" | "batch" | "ignore" | "repair";
export type TriagePriority = "high" | "medium" | "low";

export interface TriageResult {
  decision: TriageDecision;
  priority: TriagePriority;
}

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

// Tunables (env-overridable). Rules-first and deterministic; the cheap-model tier
// (claude-haiku-4-5) is an off-by-default seam via TRIAGE_MODEL_TIER.
const BURST_WINDOW_SECONDS = Number(process.env.TRIAGE_BURST_WINDOW_SECONDS ?? 120);
const BURST_THRESHOLD = Number(process.env.TRIAGE_BURST_THRESHOLD ?? 3);
/** Sources whose bursts we collapse into a digest. Manager-authored events
 *  (digests, reminders, daily brief) are never batched. */
const BATCHABLE_SOURCES = new Set(["gmail", "stripe", "twilio"]);

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

/** Owner-attention priority from deterministic signals. Money / customer-facing /
 *  "leaves the business" work is always high — it is never batched away. */
export function derivePriority(input: TriageInput): TriagePriority {
  if (input.triage_hint === "silent") return "low";
  const t = input.event_type.toLowerCase();
  const descriptor = (input.normalized_payload?.work_event_descriptor as { deliverable?: { leaves_business?: boolean; money?: { involved?: boolean }; type?: string } } | undefined);
  const d = descriptor?.deliverable;
  if (d?.money?.involved || d?.leaves_business || d?.type === "money_movement" || d?.type === "outbound_message") return "high";
  if (/(payment|invoice|deposit|charge|refund|dispute|paid)/.test(t)) return "high";
  if (/(reply|message|inbound|received)/.test(t)) return "medium";
  return "medium";
}

/** Count recent same-source events for this account to detect a burst. */
async function countRecentSameSource(db: SupabaseClient, input: TriageInput, windowSeconds: number): Promise<number> {
  if (!input.account_id) return 0;
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await db
    .from("inbound_events")
    .select("id", { count: "exact", head: true })
    .eq("account_id", input.account_id)
    .eq("source", input.source)
    .eq("event_type", input.event_type)
    .gte("created_at", since);
  return count ?? 0;
}

export async function decideTriage(db: SupabaseClient, input: TriageInput): Promise<TriageResult> {
  if (await isSourceSuppressed(db, input)) return { decision: "ignore", priority: "low" };
  if (!input.account_id || !input.employee_id) return { decision: "repair", priority: "high" };

  const priority = derivePriority(input);

  // Explicit silent hint (or the legacy prefix) routes to the batch surface.
  if (input.triage_hint === "silent" || input.safe_summary.trim().startsWith("[SILENT]")) {
    return { decision: "batch", priority: "low" };
  }
  // Critical work is never batched away.
  if (priority === "high") return { decision: "notify", priority };
  // Collapse provider bursts into a digest.
  if (BATCHABLE_SOURCES.has(input.source)) {
    const recent = await countRecentSameSource(db, input, BURST_WINDOW_SECONDS);
    if (recent >= BURST_THRESHOLD) return { decision: "batch", priority };
  }
  return { decision: "notify", priority };
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

const FLUSH_AFTER_SECONDS = Number(process.env.TRIAGE_FLUSH_AFTER_SECONDS ?? 300);

export async function recordBatchCandidate(db: SupabaseClient, input: TriageInput, priority: TriagePriority = "low"): Promise<string> {
  const batchKey = `${input.source}:${input.event_type}`;
  const nowIso = new Date().toISOString();
  const existing = orThrow(
    await db.from("event_batches").select("id,event_count").eq("account_id", input.account_id).eq("batch_key", batchKey).eq("status", "open").maybeSingle(),
    "event_batches.lookup",
  );
  if (existing) {
    const row = existing as { id: string; event_count?: number };
    await mustWrite(
      db.from("event_batches").update({ event_count: Number(row.event_count ?? 0) + 1, last_seen_at: nowIso }).eq("id", row.id),
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
      priority,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
      flush_after: new Date(Date.now() + FLUSH_AFTER_SECONDS * 1000).toISOString(),
    }),
    "event_batches.insert",
  );
  return id;
}
