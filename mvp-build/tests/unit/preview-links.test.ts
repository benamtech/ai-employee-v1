import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mintPreviewToken,
  verifyPreviewToken,
  mintSignedToken,
  tokenHash,
} from "../../apps/manager/src/lib/signed-links";
import { createPreviewLink, resolvePreviewLink } from "../../apps/manager/src/lib/preview-links";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";

beforeEach(() => {
  process.env.SIGNING_SECRET = "unit-test-signing-secret-key-0123456789";
});
afterEach(() => {
  delete process.env.SIGNING_SECRET;
});

const claims = {
  account_id: "acct_1",
  employee_id: "emp_1",
  resource_type: "approval",
  resource_id: "appr_1",
  actions: ["approve", "reject", "respond"],
  ttlSeconds: 600,
};

describe("preview token (signed-links)", () => {
  it("round-trips account/employee/resource/actions scope", () => {
    const p = verifyPreviewToken(mintPreviewToken(claims));
    expect(p).toEqual({
      account_id: "acct_1",
      employee_id: "emp_1",
      resource_type: "approval",
      resource_id: "appr_1",
      actions: ["approve", "reject", "respond"],
      expired: false,
    });
  });

  it("rejects a token minted for a different purpose", () => {
    const artifactToken = mintSignedToken("artifact_link", "appr_1", 600, { account_id: "acct_1", employee_id: "emp_1", resource_type: "approval" });
    expect(verifyPreviewToken(artifactToken)).toBeNull();
  });

  it("flags an aged-out token as expired (not invalid) so the owner can be offered a fresh link", () => {
    const p = verifyPreviewToken(mintPreviewToken({ ...claims, ttlSeconds: -1 }));
    expect(p).not.toBeNull();
    expect(p?.expired).toBe(true);
  });

  it("rejects a tampered preview token", () => {
    expect(verifyPreviewToken(mintPreviewToken(claims) + "x")).toBeNull();
  });
});

describe("createPreviewLink / resolvePreviewLink", () => {
  let db: FakeSupabase;
  beforeEach(() => {
    db = makeFakeDb({ preview_links: [] });
  });

  it("mints a token, persists a row (hash, never raw), and builds a review URL", async () => {
    process.env.AGENT_WEB_ORIGIN = "https://app.test";
    const link = await createPreviewLink(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      resource_type: "approval",
      resource_id: "appr_1",
      actions: ["approve", "reject", "respond"],
    });
    expect(link.url).toContain("https://app.test/agent/emp_1/review?t=");
    const row = db.tables.preview_links![0];
    expect(row.token_hash).toBe(tokenHash(link.token));
    expect(row.token_hash).not.toContain(link.token);
    expect(row.resource_type).toBe("approval");
    delete process.env.AGENT_WEB_ORIGIN;
  });

  it("resolves a valid link with matching claims", async () => {
    const link = await createPreviewLink(db.asClient(), {
      account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve", "reject"],
    });
    const r = await resolvePreviewLink(db.asClient(), link.token);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.link.resource_id).toBe("appr_1");
      expect(r.claims.actions).toEqual(["approve", "reject"]);
    }
  });

  it("denies a token whose bound account does not match the stored row (scope tamper)", async () => {
    // A valid signature for one scope, but the persisted row is a different account.
    const token = mintPreviewToken({ ...claims, account_id: "acct_ATTACKER" });
    db.tables.preview_links!.push({
      id: "prev_x", account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1",
      token_hash: tokenHash(token), actions: ["approve"], audience: "owner", access_count: 0,
    });
    const r = await resolvePreviewLink(db.asClient(), token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("scope_mismatch");
  });

  it("denies a valid signature with no backing row", async () => {
    const r = await resolvePreviewLink(db.asClient(), mintPreviewToken(claims));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_found");
  });

  it("denies a revoked link", async () => {
    const link = await createPreviewLink(db.asClient(), { account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve"] });
    db.tables.preview_links![0].revoked_at = new Date().toISOString();
    const r = await resolvePreviewLink(db.asClient(), link.token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("revoked");
  });

  it("denies an expired row", async () => {
    const link = await createPreviewLink(db.asClient(), { account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve"] });
    db.tables.preview_links![0].expires_at = new Date(Date.now() - 1000).toISOString();
    const r = await resolvePreviewLink(db.asClient(), link.token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("expired");
  });

  it("denies a forged (bad-signature) token", async () => {
    const link = await createPreviewLink(db.asClient(), { account_id: "acct_1", employee_id: "emp_1", resource_type: "approval", resource_id: "appr_1", actions: ["approve"] });
    const r = await resolvePreviewLink(db.asClient(), link.token + "tamper");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid");
  });

  it("maps a naturally-expired token to 'expired' (not 'invalid'), before any row lookup", async () => {
    // Signature valid, exp in the past → the owner should get the reissue path, not a
    // generic denial. (mintPreviewToken bypasses the 60s TTL floor createPreviewLink clamps to.)
    const token = mintPreviewToken({ ...claims, ttlSeconds: -1 });
    const r = await resolvePreviewLink(db.asClient(), token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("expired");
  });
});
