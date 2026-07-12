/**
 * Manager HTTP server — the backend control plane surface (api.amtechai.com).
 * Phase 1: health check, protected Manager tools, claim-token consumption,
 * owner web message routing, provider webhook routes, orchestrator, and provisioner.
 * The owner NEVER talks to this directly; the front door and live employee do.
 */
import { Hono, type Context } from "hono";
import { streamSSE } from "hono/streaming";
import { serve } from "@hono/node-server";
import { ID_PREFIX, MANAGER_API, TOOL_NAMES, newId, type ToolEnvelope, type ToolName, type PreviewActionType } from "@amtech/shared";
import { serviceClient } from "@amtech/db";
import { TOOL_REGISTRY } from "./tools/registry.js";
import { runManagerTool } from "./lib/run-tool.js";
import { handleManagerMcpRequest } from "./lib/mcp-server.js";
import { registerTwilioWebhooks } from "./webhooks/twilio.js";
import { registerGmailWebhooks } from "./webhooks/gmail.js";
import { registerStripeWebhooks } from "./webhooks/stripe.js";
import { registerQuickbooksWebhooks } from "./webhooks/quickbooks.js";
import { registerProvisionerRoutes } from "./provisioner.js";
import { registerOrchestratorRoutes } from "./orchestrator.js";
import { decodeSignedToken, tokenHash, verifySignedToken } from "./lib/signed-links.js";
import { requireOwnerSession, mintOwnerSession } from "./lib/owner-session.js";
import { deliverOwnerTurnToRuntime } from "./lib/runtime.js";
import { createArtifactStorageSignedUrl } from "./lib/artifacts.js";
import { renderArtifactHtml } from "./lib/artifact-view.js";
import { resolvePreviewLink } from "./lib/preview-links.js";
import { buildWorkResource } from "./lib/preview-render.js";
import { runSchedulerCycle } from "./lib/scheduler-runner.js";
import { buildEmployeeSnapshot, cursorFromSnapshot, fetchWorkEventsSince } from "./lib/employee-stream.js";
import { signalEmployeeChange, subscribeProgress, waitForEmployeeChange } from "./lib/progress-bus.js";
import { orThrow, mustWrite } from "./lib/db.js";
import { stampChannelPresence } from "./lib/channel-router.js";
import { bearerToken, verifyEmployeeMcpCredential } from "./lib/mcp-auth.js";
import {
  buildAdminAccountDetail,
  buildAdminDashboard,
  buildAdminEmployeeDetail,
  buildEnvironmentReadiness,
  buildReadinessReport,
  recordSupportAccess,
  requirePlatformRole,
  runAdminSupportAction,
} from "./lib/admin.js";

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
    // Fail CLOSED unless dev has EXPLICITLY opted into unauthenticated mode. The old
    // guard keyed only on NODE_ENV, so a deploy with NODE_ENV unset/misspelled (a bad
    // container env, a staging box) left the entire control plane open. Now the open
    // path requires ALLOW_UNAUTH_DEV=1 AND non-production.
    if (process.env.NODE_ENV === "production" || process.env.ALLOW_UNAUTH_DEV !== "1") {
      return c.json({ error: "manager_auth_misconfigured" }, 503);
    }
    if (!warnedMissingInternalToken) {
      warnedMissingInternalToken = true;
      // eslint-disable-next-line no-console
      console.warn("[manager] MANAGER_INTERNAL_TOKEN unset + ALLOW_UNAUTH_DEV=1 — endpoints are UNAUTHENTICATED (dev only).");
    }
    return null;
  }
  if (c.req.header("Authorization") !== `Bearer ${internalToken}`) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return null;
}

type ApprovalResolution = "approved" | "rejected";

interface ApprovalFollowupTurn {
  status: "succeeded" | "queued" | "duplicate" | "failed";
  job_id?: string;
  run_id?: string;
  error?: string;
}

