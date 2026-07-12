import { describe, expect, it } from "vitest";
import { EVENT_TYPES, EVENT_ROUTING_POLICY, routeForEventType } from "../../packages/shared/src/event-types";

describe("CE-2 turn routing policy", () => {
  it("wakes the employee only for owner-actionable / customer-reply events", () => {
    expect(routeForEventType(EVENT_TYPES.gmailReplyReceived)).toBe("wake_employee");
  });

  it("delivers informational / trivial provider events without a turn", () => {
    expect(routeForEventType(EVENT_TYPES.stripeInvoiceSent)).toBe("deliver_only");
    expect(routeForEventType(EVENT_TYPES.stripeInvoicePaid)).toBe("deliver_only");
    expect(routeForEventType(EVENT_TYPES.managerConnectorConnected)).toBe("deliver_only");
    expect(routeForEventType(EVENT_TYPES.managerConnectorFailed)).toBe("deliver_only");
    expect(routeForEventType(EVENT_TYPES.quickbooksEntityChanged)).toBe("deliver_only");
  });

  it("defaults unknown event types to deliver_only (adding a connector never wakes by accident)", () => {
    expect(routeForEventType("some.new_connector_event")).toBe("deliver_only");
  });

  it("only gmail.reply_received wakes in the current policy table", () => {
    const wakers = Object.entries(EVENT_ROUTING_POLICY).filter(([, mode]) => mode === "wake_employee").map(([k]) => k);
    expect(wakers).toEqual([EVENT_TYPES.gmailReplyReceived]);
  });
});
