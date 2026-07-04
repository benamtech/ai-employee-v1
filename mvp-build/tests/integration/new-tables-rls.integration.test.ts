/**
 * RLS posture for the Phase 3A/4 control-plane tables and Phase 6 metering
 * ledgers (migrations 0011-0014). These tables are Manager-only and must never be
 * readable by the owner/anon Data API. They follow the `artifact_links`
 * convention: RLS enabled with NO select policy, so the authenticated/anon path is
 * default-denied while the service role bypasses RLS.
 *
 * REAL integration proof (not a mock). Excluded from `test:unit`.
 * Run with: `npm run test:integration`.
 * Required env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * (migrations 0011-0014 applied: `npm run db:migrate`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anonClient, serviceClient, type SupabaseClient } from "@amtech/db";

const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const suffix = `nt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const pw = `Test!${suffix}9`;

const email = `owner-${suffix}@nt.test`;
let authUserId = "";
let token = "";
const userId = `user_${suffix}`;
const accountId = `acct_${suffix}`;
const memId = `mem_${suffix}`;
const employeeId = `emp_${suffix}`;
const workRunId = `run_${suffix}`;
const meterEventId = `mev_${suffix}`;
const toolInvocationId = `tinv_${suffix}`;
const pricingId = `price_${suffix}`;
const rollupId = `roll_${suffix}`;
const budgetId = `budget_${suffix}`;

// One seeded row per Manager-only table that owner-context columns exist on.
const CONTROL_PLANE_TABLES = ["employee_turn_jobs", "channel_sessions", "delivery_decisions"] as const;
const METERING_TABLES = [
  ["work_runs", workRunId],
  ["meter_events", meterEventId],
  ["tool_invocations", toolInvocationId],
  ["meter_pricing_versions", pricingId],
  ["usage_rollups_daily", rollupId],
  ["budget_policies", budgetId],
] as const;

describe.skipIf(!hasDb)("RLS: owner cannot read Manager-only control-plane tables", () => {
  beforeAll(async () => {
    const svc = serviceClient();
    const { data, error } = await svc.auth.admin.createUser({ email, password: pw, email_confirm: true });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    authUserId = data.user.id;

    await svc.from("users").insert({ id: userId, auth_user_id: authUserId, email, full_name: "Owner" });
    await svc.from("accounts").insert({ id: accountId, display_name: "NT" });
    await svc.from("account_memberships").insert({ id: memId, account_id: accountId, user_id: userId, role: "owner" });
    await svc.from("employees").insert({ id: employeeId, account_id: accountId, name: "Emp" });

    await svc.from("employee_turn_jobs").insert({ id: `turn_${suffix}`, account_id: accountId, employee_id: employeeId, kind: "owner_web_chat", idempotency_key: `k_${suffix}`, status: "queued", input: {} });
    await svc.from("channel_sessions").insert({ id: `chs_${suffix}`, account_id: accountId, employee_id: employeeId, channel: "web" });
    await svc.from("delivery_decisions").insert({ id: `deld_${suffix}`, account_id: accountId, employee_id: employeeId, intent_key: `i_${suffix}`, move: "notify", chosen_channel: "none", reason: "test" });
    await svc.from("work_runs").insert({ id: workRunId, account_id: accountId, employee_id: employeeId, trigger_type: "system", status: "started" });
    await svc.from("meter_events").insert({ id: meterEventId, run_id: workRunId, account_id: accountId, employee_id: employeeId, category: "manager_tool", feature_key: "test", unit: "tool_call" });
    await svc.from("tool_invocations").insert({ id: toolInvocationId, run_id: workRunId, account_id: accountId, employee_id: employeeId, tool_name: "test_tool" });
    await svc.from("meter_pricing_versions").insert({ id: pricingId, provider: "manager", feature_key: "test", unit: "tool_call", unit_cost_micros: 0 });
    await svc.from("usage_rollups_daily").insert({ id: rollupId, day: new Date().toISOString().slice(0, 10), account_id: accountId, employee_id: employeeId, category: "manager_tool", feature_key: "test", unit: "tool_call" });
    await svc.from("budget_policies").insert({ id: budgetId, account_id: accountId, scope: "test", period: "day", action: "allow" });

    const { data: signIn, error: signErr } = await anonClient().auth.signInWithPassword({ email, password: pw });
    if (signErr || !signIn.session) throw new Error(`signIn failed: ${signErr?.message}`);
    token = signIn.session.access_token;
  }, 30_000);

  afterAll(async () => {
    const svc = serviceClient();
    await svc.from("budget_policies").delete().eq("id", budgetId);
    await svc.from("usage_rollups_daily").delete().eq("id", rollupId);
    await svc.from("meter_pricing_versions").delete().eq("id", pricingId);
    await svc.from("tool_invocations").delete().eq("id", toolInvocationId);
    await svc.from("meter_events").delete().eq("id", meterEventId);
    await svc.from("work_runs").delete().eq("id", workRunId);
    await svc.from("delivery_decisions").delete().eq("employee_id", employeeId);
    await svc.from("channel_sessions").delete().eq("employee_id", employeeId);
    await svc.from("employee_turn_jobs").delete().eq("employee_id", employeeId);
    await svc.from("employees").delete().eq("id", employeeId);
    await svc.from("account_memberships").delete().eq("id", memId);
    await svc.from("accounts").delete().eq("id", accountId);
    await svc.from("users").delete().eq("id", userId);
    if (authUserId) await svc.auth.admin.deleteUser(authUserId);
  });

  it("denies the authenticated owner all rows on each control-plane table", async () => {
    const asOwner: SupabaseClient = anonClient(token);
    for (const table of CONTROL_PLANE_TABLES) {
      const res = await asOwner.from(table).select("id").eq("employee_id", employeeId);
      // RLS with no select policy returns zero rows (not an error) even for the owner's own employee.
      expect(res.data ?? [], `${table} must not expose rows to the owner`).toHaveLength(0);
    }
  });

  it("lets the service-role Manager client read them (control-plane authority)", async () => {
    const svc = serviceClient();
    for (const table of CONTROL_PLANE_TABLES) {
      const res = await svc.from(table).select("id").eq("employee_id", employeeId);
      expect(res.error).toBeNull();
      expect((res.data ?? []).length, `${table} must be visible to the service role`).toBeGreaterThan(0);
    }
  });

  it("denies the authenticated owner all raw metering ledgers", async () => {
    const asOwner: SupabaseClient = anonClient(token);
    for (const [table, id] of METERING_TABLES) {
      const res = await asOwner.from(table).select("id").eq("id", id);
      expect(res.data ?? [], `${table} must not expose rows to the owner`).toHaveLength(0);
    }
  });

  it("lets the service-role Manager client read raw metering ledgers", async () => {
    const svc = serviceClient();
    for (const [table, id] of METERING_TABLES) {
      const res = await svc.from(table).select("id").eq("id", id);
      expect(res.error).toBeNull();
      expect(res.data ?? [], `${table} must be visible to the service role`).toHaveLength(1);
    }
  });
});
