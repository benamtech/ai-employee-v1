import { describe, expect, it } from "vitest";
import { modelSafeObject, modelSafeTranscript, onboardingManifestReadiness } from "../../apps/manager/src/orchestrator";

describe("onboarding manifest readiness", () => {
  it("requires the minimum facts needed before account creation", () => {
    expect(onboardingManifestReadiness({ business_display_name: "Pocono Paint & Remodel" })).toEqual({
      ready: false,
      missing_fields: ["business_kind", "timezone", "employee_name", "top_workflows"],
    });
  });

  it("marks the onboarding chat ready once the manifest can create an account and employee", () => {
    expect(onboardingManifestReadiness({
      business_display_name: "Pocono Paint & Remodel",
      business_kind: "painting_and_remodeling",
      timezone: "America/New_York",
      employee_name: "Jordan",
      top_workflows: ["estimate walkthroughs"],
    })).toEqual({ ready: true, missing_fields: [] });
  });

  it("strips contact and account fields before sending manifest context to the onboarding model", () => {
    expect(modelSafeObject({
      business_display_name: "Pocono Paint & Remodel",
      owner_email: "owner@example.com",
      verified_phone_e164: "+18055551234",
      verified_phone_ref: "phone_123",
      account_id: "acct_123",
      notes: "Call me at +1 805 555 1234 or owner@example.com",
    })).toEqual({
      business_display_name: "Pocono Paint & Remodel",
      notes: "Call me at [redacted-phone-or-code] or [redacted-email]",
    });
  });

  it("redacts accidental contact details in transcript text before model calls", () => {
    expect(modelSafeTranscript([
      { role: "owner", body: "My email is owner@example.com and phone is +18055551234", at: "now" },
    ])).toEqual([
      { role: "owner", body: "My email is [redacted-email] and phone is [redacted-phone-or-code]", at: "now" },
    ]);
  });
});
