#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { assert, fetchJson, requireArg, requireEnv, waitFor, writeProof } from "./production-proof-lib.mjs";

requireEnv("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MANAGER_API_ORIGIN", "MANAGER_INTERNAL_TOKEN");
const provider = requireArg("--provider");
const externalEventId = requireArg("--external-event-id");
const deadLetterInboxId = requireArg("--dead-letter-inbox");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const managerOrigin = process.env.MANAGER_API_ORIGIN.replace(/\/$/, "");

const { data: event, error: eventError } = await db.from("ambient_event_inbox")
  .select("inbox_id,source_type,provider,external_event_id,verified_at,verification_metadata,processing_state,attempt_count,duplicate_count,last_duplicate_at,processed_at,last_error")
  .eq("provider", provider)
  .eq("external_event_id", externalEventId)
  .maybeSingle();
if (eventError) throw eventError;
assert(event?.verified_at, "provider_event_not_verified", event);
assert(Number(event.duplicate_count ?? 0) >= 1 && event.last_duplicate_at, "provider_duplicate_redelivery_not_recorded", event);
assert(Number(event.attempt_count ?? 0) >= 2 || event.last_error, "provider_retry_not_observed", event);

const { data: deadLetter, error: deadError } = await db.from("ambient_event_dead_letters")
  .select("id,inbox_id,provider,external_event_id,failure,replay_count,last_replayed_at")
  .eq("inbox_id", deadLetterInboxId)
  .maybeSingle();
if (deadError) throw deadError;
assert(deadLetter?.provider === provider, "real_provider_dead_letter_missing", deadLetter);
const { data: deadInbox, error: deadInboxError } = await db.from("ambient_event_inbox")
  .select("inbox_id,processing_state,attempt_count,max_attempts,replay_count,dead_letter_reason,last_error")
  .eq("inbox_id", deadLetterInboxId)
  .maybeSingle();
if (deadInboxError) throw deadInboxError;
assert(deadInbox?.processing_state === "dead_letter", "inbox_not_dead_lettered", deadInbox);

const replay = await fetchJson(`${managerOrigin}/manager/ambient-events/${encodeURIComponent(deadLetterInboxId)}/replay`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN}`, "Content-Type": "application/json" },
  body: "{}",
});
assert(replay.response.status === 202, "dead_letter_replay_not_queued", { status: replay.response.status, body: replay.json });

const replayed = await waitFor("ambient dead-letter replay", async () => {
  const { data, error } = await db.from("ambient_event_inbox")
    .select("inbox_id,processing_state,attempt_count,replay_count,processed_at,last_error,verification_metadata")
    .eq("inbox_id", deadLetterInboxId)
    .maybeSingle();
  if (error) throw error;
  if (data?.processing_state === "dead_letter" && Number(data.replay_count ?? 0) > Number(deadInbox.replay_count ?? 0)) {
    throw new Error(`replayed_event_returned_to_dead_letter:${JSON.stringify(data.last_error)}`);
  }
  return { done: data?.processing_state === "processed", value: data };
}, { timeoutMs: Number(process.env.AMBIENT_REPLAY_PROOF_TIMEOUT_MS ?? 180_000), intervalMs: 1_000 });

const { data: receipts, error: receiptError } = await db.from("ambient_effect_receipts")
  .select("id,effect_key,provider,state,provider_id,evidence,claimed_at,applied_at")
  .eq("inbox_id", deadLetterInboxId);
if (receiptError) throw receiptError;
if (provider === "twilio") assert(receipts?.some((receipt) => receipt.state === "applied" && receipt.provider_id), "twilio_replay_missing_applied_effect_receipt", receipts);

await writeProof("provider-inbox-reliability-live", "passed", {
  provider,
  original_event: {
    inbox_id: event.inbox_id,
    external_event_id: event.external_event_id,
    verified_at: event.verified_at,
    duplicate_count: event.duplicate_count,
    last_duplicate_at: event.last_duplicate_at,
    attempt_count: event.attempt_count,
    processing_state: event.processing_state,
  },
  dead_letter: {
    id: deadLetter.id,
    inbox_id: deadLetter.inbox_id,
    external_event_id: deadLetter.external_event_id,
    failure: deadLetter.failure,
    replay_count_before: deadLetter.replay_count,
  },
  replay: {
    endpoint_status: replay.response.status,
    state: replayed.processing_state,
    replay_count: replayed.replay_count,
    processed_at: replayed.processed_at,
  },
  effect_receipts: receipts ?? [],
});