function approvalResolutionWakeBody(params: {
  approval_id: string;
  resolution: ApprovalResolution;
}): string {
  if (params.resolution === "approved") {
    return [
      `Owner approved approval ${params.approval_id}.`,
      "Resume the workflow that was waiting on this approval and perform only the gated action covered by that approval.",
      "Use get_approval_status if you need to confirm the gate before sending or committing.",
    ].join(" ");
  }
  return [
    `Owner rejected approval ${params.approval_id}.`,
    "Do not perform the gated action covered by that approval.",
    "Continue by acknowledging the decision and asking only for the next safe alternative if needed.",
  ].join(" ");
}

async function deliverApprovalResolutionFollowup(
  db: ReturnType<typeof serviceClient>,
  params: {
    account_id: string;
    employee_id: string;
    approval_id: string;
    resolution: ApprovalResolution;
    channel?: "sms" | "web";
  },
): Promise<ApprovalFollowupTurn> {
  try {
    const turn = await deliverOwnerTurnToRuntime(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      body: approvalResolutionWakeBody(params),
      channel: params.channel ?? "web",
      idempotency_key: `approval-resolution:${params.approval_id}:${params.resolution}`,
    });
    return {
      status: turn.status,
      job_id: turn.job_id,
      run_id: turn.run_id,
      error: turn.error,
    };
  } catch (err) {
    const message = String((err as Error).message ?? err);
    // eslint-disable-next-line no-console
    console.warn("[manager] approval follow-up wake failed:", message);
    return { status: "failed", error: message };
  } finally {
    signalEmployeeChange(params.employee_id);
  }
}

