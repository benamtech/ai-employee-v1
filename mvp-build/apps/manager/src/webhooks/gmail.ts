/** Gmail OAuth and verified Pub/Sub ingress. */
import type { Hono } from "hono";
import { MANAGER_API } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { verifyOAuthState } from "../lib/oauth-state.js";
import { decodePubSubPush, verifyPubSubJwt } from "../lib/pubsub.js";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";
import { enqueueAmbientEvent, type AmbientInboxRow } from "../lib/ambient-inbox.js";

function resultPage(message: string, success: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>AMTECH</title></head>` +
    `<body style="font-family:system-ui;max-width:560px;margin:12vh auto;text-align:center">` +
    `<h1 style="color:${success ? "#1a7f37" : "#b42318"}">${success ? "Connected" : "Connection failed"}</h1>` +
    `<p>${message}</p></body></html>`;
}

export async function processGmailAmbientEvent(db: SupabaseClient, event: AmbientInboxRow): Promise<Record<string, unknown>> {
  const payload = event.payload ?? {};
  const emailAddress = String(payload.email_address ?? "");
  const historyId = String(payload.history_id ?? "");
  const pubsubMessageId = String(payload.pubsub_message_id ?? event.external_event_id);
  if (!emailAddress || !historyId || !pubsubMessageId) throw new Error("gmail_ambient_payload_invalid");
  const handler = TOOL_REGISTRY.get("handle_gmail_pubsub");
  if (!handler) throw new Error("gmail_handler_unavailable");
  const ctx: ToolContext = { db, actor: "manager", account_id: event.account_id ?? null, employee_id: event.employee_id ?? null };
  const envelope = await handler(ctx, { email_address: emailAddress, history_id: historyId, pubsub_message_id: pubsubMessageId });
  if (envelope.status === "failed") throw new Error("gmail_handler_failed");
  return { handler_status: envelope.status, pubsub_message_id: pubsubMessageId, proof: envelope.proof ?? {} };
}

export function registerGmailWebhooks(app: Hono): void {
  app.get(MANAGER_API.webhooks.gmailOauthCallback, async (c) => {
    const error = c.req.query("error");
    if (error) return c.html(resultPage("Gmail connection was cancelled.", false), 400);
    const state = c.req.query("state");
    const code = c.req.query("code");
    if (!state || !verifyOAuthState(state)) return c.text("invalid oauth state", 403);
    if (!code) return c.text("missing code", 400);

    const handler = TOOL_REGISTRY.get("complete_gmail_oauth");
    if (!handler) return c.text("unavailable", 500);
    const ctx: ToolContext = { db: serviceClient(), actor: "manager", account_id: null, employee_id: null };
    const envelope = await handler(ctx, { state, code });
    const success = envelope.status === "ok";
    const redirect = process.env.GMAIL_OAUTH_SUCCESS_REDIRECT;
    if (success && redirect) return c.redirect(redirect);
    return c.html(
      resultPage(success ? "Gmail is connected. Return to your employee to send the estimate." : "Gmail connection failed. Please try connecting again.", success),
      success ? 200 : 400,
    );
  });

  app.post(MANAGER_API.webhooks.gmail, async (c) => {
    const verification = await verifyPubSubJwt(c.req.header("Authorization"));
    if (!verification.ok) return c.text("forbidden", 403);
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.text("bad request", 400);
    }
    let push: ReturnType<typeof decodePubSubPush>;
    try {
      push = decodePubSubPush(body);
    } catch {
      return c.newResponse(null, 204);
    }
    if (!push.email_address || !push.history_id || !push.pubsub_message_id) return c.newResponse(null, 204);
    await enqueueAmbientEvent(serviceClient(), {
      source_type: "provider_webhook",
      provider: "gmail",
      external_event_id: push.pubsub_message_id,
      event_type: "gmail.history.available",
      subject_key: push.email_address,
      ordering_key: `gmail:${push.email_address}`,
      payload: {
        email_address: push.email_address,
        history_id: push.history_id,
        pubsub_message_id: push.pubsub_message_id,
      },
      headers_metadata: { authorization_verified: true },
      verification_metadata: { pubsub_jwt_verified: true },
    });
    return c.newResponse(null, 204);
  });
}
