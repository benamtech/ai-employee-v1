import { describe, expect, it } from "vitest";
import {
  ownerWebTurnCommandIdentity,
  ownerWebTurnCommandPayload,
} from "../../apps/manager/src/lib/owner-turn-command.js";

describe("S2 owner web turn C3 identity", () => {
  it("is stable for an assignment, authenticated human, and client intent", () => {
    const input = {
      assignment_id: "asn_owner_1",
      principal_id: "hpr_owner_1",
      intent_id: "intent-from-browser-0001",
    };
    const first = ownerWebTurnCommandIdentity(input);
    const second = ownerWebTurnCommandIdentity(input);
    expect(first).toEqual(second);
    expect(first.intent_id).toMatch(/^intent_[0-9a-f]{32}$/);
    expect(first.command_id).toMatch(/^cmd_[0-9a-f]{32}$/);
    expect(first.intent_key).toContain("hpr_owner_1");
    expect(first.effect_key).toContain("asn_owner_1");
  });

  it("separates assignments and principals while hashing message content into the stable payload", () => {
    const baseline = ownerWebTurnCommandIdentity({
      assignment_id: "asn_owner_1",
      principal_id: "hpr_owner_1",
      intent_id: "intent-from-browser-0001",
    });
    const otherAssignment = ownerWebTurnCommandIdentity({
      assignment_id: "asn_owner_2",
      principal_id: "hpr_owner_1",
      intent_id: "intent-from-browser-0001",
    });
    const otherPrincipal = ownerWebTurnCommandIdentity({
      assignment_id: "asn_owner_1",
      principal_id: "hpr_owner_2",
      intent_id: "intent-from-browser-0001",
    });
    expect(otherAssignment.command_id).not.toBe(baseline.command_id);
    expect(otherPrincipal.command_id).not.toBe(baseline.command_id);

    const firstPayload = ownerWebTurnCommandPayload({
      employee_id: "emp_1",
      intent_id: "intent-from-browser-0001",
      body: "Draft the estimate.",
    });
    const changedPayload = ownerWebTurnCommandPayload({
      employee_id: "emp_1",
      intent_id: "intent-from-browser-0001",
      body: "Send the estimate.",
    });
    expect(firstPayload.body_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(changedPayload.body_hash).not.toBe(firstPayload.body_hash);
    expect(firstPayload).not.toHaveProperty("body");
  });
});
