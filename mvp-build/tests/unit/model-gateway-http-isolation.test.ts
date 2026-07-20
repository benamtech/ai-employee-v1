import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@amtech/db";
import { mintModelGatewayCredential, revokeModelGatewayCredential } from "../../apps/manager/src/lib/model-gateway.js";
import { buildModelGatewayApp } from "../../apps/manager/src/lib/model-gateway-http.js";

interface QueryResult<T = unknown> { data: T; error: null | { code?: string; message: string } }
type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

class FakeQuery implements PromiseLike<QueryResult<any>> {
  private operation: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Filter[] = [];
  private orderKey: string | null = null;
  private orderAscending = true;

  constructor(private readonly store: FakeSupabase, private readonly table: string) {}

  select(_columns = "*"): this { return this; }
  insert(payload: Row | Row[]): this { this.operation = "insert"; this.payload = payload; return this; }
  update(payload: Row): this { this.operation = "update"; this.payload = payload; return this; }
  upsert(payload: Row | Row[], _options?: Record<string, unknown>): this { this.operation = "upsert"; this.payload = payload; return this; }
  eq(column: string, value: unknown): this { this.filters.push((row) => row[column] === value); return this; }
  is(column: string, value: unknown): this {
    this.filters.push((row) => value === null ? row[column] == null : row[column] === value);
    return this;
  }
  lte(_column: string, _value: unknown): this { return this; }
  or(_expression: string): this { return this; }
  order(column: string, options?: { ascending?: boolean }): this {
    this.orderKey = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  async maybeSingle(): Promise<QueryResult<Row | null>> {
    const result = await this.execute();
    const rows = Array.isArray(result.data) ? result.data : [result.data];
    return { data: (rows[0] as Row | undefined) ?? null, error: result.error };
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult<any>> {
    const rows = this.store.rows(this.table);
    if (this.operation === "insert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      rows.push(...values.map((value) => ({ created_at: new Date().toISOString(), ...value })));
      return { data: values, error: null };
    }
    if (this.operation === "upsert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      const written: Row[] = [];
      for (const value of values) {
        const id = value.id;
        const existing = id == null ? null : rows.find((row) => row.id === id);
        if (existing) Object.assign(existing, value);
        else rows.push({ created_at: new Date().toISOString(), ...value });
        written.push(existing ?? value);
      }
      return { data: written, error: null };
    }
    const matches = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.operation === "update") {
      for (const row of matches) Object.assign(row, this.payload ?? {});
      return { data: matches, error: null };
    }
    const selected = [...matches];
    if (this.orderKey) {
      const key = this.orderKey;
      const direction = this.orderAscending ? 1 : -1;
      selected.sort((left, right) => String(left[key] ?? "").localeCompare(String(right[key] ?? "")) * direction);
    }
    return { data: selected, error: null };
  }
}

class FakeSupabase {
  private readonly tables = new Map<string, Row[]>();

  from(table: string): FakeQuery { return new FakeQuery(this, table); }

  rows(table: string): Row[] {
    const rows = this.tables.get(table) ?? [];
    this.tables.set(table, rows);
    return rows;
  }

