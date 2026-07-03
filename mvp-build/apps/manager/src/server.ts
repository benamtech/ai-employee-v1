/**
 * Manager HTTP server — the backend control plane surface (api.amtechai.com).
 * Phase 1: health check, protected Manager tools, claim-token consumption,
 * owner web message routing, provider webhook routes, orchestrator, and provisioner.
 * The owner NEVER talks to this directly; the front door and live employee do.
 */
import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { ID_PREFIX, MANAGER_API, TOOL_NAMES, newId, type ToolName } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { TOOL_REGISTRY } from "./tools/registry.js";
import type { ToolContext } from "./tools/types.js";
import { registerTwilioWebhooks } from "./webhooks/twilio.js";
import { registerGmailWebhooks } from "./webhooks/gmail.js";
import { registerStripeWebhooks } from "./webhooks/stripe.js";
import { registerProvisionerRoutes } from "./provisioner.js";
import { registerOrchestratorRoutes } from "./orchestrator.js";
import { tokenHash, verifySignedToken } from "./lib/signed-links.js";
import { requireOwnerSession } from "./lib/owner-session.js";
import { deliverToRuntime } from "./lib/runtime.js";
import { createArtifactStorageSignedUrl } from "./lib/artifacts.js";
import { runSchedulerCycle } from "./lib/scheduler-runner.js";
import { orThrow, mustWrite } from "./lib/db.js";

/** Tools that mutate every account's queue — only the scheduler runner may invoke
 *  them, via /manager/scheduler/run, never the generic per-tool endpoint. */
const SCHEDULER_ONLY_TOOLS = new Set<ToolName>([
  "dispatch_due_reminders",
  "dispatch_daily_briefs",
  "renew_expiring_watches",
]);

let warnedMissingInternalToken = false;

/**
 * Internal-auth gate for the Manager control-plane endpoints. Fails CLOSED: when
 * MANAGER_INTERNAL_TOKEN is unset we deny in production (503 misconfig) instead of
 * silently leaving the endpoint open — the previous `if (token && ...)` guard was
 * fail-open. In non-production we warn once and allow, to keep the local loop usable.
 * Returns a Response to short-circuit with, or null when the caller is authorized.
 */
function denyInternal(c: Context): Response | null {
  const internalToken = process.env.MANAGER_INTERNAL_TOKEN;
  if (!internalToken) {
    if (process.env.NODE_ENV === "production") {
      return c.json({ error: "manager_auth_misconfigured" }, 503);
    }
    if (!warnedMissingInternalToken) {
      warnedMissingInternalToken = true;
      // eslint-disable-next-line no-console
      console.warn("[manager] MANAGER_INTERNAL_TOKEN unset — endpoints are UNAUTHENTICATED (dev only).");
    }
    return null;
  }
  if (c.req.header("Authorization") !== `Bearer ${internalToken}`) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return null;
}

