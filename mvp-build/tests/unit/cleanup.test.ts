import { describe, it, expect } from "vitest";
import { cleanupExpiredRows } from "../../apps/manager/src/lib/cleanup";
import { makeFakeDb } from "./_helpers/fake-supabase";

const NOW = "2026-07-10T00:00:00.000Z";
const iso = (daysAgo: number) => new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString();

describe("cleanupExpiredRows", () => {
  it("prunes rows past the retention window and keeps recent ones", async () => {
    const db = makeFakeDb({
      preview_links: [{ id: "prev_old", expires_at: iso(10) }, { id: "prev_new", expires_at: iso(1) }],
      claim_tokens: [{ id: "claim_old", expires_at: iso(30) }, { id: "claim_new", expires_at: iso(2) }],
      delivery_decisions: [{ id: "deld_old", created_at: iso(200) }, { id: "deld_new", created_at: iso(10) }],
      inbound_events: [{ id: "evt_old", created_at: iso(200) }, { id: "evt_new", created_at: iso(10) }],
    });
    const res = await cleanupExpiredRows(db.asClient(), { now: NOW });
    expect(res).toEqual({ preview_links: 1, claim_tokens: 1, delivery_decisions: 1, inbound_events: 1 });
    expect(db.tables.preview_links.map((r) => r.id)).toEqual(["prev_new"]);
    expect(db.tables.claim_tokens.map((r) => r.id)).toEqual(["claim_new"]);
    expect(db.tables.delivery_decisions.map((r) => r.id)).toEqual(["deld_new"]);
    expect(db.tables.inbound_events.map((r) => r.id)).toEqual(["evt_new"]);
  });

  it("never deletes a preview link with no expiry set", async () => {
    const db = makeFakeDb({ preview_links: [{ id: "prev_forever", expires_at: null }] });
    const res = await cleanupExpiredRows(db.asClient(), { now: NOW });
    expect(res.preview_links).toBe(0);
    expect(db.tables.preview_links).toHaveLength(1);
  });
});
