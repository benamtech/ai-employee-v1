import { randomUUID } from "node:crypto";
import { serviceClient, type SupabaseClient } from "@amtech/db";

export interface AmbientEventInput {
  source_type: string;
  provider: string;
  external_event_id: string;
  account_id?: string | null;
  employee_id?: string | null;
  occurred_at?: string | null;
  event_type: string;
  subject_key?: string | null;
  correlation_id?: string | null;
  causation_id?: string | null;
  dedupe_key?: string;
  ordering_key?: string | null;
  payload?: Record<string, unknown>;
  headers_metadata?: Record<string, unknown>;
  verification_metadata?: Record<string, unknown>;
}

export interface AmbientInboxRow extends AmbientEventInput {
  inbox_id: string;
  processing_state: string;
  attempt_count: number;
  max_attempts: number;
  lease_token?: string | null;
  lease_expires_at?: string | null;
  next_attempt_at?: string | null;
  received_at?: string | null;
  replay_count?: number | null;
}

export interface AmbientEffectReceipt {
  id: string;
  inbox_id: string;
  effect_key: string;
  provider: string;
  state: "claimed" | "applied" | "failed" | "ambiguous";
  provider_id?: string | null;
  evidence?: Record<string, unknown>;
  claimed_at?: string | null;
  applied_at?: string | null;
}

export class AmbientWaitingForBindingError extends Error {
  constructor(message = "ambient_event_waiting_for_binding") {
    super(message);
    this.name = "AmbientWaitingForBindingError";
  }
}

export class AmbientEffectAmbiguousError extends Error {
  constructor(message = "ambient_provider_effect_ambiguous") {
    super(message);
    this.name = "AmbientEffectAmbiguousError";
  }
}

let workerTimer: NodeJS.Timeout | null = null;
let workerRunning = false;

function nowIso(): string {
  return new Date().toISOString();
}

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value && typeof value === "object" ? value as T : null;
}

function retryDelayMs(attempt: number): number {
  const bounded = Math.max(1, Math.min(attempt, 10));
  return Math.min(60 * 60_000, 2_000 * (2 ** (bounded - 1)));
}

function safeError(err: unknown): Record<string, unknown> {
  return {
    name: (err as Error)?.name ?? "Error",
    message: String((err as Error)?.message ?? err).replace(/[A-Za-z0-9_=-]{32,}/g, "[REDACTED]").slice(0, 500),
    at: nowIso(),
  };
}

export async function enqueueAmbientEvent(db: SupabaseClient, input: AmbientEventInput): Promise<{ inbox_id: string; duplicate: boolean }> {
  const dedupeKey = input.dedupe_key ?? `${input.source_type}:${input.provider}:${input.external_event_id}`;
  const inboxId = `ain_${randomUUID()}`;
  const inserted = await db.from("ambient_event_inbox").insert({
    inbox_id: inboxId,
    source_type: input.source_type,
    provider: input.provider,
    external_event_id: input.external_event_id,
    account_id: input.account_id ?? null,
    employee_id: input.employee_id ?? null,
    occurred_at: input.occurred_at ?? null,
    verified_at: nowIso(),
    event_type: input.event_type,
    subject_key: input.subject_key ?? null,
    correlation_id: input.correlation_id ?? null,
    causation_id: input.causation_id ?? null,
    dedupe_key: dedupeKey,
    ordering_key: input.ordering_key ?? null,
    payload: input.payload ?? {},
    headers_metadata: input.headers_metadata ?? {},
    verification_metadata: input.verification_metadata ?? {},
    processing_state: "received",
  }).select("inbox_id").maybeSingle();
  if (!inserted.error) return { inbox_id: String(inserted.data?.inbox_id ?? inboxId), duplicate: false };
  if ((inserted.error as { code?: string }).code !== "23505") throw inserted.error;
  const existing = await db.from("ambient_event_inbox").select("inbox_id").eq("dedupe_key", dedupeKey).maybeSingle();
  if (existing.error || !existing.data) throw existing.error ?? new Error("ambient_event_dedupe_lookup_failed");
  return { inbox_id: String(existing.data.inbox_id), duplicate: true };
}

