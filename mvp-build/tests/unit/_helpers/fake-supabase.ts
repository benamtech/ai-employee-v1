/**
 * Minimal in-memory fake of the Supabase client subset the Manager tools use.
 * Unit tests only (provider mocks are forbidden in MVP acceptance). Supports the
 * fluent chain the tools actually call: from().select/insert/update/upsert
 * .eq/.in/.is/.gte/.order/.limit/.maybeSingle, awaitable as { data, error }, plus a
 * storage stub (upload/createSignedUrl/download) and a minimal .rpc() for the
 * turn-queue claim/complete functions.
 *
 * Two capabilities make dedupe/concurrency provable (they are no-ops unless opted
 * into, so existing tests are unaffected):
 *  - `uniques`: declare unique-key column sets per table; a colliding insert returns
 *    a Postgres 23505 error instead of pushing, so `insertDedup` conflict branches
 *    and "never double-deliver" guarantees are actually exercised.
 *  - `.rpc()`: in-JS equivalents of `claim_employee_turn_job[_for_employee]` and
 *    `complete_employee_turn_job` over the in-memory tables, faithful to the SQL
 *    contract in migration 0011, so turn-queue's RPC branch runs under unit tests.
 *    (The plpgsql itself is proven by the env-gated integration test.)
 *  - `increment_*_access_count`: atomic signed-link counter RPCs used by Manager
 *    routes; the fake mutates a single row exactly once per call.
 */
import type { SupabaseClient } from "@amtech/db";

type Row = Record<string, any>;
type Filter = { kind: "eq" | "in" | "is" | "gte" | "lte" | "gt" | "lt"; col: string; val: any };

/** Per-table unique constraints: each entry is a column set that must be unique. */
export type UniqueSpec = Record<string, string[][]>;

const UNIQUE_VIOLATION = { code: "23505", message: "duplicate key value violates unique constraint" };

class QueryBuilder {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Filter[] = [];
  private conflictKeys: string[] = [];
  private single = false;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private countMode: string | null = null;
  private headOnly = false;

  constructor(private store: Row[], private uniques: string[][] = []) {}

