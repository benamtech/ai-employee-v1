import { beforeEach, describe, expect, it } from "vitest";
import { flushDueBatches, buildDigestDescriptor } from "../../apps/manager/src/lib/event-batching";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";

beforeEach(() => {
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.EMPLOYEE_SMS_FROM;
  process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key";
});

const openBatch = (over: Record<string, unknown> = {}) => ({
  id: "batch_1", account_id: "acct_1", employee_id: "emp_1", batch_key: "gmail:gmail.reply_received",
  status: "open", event_count: 3, first_seen_at: "2026-07-04T00:00:00.000Z",
  last_seen_at: "2026-07-04T00:01:00.000Z", flush_after: "2026-07-04T00:05:00.000Z", ...over,
});

describe("buildDigestDescriptor", () => {
  it("summarizes a burst as a gate-free notify", () => {
    const d = buildDigestDescriptor(openBatch({ event_count: 6 }) as never);
    expect(d.move).toBe("notify");
    expect(d.title).toContain("6");
    expect(d.deliverable).toBeUndefined();
  });
});

describe("flushDueBatches", () => {
  it("flushes a batch past the count threshold into one digest and marks it flushed", async () => {
    const db = makeFakeDb({ event_batches: [openBatch({ event_count: 12 })] }, { uniques: SCHEMA_UNIQUES });
    const res = await flushDueBatches(db.asClient(), { now: "2026-07-04T00:02:00.000Z" });
    expect(res.delivered).toBe(1);
    const digest = db.tables.inbound_events?.find((e) => e.event_type === "manager.digest");
    expect(digest).toBeTruthy();
    const batch = db.tables.event_batches?.[0];
    expect(batch?.status).toBe("flushed");
    expect(batch?.digest_event_id).toBe(digest?.id);
  });

  it("flushes on the time window even below the count threshold", async () => {
    const db = makeFakeDb({ event_batches: [openBatch({ event_count: 2 })] }, { uniques: SCHEMA_UNIQUES });
    const res = await flushDueBatches(db.asClient(), { now: "2026-07-04T00:06:00.000Z" });
    expect(res.flushed).toBe(1);
    expect(res.delivered).toBe(1);
  });

  it("leaves an un-due batch open", async () => {
    const db = makeFakeDb({ event_batches: [openBatch({ event_count: 2 })] }, { uniques: SCHEMA_UNIQUES });
    const res = await flushDueBatches(db.asClient(), { now: "2026-07-04T00:03:00.000Z" });
    expect(res.delivered).toBe(0);
    expect(db.tables.event_batches?.[0]?.status).toBe("open");
  });

  it("does not re-deliver an already-flushed batch", async () => {
    const db = makeFakeDb({ event_batches: [openBatch({ event_count: 12 })] }, { uniques: SCHEMA_UNIQUES });
    await flushDueBatches(db.asClient(), { now: "2026-07-04T00:06:00.000Z" });
    const again = await flushDueBatches(db.asClient(), { now: "2026-07-04T00:07:00.000Z" });
    expect(again.delivered).toBe(0);
    expect(db.tables.inbound_events?.filter((e) => e.event_type === "manager.digest")).toHaveLength(1);
  });
});
