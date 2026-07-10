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

describe("preview resolve route", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal-token";
    process.env.SIGNING_SECRET = "unit-test-signing-secret-123456789";
    state.db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1", name: "Employee", status: "live" }],
      // amount_cents is stored as a STRING (refs is a string map — this is what
      // bindApprovalIfNeeded actually persists), so the preview must parse it.
      approvals: [{ id: "appr_1", account_id: "acct_1", employee_id: "emp_1", action_key: "send_estimate_email", summary: "Send the estimate to Jane.", risk_level: "high", refs: { customer_name: "Jane", amount_cents: "420000" }, resolution: null, created_at: new Date().toISOString() }],
      artifacts: [
        { id: "art_1", account_id: "acct_1", employee_id: "emp_1", kind: "estimate", storage_ref: null, payload: { customer_name: "<b>Jane</b>", total: 4200 }, created_at: new Date().toISOString() },
        { id: "art_pdf", account_id: "acct_1", employee_id: "emp_1", kind: "estimate", storage_ref: "accounts/acct_1/employees/emp_1/artifacts/art_pdf/estimate.pdf", mime_type: "application/pdf", payload: { customer_name: "Jane" }, created_at: new Date().toISOString() },
      ],
      preview_links: [],
      audit_log: [],
    });
  });

  afterEach(() => {
    delete process.env.MANAGER_INTERNAL_TOKEN;
    delete process.env.SIGNING_SECRET;
    state.db = null;
  });

  function resolve(token: string) {
    return buildApp().request(MANAGER_API.previewResolve, {
      method: "POST",
      headers: { Authorization: "Bearer test-internal-token", "Content-Type": "application/json" },
      body: JSON.stringify({ signed_token: token }),
    });
  }

  it("resolves an approval into a WorkResource and increments access count + audit", async () => {
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve", "reject", "respond"],
    });
    const res = await resolve(link.token);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.resource.resource_type).toBe("approval");
    expect(json.resource.amount).toBe("$4,200.00");
    expect(json.resource.actions.map((a: { action: string }) => a.action)).toEqual(expect.arrayContaining(["approve", "reject", "respond"]));
    expect(state.db!.tables.preview_links![0].access_count).toBe(1);
    expect(state.db!.tables.audit_log!.some((r) => r.action === "preview:access")).toBe(true);
  });

  it("scopes offered actions to the token's action set", async () => {
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve", "respond"],
    });
    const json = await (await resolve(link.token)).json();
    const actions = json.resource.actions.map((a: { action: string }) => a.action);
    expect(actions).toContain("approve");
    expect(actions).not.toContain("reject");
  });

  it("renders a payload-only artifact as safe HTML (no PDF required)", async () => {
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "artifact", resource_id: "art_1", actions: ["respond"],
    });
    const json = await (await resolve(link.token)).json();
    expect(json.resource.body_kind).toBe("document");
    expect(json.resource.body_html).toContain("&lt;b&gt;Jane&lt;/b&gt;");
  });

  it("exposes open_url so the stored-document 'Open' action actually opens the file", async () => {
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "artifact", resource_id: "art_pdf", actions: ["respond"],
    });
    const json = await (await resolve(link.token)).json();
    expect(json.resource.open_url).toContain("estimate.pdf");
    expect(json.resource.actions.some((a: { action: string }) => a.action === "view")).toBe(true);
  });

  it("returns 410 for an expired link", async () => {
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve"],
    });
    state.db!.tables.preview_links![0].expires_at = new Date(Date.now() - 1000).toISOString();
    const res = await resolve(link.token);
    expect(res.status).toBe(410);
    expect((await res.json()).expired).toBe(true);
  });

  it("denies a forged token (403)", async () => {
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve"],
    });
    const res = await resolve(link.token + "tamper");
    expect(res.status).toBe(403);
  });

  it("cannot reach another account's resource with a valid token (cross-account 404)", async () => {
    // Valid token, but scoped to acct_2/emp_2 — appr_1 belongs to acct_1.
    const link = await createPreviewLink(state.db!.asClient(), {
      account_id: "acct_2", employee_id: "emp_2", resource_type: "approval", resource_id: "appr_1", actions: ["approve"],
    });
    const res = await resolve(link.token);
    expect(res.status).toBe(404);
  });
});
