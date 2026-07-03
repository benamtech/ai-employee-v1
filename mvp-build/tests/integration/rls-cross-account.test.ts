/**
 * RLS cross-account denial — Phase 0 acceptance ("RLS denies cross-account reads",
 * 10-security-ops-observability.md). This is a REAL integration test, not a mock:
 * it runs only against live Supabase creds and is excluded from `test:unit`.
 * Run with: `npm run test:integration` (see vitest.integration.config.ts).
 *
 * RLS mapping (0002_rls.sql): auth.uid() -> users.auth_user_id ->
 * account_memberships.account_id -> scopes employees/artifacts/etc.
 *
 * Required env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * (DATABASE_URL is only needed to apply migrations beforehand).
 *
 * Setup: two accounts A and B, each with an owner auth user + a membership + an
 * employee. Owner A's authenticated (anon-key + JWT) client must be DENIED B's
 * employees; the service-role Manager client must read BOTH.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anonClient, serviceClient, type SupabaseClient } from "@amtech/db";

const hasDb = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const suffix = `rls_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const pw = `Test!${suffix}9`;

const A = {
  email: `owner-a-${suffix}@rls.test`,
  authUserId: "",
  userId: `user_a_${suffix}`,
  accountId: `acct_a_${suffix}`,
  memId: `mem_a_${suffix}`,
  employeeId: `emp_a_${suffix}`,
};
const B = {
  email: `owner-b-${suffix}@rls.test`,
  authUserId: "",
  userId: `user_b_${suffix}`,
  accountId: `acct_b_${suffix}`,
  memId: `mem_b_${suffix}`,
  employeeId: `emp_b_${suffix}`,
};

let tokenA = "";

describe.skipIf(!hasDb)("RLS: owner cannot read another account's rows", () => {
  beforeAll(async () => {
    const svc = serviceClient();

    // 1. Two confirmed auth users.
    for (const who of [A, B]) {
      const { data, error } = await svc.auth.admin.createUser({
        email: who.email,
        password: pw,
        email_confirm: true,
      });
      if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
      who.authUserId = data.user.id;
    }

    // 2. App rows: users -> accounts -> memberships -> employees (service role bypasses RLS).
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

    // 3. Sign in as owner A to obtain a user JWT (RLS-bound).
    const { data: signIn, error: signErr } = await anonClient().auth.signInWithPassword({
      email: A.email,
      password: pw,
    });
    if (signErr || !signIn.session) throw new Error(`signIn failed: ${signErr?.message}`);
    tokenA = signIn.session.access_token;
  }, 30_000);

  afterAll(async () => {
    const svc = serviceClient();
    await svc.from("employees").delete().in("id", [A.employeeId, B.employeeId]);
    await svc.from("account_memberships").delete().in("id", [A.memId, B.memId]);
    await svc.from("accounts").delete().in("id", [A.accountId, B.accountId]);
    await svc.from("users").delete().in("id", [A.userId, B.userId]);
    for (const who of [A, B]) {
      if (who.authUserId) await svc.auth.admin.deleteUser(who.authUserId);
    }
  });

  it("owner A's auth client is denied account B's employees", async () => {
    const asOwnerA: SupabaseClient = anonClient(tokenA);

    // Direct attempt to read B's row is denied (RLS returns no rows, not an error).
    const targeted = await asOwnerA.from("employees").select("id").eq("account_id", B.accountId);
    expect(targeted.error).toBeNull();
    expect(targeted.data ?? []).toHaveLength(0);

    // A broad read returns only A's own rows — never B's.
    const all = await asOwnerA.from("employees").select("id,account_id");
    const ids = (all.data ?? []).map((r: { id: string }) => r.id);
    expect(ids).toContain(A.employeeId);
    expect(ids).not.toContain(B.employeeId);
  });

  it("the service-role Manager client can read both (control-plane authority)", async () => {
    const svc = serviceClient();
    const { data, error } = await svc
      .from("employees")
      .select("id")
      .in("id", [A.employeeId, B.employeeId]);
    expect(error).toBeNull();
    expect((data ?? []).map((r: { id: string }) => r.id).sort()).toEqual(
      [A.employeeId, B.employeeId].sort(),
    );
  });
});
