import { describe, it, expect } from "vitest";
import { OnboardingManifest } from "../../packages/shared/src/manifest";

describe("onboarding manifest schema", () => {
  const valid = {
    business_display_name: "Hernandez Painting",
    business_kind: "painting",
    timezone: "America/New_York",
    owner_name: "Luis Hernandez",
    owner_email: "luis@example.com",
    verified_phone_e164: "+15705551234",
    verification_method: "twilio_verify",
    consent_channel: "web",
    employee_name: "Sam",
  };

  it("accepts a valid manifest and applies array defaults", () => {
    const parsed = OnboardingManifest.parse(valid);
    expect(parsed.pricing_facts).toEqual([]);
    expect(parsed.tools_mentioned).toEqual([]);
  });

  it("rejects a non-E.164 phone", () => {
    const bad = { ...valid, verified_phone_e164: "570-555-1234" };
    expect(() => OnboardingManifest.parse(bad)).toThrow();
  });

  it("rejects an unknown verification method", () => {
    const bad = { ...valid, verification_method: "magic" };
    expect(() => OnboardingManifest.parse(bad)).toThrow();
  });
});
