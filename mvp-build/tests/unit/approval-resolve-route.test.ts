import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { deliverOwnerTurnToRuntime } from "../../apps/manager/src/lib/runtime";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

vi.mock("../../apps/manager/src/lib/runtime.js", () => ({
  deliverOwnerTurnToRuntime: vi.fn(async () => ({ status: "queued", job_id: "turn_1", run_id: "run_1" })),
}));

describe("Manager resolve_approval route", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    vi.mocked(deliverOwnerTurnToRuntime).mockClear();
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal-token";
    state.db = makeFakeDb({
      approvals: [{
        id: "appr_web",
        account_id: "acct_1",
        employee_id: "emp_1",
        action_key: "send_estimate_email",
        summary: "Send the estimate.",
        risk_level: "high",
        refs: {},
        resolution: null,
        created_at: "2026-07-10T00:00:00Z",
      }],
      audit_log: [],
    });
  });

  it("wakes the employee after a web owner approval is resolved", async () => {
    const res = await buildApp().request("/manager/tools/resolve_approval", {
      method: "POST",
      headers: { Authorization: "Bearer test-internal-token", "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: "acct_1",
        employee_id: "emp_1",
        approval_id: "appr_web",
        owner_response: "approved",
        channel: "web",
      }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("ok");
    expect(json.proof.approval_id).toBe("appr_web");
    expect(json.proof.resolution).toBe("approved");
    expect(json.proof.approval_followup_turn_status).toBe("queued");
    expect(json.proof.approval_followup_turn_job_id).toBe("turn_1");
    expect(state.db!.tables.approvals![0]!.resolution).toBe("approved");
    expect(state.db!.tables.audit_log!.find((r) => r.action === "tool:resolve_approval")?.actor).toBe("owner");
    expect(deliverOwnerTurnToRuntime).toHaveBeenCalledWith(state.db!.asClient(), expect.objectContaining({
      account_id: "acct_1",
      employee_id: "emp_1",
      channel: "web",
      idempotency_key: "approval-resolution:appr_web:approved",
    }));
  });
});
