import {
  EMAIL_SEND_ACTION_KEYS,
  INVOICE_SEND_ACTION_KEYS,
  failed,
  ok,
  type ToolName,
  type WorkEventDescriptor,
} from "@amtech/shared";
import type { ToolContext, ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { executeApprovedAction, loadApprovalAuthority } from "../lib/approval-authority.js";
import { DurableEffectAmbiguousError } from "../lib/durable-command-runtime.js";
import { getFreshAccessToken, type ConnectorTokenRow } from "../lib/gmail-tokens.js";
import { base64url, buildMimeMessage } from "../lib/mime.js";
import { sendMessage } from "../lib/google-gmail.js";
import { downloadArtifactPdf } from "../lib/artifacts.js";
import { getFreshQboAccessToken, type QboConnectorTokenRow } from "../lib/qbo-tokens.js";
import { createEntity } from "../lib/qbo-client.js";

const EMAIL_ACTIONS = new Set<string>(EMAIL_SEND_ACTION_KEYS);
const STRIPE_ACTIONS = new Set<string>(INVOICE_SEND_ACTION_KEYS);

interface GmailConnector extends ConnectorTokenRow {
  id: string;
  account_id: string;
  employee_id: string;
  status: string;
  external_email: string | null;
}

interface QboConnector extends QboConnectorTokenRow {
  id: string;
  account_id: string;
  employee_id: string;
  status: string;
}

function stripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing.");
  if (key.startsWith("sk_live_") && process.env.STRIPE_ALLOW_LIVE !== "true") {
    throw new Error("stripe_live_mode_disabled");
  }
  return key;
}

function form(params: Record<string, string | number | boolean | null | undefined>): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) out.set(key, String(value));
  }
  return out;
}

async function stripeRequest<T>(
  path: string,
  body: URLSearchParams,
  input: { stripe_account: string; idempotency_key: string },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://api.stripe.com/v1${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Account": input.stripe_account,
        "Idempotency-Key": input.idempotency_key,
      },
      body,
    });
  } catch (error) {
    throw new DurableEffectAmbiguousError("stripe_transport_outcome_unknown", {
      path,
      error: String((error as Error)?.message ?? error).slice(0, 160),
    });
  }
  const json = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String((json.error as { message?: string } | undefined)?.message ?? `stripe_${response.status}`));
  }
  return json as T;
}

async function loadGmailConnector(ctx: ToolContext, accountId: string, employeeId: string): Promise<GmailConnector | null> {
  const result = await ctx.db.from("connector_accounts")
    .select("*")
    .eq("account_id", accountId)
    .eq("employee_id", employeeId)
    .eq("connector_key", "email")
    .eq("provider", "gmail")
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data as GmailConnector | null;
}

