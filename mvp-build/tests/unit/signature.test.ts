import { describe, it, expect } from "vitest";
import {
  expectedTwilioSignature,
  validateTwilioSignature,
} from "../../apps/manager/src/lib/signature";

// THE security boundary (10-security-ops-observability.md: "Forged Twilio request fails").
describe("Twilio signature validation", () => {
  const token = "test_auth_token_abc123";
  const url = "https://api.amtechai.com/webhooks/twilio/frontdoor";
  const params = { From: "+15705551234", Body: "AI EMPLOYEE", To: "+15705550000" };

  it("accepts a correctly signed request", () => {
    const sig = expectedTwilioSignature(token, url, params);
    expect(validateTwilioSignature(token, url, params, sig)).toBe(true);
  });

  it("rejects a forged request (wrong signature)", () => {
    expect(validateTwilioSignature(token, url, params, "forged-signature")).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(validateTwilioSignature(token, url, params, undefined)).toBe(false);
  });

  it("rejects when params are tampered (spoofed From)", () => {
    const sig = expectedTwilioSignature(token, url, params);
    const tampered = { ...params, From: "+19998887777" };
    expect(validateTwilioSignature(token, url, tampered, sig)).toBe(false);
  });

  it("rejects when a different auth token is used", () => {
    const sig = expectedTwilioSignature(token, url, params);
    expect(validateTwilioSignature("other_token", url, params, sig)).toBe(false);
  });

  it("only bypasses with the explicit local-debug escape hatch", () => {
    expect(
      validateTwilioSignature(token, url, params, "anything", { insecureNoSignature: true }),
    ).toBe(true);
  });
});
