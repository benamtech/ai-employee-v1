/**
 * QuickBooks Online connector tools (Phase A). Mirrors gmail.stub.ts /
 * stripe.stub.ts: connect -> OAuth callback -> connector test -> write preview
 * -> approval-gated commit. See mvp-build/docs/quickbooks-connector-*.md.
 *
 * The one property this file guards hardest (the confused-deputy fix both
 * reference repos leave open with their model-flippable draft/confirm boolean):
 * a write NEVER reaches the QBO client without a prior `approved` resolution
 * tied to *that specific* quickbooks_pending_writes row. Each write-preview
 * tool inserts a pending-write row, opens an approval, and binds the returned
 * approval_id onto that row (set once). commit_quickbooks_write is the ONLY
 * path that calls QBO for a write, and only after verifying the caller's
 * approval_id === the row's own stored approval_id (not merely "some approval
 * says approved") and atomically claiming the row.
 *
 * Secrets by reference only (qbo-tokens.ts / secrets.ts); raw tokens, entity
 * payloads, and untrusted memo text never reach a log or the model.
 */
import { createHash } from "node:crypto";
import OAuthClient from "intuit-oauth";
import {
  ID_PREFIX,
  QBO_EXPENSE_WRITE_ACTION_KEYS,
  QBO_BILL_WRITE_ACTION_KEYS,
  QBO_INVOICE_WRITE_ACTION_KEYS,
  QBO_PAYMENT_WRITE_ACTION_KEYS,
  failed,
  needsConfirmation,
  newId,
  ok,
  type CommitQuickbooksWriteInput,
  type CompleteQuickbooksOAuthInput,
  type ConnectQuickbooksInput,
  type CreateBillInput,
  type CreateExpenseInput,
  type CreateInvoiceInput,
  type CreatePaymentInput,
  type QboAgingReportInput,
  type QboReportInput,
  type QueryQuickbooksInput,
  type RunQuickbooksConnectorTestInput,
  type ToolName,
} from "@amtech/shared";
import { type ToolContext, type ToolHandler } from "./types.js";
import { writeAudit } from "../lib/audit.js";
import { mustWrite } from "../lib/db.js";
import { mintOAuthState, verifyOAuthState } from "../lib/oauth-state.js";
import {
  getFreshQboAccessToken,
  qboOAuthClient,
  qboTokenExpiryIso,
  sealQboTokenBundle,
  type QboConnectorTokenRow,
  type QboEnvironment,
} from "../lib/qbo-tokens.js";
import { createEntity, getCompanyInfo, queryEntity, runReport, type QboClientConfig } from "../lib/qbo-client.js";
import { resolveQboEntity, type QboLookupEntityType, type QboLookupResult } from "../lib/qbo-lookup.js";
import { buildQboQuery, flattenQboReport } from "../lib/qbo-query.js";
import { isValidPaymentType, validateExpenseDepartments } from "../lib/qbo-gotchas.js";

const QBO_CONNECTOR_KEY = "accounting";
const QBO_PROVIDER = "quickbooks";
const QBO_SCOPES = [OAuthClient.scopes.Accounting];

// Hashes the EXACT serialized string that is persisted, so the tamper check
// round-trips byte-identically. `canonical_payload` is stored as `text` (not
// `jsonb`) precisely because jsonb normalizes/reorders object keys — hashing a
// jsonb round-trip would never match the hash taken at stage time.
function sha256Hex(serialized: string): string {
  return createHash("sha256").update(serialized).digest("hex");
}

type ConnectorRow = QboConnectorTokenRow & {
  id: string;
  account_id: string;
  employee_id: string;
  status: string;
};

async function employeeBelongsToAccount(ctx: ToolContext, account_id: string, employee_id: string): Promise<boolean> {
  const { data } = await ctx.db.from("employees").select("id").eq("id", employee_id).eq("account_id", account_id).maybeSingle();
  return Boolean(data);
}

async function loadQboConnector(ctx: ToolContext, account_id: string, employee_id: string): Promise<ConnectorRow | null> {
  const { data } = await ctx.db
    .from("connector_accounts")
    .select("*")
    .eq("account_id", account_id)
    .eq("employee_id", employee_id)
    .eq("connector_key", QBO_CONNECTOR_KEY)
    .eq("provider", QBO_PROVIDER)
    .maybeSingle();
  return (data as ConnectorRow | null) ?? null;
}

function environmentOf(input?: { environment?: string }): QboEnvironment {
  return input?.environment === "production" ? "production" : "sandbox";
}

