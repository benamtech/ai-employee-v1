/**
 * Minimal in-memory fake of the Supabase client subset the Manager tools use.
 * Unit tests only (provider mocks are forbidden in MVP acceptance). Supports the
 * fluent chain the tools actually call: from().select/insert/update/upsert
 * .eq/.in/.is/.gte/.order/.limit/.maybeSingle, awaitable as { data, error }, plus a
 * storage stub (upload/createSignedUrl/download).
 */
import type { SupabaseClient } from "@amtech/db";

type Row = Record<string, any>;
type Filter = { kind: "eq" | "in" | "is" | "gte" | "lte"; col: string; val: any };

export interface FakeStorage {
  files: Map<string, Buffer>;
  signedUrlBase: string;
}

class QueryBuilder {
  private op: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Filter[] = [];
  private conflictKeys: string[] = [];
  private single = false;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;

  constructor(private store: Row[]) {}

  // A bare `.select()` is a read; chained AFTER insert/update/upsert it is the
  // PostgREST "returning" clause and must NOT downgrade the pending mutation to a
  // read (real Supabase returns the affected rows there). Default op is already
  // "select", so this only needs to preserve a pending mutation op.
  select(_cols?: string): this { return this; }
  insert(rows: Row | Row[]): this { this.op = "insert"; this.payload = rows; return this; }
  update(patch: Row): this { this.op = "update"; this.payload = patch; return this; }
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
  order(col: string, opts?: { ascending?: boolean }): this { this.orderCol = col; this.orderAsc = opts?.ascending ?? true; return this; }
  limit(n: number): this { this.limitN = n; return this; }

  maybeSingle(): Promise<{ data: Row | null; error: null }> {
    this.single = true;
    return Promise.resolve(this.execute()) as Promise<{ data: Row | null; error: null }>;
  }

  then<T>(onfulfilled?: ((v: { data: any; error: null }) => T) | null, onrejected?: ((reason: any) => any) | null): Promise<T> {
    return Promise.resolve(this.execute()).then(onfulfilled as any, onrejected as any);
  }

  private match(row: Row): boolean {
    return this.filters.every((f) => {
      if (f.kind === "eq") return row[f.col] === f.val;
      if (f.kind === "in") return (f.val as any[]).includes(row[f.col]);
      if (f.kind === "is") return row[f.col] === f.val || (f.val === null && (row[f.col] === null || row[f.col] === undefined));
      if (f.kind === "gte") return row[f.col] >= f.val;
      if (f.kind === "lte") return row[f.col] <= f.val;
      return true;
    });
  }

  private execute(): { data: any; error: null } {
    if (this.op === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
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
    if (this.orderCol) {
      const col = this.orderCol;
      rows.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (this.orderAsc ? 1 : -1));
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    if (this.single) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {};
  /** Preload entries here to back storage downloads in tests. */
  files: Map<string, Buffer> = new Map();
  signedUrlBase = "https://storage.test/signed";

  constructor(seed?: Record<string, Row[]>) {
    if (seed) for (const [t, rows] of Object.entries(seed)) this.tables[t] = rows.map((r) => ({ ...r }));
  }

  from(table: string): QueryBuilder {
    if (!this.tables[table]) this.tables[table] = [];
    return new QueryBuilder(this.tables[table]!);
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

export function makeFakeDb(seed?: Record<string, Row[]>): FakeSupabase {
  return new FakeSupabase(seed);
}