const sendEmailDraft: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; draft_id: string; approval_id: string };
  if (!input?.account_id || !input?.employee_id || !input?.draft_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, draft_id, and approval_id are required.");
  }
  try {
    const [connector, approval] = await Promise.all([
      loadGmailConnector(ctx, input.account_id, input.employee_id),
      loadApprovalAuthority(ctx.db, input.approval_id),
    ]);
    if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
      return failed("validation_failed", "Gmail is not connected.", { account_id: input.account_id, employee_id: input.employee_id });
    }
    if (!approval || !EMAIL_ACTIONS.has(approval.action_key) || approval.resource_class !== "outbound_email" || approval.resource_id !== input.draft_id) {
      throw new Error("approval_email_scope_mismatch");
    }
    const draftResult = await ctx.db.from("outbound_emails")
      .select("*")
      .eq("id", input.draft_id)
      .eq("connector_id", connector.id)
      .eq("assignment_id", approval.assignment_id)
      .maybeSingle();
    if (draftResult.error) throw draftResult.error;
    const draft = draftResult.data as {
      id: string;
      to_email: string;
      subject: string;
      body: string;
      attachment_artifact_ids: string[];
      gmail_thread_id: string | null;
      gmail_message_id: string | null;
      sent_status: string;
    } | null;
    if (!draft) throw new Error("draft_not_found_or_wrong_assignment");

    const execution = await executeApprovedAction(ctx.db, {
      approval_id: input.approval_id,
      action_key: approval.action_key,
      resource_class: "outbound_email",
      resource_id: draft.id,
      provider: "gmail",
      operation: "users.messages.send",
      capability_class: "non_idempotent_ambiguous",
      request: {
        draft_id: draft.id,
        to_email: draft.to_email,
        subject: draft.subject,
        attachment_artifact_ids: draft.attachment_artifact_ids ?? [],
      },
      apply: async () => {
        const attachments: { filename: string; contentType: string; contentBase64: string }[] = [];
        let primaryEstimateId: string | null = null;
        if (draft.attachment_artifact_ids?.length) {
          const artifacts = await ctx.db.from("artifacts")
            .select("id,storage_ref")
            .eq("assignment_id", approval.assignment_id)
            .in("id", draft.attachment_artifact_ids);
          if (artifacts.error) throw artifacts.error;
          for (const artifact of (artifacts.data ?? []) as { id: string; storage_ref: string | null }[]) {
            primaryEstimateId = primaryEstimateId ?? artifact.id;
            if (!artifact.storage_ref) continue;
            const bytes = await downloadArtifactPdf(ctx.db, artifact.storage_ref);
            attachments.push({
              filename: `estimate-${artifact.id}.pdf`,
              contentType: "application/pdf",
              contentBase64: bytes.toString("base64"),
            });
          }
        }
        const accessToken = await getFreshAccessToken(ctx.db, connector);
        const mime = buildMimeMessage({
          from: connector.external_email ?? "me",
          to: draft.to_email,
          subject: draft.subject,
          text: draft.body,
          attachments,
        });
        let sent: { id: string; threadId: string };
        try {
          sent = await sendMessage(accessToken, base64url(mime), draft.gmail_thread_id ?? undefined);
        } catch (error) {
          throw new DurableEffectAmbiguousError("gmail_send_outcome_unknown", {
            error: String((error as Error)?.message ?? error).slice(0, 160),
            draft_id: draft.id,
          });
        }
        let persisted = true;
        const stored = await ctx.db.from("outbound_emails").update({
          gmail_message_id: sent.id,
          gmail_thread_id: sent.threadId,
          approval_id: approval.approval_id,
          sent_status: "sent",
          sent_at: new Date().toISOString(),
          error: null,
        }).eq("id", draft.id).eq("assignment_id", approval.assignment_id);
        if (stored.error) persisted = false;
        if (persisted) {
          await ctx.db.from("email_threads").upsert({
            connector_id: connector.id,
            gmail_thread_id: sent.threadId,
            customer_email: draft.to_email,
            estimate_artifact_id: primaryEstimateId,
          }, { onConflict: "connector_id,gmail_thread_id" }).then(() => undefined, () => undefined);
        }
        return {
          result: {
            draft_id: draft.id,
            gmail_message_id: sent.id,
            thread_id: sent.threadId,
            sent_status: "sent",
            persisted,
          },
          provider_receipt_id: sent.id,
          evidence: {
            thread_id: sent.threadId,
            attachment_count: attachments.length,
            persisted,
          },
        };
      },
    });
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: approval.assignment_id,
      actor: ctx.actor,
      action: "tool:send_email_draft",
      resource: draft.id,
      result: "ok",
      details: {
        approval_id: approval.approval_id,
        snapshot_hash: approval.snapshot_hash,
        command_id: approval.command_id,
        effect_receipt_id: execution.receipt_id,
        replayed: execution.replayed,
      },
    });
    return ok({
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: approval.assignment_id,
      changed_resources: [`outbound_email:${draft.id}`],
      proof: { ...execution.result, approval_id: approval.approval_id, effect_receipt_id: execution.receipt_id, idempotent: execution.replayed },
      user_facing_summary_hint: execution.replayed ? "Email was already sent under this approval." : "Estimate email sent.",
      next_suggested_action: "Watch for the customer reply.",
      audit_id,
    });
  } catch (error) {
    const reason = String((error as Error)?.message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: "tool:send_email_draft",
      resource: input.draft_id,
      result: reason.includes("ambiguous") || reason.includes("outcome_unknown") ? "failed" : "denied",
      details: { reason, approval_id: input.approval_id },
    });
    return failed(reason.includes("outcome_unknown") ? "provider_error" : "unauthorized", "The email was not reported as successfully sent.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      audit_id,
      proof: { denial_reason: reason },
    });
  }
};

