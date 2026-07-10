/**
 * Gmail webhook routes (Phase 3). The OAuth callback validates CSRF state then
 * completes the token exchange via the Manager tool; the Pub/Sub push validates
 * authenticity, decodes the notification, and runs the reply pipeline. Both are
 * thin transport adapters — all logic lives in the tools (08/09-*.md).
 */
import type { Hono } from "hono";
import { ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { verifyOAuthState } from "../lib/oauth-state.js";
import { decodePubSubPush, verifyPubSubJwt } from "../lib/pubsub.js";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";

function resultPage(message: string, success: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>AMTECH</title></head>` +
    `<body style="font-family:system-ui;max-width:560px;margin:12vh auto;text-align:center">` +
    `<h1 style="color:${success ? "#1a7f37" : "#b42318"}">${success ? "Connected" : "Connection failed"}</h1>` +
    `<p>${message}</p></body></html>`;
}

export function registerGmailWebhooks(app: Hono): void {
  // OAuth callback: validate CSRF state, then exchange the code via the tool.
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

  // Pub/Sub push: verify authenticity, decode, run the reply pipeline. ALWAYS ack
  // 2xx (processing is idempotent) so Pub/Sub does not redeliver in a storm.
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
      return c.newResponse(null, 204); // undecodable envelope — ack to avoid retry storms
    }
    const handler = TOOL_REGISTRY.get("handle_gmail_pubsub");
    if (handler) {
      const ctx: ToolContext = { db: serviceClient(), actor: "manager", account_id: null, employee_id: null };
      try {
        await handler(ctx, { email_address: push.email_address, history_id: push.history_id, pubsub_message_id: push.pubsub_message_id });
      } catch {
        // Ack regardless (Pub/Sub would otherwise retry-storm), but leave a failure
        // record so a persistently-failing reply pipeline isn't invisible — inbound
        // customer replies could be silently lost with no dead-letter otherwise.
        try {
          await ctx.db.from("audit_log").insert({
            id: newId(ID_PREFIX.audit),
            account_id: null,
            employee_id: null,
            actor: "manager",
            action: "gmail_pubsub:handler_failed",
            resource: push.email_address,
            result: "failed",
            details: { history_id: push.history_id, pubsub_message_id: push.pubsub_message_id },
          });
        } catch {
          // best-effort observability only.
        }
      }
    }
    return c.newResponse(null, 204);
  });
}