// ---------------------------------------------------------------------------
// connect_quickbooks — create/reuse a pending connector and return the consent URL.
// ---------------------------------------------------------------------------
const connectQuickbooks: ToolHandler = async (ctx, raw) => {
  const input = raw as ConnectQuickbooksInput;
  if (!input?.account_id || !input?.employee_id) {
    return failed("validation_failed", "account_id and employee_id are required.");
  }
  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:connect_quickbooks", result: "denied", details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  try {
    const environment = environmentOf(input);
    const existing = await loadQboConnector(ctx, input.account_id, input.employee_id);
    const connectorId = existing?.id ?? newId(ID_PREFIX.connector);
    if (existing) {
      await ctx.db.from("connector_accounts").update({ provider: QBO_PROVIDER, status: "pending_oauth", environment, last_error: null }).eq("id", connectorId);
    } else {
      await ctx.db.from("connector_accounts").insert({
        id: connectorId, account_id: input.account_id, employee_id: input.employee_id,
        connector_key: QBO_CONNECTOR_KEY, provider: QBO_PROVIDER, status: "pending_oauth",
        environment, scopes: QBO_SCOPES, token_secret_ref: null,
      });
    }
    const state = mintOAuthState(input.employee_id, "quickbooks");
    const consentUrl = qboOAuthClient(environment).authorizeUri({ scope: QBO_SCOPES, state });
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:connect_quickbooks", resource: connectorId, result: "ok",
      details: { provider: QBO_PROVIDER, status: "pending_oauth", environment },
    });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`connector:${connectorId}`],
      proof: { connector_id: connectorId, provider: QBO_PROVIDER, status: "pending_oauth", consent_url: consentUrl },
      user_facing_summary_hint: "QuickBooks consent link created.",
      next_suggested_action: "Send the owner the consent link, then run the connector test after they approve access.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:connect_quickbooks", result: "failed", details: { reason: "consent_url_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Could not create QuickBooks consent link.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// complete_quickbooks_oauth — exchange code, capture realmId, seal tokens.
// Called by the OAuth callback route; derives the employee from the signed state.
// ---------------------------------------------------------------------------
const completeQuickbooksOAuth: ToolHandler = async (ctx, raw) => {
  const input = raw as CompleteQuickbooksOAuthInput;
  const state = input?.state ? verifyOAuthState(input.state) : null;
  if (!state || state.provider !== "quickbooks" || !input?.code || !input?.realmId) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: state?.employee_id ?? null, actor: ctx.actor,
      action: "tool:complete_quickbooks_oauth", result: "denied", details: { reason: "oauth_state_invalid" },
    });
    return failed("signature_invalid", "OAuth state is invalid or expired.", { audit_id });
  }
  const { data: connRaw } = await ctx.db
    .from("connector_accounts").select("*").eq("employee_id", state.employee_id).eq("connector_key", QBO_CONNECTOR_KEY).maybeSingle();
  const connector = connRaw as ConnectorRow | null;
  if (!connector) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: state.employee_id, actor: ctx.actor,
      action: "tool:complete_quickbooks_oauth", result: "failed", details: { reason: "connector_missing" },
    });
    return failed("validation_failed", "No QuickBooks connector to complete. Start with connect_quickbooks.", { employee_id: state.employee_id, audit_id });
  }
  try {
    const environment: QboEnvironment = connector.environment === "production" ? "production" : "sandbox";
    const client = qboOAuthClient(environment);
    // intuit-oauth parses code/realmId from a redirect query string. The realmId
    // arrives on the callback query string (QBO-specific, unlike Gmail).
    await client.createToken(`?code=${encodeURIComponent(input.code)}&realmId=${encodeURIComponent(input.realmId)}`);
    const token = client.getToken();
    if (!token.refresh_token || !token.access_token) {
      const audit_id = await writeAudit(ctx.db, {
        account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
        action: "tool:complete_quickbooks_oauth", resource: connector.id, result: "failed", details: { reason: "no_tokens_returned" },
      });
      return failed("provider_error", "QuickBooks did not return usable tokens; reconnect.", { account_id: connector.account_id, employee_id: connector.employee_id, audit_id });
    }
    const tokenRef = sealQboTokenBundle({ access_token: token.access_token, refresh_token: token.refresh_token });
    await mustWrite(
      ctx.db.from("connector_accounts").update({
        status: "connected", realm_id: input.realmId, environment,
        token_secret_ref: tokenRef, token_expiry: qboTokenExpiryIso(token.expires_in), token_refresh_lease_until: null, last_error: null,
      }).eq("id", connector.id),
      "connector_accounts.qbo_oauth_complete",
    );
    const audit_id = await writeAudit(ctx.db, {
      account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
      action: "tool:complete_quickbooks_oauth", resource: connector.id, result: "ok",
      details: { status: "connected", realm_id: input.realmId, environment },
    });
    return ok({
      account_id: connector.account_id, employee_id: connector.employee_id,
      changed_resources: [`connector:${connector.id}`],
      proof: { connector_id: connector.id, realm_id: input.realmId, status: "connected", environment },
      user_facing_summary_hint: "QuickBooks connected.",
      next_suggested_action: "Run the connector test, then categorize expenses or draft invoices after owner approval.",
      audit_id,
    });
  } catch (err) {
    await ctx.db.from("connector_accounts").update({ last_error: "oauth_exchange_failed" }).eq("id", connector.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: connector.account_id, employee_id: connector.employee_id, actor: ctx.actor,
      action: "tool:complete_quickbooks_oauth", resource: connector.id, result: "failed",
      details: { reason: "oauth_exchange_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "QuickBooks OAuth exchange failed.", { account_id: connector.account_id, employee_id: connector.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// run_quickbooks_connector_test — refresh token, fetch CompanyInfo.
// ---------------------------------------------------------------------------
const runQuickbooksConnectorTest: ToolHandler = async (ctx, raw) => {
  const input = raw as RunQuickbooksConnectorTestInput;
  if (!input?.account_id || !input?.employee_id) {
    return failed("validation_failed", "account_id and employee_id are required.");
  }
  const connector = await loadQboConnector(ctx, input.account_id, input.employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:run_quickbooks_connector_test", result: "failed", details: { reason: "connector_not_connected" },
    });
    return failed("validation_failed", "QuickBooks is not connected yet.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  try {
    const access = await getFreshQboAccessToken(ctx.db, connector);
    const company = await getCompanyInfo({ access_token: access.access_token, realm_id: access.realm_id, environment: access.environment });
    const companyName = String((company as { CompanyName?: string }).CompanyName ?? "");
    await ctx.db.from("connector_accounts").update({ last_connector_test_at: new Date().toISOString(), last_error: null }).eq("id", connector.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:run_quickbooks_connector_test", resource: connector.id, result: "ok",
      details: { realm_id: access.realm_id, environment: access.environment },
    });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      changed_resources: [`connector:${connector.id}`],
      proof: { connector_id: connector.id, realm_id: access.realm_id, environment: access.environment, company_name: companyName },
      user_facing_summary_hint: "QuickBooks connector test passed.",
      next_suggested_action: "Categorize an expense or draft an invoice; every write asks for your approval first.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:run_quickbooks_connector_test", resource: connector.id, result: "failed",
      details: { reason: "connector_test_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "QuickBooks connector test failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// Write preview + approval-binding core (shared by every create_* write tool).
// ---------------------------------------------------------------------------

interface PreparedWrite {
  entity_type: string;
  action_key: string;
  canonical_payload: Record<string, unknown>;
  summary: string;
}

/** A resolver's outcome: a prepared write, an owner-facing disambiguation
 *  prompt, or a validation rejection. */
type PrepareResult =
  | { kind: "ready"; write: PreparedWrite }
  | { kind: "disambiguation"; field: string; candidates: { id: string; name: string }[] }
  | { kind: "rejected"; reason: string };

/** Resolve a name and fold a lookup failure into the PrepareResult shape. */
async function resolveOrHalt(
  config: QboClientConfig,
  connectorId: string,
  entityType: QboLookupEntityType,
  name: string,
): Promise<{ ok: true; id: string } | { ok: false; result: PrepareResult }> {
  const res: QboLookupResult = await resolveQboEntity(config, connectorId, entityType, name);
  if (res.status === "resolved") return { ok: true, id: res.id };
  if (res.status === "needs_disambiguation") {
    return { ok: false, result: { kind: "disambiguation", field: entityType, candidates: res.candidates } };
  }
  return { ok: false, result: { kind: "rejected", reason: `No ${entityType} named "${name}" found in QuickBooks.` } };
}

/** Insert the pending-write row, open the bound approval, write the approval_id
 *  back onto the row (set once), and return a needs_confirmation envelope. This
 *  is the ONLY place approvals for QBO writes are opened, so the pending-write
 *  <-> approval binding can never be omitted. */
async function stageQboWrite(
  ctx: ToolContext,
  input: { account_id: string; employee_id: string },
  connector: ConnectorRow,
  write: PreparedWrite,
) {
  const pendingId = newId(ID_PREFIX.qboPendingWrite);
  // Persist the EXACT serialized bytes (text column) and hash those bytes, so
  // the commit-time integrity check round-trips identically (see sha256Hex).
  const serializedPayload = JSON.stringify(write.canonical_payload);
  const hash = sha256Hex(serializedPayload);
  await mustWrite(
    ctx.db.from("quickbooks_pending_writes").insert({
      id: pendingId,
      account_id: input.account_id,
      employee_id: input.employee_id,
      connector_id: connector.id,
      action_key: write.action_key,
      entity_type: write.entity_type,
      canonical_payload: serializedPayload,
      payload_hash: hash,
      approval_id: null,
      status: "pending_approval",
    }),
    "quickbooks_pending_writes.insert",
  );

  const approvalId = newId(ID_PREFIX.approval);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await mustWrite(
    ctx.db.from("approvals").insert({
      id: approvalId,
      account_id: input.account_id,
      employee_id: input.employee_id,
      action_key: write.action_key,
      summary: write.summary,
      risk_level: "high", // QBO writes always require owner-authenticated resolution.
      refs: { quickbooks_pending_write_id: pendingId, entity_type: write.entity_type },
      channel: null,
      expires_at: expires.toISOString(),
    }),
    "approvals.insert.qbo_write",
  );

  // Bind the approval onto the pending write, exactly once — this is the field
  // commit_quickbooks_write checks against. `.is(approval_id, null)` makes the
  // assignment single-shot even under a retry. Status stays `pending_approval`;
  // the owner-approval truth lives in the approvals row (checked at commit),
  // and commit's compare-and-swap claims `pending_approval` -> `committing`.
  await mustWrite(
    ctx.db.from("quickbooks_pending_writes").update({ approval_id: approvalId, updated_at: new Date().toISOString() })
      .eq("id", pendingId).is("approval_id", null),
    "quickbooks_pending_writes.bind_approval",
  );

  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: `tool:${write.action_key}`, resource: pendingId, result: "needs_confirmation",
    details: { entity_type: write.entity_type, approval_id: approvalId },
  });
  return needsConfirmation({
    action_key: write.action_key,
    summary: write.summary,
    risk_level: "high",
    refs: { quickbooks_pending_write_id: pendingId },
    approval_id: approvalId,
  }, {
    account_id: input.account_id, employee_id: input.employee_id,
    changed_resources: [`quickbooks_pending_write:${pendingId}`, `approval:${approvalId}`],
    proof: { quickbooks_pending_write_id: pendingId, approval_id: approvalId, entity_type: write.entity_type },
    user_facing_summary_hint: write.summary,
    next_suggested_action: "Wait for the owner to approve, then commit_quickbooks_write with this pending_write_id and approval_id.",
    audit_id,
  });
}

/** Shared preview entry: ownership + connection check, fresh access token, then
 *  run the entity-specific resolver/builder and stage the write. */
async function runWritePreview(
  ctx: ToolContext,
  input: { account_id: string; employee_id: string },
  actionName: string,
  prepare: (config: QboClientConfig, connector: ConnectorRow) => Promise<PrepareResult>,
) {
  if (!input?.account_id || !input?.employee_id) {
    return failed("validation_failed", "account_id and employee_id are required.");
  }
  const connector = await loadQboConnector(ctx, input.account_id, input.employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: `tool:${actionName}`, result: "failed", details: { reason: "connector_not_connected" },
    });
    return failed("validation_failed", "QuickBooks is not connected.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  let config: QboClientConfig;
  try {
    const access = await getFreshQboAccessToken(ctx.db, connector);
    config = { access_token: access.access_token, realm_id: access.realm_id, environment: access.environment };
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: `tool:${actionName}`, result: "failed", details: { reason: "token_refresh_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Could not reach QuickBooks (token refresh failed).", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  let prepared: PrepareResult;
  try {
    prepared = await prepare(config, connector);
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: `tool:${actionName}`, result: "failed", details: { reason: "preview_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Could not prepare the QuickBooks write.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  if (prepared.kind === "disambiguation") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: `tool:${actionName}`, result: "failed", details: { reason: "needs_disambiguation", field: prepared.field },
    });
    return failed("validation_failed", `Multiple QuickBooks ${prepared.field} matches — ask the owner which one.`, {
      account_id: input.account_id, employee_id: input.employee_id,
      proof: { needs_disambiguation: true, field: prepared.field, candidates_json: JSON.stringify(prepared.candidates) },
      user_facing_summary_hint: `More than one ${prepared.field} matches — I need to ask which one.`,
      audit_id,
    });
  }
  if (prepared.kind === "rejected") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: `tool:${actionName}`, result: "failed", details: { reason: "preview_rejected" },
    });
    return failed("validation_failed", prepared.reason, {
      account_id: input.account_id, employee_id: input.employee_id,
      user_facing_summary_hint: prepared.reason, audit_id,
    });
  }
  return stageQboWrite(ctx, input, connector, prepared.write);
}

