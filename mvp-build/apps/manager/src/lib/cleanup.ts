/**
 * Retention GC for accumulating tables. On a long-lived multi-tenant VPS these grow
 * without bound; Manager prunes them on a slow scheduler lane (`cleanup_expired`).
 * Conservative: keep everything inside the window (audit/proof), prune well past it.
 * Best-effort — a delete failure returns 0, never throws, so it can't block anything.
 */
import type { SupabaseClient } from "@amtech/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgoIso(days: number, nowMs: number): string {
  return new Date(nowMs - days * DAY_MS).toISOString();
}

function retentionDays(envKey: string, fallback: number): number {
  const v = Number(process.env[envKey]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export interface CleanupResult {
  preview_links: number;
  claim_tokens: number;
  delivery_decisions: number;
  inbound_events: number;
}

export async function cleanupExpiredRows(db: SupabaseClient, opts: { now?: string } = {}): Promise<CleanupResult> {
  const nowMs = opts.now ? Date.parse(opts.now) : Date.now();

  // Expired/revoked signed preview links, kept a short grace window past expiry.
  const preview_links = await deleteOlderThan(db, "preview_links", "expires_at", daysAgoIso(retentionDays("PREVIEW_LINK_RETENTION_DAYS", 3), nowMs));
  // Consumed/expired claim tokens (one per onboarding SMS).
  const claim_tokens = await deleteOlderThan(db, "claim_tokens", "expires_at", daysAgoIso(retentionDays("CLAIM_TOKEN_RETENTION_DAYS", 7), nowMs));
  // Delivery-decision + inbound-event history beyond the audit window.
  const eventCutoff = daysAgoIso(retentionDays("EVENT_RETENTION_DAYS", 90), nowMs);
  const delivery_decisions = await deleteOlderThan(db, "delivery_decisions", "created_at", eventCutoff);
  const inbound_events = await deleteOlderThan(db, "inbound_events", "created_at", eventCutoff);

  return { preview_links, claim_tokens, delivery_decisions, inbound_events };
}

async function deleteOlderThan(db: SupabaseClient, table: string, column: string, cutoffIso: string): Promise<number> {
  const { data, error } = await db.from(table).delete().lt(column, cutoffIso).select("id");
  if (error) return 0;
  return Array.isArray(data) ? data.length : 0;
}
