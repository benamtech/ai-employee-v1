import { describe, expect, it } from "vitest";
import { onboardingManifestReadiness } from "../../apps/manager/src/orchestrator";

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
});