// ---------------------------------------------------------------------------
// create_expense — QBO Purchase (the vertical-slice write).
// ---------------------------------------------------------------------------
const createExpense: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateExpenseInput;
  if (!input?.vendor_name || !input?.account_name || !input?.amount_cents || !input?.payment_type) {
    return failed("validation_failed", "vendor_name, account_name, amount_cents, and payment_type are required.");
  }
  if (!isValidPaymentType(input.payment_type)) {
    return failed("validation_failed", "payment_type must be one of Cash, Check, or CreditCard (QuickBooks requires a PaymentType on every expense).");
  }
  return runWritePreview(ctx, input, "create_expense", async (config, connector) => {
    const dept = validateExpenseDepartments(input.department_name ? [input.department_name] : []);
    if (!dept.ok) return { kind: "rejected", reason: dept.reason! };

    const vendor = await resolveOrHalt(config, connector.id, "Vendor", input.vendor_name);
    if (!vendor.ok) return vendor.result;
    const account = await resolveOrHalt(config, connector.id, "Account", input.account_name);
    if (!account.ok) return account.result;
    let departmentId: string | null = null;
    if (input.department_name) {
      const department = await resolveOrHalt(config, connector.id, "Department", input.department_name);
      if (!department.ok) return department.result;
      departmentId = department.id;
    }

    // QBO Purchase. Note: a live Purchase also needs a header-level paid-from
    // AccountRef (the bank/credit-card account); that second account is out of
    // the vertical slice's Vendor+Account scope and is a Phase-A-live/Phase-B
    // refinement — live acceptance is pending regardless (see the acceptance
    // harness). PaymentType presence (gotchas ledger) is enforced above.
    const canonical_payload: Record<string, unknown> = {
      PaymentType: input.payment_type,
      EntityRef: { value: vendor.id, type: "Vendor" },
      Line: [{
        Amount: input.amount_cents / 100,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: { AccountRef: { value: account.id } },
      }],
      ...(departmentId ? { DepartmentRef: { value: departmentId } } : {}),
      ...(input.memo ? { PrivateNote: input.memo } : {}),
      ...(input.txn_date ? { TxnDate: input.txn_date } : {}),
    };
    return {
      kind: "ready",
      write: {
        entity_type: "Purchase",
        action_key: QBO_EXPENSE_WRITE_ACTION_KEYS[0],
        canonical_payload,
        summary: `Record a ${(input.amount_cents / 100).toFixed(2)} ${input.payment_type} expense to ${input.vendor_name} (${input.account_name}) in QuickBooks.`,
      },
    };
  });
};

