/** Gmail connector tools (Phase 3 — implemented). Spec: 04-manager-tools.md "Gmail",
 *  08-connectors-email-v1.md, 09-event-mesh-v1.md. Connecting always includes the
 *  verify/test step; every external send requires a resolved owner approval; tokens
 *  are stored by secret reference; raw tokens/bodies are never logged. */
import {
  ID_PREFIX,
  failed,
  newId,
  ok,
  type CompleteGmailOAuthInput,
  type ConnectEmailInput,
  type CreateEmailDraftInput,
  type HandleGmailPubsubInput,
  type RenewExpiringWatchesInput,
  type RunEmailConnectorTestInput,
  type SendEmailDraftInput,
  type StartEmailListenerInput,
  type SyncGmailHistoryInput,
  type ToolName,
} from "@amtech/shared";
import { type ToolContext, type ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { mintOAuthState, verifyOAuthState } from "../lib/oauth-state.js";
import {
  exchangeCodeForTokens,
  getMessage,
  getProfile,
  historyList,
  sendMessage,
  watch,
  type GmailMessage,
} from "../lib/google-gmail.js";
import { getFreshAccessToken, sealTokenBundle, tokenExpiryIso, type ConnectorTokenRow } from "../lib/gmail-tokens.js";
import { base64url, buildMimeMessage } from "../lib/mime.js";
import { downloadArtifactPdf } from "../lib/artifacts.js";
import { ingestEvent } from "../events/ingress.js";
import { emitConnectorEvent } from "../lib/connector-events.js";

const DEFAULT_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const SEND_ACTION_KEYS = new Set(["send_estimate_email", "send_email"]);

function gmailRedirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${(process.env.MANAGER_API_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "")}/webhooks/gmail/oauth/callback`;
}

function gmailConsentUrl(state: string, scopes: string[]): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID missing.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

function gmailTopic(): string | undefined {
  return process.env.GMAIL_PUBSUB_TOPIC || undefined;
}

async function employeeBelongsToAccount(ctx: ToolContext, account_id: string, employee_id: string): Promise<boolean> {
  const { data } = await ctx.db
    .from("employees")
    .select("id")
    .eq("id", employee_id)
    .eq("account_id", account_id)
    .maybeSingle();
  return Boolean(data);
}

async function loadEmailConnector(ctx: ToolContext, account_id: string, employee_id: string) {
  const { data } = await ctx.db
    .from("connector_accounts")
    .select("*")
    .eq("account_id", account_id)
    .eq("employee_id", employee_id)
    .eq("connector_key", "email")
    .eq("provider", "gmail")
    .maybeSingle();
  return data as (ConnectorTokenRow & {
    id: string; account_id: string; employee_id: string; status: string; scopes: string[]; external_email: string | null;
  }) | null;
}

function scopesOk(scopes: string[] | null | undefined): boolean {
  const set = new Set(scopes ?? []);
  const canSend = set.has("https://www.googleapis.com/auth/gmail.send");
  const canRead =
    set.has("https://www.googleapis.com/auth/gmail.readonly") ||
    set.has("https://www.googleapis.com/auth/gmail.metadata") ||
    set.has("https://www.googleapis.com/auth/gmail.modify");
  return canSend && canRead;
}

function headerValue(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// ---------------------------------------------------------------------------
// connect_email — create/reuse a pending connector and return the consent URL.
// ---------------------------------------------------------------------------
const connectEmail: ToolHandler = async (ctx, raw) => {
  const input = raw as ConnectEmailInput;
  if (!input?.account_id || !input?.employee_id || input.provider !== "gmail") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null, employee_id: input?.employee_id ?? null, actor: ctx.actor,
      action: "tool:connect_email", result: "failed", details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, and provider=gmail are required.", { audit_id });
  }
  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:connect_email", result: "denied", details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  try {
    const existing = await loadEmailConnector(ctx, input.account_id, input.employee_id);
    const connectorId = existing?.id ?? newId(ID_PREFIX.connector);
    const scopes = input.requested_scopes?.length ? input.requested_scopes : DEFAULT_GMAIL_SCOPES;
    if (existing) {
      await ctx.db.from("connector_accounts").update({ provider: "gmail", status: "pending_oauth", scopes, last_error: null }).eq("id", connectorId);
    } else {
      await ctx.db.from("connector_accounts").insert({
        id: connectorId, account_id: input.account_id, employee_id: input.employee_id,
        connector_key: "email", provider: "gmail", status: "pending_oauth", scopes, token_secret_ref: null,
      });
    }
    const state = mintOAuthState(input.employee_id, "gmail");
    const consentUrl = gmailConsentUrl(state, scopes);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:connect_email", resource: connectorId, result: "ok",
      details: { provider: "gmail", status: "pending_oauth", scopes },
    });
    // Surface the connector-start as a typed work event (web card + SMS line) so the
    // owner can see and click the consent link — not just a footer string. Best-effort.
    await emitConnectorEvent(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id,
      provider: "gmail", connector_id: connectorId, status: "pending_oauth", consent_url: consentUrl,
    });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`connector:${connectorId}`],
      proof: { connector_id: connectorId, provider: "gmail", status: "pending_oauth", consent_url: consentUrl },
      user_facing_summary_hint: "Gmail consent link created.",
      next_suggested_action: "Send the owner the consent link, then run the connector test after OAuth completes.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:connect_email", result: "failed", details: { reason: "oauth_url_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Could not create Gmail consent link.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// complete_gmail_oauth — exchange code, seal tokens, mark connected, start watch.
// Called by the OAuth callback route; derives the employee from the signed state.
// ---------------------------------------------------------------------------
const completeGmailOAuth: ToolHandler = async (ctx, raw) => {
  const input = raw as CompleteGmailOAuthInput;
  const state = input?.state ? verifyOAuthState(input.state) : null;
  if (!state || state.provider !== "gmail" || !input?.code) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: state?.employee_id ?? null, actor: ctx.actor,
      action: "tool:complete_gmail_oauth", result: "denied", details: { reason: "oauth_state_invalid" },
    });
    return failed("signature_invalid", "OAuth state is invalid or expired.", { audit_id });
  }
  const { data: connRaw } = await ctx.db
    .from("connector_accounts").select("*").eq("employee_id", state.employee_id).eq("connector_key", "email").maybeSingle();
  const connector = connRaw as { id: string; account_id: string; employee_id: string; scopes: string[] } | null;
  if (!connector) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: state.employee_id, actor: ctx.actor,
      action: "tool:complete_gmail_oauth", result: "failed", details: { reason: "connector_missing" },
    });
    return failed("validation_failed", "No Gmail connector to complete. Start with connect_email.", { employee_id: state.employee_id, audit_id });
  }

  try {
    const tokens = await exchangeCodeForTokens(input.code, gmailRedirectUri());
    if (!tokens.refresh_token) {
      const audit_id = await writeAudit(ctx.db, {
        account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
        action: "tool:complete_gmail_oauth", resource: connector.id, result: "failed", details: { reason: "no_refresh_token" },
      });
      return failed("provider_error", "Google did not return a refresh token; reconnect with consent prompt.", { account_id: connector.account_id, employee_id: connector.employee_id, audit_id });
    }
    const profile = await getProfile(tokens.access_token);
    const scopes = tokens.scope ? tokens.scope.split(" ") : connector.scopes;
    const tokenRef = sealTokenBundle({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, scope: tokens.scope });
    await ctx.db.from("connector_accounts").update({
      status: "connected", scopes, external_email: profile.emailAddress,
      token_secret_ref: tokenRef, token_expiry: tokenExpiryIso(tokens.expires_in), last_error: null,
    }).eq("id", connector.id);

    // Best-effort watch start so reply listening is live immediately.
    let watchStatus = "unconfigured";
    const topic = gmailTopic();
    if (topic) {
      try {
        const w = await watch(tokens.access_token, topic);
        await ctx.db.from("gmail_watches").insert({
          id: newId(ID_PREFIX.gmailWatch), connector_id: connector.id, topic,
          last_history_id: w.historyId, expiration: new Date(Number(w.expiration)).toISOString(), status: "active",
        });
        watchStatus = "active";
      } catch {
        watchStatus = "watch_failed";
      }
    }

    const audit_id = await writeAudit(ctx.db, {
      account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
      action: "tool:complete_gmail_oauth", resource: connector.id, result: "ok",
      details: { status: "connected", email: profile.emailAddress, scopes, watch_status: watchStatus },
    });
    // The only point allowed to imply "connected": real OAuth callback completed.
    await emitConnectorEvent(ctx.db, {
      account_id: connector.account_id, employee_id: connector.employee_id,
      provider: "gmail", connector_id: connector.id, status: "connected",
    });
    return ok({
      account_id: connector.account_id, employee_id: connector.employee_id,
      changed_resources: [`connector:${connector.id}`],
      proof: { connector_id: connector.id, email: profile.emailAddress, status: "connected", watch_status: watchStatus },
      user_facing_summary_hint: "Gmail connected.",
      next_suggested_action: "Run the connector test, then draft and send the estimate after owner approval.",
      audit_id,
    });
  } catch (err) {
    await ctx.db.from("connector_accounts").update({ last_error: "oauth_exchange_failed" }).eq("id", connector.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
      action: "tool:complete_gmail_oauth", resource: connector.id, result: "failed",
      details: { reason: "oauth_exchange_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Gmail OAuth exchange failed.", { account_id: connector.account_id, employee_id: connector.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// run_email_connector_test — refresh token, fetch identity, verify scopes, watch.
// ---------------------------------------------------------------------------
const runEmailConnectorTest: ToolHandler = async (ctx, raw) => {
  const input = raw as RunEmailConnectorTestInput;
  if (!input?.account_id || !input?.employee_id) {
    return failed("validation_failed", "account_id and employee_id are required.");
  }
  const connector = await loadEmailConnector(ctx, input.account_id, input.employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:run_email_connector_test", result: "failed", details: { reason: "connector_not_connected" },
    });
    return failed("validation_failed", "Gmail is not connected yet.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  try {
    const accessToken = await getFreshAccessToken(ctx.db, connector);
    const profile = await getProfile(accessToken);
    const scopes_ok = scopesOk(connector.scopes);

    let watch_status = "unconfigured";
    let history_id = profile.historyId ?? null;
    const topic = gmailTopic();
    if (topic) {
      try {
        const w = await watch(accessToken, topic);
        history_id = w.historyId;
        const { data: existingWatch } = await ctx.db.from("gmail_watches").select("id").eq("connector_id", connector.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (existingWatch) {
          await ctx.db.from("gmail_watches").update({ last_history_id: w.historyId, expiration: new Date(Number(w.expiration)).toISOString(), status: "active", topic }).eq("id", (existingWatch as { id: string }).id);
        } else {
          await ctx.db.from("gmail_watches").insert({ id: newId(ID_PREFIX.gmailWatch), connector_id: connector.id, topic, last_history_id: w.historyId, expiration: new Date(Number(w.expiration)).toISOString(), status: "active" });
        }
        watch_status = "active";
      } catch {
        watch_status = "watch_unavailable";
      }
    }
    await ctx.db.from("connector_accounts").update({ last_connector_test_at: new Date().toISOString(), external_email: profile.emailAddress, last_error: null }).eq("id", connector.id);

    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:run_email_connector_test", resource: connector.id, result: scopes_ok ? "ok" : "failed",
      details: { email: profile.emailAddress, scopes_ok, watch_status },
    });
    if (!scopes_ok) {
      return failed("validation_failed", "Gmail scopes are insufficient (need send + read).", { account_id: input.account_id, employee_id: input.employee_id, proof: { email: profile.emailAddress, scopes_ok: false }, audit_id });
    }
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`connector:${connector.id}`],
      proof: { connector_id: connector.id, email: profile.emailAddress, scopes_ok: true, watch_status, history_id: history_id ?? "" },
      user_facing_summary_hint: "Gmail connector test passed.",
      next_suggested_action: "Draft the estimate email and request owner approval before sending.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:run_email_connector_test", resource: connector.id, result: "failed",
      details: { reason: "connector_test_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Gmail connector test failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// create_email_draft — validate ownership + attachments, store a draft row.
// ---------------------------------------------------------------------------
const createEmailDraft: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateEmailDraftInput;
  if (!input?.account_id || !input?.employee_id || !input?.to || !input?.subject || !input?.body) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null, employee_id: input?.employee_id ?? null, actor: ctx.actor,
      action: "tool:create_email_draft", result: "failed", details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, to, subject, and body are required.", { audit_id });
  }
  const connector = await loadEmailConnector(ctx, input.account_id, input.employee_id);
  if (!connector) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:create_email_draft", result: "failed", details: { reason: "connector_missing" },
    });
    return failed("validation_failed", "Gmail connector is not started.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  if (input.attachment_artifact_ids?.length) {
    const { data: artifacts } = await ctx.db
      .from("artifacts").select("id").eq("account_id", input.account_id).eq("employee_id", input.employee_id).in("id", input.attachment_artifact_ids);
    if ((artifacts?.length ?? 0) !== input.attachment_artifact_ids.length) {
      const audit_id = await writeAudit(ctx.db, {
        account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
        action: "tool:create_email_draft", result: "failed", details: { reason: "attachment_artifact_not_found" },
      });
      return failed("validation_failed", "One or more attachment artifacts are missing.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
    }
  }

  const draftId = newId(ID_PREFIX.outboundEmail);
  await ctx.db.from("outbound_emails").insert({
    id: draftId, connector_id: connector.id, to_email: input.to, subject: input.subject, body: input.body,
    attachment_artifact_ids: input.attachment_artifact_ids ?? [], gmail_thread_id: input.thread_ref ?? null, sent_status: "draft",
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "tool:create_email_draft", resource: draftId, result: "ok",
    details: { attachment_count: input.attachment_artifact_ids?.length ?? 0, connector_id: connector.id },
  });
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    changed_resources: [`outbound_email:${draftId}`],
    proof: { draft_id: draftId, connector_id: connector.id, sent_status: "draft" },
    user_facing_summary_hint: "Email draft created.",
    next_suggested_action: "Request owner approval, then send_email_draft with the approval id.",
    audit_id,
  });
};

// ---------------------------------------------------------------------------
// send_email_draft — approval-gated real Gmail send with PDF attachment.
// ---------------------------------------------------------------------------
const sendEmailDraft: ToolHandler = async (ctx, raw) => {
  const input = raw as SendEmailDraftInput;
  if (!input?.account_id || !input?.employee_id || !input?.draft_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, draft_id, and approval_id are required.");
  }
  const connector = await loadEmailConnector(ctx, input.account_id, input.employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_email_draft", result: "failed", details: { reason: "connector_not_connected" },
    });
    return failed("validation_failed", "Gmail is not connected.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  const { data: draftRaw } = await ctx.db.from("outbound_emails").select("*").eq("id", input.draft_id).eq("connector_id", connector.id).maybeSingle();
  const draft = draftRaw as {
    id: string; to_email: string; subject: string; body: string; attachment_artifact_ids: string[];
    gmail_thread_id: string | null; gmail_message_id: string | null; sent_status: string;
  } | null;
  if (!draft) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_email_draft", result: "denied", details: { reason: "draft_not_found_or_foreign" },
    });
    return failed("unauthorized", "Draft not found for this connector.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Idempotent: already sent → return stored proof, do not re-send.
  if (draft.sent_status === "sent" && draft.gmail_message_id) {
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      proof: { draft_id: draft.id, gmail_message_id: draft.gmail_message_id, thread_id: draft.gmail_thread_id ?? "", sent_status: "sent", idempotent: true },
      user_facing_summary_hint: "Email already sent.",
      audit_id: null,
    });
  }

  // Hard approval gate.
  const { data: approvalRaw } = await ctx.db.from("approvals").select("*").eq("id", input.approval_id).eq("account_id", input.account_id).eq("employee_id", input.employee_id).maybeSingle();
  const approval = approvalRaw as { resolution: string | null; action_key: string } | null;
  if (!approval || approval.resolution !== "approved" || !SEND_ACTION_KEYS.has(approval.action_key)) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_email_draft", resource: draft.id, result: "denied",
      details: { reason: "approval_not_satisfied", resolution: approval?.resolution ?? null, action_key: approval?.action_key ?? null },
    });
    return failed("unauthorized", "A resolved owner approval is required before sending.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  try {
    // Build attachments from stored estimate PDFs (signed-link fallback in body if missing).
    const attachments: { filename: string; contentType: string; contentBase64: string }[] = [];
    let primaryEstimateId: string | null = null;
    if (draft.attachment_artifact_ids?.length) {
      const { data: arts } = await ctx.db.from("artifacts").select("id,storage_ref").eq("account_id", input.account_id).eq("employee_id", input.employee_id).in("id", draft.attachment_artifact_ids);
      for (const art of (arts ?? []) as { id: string; storage_ref: string | null }[]) {
        primaryEstimateId = primaryEstimateId ?? art.id;
        if (!art.storage_ref) continue;
        const bytes = await downloadArtifactPdf(ctx.db, art.storage_ref);
        attachments.push({ filename: `estimate-${art.id}.pdf`, contentType: "application/pdf", contentBase64: bytes.toString("base64") });
      }
    }

    const accessToken = await getFreshAccessToken(ctx.db, connector);
    const from = connector.external_email ?? "me";
    const mime = buildMimeMessage({ from, to: draft.to_email, subject: draft.subject, text: draft.body, attachments });
    const result = await sendMessage(accessToken, base64url(mime), draft.gmail_thread_id ?? undefined);

    await ctx.db.from("outbound_emails").update({
      gmail_message_id: result.id, gmail_thread_id: result.threadId, approval_id: input.approval_id,
      sent_status: "sent", sent_at: new Date().toISOString(), error: null,
    }).eq("id", draft.id);

    // Track the thread so customer replies are recognized by the event mesh.
    await ctx.db.from("email_threads").upsert({
      id: newId(ID_PREFIX.emailThread), connector_id: connector.id, gmail_thread_id: result.threadId,
      customer_email: draft.to_email, estimate_artifact_id: primaryEstimateId,
    }, { onConflict: "connector_id,gmail_thread_id" });

    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_email_draft", resource: draft.id, result: "ok",
      details: { gmail_message_id: result.id, thread_id: result.threadId, approval_id: input.approval_id, attachment_count: attachments.length },
    });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`outbound_email:${draft.id}`, `email_thread:${result.threadId}`],
      proof: { draft_id: draft.id, gmail_message_id: result.id, thread_id: result.threadId, sent_status: "sent" },
      user_facing_summary_hint: "Estimate email sent.",
      next_suggested_action: "Watch for the customer reply; the employee will surface it.",
      audit_id,
    });
  } catch (err) {
    await ctx.db.from("outbound_emails").update({ sent_status: "failed", error: "send_failed" }).eq("id", draft.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_email_draft", resource: draft.id, result: "failed",
      details: { reason: "send_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Gmail send failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// start/renew watch.
// ---------------------------------------------------------------------------
async function startOrRenewWatch(ctx: ToolContext, account_id: string, employee_id: string, action: "start_email_listener" | "renew_email_watch") {
  const connector = await loadEmailConnector(ctx, account_id, employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    const audit_id = await writeAudit(ctx.db, { account_id, employee_id, actor: ctx.actor, action: `tool:${action}`, result: "failed", details: { reason: "connector_not_connected" } });
    return failed("validation_failed", "Gmail is not connected.", { account_id, employee_id, audit_id });
  }
  const topic = gmailTopic();
  if (!topic) {
    const audit_id = await writeAudit(ctx.db, { account_id, employee_id, actor: ctx.actor, action: `tool:${action}`, resource: connector.id, result: "failed", details: { reason: "pubsub_topic_unconfigured" } });
    return failed("provider_error", "GMAIL_PUBSUB_TOPIC is not configured; reply listener is unavailable.", { account_id, employee_id, audit_id });
  }
  try {
    const accessToken = await getFreshAccessToken(ctx.db, connector);
    const w = await watch(accessToken, topic);
    const { data: existingWatch } = await ctx.db.from("gmail_watches").select("id").eq("connector_id", connector.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existingWatch) {
      await ctx.db.from("gmail_watches").update({ last_history_id: w.historyId, expiration: new Date(Number(w.expiration)).toISOString(), status: "active", topic }).eq("id", (existingWatch as { id: string }).id);
    } else {
      await ctx.db.from("gmail_watches").insert({ id: newId(ID_PREFIX.gmailWatch), connector_id: connector.id, topic, last_history_id: w.historyId, expiration: new Date(Number(w.expiration)).toISOString(), status: "active" });
    }
    const audit_id = await writeAudit(ctx.db, { account_id, employee_id, actor: ctx.actor, action: `tool:${action}`, resource: connector.id, result: "ok", details: { history_id: w.historyId, expiration: w.expiration } });
    return ok({
      account_id, employee_id, changed_resources: [`connector:${connector.id}`],
      proof: { connector_id: connector.id, watch_status: "active", history_id: w.historyId, expiration: new Date(Number(w.expiration)).toISOString() },
      user_facing_summary_hint: "Gmail reply listener active.",
      next_suggested_action: "Renew the watch before its expiration.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id, employee_id, actor: ctx.actor, action: `tool:${action}`, resource: connector.id, result: "failed", details: { reason: "watch_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Gmail watch failed.", { account_id, employee_id, audit_id });
  }
}

const startEmailListener: ToolHandler = async (ctx, raw) => {
  const input = raw as StartEmailListenerInput;
  if (!input?.account_id || !input?.employee_id) return failed("validation_failed", "account_id and employee_id are required.");
  return startOrRenewWatch(ctx, input.account_id, input.employee_id, "start_email_listener");
};

const renewEmailWatch: ToolHandler = async (ctx, raw) => {
  const input = raw as StartEmailListenerInput;
  if (!input?.account_id || !input?.employee_id) return failed("validation_failed", "account_id and employee_id are required.");
  return startOrRenewWatch(ctx, input.account_id, input.employee_id, "renew_email_watch");
};

/**
 * Sweep Gmail watches nearing expiry and renew them (Phase 5 scheduler seam). Gmail
 * watches lapse ~7 days after creation; the scheduler (Hermes cron in prod,
 * `scheduler:tick` in dev) calls this so reply listening never silently dies. Each
 * renewal reuses startOrRenewWatch (which also refreshes the historyId fallback).
 */
const renewExpiringWatches: ToolHandler = async (ctx, raw) => {
  const input = (raw ?? {}) as RenewExpiringWatchesInput;
  const now = input.now ? new Date(input.now) : new Date();
  const within = Math.max(input.within_seconds ?? 86_400, 0);
  const thresholdIso = new Date(now.getTime() + within * 1000).toISOString();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  const { data } = await ctx.db
    .from("gmail_watches")
    .select("id,connector_id,expiration,status")
    .eq("status", "active")
    .lte("expiration", thresholdIso)
    .order("expiration", { ascending: true })
    .limit(limit);
  const watches = (data ?? []) as Array<{ id: string; connector_id: string; expiration: string | null }>;

  const results: Array<{ connector_id: string; status: "renewed" | "failed"; expiration?: string | null }> = [];
  for (const w of watches) {
    const { data: connRaw } = await ctx.db.from("connector_accounts").select("account_id,employee_id").eq("id", w.connector_id).maybeSingle();
    const conn = connRaw as { account_id: string; employee_id: string } | null;
    if (!conn) { results.push({ connector_id: w.connector_id, status: "failed" }); continue; }
    const res = await startOrRenewWatch(ctx, conn.account_id, conn.employee_id, "renew_email_watch");
    if (res.status === "ok") results.push({ connector_id: w.connector_id, status: "renewed", expiration: String(res.proof?.expiration ?? "") });
    else results.push({ connector_id: w.connector_id, status: "failed" });
  }

  const renewed = results.filter((r) => r.status === "renewed");
  const audit_id = await writeAudit(ctx.db, {
    account_id: null, employee_id: null, actor: ctx.actor,
    action: "tool:renew_expiring_watches", result: "ok", details: { candidates: watches.length, renewed: renewed.length },
  });
  return ok({
    account_id: null, employee_id: null,
    changed_resources: renewed.map((r) => `connector:${r.connector_id}`),
    proof: { candidates: watches.length, renewed: renewed.length, results_json: JSON.stringify(results) },
    user_facing_summary_hint: `${renewed.length} watch(es) renewed.`,
    audit_id,
  });
};

// ---------------------------------------------------------------------------
// Shared reply-processing core (handle_gmail_pubsub + sync_gmail_history).
// ---------------------------------------------------------------------------
interface ProcessedReply { ieId: string; thread: { gmail_thread_id: string; estimate_artifact_id: string | null }; messageId: string; threadId: string; snippet: string; from: string }

async function processHistory(
  ctx: ToolContext,
  connector: ConnectorTokenRow & { id: string; account_id: string; employee_id: string },
  startHistoryId: string,
): Promise<{ processed: ProcessedReply[]; lastHistoryId: string | null; status: "ok" | "resynced" }> {
  const accessToken = await getFreshAccessToken(ctx.db, connector);
  const added: { id: string; threadId: string }[] = [];
  let lastHistoryId: string | null = startHistoryId;
  let pageToken: string | undefined;
  try {
    do {
      const resp = await historyList(accessToken, startHistoryId, pageToken);
      if (resp.historyId) lastHistoryId = resp.historyId;
      for (const h of resp.history ?? []) {
        for (const m of h.messagesAdded ?? []) added.push({ id: m.message.id, threadId: m.message.threadId });
      }
      pageToken = resp.nextPageToken;
    } while (pageToken);
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      const profile = await getProfile(accessToken);
      return { processed: [], lastHistoryId: profile.historyId ?? null, status: "resynced" };
    }
    throw err;
  }

  const threadIds = [...new Set(added.map((a) => a.threadId))];
  const { data: threadRows } = await ctx.db.from("email_threads").select("*").eq("connector_id", connector.id).in("gmail_thread_id", threadIds.length ? threadIds : ["__none__"]);
  const threadMap = new Map((threadRows ?? []).map((t: { gmail_thread_id: string }) => [t.gmail_thread_id, t]));

  const processed: ProcessedReply[] = [];
  for (const a of added) {
    const thread = threadMap.get(a.threadId) as { gmail_thread_id: string; estimate_artifact_id: string | null } | undefined;
    if (!thread) continue; // only surface replies on threads we sent estimates on
    const { data: dup } = await ctx.db.from("inbound_email_events").select("id").eq("gmail_message_id", a.id).maybeSingle();
    if (dup) continue;
    let snippet = ""; let from = "";
    try { const msg = await getMessage(accessToken, a.id, "metadata"); snippet = (msg.snippet ?? "").slice(0, 240); from = headerValue(msg, "From"); } catch { /* metadata best-effort */ }
    const ieId = newId(ID_PREFIX.inboundEmailEvent);
    await ctx.db.from("inbound_email_events").insert({
      id: ieId, connector_id: connector.id, gmail_history_id: lastHistoryId, gmail_message_id: a.id,
      gmail_thread_id: a.threadId, normalized_summary: snippet, delivery_status: "pending",
    });
    processed.push({ ieId, thread, messageId: a.id, threadId: a.threadId, snippet, from });
  }

  if (lastHistoryId) {
    await ctx.db.from("gmail_watches").update({ last_history_id: lastHistoryId }).eq("connector_id", connector.id);
  }
  return { processed, lastHistoryId, status: "ok" };
}

async function deliverReplies(ctx: ToolContext, connector: { account_id: string; employee_id: string }, processed: ProcessedReply[]): Promise<number> {
  let delivered = 0;
  for (const r of processed) {
    const res = await ingestEvent(ctx.db, {
      source: "gmail",
      payload: {
        account_id: connector.account_id,
        employee_id: connector.employee_id,
        inbound_email_event_id: r.ieId,
        message_id: r.messageId,
        thread_id: r.threadId,
        from: r.from,
        related_estimate_id: r.thread.estimate_artifact_id,
        snippet: r.snippet,
      },
    });
    await ctx.db.from("inbound_email_events").update({ delivery_status: res.duplicate ? "duplicate" : "delivered" }).eq("id", r.ieId);
    if (!res.duplicate) delivered += 1;
  }
  return delivered;
}

const handleGmailPubsub: ToolHandler = async (ctx, raw) => {
  const input = raw as HandleGmailPubsubInput;
  if (!input?.email_address || !input?.history_id) return failed("validation_failed", "email_address and history_id are required.");
  const { data: connRaw } = await ctx.db.from("connector_accounts").select("*").eq("external_email", input.email_address).eq("connector_key", "email").maybeSingle();
  const connector = connRaw as (ConnectorTokenRow & { id: string; account_id: string; employee_id: string }) | null;
  if (!connector) {
    const audit_id = await writeAudit(ctx.db, { account_id: null, employee_id: null, actor: ctx.actor, action: "tool:handle_gmail_pubsub", result: "failed", details: { reason: "connector_not_found_for_email" } });
    return failed("validation_failed", "No Gmail connector matches the push email address.", { audit_id });
  }
  try {
    const { data: watchRow } = await ctx.db.from("gmail_watches").select("last_history_id").eq("connector_id", connector.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const startHistoryId = (watchRow as { last_history_id: string | null } | null)?.last_history_id ?? input.history_id;
    const { processed, lastHistoryId, status } = await processHistory(ctx, connector, startHistoryId);
    const delivered = await deliverReplies(ctx, connector, processed);
    const audit_id = await writeAudit(ctx.db, {
      account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
      action: "tool:handle_gmail_pubsub", resource: connector.id, result: "ok",
      details: { pubsub_message_id: input.pubsub_message_id ?? null, processed: processed.length, delivered, resync: status === "resynced" },
    });
    return ok({
      account_id: connector.account_id, employee_id: connector.employee_id,
      changed_resources: processed.map((p) => `inbound_email_event:${p.ieId}`),
      proof: { connector_id: connector.id, processed_count: processed.length, delivered_count: delivered, last_history_id: lastHistoryId ?? "", resync: status === "resynced" },
      user_facing_summary_hint: delivered ? "New customer reply processed." : "No new customer replies.",
      next_suggested_action: delivered ? "The employee will surface the reply to the owner." : "Keep the watch renewed.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor, action: "tool:handle_gmail_pubsub", resource: connector.id, result: "failed", details: { reason: "history_processing_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Gmail history processing failed.", { account_id: connector.account_id, employee_id: connector.employee_id, audit_id });
  }
};

const syncGmailHistory: ToolHandler = async (ctx, raw) => {
  const input = raw as SyncGmailHistoryInput;
  if (!input?.account_id || !input?.employee_id) return failed("validation_failed", "account_id and employee_id are required.");
  const connector = await loadEmailConnector(ctx, input.account_id, input.employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    return failed("validation_failed", "Gmail is not connected.", { account_id: input.account_id, employee_id: input.employee_id });
  }
  try {
    const { data: watchRow } = await ctx.db.from("gmail_watches").select("last_history_id").eq("connector_id", connector.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const startHistoryId = input.start_history_id ?? (watchRow as { last_history_id: string | null } | null)?.last_history_id;
    if (!startHistoryId) return failed("validation_failed", "No start_history_id available; run the connector test/watch first.", { account_id: input.account_id, employee_id: input.employee_id });
    const { processed, lastHistoryId, status } = await processHistory(ctx, connector, startHistoryId);
    const delivered = await deliverReplies(ctx, connector, processed);
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:sync_gmail_history", resource: connector.id, result: "ok", details: { processed: processed.length, delivered, resync: status === "resynced" } });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: processed.map((p) => `inbound_email_event:${p.ieId}`),
      proof: { connector_id: connector.id, processed_count: processed.length, delivered_count: delivered, last_history_id: lastHistoryId ?? "", resync: status === "resynced" },
      user_facing_summary_hint: "Gmail history synced.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, { account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor, action: "tool:sync_gmail_history", resource: connector.id, result: "failed", details: { reason: "history_sync_failed", message: String((err as Error).message ?? err) } });
    return failed("provider_error", "Gmail history sync failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

export const gmailTools: Partial<Record<ToolName, ToolHandler>> = {
  connect_email: connectEmail,
  complete_gmail_oauth: completeGmailOAuth,
  run_email_connector_test: runEmailConnectorTest,
  create_email_draft: createEmailDraft,
  send_email_draft: sendEmailDraft,
  start_email_listener: startEmailListener,
  renew_email_watch: renewEmailWatch,
  renew_expiring_watches: renewExpiringWatches,
  handle_gmail_pubsub: handleGmailPubsub,
  sync_gmail_history: syncGmailHistory,
};
