/**
 * Phase 1 acceptance §8 (security), LIVE pieces that need real Supabase — cross-account
 * ARTIFACT denial ("owner cannot access another account's artifact",
 * 10-security-ops-observability.md). REAL integration test, no mocks; runs only with
 * live Supabase creds and is excluded from `test:unit`. Skips cleanly otherwise.
 *
 *   npm run test:integration
 *
 * The forged-signature boundary is proven offline by tests/unit/forged-requests.test.ts;
 * the live forged-request probe against a deployed Manager is
 * infra/scripts/acceptance/run8-security.mjs.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anonClient, serviceClient, type SupabaseClient } from "@amtech/db";

const hasDb = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const suffix = `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const pw = `Test!${suffix}9`;

const A = { email: `owner-a-${suffix}@sec.test`, authUserId: "", userId: `user_a_${suffix}`, accountId: `acct_a_${suffix}`, memId: `mem_a_${suffix}`, employeeId: `emp_a_${suffix}`, artifactId: `art_a_${suffix}` };
const B = { email: `owner-b-${suffix}@sec.test`, authUserId: "", userId: `user_b_${suffix}`, accountId: `acct_b_${suffix}`, memId: `mem_b_${suffix}`, employeeId: `emp_b_${suffix}`, artifactId: `art_b_${suffix}` };

let tokenA = "";

describe.skipIf(!hasDb)("Security: owner cannot read another account's artifact", () => {
  beforeAll(async () => {
    const svc = serviceClient();
    for (const who of [A, B]) {
      const { data, error } = await svc.auth.admin.createUser({ email: who.email, password: pw, email_confirm: true });
      if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
      who.authUserId = data.user.id;
    }
    await svc.from("users").insert([
      { id: A.userId, auth_user_id: A.authUserId, email: A.email, full_name: "Owner A" },
      { id: B.userId, auth_user_id: B.authUserId, email: B.email, full_name: "Owner B" },
    ]);
    await svc.from("accounts").insert([
      { id: A.accountId, display_name: "Account A" },
      { id: B.accountId, display_name: "Account B" },
    ]);
    await svc.from("account_memberships").insert([
      { id: A.memId, account_id: A.accountId, user_id: A.userId, role: "owner" },
      { id: B.memId, account_id: B.accountId, user_id: B.userId, role: "owner" },
    ]);
    await svc.from("employees").insert([
      { id: A.employeeId, account_id: A.accountId, name: "Employee A" },
      { id: B.employeeId, account_id: B.accountId, name: "Employee B" },
    ]);
    await svc.from("artifacts").insert([
      { id: A.artifactId, employee_id: A.employeeId, account_id: A.accountId, kind: "estimate", storage_ref: "acct_a/est.pdf" },
      { id: B.artifactId, employee_id: B.employeeId, account_id: B.accountId, kind: "estimate", storage_ref: "acct_b/est.pdf" },
    ]);

    const { data: signIn, error: signErr } = await anonClient().auth.signInWithPassword({ email: A.email, password: pw });
    if (signErr || !signIn.session) throw new Error(`signIn failed: ${signErr?.message}`);
    tokenA = signIn.session.access_token;
  }, 30_000);

  afterAll(async () => {
    const svc = serviceClient();
    await svc.from("artifacts").delete().in("id", [A.artifactId, B.artifactId]);
    await svc.from("employees").delete().in("id", [A.employeeId, B.employeeId]);
    await svc.from("account_memberships").delete().in("id", [A.memId, B.memId]);
    await svc.from("accounts").delete().in("id", [A.accountId, B.accountId]);
    await svc.from("users").delete().in("id", [A.userId, B.userId]);
    for (const who of [A, B]) if (who.authUserId) await svc.auth.admin.deleteUser(who.authUserId);
  });

  it("owner A's auth client is denied account B's artifact", async () => {
    const asOwnerA: SupabaseClient = anonClient(tokenA);
    const targeted = await asOwnerA.from("artifacts").select("id").eq("id", B.artifactId);
    expect(targeted.error).toBeNull();
    expect(targeted.data ?? []).toHaveLength(0);

    const all = await asOwnerA.from("artifacts").select("id");
    const ids = (all.data ?? []).map((r: { id: string }) => r.id);
    expect(ids).toContain(A.artifactId);
    expect(ids).not.toContain(B.artifactId);
  });

  it("the service-role Manager client can read both artifacts", async () => {
    const svc = serviceClient();
    const { data, error } = await svc.from("artifacts").select("id").in("id", [A.artifactId, B.artifactId]);
    expect(error).toBeNull();
    expect((data ?? []).map((r: { id: string }) => r.id).sort()).toEqual([A.artifactId, B.artifactId].sort());
  });
});
