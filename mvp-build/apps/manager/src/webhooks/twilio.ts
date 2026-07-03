/**
 * Twilio webhook routes — front door + per-employee inbound SMS.
 * The X-Twilio-Signature check is MANDATORY (the security boundary). Phase 0
 * now drives the SMS front-door orchestrator and employee inbound handler.
 */
import type { Hono } from "hono";
import { validateTwilioSignature } from "../lib/signature.js";
import { ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { mintSignedToken, tokenHash } from "../lib/signed-links.js";
import { sendSms } from "../lib/twilio.js";
import { deliverToRuntime } from "../lib/runtime.js";

function authToken(): string {
  const t = process.env.TWILIO_AUTH_TOKEN;
  if (!t) throw new Error("TWILIO_AUTH_TOKEN missing.");
  return t;
}

/** The exact public URL Twilio signed (tunnel/base URL), per route. */
function signedUrl(routePath: string): string {
  const base = process.env.SMS_WEBHOOK_BASE_URL ?? "";
  // SMS_WEBHOOK_BASE_URL is `…/webhooks/twilio`; append the sub-path beyond it.
  const suffix = routePath.replace(MANAGER_API.webhooks.twilioFrontDoor.replace("/frontdoor", ""), "");
  return base + suffix;
}

async function formParams(c: any): Promise<Record<string, string>> {
  const body = await c.req.parseBody();
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) out[k] = String(v);
  return out;
}

export function registerTwilioWebhooks(app: Hono): void {
  const insecure = process.env.SMS_INSECURE_NO_SIGNATURE === "true";

  app.post(MANAGER_API.webhooks.twilioFrontDoor, async (c) => {
    const params = await formParams(c);
    const sig = c.req.header("X-Twilio-Signature");
    const ok = validateTwilioSignature(
      authToken(),
      signedUrl("/frontdoor"),
      params,
      sig,
      { insecureNoSignature: insecure },
    );
    if (!ok) return c.text("invalid signature", 403);
    const from = params.From;
    if (!from) return c.text("missing From", 400);
    const body = params.Body ?? "";
    const db = serviceClient();
    const { data: existing } = await db
      .from("onboarding_sessions")
      .select("*")
      .eq("phone_e164", from)
      .maybeSingle();
    const sessionId = existing?.id ?? newId(ID_PREFIX.onboardingSession);
    if (!existing) {
      await db.from("onboarding_sessions").insert({
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
      });
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
    const out = (await res.json().catch(() => ({}))) as any;
    let reply = out.assistant_message ?? "I can help set up your AI employee. Tell me what kind of business you run.";
    if (out.ready_for_phone_verification) {
      const token = mintSignedToken("claim_link", from, 30 * 60, { session_id: sessionId });
      await db.from("claim_tokens").insert({
        id: newId(ID_PREFIX.claimToken),
        token_hash: tokenHash(token),
        phone_e164: from,
        onboarding_session_id: sessionId,
        twilio_proof: { message_sid: params.MessageSid },
        expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      });
      reply += `\n\nFinish account setup here: ${(process.env.PUBLIC_WEB_ORIGIN ?? "https://amtechai.com")}/claim?t=${encodeURIComponent(token)}`;
    }
    return c.text(`<Response><Message>${escapeXml(reply)}</Message></Response>`, 200, {
      "Content-Type": "text/xml",
    });
  });

  app.post("/webhooks/twilio/:employeeId", async (c) => {
    const employeeId = c.req.param("employeeId");
    const params = await formParams(c);
    const sig = c.req.header("X-Twilio-Signature");
    const ok = validateTwilioSignature(
      authToken(),
      signedUrl(`/${employeeId}`),
      params,
      sig,
      { insecureNoSignature: insecure },
    );
    if (!ok) return c.text("invalid signature", 403);
    const ownerFrom = params.From;
    if (!ownerFrom) return c.text("missing From", 400);
    const db = serviceClient();
    const { data: employee } = await db
      .from("employees")
      .select("id,account_id,status")
      .eq("id", employeeId)
      .maybeSingle();
    if (!employee || employee.status !== "live") return c.text("employee not live", 404);
    const { data: phone } = await db
      .from("verified_phones")
      .select("phone_e164")
      .eq("account_id", employee.account_id)
      .eq("phone_e164", ownerFrom)
      .maybeSingle();
    if (!phone) return c.text("unauthorized sender", 403);
    await db.from("employee_messages").insert({
      id: newId(ID_PREFIX.message),
      employee_id: employeeId,
      direction: "to_employee",
      source: "twilio",
      channel: "sms",
      body: params.Body ?? "",
      provider_id: params.MessageSid ?? null,
      status: "received",
    });
    const { data: runtime } = await db
      .from("runtime_endpoints")
      .select("*")
      .eq("employee_id", employeeId)
      .maybeSingle();
    const response = await deliverToRuntime(String(runtime?.webchat_api_url ?? ""), params.Body ?? "", "sms");
    const fromNumber = runtime?.sms_number_e164 ?? process.env.TWILIO_TEST_NUMBER;
    if (!fromNumber) return c.text("employee sender missing", 500);
    const sent = await sendSms({
      to: ownerFrom,
      from: fromNumber,
      body: response,
    });
    await db.from("employee_messages").insert({
      id: newId(ID_PREFIX.message),
      employee_id: employeeId,
      direction: "to_owner",
      source: "employee",
      channel: "sms",
      body: response,
      provider_id: sent.sid,
      status: sent.status,
    });
    return c.text("<Response></Response>", 200, { "Content-Type": "text/xml" });
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
