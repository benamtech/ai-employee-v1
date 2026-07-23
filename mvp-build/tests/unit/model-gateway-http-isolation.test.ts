import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@amtech/db";
import { mintModelGatewayCredential, revokeModelGatewayCredential } from "../../apps/manager/src/lib/model-gateway.js";
import { buildModelGatewayApp } from "../../apps/manager/src/lib/model-gateway-http.js";
import type {
  GatewayCommercialAdmission,
  GatewayCommercialRecord,
  GatewayCommercialStore,
  GatewaySettlementInput,
} from "../../apps/manager/src/lib/model-gateway-commercial.js";

interface QueryResult<T = unknown> { data: T; error: null | { code?: string; message: string } }
type Row = Record<string, any>;
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
  is(column: string, value: unknown): this { this.filters.push((row) => value === null ? row[column] == null : row[column] === value); return this; }
  lte(_column: string, _value: unknown): this { return this; }
  or(_expression: string): this { return this; }
  order(column: string, options?: { ascending?: boolean }): this { this.orderKey = column; this.orderAscending = options?.ascending ?? true; return this; }

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
        const existing = value.id == null ? null : rows.find((row) => row.id === value.id);
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
      const direction = this.orderAscending ? 1 : -1;
      selected.sort((left, right) => String(left[this.orderKey!] ?? "").localeCompare(String(right[this.orderKey!] ?? "")) * direction);
    }
    return { data: selected, error: null };
  }
}

class MemoryCommercialStore<T> implements GatewayCommercialStore<T> {
  readonly rows = new Map<string, GatewayCommercialRecord<T>>();
  async admit(input: GatewayCommercialAdmission) {
    const existing = this.rows.get(input.request_key);
    if (existing) return { kind: "replay" as const, record: existing };
    const row: GatewayCommercialRecord<T> = {
      request_key: input.request_key,
      assignment_id: input.assignment_id,
      revision_id: input.revision_id,
      request_hash: input.request_hash,
      provider_idempotency_key: input.provider_idempotency_key,
      rate_window_key: input.rate_window_key,
      state: "admitted",
      reserved_amount_minor: input.reserve_amount_minor,
      committed_amount_minor: 0,
      released_amount_minor: 0,
      refunded_amount_minor: 0,
      provider_receipt_id: null,
      effect_receipt_id: null,
      accounting_receipt_id: null,
      error_code: null,
      ambiguity_code: null,
      response: null,
      proof_state: "pending",
      proof_ref: null,
      command_id: `cmd_${input.request_key}`,
      command_intent_id: `intent_${input.request_key}`,
      effect_key: input.effect_key,
      correlation_id: input.correlation_id,
    };
    this.rows.set(input.request_key, row);
    return { kind: "admitted" as const, record: row };
  }
  async markDispatched(requestKey: string) { const row = this.must(requestKey); row.state = "dispatched"; return row; }
  async settle(input: GatewaySettlementInput<T>) {
    const row = this.must(input.request_key);
    row.state = input.state;
    row.provider_receipt_id = input.provider_receipt_id ?? null;
    row.effect_receipt_id = input.effect_receipt_id ?? null;
    row.accounting_receipt_id = input.accounting_receipt_id ?? null;
    row.error_code = input.error_code ?? null;
    row.ambiguity_code = input.ambiguity_code ?? null;
    row.response = input.response ?? null;
    if (input.state === "accepted") {
      row.committed_amount_minor = input.amount_minor;
      row.released_amount_minor = row.reserved_amount_minor - input.amount_minor;
    }
    if (input.state === "failed") row.released_amount_minor = row.reserved_amount_minor;
    return row;
  }
  async markProofProjected(requestKey: string, proofRef: string) { const row = this.must(requestKey); row.proof_state = "projected"; row.proof_ref = proofRef; return row; }
  private must(requestKey: string) { const row = this.rows.get(requestKey); if (!row) throw new Error("missing_gateway_request"); return row; }
}

