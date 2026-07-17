/** Twilio signature verification and ambient-inbox ingress. */
import type { Hono } from "hono";
import { validateTwilioSignature } from "../lib/signature.js";
import { ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { mintSignedToken, tokenHash } from "../lib/signed-links.js";
import { sendSms } from "../lib/twilio.js";
import { deliverOwnerTurnToRuntime } from "../lib/runtime.js";
import { resolveEmployeeSmsSender } from "../lib/sms-sender.js";
import { stampChannelPresence } from "../lib/channel-router.js";
import { mustWrite } from "../lib/db.js";
import { enqueueAmbientEvent, type AmbientInboxRow } from "../lib/ambient-inbox.js";

function authToken(): string {
  const t = process.env.TWILIO_AUTH_TOKEN;
  if (!t) throw new Error("TWILIO_AUTH_TOKEN missing.");
  return t;
}

function signedUrl(routePath: string): string {
  const base = process.env.SMS_WEBHOOK_BASE_URL ?? "";
  const suffix = routePath.replace(MANAGER_API.webhooks.twilioFrontDoor.replace("/frontdoor", ""), "");
  return base + suffix;
}

async function formParams(c: any): Promise<Record<string, string>> {
  const body = await c.req.parseBody();
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) out[k] = String(v);
  return out;
}

function paramsFromEvent(event: AmbientInboxRow): Record<string, string> {
  const value = event.payload?.params;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("twilio_ambient_payload_invalid");
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, String(item ?? "")]));
}

async function processFrontDoor(db: SupabaseClient, event: AmbientInboxRow, params: Record<string, string>): Promise<Record<string, unknown>> {
  const from = params.From;
  const to = params.To || process.env.TWILIO_FRONTDOOR_NUMBER || "";
  if (!from || !to) throw new Error("twilio_frontdoor_binding_missing");
  const body = params.Body ?? "";
  const { data: existing } = await db.from("onboarding_sessions").select("*").eq("phone_e164", from).maybeSingle();
  const sessionId = existing?.id ?? newId(ID_PREFIX.onboardingSession);
  if (!existing) {
    await mustWrite(
      db.from("onboarding_sessions").insert({
        id: sessionId,
        phone_e164: from,
        surface: "sms",
        state: "anonymous_chat",
        transcript: [],
        manifest_draft: {
          employee_type: "contractor_estimator",
          profile_package_key: "contractor_estimator",
          timezone: "America/New_York",
          seed_skills: ["estimate", "invoice", "daily-checkin"],
        },
      }),
      "onboarding_sessions.insert",
    );
  }
  const origin = process.env.MANAGER_API_ORIGIN ?? `http://localhost:${process.env.MANAGER_PORT ?? 8080}`;
  const res = await fetch(`${origin}/manager/orchestrator/web`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MANAGER_INTERNAL_TOKEN ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId, phone_e164: from, surface: "sms", message: body }),
  });
  if (!res.ok) throw new Error(`twilio_frontdoor_orchestrator_${res.status}`);
  const out = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  let reply = String(out.assistant_message ?? "I can help set up your AI employee. Tell me what kind of business you run.");
  if (out.ready_for_phone_verification) {
    const token = mintSignedToken("claim_link", from, 30 * 60, { session_id: sessionId });
    await mustWrite(
      db.from("claim_tokens").insert({
        id: newId(ID_PREFIX.claimToken),
        token_hash: tokenHash(token),
        phone_e164: from,
        onboarding_session_id: sessionId,
        twilio_proof: { message_sid: params.MessageSid, ambient_inbox_id: event.inbox_id },
        expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      }),
      "claim_tokens.insert",
    );
    reply += `\n\nFinish account setup here: ${(process.env.PUBLIC_WEB_ORIGIN ?? "https://amtechai.com")}/claim?t=${encodeURIComponent(token)}`;
  }
  const alreadySent = await db.from("employee_messages").select("id,provider_id,status").eq("source", `ambient:${event.inbox_id}`).maybeSingle();
  if (alreadySent.error) throw alreadySent.error;
  if (alreadySent.data?.provider_id) return { session_id: sessionId, outbound_message_id: alreadySent.data.provider_id, idempotent_replay: true };
  const messageRowId = alreadySent.data?.id ? String(alreadySent.data.id) : newId(ID_PREFIX.message);
  if (!alreadySent.data) {
    const pending = await db.from("employee_messages").insert({ id: messageRowId, employee_id: null, direction: "to_owner", source: `ambient:${event.inbox_id}`, channel: "sms", body: reply, provider_id: null, status: "sending" });
    if (pending.error) throw pending.error;
  }
  const sent = await sendSms({ to: from, from: to, body: reply, forceFrom: true });
  const updated = await db.from("employee_messages").update({ provider_id: sent.sid, status: sent.status }).eq("id", messageRowId);
  if (updated.error) throw updated.error;
  return { session_id: sessionId, outbound_message_id: sent.sid, ready_for_phone_verification: Boolean(out.ready_for_phone_verification) };
}

