/**
 * Manager HTTP server — the backend control plane surface (api.amtechai.com).
 * Phase 1: health check, protected Manager tools, claim-token consumption,
 * owner web message routing, provider webhook routes, orchestrator, and provisioner.
 * The owner NEVER talks to this directly; the front door and live employee do.
 */
import { Hono, type Context } from "hono";
import { streamSSE } from "hono/streaming";
import { serve } from "@hono/node-server";
import { ID_PREFIX, MANAGER_API, TOOL_NAMES, newId, type ToolName } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { TOOL_REGISTRY } from "./tools/registry.js";
import { runManagerTool } from "./lib/run-tool.js";
import { handleManagerMcpRequest } from "./lib/mcp-server.js";
import { registerTwilioWebhooks } from "./webhooks/twilio.js";
import { registerGmailWebhooks } from "./webhooks/gmail.js";
import { registerStripeWebhooks } from "./webhooks/stripe.js";
import { registerProvisionerRoutes } from "./provisioner.js";
import { registerOrchestratorRoutes } from "./orchestrator.js";
import { tokenHash, verifySignedToken } from "./lib/signed-links.js";
import { requireOwnerSession } from "./lib/owner-session.js";
import { deliverOwnerTurnToRuntime } from "./lib/runtime.js";
import { createArtifactStorageSignedUrl } from "./lib/artifacts.js";
import { runSchedulerCycle } from "./lib/scheduler-runner.js";
import { buildEmployeeSnapshot, fetchWorkEventsSince } from "./lib/employee-stream.js";
import { subscribeProgress, waitForEmployeeChange } from "./lib/progress-bus.js";
import { orThrow, mustWrite } from "./lib/db.js";
import { stampChannelPresence } from "./lib/channel-router.js";

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
    const input = await c.req.json().catch(() => ({}));
    try {
      const outcome = await runManagerTool(name, input, { actor: "manager" });
      if (outcome.kind === "scheduler_only") return c.json({ error: "scheduler_only_tool" }, 403);
      if (outcome.kind === "unknown_tool") return c.json({ error: "unknown_tool" }, 404);
      if (outcome.kind === "invalid_input") return c.json(outcome.envelope, 400);
      return c.json(outcome.envelope);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[manager] tool ${name} threw:`, err instanceof Error ? err.message : String(err));
      return c.json({ error: "internal_error", tool: name }, 500);
    }
  });

  // Manager control plane as a native MCP server for the employee. Same registry,
  // schema, gates, and audit as /manager/tools — just the MCP transport. Auth
  // rides the internal bearer (rendered into mcp_servers.amtech_manager.headers).
  const mcp = async (c: Context) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    return handleManagerMcpRequest(c.req.raw);
  };
  app.post("/manager/mcp", mcp);
  app.get("/manager/mcp", mcp);
  app.delete("/manager/mcp", mcp);

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
    await stampChannelPresence(db, { account_id: session.account_id, employee_id: employeeId, channel: "web", session_info: { source: "web_message" } });
    const turn = await deliverOwnerTurnToRuntime(db, {
      account_id: session.account_id,
      employee_id: employeeId,
      body: String(message),
      channel: "web",
      idempotency_key: `web:${employeeId}:${Date.now()}:${newId(ID_PREFIX.message)}`,
    });
    if (turn.status === "succeeded" || turn.status === "duplicate") {
      await mustWrite(
        db.from("employee_messages").insert({
          id: newId(ID_PREFIX.message),
          employee_id: employeeId,
          direction: "to_owner",
          source: "employee",
          channel: "web",
          body: turn.reply,
          status: "delivered",
        }),
        "employee_messages.insert.to_owner",
      );
      return c.json({ employee_id: employeeId, reply: turn.reply, turn_job_id: turn.job_id });
    }
    return c.json({ employee_id: employeeId, reply: "", status: turn.status, turn_job_id: turn.job_id, error: turn.error ?? null }, turn.status === "failed" ? 502 : 202);
  });

  app.post("/manager/employee/:employeeId/heartbeat", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    const { owner_session_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const session = await requireOwnerSession(db, owner_session_token);
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const employee = orThrow(
      await db.from("employees").select("id,account_id").eq("id", employeeId).eq("account_id", session.account_id).maybeSingle(),
      "employees.lookup",
    );
    if (!employee) return c.json({ error: "employee_not_found" }, 404);
    await stampChannelPresence(db, { account_id: session.account_id, employee_id: employeeId, channel: "web", session_info: { source: "heartbeat" } });
    return c.json({ status: "ok" });
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
    if (!employeeId) return c.json({ error: "employee_not_found" }, 404);
    const { owner_session_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const session = await requireOwnerSession(db, owner_session_token);
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const employee = orThrow(
      await db.from("employees").select("*").eq("id", employeeId).eq("account_id", session.account_id).maybeSingle(),
      "employees.lookup",
    );
    if (!employee) return c.json({ error: "employee_not_found" }, 404);
    const snapshot = await buildEmployeeSnapshot(db, employeeId, session.account_id);
    return c.json(snapshot);
  });

  // Live Work Surface stream (Phase 5). Initial snapshot, then `work_event` /
  // `approval_update` deltas (cursor-driven, woken by the in-process change
  // signal) and `work_progress` verbs relayed from in-flight wakes. Owner-session
  // authorized like /resources; the browser never touches Supabase directly.
  app.get(MANAGER_API.employeeStream(":employeeId"), async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const employeeId = c.req.param("employeeId");
    if (!employeeId) return c.json({ error: "employee_not_found" }, 404);
    const token = c.req.query("owner_session_token") ?? "";
    const db = serviceClient();
    const session = await requireOwnerSession(db, token);
    if (!session) return c.json({ error: "owner_session_invalid" }, 401);
    const employee = orThrow(
      await db.from("employees").select("id").eq("id", employeeId).eq("account_id", session.account_id).maybeSingle(),
      "employees.lookup.stream",
    );
    if (!employee) return c.json({ error: "employee_not_found" }, 404);
    const accountId = session.account_id;
    const pollMs = Number(process.env.WORK_STREAM_POLL_MS ?? 2000);

    return streamSSE(c, async (stream) => {
      let closed = false;
      stream.onAbort(() => { closed = true; });
      const unsub = subscribeProgress(employeeId, (p) => {
        void stream.writeSSE({ event: "work_progress", data: JSON.stringify({ kind: "work_progress", ...p }) });
      });
      try {
        const snapshot = await buildEmployeeSnapshot(db, employeeId, accountId);
        await stream.writeSSE({ event: "snapshot", data: JSON.stringify({ kind: "snapshot", snapshot }) });
        let cursor = new Date().toISOString();
        while (!closed) {
          await waitForEmployeeChange(employeeId, pollMs);
          if (closed) break;
          const delta = await fetchWorkEventsSince(db, employeeId, accountId, cursor);
          for (const event of delta.workEvents) {
            await stream.writeSSE({ event: "work_event", data: JSON.stringify({ kind: "work_event", event }) });
          }
          for (const approval of delta.approvals) {
            await stream.writeSSE({ event: "approval_update", data: JSON.stringify({ kind: "approval_update", approval_id: approval.id, resolution: approval.resolution }) });
          }
          cursor = delta.nextCursor;
          await stream.writeSSE({ event: "ping", data: "" }); // keepalive
        }
      } finally {
        unsub();
      }
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