// ---------------------------------------------------------------------------
// create_bill — QBO Bill.
// ---------------------------------------------------------------------------
const createBill: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateBillInput;
  if (!input?.vendor_name || !input?.account_name || !input?.amount_cents) {
    return failed("validation_failed", "vendor_name, account_name, and amount_cents are required.");
  }
  return runWritePreview(ctx, input, "create_bill", async (config, connector) => {
    const vendor = await resolveOrHalt(config, connector.id, "Vendor", input.vendor_name);
    if (!vendor.ok) return vendor.result;
    const account = await resolveOrHalt(config, connector.id, "Account", input.account_name);
    if (!account.ok) return account.result;
    const canonical_payload: Record<string, unknown> = {
      VendorRef: { value: vendor.id },
      Line: [{
        Amount: input.amount_cents / 100,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: { AccountRef: { value: account.id } },
      }],
      ...(input.due_date ? { DueDate: input.due_date } : {}),
      ...(input.memo ? { PrivateNote: input.memo } : {}),
      ...(input.txn_date ? { TxnDate: input.txn_date } : {}),
    };
    return {
      kind: "ready",
      write: {
        entity_type: "Bill",
        action_key: QBO_BILL_WRITE_ACTION_KEYS[0],
        canonical_payload,
        summary: `Enter a ${(input.amount_cents / 100).toFixed(2)} bill from ${input.vendor_name} (${input.account_name}) in QuickBooks.`,
      },
    };
  });
};

