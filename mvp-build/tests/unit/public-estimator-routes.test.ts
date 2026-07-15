import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeDb, SCHEMA_UNIQUES, type FakeSupabase } from "./_helpers/fake-supabase";
import { deliverPublicEstimatorTurnToRuntime } from "../../apps/manager/src/lib/public-estimator-runtime";

const state = vi.hoisted(() => ({ db: null as FakeSupabase | null }));

vi.mock("@amtech/db", () => ({
  serviceClient: () => {
    if (!state.db) throw new Error("fake db not initialized");
    return state.db.asClient();
  },
}));

vi.mock("../../apps/manager/src/lib/public-estimator-runtime", () => ({
  deliverPublicEstimatorTurnToRuntime: vi.fn(async (_db, params) => ({
    status: "succeeded",
    reply: "I can draft that with wall prep, two coats, and visible assumptions.",
    job_id: "turn_public_1",
    run_id: "run_public_1",
    external_run_id: "hrun_public_1",
    mapped_artifact_ids: [],
  })),
}));

describe("public estimator Manager routes", () => {
  let buildApp: typeof import("../../apps/manager/src/server").buildApp;

  beforeAll(async () => {
    ({ buildApp } = await import("../../apps/manager/src/server"));
  });

  beforeEach(() => {
    process.env.MANAGER_INTERNAL_TOKEN = "test-internal-token";
    process.env.SIGNING_SECRET = "unit-test-signing-secret-123";
    process.env.PUBLIC_ESTIMATOR_EMPLOYEE_ID = "emp_pub";
    process.env.PUBLIC_ESTIMATOR_ACCOUNT_ID = "acct_pub";
    process.env.PUBLIC_ESTIMATOR_MESSAGE_LIMIT = "12";
    state.db = makeFakeDb({
      accounts: [{ id: "acct_pub", display_name: "Public Account" }],
      employees: [{ id: "emp_pub", account_id: "acct_pub", name: "Avery" }],
      public_estimator_sessions: [],
      public_estimator_messages: [],
      public_estimator_artifacts: [],
      public_estimator_events: [],
      public_estimator_email_sends: [],
      artifacts: [],
      employee_turn_jobs: [],
      employee_turn_locks: [],
      work_runs: [],
      tool_invocations: [],
    }, { uniques: SCHEMA_UNIQUES });
    vi.mocked(deliverPublicEstimatorTurnToRuntime).mockClear();
  });

  afterEach(() => {
    delete process.env.MANAGER_INTERNAL_TOKEN;
    delete process.env.SIGNING_SECRET;
    delete process.env.PUBLIC_ESTIMATOR_EMPLOYEE_ID;
    delete process.env.PUBLIC_ESTIMATOR_ACCOUNT_ID;
    delete process.env.PUBLIC_ESTIMATOR_MESSAGE_LIMIT;
    state.db = null;
  });

  function req(path: string, body: Record<string, unknown>, method = "POST") {
    return buildApp().request(path, {
      method,
      headers: {
        Authorization: "Bearer test-internal-token",
        "Content-Type": "application/json",
      },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
  }

  async function createSession() {
    const res = await req("/manager/public-estimator/session", {});
    expect(res.status).toBe(200);
    return await res.json() as { visitor_session_id: string; visitor_token: string; employee_id: string };
  }

  it("creates and resumes an isolated anonymous visitor session", async () => {
    const first = await createSession();
    expect(first.employee_id).toBe("emp_pub");
    expect(first.visitor_token).toBeTruthy();
    expect(state.db!.tables.public_estimator_sessions).toHaveLength(1);
    expect(state.db!.tables.public_estimator_sessions![0].visitor_token_hash).not.toBe(first.visitor_token);
    expect(state.db!.tables.public_estimator_sessions![0].transcript_session_id).toBe(`pubest:${first.visitor_session_id}`);

    const resumedRes = await req("/manager/public-estimator/session", { visitor_token: first.visitor_token });
    const resumed = await resumedRes.json();
    expect(resumed.visitor_session_id).toBe(first.visitor_session_id);
    expect(resumed.resumed).toBe(true);
    expect(state.db!.tables.public_estimator_sessions).toHaveLength(1);
  });

  it("validates and rate limits public messages before hitting the LLM turn", async () => {
    const session = await createSession();
    const missing = await req("/manager/public-estimator/message", { visitor_session_id: session.visitor_session_id, visitor_token: session.visitor_token, message: "" });
    expect(missing.status).toBe(400);
    expect(deliverPublicEstimatorTurnToRuntime).not.toHaveBeenCalled();

    process.env.PUBLIC_ESTIMATOR_MESSAGE_LIMIT = "1";
    state.db!.tables.public_estimator_messages!.push(
      {
        id: "msg_recent_1",
        visitor_session_id: session.visitor_session_id,
        account_id: "acct_pub",
        employee_id: "emp_pub",
        direction: "visitor",
        body: "recent",
        created_at: new Date().toISOString(),
      },
      {
        id: "msg_recent_2",
        visitor_session_id: session.visitor_session_id,
        account_id: "acct_pub",
        employee_id: "emp_pub",
        direction: "visitor",
        body: "recent",
        created_at: new Date().toISOString(),
      },
    );
    const limited = await req("/manager/public-estimator/message", { visitor_session_id: session.visitor_session_id, visitor_token: session.visitor_token, message: "please price this bedroom repaint" });
    expect(limited.status).toBe(429);
    expect(deliverPublicEstimatorTurnToRuntime).not.toHaveBeenCalled();
  });

  it("stores visitor and employee messages for a successful public turn", async () => {
    const session = await createSession();
    const res = await req("/manager/public-estimator/message", {
      visitor_session_id: session.visitor_session_id,
      visitor_token: session.visitor_token,
      message: "Two bedrooms, walls only, two coats, light patching, standard paint.",
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.reply).toContain("draft");
    expect(deliverPublicEstimatorTurnToRuntime).toHaveBeenCalledOnce();
    expect(state.db!.tables.public_estimator_messages!.map((m) => m.direction)).toEqual(["visitor"]);
  });

  it("copy/download are scoped to the visitor session", async () => {
    const a = await createSession();
    const b = await createSession();
    state.db!.tables.artifacts!.push({
      id: "art_b",
      account_id: "acct_pub",
      employee_id: "emp_pub",
      kind: "estimate",
      storage_ref: null,
      payload: { job_description: "B job", line_items: [{ description: "Paint", amount: 500 }], recommended_total: 500 },
      created_at: new Date().toISOString(),
    });
    state.db!.tables.public_estimator_artifacts!.push({
      id: "peart_b",
      visitor_session_id: b.visitor_session_id,
      account_id: "acct_pub",
      employee_id: "emp_pub",
      artifact_id: "art_b",
      status: "current",
      created_at: new Date().toISOString(),
    });

    const denied = await req("/manager/public-estimator/action", {
      visitor_session_id: a.visitor_session_id,
      visitor_token: a.visitor_token,
      action: "copy",
    });
    expect(denied.status).toBe(404);

    const ok = await req("/manager/public-estimator/action", {
      visitor_session_id: b.visitor_session_id,
      visitor_token: b.visitor_token,
      action: "copy",
    });
    const body = await ok.json();
    expect(ok.status).toBe(200);
    expect(body.text).toContain("B job");
    expect(state.db!.tables.public_estimator_events!.some((e) => e.event_type === "draft_copied")).toBe(true);
  });
});
