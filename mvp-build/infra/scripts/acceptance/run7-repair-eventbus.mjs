#!/usr/bin/env node
/**
 * Acceptance Run 7 — Repair & Event Bus (doc 03 §7).
 * Asserts the operator exercised the repair/event-bus surface: a repair-queue row
 * (replay/redeliver), an event-source suppression, and normalized inbound events
 * flowing through one lifecycle. Runtime structured-event response is runtime-accepted
 * separately (not a DB row) — noted, not claimed here.
 */
import { runById, runnability, serviceDb, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(7);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const proofs = {};
  const fails = [];

  const { data: repair } = await db
    .from("event_repair_queue").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!repair?.id) fails.push("event_repair_queue row (replay/redeliver an event)");
  else proofs.repair_queue = `${repair.id}${repair.provider_id ? ` provider=${repair.provider_id}` : ""}`;

  const { data: suppression } = await db
    .from("event_source_suppressions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!suppression?.id) fails.push("event_source_suppressions row (suppress a noisy source)");
  else proofs.suppression = suppression.id;

  const { data: inbound } = await db
    .from("inbound_events").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!inbound?.id) fails.push("inbound_events row (provider event normalized + routed)");
  else proofs.inbound_event = `${inbound.id} (${inbound.source}/${inbound.event_type})`;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, {
    proofs,
    notes: [
      ...fails.map((f) => `missing proof: ${f}`),
      "Runtime structured-event (wake_employee) response is runtime-accepted separately (Phase 4 live wake path).",
    ],
  });
}

await runMain(import.meta.url, verify);