const sendDepositInvoice: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; stripe_invoice_row_id: string; approval_id: string };
  if (!input?.account_id || !input?.employee_id || !input?.stripe_invoice_row_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, stripe_invoice_row_id, and approval_id are required.");
  }
  try {
    const approval = await loadApprovalAuthority(ctx.db, input.approval_id);
    if (!approval || !STRIPE_ACTIONS.has(approval.action_key) || approval.resource_class !== "stripe_invoice" || approval.resource_id !== input.stripe_invoice_row_id) {
      throw new Error("approval_stripe_scope_mismatch");
    }
    const connectionResult = await ctx.db.from("stripe_connections")
      .select("id,account_id,employee_id,connected_account_id")
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .maybeSingle();
    if (connectionResult.error) throw connectionResult.error;
    const connection = connectionResult.data as { id: string; connected_account_id: string | null } | null;
    if (!connection?.connected_account_id) throw new Error("stripe_not_connected");
    const invoiceResult = await ctx.db.from("stripe_invoices")
      .select("*")
      .eq("id", input.stripe_invoice_row_id)
      .eq("stripe_connection_id", connection.id)
      .eq("assignment_id", approval.assignment_id)
      .maybeSingle();
    if (invoiceResult.error) throw invoiceResult.error;
    const invoice = invoiceResult.data as {
      id: string;
      stripe_invoice_id: string | null;
      deposit_amount: number | null;
      hosted_invoice_url: string | null;
      status: string;
      estimate_id: string | null;
    } | null;
    if (!invoice?.stripe_invoice_id) throw new Error("stripe_invoice_not_ready");

    const execution = await executeApprovedAction(ctx.db, {
      approval_id: approval.approval_id,
      action_key: approval.action_key,
      resource_class: "stripe_invoice",
      resource_id: invoice.id,
      provider: "stripe",
      operation: "invoices.send",
      capability_class: "native_idempotency",
      provider_idempotency_key: `approval:${approval.approval_id}:stripe-invoice-send`,
      request: {
        stripe_invoice_row_id: invoice.id,
        stripe_invoice_id: invoice.stripe_invoice_id,
        stripe_account: connection.connected_account_id,
      },
      apply: async () => {
        await stripeRequest(`/invoices/${invoice.stripe_invoice_id}/finalize`, form({}), {
          stripe_account: connection.connected_account_id!,
          idempotency_key: `approval:${approval.approval_id}:finalize`,
        });
        const sent = await stripeRequest<{ id: string; status?: string; hosted_invoice_url?: string; invoice_pdf?: string }>(
          `/invoices/${invoice.stripe_invoice_id}/send`,
          form({}),
          {
            stripe_account: connection.connected_account_id!,
            idempotency_key: `approval:${approval.approval_id}:send`,
          },
        );
        let persisted = true;
        const stored = await ctx.db.from("stripe_invoices").update({
          status: "sent",
          hosted_invoice_url: sent.hosted_invoice_url ?? invoice.hosted_invoice_url,
          invoice_pdf: sent.invoice_pdf ?? null,
        }).eq("id", invoice.id).eq("assignment_id", approval.assignment_id);
        if (stored.error) persisted = false;
        return {
          result: {
            stripe_invoice_row_id: invoice.id,
            stripe_invoice_id: sent.id,
            hosted_invoice_url: sent.hosted_invoice_url ?? invoice.hosted_invoice_url,
            status: sent.status ?? "sent",
            persisted,
          },
          provider_receipt_id: sent.id,
          evidence: { hosted_invoice_url: sent.hosted_invoice_url ?? null, persisted },
        };
      },
    });
    const descriptor: WorkEventDescriptor = {
      account_id: input.account_id,
      employee_id: input.employee_id,
      move: "notify",
      title: "Deposit invoice sent",
      summary: `Sent the deposit invoice${invoice.deposit_amount != null ? ` for $${(invoice.deposit_amount / 100).toFixed(2)}` : ""}.`,
      deliverable: {
        type: "money_movement",
        title: "Deposit invoice",
        refs: { stripe_invoice_row_id: invoice.id, stripe_invoice_id: String(execution.result.stripe_invoice_id) },
        leaves_business: true,
        money: { involved: true, amount_cents: invoice.deposit_amount ?? undefined, currency: "usd" },
        reversible: false,
        acceptance: ["acknowledge"],
      },
      proof: { stripe_invoice_id: String(execution.result.stripe_invoice_id), effect_receipt_id: execution.receipt_id },
    };
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: approval.assignment_id,
      actor: ctx.actor,
      action: "tool:send_deposit_invoice",
      resource: invoice.id,
      result: "ok",
      details: { approval_id: approval.approval_id, command_id: approval.command_id, effect_receipt_id: execution.receipt_id, replayed: execution.replayed },
    });
    return ok({
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: approval.assignment_id,
      changed_resources: [`stripe_invoice:${invoice.id}`],
      proof: { ...execution.result, approval_id: approval.approval_id, effect_receipt_id: execution.receipt_id, idempotent: execution.replayed, work_event_descriptor: JSON.stringify(descriptor) },
      user_facing_summary_hint: execution.replayed ? "Deposit invoice was already sent under this approval." : "Deposit invoice sent.",
      next_suggested_action: "Watch for invoice.paid webhook.",
      audit_id,
    });
  } catch (error) {
    const reason = String((error as Error)?.message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: "tool:send_deposit_invoice",
      resource: input.stripe_invoice_row_id,
      result: reason.includes("transport_outcome_unknown") ? "failed" : "denied",
      details: { reason, approval_id: input.approval_id },
    });
    return failed(reason.includes("transport_outcome_unknown") ? "provider_error" : "unauthorized", "The deposit invoice was not reported as successfully sent.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      audit_id,
      proof: { denial_reason: reason },
    });
  }
};

