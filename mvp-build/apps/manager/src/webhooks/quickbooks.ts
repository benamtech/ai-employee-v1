/** QuickBooks OAuth plus verified ambient-inbox ingress. */
import type { Hono } from "hono";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ID_PREFIX, MANAGER_API, newId } from "@amtech/shared";
import { serviceClient, type SupabaseClient } from "@amtech/db";
import { safeOAuthReturnPath, verifyOAuthState } from "../lib/oauth-state.js";
import { TOOL_REGISTRY } from "../tools/registry.js";
import type { ToolContext } from "../tools/types.js";
import { ingestEvent } from "../events/ingress.js";
import { insertDedup } from "../lib/db.js";
import { AmbientWaitingForBindingError, type AmbientInboxRow } from "../lib/ambient-inbox.js";
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

function ownerWebOrigin(): string | null {
  const raw = process.env.AGENT_WEB_ORIGIN ?? process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_APP_ORIGIN ?? "";
  try {
    const url = new URL(raw);
    return /^https?:$/.test(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

function ownerReturnUrl(returnTo: string | undefined, state: "connected" | "error"): string | null {
  const origin = ownerWebOrigin();
  const path = safeOAuthReturnPath(returnTo);
  if (!origin || !path) return null;
  const url = new URL(path, origin);
  url.searchParams.set("connector", "quickbooks");
  url.searchParams.set("state", state);
  return url.toString();
}

export interface QboChangeEvent {
  realm_id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  cloudevent_id: string | null;
}

interface ScopedAmbientInboxRow extends AmbientInboxRow {
  assignment_id?: string | null;
  connector_binding_id?: string | null;
  command_id?: string | null;
}

export function parseQboEvents(body: unknown): QboChangeEvent[] {
  const out: QboChangeEvent[] = [];
  const root = body as Record<string, unknown> | null;
  if (!root || typeof root !== "object") return out;

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

export function verifyQboWebhookSignature(rawBody: string, header: string | undefined | null, verifierToken: string): boolean {
  if (!header || !verifierToken) return false;
  const expected = createHmac("sha256", verifierToken).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function recordAndDeliverQboEvent(
  db: SupabaseClient,
  event: QboChangeEvent,
  scope?: { connector_id: string; assignment_id: string; account_id: string; employee_id: string },
): Promise<{ delivered: boolean; duplicate: boolean; matched: boolean }> {
  if (!scope) return { delivered: false, duplicate: false, matched: false };
  const connector = await db
    .from("connector_accounts")
    .select("id,account_id,employee_id,assignment_id,realm_id,connector_key,provider")
    .eq("id", scope.connector_id)
    .eq("realm_id", event.realm_id)
    .eq("connector_key", "accounting")
    .eq("provider", "quickbooks")
    .maybeSingle();
  if (connector.error) throw connector.error;
  if (!connector.data || connector.data.account_id !== scope.account_id || connector.data.employee_id !== scope.employee_id) {
    return { delivered: false, duplicate: false, matched: false };
  }
  if (connector.data.assignment_id && connector.data.assignment_id !== scope.assignment_id) {
    return { delivered: false, duplicate: false, matched: false };
  }

  const rowId = newId(ID_PREFIX.inboundQboEvent);
  const ins = await insertDedup(
    db.from("inbound_qbo_events").insert({
      id: rowId,
      connector_id: scope.connector_id,
      assignment_id: scope.assignment_id,
      realm_id: event.realm_id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      operation: event.operation,
      cloudevent_id: event.cloudevent_id,
      delivery_status: "pending",
    }),
    "inbound_qbo_events.insert",
  );
  if (ins.conflict) return { delivered: false, duplicate: true, matched: true };

  const res = await ingestEvent(db, {
    source: "quickbooks",
    payload: {
      assignment_id: scope.assignment_id,
      account_id: scope.account_id,
      employee_id: scope.employee_id,
      connector_id: scope.connector_id,
      realm_id: event.realm_id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      operation: event.operation,
      cloudevent_id: event.cloudevent_id,
    },
  });
  await db.from("inbound_qbo_events").update({ delivery_status: res.duplicate ? "duplicate" : "delivered" }).eq("id", rowId);
  return { delivered: !res.duplicate, duplicate: res.duplicate, matched: true };
}

export async function processQuickbooksAmbientEvent(db: SupabaseClient, inbox: AmbientInboxRow): Promise<Record<string, unknown>> {
  const scoped = inbox as ScopedAmbientInboxRow;
  const change = inbox.payload?.change as QboChangeEvent | undefined;
  if (!change?.realm_id || !change.entity_type || !change.entity_id || !change.operation) throw new Error("quickbooks_ambient_payload_invalid");
  if (!scoped.assignment_id || !scoped.connector_binding_id || !scoped.command_id || !inbox.account_id || !inbox.employee_id) {
    throw new AmbientWaitingForBindingError("quickbooks_assignment_custody_missing");
  }
  const binding = await db
    .from("connector_bindings")
    .select("connector_account_id")
    .eq("id", scoped.connector_binding_id)
    .eq("assignment_id", scoped.assignment_id)
    .maybeSingle();
  if (binding.error) throw binding.error;
  const connectorId = String(binding.data?.connector_account_id ?? "");
  if (!connectorId) throw new AmbientWaitingForBindingError("quickbooks_connector_account_missing");

  const execution = await executeDurableCommandEffect<Record<string, unknown>>(db, {
    assignment_id: scoped.assignment_id,
    command_id: scoped.command_id,
    effect_key: `quickbooks:process:${inbox.inbox_id}`,
    provider: "manager",
    operation: "quickbooks.entity.process",
    capability_class: "consumer_dedupe",
    request: {
      inbox_id: inbox.inbox_id,
      connector_binding_id: scoped.connector_binding_id,
      connector_id: connectorId,
      change,
    },
    apply: async () => {
      const result = await recordAndDeliverQboEvent(db, change, {
        connector_id: connectorId,
        assignment_id: scoped.assignment_id!,
        account_id: inbox.account_id!,
        employee_id: inbox.employee_id!,
      });
      if (!result.matched) throw new AmbientWaitingForBindingError("quickbooks_realm_waiting_for_binding");
      const response = {
        ...result,
        assignment_id: scoped.assignment_id,
        connector_binding_id: scoped.connector_binding_id,
        command_id: scoped.command_id,
        realm_id: change.realm_id,
        entity_type: change.entity_type,
        entity_id: change.entity_id,
      };
      return {
        result: response,
        provider_receipt_id: `ambient:${inbox.inbox_id}`,
        evidence: { inbox_id: inbox.inbox_id, connector_id: connectorId },
      };
    },
  });
  return { ...execution.result, c3_replayed: execution.replayed, effect_receipt_id: execution.receipt_id };
}

export function registerQuickbooksWebhooks(app: Hono): void {
  app.get(MANAGER_API.webhooks.quickbooksOauthCallback, async (c) => {
    const rawState = c.req.query("state") ?? "";
    const state = rawState ? verifyOAuthState(rawState) : null;
    if (!state || state.provider !== "quickbooks") return c.text("invalid oauth state", 403);
    const error = c.req.query("error");
    if (error) {
      const returnUrl = ownerReturnUrl(state.return_to, "error");
      if (returnUrl) return c.redirect(returnUrl);
      return c.html(resultPage("QuickBooks connection was cancelled.", false), 400);
    }
    const code = c.req.query("code");
    const realmId = c.req.query("realmId");
    if (!code || !realmId) return c.text("missing code or realmId", 400);

    const handler = TOOL_REGISTRY.get("complete_quickbooks_oauth");
    if (!handler) return c.text("unavailable", 500);
    const db = serviceClient();
    const ctx: ToolContext = { db, actor: "manager", account_id: null, employee_id: null };
    const envelope = await handler(ctx, { state: rawState, code, realmId });
    const success = envelope.status === "ok";
    if (success) {
      const proof = (envelope.proof ?? {}) as Record<string, unknown>;
      const connectorId = String(proof.connector_id ?? "");
      const boundRealm = String(proof.realm_id ?? realmId);
      const accountId = String(envelope.account_id ?? "");
      const employeeId = String(envelope.employee_id ?? "");
      if (!connectorId || !boundRealm || !accountId || !employeeId) {
        return c.html(resultPage("QuickBooks connected but assignment binding could not be established.", false), 500);
      }
      await upsertAssignmentConnectorBinding(db, {
        provider: "quickbooks",
        external_subject: boundRealm,
        account_id: accountId,
        employee_id: employeeId,
        resource_class: "connector:quickbooks",
        resource_id: boundRealm,
        connector_account_id: connectorId,
        capability_class: "consumer_dedupe",
        provider_verification_ref: `quickbooks-oauth:${connectorId}:${boundRealm}`,
        provenance: { oauth_state_verified: true, realm_id_verified: true },
      });
    }
    const returnUrl = ownerReturnUrl(state.return_to, success ? "connected" : "error");
    if (returnUrl) return c.redirect(returnUrl);
    const redirect = process.env.QBO_OAUTH_SUCCESS_REDIRECT;
    if (success && redirect) return c.redirect(redirect);
    return c.html(
      resultPage(success ? "QuickBooks is connected. Return to your employee." : "QuickBooks connection failed. Please try connecting again.", success),
      success ? 200 : 400,
    );
  });

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
      return c.newResponse(null, 204);
    }
    const events = parseQboEvents(body);
    const db = serviceClient();
    let duplicates = 0;
    let waiting = 0;
    let denied = 0;
    for (const event of events) {
      const fallback = createHash("sha256").update(`${raw}:${event.realm_id}:${event.entity_type}:${event.entity_id}:${event.operation}`).digest("hex").slice(0, 32);
      const externalId = event.cloudevent_id
        ? `${event.cloudevent_id}:${event.realm_id}:${event.entity_type}:${event.entity_id}:${event.operation}`
        : fallback;
      const queued = await enqueueVerifiedConnectorEvent(db, {
        provider: "quickbooks",
        external_event_id: externalId,
        external_subject: event.realm_id,
        event_type: "quickbooks.entity.changed",
        resource_class: "connector:quickbooks",
        resource_id: event.realm_id,
        capability_class: "consumer_dedupe",
        ordering_key: `quickbooks:${event.realm_id}:${event.entity_type}:${event.entity_id}`,
        verification_ref: `quickbooks-hmac:${externalId}`,
        payload: { change: event },
        verification_metadata: { intuit_hmac_verified: true, cloudevent_id: event.cloudevent_id },
      });
      if (queued.duplicate) duplicates += 1;
      if (queued.status === "waiting_for_binding") waiting += 1;
      if (queued.status === "denied" || queued.status === "revoked") denied += 1;
    }
    return c.json({ received: true, queued: events.length, duplicates, waiting_for_binding: waiting, denied }, 202);
  });
}
