import { describe, expect, it } from "vitest";
import { compileOnboardingManifest } from "../../apps/manager/src/server";

describe("onboarding session manifest compiler", () => {
  it("compiles a valid provisioning manifest from canonical session state", () => {
    const compiled = compileOnboardingManifest({
      id: "onb_test",
      manifest_draft: {
        employee_type: "contractor_estimator",
        profile_package_key: "contractor_estimator",
        business_display_name: "Pocono Painting and Remodeling",
        business_kind: "painting and remodeling",
        timezone: "America/New_York",
        employee_name: "Jordan",
        top_workflows: ["estimates", "invoicing", "social content"],
        verified_phone_e164: "+15705551234",
        verification_method: "twilio_verify",
        consent_channel: "web",
        owner_email: "owner@example.com",
      },
    }, "acct_test");

    expect(compiled.missing_fields).toEqual([]);
    expect(compiled.manifest).toMatchObject({
      account_id: "acct_test",
      business_display_name: "Pocono Painting and Remodeling",
      owner_name: "Owner",
      transcript_ref: "onb_test",
      verified_phone_e164: "+15705551234",
    });
  });

  it("returns missing fields instead of allowing invalid manifests through", () => {
    const compiled = compileOnboardingManifest({
      id: "onb_test",
      manifest_draft: {
        business_display_name: "Pocono Painting and Remodeling",
      },
    }, "acct_test");

    expect(compiled.manifest).toBeUndefined();
    expect(compiled.missing_fields).toContain("business_kind");
    expect(compiled.missing_fields).toContain("verified_phone_e164");
  });
});
