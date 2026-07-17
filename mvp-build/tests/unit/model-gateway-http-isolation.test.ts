import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@amtech/db";
import { mintModelGatewayCredential, revokeModelGatewayCredential } from "../../apps/manager/src/lib/model-gateway.js";
import { buildModelGatewayApp } from "../../apps/manager/src/lib/model-gateway-http.js";

interface QueryResult<T = unknown> { data: T; error: null | { code?: string; message: string } }
type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

class FakeQuery implements PromiseLike<QueryResult<any>> {
  private operation: "select" | "insert" | "update" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Filter[] = [];

  constructor(private readonly store: FakeSupabase, private readonly table: string) {}

  select(_columns = "*"): this { return this; }
  insert(payload: Row | Row[]): this { this.operation = "insert"; this.payload = payload; return this; }
  update(payload: Row): this { this.operation = "update"; this.payload = payload; return this; }
  eq(column: string, value: unknown): this { this.filters.push((row) => row[column] === value); return this; }
  is(column: string, value: unknown): this {
    this.filters.push((row) => value === null ? row[column] == null : row[column] === value);
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
    const matches = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.operation === "update") {
      for (const row of matches) Object.assign(row, this.payload ?? {});
      return { data: matches, error: null };
    }
    return { data: [...matches], error: null };
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
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.NODE_ENV = "production";
  process.env.SECRET_REF_MASTER_KEY = "http-isolation-test-secret-ref-key";
  process.env.MODEL_GATEWAY_SIGNING_SECRET = "http-isolation-test-signing-key";
  process.env.MODEL_GATEWAY_EMPLOYEE_BASE_URL = "http://host.docker.internal:8092/v1";
  process.env.MODEL_GATEWAY_UPSTREAM_BASE_URL = "https://provider.example.test/v1";
  process.env.MODEL_GATEWAY_PROVIDER_API_KEY = "provider-master-key-never-returned";
  process.env.MODEL_GATEWAY_ALLOWED_MODELS = "amtech-primary";
  process.env.MODEL_GATEWAY_ALLOWED_PROVIDERS = "openai_compatible";
  process.env.MODEL_GATEWAY_UPSTREAM_MODEL = "provider-model";
  process.env.MODEL_GATEWAY_MAX_RETRIES = "0";
});

afterEach(() => { process.env = { ...originalEnv }; });

function request(employeeId: string, token: string): Request {
  return new Request(`http://gateway.test/v1/employees/${employeeId}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "amtech-primary", messages: [{ role: "user", content: "ping" }], max_tokens: 1 }),
  });
}

describe("model gateway HTTP isolation", () => {
  it("accepts only the credential bound to the employee route and never calls upstream for rejected credentials", async () => {
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

    const upstreamCalls: Array<{ url: string; authorization: string | null; employee: string | null }> = [];
    const app = buildModelGatewayApp({
      db: () => db,
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        upstreamCalls.push({
          url: String(input),
          authorization: headers.get("Authorization"),
          employee: headers.get("X-Amtech-Employee-Id"),
        });
        return new Response(JSON.stringify({ id: "provider-response", usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    const ownA = await app.fetch(request("emp_alpha", employeeA.token));
    expect(ownA.status).toBe(200);
    expect((await ownA.json()).model).toBe("amtech-primary");
    expect(upstreamCalls).toHaveLength(1);
    expect(upstreamCalls[0]?.employee).toBe("emp_alpha");
    expect(upstreamCalls[0]?.authorization).toBe("Bearer provider-master-key-never-returned");

    for (const [label, req] of [
      ["malformed", request("emp_alpha", "malformed")],
      ["expired", request("emp_alpha", expired.token)],
      ["revoked", request("emp_alpha", revoked.token)],
      ["cross-employee-a-to-b", request("emp_bravo", employeeA.token)],
      ["cross-employee-b-to-a", request("emp_alpha", employeeB.token)],
    ] as const) {
      const response = await app.fetch(req);
      expect(response.status, label).toBe(401);
    }
    expect(upstreamCalls).toHaveLength(1);
  });

  it("keeps legacy unbound OpenAI-compatible routes absent in production", async () => {
    const fake = new FakeSupabase();
    const app = buildModelGatewayApp({ db: () => fake as unknown as SupabaseClient, fetch: globalThis.fetch });
    const response = await app.request("/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "employee_route_required" } });
  });
});