function withApprovalFollowupProof(envelope: ToolEnvelope, followup: ApprovalFollowupTurn): ToolEnvelope {
  return {
    ...envelope,
    proof: {
      ...envelope.proof,
      approval_followup_turn_status: followup.status,
      approval_followup_turn_job_id: followup.job_id ?? null,
      approval_followup_run_id: followup.run_id ?? null,
    },
  };
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
      const outcome = await runManagerTool(name, input, { actor: name === "resolve_approval" ? "owner" : "manager" });
      if (outcome.kind === "scheduler_only") return c.json({ error: "scheduler_only_tool" }, 403);
      if (outcome.kind === "unknown_tool") return c.json({ error: "unknown_tool" }, 404);
      if (outcome.kind === "invalid_input") return c.json(outcome.envelope, 400);
      if (name === "resolve_approval" && outcome.envelope.status === "ok") {
        const approvalInput = input as { account_id?: string; employee_id?: string; approval_id?: string; owner_response?: string; channel?: "sms" | "web" };
        const resolution = approvalInput.owner_response === "approved" || approvalInput.owner_response === "yes" ? "approved" : "rejected";
        const followup = await deliverApprovalResolutionFollowup(serviceClient(), {
          account_id: String(approvalInput.account_id),
          employee_id: String(approvalInput.employee_id),
          approval_id: String(approvalInput.approval_id),
          resolution,
          channel: approvalInput.channel,
        });
        return c.json(withApprovalFollowupProof(outcome.envelope, followup));
      }
      return c.json(outcome.envelope);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[manager] tool ${name} threw:`, err instanceof Error ? err.message : String(err));
      return c.json({ error: "internal_error", tool: name }, 500);
    }
  });

  // Manager control plane as a native MCP server for the employee. Same registry,
  // schema, gates, and audit as /manager/tools — just the MCP transport. Auth is
  // a scoped per-employee credential, not the global Manager internal bearer.
  const mcp = async (c: Context) => {
    const token = bearerToken(c.req.header("Authorization"));
    if (!token?.startsWith("mcp_")) return c.json({ error: "unauthorized" }, 401);
    const identity = await verifyEmployeeMcpCredential(serviceClient(), c.req.header("Authorization"));
    if (!identity) return c.json({ error: "unauthorized" }, 401);
    return handleManagerMcpRequest(c.req.raw, identity);
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

  app.post("/manager/materialization/diagnostics", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const { account_id, employee_id, limit } = await c.req.json().catch(() => ({}));
    if (!account_id || !employee_id) return c.json({ error: "account_and_employee_required" }, 400);
    const db = serviceClient();
    const employee = orThrow(
      await db.from("employees").select("id,account_id").eq("id", String(employee_id)).eq("account_id", String(account_id)).maybeSingle(),
      "materialization.diagnostics.employee",
    );
    if (!employee) return c.json({ error: "employee_not_found" }, 404);
    const snapshot = await buildEmployeeSnapshot(db, String(employee_id), String(account_id));
    const max = Math.max(1, Math.min(Number(limit ?? 25), 100));
    const envelopes = (snapshot.surface_envelopes ?? []).slice(0, max);
    return c.json({
      account_id,
      employee_id,
      latest_envelopes: envelopes.map((e) => ({
        id: e.id,
        kind: e.kind,
        status: e.status ?? null,
        proof: e.proof,
        safety: e.safety,
        render_hints: e.render_hints,
      })),
      latest_resources: envelopes.flatMap((e) => e.resource ? [{ resource_type: e.resource.resource_type, resource_id: e.resource.resource_id, title: e.resource.title, body_kind: e.resource.body_kind ?? null }] : []),
      latest_actions: envelopes.flatMap((e) => (e.actions ?? []).map((a) => ({ action: a.action, label: a.label, gated: Boolean(a.gated) }))),
      render_errors: [],
      delivery_receipts: envelopes.flatMap((e) => e.proof.delivery_decision_id ? [{ source_envelope_id: e.id, delivery_decision_id: e.proof.delivery_decision_id }] : []),
      repair_hints: envelopes
        .filter((e) => e.status === "failed" || e.safety.requires_approval)
        .map((e) => ({ source_envelope_id: e.id, hint: e.status === "failed" ? "Check source proof and repair queue." : "Await or resolve owner approval gate." })),
    });
  });

  async function adminActor(c: Context, minimum: "support_readonly" | "platform_operator" = "support_readonly") {
    const denied = denyInternal(c);
    if (denied) return { denied };
    const auth = await requirePlatformRole(serviceClient(), {
      platform_user_id: c.req.header("X-AMTECH-Platform-User-Id"),
      minimum,
    });
    if (!auth.ok) return { denied: c.json({ error: auth.error }, auth.status as 401 | 403) };
    return { actor: auth.actor };
  }

  app.get(MANAGER_API.admin.dashboard, async (c) => {
    const auth = await adminActor(c);
    if ("denied" in auth) return auth.denied;
    return c.json(await buildAdminDashboard(serviceClient()));
  });

  app.get(MANAGER_API.admin.accounts, async (c) => {
    const auth = await adminActor(c);
    if ("denied" in auth) return auth.denied;
    return c.json({ accounts: (await buildAdminDashboard(serviceClient())).accounts });
  });

  app.get("/manager/admin/accounts/:accountId", async (c) => {
    const auth = await adminActor(c);
    if ("denied" in auth) return auth.denied;
    const accountId = c.req.param("accountId");
    const access = await recordSupportAccess(serviceClient(), auth.actor, {
      account_id: accountId,
      reason: c.req.header("X-AMTECH-Support-Reason"),
      action: "account_detail",
    });
    if (!access.ok) return c.json({ error: access.error }, access.status as 400);
    const detail = await buildAdminAccountDetail(serviceClient(), accountId);
    if (!detail) return c.json({ error: "account_not_found" }, 404);
    return c.json(detail);
  });

  app.get("/manager/admin/employees/:employeeId", async (c) => {
    const auth = await adminActor(c);
    if ("denied" in auth) return auth.denied;
    const employeeId = c.req.param("employeeId");
    const db = serviceClient();
    const detail = await buildAdminEmployeeDetail(db, employeeId) as { employee?: { account_id?: string } } | null;
    if (!detail?.employee?.account_id) return c.json({ error: "employee_not_found" }, 404);
    const access = await recordSupportAccess(db, auth.actor, {
      account_id: detail.employee.account_id,
      employee_id: employeeId,
      reason: c.req.header("X-AMTECH-Support-Reason"),
      action: "employee_detail",
    });
    if (!access.ok) return c.json({ error: access.error }, access.status as 400);
    return c.json(detail);
  });

  app.get("/manager/admin/employees/:employeeId/readiness", async (c) => {
    const auth = await adminActor(c);
    if ("denied" in auth) return auth.denied;
    const employeeId = c.req.param("employeeId");
    const report = await buildReadinessReport(serviceClient(), employeeId);
    if (!report) return c.json({ error: "employee_not_found" }, 404);
    const access = await recordSupportAccess(serviceClient(), auth.actor, {
      account_id: report.account_id,
      employee_id: employeeId,
      reason: c.req.header("X-AMTECH-Support-Reason"),
      action: "readiness_report",
    });
    if (!access.ok) return c.json({ error: access.error }, access.status as 400);
    return c.json(report);
  });

  app.get("/manager/admin/environment/readiness", async (c) => {
    const auth = await adminActor(c);
    if ("denied" in auth) return auth.denied;
    return c.json(buildEnvironmentReadiness());
  });

  app.post(MANAGER_API.admin.supportAction, async (c) => {
    const auth = await adminActor(c, "platform_operator");
    if ("denied" in auth) return auth.denied;
    const input = await c.req.json().catch(() => ({}));
    const result = await runAdminSupportAction(serviceClient(), auth.actor, input);
    const status = result.status === "ok" ? 200 : result.status === "denied" ? 403 : 400;
    return c.json(result, status);
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
    if (!artifact) return c.json({ error: "artifact_not_found" }, 404);

    let authorized = false;
    let expiredLink = false;
    let linkId: string | null = null;
    let linkToIncrement: string | null = null;
    if (signed_token) {
      // decode (not verify) so an aged-out token is distinguishable from a forged one.
      const decoded = decodeSignedToken(String(signed_token), "artifact_link");
      const payload = decoded?.payload;
      if (payload &&
        payload.subject === artifactId &&
        payload.extra?.employee_id === employeeId &&
        payload.extra?.account_id === artifact.account_id
      ) {
        if (decoded!.expired) {
          expiredLink = true;
        } else {
          const link = orThrow(
            await db.from("artifact_links").select("*").eq("artifact_id", artifactId).eq("token_hash", tokenHash(String(signed_token))).maybeSingle(),
            "artifact_links.lookup",
          );
          if (link && (link.revoked_at || (link.expires_at && new Date(link.expires_at).getTime() < Date.now()))) {
            expiredLink = true;
          } else if (link) {
            authorized = true;
            linkId = link.id;
            linkToIncrement = link.id;
          }
        }
      }
    }

    if (!authorized && owner_session_token) {
      const session = await requireOwnerSession(db, owner_session_token);
      authorized = Boolean(session && session.account_id === artifact.account_id);
    }

    if (!authorized) {
      // An expired/revoked (but validly-signed and correctly-scoped) link gets the
      // owner-friendly reissue path, consistent with the preview route.
      if (expiredLink) return c.json({ error: "artifact_link_expired", expired: true }, 410);
      return c.json({ error: "artifact_access_denied" }, 403);
    }
    const fallbackHtml = artifact.storage_ref ? null : renderArtifactHtml(artifact);
    if (!artifact.storage_ref && !fallbackHtml) return c.json({ error: "artifact_not_found" }, 404);
    const signedUrl = artifact.storage_ref ? await createArtifactStorageSignedUrl(db, String(artifact.storage_ref)) : null;
    if (linkToIncrement) {
      // Best-effort analytics counter — never fail the owner's read on it (access
      // is authorized by the signed token/expiry, not by this count).
      try {
        await db.rpc("increment_artifact_link_access_count", { p_link_id: linkToIncrement });
      } catch {
        // best effort
      }
    }
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
    if (!artifact.storage_ref) {
      return c.json({
        artifact_id: artifactId,
        employee_id: employeeId,
        html: fallbackHtml,
        mime_type: "text/html",
      });
    }
    return c.json({
      artifact_id: artifactId,
      employee_id: employeeId,
      signed_url: signedUrl,
      mime_type: artifact.mime_type ?? "application/pdf",
    });
  });

  // Signed mobile preview (Phase 3). The signed token IS the credential and encodes
  // the scoped resource; Manager decodes it, renders a WorkResource from the same
  // read model the web desk uses, and scopes the offered actions to the token.
  app.post(MANAGER_API.previewResolve, async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const { signed_token } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const resolution = await resolvePreviewLink(db, String(signed_token ?? ""));
    if (!resolution.ok) {
      if (resolution.reason === "expired" || resolution.reason === "revoked") {
        return c.json({ error: "preview_link_expired", expired: true }, 410);
      }
      return c.json({ error: "preview_access_denied" }, 403);
    }
    const link = resolution.link;
    const resource = await buildWorkResource(db, {
      employee_id: link.employee_id,
      account_id: link.account_id,
      resource_type: link.resource_type,
      resource_id: link.resource_id,
    });
    if (!resource) return c.json({ error: "preview_not_found" }, 404);

    // Scope offered actions to what the signed link allows (view is always safe).
    const allow = new Set<string>([...resolution.claims.actions, "view"]);
    resource.actions = resource.actions.filter((a) => allow.has(a.action));

    // Best-effort analytics counter — access is authorized by the signed token, not
    // by this count, so a counter write must never fail the owner's read.
    try {
      await db.rpc("increment_preview_link_access_count", { p_link_id: link.id });
    } catch {
      // best effort
    }
    await db.from("audit_log").insert({
      id: newId(ID_PREFIX.audit),
      account_id: link.account_id,
      employee_id: link.employee_id,
      actor: "owner",
      action: "preview:access",
      resource: `${link.resource_type}:${link.resource_id}`,
      result: "ok",
      details: { via_signed_token: true },
    });
    return c.json({ resource, employee_id: link.employee_id });
  });

  // Owner-authenticated signed action (Phase 3). The token is the credential; the
  // action must be in the token's scope. approve/reject reuse the idempotent
  // resolve_approval state machine; respond/edit route the note into the same
  // owner-turn pipeline as web/SMS so the employee LLM handles it.
  app.post(MANAGER_API.previewAction, async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const { signed_token, action, note } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    const resolution = await resolvePreviewLink(db, String(signed_token ?? ""));
    if (!resolution.ok) {
      if (resolution.reason === "expired" || resolution.reason === "revoked") {
        return c.json({ error: "preview_link_expired", expired: true }, 410);
      }
      return c.json({ error: "preview_access_denied" }, 403);
    }
    const link = resolution.link;
    const act = String(action ?? "") as PreviewActionType;
    if (!resolution.claims.actions.includes(act)) {
      return c.json({ error: "action_not_permitted" }, 403);
    }
    const terminal = act === "approve" || act === "reject" || act === "acknowledge";
    if (terminal && link.consumed_at) {
      return c.json({ error: "already_actioned", consumed: true }, 409);
    }

    let resultBody: Record<string, unknown> = { ok: true };

    if (act === "approve" || act === "reject") {
      if (link.resource_type !== "approval") return c.json({ error: "action_not_permitted" }, 403);
      const outcome = await runManagerTool("resolve_approval", {
        account_id: link.account_id,
        employee_id: link.employee_id,
        approval_id: link.resource_id,
        owner_response: act === "approve" ? "approved" : "rejected",
        channel: "sms",
      }, { actor: "owner" });
      if (outcome.kind !== "ok" || outcome.envelope.status !== "ok") {
        return c.json({ error: "resolve_failed", detail: outcome.kind === "ok" ? outcome.envelope : outcome.kind }, 400);
      }
      const resolution = act === "approve" ? "approved" : "rejected";
      const followup = await deliverApprovalResolutionFollowup(db, {
        account_id: link.account_id,
        employee_id: link.employee_id,
        approval_id: link.resource_id,
        resolution,
        channel: "sms",
      });
      resultBody = {
        ok: true,
        resolution,
        turn_status: followup.status,
        turn_job_id: followup.job_id ?? null,
        run_id: followup.run_id ?? null,
      };
    } else if (act === "respond" || act === "edit") {
      const body = String(note ?? "").trim();
      if (!body) return c.json({ error: "note_required" }, 400);
      const messageId = newId(ID_PREFIX.message);
      await mustWrite(
        db.from("employee_messages").insert({
          id: messageId,
          employee_id: link.employee_id,
          direction: "to_employee",
          source: "web",
          channel: "web",
          body,
          status: "received",
        }),
        "employee_messages.insert.preview_respond",
      );
      const turn = await deliverOwnerTurnToRuntime(db, {
        account_id: link.account_id,
        employee_id: link.employee_id,
        body,
        channel: "web",
        idempotency_key: `preview:${link.id}:${messageId}`,
      });
      resultBody = { ok: true, turn_status: turn.status };
    } else if (act === "acknowledge") {
      resultBody = { ok: true, acknowledged: true };
    } else {
      return c.json({ error: "action_not_permitted" }, 403);
    }

    if (terminal) {
      await mustWrite(
        db.from("preview_links").update({ consumed_at: new Date().toISOString() }).eq("id", link.id),
        "preview_links.consume",
      );
    }
    await db.from("audit_log").insert({
      id: newId(ID_PREFIX.audit),
      account_id: link.account_id,
      employee_id: link.employee_id,
      actor: "owner",
      action: "preview:action",
      resource: `${link.resource_type}:${link.resource_id}`,
      result: "ok",
      details: { action: act },
    });
    return c.json(resultBody);
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
      let writeChain = Promise.resolve();
      stream.onAbort(() => { closed = true; });
      const writeSse = (frame: { event: string; data: string }) => {
        writeChain = writeChain
          .then(() => closed ? undefined : stream.writeSSE(frame))
          .catch((err) => {
            closed = true;
            // eslint-disable-next-line no-console
            console.warn("[manager] SSE write failed:", err instanceof Error ? err.message : String(err));
          });
        return writeChain;
      };
      const unsub = subscribeProgress(employeeId, (p) => {
        void writeSse({ event: "work_progress", data: JSON.stringify({ kind: "work_progress", ...p }) });
      });
      try {
        const snapshot = await buildEmployeeSnapshot(db, employeeId, accountId);
        await writeSse({ event: "snapshot", data: JSON.stringify({ kind: "snapshot", snapshot }) });
        let cursor = cursorFromSnapshot(snapshot);
        while (!closed) {
          await waitForEmployeeChange(employeeId, pollMs);
          if (closed) break;
          const delta = await fetchWorkEventsSince(db, employeeId, accountId, cursor);
          for (const event of delta.workEvents) {
            await writeSse({ event: "work_event", data: JSON.stringify({ kind: "work_event", event }) });
          }
          for (const approval of delta.approvals) {
            await writeSse({ event: "approval_update", data: JSON.stringify({ kind: "approval_update", approval_id: approval.id, resolution: approval.resolution }) });
          }
          cursor = delta.nextCursor;
          await writeSse({ event: "ping", data: "" }); // keepalive
        }
      } finally {
        await writeChain;
        unsub();
      }
    });
  });

  // Dev-only owner "login": mint an owner web session for an existing employee so
  // local testing can authenticate the Work Surface without the (Phase 1 stub)
  // Supabase Auth login. Double-gated — requires DEV_OWNER_LOGIN=1 AND fails closed
  // when NODE_ENV=production. Web calls this from /api/dev/login and sets the cookie.
  app.post("/manager/dev/mint-owner-session", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    if (process.env.NODE_ENV === "production" || process.env.DEV_OWNER_LOGIN !== "1") {
      return c.json({ error: "dev_login_disabled" }, 403);
    }
    const { employee_id, account_id } = await c.req.json().catch(() => ({}));
    const db = serviceClient();
    let accountId = account_id as string | undefined;
    if (!accountId && employee_id) {
      const emp = orThrow(
        await db.from("employees").select("account_id").eq("id", employee_id).maybeSingle(),
        "dev_login.employees.lookup",
      );
      if (!emp) return c.json({ error: "employee_not_found" }, 404);
      accountId = String(emp.account_id);
    }
    if (!accountId) return c.json({ error: "account_or_employee_required" }, 400);
    const membership = orThrow(
      await db.from("account_memberships").select("user_id").eq("account_id", accountId).eq("role", "owner").maybeSingle(),
      "dev_login.membership.lookup",
    );
    if (!membership?.user_id) return c.json({ error: "owner_user_not_found" }, 404);
    const { token, expires_at } = await mintOwnerSession(db, accountId, String(membership.user_id));
    return c.json({
      owner_session_token: token,
      owner_session_expires_at: expires_at,
      account_id: accountId,
      employee_id: employee_id ?? null,
    });
  });

  registerTwilioWebhooks(app);
  registerGmailWebhooks(app);
  registerStripeWebhooks(app);
  registerQuickbooksWebhooks(app);
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