  // A bare `.select()` is a read; chained AFTER insert/update/upsert it is the
  // PostgREST "returning" clause and must NOT downgrade the pending mutation to a
  // read (real Supabase returns the affected rows there). Default op is already
  // "select", so this only needs to preserve a pending mutation op. The optional
  // second arg mirrors PostgREST `{ count, head }` for exact-count queries.
  select(_cols?: string, opts?: { count?: string; head?: boolean }): this {
    if (opts?.count) this.countMode = opts.count;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(rows: Row | Row[]): this { this.op = "insert"; this.payload = rows; return this; }
  update(patch: Row): this { this.op = "update"; this.payload = patch; return this; }
  delete(): this { this.op = "delete"; return this; }
  upsert(row: Row, opts?: { onConflict?: string }): this {
    this.op = "upsert"; this.payload = row;
    this.conflictKeys = opts?.onConflict ? opts.onConflict.split(",").map((s) => s.trim()) : [];
    return this;
  }
  eq(col: string, val: any): this { this.filters.push({ kind: "eq", col, val }); return this; }
  in(col: string, val: any[]): this { this.filters.push({ kind: "in", col, val }); return this; }
  is(col: string, val: any): this { this.filters.push({ kind: "is", col, val }); return this; }
  gte(col: string, val: any): this { this.filters.push({ kind: "gte", col, val }); return this; }
  lte(col: string, val: any): this { this.filters.push({ kind: "lte", col, val }); return this; }
  gt(col: string, val: any): this { this.filters.push({ kind: "gt", col, val }); return this; }
  lt(col: string, val: any): this { this.filters.push({ kind: "lt", col, val }); return this; }
  order(col: string, opts?: { ascending?: boolean }): this { this.orderCol = col; this.orderAsc = opts?.ascending ?? true; return this; }
  limit(n: number): this { this.limitN = n; return this; }

  maybeSingle(): Promise<{ data: Row | null; error: any }> {
    this.single = true;
    return Promise.resolve(this.execute()) as Promise<{ data: Row | null; error: any }>;
  }

  then<T>(onfulfilled?: ((v: { data: any; error: any }) => T) | null, onrejected?: ((reason: any) => any) | null): Promise<T> {
    return Promise.resolve(this.execute()).then(onfulfilled as any, onrejected as any);
  }

  private match(row: Row): boolean {
    return this.filters.every((f) => {
      if (f.kind === "eq") return row[f.col] === f.val;
      if (f.kind === "in") return (f.val as any[]).includes(row[f.col]);
      if (f.kind === "is") return row[f.col] === f.val || (f.val === null && (row[f.col] === null || row[f.col] === undefined));
      if (f.kind === "gte") return row[f.col] >= f.val;
      if (f.kind === "lte") return row[f.col] <= f.val;
      if (f.kind === "gt") return row[f.col] > f.val;
      if (f.kind === "lt") return row[f.col] < f.val;
      return true;
    });
  }

  /** A declared unique-key set collides when every column in the set matches an
   *  existing row (NULLs are treated as distinct in Postgres; we mirror that by
   *  skipping a key set that has any null/undefined member on the incoming row). */
  private collides(row: Row): boolean {
    return this.uniques.some((keys) => {
      if (keys.some((k) => row[k] === null || row[k] === undefined)) return false;
      return this.store.some((existing) => keys.every((k) => existing[k] === row[k]));
    });
  }

  private execute(): { data: any; error: any } {
    if (this.op === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      // Atomic per-statement: if any row violates a unique key, insert none.
      for (const r of rows) if (this.collides(r as Row)) return { data: null, error: { ...UNIQUE_VIOLATION } };
      for (const r of rows) this.store.push({ ...r });
      return { data: rows.map((r) => ({ ...r })), error: null };
    }
    if (this.op === "update") {
      const updated: Row[] = [];
      for (const row of this.store) {
        if (this.match(row)) { Object.assign(row, this.payload as Row); updated.push({ ...row }); }
      }
      return { data: updated, error: null };
    }
    if (this.op === "delete") {
      const removed: Row[] = [];
      const kept: Row[] = [];
      for (const row of this.store) (this.match(row) ? removed : kept).push(row);
      this.store.length = 0;
      this.store.push(...kept);
      return { data: removed, error: null };
    }
    if (this.op === "upsert") {
      const row = this.payload as Row;
      const existing = this.conflictKeys.length
        ? this.store.find((r) => this.conflictKeys.every((k) => r[k] === row[k]))
        : undefined;
      if (existing) Object.assign(existing, row);
      else this.store.push({ ...row });
      return { data: [{ ...row }], error: null };
    }
    // select
    let rows = this.store.filter((r) => this.match(r)).map((r) => ({ ...r }));
    const total = rows.length; // exact count reflects filters, ignores limit
    if (this.orderCol) {
      const col = this.orderCol;
      rows.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (this.orderAsc ? 1 : -1));
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    if (this.single) return { data: rows[0] ?? null, error: null };
    if (this.countMode) return { data: this.headOnly ? null : rows, count: total, error: null };
    return { data: rows, error: null };
  }
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {};
  /** Preload entries here to back storage downloads in tests. */
  files: Map<string, Buffer> = new Map();
  signedUrlBase = "https://storage.test/signed";
  private uniques: UniqueSpec;

  constructor(seed?: Record<string, Row[]>, options?: { uniques?: UniqueSpec }) {
    this.uniques = options?.uniques ?? {};
    if (seed) for (const [t, rows] of Object.entries(seed)) this.tables[t] = rows.map((r) => ({ ...r }));
  }

  from(table: string): QueryBuilder {
    if (!this.tables[table]) this.tables[table] = [];
    return new QueryBuilder(this.tables[table]!, this.uniques[table] ?? []);
  }

  private table(name: string): Row[] {
    if (!this.tables[name]) this.tables[name] = [];
    return this.tables[name]!;
  }

  /** Minimal PostgREST RPC shim for the turn-queue claim/complete functions. */
  async rpc(name: string, params: Record<string, any> = {}): Promise<{ data: any; error: any }> {
    if (name === "claim_employee_turn_job" || name === "claim_employee_turn_job_for_employee") {
      return { data: this.claimTurn(name === "claim_employee_turn_job_for_employee" ? params.p_employee_id : null, params.p_worker_id, params.p_lease_seconds ?? 180), error: null };
    }
    if (name === "complete_employee_turn_job") {
      return { data: this.completeTurn(params.p_job_id, params.p_lease_token, params.p_status, params.p_output ?? {}, params.p_error ?? null), error: null };
    }
    if (name === "increment_artifact_link_access_count") {
      return { data: this.incrementAccessCount("artifact_links", params.p_link_id), error: null };
    }
    if (name === "increment_preview_link_access_count") {
      return { data: this.incrementAccessCount("preview_links", params.p_link_id), error: null };
    }
    throw new Error(`fake rpc: unknown function ${name}`);
  }

  private incrementAccessCount(table: string, id: string): number | null {
    const row = this.table(table).find((r) => r.id === id);
    if (!row) return null;
    row.access_count = Number(row.access_count ?? 0) + 1;
    return row.access_count;
  }

  private nowMs(): number { return Date.now(); }

  private claimTurn(employeeId: string | null, workerId: string, leaseSeconds: number): Row[] {
    const jobs = this.table("employee_turn_jobs");
    const locks = this.table("employee_turn_locks");
    // Expire stale locks (mirrors `delete from employee_turn_locks where lease_expires_at <= now()`).
    for (let i = locks.length - 1; i >= 0; i -= 1) {
      if (Date.parse(locks[i]!.lease_expires_at) <= this.nowMs()) locks.splice(i, 1);
    }
    const hasActiveLock = (empId: string) =>
      locks.some((l) => l.employee_id === empId && Date.parse(l.lease_expires_at) > this.nowMs());
    const candidate = jobs
      .filter((j) => j.status === "queued" && (employeeId ? j.employee_id === employeeId : true) && !hasActiveLock(j.employee_id))
      .sort((a, b) => (a.created_at > b.created_at ? 1 : a.created_at < b.created_at ? -1 : 0))[0];
    if (!candidate) return [];
    const token = `${workerId}:${Math.random().toString(36).slice(2)}`;
    const expires = new Date(this.nowMs() + leaseSeconds * 1000).toISOString();
    locks.push({ employee_id: candidate.employee_id, job_id: candidate.id, lease_token: token, lease_expires_at: expires, updated_at: new Date().toISOString() });
    candidate.status = "running";
    candidate.attempts = Number(candidate.attempts ?? 0) + 1;
    candidate.lease_token = token;
    candidate.lease_expires_at = expires;
    return [{
      id: candidate.id, account_id: candidate.account_id ?? null, employee_id: candidate.employee_id,
      kind: candidate.kind, idempotency_key: candidate.idempotency_key, input: candidate.input ?? {},
      attempts: candidate.attempts, lease_token: token, run_id: candidate.run_id ?? null,
    }];
  }

  private completeTurn(jobId: string, leaseToken: string, status: string, output: Row, error: string | null): boolean {
    const jobs = this.table("employee_turn_jobs");
    const locks = this.table("employee_turn_locks");
    const job = jobs.find((j) => j.id === jobId && j.lease_token === leaseToken && j.status === "running");
    if (!job) return false;
    job.status = status;
    job.output = output ?? {};
    job.error = error;
    job.lease_token = null;
    job.lease_expires_at = null;
    for (let i = locks.length - 1; i >= 0; i -= 1) {
      if (locks[i]!.employee_id === job.employee_id && locks[i]!.lease_token === leaseToken) locks.splice(i, 1);
    }
    return true;
  }

  // Supabase Storage shim (db.storage.from(bucket).upload/createSignedUrl/download).
  get storage() {
    const files = this.files;
    const base = this.signedUrlBase;
    return {
      from(_bucket: string) {
        return {
          async upload(path: string, data: Buffer) { files.set(path, Buffer.from(data)); return { data: { path }, error: null }; },
          async createSignedUrl(path: string, _ttl: number) { return { data: { signedUrl: `${base}/${path}` }, error: null }; },
          async download(path: string) {
            const buf = files.get(path);
            if (!buf) return { data: null, error: { message: "not_found" } };
            const blob = { arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
            return { data: blob, error: null };
          },
        };
      },
    };
  }

  asClient(): SupabaseClient {
    return this as unknown as SupabaseClient;
  }
}

export function makeFakeDb(seed?: Record<string, Row[]>, options?: { uniques?: UniqueSpec }): FakeSupabase {
  return new FakeSupabase(seed, options);
}

/** The unique constraints the real schema enforces (migrations 0010–0012). Pass to
 *  makeFakeDb when a test needs dedupe/idempotency to actually bite. */
export const SCHEMA_UNIQUES: UniqueSpec = {
  inbound_events: [["idempotency_key"]],
  employee_turn_jobs: [["idempotency_key"]],
  delivery_decisions: [["employee_id", "intent_key"]],
  channel_sessions: [["employee_id", "channel"]],
  runtime_endpoint_secrets: [["runtime_endpoint_id"]],
  employee_mcp_credentials: [["token_hash"]],
  stripe_webhook_events: [["stripe_event_id"]],
  preview_links: [["token_hash"]],
  agent_context_primer_sessions: [["employee_id", "transcript_session_id"]],
  employee_sessions: [["employee_id", "transcript_session_id"]],
};