export async function claimAmbientEffect(db: SupabaseClient, input: { inbox_id: string; effect_key: string; provider: string; evidence?: Record<string, unknown> }): Promise<{ claimed: boolean; receipt: AmbientEffectReceipt }> {
  const id = `aer_${randomUUID()}`;
  const inserted = await db.from("ambient_effect_receipts").insert({
    id,
    inbox_id: input.inbox_id,
    effect_key: input.effect_key,
    provider: input.provider,
    state: "claimed",
    evidence: input.evidence ?? {},
  }).select("*").maybeSingle();
  if (!inserted.error && inserted.data) return { claimed: true, receipt: inserted.data as AmbientEffectReceipt };
  if ((inserted.error as { code?: string } | null)?.code !== "23505") throw inserted.error;
  const existing = await db.from("ambient_effect_receipts").select("*").eq("effect_key", input.effect_key).maybeSingle();
  if (existing.error || !existing.data) throw existing.error ?? new Error("ambient_effect_receipt_lookup_failed");
  const receipt = existing.data as AmbientEffectReceipt;
  if (receipt.state === "failed") {
    const reclaimed = await db.from("ambient_effect_receipts").update({
      state: "claimed",
      claimed_at: nowIso(),
      updated_at: nowIso(),
      evidence: { ...(receipt.evidence ?? {}), ...(input.evidence ?? {}), retry_claimed_at: nowIso() },
    }).eq("id", receipt.id).eq("state", "failed").select("*").maybeSingle();
    if (reclaimed.error) throw reclaimed.error;
    if (reclaimed.data) return { claimed: true, receipt: reclaimed.data as AmbientEffectReceipt };
  }
  return { claimed: false, receipt };
}

export async function completeAmbientEffect(db: SupabaseClient, receiptId: string, input: { provider_id?: string | null; evidence?: Record<string, unknown> }): Promise<void> {
  const updated = await db.from("ambient_effect_receipts").update({
    state: "applied",
    provider_id: input.provider_id ?? null,
    evidence: input.evidence ?? {},
    applied_at: nowIso(),
    updated_at: nowIso(),
  }).eq("id", receiptId).eq("state", "claimed");
  if (updated.error) throw updated.error;
}

export async function failAmbientEffect(db: SupabaseClient, receiptId: string, err: unknown): Promise<void> {
  const updated = await db.from("ambient_effect_receipts").update({
    state: "failed",
    evidence: { error: safeError(err) },
    updated_at: nowIso(),
  }).eq("id", receiptId).eq("state", "claimed");
  if (updated.error) throw updated.error;
}

export async function markAmbientEffectAmbiguous(db: SupabaseClient, receiptId: string, evidence: Record<string, unknown>): Promise<void> {
  const updated = await db.from("ambient_effect_receipts").update({ state: "ambiguous", evidence, updated_at: nowIso() }).eq("id", receiptId).eq("state", "claimed");
  if (updated.error) throw updated.error;
}

async function claimNextAmbientEvent(db: SupabaseClient): Promise<AmbientInboxRow | null> {
  const claimed = await db.rpc("claim_next_ambient_event", { p_lease_token: `ael_${randomUUID()}`, p_lease_seconds: 120 });
  if (claimed.error) throw claimed.error;
  return firstRow<AmbientInboxRow>(claimed.data);
}

async function earlierOrderedEventExists(db: SupabaseClient, event: AmbientInboxRow): Promise<boolean> {
  if (!event.ordering_key || !event.received_at) return false;
  const earlier = await db.from("ambient_event_inbox")
    .select("inbox_id")
    .eq("ordering_key", event.ordering_key)
    .lt("received_at", event.received_at)
    .in("processing_state", ["received", "processing", "retryable_failed", "waiting_for_binding"])
    .limit(1);
  if (earlier.error) throw earlier.error;
  return Boolean(earlier.data?.length);
}

async function dispatchAmbientEvent(db: SupabaseClient, event: AmbientInboxRow): Promise<Record<string, unknown>> {
  if (event.provider === "twilio") {
    const module = await import("../webhooks/twilio.js");
    return await module.processTwilioAmbientEvent(db, event);
  }
  if (event.provider === "gmail") {
    const module = await import("../webhooks/gmail.js");
    return await module.processGmailAmbientEvent(db, event);
  }
  if (event.provider === "stripe") {
    const module = await import("../webhooks/stripe.js");
    return await module.processStripeAmbientEvent(db, event);
  }
  if (event.provider === "quickbooks") {
    const module = await import("../webhooks/quickbooks.js");
    return await module.processQuickbooksAmbientEvent(db, event);
  }
  if (event.provider === "amtech" && event.event_type === "employee.welcome.requested") {
    return { welcome_ready: true, delivery_deferred_to_provider_path: true };
  }
  throw new Error(`ambient_provider_not_supported:${event.provider}`);
}

async function markProcessed(db: SupabaseClient, event: AmbientInboxRow, evidence: Record<string, unknown>): Promise<void> {
  const updated = await db.from("ambient_event_inbox").update({
    processing_state: "processed",
    processed_at: nowIso(),
    lease_token: null,
    lease_expires_at: null,
    last_error: null,
    verification_metadata: { ...(event.verification_metadata ?? {}), processing_evidence: evidence },
  }).eq("inbox_id", event.inbox_id).eq("lease_token", event.lease_token);
  if (updated.error) throw updated.error;
}

