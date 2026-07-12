import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, SCHEMA_UNIQUES, type FakeSupabase } from "./_helpers/fake-supabase";
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
    state.db = makeFakeDb({
      employee_mcp_credentials: [],
      employees: [{ id: "emp_1", account_id: "acct_1", name: "Sage", status: "live", profile_package_key: "contractor_estimator" }],
      employee_profile_builds: [{ id: "build_1", account_id: "acct_1", employee_id: "emp_1", package_key: "contractor_estimator", generated_path: "/profiles/client_emp_1", install_status: "installed", validation_status: "passed", updated_at: "2026-07-04T00:00:00Z" }],
      business_brain_facts: [{ id: "fact_1", account_id: "acct_1", employee_id: "emp_1", fact_key: "service_area", fact_value: "Scranton", category: "general", confidence: "high" }],
    }, { uniques: SCHEMA_UNIQUES });
  });

  it("accepts a valid scoped employee MCP token", async () => {
    const minted = await mintEmployeeMcpCredential(state.db!.asClient(), { account_id: "acct_1", employee_id: "emp_1" });
    const res = await buildApp().request("/manager/mcp", mcpRequest(minted.token));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.result.tools.map((t: { name: string }) => t.name)).toContain("create_estimate_artifact");
  });

  it("returns agent context once per Hermes session using the scoped employee token", async () => {
    const minted = await mintEmployeeMcpCredential(state.db!.asClient(), { account_id: "acct_1", employee_id: "emp_1" });
    const first = await buildApp().request("/manager/agent-context?session_id=sess_1", {
      headers: { Authorization: `Bearer ${minted.token}` },
    });
    const firstJson = await first.json();
    expect(first.status).toBe(200);
    expect(firstJson.context).toContain("Business brain index: amtech://manager/business-brain");
    expect(firstJson.context).not.toContain("Scranton");
    expect(firstJson.proof.estimated_token_cap).toBe(2000);

    const second = await buildApp().request("/manager/agent-context?session_id=sess_1", {
      headers: { Authorization: `Bearer ${minted.token}` },
    });
    const secondJson = await second.json();
    expect(second.status).toBe(200);
    expect(secondJson.context).toBe("");
    expect(secondJson.proof.already_primed).toBe(true);
  });
});
