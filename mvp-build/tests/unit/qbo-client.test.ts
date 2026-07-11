/**
 * qbo-client is the sole QBO REST boundary. It wraps @apigrate/quickbooks's
 * QboConnector (which ships no test suite of its own). @apigrate makes its HTTP
 * calls through node-fetch, which is externalized by vitest and cannot be
 * intercepted from a unit test without hitting the real Intuit network — so
 * these tests mock @apigrate's QboConnector at the client boundary and exercise
 * the code qbo-client actually owns: which method it calls per operation, and
 * how it shapes each response (query -> entities+count; create -> id/SyncToken/
 * intuit_tid; company info + reports). @apigrate's own HTTP/throttle/refresh
 * behavior is verified by source review and the (pending) live acceptance
 * harness (infra/scripts/acceptance/run9-quickbooks.mjs).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  responses: {} as Record<string, unknown>,
  calls: [] as Array<{ handle: string; method: string; arg: unknown }>,
  intuitTid: "tid_test" as string | null,
}));

vi.mock("@apigrate/quickbooks", () => {
  function entityApi(handle: string) {
    const record = (method: string) => async (arg: unknown) => {
      state.calls.push({ handle, method, arg });
      const key = `${handle}.${method}`;
      if (!(key in state.responses)) throw new Error(`no canned response for ${key}`);
      return state.responses[key];
    };
    return { create: record("create"), get: record("get"), query: record("query") };
  }
  class QboConnector {
    accounting: Record<string, unknown> & { intuit_tid: string | null } = { intuit_tid: state.intuitTid };
    constructor(_cfg: unknown) {}
    accountingApi() {
      return new Proxy(this.accounting, { get: (target, prop: string) => (prop in target ? target[prop] : entityApi(prop)) });
    }
    doFetch = vi.fn();
  }
  class ApiError extends Error {}
  class ApiThrottlingError extends ApiError {}
  return { QboConnector, ApiError, ApiThrottlingError };
});

import { createEntity, getCompanyInfo, queryEntity, runReport } from "../../apps/manager/src/lib/qbo-client";

const config = { access_token: "at", realm_id: "realm_1", environment: "sandbox" as const };

beforeEach(() => {
  state.responses = {};
  state.calls = [];
  state.intuitTid = "tid_test";
});
afterEach(() => vi.clearAllMocks());

describe("qbo-client: queryEntity", () => {
  it("calls the entity's query method and parses QueryResponse into entities + count", async () => {
    state.responses["Vendor.query"] = { QueryResponse: { Vendor: [{ Id: "1", DisplayName: "Sherwin-Williams" }, { Id: "2", DisplayName: "Home Depot" }], totalCount: 2 } };
    const page = await queryEntity(config, "Vendor", "select * from Vendor");
    expect(page.count).toBe(2);
    expect(page.entities).toHaveLength(2);
    expect(state.calls[0]).toMatchObject({ handle: "Vendor", method: "query", arg: "select * from Vendor" });
  });

  it("returns an empty page when QBO returns no matching entities", async () => {
    state.responses["Vendor.query"] = { QueryResponse: {} };
    const page = await queryEntity(config, "Vendor", "select * from Vendor where DisplayName = 'nobody'");
    expect(page.count).toBe(0);
    expect(page.entities).toEqual([]);
  });
});

describe("qbo-client: createEntity", () => {
  it("calls create on the entity and extracts id + SyncToken + intuit_tid", async () => {
    state.responses["Purchase.create"] = { Purchase: { Id: "42", SyncToken: "0" } };
    const result = await createEntity(config, "Purchase", { PaymentType: "Cash" });
    expect(result.qbo_entity_id).toBe("42");
    expect(result.qbo_sync_token).toBe("0");
    expect(result.intuit_tid).toBe("tid_test");
    expect(state.calls[0]).toMatchObject({ handle: "Purchase", method: "create" });
  });

  it("throws for an entity type not in the writable set (never silently no-ops)", async () => {
    await expect(createEntity(config, "Wombat", {})).rejects.toThrow(/not_writable/);
  });
});

describe("qbo-client: getCompanyInfo + runReport", () => {
  it("reads CompanyInfo for the connector test", async () => {
    state.responses["CompanyInfo.get"] = { CompanyInfo: { CompanyName: "Miller Painting" } };
    const company = await getCompanyInfo(config);
    expect((company as { CompanyName?: string }).CompanyName).toBe("Miller Painting");
  });

  it("fetches a report via the report handle's query method", async () => {
    state.responses["ProfitAndLossReport.query"] = { Header: { ReportName: "ProfitAndLoss" }, Rows: { Row: [] } };
    const raw = await runReport(config, "ProfitAndLoss", { date_macro: "This Fiscal Year" });
    expect((raw as { Header?: { ReportName?: string } }).Header?.ReportName).toBe("ProfitAndLoss");
    expect(state.calls[0]).toMatchObject({ handle: "ProfitAndLossReport", method: "query" });
  });
});