async function markRetry(db: SupabaseClient, event: AmbientInboxRow, err: unknown): Promise<void> {
  const waiting = err instanceof AmbientWaitingForBindingError;
  const attempts = Number(event.attempt_count ?? 1);
  const maxAttempts = Number(event.max_attempts ?? 12);
  if (attempts >= maxAttempts || err instanceof AmbientEffectAmbiguousError) {
    const failure = safeError(err);
    const deadLetterId = `adl_${randomUUID()}`;
    const dead = await db.from("ambient_event_dead_letters").upsert({
      id: deadLetterId,
      inbox_id: event.inbox_id,
      provider: event.provider,
      external_event_id: event.external_event_id,
      failure,
      replay_count: Number(event.replay_count ?? 0),
    }, { onConflict: "inbox_id" });
    if (dead.error) throw dead.error;
    const updated = await db.from("ambient_event_inbox").update({
      processing_state: "dead_letter",
      dead_letter_reason: String(failure.message ?? "ambient_event_failed"),
      last_error: failure,
      lease_token: null,
      lease_expires_at: null,
    }).eq("inbox_id", event.inbox_id).eq("lease_token", event.lease_token);
    if (updated.error) throw updated.error;
    return;
  }
  const updated = await db.from("ambient_event_inbox").update({
    processing_state: waiting ? "waiting_for_binding" : "retryable_failed",
    next_attempt_at: new Date(Date.now() + retryDelayMs(attempts)).toISOString(),
    last_error: safeError(err),
    lease_token: null,
    lease_expires_at: null,
  }).eq("inbox_id", event.inbox_id).eq("lease_token", event.lease_token);
  if (updated.error) throw updated.error;
}

async function releaseForOrdering(db: SupabaseClient, event: AmbientInboxRow): Promise<void> {
  const updated = await db.from("ambient_event_inbox").update({
    processing_state: "received",
    next_attempt_at: new Date(Date.now() + 1_000).toISOString(),
    lease_token: null,
    lease_expires_at: null,
  }).eq("inbox_id", event.inbox_id).eq("lease_token", event.lease_token);
  if (updated.error) throw updated.error;
}

export async function runAmbientInboxCycle(db: SupabaseClient = serviceClient()): Promise<{ claimed: boolean; processed: boolean }> {
  const event = await claimNextAmbientEvent(db);
  if (!event) return { claimed: false, processed: false };
  if (await earlierOrderedEventExists(db, event)) {
    await releaseForOrdering(db, event);
    return { claimed: true, processed: false };
  }
  try {
    const evidence = await dispatchAmbientEvent(db, event);
    await markProcessed(db, event, evidence);
    return { claimed: true, processed: true };
  } catch (err) {
    await markRetry(db, event, err);
    return { claimed: true, processed: false };
  }
}

export async function replayAmbientDeadLetter(db: SupabaseClient, inboxId: string): Promise<void> {
  const inbox = await db.from("ambient_event_inbox").select("inbox_id,replay_count").eq("inbox_id", inboxId).eq("processing_state", "dead_letter").maybeSingle();
  if (inbox.error) throw inbox.error;
  if (!inbox.data) throw new Error("ambient_dead_letter_not_found");
  const replayCount = Number(inbox.data.replay_count ?? 0) + 1;
  const reset = await db.from("ambient_event_inbox").update({
    processing_state: "received",
    attempt_count: 0,
    replay_count: replayCount,
    next_attempt_at: nowIso(),
    dead_letter_reason: null,
    last_error: null,
    lease_token: null,
    lease_expires_at: null,
    processed_at: null,
  }).eq("inbox_id", inboxId);
  if (reset.error) throw reset.error;
  const receipt = await db.from("ambient_event_dead_letters").update({ replay_count: replayCount, last_replayed_at: nowIso() }).eq("inbox_id", inboxId);
  if (receipt.error) throw receipt.error;
}

export function startAmbientInboxWorker(): void {
  if (workerTimer || process.env.AMBIENT_INBOX_WORKER_DISABLED === "1") return;
  const intervalMs = Math.max(250, Number(process.env.AMBIENT_INBOX_WORKER_INTERVAL_MS ?? 1_000));
  const tick = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
      await runAmbientInboxCycle();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[ambient-inbox] cycle failed", String((err as Error).message ?? err));
    } finally {
      workerRunning = false;
    }
  };
  workerTimer = setInterval(() => void tick(), intervalMs);
  workerTimer.unref();
  void tick();
}

export function stopAmbientInboxWorker(): void {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
}
