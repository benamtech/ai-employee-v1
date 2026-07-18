/** Gmail OAuth and verified Pub/Sub ingress. */
import type { Hono } from "hono";
import { MANAGER_API } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { verifyOAuthState } from "../lib/oauth-state.js";
import { decodePubSubPush, verifyPubSubJwt } from "../lib/pubsub.js";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";
import type { AmbientInboxRow } from "../lib/ambient-inbox.js";
import {
  enqueueVerifiedConnectorEvent,
  upsertAssignmentConnectorBinding,
} from "../lib/connector-custody.js";
import { executeDurableCommandEffect } from "../lib/durable-command-runtime.js";

function resultPage(message: string, success: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>AMTECH</title></head>` +
    `<body style="font-family:system-ui;max-width:560px;margin:12vh auto;text-align:center">` +
    `<h1 style="color:${success ? "#1a7f37" : "#b42318"}">${success ? "Connected" : "Connection failed"}</h1>` +
    `<p>${message}</p></body></html>`;
}

interface ScopedAmbientInboxRow extends AmbientInboxRow {
  assignment_id?: string | null;
  connector_binding_id?: string | null;
  command_intent_id?: string | null;
  command_id?: string | null;
}

export async function processGmailAmbientEvent(db: SupabaseClient, event: AmbientInboxRow): Promise<Record<string, unknown>> {
  const scoped = event as ScopedAmbientInboxRow;
  if (!scoped.assignment_id || !scoped.connector_binding_id || !scoped.command_id) {
    throw new Error("gmail_ambient_assignment_custody_missing");
  }
  const payload = event.payload ?? {};
  const emailAddress = String(payload.email_address ?? "");
  const historyId = String(payload.history_id ?? "");
  const pubsubMessageId = String(payload.pubsub_message_id ?? event.external_event_id);
  if (!emailAddress || !historyId || !pubsubMessageId) throw new Error("gmail_ambient_payload_invalid");

  const execution = await executeDurableCommandEffect<Record<string, unknown>>(db, {
    assignment_id: scoped.assignment_id,
    command_id: scoped.command_id,
    effect_key: `gmail:process:${event.inbox_id}`,
    provider: "manager",
    operation: "gmail.history.process",
    capability_class: "consumer_dedupe",
    request: {
      inbox_id: event.inbox_id,
      connector_binding_id: scoped.connector_binding_id,
      email_address: emailAddress,
      history_id: historyId,
      pubsub_message_id: pubsubMessageId,
    },
    apply: async () => {
      const handler = TOOL_REGISTRY.get("handle_gmail_pubsub");
      if (!handler) throw new Error("gmail_handler_unavailable");
      const ctx: ToolContext = {
        db,
        actor: "manager",
        account_id: event.account_id ?? null,
        employee_id: event.employee_id ?? null,
        assignment_id: scoped.assignment_id,
      };
      const envelope = await handler(ctx, {
        email_address: emailAddress,
        history_id: historyId,
        pubsub_message_id: pubsubMessageId,
      });
      if (envelope.status === "failed") throw new Error("gmail_handler_failed");
      const result = {
        handler_status: envelope.status,
        pubsub_message_id: pubsubMessageId,
        assignment_id: scoped.assignment_id,
        connector_binding_id: scoped.connector_binding_id,
        command_id: scoped.command_id,
        proof: envelope.proof ?? {},
      };
      return {
        result,
        provider_receipt_id: `ambient:${event.inbox_id}`,
        evidence: { inbox_id: event.inbox_id, pubsub_message_id: pubsubMessageId },
      };
    },
  });
  return { ...execution.result, c3_replayed: execution.replayed, effect_receipt_id: execution.receipt_id };
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
    const db = serviceClient();
    const ctx: ToolContext = { db, actor: "manager", account_id: null, employee_id: null };
    const envelope = await handler(ctx, { state, code });
    const success = envelope.status === "ok";
    if (success) {
      const proof = (envelope.proof ?? {}) as Record<string, unknown>;
      const connectorId = String(proof.connector_id ?? "");
      const email = String(proof.email ?? "");
      const accountId = String(envelope.account_id ?? "");
      const employeeId = String(envelope.employee_id ?? "");
      if (!connectorId || !email || !accountId || !employeeId) {
        return c.html(resultPage("Gmail connected but assignment binding could not be established.", false), 500);
      }
      await upsertAssignmentConnectorBinding(db, {
        provider: "gmail",
        external_subject: email,
        account_id: accountId,
        employee_id: employeeId,
        resource_class: "connector:gmail",
        resource_id: email,
        connector_account_id: connectorId,
        capability_class: "consumer_dedupe",
        provider_verification_ref: `gmail-oauth:${connectorId}:${email}`,
        provenance: { oauth_state_verified: true, profile_email_verified: true },
      });
    }
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
    const result = await enqueueVerifiedConnectorEvent(serviceClient(), {
      provider: "gmail",
      external_event_id: push.pubsub_message_id,
      external_subject: push.email_address,
      event_type: "gmail.history.available",
      resource_class: "connector:gmail",
      resource_id: push.email_address,
      capability_class: "consumer_dedupe",
      ordering_key: `gmail:${push.email_address}`,
      verification_ref: `gmail-pubsub:${push.pubsub_message_id}`,
      payload: {
        email_address: push.email_address,
        history_id: push.history_id,
        pubsub_message_id: push.pubsub_message_id,
      },
      verification_metadata: {
        pubsub_jwt_verified: true,
        verification_skipped: Boolean(verification.skipped),
      },
    });
    if (result.status === "denied" || result.status === "revoked") {
      return c.json({ received: true, queued: true, authorized: false, reason: result.reason }, 202);
    }
    return c.newResponse(null, 204);
  });
}