export function buildApp(): Hono {
  const app = new Hono();

  // Backstop: a thrown DB fault (orThrow/mustWrite) or other error becomes a clean
  // 500 with no leaked detail, rather than a hang or a stack trace to the caller.
  app.onError((err, c) => {
    // eslint-disable-next-line no-console
    console.error("[manager] unhandled error:", err instanceof Error ? err.message : String(err));
    return c.json({ error: "internal_error" }, 500);
  });

  app.get("/health", (c) =>
    c.json({ status: "ok", tools: TOOL_REGISTRY.size, expected: TOOL_NAMES.length }),
  );

  // Backend tool invocation (front door / employee → Manager).
  app.post("/manager/tools/:name", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const name = c.req.param("name") as ToolName;
    if (SCHEDULER_ONLY_TOOLS.has(name)) {
      return c.json({ error: "scheduler_only_tool" }, 403);
    }
    const handler = TOOL_REGISTRY.get(name);
    if (!handler) return c.json({ error: "unknown_tool" }, 404);
    const input = await c.req.json().catch(() => ({}));
    const ctx: ToolContext = {
      db: serviceClient(),
      account_id: (input?.account_id as string) ?? null,
      employee_id: (input?.employee_id as string) ?? null,
      actor: "manager",
    };
    try {
      const envelope = await handler(ctx, input);
      return c.json(envelope);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[manager] tool ${name} threw:`, err instanceof Error ? err.message : String(err));
      return c.json({ error: "internal_error", tool: name }, 500);
    }
  });

  app.post("/manager/scheduler/run", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const input = await c.req.json().catch(() => ({}));
    const result = await runSchedulerCycle(serviceClient(), input);
    const failedRuns = result.results.filter((r) => r.status === "failed");
    return c.json({
      status: failedRuns.length ? "failed" : "ok",
      results: result.results,
    }, failedRuns.length ? 500 : 200);
  });

  app.post("/manager/claim/consume", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const { token } = await c.req.json().catch(() => ({ token: "" }));
    const payload = verifySignedToken(String(token ?? ""), "claim_link");
    if (!payload) return c.json({ error: "invalid_claim_token" }, 403);
    const hash = tokenHash(String(token));
    const db = serviceClient();
    const row = orThrow(
      await db.from("claim_tokens").select("*").eq("token_hash", hash).maybeSingle(),
      "claim_tokens.lookup",
    );
    if (!row || row.consumed_at) return c.json({ error: "claim_token_unavailable" }, 403);
    await mustWrite(
      db.from("claim_tokens").update({ consumed_at: new Date().toISOString() }).eq("token_hash", hash),
      "claim_tokens.consume",
    );
    const verifiedPhoneId = newId(ID_PREFIX.phone);
    await mustWrite(
      db.from("verified_phones").insert({
        id: verifiedPhoneId,
        phone_e164: row.phone_e164,
        verification_method: "sms_inbound",
        consent_channel: "sms",
        twilio_proof: row.twilio_proof ?? {},
      }),
      "verified_phones.insert",
    );
    const session = orThrow(
      await db.from("onboarding_sessions").select("*").eq("id", row.onboarding_session_id).maybeSingle(),
      "onboarding_sessions.lookup",
    );
    const manifest = { ...(session?.manifest_draft ?? {}), verified_phone_ref: verifiedPhoneId };
    return c.json({
      phone_e164: row.phone_e164,
      session_id: row.onboarding_session_id,
      manifest_draft: manifest,
      transcript_ref: row.onboarding_session_id,
    });
  });

  app.post("/manager/employee/:employeeId/message", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const { owner_session_token, message } = await c.req.json().catch(() => ({}));
    if (!message) return c.json({ error: "message_required" }, 400);
    const db = serviceClient();
    const session = await requireOwnerSession(db, owner_session_token);
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const employee = orThrow(
      await db.from("employees").select("*").eq("id", employeeId).eq("account_id", session.account_id).maybeSingle(),
      "employees.lookup",
    );
    if (!employee) return c.json({ error: "employee_not_found" }, 404);
    const runtime = orThrow(
      await db.from("runtime_endpoints").select("*").eq("employee_id", employeeId).maybeSingle(),
      "runtime_endpoints.lookup",
    );
    await mustWrite(
      db.from("employee_messages").insert({
        id: newId(ID_PREFIX.message),
        employee_id: employeeId,
        direction: "to_employee",
        source: "web",
        channel: "web",
        body: message,
        status: "received",
      }),
      "employee_messages.insert.to_employee",
    );
    const reply = await deliverToRuntime(String(runtime?.webchat_api_url ?? ""), String(message), "web");
    await mustWrite(
      db.from("employee_messages").insert({
        id: newId(ID_PREFIX.message),
        employee_id: employeeId,
        direction: "to_owner",
        source: "employee",
        channel: "web",
        body: reply,
        status: "delivered",
      }),
      "employee_messages.insert.to_owner",
    );
    return c.json({ employee_id: employeeId, reply });
  });

  app.post(MANAGER_API.artifactResolve(":employeeId", ":artifactId"), async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const artifactId = c.req.param("artifactId");
    const { owner_session_token, signed_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const artifact = orThrow(
      await db.from("artifacts").select("*").eq("id", artifactId).eq("employee_id", employeeId).maybeSingle(),
      "artifacts.lookup",
    );
    if (!artifact?.storage_ref) return c.json({ error: "artifact_not_found" }, 404);

    let authorized = false;
    let linkId: string | null = null;
    if (signed_token) {
      const payload = verifySignedToken(String(signed_token), "artifact_link");
      if (payload &&
        payload?.subject === artifactId &&
        payload.extra?.employee_id === employeeId &&
        payload.extra?.account_id === artifact.account_id
      ) {
        const link = orThrow(
          await db.from("artifact_links").select("*").eq("artifact_id", artifactId).eq("token_hash", tokenHash(String(signed_token))).maybeSingle(),
          "artifact_links.lookup",
        );
        if (
          link &&
          !link.revoked_at &&
          (!link.expires_at || new Date(link.expires_at).getTime() >= Date.now())
        ) {
          authorized = true;
          linkId = link.id;
          await mustWrite(
            db.from("artifact_links").update({ access_count: Number(link.access_count ?? 0) + 1 }).eq("id", link.id),
            "artifact_links.access_count",
          );
        }
      }
    }

    if (!authorized && owner_session_token) {
      const session = await requireOwnerSession(db, owner_session_token);
      authorized = Boolean(session && session.account_id === artifact.account_id);
    }

    if (!authorized) return c.json({ error: "artifact_access_denied" }, 403);
    const signedUrl = await createArtifactStorageSignedUrl(db, String(artifact.storage_ref));
    await db.from("audit_log").insert({
      id: newId(ID_PREFIX.audit),
      account_id: artifact.account_id,
      employee_id: employeeId,
      actor: owner_session_token ? "owner" : "manager",
      action: "artifact:access",
      resource: artifactId,
      result: "ok",
      details: { artifact_link_id: linkId, via_signed_token: Boolean(signed_token) },
    });
    return c.json({
      artifact_id: artifactId,
      employee_id: employeeId,
      signed_url: signedUrl,
      mime_type: artifact.mime_type ?? "application/pdf",
    });
  });

  app.post(MANAGER_API.employeeResources(":employeeId"), async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const { owner_session_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const session = await requireOwnerSession(db, owner_session_token);
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const employee = orThrow(
      await db.from("employees").select("*").eq("id", employeeId).eq("account_id", session.account_id).maybeSingle(),
      "employees.lookup",
    );
    if (!employee) return c.json({ error: "employee_not_found" }, 404);
    const { data: artifacts } = await db
      .from("artifacts")
      .select("id,kind,mime_type,storage_ref,payload,created_at")
      .eq("employee_id", employeeId)
      .eq("account_id", session.account_id)
      .order("created_at", { ascending: false })
      .limit(10);
    const { data: approvals } = await db
      .from("approvals")
      .select("id,action_key,summary,risk_level,refs,resolution,expires_at,created_at")
      .eq("employee_id", employeeId)
      .eq("account_id", session.account_id)
      .is("resolution", null)
      .order("created_at", { ascending: false })
      .limit(10);
    const { data: messages } = await db
      .from("employee_messages")
      .select("id,direction,source,channel,body,provider_id,status,created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20);
    const { data: connectors } = await db
      .from("connector_accounts")
      .select("id,connector_key,provider,status,external_email,last_connector_test_at,last_error,created_at")
      .eq("employee_id", employeeId)
      .eq("account_id", session.account_id);
    const { data: stripeConnections } = await db
      .from("stripe_connections")
      .select("id,connected_account_id,onboarding_status,charges_enabled,payouts_enabled,created_at")
      .eq("employee_id", employeeId)
      .eq("account_id", session.account_id);
    const stripeConnectionIds = (stripeConnections ?? []).map((row: { id: string }) => row.id);
    const { data: stripeInvoices } = stripeConnectionIds.length
      ? await db
        .from("stripe_invoices")
        .select("id,stripe_connection_id,estimate_id,stripe_invoice_id,deposit_amount,hosted_invoice_url,invoice_pdf,status,created_at")
        .in("stripe_connection_id", stripeConnectionIds)
        .order("created_at", { ascending: false })
        .limit(10)
      : { data: [] };
    const { data: reminders } = await db
      .from("reminders")
      .select("id,job_id,scheduled_at,channel,status,message,sent_at,provider_id,created_at")
      .eq("employee_id", employeeId)
      .eq("account_id", session.account_id)
      .order("scheduled_at", { ascending: true })
      .limit(20);
    const { data: jobCommitments } = await db
      .from("job_commitments")
      .select("id,estimate_id,customer_ref,start_at,start_window,notes,source_ref,created_at")
      .eq("employee_id", employeeId)
      .eq("account_id", session.account_id)
      .order("created_at", { ascending: false })
      .limit(20);
    const { data: inboundEvents } = await db
      .from("inbound_events")
      .select("id,source,event_type,provider_id,normalized_payload,status,trace,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    const workEvents = (inboundEvents ?? [])
      .map((event: Record<string, unknown>) => ({
        ...event,
        work_event_descriptor: (event.normalized_payload as { work_event_descriptor?: unknown } | undefined)?.work_event_descriptor,
      }))
      .filter((event: { work_event_descriptor?: unknown }) =>
        (event.work_event_descriptor as { employee_id?: string; account_id?: string } | undefined)?.employee_id === employeeId &&
        (event.work_event_descriptor as { employee_id?: string; account_id?: string } | undefined)?.account_id === session.account_id,
      )
      .slice(0, 10);
    return c.json({
      employee_id: employeeId,
      account_id: session.account_id,
      artifacts: artifacts ?? [],
      approvals: approvals ?? [],
      messages: (messages ?? []).reverse(),
      connectors: connectors ?? [],
      stripe_connections: stripeConnections ?? [],
      stripe_invoices: stripeInvoices ?? [],
      reminders: reminders ?? [],
      job_commitments: jobCommitments ?? [],
      work_events: workEvents,
    });
  });

  registerTwilioWebhooks(app);
  registerGmailWebhooks(app);
  registerStripeWebhooks(app);
  registerProvisionerRoutes(app);
  registerOrchestratorRoutes(app);

  return app;
}

function main(): void {
  const app = buildApp();
  const port = Number(process.env.MANAGER_PORT ?? 8080);
  serve({ fetch: app.fetch, port });
  // eslint-disable-next-line no-console
  console.log(`[manager] listening on :${port} (${TOOL_REGISTRY.size} tools registered)`);
}

// Run only when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
