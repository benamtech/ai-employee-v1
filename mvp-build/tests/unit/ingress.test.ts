import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_TYPES } from "@amtech/shared";
import { ingestEvent } from "../../apps/manager/src/events/ingress";
import { invalidateRuntimeCapabilities } from "../../apps/manager/src/lib/hermes-client";
import { sealSecret } from "../../apps/manager/src/lib/secrets";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import { routerFetch } from "./_helpers/fetch-mock";
import "../../apps/manager/src/events/adapters/index";

beforeEach(() => { process.env.SECRET_REF_MASTER_KEY = "unit-test-secret-ref-master-key"; });
afterEach(() => {
  invalidateRuntimeCapabilities({ runtime_endpoint_id: "rt_1" });
  vi.restoreAllMocks();
});

describe("ingress ingestEvent — safety and routing", () => {
  it("routes an unknown source to repair with an audit row", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const res = await ingestEvent(db.asClient(), { source: "mystery", payload: {} });
    expect(res.message_id).toBe("");
    expect(db.tables.event_repair_queue?.[0]?.reason).toBe("unknown_source");
    expect(db.tables.audit_log?.some((r) => r.action === "event:ingest" && r.result === "failed")).toBe(true);
  });

  it("routes an adapter verify failure to repair", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const res = await ingestEvent(db.asClient(), { source: "gmail", payload: { account_id: "acct_1" } });
    expect(res.delivery_status).toBe("pending");
    expect(db.tables.event_repair_queue?.[0]?.reason).toBe("gmail_reply_fields_required");
  });

  it("routes a null-normalizing payload to repair", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    // manager adapter requires fields at verify; a payload that verifies but normalizes to a
    // non-event still lands in repair. Use a manager payload missing the safe_summary after verify.
    const res = await ingestEvent(db.asClient(), { source: "manager", payload: null });
    expect(db.tables.event_repair_queue?.length).toBeGreaterThan(0);
    expect(res.message_id).toBe("");
  });

  it("routes an unsafe fact to repair (no raw tokens through the spine)", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    await ingestEvent(db.asClient(), {
      source: "manager",
      payload: {
        account_id: "acct_1", employee_id: "emp_1", event_type: "manager.custom",
        idempotency_key: "manager.custom:1", safe_summary: "ok",
        normalized_payload: { access_token: "secret-value" },
      },
    });
    expect(db.tables.event_repair_queue?.[0]?.reason).toContain("unsafe_fact");
  });

  it("does not treat a forbidden word in a customer's message VALUE as unsafe", async () => {
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });
    await ingestEvent(db.asClient(), {
      source: "manager",
      payload: {
        account_id: "acct_1", employee_id: "emp_1", event_type: "manager.custom",
        idempotency_key: "manager.custom:2", safe_summary: "A customer wrote in.",
        // "authorization" appears in a VALUE (legitimate customer prose), not a key.
        normalized_payload: { note: "We still need your authorization to start the job." },
      },
    });
    expect(db.tables.event_repair_queue ?? []).toHaveLength(0);
    expect(db.tables.inbound_events).toHaveLength(1);
  });

  it("wakes the employee for a gmail reply (wake_employee route)", async () => {
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }],
      runtime_endpoints: [{ id: "rt_1", employee_id: "emp_1", api_base_url: "https://runtime.test", api_session_id: "sess_1" }],
      runtime_endpoint_secrets: [{ runtime_endpoint_id: "rt_1", api_key_ref: sealSecret("k") }],
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
      employee_messages: [],
    }, { uniques: SCHEMA_UNIQUES });
    vi.stubGlobal("fetch", routerFetch([
      { match: "/v1/capabilities", body: { features: { session_chat: true } } },
      { match: "/chat", body: { text: "```json\n{\"move\":\"notify\",\"title\":\"Replied\",\"summary\":\"Jane replied.\"}\n```" } },
      { match: "/api/sessions", body: { id: "sess_1" } },
    ]));
    await ingestEvent(db.asClient(), {
      source: "gmail",
      payload: { account_id: "acct_1", employee_id: "emp_1", message_id: "gmsg_1", thread_id: "thr_1", from: "jane@x.com", snippet: "Looks good" },
    });
    expect(db.tables.inbound_events?.[0]?.routing_mode).toBe("wake_employee");
    expect(db.tables.inbound_events?.[0]?.normalized_payload?.work_event_descriptor?.title).toBe("Replied");
  });

  it("delivers a stripe paid event without waking (deliver_only route)", async () => {
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });
    const res = await ingestEvent(db.asClient(), {
      source: "stripe",
      payload: { account_id: "acct_1", employee_id: "emp_1", stripe_event_id: "evt_stripe_1", event_type: EVENT_TYPES.stripeInvoicePaid, deposit_amount: 25000 },
    });
    expect(db.tables.inbound_events?.[0]?.routing_mode).toBe("deliver_only");
    expect(res.duplicate).toBe(false);
  });

  it("dedupes an at-least-once redelivery of the same provider event", async () => {
    const db = makeFakeDb({
      channel_sessions: [{ id: "chs_1", employee_id: "emp_1", channel: "web", last_seen_at: new Date().toISOString() }],
    }, { uniques: SCHEMA_UNIQUES });
    const payload = { account_id: "acct_1", employee_id: "emp_1", stripe_event_id: "evt_stripe_1", event_type: EVENT_TYPES.stripeInvoicePaid };
    await ingestEvent(db.asClient(), { source: "stripe", payload });
    const second = await ingestEvent(db.asClient(), { source: "stripe", payload });
    expect(second.duplicate).toBe(true);
    expect(db.tables.inbound_events).toHaveLength(1);
  });
});
