import type { Context, Hono } from "hono";
import { serviceClient } from "@amtech/db";
import {
  createOrResumePublicEstimatorSession,
  getCurrentPublicEstimatorDraft,
  recordPublicEstimatorEvent,
  recordPublicEstimatorMessage,
  requirePublicEstimatorSession,
  validatePublicEstimatorMessage,
} from "./lib/public-estimator.js";
import { deliverPublicEstimatorTurnToRuntime } from "./lib/public-estimator-runtime.js";
import { sendPublicEstimatorDraftEmail } from "./lib/public-estimator-email.js";

type DenyInternal = (c: Context) => Response | null;

function publicError(error: string): string {
  switch (error) {
    case "message_required": return "Send a job note first.";
    case "message_too_long": return "That note is too long. Shorten it and send again.";
    case "rate_limited": return "Too many messages at once. Wait a minute and try again.";
    case "session_invalid": return "Your estimator session expired. Refresh and start a new draft.";
    case "draft_missing": return "A draft is not ready yet.";
    case "invalid_email": return "Enter a valid email address.";
    case "recipient_mismatch": return "Use the same email for this draft.";
    case "email_not_configured": return "Email is not enabled yet. You can still copy or download the draft.";
    default: return "Avery could not finish that. Try again in a moment.";
  }
}

async function json(c: Context): Promise<Record<string, unknown>> {
  return await c.req.json().catch(() => ({}));
}

export function registerPublicEstimatorRoutes(app: Hono, denyInternal: DenyInternal): void {
  app.post("/manager/public-estimator/session", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const input = await json(c);
    const db = serviceClient();
    try {
      const result = await createOrResumePublicEstimatorSession(db, {
        visitor_token: String(input.visitor_token ?? ""),
        ip: c.req.header("X-Forwarded-For") ?? c.req.header("X-Real-IP") ?? null,
        user_agent: c.req.header("User-Agent") ?? null,
      });
      return c.json({
        visitor_session_id: result.session.id,
        visitor_token: result.visitor_token,
        expires_at: result.session.expires_at,
        employee_id: result.session.employee_id,
        resumed: result.resumed,
      });
    } catch {
      return c.json({ error: "estimator_unavailable", message: publicError("estimator_unavailable") }, 503);
    }
  });

  app.post("/manager/public-estimator/message", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const input = await json(c);
    const db = serviceClient();
    const session = await requirePublicEstimatorSession(db, {
      visitor_session_id: String(input.visitor_session_id ?? ""),
      visitor_token: String(input.visitor_token ?? ""),
    });
    if (!session) return c.json({ error: "session_invalid", message: publicError("session_invalid") }, 401);

    const valid = await validatePublicEstimatorMessage(db, session, input.message);
    if (!valid.ok) return c.json({ error: valid.error, message: publicError(valid.error) }, valid.error === "rate_limited" ? 429 : 400);

    await recordPublicEstimatorMessage(db, session, { direction: "visitor", body: valid.message, status: "received" });
    await recordPublicEstimatorEvent(db, session, "message_sent");
    if (valid.message.length >= 25) await recordPublicEstimatorEvent(db, session, "useful_input");

    const turn = await deliverPublicEstimatorTurnToRuntime(db, {
      session,
      body: valid.message,
      idempotency_key: `public-estimator:${session.id}:${Date.now()}`,
    });
    if (turn.status === "failed") {
      await recordPublicEstimatorEvent(db, session, "message_failed", { turn_job_id: turn.job_id });
      return c.json({ error: "estimator_turn_failed", message: publicError("estimator_turn_failed"), turn_job_id: turn.job_id }, 502);
    }
    const draft = await getCurrentPublicEstimatorDraft(db, session);
    return c.json({
      status: turn.status,
      reply: turn.reply ?? "",
      turn_job_id: turn.job_id,
      run_id: turn.run_id,
      current_draft: draft,
    }, turn.status === "queued" ? 202 : 200);
  });

  app.get("/manager/public-estimator/current-draft", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const db = serviceClient();
    const session = await requirePublicEstimatorSession(db, {
      visitor_session_id: c.req.query("visitor_session_id"),
      visitor_token: c.req.query("visitor_token"),
    });
    if (!session) return c.json({ error: "session_invalid", message: publicError("session_invalid") }, 401);
    const draft = await getCurrentPublicEstimatorDraft(db, session);
    if (!draft) return c.json({ current_draft: null });
    return c.json({ current_draft: draft });
  });

  app.post("/manager/public-estimator/action", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const input = await json(c);
    const db = serviceClient();
    const session = await requirePublicEstimatorSession(db, {
      visitor_session_id: String(input.visitor_session_id ?? ""),
      visitor_token: String(input.visitor_token ?? ""),
    });
    if (!session) return c.json({ error: "session_invalid", message: publicError("session_invalid") }, 401);
    const action = String(input.action ?? "");
    if (action === "trial_intent") {
      await recordPublicEstimatorEvent(db, session, "trial_intent", { source: "free_estimator" });
      await recordPublicEstimatorEvent(db, session, "founder_followup_needed", { reason: "trial_intent" });
      return c.json({ ok: true });
    }
    if (action === "feedback") {
      await recordPublicEstimatorEvent(db, session, "feedback", { note: String(input.note ?? "").slice(0, 1000) });
      return c.json({ ok: true });
    }
    if (action !== "copy" && action !== "download") {
      return c.json({ error: "action_not_permitted", message: publicError("action_not_permitted") }, 400);
    }
    const draft = await getCurrentPublicEstimatorDraft(db, session);
    if (!draft) return c.json({ error: "draft_missing", message: publicError("draft_missing") }, 404);
    if (action === "copy") {
      await recordPublicEstimatorEvent(db, session, "draft_copied", { artifact_id: draft.artifact_id });
      return c.json({ ok: true, text: draft.text, artifact_id: draft.artifact_id });
    }
    await recordPublicEstimatorEvent(db, session, "draft_downloaded", { artifact_id: draft.artifact_id, format: "html" });
    return c.json({
      ok: true,
      artifact_id: draft.artifact_id,
      filename: `amtech-estimate-draft-${draft.artifact_id}.html`,
      mime_type: "text/html",
      body: draft.html,
    });
  });

  app.post("/manager/public-estimator/email", async (c) => {
    const denied = denyInternal(c);
    if (denied) return denied;
    const input = await json(c);
    const db = serviceClient();
    const session = await requirePublicEstimatorSession(db, {
      visitor_session_id: String(input.visitor_session_id ?? ""),
      visitor_token: String(input.visitor_token ?? ""),
    });
    if (!session) return c.json({ error: "session_invalid", message: publicError("session_invalid") }, 401);
    const result = await sendPublicEstimatorDraftEmail(db, session, input.email);
    if (result.status === "sent" || result.status === "duplicate") return c.json(result);
    return c.json({
      ...result,
      error: result.safe_reason ?? "email_failed",
      message: publicError(result.safe_reason ?? "email_failed"),
    }, result.safe_reason === "draft_missing" ? 404 : result.safe_reason === "invalid_email" || result.safe_reason === "recipient_mismatch" ? 400 : 503);
  });
}
