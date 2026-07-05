import { describe, expect, it } from "vitest";
import { buildConnectorDescriptor } from "../../apps/manager/src/lib/connector-events";
import { renderWorkEventSms, validateWorkEventDescriptor, workDeliverableNeedsGate } from "../../packages/shared/src/work-events";

describe("connector lifecycle work events", () => {
  it("builds a conformant, ungated pending_oauth descriptor carrying the consent URL", () => {
    const d = buildConnectorDescriptor({
      account_id: "acct_1", employee_id: "emp_1",
      provider: "gmail", connector_id: "conn_1", status: "pending_oauth",
      consent_url: "https://accounts.google.com/o/oauth2/v2/auth?x=1",
    });
    expect(validateWorkEventDescriptor(d)).toMatchObject({ ok: true });
    expect(d.move).toBe("question");
    expect(d.deliverable?.type).toBe("external_system_action");
    // Connector-start neither leaves the business nor moves money -> must not be gated.
    expect(workDeliverableNeedsGate(d.deliverable)).toBe(false);
    expect(d.deliverable?.acceptance).toEqual(["acknowledge"]);
    expect(d.deliverable?.refs.consent_url).toBe("https://accounts.google.com/o/oauth2/v2/auth?x=1");
    expect(d.deliverable?.refs.status).toBe("pending_oauth");
  });

  it("carries the consent link into the SMS rendering", () => {
    const d = buildConnectorDescriptor({
      account_id: "acct_1", employee_id: "emp_1",
      provider: "gmail", connector_id: "conn_1", status: "pending_oauth",
      consent_url: "https://consent.example/link",
    });
    const sms = renderWorkEventSms(d);
    expect(sms).toContain("Connect Gmail");
    expect(sms).toContain("https://consent.example/link");
  });

  it("builds a connected (notify) descriptor with no consent URL", () => {
    const d = buildConnectorDescriptor({
      account_id: "acct_1", employee_id: "emp_1",
      provider: "gmail", connector_id: "conn_1", status: "connected",
    });
    expect(validateWorkEventDescriptor(d)).toMatchObject({ ok: true });
    expect(d.move).toBe("notify");
    expect(d.deliverable?.refs.status).toBe("connected");
    expect(d.deliverable?.refs.consent_url).toBeUndefined();
    expect(d.suggested_next_action).toBeUndefined();
  });

  it("labels unknown providers generically and stays conformant", () => {
    const d = buildConnectorDescriptor({
      account_id: "acct_1", employee_id: "emp_1",
      provider: "hubspot", connector_id: "conn_9", status: "pending_oauth",
    });
    expect(validateWorkEventDescriptor(d)).toMatchObject({ ok: true });
    expect(d.title).toBe("Connect Hubspot");
  });
});