// ---------------------------------------------------------------------------
// create_invoice — QBO Invoice.
// ---------------------------------------------------------------------------
const createInvoice: ToolHandler = async (ctx, raw) => {
  const input = raw as CreateInvoiceInput;
  if (!input?.customer_name || !Array.isArray(input?.line_items) || input.line_items.length === 0) {
    return failed("validation_failed", "customer_name and at least one line_item are required.");
  }
  return runWritePreview(ctx, input, "create_invoice", async (config, connector) => {
    const customer = await resolveOrHalt(config, connector.id, "Customer", input.customer_name);
    if (!customer.ok) return customer.result;
    const lines: Record<string, unknown>[] = [];
    let total = 0;
    for (const li of input.line_items) {
      const item = await resolveOrHalt(config, connector.id, "Item", li.item_name);
      if (!item.ok) return item.result;
      const amount = (li.quantity * li.unit_price_cents) / 100;
      total += amount;
      lines.push({
        Amount: amount,
        DetailType: "SalesItemLineDetail",
        ...(li.description ? { Description: li.description } : {}),
        SalesItemLineDetail: { ItemRef: { value: item.id }, Qty: li.quantity, UnitPrice: li.unit_price_cents / 100 },
      });
    }
    const canonical_payload: Record<string, unknown> = {
      CustomerRef: { value: customer.id },
      Line: lines,
      ...(input.memo ? { PrivateNote: input.memo } : {}),
      ...(input.txn_date ? { TxnDate: input.txn_date } : {}),
    };
    return {
      kind: "ready",
      write: {
        entity_type: "Invoice",
        action_key: QBO_INVOICE_WRITE_ACTION_KEYS[0],
        canonical_payload,
        summary: `Create a ${total.toFixed(2)} invoice to ${input.customer_name} in QuickBooks.`,
      },
    };
  });
};

