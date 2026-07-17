import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@amtech/db";
import type { ProvisionerRequest } from "@amtech/shared";
import {
  employeeModelGatewayUrl,
  mintModelGatewayCredential,
  revokeModelGatewayCredential,
  verifyModelGatewayCredential,
} from "../../apps/manager/src/lib/model-gateway.js";
import {
  renderProfilePackage,
  rotateRenderedModelGatewayCredential,
} from "../../apps/manager/src/lib/profile-renderer.js";

interface QueryResult<T = unknown> {
  data: T;
  error: null;
}

type Filter = (row: Record<string, unknown>) => boolean;

class FakeQuery implements PromiseLike<QueryResult<any>> {
  private operation: "select" | "insert" | "update" = "select";
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private filters: Filter[] = [];
  private limitCount: number | null = null;
  private orderKey: string | null = null;
  private orderAscending = true;

  constructor(private readonly db: FakeSupabase, private readonly table: string) {}

  select(_columns = "*"): this {
    this.operation = "select";
    return this;
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>): this {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderKey = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(value: number): this {
    this.limitCount = value;
    return this;
  }

  async maybeSingle(): Promise<QueryResult<Record<string, unknown> | null>> {
    const result = await this.execute();
    const rows = Array.isArray(result.data) ? result.data : [result.data];
    return { data: (rows[0] as Record<string, unknown> | undefined) ?? null, error: null };
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult<any>> {
    const rows = this.db.rows(this.table);
    if (this.operation === "insert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
      for (const value of values) rows.push({ created_at: new Date().toISOString(), ...value });
      return { data: values, error: null };
    }
    const matches = rows.filter((row) => this.filters.every((filter) => filter(row)));
    if (this.operation === "update") {
      for (const row of matches) Object.assign(row, this.payload ?? {});
      return { data: matches, error: null };
    }
    let selected = [...matches];
    if (this.orderKey) {
      const key = this.orderKey;
      const direction = this.orderAscending ? 1 : -1;
      selected.sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? "")) * direction);
    }
    if (this.limitCount !== null) selected = selected.slice(0, this.limitCount);
    return { data: selected, error: null };
  }
}

class FakeSupabase {
  private readonly tables = new Map<string, Record<string, unknown>[]>();

  from(table: string): FakeQuery {
    return new FakeQuery(this, table);
  }

  rows(table: string): Record<string, unknown>[] {
    const current = this.tables.get(table) ?? [];
    this.tables.set(table, current);
    return current;
  }
}

let tempRoot: string | null = null;
const previousEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...previousEnv };
  process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
  process.env.MODEL_GATEWAY_SIGNING_SECRET = "unit-test-model-gateway-signing-secret";
  process.env.MODEL_GATEWAY_EMPLOYEE_BASE_URL = "http://host.docker.internal:8092/v1";
  process.env.MODEL_GATEWAY_MODEL_ALIAS = "amtech-primary";
  process.env.MODEL_GATEWAY_ALLOWED_MODELS = "amtech-primary";
  process.env.MODEL_GATEWAY_ALLOWED_PROVIDERS = "openai_compatible";
});

afterEach(async () => {
  process.env = { ...previousEnv };
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
  tempRoot = null;
});

describe("model gateway credential isolation", () => {
  it("fails closed for malformed, expired, revoked, and cross-employee credentials", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const valid = await mintModelGatewayCredential(db, {
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      policy: { expires_at: new Date(Date.now() + 60_000).toISOString() },
    });

    expect(valid.policy.gateway_url).toBe(employeeModelGatewayUrl("emp_alpha"));
    expect(await verifyModelGatewayCredential(db, `Bearer ${valid.token}`, { account_id: "acct_alpha", employee_id: "emp_alpha" })).not.toBeNull();
    expect(await verifyModelGatewayCredential(db, "Bearer malformed", { employee_id: "emp_alpha" })).toBeNull();
    expect(await verifyModelGatewayCredential(db, `Bearer ${valid.token}`, { employee_id: "emp_bravo" })).toBeNull();

    const expired = await mintModelGatewayCredential(db, {
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      policy: { credential_version: 2, expires_at: new Date(Date.now() - 1_000).toISOString() },
    });
    expect(await verifyModelGatewayCredential(db, `Bearer ${expired.token}`, { employee_id: "emp_alpha" })).toBeNull();

    await revokeModelGatewayCredential(db, valid.credential_id);
    expect(await verifyModelGatewayCredential(db, `Bearer ${valid.token}`, { employee_id: "emp_alpha" })).toBeNull();
  });

  it("keeps the replacement live and rejects the old token after rotation sequencing", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const oldCredential = await mintModelGatewayCredential(db, {
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      policy: { credential_version: 1, expires_at: new Date(Date.now() + 60_000).toISOString() },
    });
    const replacement = await mintModelGatewayCredential(db, {
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      policy: { credential_version: 2, expires_at: new Date(Date.now() + 60_000).toISOString() },
      rotated_from_credential_id: oldCredential.credential_id,
    });

    const live = await verifyModelGatewayCredential(db, `Bearer ${replacement.token}`, { account_id: "acct_alpha", employee_id: "emp_alpha" });
    expect(live?.credential_version).toBe(2);
    await revokeModelGatewayCredential(db, oldCredential.credential_id);
    expect(await verifyModelGatewayCredential(db, `Bearer ${oldCredential.token}`, { employee_id: "emp_alpha" })).toBeNull();
    expect(await verifyModelGatewayCredential(db, `Bearer ${replacement.token}`, { employee_id: "emp_alpha" })).not.toBeNull();
  });
});

