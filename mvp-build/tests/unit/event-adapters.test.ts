import { describe, expect, it } from "vitest";
import { EVENT_TYPES } from "@amtech/shared";
import { getEventSource, listEventSources } from "../../apps/manager/src/events/registry";
import "../../apps/manager/src/events/adapters/index";
import { makeFakeDb } from "./_helpers/fake-supabase";

const db = () => makeFakeDb().asClient();

describe("event adapters registry", () => {
  it("registers exactly gmail, manager, quickbooks, stripe", () => {
    expect(listEventSources()).toEqual(["gmail", "manager", "quickbooks", "stripe"]);
  });
});

describe("gmail adapter", () => {
  const a = () => getEventSource("gmail")!;
  const good = { account_id: "acct_1", employee_id: "emp_1", message_id: "gmsg_1", thread_id: "thr_1", from: "jane@x.com", snippet: "Looks good" };

  it("verifies a complete reply payload and rejects a partial one", async () => {
    expect(await a().verify(good)).toEqual({ ok: true });
    expect(await a().verify({ account_id: "acct_1" } as never)).toEqual({ ok: false, reason: "gmail_reply_fields_required" });
  });

  it("normalizes to a gmail.reply_received event with a stable dedupe key", async () => {
    const event = (await a().normalize(db(), good))!;
    expect(event.event_type).toBe(EVENT_TYPES.gmailReplyReceived);
    expect(event.provider_id).toBe("gmsg_1");
    expect(a().dedupeKey(event)).toBe(`${EVENT_TYPES.gmailReplyReceived}:gmsg_1`);
    expect(event.safe_summary).toContain("jane@x.com");
  });
});

describe("stripe adapter", () => {
  const a = () => getEventSource("stripe")!;
  const paid = { account_id: "acct_1", employee_id: "emp_1", stripe_event_id: "evt_1", event_type: EVENT_TYPES.stripeInvoicePaid, deposit_amount: 25000 };

  it("verifies a complete invoice payload and rejects a partial one", async () => {
    expect(await a().verify(paid)).toEqual({ ok: true });
    expect(await a().verify({ account_id: "acct_1" } as never)).toEqual({ ok: false, reason: "stripe_invoice_fields_required" });
  });

  it("marks a sent invoice silent but a paid invoice loud", async () => {
    const sent = (await a().normalize(db(), { ...paid, event_type: EVENT_TYPES.stripeInvoiceSent }))!;
    const paidEvent = (await a().normalize(db(), paid))!;
    expect(sent.triage_hint).toBe("silent");
    expect(paidEvent.triage_hint).toBeUndefined();
    expect(paidEvent.safe_summary).toContain("$250.00");
  });
});

describe("manager adapter", () => {
  const a = () => getEventSource("manager")!;

  it("requires the core owner-context fields at verify", async () => {
    expect(await a().verify({ account_id: "acct_1", employee_id: "emp_1", event_type: "manager.x", idempotency_key: "k", safe_summary: "s" } as never)).toEqual({ ok: true });
    expect(await a().verify({ account_id: "acct_1" } as never)).toEqual({ ok: false, reason: "manager_event_fields_required" });
  });

  it("passes a pre-normalized event through unchanged", async () => {
    const input = { account_id: "acct_1", employee_id: "emp_1", event_type: "manager.x", idempotency_key: "k", normalized_payload: {}, safe_summary: "s" } as never;
    expect(await a().normalize(db(), input)).toBe(input);
  });
});
