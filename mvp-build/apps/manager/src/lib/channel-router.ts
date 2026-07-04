import { ID_PREFIX, newId, type EmployeeIntent } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { insertDedup, mustWrite, orThrow } from "./db.js";
import { renderWorkEventSms } from "@amtech/shared";
import { resolveEmployeeSmsSender } from "./sms-sender.js";
import { sendSms } from "./twilio.js";

function webPresenceWindowMs(): number {
  return Number(process.env.WEB_PRESENCE_WINDOW_SECONDS ?? 90) * 1000;
}

export async function stampChannelPresence(
  db: SupabaseClient,
  input: { account_id: string; employee_id: string; channel: "web" | "sms"; session_info?: Record<string, unknown> },
): Promise<void> {
  await mustWrite(
    db.from("channel_sessions").upsert({
      id: newId(ID_PREFIX.channelSession),
      account_id: input.account_id,
      employee_id: input.employee_id,
      channel: input.channel,
      last_seen_at: new Date().toISOString(),
      session_info: input.session_info ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "employee_id,channel" }),
    "channel_sessions.upsert",
  );
}

async function isWebActive(db: SupabaseClient, employeeId: string): Promise<boolean> {
  const row = orThrow(
    await db.from("channel_sessions").select("last_seen_at").eq("employee_id", employeeId).eq("channel", "web").maybeSingle(),
    "channel_sessions.web_presence",
  ) as { last_seen_at?: string | null } | null;
  if (!row?.last_seen_at) return false;
  return Date.now() - Date.parse(row.last_seen_at) <= webPresenceWindowMs();
}

async function loadOwnerPhone(db: SupabaseClient, accountId: string): Promise<string | null> {
  const data = orThrow(
    await db.from("verified_phones").select("phone_e164").eq("account_id", accountId).order("verified_at", { ascending: false }).limit(1).maybeSingle(),
    "verified_phones.lookup",
  );
  return (data as { phone_e164?: string } | null)?.phone_e164 ?? null;
}

export async function routeEmployeeIntent(
  db: SupabaseClient,
  intent: EmployeeIntent,
): Promise<{ duplicate: boolean; chosen_channel: "web" | "sms" | "none"; sms_sid?: string; delivery_status: "pending" | "delivered" | "duplicate" }> {
  const decisionId = newId(ID_PREFIX.deliveryDecision);
  const claim = await insertDedup(
    db.from("delivery_decisions").insert({
      id: decisionId,
      account_id: intent.account_id,
      employee_id: intent.employee_id,
      intent_key: intent.intent_key,
      move: intent.move,
      chosen_channel: "none",
      reason: "claimed",
      run_id: intent.run_id ?? null,
    }),
    "delivery_decisions.claim",
  );
  if (claim.conflict) return { duplicate: true, chosen_channel: "none", delivery_status: "duplicate" };

  const body = intent.descriptor ? renderWorkEventSms(intent.descriptor) : intent.text;
  if (intent.move === "silent") {
    await mustWrite(
      db.from("delivery_decisions").update({ chosen_channel: "none", reason: "silent" }).eq("id", decisionId),
      "delivery_decisions.silent",
    );
    return { duplicate: false, chosen_channel: "none", delivery_status: "pending" };
  }

  if (await isWebActive(db, intent.employee_id)) {
    await mustWrite(
      db.from("delivery_decisions").update({ chosen_channel: "web", reason: "active_web_session", proof: { message_id: intent.message_id ?? null } }).eq("id", decisionId),
      "delivery_decisions.web",
    );
    if (intent.message_id) {
      await db.from("employee_messages").update({ channel: "web", status: "delivered" }).eq("id", intent.message_id);
    }
    return { duplicate: false, chosen_channel: "web", delivery_status: "delivered" };
  }

  const ownerPhone = await loadOwnerPhone(db, intent.account_id);
  if (!ownerPhone) {
    await mustWrite(
      db.from("delivery_decisions").update({ chosen_channel: "sms", reason: "missing_owner_phone", fallback: { message_id: intent.message_id ?? null } }).eq("id", decisionId),
      "delivery_decisions.missing_owner_phone",
    );
    return { duplicate: false, chosen_channel: "sms", delivery_status: "pending" };
  }

  try {
    const from = await resolveEmployeeSmsSender(db, intent.employee_id);
    const sent = await sendSms({ to: ownerPhone, from, body, forceFrom: true });
    await mustWrite(
      db.from("delivery_decisions").update({ chosen_channel: "sms", reason: "ambient_sms", proof: { sms_sid: sent.sid, message_id: intent.message_id ?? null } }).eq("id", decisionId),
      "delivery_decisions.ambient_sms",
    );
    // Reflect how the message was actually delivered (it was seeded as `web`).
    if (intent.message_id) await db.from("employee_messages").update({ channel: "sms", status: "delivered", provider_id: sent.sid }).eq("id", intent.message_id);
    return { duplicate: false, chosen_channel: "sms", sms_sid: sent.sid, delivery_status: "delivered" };
  } catch (err) {
    await mustWrite(
      db.from("delivery_decisions").update({
        chosen_channel: "sms",
        reason: "sms_failed",
        fallback: { error: String((err as Error).message ?? err), message_id: intent.message_id ?? null },
      }).eq("id", decisionId),
      "delivery_decisions.sms_failed",
    );
    return { duplicate: false, chosen_channel: "sms", delivery_status: "pending" };
  }
}