  async rpc(name: string, params: Record<string, unknown>): Promise<QueryResult<unknown>> {
    if (name !== "amtech_default_assignment_for_employee_account") {
      return { data: null, error: { message: `unsupported_rpc:${name}` } };
    }
    const employeeId = String(params.p_employee_id ?? "");
    const accountId = String(params.p_account_id ?? "");
    const assignmentId = `asn_${employeeId}`;
    const payerId = `crel_payer_${employeeId}`;
    const beneficiaryId = `crel_beneficiary_${employeeId}`;
    const priceId = `price_${employeeId}`;
    const startsAt = "2026-01-01T00:00:00.000Z";
    const ensure = (table: string, row: Row) => {
      if (!this.rows(table).some((current) => current.id === row.id)) this.rows(table).push(row);
    };
    ensure("employee_assignments", {
      id: assignmentId,
      account_id: accountId,
      employee_principals: { employee_id: employeeId },
    });
    ensure("commercial_relationships", {
      id: payerId,
      assignment_id: assignmentId,
      relationship_type: "payer",
      organization_id: `org_payer_${employeeId}`,
      account_id: accountId,
      status: "active",
      starts_at: startsAt,
      ends_at: null,
    });
    ensure("commercial_relationships", {
      id: beneficiaryId,
      assignment_id: assignmentId,
      relationship_type: "beneficiary",
      organization_id: `org_beneficiary_${employeeId}`,
      account_id: accountId,
      status: "active",
      starts_at: startsAt,
      ends_at: null,
    });
    ensure("commercial_price_versions", {
      id: priceId,
      assignment_id: assignmentId,
      policy_key: "provider-cost-observation",
      version: "1.0.0",
      currency: "USD",
      unit: "provider_request",
      unit_price_minor: 0,
      status: "active",
      effective_at: startsAt,
      expires_at: null,
    });
    return { data: assignmentId, error: null };
  }
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.NODE_ENV = "production";
  process.env.SECRET_REF_MASTER_KEY = "http-isolation-test-secret-ref-key";
  process.env.MODEL_GATEWAY_SIGNING_SECRET = "http-isolation-test-signing-key";
  process.env.MODEL_GATEWAY_EMPLOYEE_BASE_URL = "http://host.docker.internal:8092/v1";
  process.env.MODEL_GATEWAY_PROVIDER_PROFILE = "openai_compatible";
  process.env.MODEL_GATEWAY_UPSTREAM_BASE_URL = "https://provider.example.test/v1";
  process.env.MODEL_GATEWAY_PROVIDER_API_KEY = "provider-master-key-never-returned";
  process.env.MODEL_GATEWAY_ALLOWED_MODELS = "provider-model";
  process.env.MODEL_GATEWAY_ALLOWED_PROVIDERS = "openai_compatible";
  process.env.MODEL_GATEWAY_UPSTREAM_MODEL = "provider-model";
  process.env.MODEL_GATEWAY_MAX_RETRIES = "0";
});

afterEach(() => { process.env = { ...originalEnv }; });

