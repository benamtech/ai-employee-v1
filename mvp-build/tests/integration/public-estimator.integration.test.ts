/**
 * Public estimator persistence/isolation — REAL Supabase/Postgres proof.
 *
 * Runs only against live Supabase creds; excluded from `test:unit`.
 * Required env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * and migration 0031 applied (`npm run db:migrate`).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { anonClient, serviceClient, type SupabaseClient } from "@amtech/db";

const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const suffix = `pubest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const accountId = `acct_${suffix}`;
const employeeId = `emp_${suffix}`;
const sessionA = `pes_a_${suffix}`;
const sessionB = `pes_b_${suffix}`;
const artifactA = `art_a_${suffix}`;
const artifactB = `art_b_${suffix}`;
const mapA = `peart_a_${suffix}`;
const mapB = `peart_b_${suffix}`;
const eventA = `pevt_a_${suffix}`;
const emailA = `pemail_a_${suffix}`;

const MANAGER_ONLY_TABLES = [
  "public_estimator_sessions",
  "public_estimator_messages",
  "public_estimator_artifacts",
  "public_estimator_events",
  "public_estimator_email_sends",
] as const;

describe.skipIf(!hasDb)("public estimator real database boundaries", () => {
  beforeAll(async () => {
    const svc = serviceClient();
    await svc.from("accounts").insert({ id: accountId, display_name: "Public Estimator Test" });
    await svc.from("employees").insert({ id: employeeId, account_id: accountId, name: "Avery" });
    await svc.from("artifacts").insert([
      { id: artifactA, account_id: accountId, employee_id: employeeId, kind: "estimate", payload: { job_description: "A", line_items: [{ description: "Paint A", amount: 100 }] } },
      { id: artifactB, account_id: accountId, employee_id: employeeId, kind: "estimate", payload: { job_description: "B", line_items: [{ description: "Paint B", amount: 200 }] } },
    ]);
    await svc.from("public_estimator_sessions").insert([
      {
        id: sessionA,
        account_id: accountId,
        employee_id: employeeId,
        visitor_token_hash: `hash_a_${suffix}`,
        transcript_session_id: `pubest:${sessionA}`,
        memory_session_key: `amtech:v1:public-estimator:employee:${employeeId}:visitor:${sessionA}`,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      {
        id: sessionB,
        account_id: accountId,
        employee_id: employeeId,
        visitor_token_hash: `hash_b_${suffix}`,
        transcript_session_id: `pubest:${sessionB}`,
        memory_session_key: `amtech:v1:public-estimator:employee:${employeeId}:visitor:${sessionB}`,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
    ]);
    await svc.from("public_estimator_artifacts").insert([
      { id: mapA, visitor_session_id: sessionA, account_id: accountId, employee_id: employeeId, artifact_id: artifactA, status: "current" },
      { id: mapB, visitor_session_id: sessionB, account_id: accountId, employee_id: employeeId, artifact_id: artifactB, status: "current" },
    ]);
    await svc.from("public_estimator_events").insert({ id: eventA, visitor_session_id: sessionA, account_id: accountId, employee_id: employeeId, event_type: "started" });
    await svc.from("public_estimator_email_sends").insert({
      id: emailA,
      visitor_session_id: sessionA,
      account_id: accountId,
      employee_id: employeeId,
      artifact_id: artifactA,
      recipient_email: "owner@example.com",
      idempotency_key: `idem_${suffix}`,
      status: "pending",
    });
  }, 30_000);

  afterAll(async () => {
    const svc = serviceClient();
    await svc.from("public_estimator_email_sends").delete().eq("account_id", accountId);
    await svc.from("public_estimator_events").delete().eq("account_id", accountId);
    await svc.from("public_estimator_artifacts").delete().eq("account_id", accountId);
    await svc.from("public_estimator_messages").delete().eq("account_id", accountId);
    await svc.from("public_estimator_sessions").delete().eq("account_id", accountId);
    await svc.from("artifacts").delete().eq("account_id", accountId);
    await svc.from("employees").delete().eq("id", employeeId);
    await svc.from("accounts").delete().eq("id", accountId);
  });

  it("denies anon Data API access to all public estimator tables", async () => {
    const anon: SupabaseClient = anonClient();
    for (const table of MANAGER_ONLY_TABLES) {
      const res = await anon.from(table).select("id").eq("account_id", accountId);
      expect(res.data ?? [], `${table} must not expose public rows through anon`).toHaveLength(0);
    }
  });

  it("lets the service-role Manager client read rows and preserves visitor artifact isolation", async () => {
    const svc = serviceClient();
    const rowsA = await svc
      .from("public_estimator_artifacts")
      .select("artifact_id")
      .eq("visitor_session_id", sessionA)
      .eq("status", "current");
    const rowsB = await svc
      .from("public_estimator_artifacts")
      .select("artifact_id")
      .eq("visitor_session_id", sessionB)
      .eq("status", "current");
    expect(rowsA.error).toBeNull();
    expect(rowsB.error).toBeNull();
    expect(rowsA.data?.map((r) => r.artifact_id)).toEqual([artifactA]);
    expect(rowsB.data?.map((r) => r.artifact_id)).toEqual([artifactB]);
    expect(rowsA.data?.map((r) => r.artifact_id)).not.toContain(artifactB);
  });

  it("enforces email idempotency at the database layer", async () => {
    const svc = serviceClient();
    const dupe = await svc.from("public_estimator_email_sends").insert({
      id: `pemail_dupe_${suffix}`,
      visitor_session_id: sessionA,
      account_id: accountId,
      employee_id: employeeId,
      artifact_id: artifactA,
      recipient_email: "owner@example.com",
      idempotency_key: `idem_${suffix}`,
      status: "pending",
    });
    expect(dupe.error?.code).toBe("23505");
  });
});
