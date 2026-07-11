/**
 * QuickBooks Online generic query builder + report flattening. One read tool
 * across all entities (query_quickbooks) instead of ~40 search_* tools,
 * consistent with the schema-first, lean-tool-surface philosophy already used
 * elsewhere in the registry. Enforces a per-entity filterable-fields
 * whitelist (adapted from quickbooks-api-gotchas.md) and rejects unsafe
 * single-quoted string literals before interpolation — the same boundary
 * doubles as this surface's injection-safety control.
 *
 * Whitelist adapted from Intuit's Data Queries doc + laf-rge/quickbooks-mcp's
 * filterable-fields.ts at research time; re-verify against
 * developer.intuit.com before widening entity coverage in Phase B.
 */

const FILTERABLE_FIELDS: Record<string, string[]> = {
  Vendor: ["Id", "DisplayName", "Active", "Balance"],
  Customer: ["Id", "DisplayName", "Active", "Balance"],
  Account: ["Id", "Name", "Active", "AccountType", "Classification"],
  Item: ["Id", "Name", "Active", "Type"],
  Class: ["Id", "Name", "Active"],
  Department: ["Id", "Name", "Active"],
  // DepartmentRef/AccountRef are deliberately NOT filterable on transaction
  // entities (quickbooks-api-gotchas.md) even though the fields exist on the
  // entity — use report endpoints (P&L, Balance Sheet) for that filtering.
  Invoice: ["Id", "TxnDate", "DueDate", "TotalAmt", "Balance", "CustomerRef", "DocNumber"],
  Bill: ["Id", "TxnDate", "DueDate", "TotalAmt", "Balance", "VendorRef", "DocNumber"],
  Purchase: ["Id", "TxnDate", "TotalAmt", "PaymentType", "EntityRef"],
  Payment: ["Id", "TxnDate", "TotalAmt", "CustomerRef"],
  JournalEntry: ["Id", "TxnDate", "DocNumber"],
  Deposit: ["Id", "TxnDate", "TotalAmt"],
  SalesReceipt: ["Id", "TxnDate", "TotalAmt", "CustomerRef", "DocNumber"],
};

export interface QboQueryRequest {
  entity: string;
  filters?: Record<string, string>;
  fields?: string[];
  limit?: number;
  start_position?: number;
}

export type QboQueryBuildResult =
  | { ok: true; queryStatement: string }
  | { ok: false; reason: string };

// A value that could break out of the single-quoted literal it is interpolated
// into. QBO's query language uses single-quoted string literals AND treats a
// backslash as an escape character (\' is an escaped quote), so a value
// containing EITHER a single quote or a backslash could escape/absorb the
// closing quote and alter the WHERE-clause structure. Reject both.
const UNSAFE_LITERAL = /['\\]/;

/** Builds the QBO SQL-like query string, or rejects with a helpful reason
 *  before any API call. Comparison values use single quotes per QBO's query
 *  language; a value containing a quote or backslash is REJECTED (not stripped)
 *  so it can never alter the generated WHERE-clause structure. */
export function buildQboQuery(req: QboQueryRequest): QboQueryBuildResult {
  const whitelist = FILTERABLE_FIELDS[req.entity];
  if (!whitelist) {
    return { ok: false, reason: `quickbooks_entity_not_queryable: "${req.entity}" is not a recognized queryable entity.` };
  }

  const clauses: string[] = [];
  for (const [field, rawValue] of Object.entries(req.filters ?? {})) {
    if (!whitelist.includes(field)) {
      return {
        ok: false,
        reason: `field_not_filterable: "${field}" is not queryable on ${req.entity} in QuickBooks. Try a report endpoint if one covers this field (e.g. department/class filtering lives on P&L/Balance Sheet reports, not transaction queries).`,
      };
    }
    if (UNSAFE_LITERAL.test(rawValue)) {
      return { ok: false, reason: `unsafe_filter_value: the value for "${field}" contains a single quote or backslash, which is not permitted in a QuickBooks query filter.` };
    }
    clauses.push(`${field} = '${rawValue}'`);
  }

  const limit = Math.min(Math.max(req.limit ?? 100, 1), 1000);
  const startPosition = Math.max(req.start_position ?? 1, 1);
  const where = clauses.length ? ` where ${clauses.join(" and ")}` : "";
  return { ok: true, queryStatement: `select * from ${req.entity}${where} startposition ${startPosition} maxresults ${limit}` };
}

// --- Report flattening ----------------------------------------------------
// QBO reports return deeply nested Rows.Row[] (with subtotal rows nesting
// further Rows.Row[]). Flatten to a stable, owner-summarizable shape before
// returning to the employee -- never hand it raw nested report JSON.

export interface FlatReportRow {
  label: string;
  values: string[];
  depth: number;
  is_summary: boolean;
}

export interface FlatReport {
  report_name: string;
  columns: string[];
  rows: FlatReportRow[];
}

interface QboReportColData {
  value?: string;
}

interface QboReportRow {
  type?: string;
  ColData?: QboReportColData[];
  Rows?: { Row?: QboReportRow[] };
  Summary?: { ColData?: QboReportColData[] };
}

function flattenRows(rows: QboReportRow[] | undefined, depth: number, out: FlatReportRow[]): void {
  for (const row of rows ?? []) {
    if (row.ColData?.length) {
      out.push({
        label: row.ColData[0]?.value ?? "",
        values: row.ColData.slice(1).map((c) => c.value ?? ""),
        depth,
        is_summary: false,
      });
    }
    if (row.Rows?.Row) flattenRows(row.Rows.Row, depth + 1, out);
    if (row.Summary?.ColData?.length) {
      out.push({
        label: row.Summary.ColData[0]?.value ?? "Total",
        values: row.Summary.ColData.slice(1).map((c) => c.value ?? ""),
        depth,
        is_summary: true,
      });
    }
  }
}

export function flattenQboReport(raw: Record<string, unknown>): FlatReport {
  const header = raw.Header as { ReportName?: string } | undefined;
  const columns = raw.Columns as { Column?: { ColTitle?: string }[] } | undefined;
  const rowsRoot = raw.Rows as { Row?: QboReportRow[] } | undefined;
  const out: FlatReportRow[] = [];
  flattenRows(rowsRoot?.Row, 0, out);
  return {
    report_name: header?.ReportName ?? "report",
    columns: (columns?.Column ?? []).map((c) => c.ColTitle ?? ""),
    rows: out,
  };
}
