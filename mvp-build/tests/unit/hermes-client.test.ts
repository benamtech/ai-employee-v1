import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatTurn, executeHermesTurn, getCapabilities, getHealth, invalidateRuntimeCapabilities, resolveRuntimeApi } from "../../apps/manager/src/lib/hermes-client";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { makeFakeDb } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

beforeEach(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
  delete process.env.HERMES_API_TOKEN;
});
afterEach(() => {
  invalidateRuntimeCapabilities(api());
  vi.restoreAllMocks();
});

const seededDb = () => makeFakeDb({
  employees: [{ id: "emp_1", account_id: "acct_1" }],
  runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test/", api_session_id: "sess_1" }],
  runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("hermes-key") }],
});

const api = () => ({
  runtime_endpoint_id: "rt_1",
  baseUrl: "https://runtime.test",
  sessionId: "sess_1",
  sessionKey: "amtech:v1:account:acct_1:employee:emp_1",
  accountId: "acct_1",
  employeeId: "emp_1",
  bearer: "hermes-key",
});

describe("hermes-client resolveRuntimeApi", () => {
  it("resolves base url, session, and opened bearer", async () => {
    const resolved = await resolveRuntimeApi(seededDb().asClient(), "emp_1");
    expect(resolved.baseUrl).toBe("https://runtime.test"); // trailing slash cleaned
    expect(resolved.sessionId).toBe("sess_1");
    expect(resolved.bearer).toBe("hermes-key");
  });

  it("rewrites persisted localhost runtime URLs to Docker DNS for docker employees", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{
        id: "rt_1",
        employee_id: "emp_1",
        api_base_url: "http://localhost:8975",
        backend_type: "docker",
        gateway_port: 8975,
      }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
    });
    expect((await resolveRuntimeApi(db.asClient(), "emp_1")).baseUrl).toBe("http://amtech-hermes-emp_1:8975");
  });

  it("throws when the runtime API row is missing", async () => {
    await expect(resolveRuntimeApi(makeFakeDb().asClient(), "emp_1")).rejects.toThrow("employee runtime API missing");
  });

    it("throws runtime_auth_missing when no sealed secret and no env token", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test" }],
    });
    await expect(resolveRuntimeApi(db.asClient(), "emp_1")).rejects.toThrow("runtime_auth_missing");
  });

  it("defaults the session id when unset", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
    });
    expect((await resolveRuntimeApi(db.asClient(), "emp_1")).sessionId).toBe("amtech-owner-thread");
  });

  it("requires account-backed employee identity for stable memory scope", async () => {
    const db = makeFakeDb({
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
    });
    await expect(resolveRuntimeApi(db.asClient(), "emp_1")).rejects.toThrow("employee runtime identity missing");
  });

  it("rejects persisted session keys with control characters", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_key: "bad\nkey" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
    });
    await expect(resolveRuntimeApi(db.asClient(), "emp_1")).rejects.toThrow("runtime_session_key_invalid");
  });
});

describe("hermes-client chatTurn", () => {
  for (const key of ["output", "text", "message", "response"] as const) {
    it(`extracts reply text from the "${key}" field`, async () => {
      vi.stubGlobal("fetch", routerFetch([
        { match: "/v1/capabilities", body: { features: { session_chat: true } } },
        { match: "/chat", body: { [key]: " hello " } },
        { match: "/api/sessions", body: { id: "sess_1" } },
      ]));
      const res = await chatTurn(api(), { input: "hi" });
      expect(res.text).toBe("hello");
    });
  }

  it("tolerates a 409 from ensureCanonicalSession", async () => {
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", body: { output: "ok" } },
      { match: "/api/sessions", status: 409, body: { error: "exists" } },
    ]));
    expect((await chatTurn(api(), { input: "hi" })).text).toBe("ok");
  });

  it("throws runtime_auth on a 401 chat response", async () => {
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", status: 401, body: {} },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));
    await expect(chatTurn(api(), { input: "hi" })).rejects.toThrow("runtime_auth");
  });

  it("falls back to a default acknowledgement when text is empty", async () => {
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", body: {} },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));
    expect((await chatTurn(api(), { input: "hi" })).text).toBe("I received it.");
  });
});

describe("hermes-client health/capabilities/timeout", () => {
  it("maps an aborted request to runtime_timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { const e = new Error("aborted"); e.name = "AbortError"; throw e; }));
    await expect(getHealth(api())).rejects.toThrow("runtime_timeout");
  });

  it("returns null capabilities on a non-ok response", async () => {
    vi.stubGlobal("fetch", routerFetch([{ match: "/v1/capabilities", status: 404, body: {} }]));
    expect(await getCapabilities(api())).toBeNull();
  });

  it("maps a non-ok health to runtime_<status>", async () => {
    vi.stubGlobal("fetch", routerFetch([{ match: "/health", status: 503, body: {} }]));
    await expect(getHealth(api())).rejects.toThrow("runtime_503");
  });
});

describe("hermes-client executeHermesTurn", () => {
  it("uses /v1/capabilities before /v1/runs and sends the session key when advertised", async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: unknown, init: RequestInit = {}) => {
      calls.push({ url: String(url), headers: new Headers(init.headers) });
      const u = String(url);
      if (u.includes("/v1/capabilities")) {
        return new Response(JSON.stringify({ features: { runs: true, session_key: true } }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (u.endsWith("/v1/runs")) {
        return new Response(JSON.stringify({ run_id: "hrun_1", status: "succeeded", output: " done " }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      throw new Error(`no mock route for ${u}`);
    }));

    const res = await executeHermesTurn(api(), { input: "hi", work_run_id: "run_1" });

    expect(res).toMatchObject({ text: "done", external_run_id: "hrun_1", mode: "runs" });
    expect(calls[0].url).toContain("/v1/capabilities");
    expect(calls[1].url).toContain("/v1/runs");
    expect(calls[1].headers.get("X-Hermes-Session-Key")).toBe("amtech:v1:account:acct_1:employee:emp_1");
  });

  it("falls back to Sessions chat when Runs are absent but session chat is advertised", async () => {
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", body: { output: "session ok" } },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));

    const res = await executeHermesTurn(api(), { input: "hi" });

    expect(res).toMatchObject({ text: "session ok", mode: "sessions" });
  });

  it("fails closed when neither Runs nor Sessions chat is advertised", async () => {
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: {} } },
    ]));

    await expect(executeHermesTurn(api(), { input: "hi" })).rejects.toThrow("runtime_capability_missing:session_chat");
  });
});