function request(employeeId: string, token: string, body: Record<string, unknown> = {}): Request {
  return new Request(`http://gateway.test/v1/employees/${employeeId}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "amtech-primary", messages: [{ role: "user", content: "ping" }], max_tokens: 1, ...body }),
  });
}

describe("model gateway HTTP isolation", () => {
  it("accepts only the assignment-bound credential and resolves the alias through the Manager provider registry", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const employeeA = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    const employeeB = await mintModelGatewayCredential(db, { account_id: "acct_bravo", employee_id: "emp_bravo" });
    const expired = await mintModelGatewayCredential(db, {
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      policy: { credential_version: 2, expires_at: new Date(Date.now() - 1_000).toISOString() },
    });
    const revoked = await mintModelGatewayCredential(db, {
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      policy: { credential_version: 3, expires_at: new Date(Date.now() + 60_000).toISOString() },
    });
    await revokeModelGatewayCredential(db, revoked.credential_id);

    const upstreamCalls: Array<{ url: string; authorization: string | null; assignment: string | null; body: Record<string, unknown> }> = [];
    const app = buildModelGatewayApp({
      db: () => db,
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        upstreamCalls.push({
          url: String(input),
          authorization: headers.get("Authorization"),
          assignment: headers.get("X-Amtech-Assignment-Id"),
          body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
        });
        return new Response(JSON.stringify({ id: "provider-response", usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), {
          status: 200,
          headers: { "Content-Type": "application/json", "x-request-id": "provider-request-alpha" },
        });
      },
    });

    const ownA = await app.fetch(request("emp_alpha", employeeA.token));
    expect(ownA.status).toBe(200);
    const response = await ownA.json() as Record<string, any>;
    expect(response.model).toBe("amtech-primary");
    expect(response.amtech_gateway.assignment_id).toBe("asn_emp_alpha");
    expect(response.amtech_gateway.provider_receipt_id).toBe("provider-request-alpha");
    expect(response.amtech_gateway.accounting_receipt_id).toMatch(/^usage_/);
    expect(upstreamCalls).toHaveLength(1);
    expect(upstreamCalls[0]).toMatchObject({
      url: "https://provider.example.test/v1/chat/completions",
      assignment: "asn_emp_alpha",
      authorization: "Bearer provider-master-key-never-returned",
      body: { model: "provider-model", stream: false },
    });
    expect(fake.rows("commercial_usage_receipts")).toHaveLength(1);
    expect(fake.rows("model_gateway_request_audit")[0]).toMatchObject({
      assignment_id: "asn_emp_alpha",
      provider: "openai_compatible",
      upstream_model: "provider-model",
      provider_receipt_id: "provider-request-alpha",
      status: "ok",
    });

    for (const [label, req] of [
      ["malformed", request("emp_alpha", "malformed")],
      ["expired", request("emp_alpha", expired.token)],
      ["revoked", request("emp_alpha", revoked.token)],
      ["cross-employee-a-to-b", request("emp_bravo", employeeA.token)],
      ["cross-employee-b-to-a", request("emp_alpha", employeeB.token)],
    ] as const) {
      const rejected = await app.fetch(req);
      expect(rejected.status, label).toBe(401);
    }
    expect(upstreamCalls).toHaveLength(1);
  });

  it("rejects upstream model names even when they are in the signed policy", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    let upstreamCalls = 0;
    const app = buildModelGatewayApp({ db: () => db, fetch: async () => { upstreamCalls += 1; return new Response(); } });

    const response = await app.fetch(request("emp_alpha", credential.token, { model: "provider-model" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "model_alias_required" } });
    expect(upstreamCalls).toBe(0);
    expect(fake.rows("model_gateway_request_audit").at(-1)).toMatchObject({
      provider: "none",
      upstream_model: "provider-model",
      error_code: "model_alias_required",
      status: "failed",
    });
  });

  it("rejects caller-supplied provider routing, endpoints, headers, and credentials before dispatch", async () => {
    const forbiddenBodies = [
      { provider: "attacker" },
      { provider_profile: "attacker" },
      { upstream_model: "attacker-model" },
      { base_url: "https://attacker.test" },
      { api_key: "attacker-key" },
      { headers: { Authorization: "Bearer attacker" } },
      { extra_headers: { Authorization: "Bearer attacker" } },
      { extra_body: { provider: "attacker" } },
      { endpoint: "https://attacker.test" },
      { authorization: "Bearer attacker" },
      { credential: "attacker" },
      { token: "attacker" },
      { routing: { provider: "attacker" } },
    ];

    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    let upstreamCalls = 0;
    const app = buildModelGatewayApp({ db: () => db, fetch: async () => { upstreamCalls += 1; return new Response(); } });

    for (const body of forbiddenBodies) {
      const response = await app.fetch(request("emp_alpha", credential.token, body));
      expect(response.status, JSON.stringify(body)).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "provider_authority_fields_forbidden" } });
    }
    expect(upstreamCalls).toBe(0);
    expect(fake.rows("model_gateway_request_audit")).toHaveLength(forbiddenBodies.length);
    expect(fake.rows("model_gateway_request_audit").every((row) => row.provider === "none" && row.error_code === "provider_authority_fields_forbidden")).toBe(true);
  });

  it("invalidates a signed credential when its durable provider policy changes", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    const row = fake.rows("model_gateway_credentials").find((candidate) => candidate.id === credential.credential_id);
    expect(row).toBeDefined();
    row!.allowed_models = ["different-provider-model"];

    let upstreamCalls = 0;
    const app = buildModelGatewayApp({ db: () => db, fetch: async () => { upstreamCalls += 1; return new Response(); } });
    const response = await app.fetch(request("emp_alpha", credential.token));
    expect(response.status).toBe(401);
    expect(upstreamCalls).toBe(0);
  });

  it("fails closed when deployment selects an unregistered or disallowed provider profile", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    let upstreamCalls = 0;
    const app = buildModelGatewayApp({ db: () => db, fetch: async () => { upstreamCalls += 1; return new Response(); } });

    process.env.MODEL_GATEWAY_PROVIDER_PROFILE = "not_registered";
    const unknown = await app.fetch(request("emp_alpha", credential.token));
    expect(unknown.status).toBe(503);
    expect(await unknown.json()).toMatchObject({ error: { code: "model_gateway_route_unavailable" } });

    process.env.MODEL_GATEWAY_PROVIDER_PROFILE = "xai";
    const disallowed = await app.fetch(request("emp_alpha", credential.token));
    expect(disallowed.status).toBe(503);
    expect(await disallowed.json()).toMatchObject({ error: { code: "model_gateway_route_unavailable" } });
    expect(upstreamCalls).toBe(0);
  });

  it("keeps legacy unbound OpenAI-compatible routes absent in production", async () => {
    const fake = new FakeSupabase();
    const app = buildModelGatewayApp({ db: () => fake as unknown as SupabaseClient, fetch: globalThis.fetch });
    const response = await app.request("/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "employee_route_required" } });
  });
});