async function allText(root: string): Promise<string> {
  const chunks: string[] = [];
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else {
        try { chunks.push(await readFile(path, "utf8")); } catch { /* binary */ }
      }
    }
  };
  await walk(root);
  return chunks.join("\n");
}

function profileRequest(token: string, credentialVersion: number, workspace: string): ProvisionerRequest {
  return {
    operation: "render_profile",
    account_id: "acct_alpha",
    employee_id: "emp_alpha",
    manifest_id: "man_alpha",
    profile_package_key: "contractor_estimator",
    params: {
      client_id: "client-alpha",
      account_id: "acct_alpha",
      employee_id: "emp_alpha",
      profile_package_key: "contractor_estimator",
      runtime_backend: "docker",
      business_display_name: "Alpha Painting",
      business_kind: "painting_contractor",
      owner_name: "Alex Owner",
      owner_phone_e164: "+15555550100",
      employee_name: "Avery",
      timezone: "America/New_York",
      workspace_dir: workspace,
      webhook_url: "https://api.example.test/webhooks/twilio/emp_alpha",
      gateway_port: 8101,
      top_workflows: ["estimate"],
      tools_mentioned: ["gmail", "stripe"],
      seed_skills: ["estimate"],
      api_server_key: "scoped-api-server-key",
      profile_context: {
        package_key: "contractor_estimator",
        generated_from: "onboarding_manifest",
        memory_limits: { memory_chars: 2200, user_chars: 1375 },
        resource_pointers: [],
        slots: [],
      },
      model_gateway: {
        gateway_url: employeeModelGatewayUrl("emp_alpha"),
        model_alias: "amtech-primary",
        allowed_providers: ["openai_compatible"],
        allowed_models: ["amtech-primary"],
        spend_limit_cents: 40000,
        rate_limit_per_minute: 60,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        credential_version: credentialVersion,
      },
    },
    render_secrets: {
      manager_mcp_token: "mcp_scoped_alpha",
      model_gateway_token: token,
    },
  };
}

describe("rendered profile isolation", () => {
  it("renders no provider master secrets or unresolved tokens and updates checksum on rotation", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "amtech-profile-proof-"));
    process.env.AMTECH_MVP_ROOT = process.cwd();
    process.env.HERMES_HOME = join(tempRoot, "hermes");
    process.env.PROFILE_VALIDATION_COMMAND = "node -e \"process.exit(0)\"";
    process.env.NODE_ENV = "production";
    process.env.MODEL_GATEWAY_PROVIDER_API_KEY = "MASTER_PROVIDER_SECRET_MUST_NOT_RENDER";
    process.env.OPENAI_API_KEY = "OPENAI_MASTER_SECRET_MUST_NOT_RENDER";

    const firstToken = "mgw_scoped_employee_alpha_v1";
    const first = await renderProfilePackage(profileRequest(firstToken, 1, join(tempRoot, "workspace")));
    const firstText = await allText(first.generated_path);
    expect(firstText).toContain(employeeModelGatewayUrl("emp_alpha"));
    expect(firstText).toContain(firstToken);
    expect(firstText).not.toContain(process.env.MODEL_GATEWAY_PROVIDER_API_KEY);
    expect(firstText).not.toContain(process.env.OPENAI_API_KEY);
    expect(firstText).not.toMatch(/{{\s*[A-Z0-9_]+\s*}}/);

    const secondToken = "mgw_scoped_employee_alpha_v2";
    const rotatedRequest = profileRequest(secondToken, 2, join(tempRoot, "workspace"));
    rotatedRequest.operation = "rotate_model_gateway_credential";
    const rotated = await rotateRenderedModelGatewayCredential(rotatedRequest);
    const rotatedText = await allText(rotated.generated_path);
    expect(rotated.profile_checksum).not.toBe(first.profile_checksum);
    expect(rotatedText).toContain(secondToken);
    expect(rotatedText).not.toContain(firstToken);
    expect(rotatedText).not.toContain(process.env.MODEL_GATEWAY_PROVIDER_API_KEY);
    expect(rotatedText).not.toMatch(/{{\s*[A-Z0-9_]+\s*}}/);
  });
});

describe("production gateway exposure", () => {
  it("keeps the gateway loopback-bound and out of public Caddy routing", async () => {
    const compose = await readFile(join(process.cwd(), "infra/deploy/docker-compose.production.yml"), "utf8");
    const caddy = await readFile(join(process.cwd(), "infra/caddy/production.Caddyfile"), "utf8");
    expect(compose).toContain('MODEL_GATEWAY_EMPLOYEE_BASE_URL: ${MODEL_GATEWAY_EMPLOYEE_BASE_URL:-http://host.docker.internal:8092/v1}');
    expect(compose).toContain('"127.0.0.1:8092:8092"');
    expect(caddy).not.toContain("8092");
    expect(caddy.toLowerCase()).not.toContain("model-gateway");
  });
});
