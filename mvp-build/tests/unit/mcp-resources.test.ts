import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

function rpc(method: string, params: unknown, id = 1): Request {
  return new Request("http://manager.local/manager/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
}

function parse(text: string): Record<string, any> {
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    const line = text.split("\n").reverse().find((l) => l.startsWith("data:"));
    return JSON.parse((line ?? "").slice(5).trim()) as Record<string, any>;
  }
}

describe("Manager MCP resources", () => {
  let handleManagerMcpRequest: typeof import("../../apps/manager/src/lib/mcp-server").handleManagerMcpRequest;

  beforeEach(async () => {
    ({ handleManagerMcpRequest } = await import("../../apps/manager/src/lib/mcp-server"));
    state.db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1", name: "Sage", status: "live" }],
      connector_accounts: [{ id: "conn_1", employee_id: "emp_1", account_id: "acct_1", connector_key: "gmail", provider: "gmail", status: "connected", external_email: "owner@example.com", token_secret_ref: "sealed:do-not-leak" }],
      business_brain_facts: [{ id: "fact_1", account_id: "acct_1", employee_id: "emp_1", fact_key: "service_area", fact_value: "Scranton", category: "general", confidence: "high", updated_at: "2026-07-04T00:00:00Z" }],
    });
  });

  it("lists read-only Manager resources", async () => {
    const res = await handleManagerMcpRequest(rpc("resources/list", {}), { account_id: "acct_1", employee_id: "emp_1" });
    const body = parse(await res.text());
    const uris = body.result.resources.map((r: { uri: string }) => r.uri);
    expect(uris).toContain("amtech://manager/capability-registry");
    expect(uris).toContain("amtech://manager/connector-status");
  });

  it("reads resources through bound identity and redacts secret refs", async () => {
    const res = await handleManagerMcpRequest(
      rpc("resources/read", { uri: "amtech://manager/connector-status" }),
      { account_id: "acct_1", employee_id: "emp_1" },
    );
    const body = parse(await res.text());
    const text = body.result.contents[0].text as string;
    expect(text).toContain("owner@example.com");
    expect(text).not.toContain("sealed:do-not-leak");
    expect(text).not.toContain("token_secret_ref");
  });

  it("does not read scoped data without bound identity", async () => {
    const res = await handleManagerMcpRequest(rpc("resources/read", { uri: "amtech://manager/business-brain" }));
    const body = parse(await res.text());
    expect(body.result.contents[0].text).toContain("identity_required");
  });
});
