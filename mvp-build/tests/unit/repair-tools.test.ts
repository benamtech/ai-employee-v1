import { afterEach, describe, expect, it, vi } from "vitest";
import { repairTools } from "../../apps/manager/src/tools/repair.stub";
import type { ToolContext } from "../../apps/manager/src/tools/types";
import { makeFakeDb, type FakeSupabase } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";

function ctx(db: FakeSupabase): ToolContext {
  return { db: db.asClient(), account_id: null, employee_id: null, actor: "manager" };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.STRIPE_SECRET_KEY;
});

describe("Phase 6 repair tools", () => {
  it("suppresses a noisy source", async () => {
    const db = makeFakeDb();
    const res = await repairTools.suppress_event_source!(ctx(db), { account_id: "acct_1", source: "gmail", event_type: "gmail.reply_received", reason: "storm" });
    expect(res.status).toBe("ok");
    expect(db.tables.event_source_suppressions?.[0]?.source).toBe("gmail");
  });

  it("marks an inbound event duplicate", async () => {
    const db = makeFakeDb({ inbound_events: [{ id: "evt_1", status: "received" }] });
    const res = await repairTools.mark_event_duplicate!(ctx(db), { event_id: "evt_1", duplicate_of_event_id: "evt_0" });
    expect(res.status).toBe("ok");
    expect(db.tables.inbound_events?.[0]?.status).toBe("duplicate");
  });

  it("redelivers an existing employee event idempotently", async () => {
    const db = makeFakeDb({
      inbound_events: [{
        id: "evt_1", account_id: "acct_1", employee_id: "emp_1", event_type: "manager.test", provider_id: "prov_1",
        normalized_payload: { work_event_descriptor: { account_id: "acct_1", employee_id: "emp_1", move: "notify", title: "Test", summary: "Hello." } },
      }],
    });
    const first = await repairTools.redeliver_employee_event!(ctx(db), { event_id: "evt_1" });
    const second = await repairTools.redeliver_employee_event!(ctx(db), { event_id: "evt_1" });
    expect(first.status).toBe("ok");
    expect(second.proof.duplicate).toBe(true);
  });

  it("replays a Stripe event fetched by provider id", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_unit";
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/events/evt_1", body: { id: "evt_1", type: "invoice.sent", livemode: false, data: { object: { id: "in_1" } } } },
    ]));
    const db = makeFakeDb();
    const res = await repairTools.replay_stripe_event!(ctx(db), { stripe_event_id: "evt_1" });
    expect(res.status).toBe("ok");
    expect(db.tables.stripe_webhook_events?.[0]?.stripe_event_id).toBe("evt_1");
  });
});
