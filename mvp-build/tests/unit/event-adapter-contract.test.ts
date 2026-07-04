/**
 * The source-adapter contract is AMTECH's external-tool extension point: to hook up
 * a new external source you register an `EventSourceAdapter` and call `ingestEvent`.
 * This test iterates the live registry so EVERY adapter — including any added in the
 * future — is held to the contract automatically the moment it registers.
 */
import { describe, expect, it } from "vitest";
import { getEventSource, listEventSources, type NormalizedEvent } from "../../apps/manager/src/events/registry";
import "../../apps/manager/src/events/adapters/index";
import { makeFakeDb } from "./_helpers/fake-supabase";

const sampleEvent: NormalizedEvent = {
  account_id: "acct_1", employee_id: "emp_1", event_type: "sample.event",
  provider_id: "prov_1", idempotency_key: "sample.event:prov_1",
  normalized_payload: {}, safe_summary: "sample",
};

describe("event-source adapter contract (all registered adapters)", () => {
  const sources = listEventSources();

  it("registers at least the known external sources", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  for (const source of sources) {
    describe(`adapter: ${source}`, () => {
      const adapter = getEventSource(source)!;

      it("exposes the contract surface", () => {
        expect(typeof adapter.source).toBe("string");
        expect(adapter.source.length).toBeGreaterThan(0);
        expect(typeof adapter.verify).toBe("function");
        expect(typeof adapter.normalize).toBe("function");
        expect(typeof adapter.dedupeKey).toBe("function");
      });

      it("verify returns a well-formed result and gives a reason on rejection", async () => {
        const result = await adapter.verify({} as never);
        expect(typeof result.ok).toBe("boolean");
        if (result.ok === false) expect(typeof result.reason).toBe("string");
      });

      it("dedupeKey is a deterministic non-empty string", () => {
        const a = adapter.dedupeKey(sampleEvent);
        const b = adapter.dedupeKey({ ...sampleEvent });
        expect(typeof a).toBe("string");
        expect(a.length).toBeGreaterThan(0);
        expect(a).toBe(b);
      });

      it("normalize returns null or a NormalizedEvent-shaped object", async () => {
        const out = await adapter.normalize(makeFakeDb().asClient(), sampleEvent as never);
        if (out !== null) {
          expect(typeof out.event_type).toBe("string");
          expect(typeof out.idempotency_key).toBe("string");
          expect(typeof out.safe_summary).toBe("string");
        }
      });
    });
  }
});
