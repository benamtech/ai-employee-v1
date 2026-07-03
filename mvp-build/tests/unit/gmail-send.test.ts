import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { gmailTools } from "../../apps/manager/src/tools/gmail.stub";
import { sealTokenBundle } from "../../apps/manager/src/lib/gmail-tokens";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeAll(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-master-key-0123456789ab";
  process.env.GOOGLE_OAUTH_CLIENT_ID = "client-id";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "client-secret";
});
afterEach(() => vi.restoreAllMocks());

const STORAGE_REF = "accounts/acct_1/employees/emp_1/artifacts/art_1/estimate.pdf";
const FUTURE = new Date(Date.now() + 3600_000).toISOString();
const PAST = new Date(Date.now() - 3600_000).toISOString();

function seed(opts?: { tokenExpiry?: string; approvalResolution?: string | null }): FakeSupabase {
  const db = makeFakeDb({
    employees: [{ id: "emp_1", account_id: "acct_1" }, { id: "emp_2", account_id: "acct_2" }],
    connector_accounts: [
      { id: "conn_1", account_id: "acct_1", employee_id: "emp_1", connector_key: "email", provider: "gmail", status: "connected",
        scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
        external_email: "shop@gmail.com", token_secret_ref: sealTokenBundle({ access_token: "at", refresh_token: "rt" }), token_expiry: opts?.tokenExpiry ?? FUTURE },
      { id: "conn_2", account_id: "acct_2", employee_id: "emp_2", connector_key: "email", provider: "gmail", status: "connected",
        scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
        external_email: "other@gmail.com", token_secret_ref: sealTokenBundle({ access_token: "at2", refresh_token: "rt2" }), token_expiry: FUTURE },
    ],
    artifacts: [{ id: "art_1", account_id: "acct_1", employee_id: "emp_1", storage_ref: STORAGE_REF }],
    outbound_emails: [{ id: "email_1", connector_id: "conn_1", to_email: "jane@example.com", subject: "Estimate", body: "Hi", attachment_artifact_ids: ["art_1"], sent_status: "draft", gmail_thread_id: null, gmail_message_id: null }],
    approvals: [{ id: "appr_1", account_id: "acct_1", employee_id: "emp_1", action_key: "send_estimate_email", resolution: opts?.approvalResolution === undefined ? "approved" : opts.approvalResolution }],
  });
  db.files.set(STORAGE_REF, Buffer.from("%PDF-1.4\nfake\n%%EOF"));
  return db;
}

function ctx(db: FakeSupabase, account_id = "acct_1", employee_id = "emp_1"): ToolContext {
  return { db: db.asClient(), account_id, employee_id, actor: "employee" };
}

describe("send_email_draft", () => {
  it("sends an approved draft with PDF attachment and stores Gmail ids", async () => {
    const db = seed();
    vi.stubGlobal("fetch", routerFetch([{ match: "/messages/send", body: { id: "gmsg_1", threadId: "gthr_1" } }]));
    const res = await gmailTools.send_email_draft!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", draft_id: "email_1", approval_id: "appr_1" });
    expect(res.status).toBe("ok");
    expect(res.proof.gmail_message_id).toBe("gmsg_1");
    expect(res.proof.thread_id).toBe("gthr_1");
    const draft = db.tables.outbound_emails!.find((r) => r.id === "email_1");
    expect(draft?.sent_status).toBe("sent");
    expect(db.tables.email_threads?.[0]?.gmail_thread_id).toBe("gthr_1");
  });

  it("is idempotent: a re-send returns stored proof without calling Gmail", async () => {
    const db = seed();
    db.tables.outbound_emails![0]!.sent_status = "sent";
    db.tables.outbound_emails![0]!.gmail_message_id = "gmsg_existing";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await gmailTools.send_email_draft!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", draft_id: "email_1", approval_id: "appr_1" });
    expect(res.proof.idempotent).toBe(true);
    expect(res.proof.gmail_message_id).toBe("gmsg_existing");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses to send without a resolved approval", async () => {
    const db = seed({ approvalResolution: null });
    vi.stubGlobal("fetch", vi.fn());
    const res = await gmailTools.send_email_draft!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", draft_id: "email_1", approval_id: "appr_1" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("unauthorized");
  });

  it("denies sending another connector's draft (cross-account)", async () => {
    const db = seed();
    vi.stubGlobal("fetch", vi.fn());
    const res = await gmailTools.send_email_draft!(ctx(db, "acct_2", "emp_2"), { account_id: "acct_2", employee_id: "emp_2", draft_id: "email_1", approval_id: "appr_1" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("unauthorized");
  });

  it("refreshes an expired token before sending", async () => {
    const db = seed({ tokenExpiry: PAST });
    const fetchMock = routerFetch([
      { match: "oauth2.googleapis.com/token", body: { access_token: "fresh-at", expires_in: 3600 } },
      { match: "/messages/send", body: { id: "gmsg_2", threadId: "gthr_2" } },
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const res = await gmailTools.send_email_draft!(ctx(db), { account_id: "acct_1", employee_id: "emp_1", draft_id: "email_1", approval_id: "appr_1" });
    expect(res.status).toBe("ok");
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("oauth2.googleapis.com/token"))).toBe(true);
  });
});
