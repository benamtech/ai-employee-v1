/**
 * QuickBooks Online webhook routes (Phase A). The OAuth callback validates
 * CSRF state then completes the token exchange via the Manager tool (capturing
 * the QBO-specific realmId from the query string). The event webhook verifies
 * Intuit's HMAC signature over the RAW body, parses the notification, fans out
 * per-realmId (one notification can carry events for multiple companies), and
 * runs each through the shared event mesh.
 *
 * [VERIFY AT IMPLEMENTATION] Intuit is migrating webhook payloads to a
 * CloudEvents envelope with a mandatory cutover of 2026-07-31 (per
 * quickbooks-api-gotchas.md, may have shifted by build time). parseQboEvents
 * below reads the CloudEvents shape first and falls back to the legacy
 * `eventNotifications` shape so the connector works across the migration
 * window; re-confirm the exact CloudEvents field placement against Intuit's
 * current migration guide before relying on it in production.
 */
import type { Hono } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { verifyOAuthState } from "../lib/oauth-state.js";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";
import { ingestEvent } from "../events/ingress.js";
import { insertDedup } from "../lib/db.js";

function resultPage(message: string, success: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>AMTECH</title></head>` +
    `<body style="font-family:system-ui;max-width:560px;margin:12vh auto;text-align:center">` +
    `<h1 style="color:${success ? "#1a7f37" : "#b42318"}">${success ? "Connected" : "Connection failed"}</h1>` +
    `<p>${message}</p></body></html>`;
}

/** One fanned-out change notification: realm + entity + operation, no data. */
export interface QboChangeEvent {
  realm_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  cloudevent_id: string | null;
}

/**
 * Parse the webhook body into a flat list of per-realm change events. Reads the
 * CloudEvents envelope first (post-2026-07-31 mandatory shape), then falls back
 * to the legacy `eventNotifications` shape. [VERIFY AT IMPLEMENTATION] against
 * Intuit's current CloudEvents field placement.
 */
export function parseQboEvents(body: unknown): QboChangeEvent[] {
  const out: QboChangeEvent[] = [];
  const root = body as Record<string, unknown> | null;
  if (!root || typeof root !== "object") return out;

  // CloudEvents batch: an array of CloudEvents, each with a `data` carrying the
  // realm + changed entities. Intuit's exact placement is being finalized —
  // read defensively from the likely locations.
  const ceList = Array.isArray(root.events) ? root.events
    : Array.isArray((root as { data?: unknown }).data) ? (root as { data: unknown[] }).data
    : Array.isArray(root) ? (root as unknown[]) : null;
  if (ceList) {
    for (const ce of ceList) {
      const evt = ce as Record<string, unknown>;
      const ceId = typeof evt.id === "string" ? evt.id : null;
      const data = (evt.data ?? evt) as Record<string, unknown>;
      const realmId = String(data.realmId ?? data.realm_id ?? (evt.subject as string | undefined) ?? "");
      const entities = (data.entities as unknown[] | undefined) ?? [];
      for (const ent of entities) {
        const e = ent as Record<string, unknown>;
        if (realmId && e.name && e.id && e.operation) {
          out.push({ realm_id: realmId, entity_type: String(e.name), entity_id: String(e.id), operation: String(e.operation), cloudevent_id: ceId });
        }
      }
    }
    if (out.length) return out;
  }

  // Legacy `eventNotifications` shape.
  const notifications = (root.eventNotifications as unknown[] | undefined) ?? [];
  for (const n of notifications) {
    const notif = n as Record<string, unknown>;
    const realmId = String(notif.realmId ?? "");
    const dce = notif.dataChangeEvent as { entities?: unknown[] } | undefined;
    for (const ent of dce?.entities ?? []) {
      const e = ent as Record<string, unknown>;
      if (realmId && e.name && e.id && e.operation) {
        out.push({ realm_id: realmId, entity_type: String(e.name), entity_id: String(e.id), operation: String(e.operation), cloudevent_id: null });
      }
    }
  }
  return out;
}

/** Verify Intuit's webhook HMAC signature (base64 HMAC-SHA256 of the RAW body
 *  with the app's webhook verifier token), constant-time. */
