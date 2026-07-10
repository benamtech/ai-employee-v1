import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { mintEmployeeMcpCredential } from "../../apps/manager/src/lib/mcp-auth";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

function mcpRequest(token: string): RequestInit {
  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-06-18",
      "X-AMTECH-Account-Id": "acct_spoofed",
      "X-AMTECH-Employee-Id": "emp_spoofed",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  };
}

describe("Manager MCP route auth", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    state.db = makeFakeDb({ employee_mcp_credentials: [] });
  });

  it("accepts a valid scoped employee MCP token", async () => {
    const minted = await mintEmployeeMcpCredential(state.db!.asClient(), { account_id: "acct_1", employee_id: "emp_1" });
    const res = await buildApp().request("/manager/mcp", mcpRequest(minted.token));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.result.tools.map((t: { name: string }) => t.name)).toContain("create_estimate_artifact");
  });
});
