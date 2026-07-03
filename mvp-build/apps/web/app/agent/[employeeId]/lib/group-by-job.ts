/**
 * Pure grouping: turn the flat /resources payload into job folders the owner reads
 * as one thing — "the Smith repaint" — joining estimate -> email reply -> deposit
 * invoice -> reminder by the estimate artifact id (build-plan 15 §4b "the job folder").
 * No React, no IO: unit-tested in tests/unit/group-by-job.test.ts.
 */
import type {
  JobCommitmentRow,
  JobFolder,
  ReminderRow,
  ResourcePayload,
  WorkEventRow,
} from "../surface-types";

function refEstimateId(ev: WorkEventRow): string | undefined {
  return ev.work_event_descriptor?.deliverable?.refs?.estimate_artifact_id;
}

function later(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? "";
  if (!b) return a;
  return a > b ? a : b;
}

export interface GroupedSurface {
  folders: JobFolder[];
  looseWorkEvents: WorkEventRow[];
}

export function groupByJob(payload: Partial<ResourcePayload>): GroupedSurface {
  const folders = new Map<string, JobFolder>();
  const commitmentByEstimate = new Map<string, JobCommitmentRow>();
  const commitmentById = new Map<string, JobCommitmentRow>();

  const ensure = (key: string, titleHint?: string): JobFolder => {
    let f = folders.get(key);
    if (!f) {
      f = { key, title: "Job", invoices: [], reminders: [], commitments: [], workEvents: [], lastActivity: "" };
      folders.set(key, f);
    }
    // Only let a hint name the folder while it is still the default.
    if (titleHint && f.title === "Job") f.title = titleHint;
    return f;
  };

  // Estimates anchor a folder and name it.
  for (const art of payload.artifacts ?? []) {
    const f = ensure(art.id);
    f.estimate = art;
    f.customer = art.payload?.customer_name ?? f.customer;
    f.title = art.payload?.customer_name
      ? `${art.payload.customer_name}`
      : art.payload?.job_description?.slice(0, 40) ?? "Estimate";
    f.lastActivity = later(f.lastActivity, art.created_at);
  }

  for (const c of payload.job_commitments ?? []) {
    commitmentById.set(c.id, c);
    if (c.estimate_id) commitmentByEstimate.set(c.estimate_id, c);
    const key = c.estimate_id ?? `job:${c.id}`;
    const f = ensure(key, c.customer_ref ?? undefined);
    f.commitments.push(c);
    if (c.customer_ref && !f.customer) f.customer = c.customer_ref;
    f.lastActivity = later(f.lastActivity, c.created_at);
  }

  for (const inv of payload.stripe_invoices ?? []) {
    const key = inv.estimate_id ?? `inv:${inv.id}`;
    const f = ensure(key);
    f.invoices.push(inv);
  }

  for (const r of payload.reminders ?? []) {
    const commitment = r.job_id ? commitmentById.get(r.job_id) : undefined;
    const key = commitment?.estimate_id ?? (r.job_id ? `job:${r.job_id}` : `rem:${r.id}`);
    const f = ensure(key, commitment?.customer_ref ?? undefined);
    f.reminders.push(r);
    f.lastActivity = later(f.lastActivity, r.sent_at ?? r.scheduled_at);
  }

  const loose: WorkEventRow[] = [];
  for (const ev of payload.work_events ?? []) {
    const key = refEstimateId(ev);
    if (key) {
      const f = ensure(key);
      f.workEvents.push(ev);
      f.lastActivity = later(f.lastActivity, ev.created_at);
    } else {
      loose.push(ev);
    }
  }

  const ordered = [...folders.values()]
    // A folder is worth showing only if it has more than just an estimate stub OR is itself the estimate.
    .sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : a.lastActivity > b.lastActivity ? -1 : 0));

  return { folders: ordered, looseWorkEvents: loose };
}
