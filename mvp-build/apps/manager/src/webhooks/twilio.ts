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
import {
  AmbientEffectAmbiguousError,
  claimAmbientEffect,
  completeAmbientEffect,
  enqueueAmbientEvent,
  failAmbientEffect,
  type AmbientInboxRow,
} from "../lib/ambient-inbox.js";

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

async function sendSmsWithReceipt(db: SupabaseClient, event: AmbientInboxRow, input: {
  effect_key: string;
  to: string;
  from: string;
  body: string;
  evidence?: Record<string, unknown>;
}): Promise<{ sid: string; status: string; idempotent_replay: boolean }> {
  const claimed = await claimAmbientEffect(db, {
    inbox_id: event.inbox_id,
    effect_key: input.effect_key,
    provider: "twilio",
    evidence: { to_suffix: input.to.slice(-4), from_suffix: input.from.slice(-4), body_chars: input.body.length, ...(input.evidence ?? {}) },
  });
  if (!claimed.claimed) {
    if (claimed.receipt.state === "applied" && claimed.receipt.provider_id) {
      return { sid: claimed.receipt.provider_id, status: "recorded", idempotent_replay: true };
    }
    throw new AmbientEffectAmbiguousError(`twilio_effect_${claimed.receipt.state}:${input.effect_key}`);
  }
  try {
    const sent = await sendSms({ to: input.to, from: input.from, body: input.body, forceFrom: true });
    await completeAmbientEffect(db, claimed.receipt.id, {
      provider_id: sent.sid,
      evidence: { status: sent.status, to_suffix: input.to.slice(-4), from_suffix: input.from.slice(-4), ...(input.evidence ?? {}) },
    });
    return { sid: sent.sid, status: sent.status, idempotent_replay: false };
  } catch (err) {
    await failAmbientEffect(db, claimed.receipt.id, err).catch(() => {});
    throw err;
  }
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
    const existingClaim = await db.from("claim_tokens").select("id").eq("onboarding_session_id", sessionId).eq("phone_e164", from).gt("expires_at", new Date().toISOString()).limit(1).maybeSingle();
    if (existingClaim.error) throw existingClaim.error;
    if (!existingClaim.data) {
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
    } else {
      reply += "\n\nYour account setup link is already active. Use the most recent link I sent.";
    }
  }
  const sent = await sendSmsWithReceipt(db, event, {
    effect_key: `twilio:frontdoor-reply:${event.inbox_id}`,
    to: from,
    from: to,
    body: reply,
    evidence: { session_id: sessionId, ready_for_phone_verification: Boolean(out.ready_for_phone_verification) },
  });
  return { session_id: sessionId, outbound_message_id: sent.sid, idempotent_replay: sent.idempotent_replay, ready_for_phone_verification: Boolean(out.ready_for_phone_verification) };
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

  const turn = await deliverOwnerTurnToRuntime(db, {
    account_id: employee.account_id,
    employee_id: employeeId,
    body: params.Body ?? "",
    channel: "sms",
    idempotency_key: `twilio:${inboundProviderId}`,
  });
  const response = turn.reply || (turn.status === "queued" ? "I got it. I'm working on that now." : "I hit a snag. I saved your message and will pick it back up.");
  const fromNumber = await resolveEmployeeSmsSender(db, employeeId);
  const sent = await sendSmsWithReceipt(db, event, {
    effect_key: `twilio:employee-reply:${event.inbox_id}`,
    to: ownerFrom,
    from: fromNumber,
    body: response,
    evidence: { employee_id: employeeId, inbound_message_id: inboundProviderId, runtime_turn_status: turn.status },
  });

  const outboundSource = `ambient:${event.inbox_id}`;
  const existingOutbound = await db.from("employee_messages").select("id").eq("employee_id", employeeId).eq("source", outboundSource).maybeSingle();
  if (existingOutbound.error) throw existingOutbound.error;
  if (!existingOutbound.data) {
    const stored = await db.from("employee_messages").insert({
      id: newId(ID_PREFIX.message),
      employee_id: employeeId,
      direction: "to_owner",
      source: outboundSource,
      channel: "sms",
      body: response,
      provider_id: sent.sid,
      status: sent.status,
    });
    if (stored.error) throw stored.error;
  }
  return { inbound_message_id: inboundProviderId, outbound_message_id: sent.sid, idempotent_replay: sent.idempotent_replay, runtime_turn_status: turn.status };
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