async function processStatus(db: SupabaseClient, params: Record<string, string>): Promise<Record<string, unknown>> {
  const sid = params.MessageSid || params.SmsSid;
  const status = params.MessageStatus || params.SmsStatus;
  if (!sid || !status) throw new Error("twilio_status_payload_invalid");
  const updated = await db.from("employee_messages").update({ status }).eq("provider_id", sid);
  if (updated.error) throw updated.error;
  return { provider_id: sid, status };
}

async function processEmployeeInbound(db: SupabaseClient, event: AmbientInboxRow, params: Record<string, string>): Promise<Record<string, unknown>> {
  const employeeId = String(event.employee_id ?? event.payload?.employee_id ?? "");
  const ownerFrom = params.From;
  if (!employeeId || !ownerFrom) throw new Error("twilio_employee_payload_invalid");
  const { data: employee } = await db.from("employees").select("id,account_id,status").eq("id", employeeId).maybeSingle();
  if (!employee || employee.status !== "live") throw new Error("twilio_employee_not_live");
  const { data: phone } = await db.from("verified_phones").select("phone_e164").eq("account_id", employee.account_id).eq("phone_e164", ownerFrom).maybeSingle();
  if (!phone) throw new Error("twilio_sender_not_authorized");

  const inboundProviderId = params.MessageSid || event.external_event_id;
  const existingInbound = await db.from("employee_messages").select("id").eq("provider_id", inboundProviderId).eq("direction", "to_employee").maybeSingle();
  if (existingInbound.error) throw existingInbound.error;
  if (!existingInbound.data) {
    const inbound = await db.from("employee_messages").insert({
      id: newId(ID_PREFIX.message),
      employee_id: employeeId,
      direction: "to_employee",
      source: "twilio",
      channel: "sms",
      body: params.Body ?? "",
      provider_id: inboundProviderId,
      status: "received",
    });
    if (inbound.error) throw inbound.error;
    await stampChannelPresence(db, { account_id: employee.account_id, employee_id: employeeId, channel: "sms", session_info: { message_sid: inboundProviderId } });
  }

  const outboundSource = `ambient:${event.inbox_id}`;
  const existingOutbound = await db.from("employee_messages").select("id,provider_id,status,body").eq("employee_id", employeeId).eq("source", outboundSource).maybeSingle();
  if (existingOutbound.error) throw existingOutbound.error;
  if (existingOutbound.data?.provider_id) return { inbound_message_id: inboundProviderId, outbound_message_id: existingOutbound.data.provider_id, idempotent_replay: true };

  const turn = await deliverOwnerTurnToRuntime(db, {
    account_id: employee.account_id,
    employee_id: employeeId,
    body: params.Body ?? "",
    channel: "sms",
    idempotency_key: `twilio:${inboundProviderId}`,
  });
  const response = turn.reply || (turn.status === "queued" ? "I got it. I'm working on that now." : "I hit a snag. I saved your message and will pick it back up.");
  const rowId = existingOutbound.data?.id ? String(existingOutbound.data.id) : newId(ID_PREFIX.message);
  if (!existingOutbound.data) {
    const pending = await db.from("employee_messages").insert({
      id: rowId,
      employee_id: employeeId,
      direction: "to_owner",
      source: outboundSource,
      channel: "sms",
      body: response,
      provider_id: null,
      status: "sending",
    });
    if (pending.error) throw pending.error;
  }
  const fromNumber = await resolveEmployeeSmsSender(db, employeeId);
  const sent = await sendSms({ to: ownerFrom, from: fromNumber, body: response, forceFrom: true });
  const updated = await db.from("employee_messages").update({ body: response, provider_id: sent.sid, status: sent.status }).eq("id", rowId);
  if (updated.error) throw updated.error;
  return { inbound_message_id: inboundProviderId, outbound_message_id: sent.sid, runtime_turn_status: turn.status };
}

