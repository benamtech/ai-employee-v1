import { describe, expect, it } from "vitest";
import {
  EMAIL_SEND_ACTION_KEYS,
  INVOICE_SEND_ACTION_KEYS,
  OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS,
  REMINDER_ACTION_KEY,
  SEND_GATE_ACTION_KEY_GROUPS,
  requiresOwnerAuthenticatedResolution,
} from "../../packages/shared/src/approval-policy";

describe("approval action_key policy invariant", () => {
  it("every send-gate action_key is owner-auth-required", () => {
    for (const group of SEND_GATE_ACTION_KEY_GROUPS) {
      for (const key of group) {
        expect(OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS.has(key)).toBe(true);
      }
    }
  });

  it("pins the known send-gate literals (regression guard)", () => {
    expect(EMAIL_SEND_ACTION_KEYS).toEqual(["send_estimate_email", "send_email"]);
    expect(INVOICE_SEND_ACTION_KEYS).toEqual(["send_deposit_invoice", "send_invoice"]);
  });

  it("requiresOwnerAuthenticatedResolution is true for every send-gate key at any risk_level", () => {
    for (const group of SEND_GATE_ACTION_KEY_GROUPS) {
      for (const key of group) {
        expect(requiresOwnerAuthenticatedResolution({ action_key: key, risk_level: "medium" })).toBe(true);
        expect(requiresOwnerAuthenticatedResolution({ action_key: key, risk_level: "low" })).toBe(true);
      }
    }
  });

  it("high risk_level always requires owner-authenticated resolution regardless of action_key", () => {
    expect(requiresOwnerAuthenticatedResolution({ action_key: "some_novel_action", risk_level: "high" })).toBe(true);
  });

  it("an unrelated low/medium-risk action_key is not owner-auth-required", () => {
    expect(requiresOwnerAuthenticatedResolution({ action_key: REMINDER_ACTION_KEY, risk_level: "medium" })).toBe(false);
    expect(requiresOwnerAuthenticatedResolution({ action_key: "some_novel_action", risk_level: "medium" })).toBe(false);
  });
});
