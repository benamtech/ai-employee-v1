/**
 * Account-layer batching flush (Phase 5). Provider bursts (a run of the same
 * source+type within a short window) are collapsed into ONE owner-facing digest
 * instead of many interruptions — "getting work done at scale is mostly not
 * interrupting the owner." A batch flushes when it grows past a count threshold
 * or its time window elapses (driven by the `flush_event_batches` scheduler lane).
 *
 * The digest is delivered through the normal deliverEmployeeEvent path as a single
 * `manager.digest` notify. Manager-sourced events are never re-batched (see
 * BATCHABLE_SOURCES in event-triage), so this cannot loop.
 */
import type { SupabaseClient } from "@amtech/db";
import { assertWorkEventDescriptor, type WorkEventDescriptor } from "@amtech/shared";
import { deliverEmployeeEvent } from "./employee-events.js";

const FLUSH_COUNT_THRESHOLD = Number(process.env.TRIAGE_FLUSH_COUNT_THRESHOLD ?? 10);

interface OpenBatch {
  id: string;
  account_id: string;
  employee_id: string;
  batch_key: string;
  event_count: number;
  flush_after?: string | null;
}

const SOURCE_LABEL: Record<string, string> = { gmail: "email", stripe: "payment", twilio: "text" };

function humanizeBatch(batchKey: string): string {
  const source = batchKey.split(":")[0] ?? batchKey;
  return SOURCE_LABEL[source] ?? source;
}

/** A safe, gate-free notify descriptor summarizing a collapsed burst. */
export function buildDigestDescriptor(batch: OpenBatch): WorkEventDescriptor {
  const label = humanizeBatch(batch.batch_key);
  const n = batch.event_count;
  return assertWorkEventDescriptor({
    account_id: batch.account_id,
    employee_id: batch.employee_id,
    move: "notify",
    title: `${n} ${label} update${n === 1 ? "" : "s"}`,
    summary: `I grouped ${n} ${label} notification${n === 1 ? "" : "s"} from today so they didn't interrupt you. Open me if you want the details.`,
  });
}

export interface FlushResult {
  scanned: number;
  flushed: number;
  delivered: number;
}

/** Flush all due open batches. Idempotent per batch via a status claim + a stable
 *  digest idempotency key. */
export async function flushDueBatches(db: SupabaseClient, opts: { now?: string; limit?: number } = {}): Promise<FlushResult> {
  const nowIso = opts.now ?? new Date().toISOString();
  const { data } = await db
    .from("event_batches")
    .select("id,account_id,employee_id,batch_key,event_count,flush_after")
    .eq("status", "open")
    .order("flush_after", { ascending: true })
    .limit(opts.limit ?? 25);
  const open = (data ?? []) as OpenBatch[];
  const due = open.filter((b) => Number(b.event_count) >= FLUSH_COUNT_THRESHOLD || (b.flush_after != null && b.flush_after <= nowIso));

  let delivered = 0;
  for (const batch of due) {
    // Atomic claim: open -> flushing. Loser of a race skips.
    const claim = await db.from("event_batches").update({ status: "flushing" }).eq("id", batch.id).eq("status", "open").select("id");
    if (!claim.data?.length) continue;
    try {
      const res = await deliverEmployeeEvent(db, {
        account_id: batch.account_id,
        employee_id: batch.employee_id,
        event_type: "manager.digest",
        idempotency_key: `digest:${batch.id}`,
        safe_summary: `${batch.event_count} ${humanizeBatch(batch.batch_key)} updates grouped for you.`,
        work_event_descriptor: buildDigestDescriptor(batch),
        routing_mode: "deliver_only",
        actor: "scheduler",
        channel: "web",
      });
      await db.from("event_batches").update({ status: "flushed", flushed_at: nowIso, digest_event_id: res.event_id }).eq("id", batch.id);
      delivered += 1;
    } catch {
      // Release for a later retry rather than stranding the batch.
      await db.from("event_batches").update({ status: "open" }).eq("id", batch.id);
    }
  }
  return { scanned: open.length, flushed: due.length, delivered };
}
