import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@amtech/db";
import {
  claimAmbientEffect,
  completeAmbientEffect,
  enqueueAmbientEvent,
  failAmbientEffect,
  replayAmbientDeadLetter,
} from "../../apps/manager/src/lib/ambient-inbox.js";

type Row = Record<string, any>;
interface QueryResult<T = unknown> { data: T; error: null | { code?: string; message: string } }
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

  async maybeSingle(): Promise<QueryResult<Row | null>> {
    const result = await this.execute();
    const rows = Array.isArray(result.data) ? result.data : [result.data];
    return { data: rows[0] ?? null, error: result.error };
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
      const values = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]).map((row) => ({ ...row }));
      for (const value of values) {
        if (this.table === "ambient_event_inbox") {
          const duplicate = rows.some((row) => row.dedupe_key === value.dedupe_key || (
            row.source_type === value.source_type && row.provider === value.provider && row.external_event_id === value.external_event_id
          ));
          if (duplicate) return { data: null, error: { code: "23505", message: "duplicate ambient event" } };
        }
        if (this.table === "ambient_effect_receipts" && rows.some((row) => row.effect_key === value.effect_key)) {
          return { data: null, error: { code: "23505", message: "duplicate effect" } };
        }
        rows.push({ created_at: new Date().toISOString(), ...value });
      }
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

describe("ambient event durability", () => {
  it("deduplicates on provider identity even when callers change their custom dedupe key", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    const first = await enqueueAmbientEvent(db, {
      source_type: "provider_webhook",
      provider: "stripe",
      external_event_id: "evt_same",
      event_type: "invoice.updated",
      dedupe_key: "stripe:first-shape",
    });
    const duplicate = await enqueueAmbientEvent(db, {
      source_type: "provider_webhook",
      provider: "stripe",
      external_event_id: "evt_same",
      event_type: "invoice.updated",
      dedupe_key: "stripe:later-shape",
    });
    expect(duplicate).toEqual({ inbox_id: first.inbox_id, duplicate: true });
    expect(fake.rows("ambient_event_inbox")).toHaveLength(1);
  });

  it("reclaims known failed effects, but replays completed effects without applying them twice", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    fake.rows("ambient_event_inbox").push({ inbox_id: "ain_one" });

    const first = await claimAmbientEffect(db, { inbox_id: "ain_one", effect_key: "twilio:send:one", provider: "twilio" });
    expect(first.claimed).toBe(true);
    await failAmbientEffect(db, first.receipt.id, new Error("provider timeout"));

    const retry = await claimAmbientEffect(db, { inbox_id: "ain_one", effect_key: "twilio:send:one", provider: "twilio" });
    expect(retry.claimed).toBe(true);
    expect(retry.receipt.state).toBe("claimed");
    await completeAmbientEffect(db, retry.receipt.id, { provider_id: "SM123", evidence: { accepted: true } });

    const replay = await claimAmbientEffect(db, { inbox_id: "ain_one", effect_key: "twilio:send:one", provider: "twilio" });
    expect(replay.claimed).toBe(false);
    expect(replay.receipt).toMatchObject({ state: "applied", provider_id: "SM123" });
    expect(fake.rows("ambient_effect_receipts")).toHaveLength(1);
  });

  it("resets a real dead letter for leased replay while retaining replay history", async () => {
    const fake = new FakeSupabase();
    const db = fake as unknown as SupabaseClient;
    fake.rows("ambient_event_inbox").push({
      inbox_id: "ain_dead",
      processing_state: "dead_letter",
      attempt_count: 12,
      replay_count: 0,
      dead_letter_reason: "provider unavailable",
      last_error: { message: "provider unavailable" },
      processed_at: null,
    });
    fake.rows("ambient_event_dead_letters").push({ id: "adl_dead", inbox_id: "ain_dead", replay_count: 0 });

    await replayAmbientDeadLetter(db, "ain_dead");
    expect(fake.rows("ambient_event_inbox")[0]).toMatchObject({
      processing_state: "received",
      attempt_count: 0,
      replay_count: 1,
      dead_letter_reason: null,
      last_error: null,
    });
    expect(fake.rows("ambient_event_dead_letters")[0]).toMatchObject({ replay_count: 1 });
  });
});