export async function processTwilioAmbientEvent(db: SupabaseClient, event: AmbientInboxRow): Promise<Record<string, unknown>> {
  const params = paramsFromEvent(event);
  if (event.event_type === "twilio.frontdoor.inbound") return processFrontDoor(db, event, params);
  if (event.event_type === "twilio.message.status") return processStatus(db, params);
  if (event.event_type === "twilio.employee.inbound") return processEmployeeInbound(db, event, params);
  throw new Error(`twilio_event_type_unsupported:${event.event_type}`);
}

export function registerTwilioWebhooks(app: Hono): void {
  const insecure = process.env.SMS_INSECURE_NO_SIGNATURE === "true";
  if (insecure && process.env.NODE_ENV === "production") throw new Error("SMS_INSECURE_NO_SIGNATURE cannot be true in production.");

  app.post(MANAGER_API.webhooks.twilioFrontDoor, async (c) => {
    const params = await formParams(c);
    const sig = c.req.header("X-Twilio-Signature");
    const valid = validateTwilioSignature(authToken(), signedUrl("/frontdoor"), params, sig, { insecureNoSignature: insecure });
    if (!valid) return c.text("invalid signature", 403);
    if (!params.From || !params.MessageSid) return c.text("missing From or MessageSid", 400);
    await enqueueAmbientEvent(serviceClient(), {
      source_type: "provider_webhook",
      provider: "twilio",
      external_event_id: params.MessageSid,
      event_type: "twilio.frontdoor.inbound",
      subject_key: params.From,
      ordering_key: `twilio:${params.From}`,
      payload: { params },
      headers_metadata: { twilio_signature_present: Boolean(sig) },
      verification_metadata: { twilio_signature_verified: true, insecure_dev_override: insecure },
    });
    return c.text("<Response></Response>", 200, { "Content-Type": "text/xml" });
  });

  app.post("/webhooks/twilio/status", async (c) => {
    const params = await formParams(c);
    const sig = c.req.header("X-Twilio-Signature");
    const valid = validateTwilioSignature(authToken(), signedUrl("/status"), params, sig, { insecureNoSignature: insecure });
    if (!valid) return c.text("invalid signature", 403);
    const sid = params.MessageSid || params.SmsSid;
    const status = params.MessageStatus || params.SmsStatus;
    if (!sid || !status) return c.text("missing status", 400);
    await enqueueAmbientEvent(serviceClient(), {
      source_type: "provider_webhook",
      provider: "twilio",
      external_event_id: `${sid}:${status}`,
      event_type: "twilio.message.status",
      subject_key: sid,
      ordering_key: `twilio-status:${sid}`,
      payload: { params },
      headers_metadata: { twilio_signature_present: Boolean(sig) },
      verification_metadata: { twilio_signature_verified: true, insecure_dev_override: insecure },
    });
    return c.text("<Response></Response>", 200, { "Content-Type": "text/xml" });
  });

  app.post("/webhooks/twilio/:employeeId", async (c) => {
    const employeeId = c.req.param("employeeId");
    const params = await formParams(c);
    const sig = c.req.header("X-Twilio-Signature");
    const valid = validateTwilioSignature(authToken(), signedUrl(`/${employeeId}`), params, sig, { insecureNoSignature: insecure });
    if (!valid) return c.text("invalid signature", 403);
    if (!params.From || !params.MessageSid) return c.text("missing From or MessageSid", 400);
    const db = serviceClient();
    const employee = await db.from("employees").select("account_id").eq("id", employeeId).maybeSingle();
    if (employee.error) throw employee.error;
    await enqueueAmbientEvent(db, {
      source_type: "provider_webhook",
      provider: "twilio",
      external_event_id: params.MessageSid,
      account_id: employee.data?.account_id ?? null,
      employee_id: employeeId,
      event_type: "twilio.employee.inbound",
      subject_key: params.From,
      ordering_key: `twilio:${employeeId}:${params.From}`,
      payload: { params, employee_id: employeeId },
      headers_metadata: { twilio_signature_present: Boolean(sig) },
      verification_metadata: { twilio_signature_verified: true, insecure_dev_override: insecure },
    });
    return c.text("<Response></Response>", 200, { "Content-Type": "text/xml" });
  });
}
