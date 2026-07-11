/**
 * The ONLY QuickBooks Online REST boundary. Constructs a fresh @apigrate/
 * quickbooks QboConnector per call from an already-fresh access token
 * (qbo-tokens.ts) — never a long-lived singleton, and never used for its own
 * OAuth (intuit-oauth exclusively owns refresh-token rotation; see
 * quickbooks-connector-implementation-plan.md's Client Library Decision).
 * Exposes a narrow typed function per operation AMTECH actually uses, plus a
 * documented qboRawFetch escape hatch for a genuine future gap. No raw
 * tokens/entity payloads/untrusted memo text in logs.
 */
import { QboConnector, ApiError, ApiThrottlingError } from "@apigrate/quickbooks";
import type { QboEnvironment } from "./qbo-tokens.js";

export interface QboClientConfig {
  access_token: string;
  realm_id: string;
  environment: QboEnvironment;
}

export { ApiError, ApiThrottlingError };

/**
 * This connector is NEVER used for OAuth — intuit-oauth (qbo-tokens.ts)
 * exclusively owns refresh-token rotation. But @apigrate's QboConnector
 * constructor requires client_id/client_secret/redirect_uri, and its doFetch
 * requires a truthy refresh_token, even though the only methods we call
 * (entity/query/report) touch none of them. These inert placeholders satisfy
 * the constructor + the doFetch precondition; @apigrate's own OAuth methods
 * (getAccessToken/getIntuitAuthorizationUrl/disconnect) are never invoked, so
 * the placeholders are never actually used to authenticate anything. If a
 * genuine 401 arrives, @apigrate's internal self-heal (getAccessToken, which
 * would need real OAuth creds) fails loud rather than silently — surfacing as
 * a clear provider_error, which is the intended behavior since qbo-tokens.ts
 * is the one place that refreshes.
 */
const INERT = "managed-externally-by-qbo-tokens";

function connectorFor(config: QboClientConfig): QboConnector {
  const connector = new QboConnector({
    client_id: INERT,
    client_secret: INERT,
    redirect_uri: INERT,
    access_token: config.access_token,
    refresh_token: INERT,
    realm_id: config.realm_id,
    is_sandbox: config.environment === "sandbox",
  });
  return connector;
}

function api(config: QboClientConfig) {
  return connectorFor(config).accountingApi();
}

// --- Connector health check ---------------------------------------------

export async function getCompanyInfo(config: QboClientConfig): Promise<Record<string, unknown>> {
  const result = await api(config).CompanyInfo!.get!(config.realm_id);
  return (result as { CompanyInfo?: Record<string, unknown> }).CompanyInfo ?? result;
}

// --- Entity resolution (qbo-lookup.ts calls these) ----------------------

export interface QboQueryPage {
  entities: Record<string, unknown>[];
  count: number;
}

const LIST_ENTITY_HANDLES: Record<string, string> = {
  Customer: "Customer",
  Vendor: "Vendor",
  Account: "Account",
  Item: "Item",
  Class: "Class",
  Department: "Department",
};

/** Raw SQL-like query against one entity, used both by qbo-lookup.ts's
 *  name-resolution caches and qbo-query.ts's generic query_quickbooks tool. */
export async function queryEntity(config: QboClientConfig, entity: string, queryStatement: string): Promise<QboQueryPage> {
  const handle = LIST_ENTITY_HANDLES[entity] ?? entity;
  const entityApi = api(config)[handle];
  if (!entityApi?.query) throw new Error(`quickbooks_entity_not_queryable:${entity}`);
  const result = (await entityApi.query(queryStatement)) as {
    QueryResponse?: Record<string, unknown[]> & { totalCount?: number; maxResults?: number };
  };
  const qr = result.QueryResponse ?? {};
  const list = (qr[handle] as Record<string, unknown>[] | undefined) ?? [];
  return { entities: list, count: typeof qr.totalCount === "number" ? qr.totalCount : list.length };
}

// --- Write tools (create_expense/create_bill/create_invoice/create_payment,
// each via commit_quickbooks_write) ---------------------------------------

const WRITE_ENTITY_HANDLES: Record<string, string> = {
  Purchase: "Purchase",
  Bill: "Bill",
  Invoice: "Invoice",
  Payment: "Payment",
};

/** Executes exactly one QBO create for the given entity type + canonical
 *  payload. Called ONLY from commit_quickbooks_write (apps/manager/src/tools/
 *  qbo.stub.ts), after the approval-binding check has passed. `opts.reqid` is
 *  passed to Intuit as the request-idempotency key (QBO's `requestid`), so a
 *  re-issued create for the same pending write returns the same entity rather
 *  than double-posting. */
export async function createEntity(config: QboClientConfig, entityType: string, payload: Record<string, unknown>, opts?: { reqid?: string }): Promise<{
  qbo_entity_id: string;
  qbo_sync_token: string | null;
  intuit_tid: string | null;
}> {
  const handle = WRITE_ENTITY_HANDLES[entityType];
  if (!handle) throw new Error(`quickbooks_entity_not_writable:${entityType}`);
  const connector = connectorFor(config);
  const entityApi = connector.accountingApi()[handle];
  if (!entityApi?.create) throw new Error(`quickbooks_entity_not_creatable:${entityType}`);
  const result = (await entityApi.create(payload, opts?.reqid ? { reqid: opts.reqid } : undefined)) as Record<string, Record<string, unknown>>;
  const created = result[handle] ?? {};
  return {
    qbo_entity_id: String(created.Id ?? ""),
    qbo_sync_token: created.SyncToken != null ? String(created.SyncToken) : null,
    intuit_tid: connector.accounting.intuit_tid ?? null,
  };
}

// --- Reports (flattened by the caller in qbo-query.ts's report tools) ---

const REPORT_HANDLES: Record<string, string> = {
  ProfitAndLoss: "ProfitAndLossReport",
  BalanceSheet: "BalanceSheetReport",
  AgedReceivables: "ARAgingSummaryReport",
  AgedPayables: "APAgingSummaryReport",
};

export async function runReport(
  config: QboClientConfig,
  report: "ProfitAndLoss" | "BalanceSheet" | "AgedReceivables" | "AgedPayables",
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const handle = REPORT_HANDLES[report];
  if (!handle) throw new Error(`quickbooks_report_unavailable:${report}`);
  const reportApi = api(config)[handle];
  if (!reportApi?.query) throw new Error(`quickbooks_report_unavailable:${report}`);
  return (await reportApi.query(params)) as Record<string, unknown>;
}

/**
 * Documented escape hatch — NOT the primary implementation strategy. Reuses
 * the same discovered base URL, realm, and fresh access token as every other
 * call in this file; use only when a genuine gap appears in @apigrate/
 * quickbooks's coverage (a new entity, a report it hasn't added, an Intuit
 * API change it hasn't caught up to yet). Currently unused.
 */
export async function qboRawFetch(
  config: QboClientConfig,
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<unknown> {
  const connector = connectorFor(config);
  return connector.doFetch(method, path, null, body ?? null);
}