const commitQuickbooksWrite: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id: string; employee_id: string; pending_write_id: string; approval_id: string };
  if (!input?.account_id || !input?.employee_id || !input?.pending_write_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, pending_write_id, and approval_id are required.");
  }
  try {
    const approval = await loadApprovalAuthority(ctx.db, input.approval_id);
    if (!approval || !approval.action_key.startsWith("commit_quickbooks_") || approval.resource_class !== "quickbooks_pending_write" || approval.resource_id !== input.pending_write_id) {
      throw new Error("approval_quickbooks_scope_mismatch");
    }
    const rowResult = await ctx.db.from("quickbooks_pending_writes")
      .select("*")
      .eq("id", input.pending_write_id)
      .eq("account_id", input.account_id)
      .eq("employee_id", input.employee_id)
      .eq("assignment_id", approval.assignment_id)
      .maybeSingle();
    if (rowResult.error) throw rowResult.error;
    const row = rowResult.data as {
      id: string;
      connector_id: string;
      entity_type: string;
      action_key: string;
      canonical_payload: string;
      payload_hash: string;
      approval_id: string | null;
      status: string;
      qbo_entity_id: string | null;
    } | null;
    if (!row || row.action_key !== approval.action_key || (row.approval_id && row.approval_id !== approval.approval_id)) {
      throw new Error("quickbooks_write_approval_binding_mismatch");
    }
    const connectorResult = await ctx.db.from("connector_accounts").select("*").eq("id", row.connector_id).maybeSingle();
    if (connectorResult.error) throw connectorResult.error;
    const connector = connectorResult.data as QboConnector | null;
    if (!connector || connector.status !== "connected" || !connector.token_secret_ref || connector.account_id !== input.account_id || connector.employee_id !== input.employee_id) {
      throw new Error("quickbooks_not_connected_or_wrong_assignment");
    }
    const storedPayload = JSON.parse(row.canonical_payload) as Record<string, unknown>;
    const execution = await executeApprovedAction(ctx.db, {
      approval_id: approval.approval_id,
      action_key: approval.action_key,
      resource_class: "quickbooks_pending_write",
      resource_id: row.id,
      provider: "quickbooks",
      operation: `create.${row.entity_type}`,
      capability_class: "native_idempotency",
      provider_idempotency_key: row.id,
      request: { pending_write_id: row.id, entity_type: row.entity_type, payload_hash: row.payload_hash },
      apply: async () => {
        const access = await getFreshQboAccessToken(ctx.db, connector);
        let created: { qbo_entity_id: string; qbo_sync_token: string | null; intuit_tid: string | null };
        try {
          created = await createEntity(
            { access_token: access.access_token, realm_id: access.realm_id, environment: access.environment },
            row.entity_type,
            storedPayload,
            { reqid: row.id },
          );
        } catch (error) {
          throw new DurableEffectAmbiguousError("quickbooks_write_outcome_unknown", {
            error: String((error as Error)?.message ?? error).slice(0, 160),
            pending_write_id: row.id,
            reqid: row.id,
          });
        }
        let persisted = true;
        const stored = await ctx.db.from("quickbooks_pending_writes").update({
          approval_id: approval.approval_id,
          status: "committed",
          qbo_entity_id: created.qbo_entity_id,
          qbo_sync_token: created.qbo_sync_token,
          intuit_tid: created.intuit_tid,
          committed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", row.id).eq("assignment_id", approval.assignment_id);
        if (stored.error) persisted = false;
        return {
          result: {
            quickbooks_pending_write_id: row.id,
            qbo_entity_id: created.qbo_entity_id,
            qbo_sync_token: created.qbo_sync_token,
            intuit_tid: created.intuit_tid,
            entity_type: row.entity_type,
            status: "committed",
            persisted,
          },
          provider_receipt_id: created.intuit_tid ?? created.qbo_entity_id,
          evidence: { qbo_entity_id: created.qbo_entity_id, intuit_tid: created.intuit_tid, reqid: row.id, persisted },
        };
      },
    });
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: approval.assignment_id,
      actor: ctx.actor,
      action: "tool:commit_quickbooks_write",
      resource: row.id,
      result: "ok",
      details: { approval_id: approval.approval_id, command_id: approval.command_id, effect_receipt_id: execution.receipt_id, replayed: execution.replayed },
    });
    return ok({
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: approval.assignment_id,
      changed_resources: [`quickbooks_pending_write:${row.id}`],
      proof: { ...execution.result, approval_id: approval.approval_id, effect_receipt_id: execution.receipt_id, idempotent: execution.replayed },
      user_facing_summary_hint: execution.replayed ? "This was already recorded in QuickBooks under the approved command." : "Recorded in QuickBooks.",
      next_suggested_action: "Use the stored provider receipt for reconciliation.",
      audit_id,
    });
  } catch (error) {
    const reason = String((error as Error)?.message ?? error);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      actor: ctx.actor,
      action: "tool:commit_quickbooks_write",
      resource: input.pending_write_id,
      result: reason.includes("outcome_unknown") ? "failed" : "denied",
      details: { reason, approval_id: input.approval_id },
    });
    return failed(reason.includes("outcome_unknown") ? "provider_error" : "unauthorized", "The QuickBooks write was not reported as successfully committed.", {
      account_id: input.account_id,
      employee_id: input.employee_id,
      assignment_id: ctx.assignment_id ?? null,
      audit_id,
      proof: { denial_reason: reason },
    });
  }
};

export const approvedActionTools: Partial<Record<ToolName, ToolHandler>> = {
  send_email_draft: sendEmailDraft,
  send_deposit_invoice: sendDepositInvoice,
  commit_quickbooks_write: commitQuickbooksWrite,
};