// ---------------------------------------------------------------------------
// create_payment — QBO Payment.
// ---------------------------------------------------------------------------
const createPayment: ToolHandler = async (ctx, raw) => {
  const input = raw as CreatePaymentInput;
  if (!input?.customer_name || !input?.amount_cents) {
    return failed("validation_failed", "customer_name and amount_cents are required.");
  }
  return runWritePreview(ctx, input, "create_payment", async (config, connector) => {
    const customer = await resolveOrHalt(config, connector.id, "Customer", input.customer_name);
    if (!customer.ok) return customer.result;
    const canonical_payload: Record<string, unknown> = {
      CustomerRef: { value: customer.id },
      TotalAmt: input.amount_cents / 100,
      ...(input.invoice_ref
        ? { Line: [{ Amount: input.amount_cents / 100, LinkedTxn: [{ TxnId: input.invoice_ref, TxnType: "Invoice" }] }] }
        : {}),
      ...(input.txn_date ? { TxnDate: input.txn_date } : {}),
    };
    return {
      kind: "ready",
      write: {
        entity_type: "Payment",
        action_key: QBO_PAYMENT_WRITE_ACTION_KEYS[0],
        canonical_payload,
        summary: `Record a ${(input.amount_cents / 100).toFixed(2)} payment from ${input.customer_name} in QuickBooks.`,
      },
    };
  });
};

// ---------------------------------------------------------------------------
// commit_quickbooks_write — the ONLY path that writes to QBO. Verifies the
// approval binds to THIS pending write, atomically claims the row, recomputes
// the payload hash, and executes the stored payload exactly once.
// ---------------------------------------------------------------------------
const commitQuickbooksWrite: ToolHandler = async (ctx, raw) => {
  const input = raw as CommitQuickbooksWriteInput;
  if (!input?.account_id || !input?.employee_id || !input?.pending_write_id || !input?.approval_id) {
    return failed("validation_failed", "account_id, employee_id, pending_write_id, and approval_id are required.");
  }

  const { data: rowRaw } = await ctx.db
    .from("quickbooks_pending_writes").select("*")
    .eq("id", input.pending_write_id).eq("account_id", input.account_id).eq("employee_id", input.employee_id).maybeSingle();
  const row = rowRaw as {
    id: string; connector_id: string; entity_type: string; canonical_payload: string;
    payload_hash: string; approval_id: string | null; status: string; qbo_entity_id: string | null;
  } | null;
  if (!row) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", result: "denied", details: { reason: "pending_write_not_found" },
    });
    return failed("unauthorized", "No such pending QuickBooks write for this employee.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Idempotent: already committed → return stored proof, do not re-post.
  if (row.status === "committed" && row.qbo_entity_id) {
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      proof: { quickbooks_pending_write_id: row.id, qbo_entity_id: row.qbo_entity_id, entity_type: row.entity_type, status: "committed", idempotent: true },
      user_facing_summary_hint: "This was already recorded in QuickBooks.",
      audit_id: null,
    });
  }

  // THE confused-deputy fix: the supplied approval_id must be THIS pending
  // write's own bound approval_id — not merely "some approval exists and says
  // approved." An approval legitimately granted for a different pending write
  // (or an unrelated tool) is rejected here even if its resolution is approved.
  if (!row.approval_id || row.approval_id !== input.approval_id) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", resource: row.id, result: "denied",
      details: { reason: "approval_binding_mismatch" },
    });
    return failed("unauthorized", "The approval does not match this pending QuickBooks write.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  const { data: approvalRaw } = await ctx.db.from("approvals").select("*").eq("id", input.approval_id).eq("account_id", input.account_id).eq("employee_id", input.employee_id).maybeSingle();
  const approval = approvalRaw as { resolution: string | null; action_key: string } | null;
  if (!approval || approval.resolution !== "approved") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", resource: row.id, result: "denied",
      details: { reason: "approval_not_resolved", resolution: approval?.resolution ?? null },
    });
    return failed("unauthorized", "A resolved owner approval is required before committing to QuickBooks.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Atomically claim the row: compare-and-swap pending_approval -> committing,
  // the same shape as claim_employee_turn_job. Two concurrent commits of one
  // row: only the winner flips status and gets rows back; the loser gets none.
  // (Owner approval was already verified against the approvals row above; this
  // status guard is the single-commit serialization, not the approval check.)
  const claim = await ctx.db.from("quickbooks_pending_writes").update({ status: "committing", updated_at: new Date().toISOString() })
    .eq("id", row.id).eq("status", "pending_approval").select("*");
  const claimed = (claim.data as unknown[] | null) ?? [];
  if (claimed.length === 0) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", resource: row.id, result: "denied",
      details: { reason: "not_claimable", status: row.status },
    });
    return failed("idempotency_conflict", "This QuickBooks write is already being committed or is not in an approvable state.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Tamper-evidence: recompute the hash from the STORED serialized payload
  // (text, byte-identical round-trip) and compare. The .strict() commit schema
  // already blocks new payload data entering here, so this catches a row
  // mutated by some other bug, not a model re-supplying different args.
  if (sha256Hex(row.canonical_payload) !== row.payload_hash) {
    await ctx.db.from("quickbooks_pending_writes").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", row.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", resource: row.id, result: "failed",
      details: { reason: "payload_hash_mismatch" },
    });
    return failed("validation_failed", "The stored QuickBooks payload failed its integrity check; not committing.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  const connector = await ctx.db.from("connector_accounts").select("*").eq("id", row.connector_id).maybeSingle();
  const connRow = connector.data as ConnectorRow | null;
  if (!connRow || connRow.status !== "connected" || !connRow.token_secret_ref) {
    await ctx.db.from("quickbooks_pending_writes").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", row.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", resource: row.id, result: "failed", details: { reason: "connector_not_connected" },
    });
    return failed("validation_failed", "QuickBooks is not connected.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Deserialize the stored payload (text -> object) for the actual QBO call.
  const storedPayload = JSON.parse(row.canonical_payload) as Record<string, unknown>;

  // Step 1: the irreversible external write. A failure HERE is safe to mark
  // `failed` (the entity was not created, or its state is unknown; the reqid
  // makes a future re-issue idempotent on Intuit's side rather than double-post).
  let result: { qbo_entity_id: string; qbo_sync_token: string | null; intuit_tid: string | null };
  try {
    const access = await getFreshQboAccessToken(ctx.db, connRow);
    result = await createEntity(
      { access_token: access.access_token, realm_id: access.realm_id, environment: access.environment },
      row.entity_type,
      storedPayload,
      { reqid: row.id },
    );
  } catch (err) {
    await ctx.db.from("quickbooks_pending_writes").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", row.id);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:commit_quickbooks_write", resource: row.id, result: "failed",
      details: { reason: "qbo_write_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "The QuickBooks write failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Step 2: the QBO entity now EXISTS. Persisting the committed status must
  // NEVER be allowed to mark the row `failed` — that would hide a real write
  // and (via the compare-and-swap) block any clean retry. Best-effort persist;
  // on failure we still return ok (the write is real) and leave the row
  // `committing` with the id captured in the audit/proof for reconciliation.
  let persisted = true;
  try {
    await mustWrite(
      ctx.db.from("quickbooks_pending_writes").update({
        status: "committed",
        qbo_entity_id: result.qbo_entity_id,
        qbo_sync_token: result.qbo_sync_token,
        intuit_tid: result.intuit_tid,
        committed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", row.id),
      "quickbooks_pending_writes.mark_committed",
    );
  } catch {
    persisted = false;
  }
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "tool:commit_quickbooks_write", resource: row.id, result: "ok",
    details: { entity_type: row.entity_type, qbo_entity_id: result.qbo_entity_id, approval_id: input.approval_id, persisted },
  });
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    changed_resources: [`quickbooks_pending_write:${row.id}`],
    proof: { quickbooks_pending_write_id: row.id, qbo_entity_id: result.qbo_entity_id, qbo_sync_token: result.qbo_sync_token, entity_type: row.entity_type, status: "committed", ...(persisted ? {} : { persist_deferred: true }) },
    user_facing_summary_hint: "Recorded in QuickBooks.",
    next_suggested_action: "I will keep this synced; you can ask for a report anytime.",
    audit_id,
  });
};

