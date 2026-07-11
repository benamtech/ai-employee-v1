/**
 * QuickBooks tool family — connector lifecycle + the approval-binding security
 * bar. The properties tested hardest (the exact confused-deputy gap both
 * reference repos leave open with a model-flippable draft/confirm boolean):
 *   - a write preview never calls the QBO client;
 *   - commit is denied when the supplied approval_id isn't the pending write's
 *     OWN bound approval_id (approval-reuse / confused deputy);
 *   - commit is denied when the bound approval isn't approved;
 *   - commit is denied on a tampered payload hash;
 *   - two concurrent commits of one row produce exactly one QBO write.
 *
 * qbo-client (HTTP) and qbo-lookup (entity resolution) are mocked so this file
 * exercises tool logic; qbo-client's own correctness is covered against a
 * mocked HTTP layer in qbo-client.test.ts.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({
  resolveQboEntity: vi.fn(),
  createEntity: vi.fn(),
  getCompanyInfo: vi.fn(),
  queryEntity: vi.fn(),
  runReport: vi.fn(),
}));

vi.mock("../../apps/manager/src/lib/qbo-lookup", () => ({
  resolveQboEntity: mocks.resolveQboEntity,
}));
vi.mock("../../apps/manager/src/lib/qbo-client", () => ({
  createEntity: mocks.createEntity,
  getCompanyInfo: mocks.getCompanyInfo,
  queryEntity: mocks.queryEntity,
  runReport: mocks.runReport,
}));
vi.mock("intuit-oauth", () => {
  class MockOAuthClient {
    static scopes = { Accounting: "com.intuit.quickbooks.accounting" };
    token: Record<string, unknown> = {};
    constructor(_cfg: unknown) {}
    authorizeUri(p: { scope: string[]; state: string }): string {
      return `https://appcenter.intuit.com/connect/oauth2?scope=${p.scope.join(" ")}&state=${p.state}`;
    }
    async createToken(_uri: string) {
      this.token = { access_token: "at_new", refresh_token: "rt_new", expires_in: 3600, realmId: "realm_1" };
      return this.token;
    }
    getToken() { return this.token; }
    async refreshUsingToken(_rt: string) {
      this.token = { access_token: "at_refreshed", refresh_token: "rt_refreshed", expires_in: 3600 };
      return this.token;
    }
  }
  return { default: MockOAuthClient };
});

import { qboTools } from "../../apps/manager/src/tools/qbo.stub";
import { sealQboTokenBundle } from "../../apps/manager/src/lib/qbo-tokens";
import { mintOAuthState } from "../../apps/manager/src/lib/oauth-state";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";

beforeAll(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-master-key-0123456789ab";
  process.env.SIGNING_SECRET = "unit-test-signing-secret-0123456789";
  process.env.QBO_CLIENT_ID = "qbo-client-id";
  process.env.QBO_CLIENT_SECRET = "qbo-client-secret";
});
afterEach(() => {
  vi.clearAllMocks();
});

const FUTURE = new Date(Date.now() + 3600_000).toISOString();

function payloadHash(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function ctx(db: FakeSupabase): ToolContext {
  return { db: db.asClient(), account_id: "acct_1", employee_id: "emp_1", actor: "employee" };
}

function seedConnected(extra?: Record<string, unknown[]>): FakeSupabase {
  return makeFakeDb({
    employees: [{ id: "emp_1", account_id: "acct_1" }],
    connector_accounts: [{
      id: "conn_qbo", account_id: "acct_1", employee_id: "emp_1",
      connector_key: "accounting", provider: "quickbooks", status: "connected",
      token_secret_ref: sealQboTokenBundle({ access_token: "at", refresh_token: "rt" }),
      token_expiry: FUTURE, realm_id: "realm_1", environment: "sandbox", token_refresh_lease_until: null,
    }],
    ...(extra ?? {}),
  });
}

const owner = { account_id: "acct_1", employee_id: "emp_1" };

// ---------------------------------------------------------------------------
// Connector lifecycle
// ---------------------------------------------------------------------------
describe("connect_quickbooks", () => {
  it("creates a pending connector and returns a consent URL bound to a signed state", async () => {
    const db = makeFakeDb({ employees: [{ id: "emp_1", account_id: "acct_1" }] });
    const res = await qboTools.connect_quickbooks!(ctx(db), { ...owner });
    expect(res.status).toBe("ok");
    expect(String(res.proof.consent_url)).toContain("state=");
    const conn = db.tables.connector_accounts?.[0];
    expect(conn?.provider).toBe("quickbooks");
    expect(conn?.status).toBe("pending_oauth");
  });

  it("denies a cross-account employee", async () => {
    const db = makeFakeDb({ employees: [{ id: "emp_1", account_id: "acct_1" }] });
    const res = await qboTools.connect_quickbooks!(ctx(db), { account_id: "acct_2", employee_id: "emp_1" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("unauthorized");
  });
});

describe("complete_quickbooks_oauth", () => {
  it("exchanges the code, captures realmId, and marks the connector connected", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      connector_accounts: [{ id: "conn_qbo", account_id: "acct_1", employee_id: "emp_1", connector_key: "accounting", provider: "quickbooks", status: "pending_oauth", environment: "sandbox" }],
    });
    const state = mintOAuthState("emp_1", "quickbooks");
    const res = await qboTools.complete_quickbooks_oauth!(ctx(db), { state, code: "authcode", realmId: "realm_1" });
    expect(res.status).toBe("ok");
    const conn = db.tables.connector_accounts?.[0];
    expect(conn?.status).toBe("connected");
    expect(conn?.realm_id).toBe("realm_1");
    expect(conn?.token_secret_ref).toBeTruthy();
  });

  it("rejects an invalid/forged state (cannot forge into an owned connector)", async () => {
    const db = seedConnected();
    const res = await qboTools.complete_quickbooks_oauth!(ctx(db), { state: "not.a.valid.state", code: "x", realmId: "realm_1" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("signature_invalid");
  });
});

describe("run_quickbooks_connector_test", () => {
  it("passes when CompanyInfo is reachable with a fresh token", async () => {
    mocks.getCompanyInfo.mockResolvedValue({ CompanyName: "Miller Painting" });
    const db = seedConnected();
    const res = await qboTools.run_quickbooks_connector_test!(ctx(db), { ...owner });
    expect(res.status).toBe("ok");
    expect(res.proof.company_name).toBe("Miller Painting");
  });

  it("fails when the connector is not connected (no valid token)", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      connector_accounts: [{ id: "conn_qbo", account_id: "acct_1", employee_id: "emp_1", connector_key: "accounting", provider: "quickbooks", status: "pending_oauth" }],
    });
    const res = await qboTools.run_quickbooks_connector_test!(ctx(db), { ...owner });
    expect(res.status).toBe("failed");
    expect(mocks.getCompanyInfo).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Write preview (create_expense) — never calls QBO; opens a bound approval
// ---------------------------------------------------------------------------
describe("create_expense (write preview)", () => {
  function resolveHappy() {
    mocks.resolveQboEntity.mockImplementation(async (_c: unknown, _id: unknown, entity: string, name: string) => {
      if (entity === "Vendor") return { status: "resolved", id: "V1", name };
      if (entity === "Account") return { status: "resolved", id: "A1", name };
      if (entity === "Department") return { status: "resolved", id: "D1", name };
      return { status: "not_found" };
    });
  }

  it("stages a pending write + bound approval and never calls the QBO client", async () => {
    resolveHappy();
    const db = seedConnected();
    const res = await qboTools.create_expense!(ctx(db), { ...owner, vendor_name: "Sherwin-Williams", account_name: "Materials", amount_cents: 41260, payment_type: "CreditCard" });
    expect(res.status).toBe("needs_confirmation");
    const pendingId = String(res.proof.quickbooks_pending_write_id);
    const approvalId = String(res.proof.approval_id);
    expect(pendingId).toBeTruthy();
    expect(approvalId).toBeTruthy();

    const row = db.tables.quickbooks_pending_writes?.find((r) => r.id === pendingId);
    expect(row?.approval_id).toBe(approvalId);
    expect(row?.status).toBe("pending_approval");
    expect(row?.entity_type).toBe("Purchase");
    // canonical_payload is stored as a serialized TEXT string (not jsonb) so the
    // commit-time hash round-trips byte-identically.
    expect(typeof row?.canonical_payload).toBe("string");
    const payload = JSON.parse(row!.canonical_payload as string);
    expect(payload.PaymentType).toBe("CreditCard");
    expect(payload.EntityRef).toEqual({ value: "V1", type: "Vendor" });

    const appr = db.tables.approvals?.find((r) => r.id === approvalId);
    expect(appr?.action_key).toBe("commit_quickbooks_expense");
    expect(appr?.risk_level).toBe("high");

    expect(mocks.createEntity).not.toHaveBeenCalled();
  });

  it("rejects an invalid PaymentType before any entity resolution (gotchas ledger)", async () => {
    const db = seedConnected();
    const res = await qboTools.create_expense!(ctx(db), { ...owner, vendor_name: "X", account_name: "Y", amount_cents: 100, payment_type: "Venmo" as never });
    expect(res.status).toBe("failed");
    expect(mocks.resolveQboEntity).not.toHaveBeenCalled();
    expect(db.tables.quickbooks_pending_writes ?? []).toHaveLength(0);
  });

  it("returns a disambiguation prompt (never a guess) and stages nothing when the vendor is ambiguous", async () => {
    mocks.resolveQboEntity.mockImplementation(async (_c: unknown, _id: unknown, entity: string) => {
      if (entity === "Vendor") return { status: "needs_disambiguation", candidates: [{ id: "V1", name: "A" }, { id: "V2", name: "B" }] };
      return { status: "resolved", id: "A1", name: "Materials" };
    });
    const db = seedConnected();
    const res = await qboTools.create_expense!(ctx(db), { ...owner, vendor_name: "ambiguous", account_name: "Materials", amount_cents: 100, payment_type: "Cash" });
    expect(res.status).toBe("failed");
    expect(res.proof.needs_disambiguation).toBe(true);
    expect(db.tables.quickbooks_pending_writes ?? []).toHaveLength(0);
    expect(mocks.createEntity).not.toHaveBeenCalled();
  });

  it("includes a single resolved department at the header level (multi-dept rejection is proven in qbo-gotchas.test)", async () => {
    // The tool input allows only one department_name, so a multi-department
    // expense is structurally impossible here; validateExpenseDepartments'
    // rejection path is unit-tested directly in qbo-gotchas.test.ts. This
    // asserts the single-department happy path produces a header DepartmentRef.
    resolveHappy();
    const db = seedConnected();
    const res = await qboTools.create_expense!(ctx(db), { ...owner, vendor_name: "Sherwin-Williams", account_name: "Materials", amount_cents: 100, payment_type: "Cash", department_name: "East" });
    expect(res.status).toBe("needs_confirmation");
    const pendingId = String(res.proof.quickbooks_pending_write_id);
    const row = db.tables.quickbooks_pending_writes?.find((r) => r.id === pendingId);
    expect(JSON.parse(row!.canonical_payload as string).DepartmentRef).toEqual({ value: "D1" });
  });
});

// ---------------------------------------------------------------------------
// commit_quickbooks_write — the approval-binding security bar
// ---------------------------------------------------------------------------
describe("commit_quickbooks_write", () => {
  const CANON = { PaymentType: "Cash", EntityRef: { value: "V1", type: "Vendor" }, Line: [{ Amount: 100, DetailType: "AccountBasedExpenseLineDetail", AccountBasedExpenseLineDetail: { AccountRef: { value: "A1" } } }] };

  function seedPending(opts: { approvalId: string | null; boundApprovalId: string | null; resolution: string | null; status?: string; hash?: string; committedId?: string }) {
    const rows: Record<string, unknown[]> = {
      quickbooks_pending_writes: [{
        id: "qbpw_1", account_id: "acct_1", employee_id: "emp_1", connector_id: "conn_qbo",
        action_key: "commit_quickbooks_expense", entity_type: "Purchase",
        // Stored as the exact serialized TEXT string (mirrors production; commit
        // re-hashes this string and JSON.parses it for the QBO call).
        canonical_payload: JSON.stringify(CANON), payload_hash: opts.hash ?? payloadHash(CANON),
        approval_id: opts.boundApprovalId, status: opts.status ?? "pending_approval",
        qbo_entity_id: opts.committedId ?? null,
      }],
      approvals: [],
    };
    if (opts.approvalId) {
      (rows.approvals as unknown[]).push({ id: opts.approvalId, account_id: "acct_1", employee_id: "emp_1", action_key: "commit_quickbooks_expense", resolution: opts.resolution });
    }
    return seedConnected(rows);
  }

  it("commits exactly once when the approval binds to THIS pending write and is approved (hashes the stored serialized text)", async () => {
    mocks.createEntity.mockResolvedValue({ qbo_entity_id: "QB100", qbo_sync_token: "0", intuit_tid: "tid_1" });
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: "approved" });
    const res = await qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" });
    expect(res.status).toBe("ok");
    expect(res.proof.qbo_entity_id).toBe("QB100");
    expect(mocks.createEntity).toHaveBeenCalledTimes(1);
    // The stored TEXT payload was JSON.parsed back into the object passed to QBO.
    expect(mocks.createEntity.mock.calls[0]![2]).toMatchObject({ PaymentType: "Cash", EntityRef: { value: "V1", type: "Vendor" } });
    const row = db.tables.quickbooks_pending_writes?.[0];
    expect(row?.status).toBe("committed");
    expect(row?.qbo_entity_id).toBe("QB100");
  });

  it("does NOT mark the row failed when the commit succeeds in QBO but the mark-committed DB write fails", async () => {
    mocks.createEntity.mockResolvedValue({ qbo_entity_id: "QB100", qbo_sync_token: "0", intuit_tid: "tid_1" });
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: "approved" });
    // Fault ONLY the mark-committed persist (the update whose patch sets status
    // 'committed'); the CAS claim (status 'committing') still succeeds.
    const client = db.asClient() as unknown as { from: (t: string) => unknown };
    const realFrom = client.from.bind(client);
    const faulted = new Proxy(client, {
      get(target, prop, receiver) {
        if (prop !== "from") return Reflect.get(target, prop, receiver);
        return (table: string) => {
          const builder = realFrom(table) as { update: (p: Record<string, unknown>) => unknown };
          if (table === "quickbooks_pending_writes") {
            const realUpdate = builder.update.bind(builder);
            builder.update = (patch: Record<string, unknown>) => {
              const b = realUpdate(patch) as { then?: unknown };
              if (patch.status === "committed") {
                b.then = <T>(onF: (v: { data: null; error: { message: string } }) => T) => Promise.resolve({ data: null, error: { message: "boom" } }).then(onF);
              }
              return b;
            };
          }
          return builder;
        };
      },
    });
    const res = await qboTools.commit_quickbooks_write!({ db: faulted as never, account_id: "acct_1", employee_id: "emp_1", actor: "employee" }, { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" });
    // The QBO write is real, so the owner is told success (never "failed").
    expect(res.status).toBe("ok");
    expect(res.proof.qbo_entity_id).toBe("QB100");
    expect(res.proof.persist_deferred).toBe(true);
    // The row must NOT have been flipped to 'failed' (it stays 'committing').
    expect(db.tables.quickbooks_pending_writes?.[0]?.status).not.toBe("failed");
  });

  it("DENIES an unrelated already-approved approval replayed against this write (confused deputy)", async () => {
    // Pending write bound to appr_A; a DIFFERENT approval appr_B is approved.
    const db = seedPending({ approvalId: "appr_B", boundApprovalId: "appr_A", resolution: "approved" });
    // appr_B exists+approved but is NOT this write's bound approval.
    const res = await qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_B" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("unauthorized");
    expect(mocks.createEntity).not.toHaveBeenCalled();
    expect(db.tables.quickbooks_pending_writes?.[0]?.status).toBe("pending_approval");
  });

  it("denies commit when the bound approval is not yet approved", async () => {
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: null });
    const res = await qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" });
    expect(res.status).toBe("failed");
    expect(res.proof.failure_code).toBe("unauthorized");
    expect(mocks.createEntity).not.toHaveBeenCalled();
  });

  it("denies commit when the stored payload hash does not match (tamper evidence)", async () => {
    mocks.createEntity.mockResolvedValue({ qbo_entity_id: "QB100", qbo_sync_token: "0", intuit_tid: "tid_1" });
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: "approved", hash: "deadbeef" });
    const res = await qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" });
    expect(res.status).toBe("failed");
    expect(mocks.createEntity).not.toHaveBeenCalled();
    expect(db.tables.quickbooks_pending_writes?.[0]?.status).toBe("failed");
  });

  it("two concurrent commits of one approved row produce exactly one QBO write (compare-and-swap)", async () => {
    mocks.createEntity.mockResolvedValue({ qbo_entity_id: "QB100", qbo_sync_token: "0", intuit_tid: "tid_1" });
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: "approved" });
    const [a, b] = await Promise.all([
      qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" }),
      qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" }),
    ]);
    expect(mocks.createEntity).toHaveBeenCalledTimes(1);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(["failed", "ok"]);
  });

  it("is idempotent: an already-committed row returns stored proof without re-posting", async () => {
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: "approved", status: "committed", committedId: "QB100" });
    const res = await qboTools.commit_quickbooks_write!(ctx(db), { ...owner, pending_write_id: "qbpw_1", approval_id: "appr_A" });
    expect(res.status).toBe("ok");
    expect(res.proof.idempotent).toBe(true);
    expect(mocks.createEntity).not.toHaveBeenCalled();
  });

  it("denies a pending write that does not belong to this employee", async () => {
    const db = seedPending({ approvalId: "appr_A", boundApprovalId: "appr_A", resolution: "approved" });
    const res = await qboTools.commit_quickbooks_write!({ db: db.asClient(), account_id: "acct_2", employee_id: "emp_2", actor: "employee" }, { account_id: "acct_2", employee_id: "emp_2", pending_write_id: "qbpw_1", approval_id: "appr_A" });
    expect(res.status).toBe("failed");
    expect(mocks.createEntity).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Read surface: query + reports
// ---------------------------------------------------------------------------
describe("query_quickbooks", () => {
  it("returns records for a filterable query", async () => {
    mocks.queryEntity.mockResolvedValue({ entities: [{ Id: "1", DisplayName: "Sherwin-Williams" }], count: 1 });
    const db = seedConnected();
    const res = await qboTools.query_quickbooks!(ctx(db), { ...owner, entity: "Vendor", filters: { DisplayName: "Sherwin-Williams" } });
    expect(res.status).toBe("ok");
    expect(res.proof.count).toBe(1);
  });

  it("rejects a non-filterable field before hitting QBO", async () => {
    const db = seedConnected();
    const res = await qboTools.query_quickbooks!(ctx(db), { ...owner, entity: "JournalEntry", filters: { DepartmentRef: "3" } });
    expect(res.status).toBe("failed");
    expect(mocks.queryEntity).not.toHaveBeenCalled();
  });
});

describe("reports", () => {
  it("get_profit_and_loss returns a flattened report", async () => {
    mocks.runReport.mockResolvedValue({ Header: { ReportName: "ProfitAndLoss" }, Columns: { Column: [] }, Rows: { Row: [{ ColData: [{ value: "Materials" }, { value: "412.60" }] }] } });
    const db = seedConnected();
    const res = await qboTools.get_profit_and_loss!(ctx(db), { ...owner, date_macro: "This Fiscal Year" });
    expect(res.status).toBe("ok");
    expect(res.proof.report).toBe("ProfitAndLoss");
    expect(Number(res.proof.row_count)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Phase B seams honestly not_supported_yet (never a faked success)
// ---------------------------------------------------------------------------
describe("Phase B seams", () => {
  it("create_journal_entry reports not_supported_yet", async () => {
    const db = seedConnected();
    const res = await qboTools.create_journal_entry!(ctx(db), { ...owner });
    expect(res.status).toBe("failed");
    expect(res.proof.not_supported_yet).toBe(true);
  });
});
