import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MANAGER_API } from "@amtech/shared";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { mintOwnerSession } from "../../apps/manager/src/lib/owner-session";
import { mintSignedToken, tokenHash } from "../../apps/manager/src/lib/signed-links";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

describe("artifact resolve route", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal-token";
    process.env.SIGNING_SECRET = "unit-test-signing-secret-123";
    state.db = makeFakeDb({
      artifacts: [],
      artifact_links: [],
      audit_log: [],
      owner_web_sessions: [],
    });
  });

  afterEach(() => {
    delete process.env.MANAGER_INTERNAL_TOKEN;
    delete process.env.SIGNING_SECRET;
    state.db = null;
  });

  async function ownerToken(accountId = "acct_1"): Promise<string> {
    const session = await mintOwnerSession(state.db!.asClient(), accountId, "user_1");
    return session.token;
  }

  async function resolveArtifact(employeeId: string, artifactId: string, token?: string, signedToken?: string) {
    return buildApp().request(MANAGER_API.artifactResolve(employeeId, artifactId), {
      method: "POST",
      headers: {
        Authorization: "Bearer test-internal-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...(token ? { owner_session_token: token } : {}), ...(signedToken ? { signed_token: signedToken } : {}) }),
    });
  }

  it("returns safe HTML for authorized payload-only artifacts", async () => {
    state.db!.tables.artifacts!.push({
      id: "art_1",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: {
        customer_name: "<b>Jane</b>",
        line_items: [{ description: "Prep <walls>", amount: 250 }],
      },
    });

    const res = await resolveArtifact("emp_1", "art_1", await ownerToken());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.mime_type).toBe("text/html");
    expect(body.html).toContain("&lt;b&gt;Jane&lt;/b&gt;");
    expect(body.html).toContain("<table>");
    expect(state.db!.tables.audit_log).toHaveLength(1);
  });

  it("keeps stored artifacts on the signed storage URL path", async () => {
    state.db!.tables.artifacts!.push({
      id: "art_2",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: "accounts/acct_1/employees/emp_1/artifacts/art_2/estimate.pdf",
      mime_type: "application/pdf",
      payload: { customer_name: "Jane" },
    });

    const res = await resolveArtifact("emp_1", "art_2", await ownerToken());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.signed_url).toContain("/accounts/acct_1/employees/emp_1/artifacts/art_2/estimate.pdf");
    expect(body.html).toBeUndefined();
    expect(body.mime_type).toBe("application/pdf");
  });

  it("increments signed artifact link access through the atomic RPC", async () => {
    const signed = mintSignedToken("artifact_link", "art_signed", 300, { account_id: "acct_1", employee_id: "emp_1" });
    state.db!.tables.artifacts!.push({
      id: "art_signed",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: { customer_name: "Jane", line_items: [{ description: "Prep", amount: 250 }] },
    });
    state.db!.tables.artifact_links!.push({
      id: "alink_signed",
      artifact_id: "art_signed",
      token_hash: tokenHash(signed),
      access_count: 7,
      revoked_at: null,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });

    const res = await resolveArtifact("emp_1", "art_signed", undefined, signed);

    expect(res.status).toBe(200);
    expect(state.db!.tables.artifact_links![0]!.access_count).toBe(8);
  });

  it("denies payload-only artifacts without an authorized owner session", async () => {
    state.db!.tables.artifacts!.push({
      id: "art_3",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: { customer_name: "Jane" },
    });

    const res = await resolveArtifact("emp_1", "art_3", await ownerToken("acct_other"));
    expect(res.status).toBe(403);
    expect(state.db!.tables.audit_log).toHaveLength(0);
  });

  it("returns 410 for an expired signed artifact link", async () => {
    const signed = mintSignedToken("artifact_link", "art_expired", -1, { account_id: "acct_1", employee_id: "emp_1" });
    state.db!.tables.artifacts!.push({
      id: "art_expired",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: { customer_name: "Jane" },
    });
    state.db!.tables.artifact_links!.push({
      id: "alink_expired",
      artifact_id: "art_expired",
      token_hash: tokenHash(signed),
      access_count: 0,
      revoked_at: null,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });

    const res = await resolveArtifact("emp_1", "art_expired", undefined, signed);
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body).toMatchObject({ error: "artifact_link_expired", expired: true });
    expect(state.db!.tables.artifact_links![0]!.access_count).toBe(0);
    expect(state.db!.tables.audit_log).toHaveLength(0);
  });

  it("returns 410 for a revoked signed artifact link", async () => {
    const signed = mintSignedToken("artifact_link", "art_revoked", 300, { account_id: "acct_1", employee_id: "emp_1" });
    state.db!.tables.artifacts!.push({
      id: "art_revoked",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: { customer_name: "Jane" },
    });
    state.db!.tables.artifact_links!.push({
      id: "alink_revoked",
      artifact_id: "art_revoked",
      token_hash: tokenHash(signed),
      access_count: 0,
      revoked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });

    const res = await resolveArtifact("emp_1", "art_revoked", undefined, signed);
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body).toMatchObject({ error: "artifact_link_expired", expired: true });
    expect(state.db!.tables.artifact_links![0]!.access_count).toBe(0);
    expect(state.db!.tables.audit_log).toHaveLength(0);
  });

  it("returns 403 for a forged or wrong-scope signed artifact link", async () => {
    const wrongScope = mintSignedToken("artifact_link", "art_scope", 300, { account_id: "acct_other", employee_id: "emp_1" });
    state.db!.tables.artifacts!.push({
      id: "art_scope",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: { customer_name: "Jane" },
    });

    const res = await resolveArtifact("emp_1", "art_scope", undefined, wrongScope);
    const forged = await resolveArtifact("emp_1", "art_scope", undefined, `${wrongScope}x`);

    expect(res.status).toBe(403);
    expect(forged.status).toBe(403);
    expect(state.db!.tables.audit_log).toHaveLength(0);
  });

  it("does not increment signed-link access count when a payload-only artifact cannot render", async () => {
    const signed = mintSignedToken("artifact_link", "art_4", 300, { account_id: "acct_1", employee_id: "emp_1" });
    state.db!.tables.artifacts!.push({
      id: "art_4",
      account_id: "acct_1",
      employee_id: "emp_1",
      kind: "estimate",
      storage_ref: null,
      payload: {},
    });
    state.db!.tables.artifact_links!.push({
      id: "alink_1",
      artifact_id: "art_4",
      token_hash: tokenHash(signed),
      access_count: 4,
      revoked_at: null,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });

    const res = await resolveArtifact("emp_1", "art_4", undefined, signed);

    expect(res.status).toBe(404);
    expect(state.db!.tables.artifact_links![0]!.access_count).toBe(4);
    expect(state.db!.tables.audit_log).toHaveLength(0);
  });
});