class FakeSupabase {
  private readonly tables = new Map<string, Row[]>();
  readonly commercial = new MemoryCommercialStore<any>();
  from(table: string): FakeQuery { return new FakeQuery(this, table); }
  rows(table: string): Row[] { const rows = this.tables.get(table) ?? []; this.tables.set(table, rows); return rows; }

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
    const ensure = (table: string, row: Row) => { if (!this.rows(table).some((current) => current.id === row.id)) this.rows(table).push(row); };
    ensure("employee_assignments", { id: assignmentId, account_id: accountId, employee_principals: { employee_id: employeeId } });
    ensure("commercial_relationships", {
      id: payerId, assignment_id: assignmentId, relationship_type: "payer", organization_id: `org_${employeeId}`,
      account_id: accountId, status: "active", starts_at: startsAt, ends_at: null,
    });
    ensure("commercial_relationships", {
      id: beneficiaryId, assignment_id: assignmentId, relationship_type: "beneficiary", organization_id: `org_${employeeId}`,
      account_id: accountId, status: "active", starts_at: startsAt, ends_at: null,
    });
    ensure("commercial_price_versions", {
      id: priceId, assignment_id: assignmentId, policy_key: "provider-cost-observation", version: "1.0.0",
      currency: "USD", unit: "provider_request", unit_price_minor: 0, status: "active", effective_at: startsAt, expires_at: null,
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
});
afterEach(() => { process.env = { ...originalEnv }; });

function request(employeeId: string, token: string, body: Record<string, unknown> = {}): Request {
  return new Request(`http://gateway.test/v1/employees/${employeeId}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "amtech-primary", messages: [{ role: "user", content: "ping" }], max_tokens: 1, ...body }),
  });
}

function app(fake: FakeSupabase, fetch: typeof globalThis.fetch) {
  const db = fake as unknown as SupabaseClient;
  return buildModelGatewayApp({
    db: () => db,
    fetch,
    commercialStore: () => fake.commercial,
    executeEffect: (async <T>(_db: SupabaseClient, input: any) => {
      const applied = await input.apply();
      return { replayed: false, command_id: input.command_id, effect_id: "eff_test", receipt_id: "erec_test", result: applied.result as T };
    }) as any,
  });
}

describe("model gateway HTTP isolation", () => {
  it("accepts only assignment-bound credentials and preserves receipt/accounting/proof identity", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const employeeA = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    const employeeB = await mintModelGatewayCredential(db, { account_id: "acct_bravo", employee_id: "emp_bravo" });
    const revoked = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha", policy: { credential_version: 2 } });
    await revokeModelGatewayCredential(db, revoked.credential_id);

    const upstreamCalls: Array<{ authorization: string | null; assignment: string | null; idempotency: string | null; body: Row }> = [];
    const gateway = app(fake, async (_input, init) => {
      const headers = new Headers(init?.headers);
      upstreamCalls.push({
        authorization: headers.get("Authorization"),
        assignment: headers.get("X-Amtech-Assignment-Id"),
        idempotency: headers.get("Idempotency-Key"),
        body: JSON.parse(String(init?.body ?? "{}")),
      });
      return new Response(JSON.stringify({ id: "provider-response", usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), {
        status: 200,
        headers: { "Content-Type": "application/json", "x-request-id": "provider-request-alpha" },
      });
    });

    const own = await gateway.fetch(request("emp_alpha", employeeA.token));
    expect(own.status).toBe(200);
    const response = await own.json() as Row;
    expect(response.model).toBe("amtech-primary");
    expect(response.amtech_gateway).toMatchObject({
      assignment_id: "asn_emp_alpha",
      provider_receipt_id: "provider-request-alpha",
      effect_receipt_id: "erec_test",
      proof_ref: expect.stringContaining("commercial://assignments/asn_emp_alpha/model-requests/"),
    });
    expect(response.amtech_gateway.accounting_receipt_id).toMatch(/^usage_/);
    expect(upstreamCalls[0]).toMatchObject({
      assignment: "asn_emp_alpha",
      authorization: "Bearer provider-master-key-never-returned",
      idempotency: expect.stringMatching(/^amtech-/),
      body: { model: "provider-model", stream: false },
    });
    expect(fake.rows("commercial_usage_receipts")[0]).toMatchObject({ effect_receipt_id: "erec_test", state: "accepted" });

    for (const [label, req] of [
      ["malformed", request("emp_alpha", "malformed")],
      ["revoked", request("emp_alpha", revoked.token)],
      ["cross-a-to-b", request("emp_bravo", employeeA.token)],
      ["cross-b-to-a", request("emp_alpha", employeeB.token)],
    ] as const) {
      const rejected = await gateway.fetch(req);
      expect(rejected.status, label).toBe(401);
    }
    expect(upstreamCalls).toHaveLength(1);
  });

  it("rejects aliases and caller-supplied provider authority before dispatch", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    let upstreamCalls = 0;
    const gateway = app(fake, async () => { upstreamCalls += 1; return new Response(); });

    expect((await gateway.fetch(request("emp_alpha", credential.token, { model: "provider-model" }))).status).toBe(403);
    for (const body of [{ provider: "attacker" }, { base_url: "https://attacker.test" }, { api_key: "attacker" }, { headers: { Authorization: "attacker" } }]) {
      const response = await gateway.fetch(request("emp_alpha", credential.token, body));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "provider_authority_fields_forbidden" } });
    }
    expect(upstreamCalls).toBe(0);
  });

  it("invalidates signed credentials when durable routing policy changes", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    fake.rows("model_gateway_credentials").find((row) => row.id === credential.credential_id)!.allowed_models = ["changed-model"];
    let upstreamCalls = 0;
    const response = await app(fake, async () => { upstreamCalls += 1; return new Response(); }).fetch(request("emp_alpha", credential.token));
    expect(response.status).toBe(401);
    expect(upstreamCalls).toBe(0);
  });

  it("persists response loss as ambiguity and does not redispatch the same request", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    let upstreamCalls = 0;
    const gateway = app(fake, async () => { upstreamCalls += 1; throw new Error("connection_reset_after_write"); });
    const first = await gateway.fetch(request("emp_alpha", credential.token));
    const replay = await gateway.fetch(request("emp_alpha", credential.token));
    expect(first.status).toBe(502);
    expect(replay.status).toBe(502);
    expect(await replay.json()).toMatchObject({ error: { code: "model_gateway_provider_outcome_ambiguous" } });
    expect(upstreamCalls).toBe(1);
  });

  it("fails closed for unavailable routes and keeps legacy unbound routes absent", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const credential = await mintModelGatewayCredential(db, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    process.env.MODEL_GATEWAY_PROVIDER_PROFILE = "not_registered";
    expect((await app(fake, globalThis.fetch).fetch(request("emp_alpha", credential.token))).status).toBe(503);
    const legacy = await app(fake, globalThis.fetch).request("/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    expect(legacy.status).toBe(404);
    expect(await legacy.json()).toEqual({ error: { code: "employee_route_required" } });
  });
});
