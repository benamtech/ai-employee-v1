import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripeTools } from "../../apps/manager/src/tools/stripe.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_123";
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.STRIPE_SECRET_KEY;
});

function seed(): FakeSupabase {
  return makeFakeDb({
    employees: [{ id: "emp_1", account_id: "acct_1" }, { id: "emp_2", account_id: "acct_2" }],
    stripe_connections: [{ id: "stcon_1", account_id: "acct_1", employee_id: "emp_1", connected_account_id: "acct_stripe_1", onboarding_status: "completed", charges_enabled: true, payouts_enabled: true }],
    artifacts: [{ id: "art_1", account_id: "acct_1", employee_id: "emp_1", payload: { customer_name: "Jane", recommended_total: 4200 } }],
    approvals: [{ id: "appr_1", account_id: "acct_1", employee_id: "emp_1", action_key: "send_deposit_invoice", resolution: "approved" }],
  });
}

function ctx(db: FakeSupabase): ToolContext {
  return { db: db.asClient(), account_id: "acct_1", employee_id: "emp_1", actor: "employee" };
}

describe("Stripe Manager tools", () => {
  it("creates a test-mode connected account row", async () => {
    const db = makeFakeDb({ employees: [{ id: "emp_1", account_id: "acct_1" }] });
    vi.stubGlobal("fetch", routerFetch([{ match: "/accounts", body: { id: "acct_stripe_new", charges_enabled: false, payouts_enabled: false } }]));
    const res = await stripeTools.connect_stripe!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", account_type: "standard" });
    expect(res.status).toBe("ok");
    expect(res.proof.connected_account_id).toBe("acct_stripe_new");
    expect(db.tables.stripe_connections?.[0]?.connected_account_id).toBe("acct_stripe_new");
  });

  it("creates a Stripe onboarding account link", async () => {
    const db = seed();
    vi.stubGlobal("fetch", routerFetch([{ match: "/account_links", body: { url: "https://connect.stripe.test/setup", expires_at: 123 } }]));
    const res = await stripeTools.create_stripe_account_link!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", stripe_connection_id: "stcon_1" });
    expect(res.status).toBe("ok");
    expect(res.proof.account_link_url).toContain("stripe");
    expect(db.tables.stripe_account_links).toHaveLength(1);
  });

  it("drafts a deposit invoice and returns a money-movement descriptor", async () => {
    const db = seed();
    vi.stubGlobal("fetch", routerFetch([
      { match: "/customers", body: { id: "cus_1" } },
      { match: "/invoiceitems", body: { id: "ii_1" } },
      { match: "/invoices", body: { id: "in_1", status: "draft" } },
    ]));
    const res = await stripeTools.create_deposit_invoice!(ctx(db), {
      account_id: "acct_1",
      employee_id: "emp_1",
      estimate_artifact_id: "art_1",
      customer_email: "jane@example.com",
      customer_name: "Jane",
      deposit_amount_cents: 84000,
    });
    expect(res.status).toBe("ok");
    expect(res.proof.stripe_invoice_id).toBe("in_1");
    expect(JSON.parse(String(res.proof.work_event_descriptor)).deliverable.type).toBe("money_movement");
    expect(db.tables.stripe_invoices?.[0]?.deposit_amount).toBe(84000);
  });

  it("requires approval before sending a deposit invoice", async () => {
    const db = seed();
    db.tables.stripe_invoices = [{ id: "stinv_1", stripe_connection_id: "stcon_1", stripe_invoice_id: "in_1", deposit_amount: 84000, status: "draft", estimate_id: "art_1" }];
    db.tables.approvals![0]!.resolution = null;
    vi.stubGlobal("fetch", vi.fn());
    const res = await stripeTools.send_deposit_invoice!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", stripe_invoice_row_id: "stinv_1", approval_id: "appr_1" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("unauthorized");
  });

  it("sends an approved deposit invoice and stores the hosted URL", async () => {
    const db = seed();
    db.tables.stripe_invoices = [{ id: "stinv_1", stripe_connection_id: "stcon_1", stripe_invoice_id: "in_1", deposit_amount: 84000, status: "draft", estimate_id: "art_1", hosted_invoice_url: null }];
    vi.stubGlobal("fetch", routerFetch([
      { match: "/invoices/in_1/finalize", body: { id: "in_1", status: "open" } },
      { match: "/invoices/in_1/send", body: { id: "in_1", status: "sent", hosted_invoice_url: "https://pay.stripe.test/in_1", invoice_pdf: "https://pdf.stripe.test/in_1" } },
    ]));
    const res = await stripeTools.send_deposit_invoice!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", stripe_invoice_row_id: "stinv_1", approval_id: "appr_1" });
    expect(res.status).toBe("ok");
    expect(res.proof.hosted_invoice_url).toBe("https://pay.stripe.test/in_1");
    expect(db.tables.stripe_invoices?.[0]?.status).toBe("sent");
  });
});