export function verifyQboWebhookSignature(rawBody: string, header: string | undefined | null, verifierToken: string): boolean {
  if (!header || !verifierToken) return false;
  const expected = createHmac("sha256", verifierToken).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Dedupe + deliver one signature-verified change event to EVERY connector on
 * that realm. `realm_id` is NOT unique across connector_accounts (only
 * `unique(employee_id, connector_key)` is) — two AMTECH accounts (e.g. a
 * contractor and their bookkeeper) can each connect the same QuickBooks
 * company. A `.maybeSingle()` here would error/return null on >1 match and
 * silently drop the event for both, so we match ALL of them and deliver to
 * each (dedupe is per-connector). Pure w.r.t. the injected db so it is
 * unit-testable.
 */
export async function recordAndDeliverQboEvent(db: SupabaseClient, event: QboChangeEvent): Promise<{ delivered: boolean; duplicate: boolean; matched: boolean }> {
  const { data: connRaw } = await db
    .from("connector_accounts").select("id,account_id,employee_id")
    .eq("realm_id", event.realm_id).eq("connector_key", "accounting").eq("provider", "quickbooks");
  const connectors = (connRaw ?? []) as Array<{ id: string; account_id: string; employee_id: string }>;
  if (connectors.length === 0) return { delivered: false, duplicate: false, matched: false };

  let deliveredCount = 0;
  let duplicateCount = 0;
  for (const connector of connectors) {
    const rowId = newId(ID_PREFIX.inboundQboEvent);
    const ins = await insertDedup(
      db.from("inbound_qbo_events").insert({
        id: rowId, connector_id: connector.id, realm_id: event.realm_id, entity_type: event.entity_type,
        entity_id: event.entity_id, operation: event.operation, cloudevent_id: event.cloudevent_id, delivery_status: "pending",
      }),
      "inbound_qbo_events.insert",
    );
    if (ins.conflict) { duplicateCount += 1; continue; }

    const res = await ingestEvent(db, {
      source: "quickbooks",
      payload: {
        account_id: connector.account_id,
        employee_id: connector.employee_id,
        connector_id: connector.id,
        realm_id: event.realm_id,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        operation: event.operation,
        cloudevent_id: event.cloudevent_id,
      },
    });
    await db.from("inbound_qbo_events").update({ delivery_status: res.duplicate ? "duplicate" : "delivered" }).eq("id", rowId);
    if (res.duplicate) duplicateCount += 1; else deliveredCount += 1;
  }
  return { delivered: deliveredCount > 0, duplicate: deliveredCount === 0 && duplicateCount > 0, matched: true };
}

export function registerQuickbooksWebhooks(app: Hono): void {
  // OAuth callback: validate CSRF state, then exchange the code + realmId via the tool.
  app.get(MANAGER_API.webhooks.quickbooksOauthCallback, async (c) => {
    const error = c.req.query("error");
    if (error) return c.html(resultPage("QuickBooks connection was cancelled.", false), 400);
    const state = c.req.query("state");
    const code = c.req.query("code");
    const realmId = c.req.query("realmId");
    if (!state || !verifyOAuthState(state)) return c.text("invalid oauth state", 403);
    if (!code || !realmId) return c.text("missing code or realmId", 400);

    const handler = TOOL_REGISTRY.get("complete_quickbooks_oauth");
    if (!handler) return c.text("unavailable", 500);
    const ctx: ToolContext = { db: serviceClient(), actor: "manager", account_id: null, employee_id: null };
    const envelope = await handler(ctx, { state, code, realmId });
    const success = envelope.status === "ok";
    const redirect = process.env.QBO_OAUTH_SUCCESS_REDIRECT;
    if (success && redirect) return c.redirect(redirect);
    return c.html(
      resultPage(success ? "QuickBooks is connected. Return to your employee." : "QuickBooks connection failed. Please try connecting again.", success),
      success ? 200 : 400,
    );
  });

  // Change webhook: verify HMAC over the raw body, parse, fan out, deliver.
  // ALWAYS ack 2xx (delivery is idempotent) so Intuit does not retry-storm.
  app.post(MANAGER_API.webhooks.quickbooks, async (c) => {
    const verifierToken = process.env.QBO_WEBHOOK_VERIFIER_TOKEN;
    if (!verifierToken) return c.text("quickbooks_webhook_unconfigured", 503);
    const raw = await c.req.text();
    if (!verifyQboWebhookSignature(raw, c.req.header("intuit-signature"), verifierToken)) {
      return c.text("invalid signature", 401);
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return c.newResponse(null, 204); // undecodable — ack to avoid retry storm
    }
    const events = parseQboEvents(body);
    const db = serviceClient();
    for (const event of events) {
      try {
        await recordAndDeliverQboEvent(db, event);
      } catch {
        // Ack regardless (Intuit would retry-storm), but leave a failure record.
        try {
          await db.from("audit_log").insert({
            id: newId(ID_PREFIX.audit), account_id: null, employee_id: null, actor: "manager",
            action: "quickbooks_webhook:handler_failed", resource: event.realm_id, result: "failed",
            details: { entity_type: event.entity_type, operation: event.operation },
          });
        } catch {
          // best-effort observability only.
        }
      }
    }
    return c.json({ received: true, events: events.length });
  });
}
