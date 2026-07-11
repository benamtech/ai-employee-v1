/**
 * QuickBooks generic query builder + report flattening. Proves the injection-
 * safety boundary (non-filterable field rejection; single-quote rejection) and
 * that reports are flattened, not handed back as raw nested JSON.
 */
import { describe, expect, it } from "vitest";
import { buildQboQuery, flattenQboReport } from "../../apps/manager/src/lib/qbo-query";

describe("buildQboQuery: filterable-field whitelist", () => {
  it("builds a query for filterable fields", () => {
    const res = buildQboQuery({ entity: "Vendor", filters: { DisplayName: "Sherwin-Williams" } });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.queryStatement).toContain("select * from Vendor");
      expect(res.queryStatement).toContain("DisplayName = 'Sherwin-Williams'");
    }
  });

  it("rejects a filter on a non-filterable field BEFORE any API call, with a report-endpoint hint", () => {
    // DepartmentRef is not queryable on transaction entities per the gotchas ledger.
    const res = buildQboQuery({ entity: "JournalEntry", filters: { DepartmentRef: "3" } });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/not (queryable|filterable)/i);
      expect(res.reason).toMatch(/report/i);
    }
  });

  it("rejects an unrecognized entity", () => {
    const res = buildQboQuery({ entity: "Wombat", filters: {} });
    expect(res.ok).toBe(false);
  });

  it("rejects a single-quote in a filter value so it cannot alter query structure", () => {
    const res = buildQboQuery({ entity: "Vendor", filters: { DisplayName: "O'Brien' or Id > '0" } });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/quote|backslash/i);
  });

  it("rejects a trailing/embedded backslash (QBO treats \\' as an escaped quote, so a backslash could escape the closing quote)", () => {
    const res = buildQboQuery({ entity: "Vendor", filters: { DisplayName: "Acme\\" } });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/backslash/i);
  });

  it("clamps limit and start position into QBO's supported range", () => {
    const res = buildQboQuery({ entity: "Vendor", limit: 999999, start_position: 0 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.queryStatement).toContain("maxresults 1000");
      expect(res.queryStatement).toContain("startposition 1");
    }
  });
});

describe("flattenQboReport", () => {
  it("flattens nested Rows.Row[] with subtotals into a stable owner-summarizable shape", () => {
    const raw = {
      Header: { ReportName: "ProfitAndLoss" },
      Columns: { Column: [{ ColTitle: "" }, { ColTitle: "Total" }] },
      Rows: {
        Row: [
          {
            type: "Section",
            Rows: {
              Row: [
                { ColData: [{ value: "Materials" }, { value: "412.60" }] },
                { ColData: [{ value: "Labor" }, { value: "1000.00" }] },
              ],
            },
            Summary: { ColData: [{ value: "Total Expenses" }, { value: "1412.60" }] },
          },
        ],
      },
    };
    const flat = flattenQboReport(raw);
    expect(flat.report_name).toBe("ProfitAndLoss");
    expect(flat.columns).toEqual(["", "Total"]);
    const labels = flat.rows.map((r) => r.label);
    expect(labels).toContain("Materials");
    expect(labels).toContain("Labor");
    const summary = flat.rows.find((r) => r.is_summary);
    expect(summary?.label).toBe("Total Expenses");
    expect(summary?.values).toEqual(["1412.60"]);
  });

  it("handles an empty report without throwing", () => {
    const flat = flattenQboReport({});
    expect(flat.rows).toEqual([]);
  });
});
