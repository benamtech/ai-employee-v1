import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MANAGER_API } from "@amtech/shared";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { createPreviewLink } from "../../apps/manager/src/lib/preview-links";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

// The employee-LLM hop is out of scope for these tests; respond just needs to reach
// the owner-turn pipeline. Stub it so the route is exercised deterministically.
vi.mock("../../apps/manager/src/lib/runtime.js", () => ({
  deliverOwnerTurnToRuntime: vi.fn(async () => ({ status: "queued", job_id: "turn_1", run_id: "run_1" })),
}));

describe("preview action route", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal-token";
    process.env.SIGNING_SECRET = "unit-test-signing-secret-123456789";
    state.db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1", status: "live" }],
      approvals: [
        { id: "appr_1", account_id: "acct_1", employee_id: "emp_1", action_key: "send_estimate_email", summary: "Send it.", risk_level: "high", refs: {}, resolution: null, created_at: new Date().toISOString() },
        { id: "appr_2", account_id: "acct_1", employee_id: "emp_1", action_key: "send_estimate_email", summary: "Send it too.", risk_level: "high", refs: {}, resolution: null, created_at: new Date().toISOString() },
      ],
      employee_messages: [],
      audit_log: [],
      preview_links: [],
    });
  });

  afterEach(() => {
    delete process.env.MANAGER_INTERNAL_TOKEN;
    delete process.env.SIGNING_SECRET;
    state.db = null;
  });

  function action(token: string, act: string, note?: string) {
    return buildApp().request(MANAGER_API.previewAction, {
      method: "POST",
      headers: { Authorization: "Bearer test-internal-token", "Content-Type": "application/json" },
      body: JSON.stringify({ signed_token: token, action: act, ...(note ? { note } : {}) }),
    });
  }

  async function approvalLink(approvalId: string, actions = ["approve", "reject", "respond"]) {
    return createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: approvalId, actions,
    });
  }

  it("approves an approval, consumes the link, and audits as the owner", async () => {
    const link = await approvalLink("appr_1");
    const res = await action(link.token, "approve");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.resolution).toBe("approved");
    expect(state.db!.tables.approvals!.find((a) => a.id === "appr_1")!.resolution).toBe("approved");
    expect(state.db!.tables.preview_links![0].consumed_at).toBeTruthy();
    const audit = state.db!.tables.audit_log!.filter((r) => r.action === "preview:action");
    expect(audit).toHaveLength(1);
    expect(audit[0].actor).toBe("owner");
  });

  it("is idempotent: a second approve on the same link is refused (409)", async () => {
    const link = await approvalLink("appr_1");
    await action(link.token, "approve");
    const res = await action(link.token, "approve");
    expect(res.status).toBe(409);
    expect((await res.json()).consumed).toBe(true);
  });

  it("rejects an approval", async () => {
    const link = await approvalLink("appr_2");
    const res = await action(link.token, "reject");
    expect(res.status).toBe(200);
    expect(state.db!.tables.approvals!.find((a) => a.id === "appr_2")!.resolution).toBe("rejected");
  });

  it("routes a respond note into the owner-turn pipeline", async () => {
    const link = await approvalLink("appr_1");
    const res = await action(link.token, "respond", "Change the color to navy first");
    expect(res.status).toBe(200);
    const msg = state.db!.tables.employee_messages!.find((m) => m.direction === "to_employee");
    expect(msg?.body).toBe("Change the color to navy first");
  });

  it("denies an action outside the token's scope (403)", async () => {
    const link = await approvalLink("appr_1", ["respond"]);
    const res = await action(link.token, "approve");
    expect(res.status).toBe(403);
    expect(state.db!.tables.approvals!.find((a) => a.id === "appr_1")!.resolution).toBeNull();
  });

  it("denies a forged token (403)", async () => {
    const link = await approvalLink("appr_1");
    const res = await action(link.token + "tamper", "approve");
    expect(res.status).toBe(403);
  });
});