// ---------------------------------------------------------------------------
// query_quickbooks — one whitelisted read tool across entities (ungated read).
// ---------------------------------------------------------------------------
const queryQuickbooks: ToolHandler = async (ctx, raw) => {
  const input = raw as QueryQuickbooksInput;
  if (!input?.account_id || !input?.employee_id || !input?.entity) {
    return failed("validation_failed", "account_id, employee_id, and entity are required.");
  }
  const built = buildQboQuery({ entity: input.entity, filters: input.filters, fields: input.fields, limit: input.limit, start_position: input.start_position });
  if (!built.ok) {
    return failed("validation_failed", built.reason, { account_id: input.account_id, employee_id: input.employee_id, user_facing_summary_hint: built.reason });
  }
  const connector = await loadQboConnector(ctx, input.account_id, input.employee_id);
  if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
    return failed("validation_failed", "QuickBooks is not connected.", { account_id: input.account_id, employee_id: input.employee_id });
  }
  try {
    const access = await getFreshQboAccessToken(ctx.db, connector);
    const page = await queryEntity({ access_token: access.access_token, realm_id: access.realm_id, environment: access.environment }, input.entity, built.queryStatement);
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:query_quickbooks", resource: connector.id, result: "ok", details: { entity: input.entity, count: page.count },
    });
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      proof: { entity: input.entity, count: page.count, results_json: JSON.stringify(page.entities) },
      user_facing_summary_hint: `Found ${page.count} ${input.entity} record(s) in QuickBooks.`,
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:query_quickbooks", result: "failed", details: { reason: "query_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "QuickBooks query failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
};

