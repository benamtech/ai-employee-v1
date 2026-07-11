/**
 * QuickBooks webhook boundary: HMAC signature verification, CloudEvents +
 * legacy envelope parsing with multi-company fan-out, dedupe of a redelivered
 * event, and normalization into a non-instruction-laden safe fact.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { parseQboEvents, verifyQboWebhookSignature, recordAndDeliverQboEvent } from "../../apps/manager/src/webhooks/quickbooks";
import { getEventSource } from "../../apps/manager/src/events/registry";
import "../../apps/manager/src/events/adapters/index";
import { makeFakeDb, SCHEMA_UNIQUES, type FakeSupabase, type UniqueSpec } from "./_helpers/fake-supabase";

const VERIFIER = "webhook-verifier-token";

const QBO_UNIQUES: UniqueSpec = {
  ...SCHEMA_UNIQUES,
  inbound_qbo_events: [["connector_id", "entity_type", "entity_id", "operation", "cloudevent_id"]],
  inbound_events: [["idempotency_key"]],
};

beforeEach(() => {
  process.env.SECRET_REF_MASTER_KEY = "unit-test-master-key-0123456789ab";
});
afterEach(() => { /* no globals stubbed */ });

describe("verifyQboWebhookSignature", () => {
  it("accepts a correct base64 HMAC-SHA256 over the raw body", () => {
    const raw = JSON.stringify({ eventNotifications: [] });
    const sig = createHmac("sha256", VERIFIER).update(raw, "utf8").digest("base64");
    expect(verifyQboWebhookSignature(raw, sig, VERIFIER)).toBe(true);
  });
  it("rejects a wrong/absent signature", () => {
    const raw = JSON.stringify({ eventNotifications: [] });
    expect(verifyQboWebhookSignature(raw, "wrong", VERIFIER)).toBe(false);
    expect(verifyQboWebhookSignature(raw, undefined, VERIFIER)).toBe(false);
  });
});

describe("parseQboEvents", () => {
  it("parses the legacy eventNotifications shape", () => {
    const events = parseQboEvents({
      eventNotifications: [
        { realmId: "R1", dataChangeEvent: { entities: [{ name: "Invoice", id: "42", operation: "Update" }] } },
      ],
    });
    expect(events).toEqual([{ realm_id: "R1", entity_type: "Invoice", entity_id: "42", operation: "Update", cloudevent_id: null }]);
  });

  it("fans out a single CloudEvents notification carrying MULTIPLE companies", () => {
    const events = parseQboEvents({
      events: [
        { id: "ce_1", data: { realmId: "R1", entities: [{ name: "Bill", id: "1", operation: "Create" }] } },
        { id: "ce_2", data: { realmId: "R2", entities: [{ name: "Payment", id: "9", operation: "Update" }] } },
      ],
    });
    expect(events.map((e) => e.realm_id).sort()).toEqual(["R1", "R2"]);
    expect(events.find((e) => e.realm_id === "R1")?.cloudevent_id).toBe("ce_1");
  });

  it("returns nothing for an unparseable body", () => {
    expect(parseQboEvents(null)).toEqual([]);
    expect(parseQboEvents({})).toEqual([]);
  });
});

function seed(): FakeSupabase {
  return makeFakeDb({
    employees: [{ id: "emp_1", account_id: "acct_1" }],
    connector_accounts: [{ id: "conn_qbo", account_id: "acct_1", employee_id: "emp_1", connector_key: "accounting", provider: "quickbooks", status: "connected", realm_id: "R1" }],
  }, { uniques: QBO_UNIQUES });
}

describe("recordAndDeliverQboEvent", () => {
  const event = { realm_id: "R1", entity_type: "Invoice", entity_id: "42", operation: "Update", cloudevent_id: "ce_1" };

  it("matches a connector by realm_id and delivers the event", async () => {
    const db = seed();
    const res = await recordAndDeliverQboEvent(db.asClient(), event);
    expect(res.matched).toBe(true);
    expect(res.delivered).toBe(true);
    expect(db.tables.inbound_qbo_events).toHaveLength(1);
    // Delivered into the shared mesh (an inbound_events row exists).
    expect((db.tables.inbound_events ?? []).length).toBeGreaterThan(0);
  });

  it("dedupes a redelivered event (idempotent)", async () => {
    const db = seed();
    await recordAndDeliverQboEvent(db.asClient(), event);
    const second = await recordAndDeliverQboEvent(db.asClient(), event);
    expect(second.duplicate).toBe(true);
    expect(second.delivered).toBe(false);
    expect(db.tables.inbound_qbo_events).toHaveLength(1);
  });

  it("does not match an unknown realm (no connector)", async () => {
    const db = seed();
    const res = await recordAndDeliverQboEvent(db.asClient(), { ...event, realm_id: "UNKNOWN" });
    expect(res.matched).toBe(false);
    expect(res.delivered).toBe(false);
  });

  it("delivers to EVERY connector on the same realm (two accounts sharing one QuickBooks company)", async () => {
    // realm_id is not unique across connector_accounts — a contractor and their
    // bookkeeper can both connect the same company. A .maybeSingle() would drop
    // the event for both; the fix fans out to all matching connectors.
    const db = makeFakeDb({
      employees: [{ id: "emp_1", account_id: "acct_1" }, { id: "emp_2", account_id: "acct_2" }],
      connector_accounts: [
        { id: "conn_a", account_id: "acct_1", employee_id: "emp_1", connector_key: "accounting", provider: "quickbooks", status: "connected", realm_id: "R1" },
        { id: "conn_b", account_id: "acct_2", employee_id: "emp_2", connector_key: "accounting", provider: "quickbooks", status: "connected", realm_id: "R1" },
      ],
    }, { uniques: QBO_UNIQUES });
    const res = await recordAndDeliverQboEvent(db.asClient(), event);
    expect(res.matched).toBe(true);
    expect(res.delivered).toBe(true);
    // One inbound_qbo_events row per connector.
    expect(db.tables.inbound_qbo_events).toHaveLength(2);
    expect(new Set((db.tables.inbound_qbo_events ?? []).map((r) => r.connector_id))).toEqual(new Set(["conn_a", "conn_b"]));
  });

  it("normalizes to a safe fact that is data, not an instruction", async () => {
    const adapter = getEventSource("quickbooks")!;
    const normalized = await adapter.normalize(makeFakeDb().asClient(), {
      account_id: "acct_1", employee_id: "emp_1", connector_id: "conn_qbo",
      realm_id: "R1", entity_type: "Invoice", entity_id: "42", operation: "Update",
    } as never);
    expect(normalized).not.toBeNull();
    expect(normalized!.safe_summary).toBe("A QuickBooks Invoice was updated.");
    // The summary carries no record text fields (Memo/PrivateNote/DocNumber) —
    // the notification is metadata-only, so nothing untrusted can act as an
    // instruction.
    expect(JSON.stringify(normalized!.normalized_payload)).not.toMatch(/memo|privatenote/i);
  });
});
