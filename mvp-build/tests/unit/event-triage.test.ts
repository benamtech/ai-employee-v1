import { describe, expect, it } from "vitest";
import { decideTriage, derivePriority } from "../../apps/manager/src/lib/event-triage";
import { makeFakeDb } from "./_helpers/fake-supabase";

const base = {
  account_id: "acct_1",
  employee_id: "emp_1",
  provider_id: "p_1",
  normalized_payload: {},
  safe_summary: "An update arrived.",
};

function recent(source: string, eventType: string, n: number) {
  const now = new Date().toISOString();
  return Array.from({ length: n }, (_, i) => ({
    id: `evt_${i}`, account_id: "acct_1", source, event_type: eventType, created_at: now,
  }));
}

describe("decideTriage", () => {
  it("ignores a suppressed source", async () => {
    const db = makeFakeDb({ event_source_suppressions: [{ id: "s1", source: "gmail", active: true }] });
    const r = await decideTriage(db.asClient(), { ...base, source: "gmail", event_type: "gmail.reply_received" });
    expect(r.decision).toBe("ignore");
  });

  it("repairs when owner context is missing", async () => {
    const db = makeFakeDb();
    const r = await decideTriage(db.asClient(), { ...base, account_id: null, source: "gmail", event_type: "gmail.reply_received" });
    expect(r).toEqual({ decision: "repair", priority: "high" });
  });

  it("routes an explicit silent hint to the batch surface at low priority", async () => {
    const db = makeFakeDb();
    const r = await decideTriage(db.asClient(), { ...base, source: "stripe", event_type: "stripe.invoice_sent", triage_hint: "silent" });
    expect(r).toEqual({ decision: "batch", priority: "low" });
  });

  it("never batches money-critical events, even during a burst", async () => {
    const db = makeFakeDb({ inbound_events: recent("stripe", "stripe.invoice_paid", 5) });
    const r = await decideTriage(db.asClient(), { ...base, source: "stripe", event_type: "stripe.invoice_paid" });
    expect(r).toEqual({ decision: "notify", priority: "high" });
  });

  it("collapses a provider burst of routine events into a batch", async () => {
    const db = makeFakeDb({ inbound_events: recent("gmail", "gmail.reply_received", 4) });
    const r = await decideTriage(db.asClient(), { ...base, source: "gmail", event_type: "gmail.reply_received" });
    expect(r.decision).toBe("batch");
    expect(r.priority).toBe("medium");
  });

  it("notifies for a single routine event below the burst threshold", async () => {
    const db = makeFakeDb({ inbound_events: recent("gmail", "gmail.reply_received", 1) });
    const r = await decideTriage(db.asClient(), { ...base, source: "gmail", event_type: "gmail.reply_received" });
    expect(r.decision).toBe("notify");
  });
});

describe("derivePriority", () => {
  it("treats money/customer signals as high", () => {
    expect(derivePriority({ ...base, source: "stripe", event_type: "stripe.invoice_paid" })).toBe("high");
    expect(derivePriority({ ...base, source: "manager", event_type: "x",
      normalized_payload: { work_event_descriptor: { deliverable: { type: "outbound_message" } } } })).toBe("high");
  });
  it("treats silent as low and replies as medium", () => {
    expect(derivePriority({ ...base, source: "gmail", event_type: "x", triage_hint: "silent" })).toBe("low");
    expect(derivePriority({ ...base, source: "gmail", event_type: "gmail.reply_received" })).toBe("medium");
  });
});