// ---------------------------------------------------------------------------
// Reports (ungated reads). Each flattens the nested QBO report JSON.
// ---------------------------------------------------------------------------
function reportHandler(
  toolName: string,
  report: "ProfitAndLoss" | "BalanceSheet" | "AgedReceivables" | "AgedPayables",
  buildParams: (input: QboReportInput & QboAgingReportInput) => Record<string, string>,
): ToolHandler {
  return async (ctx, raw) => {
    const input = raw as QboReportInput & QboAgingReportInput;
    if (!input?.account_id || !input?.employee_id) {
      return failed("validation_failed", "account_id and employee_id are required.");
    }
    const connector = await loadQboConnector(ctx, input.account_id, input.employee_id);
    if (!connector || connector.status !== "connected" || !connector.token_secret_ref) {
      return failed("validation_failed", "QuickBooks is not connected.", { account_id: input.account_id, employee_id: input.employee_id });
    }
    try {
      const access = await getFreshQboAccessToken(ctx.db, connector);
      const raw = await runReport({ access_token: access.access_token, realm_id: access.realm_id, environment: access.environment }, report, buildParams(input));
      const flat = flattenQboReport(raw);
      const audit_id = await writeAudit(ctx.db, {
        account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
        action: `tool:${toolName}`, resource: connector.id, result: "ok", details: { report, rows: flat.rows.length },
      });
      return ok({
        account_id: input.account_id, employee_id: input.employee_id,
        proof: { report: flat.report_name, row_count: flat.rows.length, report_json: JSON.stringify(flat) },
        user_facing_summary_hint: `${flat.report_name} ready.`,
        audit_id,
      });
    } catch (err) {
      const audit_id = await writeAudit(ctx.db, {
        account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
        action: `tool:${toolName}`, result: "failed", details: { reason: "report_failed", message: String((err as Error).message ?? err) },
      });
      return failed("provider_error", "QuickBooks report failed.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
    }
  };
}

const getProfitAndLoss = reportHandler("get_profit_and_loss", "ProfitAndLoss", (input) => ({
  ...(input.start_date ? { start_date: input.start_date } : {}),
  ...(input.end_date ? { end_date: input.end_date } : {}),
  ...(input.date_macro ? { date_macro: input.date_macro } : {}),
}));
const getBalanceSheet = reportHandler("get_balance_sheet", "BalanceSheet", (input) => ({
  ...(input.start_date ? { start_date: input.start_date } : {}),
  ...(input.end_date ? { end_date: input.end_date } : {}),
  ...(input.date_macro ? { date_macro: input.date_macro } : {}),
}));
const getAgedReceivables = reportHandler("get_aged_receivables", "AgedReceivables", (input) => ({
  ...(input.report_date ? { report_date: input.report_date } : {}),
}));
const getAgedPayables = reportHandler("get_aged_payables", "AgedPayables", (input) => ({
  ...(input.report_date ? { report_date: input.report_date } : {}),
}));

// ---------------------------------------------------------------------------
// Phase B seams — registered/discoverable now, honestly not_supported_yet
// until Phase B (never a faked success).
// ---------------------------------------------------------------------------
function notSupportedYet(toolName: string): ToolHandler {
  return async (ctx, raw) => {
    const input = (raw ?? {}) as { account_id?: string; employee_id?: string };
    return failed("validation_failed", `${toolName} is planned for QuickBooks Phase B and is not available yet.`, {
      account_id: input.account_id ?? null, employee_id: input.employee_id ?? null,
      proof: { not_supported_yet: true, tool: toolName },
    });
  };
}

export const qboTools: Partial<Record<ToolName, ToolHandler>> = {
  connect_quickbooks: connectQuickbooks,
  complete_quickbooks_oauth: completeQuickbooksOAuth,
  run_quickbooks_connector_test: runQuickbooksConnectorTest,
  create_expense: createExpense,
  create_bill: createBill,
  create_invoice: createInvoice,
  create_payment: createPayment,
  commit_quickbooks_write: commitQuickbooksWrite,
  query_quickbooks: queryQuickbooks,
  get_profit_and_loss: getProfitAndLoss,
  get_balance_sheet: getBalanceSheet,
  get_aged_receivables: getAgedReceivables,
  get_aged_payables: getAgedPayables,
  // Phase B seams
  update_expense: notSupportedYet("update_expense"),
  update_bill: notSupportedYet("update_bill"),
  update_invoice: notSupportedYet("update_invoice"),
  create_deposit: notSupportedYet("create_deposit"),
  create_journal_entry: notSupportedYet("create_journal_entry"),
  update_journal_entry: notSupportedYet("update_journal_entry"),
  create_bill_payment: notSupportedYet("create_bill_payment"),
};
