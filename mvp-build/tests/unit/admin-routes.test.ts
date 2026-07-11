import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeSupabase, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

function headers(extra: Record<string, string> = {}) {
  return {
    Authorization: "Bearer test-internal",
    "X-AMTECH-Platform-User-Id": "puser_1",
    ...extra,
  };
}

function seed() {
  return {
    platform_users: [{ id: "puser_1", status: "active", email: "ops@amtech.test" }],
    platform_user_roles: [{ id: "role_1", platform_user_id: "puser_1", role: "platform_operator" }],
    accounts: [{ id: "acct_1", display_name: "Smith Painting", status: "active", account_state: "trial", billing_status: "free_mvp", created_at: "2026-07-10T00:00:00Z" }],
    employees: [{ id: "emp_1", account_id: "acct_1", name: "Sage", status: "live", profile_id: "client_emp_1", needs_reprovision: false }],
    runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", backend_type: "docker", sms_number_e164: "+15555550100", gateway_port: 8123, health: { status: "healthy" } }],
    connector_accounts: [{ id: "conn_1", account_id: "acct_1", employee_id: "emp_1", provider: "gmail", connector_key: "gmail", status: "needs_reauth", token_secret_ref: "secret:raw", last_error: "refresh failed" }],
    approvals: [{ id: "appr_1", account_id: "acct_1", employee_id: "emp_1", action_key: "send_email", summary: "Send email", risk_level: "high", resolution: null }],
    event_repair_queue: [{ id: "repair_1", account_id: "acct_1", employee_id: "emp_1", status: "open", severity: "warn", source: "gmail", event_type: "gmail.reply" }],
    inbound_events: [{ id: "evt_1", account_id: "acct_1", employee_id: "emp_1", source: "gmail", event_type: "gmail.reply", status: "delivered", provider_id: "msg_1", raw_payload: { token: "secret" }, normalized_payload: { work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Reply", summary: "Customer replied." } } }],
    employee_messages: [{ id: "msg_1", account_id: "acct_1", employee_id: "emp_1", direction: "to_owner", body: "Customer replied.", status: "sent", created_at: "2026-07-10T00:01:00Z" }],
    employee_mcp_credentials: [{ id: "mcpc_1", account_id: "acct_1", employee_id: "emp_1", token_hash: "abc", token_prefix: "mcp_old", audience: "/manager/mcp", status: "active" }],
    audit_log: [],
    admin_action_events: [],
    support_access_sessions: [],
    meter_events: [],
  };
}

describe("admin Manager routes", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal";
    delete process.env.ALLOW_ADMIN_BOOTSTRAP;
    state.db = makeFakeDb(seed(), { uniques: SCHEMA_UNIQUES });
  });

  it("requires a DB-backed platform user", async () => {
    const res = await buildApp().request("/manager/admin/dashboard", {
      headers: { Authorization: "Bearer test-internal" },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "platform_user_required" });
  });

  it("requires a support reason before opening account data", async () => {
    const res = await buildApp().request("/manager/admin/accounts/acct_1", {
      headers: headers(),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "support_reason_required" });
  });

  it("returns redacted account detail and writes support access evidence", async () => {
    const res = await buildApp().request("/manager/admin/accounts/acct_1", {
      headers: headers({ "X-AMTECH-Support-Reason": "Investigating pilot readiness before launch" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(JSON.stringify(json)).not.toContain("secret:raw");
    expect(JSON.stringify(json)).not.toContain("\"token\":\"secret\"");
    expect(state.db!.tables.support_access_sessions).toHaveLength(1);
    expect(state.db!.tables.admin_action_events?.some((r) => r.action === "support_access:account_detail")).toBe(true);
  });

  it("scopes account runtime endpoints before applying the support-detail limit", async () => {
    state.db = makeFakeDb({
      ...seed(),
      runtime_endpoints: [
        ...Array.from({ length: 120 }, (_, i) => ({
          id: `rt_other_${i}`,
          employee_id: `emp_other_${i}`,
          backend_type: "docker",
          sms_number_e164: null,
          gateway_port: 9000 + i,
          health: { status: "healthy" },
        })),
        { id: "rt_target", employee_id: "emp_1", backend_type: "docker", sms_number_e164: "+15555550100", gateway_port: 8123, health: { status: "healthy" } },
      ],
    }, { uniques: SCHEMA_UNIQUES });
    const res = await buildApp().request("/manager/admin/accounts/acct_1", {
      headers: headers({ "X-AMTECH-Support-Reason": "Investigating account runtime visibility" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.runtime_endpoints.map((r: { id: string }) => r.id)).toEqual(["rt_target"]);
  });

  it("rotates scoped MCP credentials without returning the raw token", async () => {
    const res = await buildApp().request("/manager/admin/support-action", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json", "X-AMTECH-Support-Reason": "Rotating compromised scoped credential" }),
      body: JSON.stringify({
        action: "rotate_mcp_credential",
        account_id: "acct_1",
        employee_id: "emp_1",
        reason: "Rotating compromised scoped credential",
      }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("ok");
    expect(json.proof.raw_token_returned).toBe(false);
    expect(JSON.stringify(json)).not.toContain("\"token\":");
    expect(JSON.stringify(json)).not.toContain("token_hash");
    expect(state.db!.tables.employee_mcp_credentials.filter((r) => r.status === "active")).toHaveLength(1);
    expect(state.db!.tables.employees[0]!.needs_reprovision).toBe(true);
  });

  it("reports launch readiness blockers honestly", async () => {
    const res = await buildApp().request("/manager/admin/employees/emp_1/readiness", {
      headers: headers({ "X-AMTECH-Support-Reason": "Checking launch readiness for pilot" }),
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe("blocked");
    expect(json.checks.find((c: { key: string }) => c.key === "egress_control").status).toBe("fail");
    expect(json.checks.find((c: { key: string }) => c.key === "tool_loop").status).toBe("unknown");
  });
});
