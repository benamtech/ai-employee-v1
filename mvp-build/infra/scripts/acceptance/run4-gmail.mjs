#!/usr/bin/env node
/**
 * Acceptance Run 4 — Gmail Send & Reply (doc 03 §4).
 * Asserts: a connected Gmail connector with a sealed token reference, an active
 * watch (historyId + expiration), a sent message id, a normalized inbound reply
 * (deduped by gmail_message_id), and an owner SMS notification provider id.
 * Token references are reported as present/sealed — never the value.
 */
import { runById, runnability, serviceDb, resolveEmployee, STATUS, mkResult, runMain } from "./_env.mjs";

const RUN = runById(4);

export async function verify() {
  const { runnable, missing } = runnability(RUN);
  if (!runnable) return mkResult(RUN, STATUS.NOT_RUN, { missing });

  const db = serviceDb();
  const employee = await resolveEmployee(db);
  if (!employee) return mkResult(RUN, STATUS.FAIL, { notes: ["no live employee (set SMOKE_EMPLOYEE_ID)"] });

  const proofs = {};
  const fails = [];

  const { data: conn } = await db
    .from("connector_accounts").select("*")
    .eq("employee_id", employee.id).eq("provider", "gmail").eq("status", "connected").maybeSingle();
  if (!conn?.token_secret_ref) {
    return mkResult(RUN, STATUS.FAIL, { notes: ["no connected Gmail connector with a sealed token_secret_ref"] });
  }
  proofs.connector = `${conn.id} (${conn.external_email ?? "email pending"})`;
  proofs.token_secret_ref = "sealed (present, not shown)";

  const { data: watch } = await db
    .from("gmail_watches").select("*")
    .eq("connector_id", conn.id).eq("status", "active")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!watch?.last_history_id || !watch?.expiration) fails.push("active Gmail watch (historyId + expiration)");
  else proofs.watch = `${watch.id} history=${watch.last_history_id} exp=${watch.expiration}`;

  const { data: sent } = await db
    .from("outbound_emails").select("*")
    .eq("connector_id", conn.id).not("gmail_message_id", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!sent?.gmail_message_id) fails.push("sent Gmail message id (approved estimate send)");
  else proofs.sent_message = sent.gmail_message_id;

  const { data: reply } = await db
    .from("inbound_email_events").select("*")
    .eq("connector_id", conn.id).not("gmail_message_id", "is", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!reply?.gmail_message_id) fails.push("normalized inbound reply event (gmail_message_id)");
  else proofs.inbound_reply = `${reply.id} msg=${reply.gmail_message_id}`;

  const { data: notify } = await db
    .from("employee_messages").select("*")
    .eq("employee_id", employee.id).eq("direction", "to_owner")
    .not("provider_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!notify?.provider_id) fails.push("owner notification SMS provider id");
  else proofs.owner_notify_sid = notify.provider_id;

  return mkResult(RUN, fails.length ? STATUS.FAIL : STATUS.PASS, { proofs, notes: fails.map((f) => `missing proof: ${f}`) });
}

await runMain(import.meta.url, verify);
