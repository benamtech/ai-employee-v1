import { ID_PREFIX, newId } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { insertDedup, mustWrite, orThrow } from "./db.js";
import {
  getCurrentPublicEstimatorDraft,
  normalizeVisitorEmail,
  recordPublicEstimatorEvent,
  saveVisitorEmail,
  type PublicEstimatorSession,
} from "./public-estimator.js";
import { sendResendEmail } from "./resend-client.js";

export interface PublicEstimatorEmailResult {
  status: "sent" | "failed" | "duplicate";
  email_send_id: string;
  artifact_id?: string | null;
  provider_message_id?: string | null;
  safe_reason?: string;
}

function fromEmail(): string {
  return process.env.PUBLIC_ESTIMATOR_FROM_EMAIL ?? "";
}

function replyTo(): string {
  return process.env.PUBLIC_ESTIMATOR_REPLY_TO ?? "";
}

function subjectFor(): string {
  return "Your AMTECH estimate draft";
}

function emailHtml(draftHtml: string): string {
  return [
    "<!doctype html><html><body>",
    "<p>Here is the estimate draft Avery prepared for you through AMTECH.</p>",
    "<p>This is a draft with assumptions, not a guaranteed final price.</p>",
    draftHtml.replace(/<\/?html[^>]*>|<\/?head[^>]*>|<meta[^>]*>|<title[^>]*>.*?<\/title>/gis, ""),
    "<p>Want this estimator to remember your pricing, format, materials, service area, and follow-up rules for the next job? Reply to this email and we will set up the free trial.</p>",
    "</body></html>",
  ].join("\n");
}

function emailText(draftText: string): string {
  return [
    "Here is the estimate draft Avery prepared for you through AMTECH.",
    "",
    "This is a draft with assumptions, not a guaranteed final price.",
    "",
    draftText,
    "",
    "Want this estimator to remember your pricing, format, materials, service area, and follow-up rules for the next job? Reply to this email and we will set up the free trial.",
  ].join("\n");
}

function safeFailureReason(code?: string): string {
  if (!code) return "email_failed";
  if (code.includes("disabled") || code.includes("missing") || code.includes("mismatch")) return "email_not_configured";
  if (code.includes("rate")) return "email_rate_limited";
  if (code.includes("validation") || code.includes("invalid")) return "email_validation_failed";
  return "email_failed";
}

export async function sendPublicEstimatorDraftEmail(
  db: SupabaseClient,
  session: PublicEstimatorSession,
  rawEmail: unknown,
): Promise<PublicEstimatorEmailResult> {
  const email = normalizeVisitorEmail(rawEmail);
  if (!email) {
    await recordPublicEstimatorEvent(db, session, "email_failed", { reason: "invalid_email" });
    return { status: "failed", email_send_id: "", safe_reason: "invalid_email" };
  }
  if (session.visitor_email && session.visitor_email !== email) {
    await recordPublicEstimatorEvent(db, session, "email_failed", { reason: "recipient_mismatch" });
    return { status: "failed", email_send_id: "", safe_reason: "recipient_mismatch" };
  }
  if (!session.visitor_email) await saveVisitorEmail(db, session, email);
  const draft = await getCurrentPublicEstimatorDraft(db, session);
  if (!draft) {
    await recordPublicEstimatorEvent(db, session, "email_failed", { reason: "draft_missing" });
    return { status: "failed", email_send_id: "", safe_reason: "draft_missing" };
  }

  const idempotencyKey = `public-estimator:${session.id}:${draft.artifact_id}`;
  await recordPublicEstimatorEvent(db, session, "email_submitted", { artifact_id: draft.artifact_id });
  const sendId = newId(ID_PREFIX.publicEstimatorEmailSend);
  const insert = await insertDedup(
    db.from("public_estimator_email_sends").insert({
      id: sendId,
      visitor_session_id: session.id,
      account_id: session.account_id,
      employee_id: session.employee_id,
      artifact_id: draft.artifact_id,
      recipient_email: email,
      idempotency_key: idempotencyKey,
      status: "pending",
    }),
    "public_estimator.email.insert",
  );
  if (insert.conflict) {
    const existing = orThrow(
      await db.from("public_estimator_email_sends").select("*").eq("idempotency_key", idempotencyKey).maybeSingle(),
      "public_estimator.email.existing",
    ) as { id: string; status: string; provider_message_id?: string | null } | null;
    return {
      status: "duplicate",
      email_send_id: existing?.id ?? "",
      artifact_id: draft.artifact_id,
      provider_message_id: existing?.provider_message_id ?? null,
      safe_reason: existing?.status === "failed" ? "email_already_failed" : undefined,
    };
  }

  const result = await sendResendEmail({
    from: fromEmail(),
    to: email,
    reply_to: replyTo(),
    subject: subjectFor(),
    html: emailHtml(draft.html),
    text: emailText(draft.text),
    idempotency_key: idempotencyKey,
    tags: [
      { name: "surface", value: "public-estimator" },
      { name: "employee_id", value: session.employee_id.slice(0, 64) },
    ],
  });

  if (result.ok) {
    await mustWrite(
      db.from("public_estimator_email_sends").update({
        status: "sent",
        provider_message_id: result.provider_message_id ?? null,
        provider_status: result.provider_status ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", sendId),
      "public_estimator.email.sent",
    );
    await recordPublicEstimatorEvent(db, session, "email_sent", { artifact_id: draft.artifact_id, email_send_id: sendId });
    return {
      status: "sent",
      email_send_id: sendId,
      artifact_id: draft.artifact_id,
      provider_message_id: result.provider_message_id ?? null,
    };
  }

  await mustWrite(
    db.from("public_estimator_email_sends").update({
      status: "failed",
      provider_status: result.provider_status ?? null,
      error_code: result.error_code ?? "email_failed",
      error_message: result.error_message ?? "Email failed.",
      updated_at: new Date().toISOString(),
    }).eq("id", sendId),
    "public_estimator.email.failed",
  );
  const safe = safeFailureReason(result.error_code);
  await recordPublicEstimatorEvent(db, session, "email_failed", { artifact_id: draft.artifact_id, email_send_id: sendId, reason: safe });
  return {
    status: "failed",
    email_send_id: sendId,
    artifact_id: draft.artifact_id,
    safe_reason: safe,
  };
}
