import { describe, expect, it } from "vitest";
import {
  EmployeeUiPortContract,
  EmployeeUiPresentationOverride,
  OnboardingManifest,
  resolveApprovedUiPreset,
  resolveEmployeeUiPort,
} from "@amtech/shared";

describe("employee UI port and presentation strategies", () => {
  it("keeps adapter selection separate from theme and layout strategies", () => {
    const owner = resolveEmployeeUiPort({ adapter_key: "owner_web" });
    const form = resolveEmployeeUiPort({ adapter_key: "public_form" });
    const website = resolveEmployeeUiPort({ adapter_key: "boundless_website" });

    expect(owner).toMatchObject({ adapter_key: "owner_web", presentation: { layout_key: "conversation_workspace" } });
    expect(form).toMatchObject({ adapter_key: "public_form", presentation: { layout_key: "form_chat", component_set_key: "form_forward" } });
    expect(website).toMatchObject({ adapter_key: "boundless_website", presentation: { layout_key: "boundless", component_set_key: "editorial" } });
    expect(EmployeeUiPortContract.safeParse(owner).success).toBe(true);
  });

  it("matches ordinary owner web presentation from profile and business context", () => {
    expect(resolveEmployeeUiPort({ adapter_key: "owner_web", business_kind: "bookkeeping and payroll" }).presentation)
      .toMatchObject({ theme_key: "ledger", layout_key: "focus", density: "dense", source: "profile_match" });
    expect(resolveEmployeeUiPort({ adapter_key: "owner_web", profile_key: "shopify_clothing_operations" }).presentation)
      .toMatchObject({ theme_key: "studio", layout_key: "canvas", source: "profile_match" });
    expect(resolveEmployeeUiPort({ adapter_key: "owner_web", business_kind: "residential painting contractor" }).presentation)
      .toMatchObject({ theme_key: "field_notebook", layout_key: "conversation_workspace", source: "profile_match" });
  });

  it("has no approved assignment before deliberate promotion", () => {
    expect(resolveApprovedUiPreset({
      adapter_key: "owner_web",
      profile_key: "marketing_agency",
      business_kind: "marketing agency",
    })).toBeNull();
  });

  it("turns onboarding brand facts into scoped design tokens", () => {
    const port = resolveEmployeeUiPort({
      adapter_key: "owner_web",
      signals: [
        { key: "durable_facts:branding.primary_color", value: "Use #123456 as the primary brand color" },
        { key: "durable_facts:branding.accent_color", value: "Accent #fedcba" },
      ],
    });
    expect(port.presentation).toMatchObject({
      theme_key: "brand",
      brand: { primary: "#123456", accent: "#fedcba" },
      source: "onboarding_brand",
    });
  });

  it("applies profile-generated hints and then explicit user or UI Lab overrides", () => {
    const signals = [{
      key: "standing_preferences:ui_presentation",
      value: JSON.stringify({ theme_key: "midnight", layout_key: "focus", component_set_key: "terminal" }),
    }];
    const generated = resolveEmployeeUiPort({ adapter_key: "owner_web", signals });
    expect(generated.presentation).toMatchObject({ theme_key: "midnight", component_set_key: "terminal", source: "profile_generated" });

    const overridden = resolveEmployeeUiPort({
      adapter_key: "owner_web",
      signals,
      explicit: { theme_key: "high_contrast", layout_key: "canvas", source: "ui_lab" },
    });
    expect(overridden.presentation).toMatchObject({ theme_key: "high_contrast", layout_key: "canvas", component_set_key: "terminal", source: "ui_lab" });
  });

  it("accepts bounded custom registry keys and rejects arbitrary CSS-like identifiers", () => {
    expect(EmployeeUiPresentationOverride.safeParse({ theme_key: "custom:client-blue" }).success).toBe(true);
    expect(EmployeeUiPresentationOverride.safeParse({ theme_key: "url(javascript:bad)" }).success).toBe(false);
  });

  it("lets onboarding and profile generation carry presentation hints without a schema migration", () => {
    const parsed = OnboardingManifest.safeParse({
      employee_type: "contractor_estimator",
      profile_package_key: "contractor_estimator",
      business_display_name: "Example Painting",
      business_kind: "painting contractor",
      timezone: "America/New_York",
      owner_name: "Owner",
      verified_phone_e164: "+15705551234",
      verification_method: "sms_inbound",
      consent_channel: "web",
      employee_name: "Avery",
      top_workflows: ["estimate intake"],
      tools_mentioned: [],
      seed_skills: [],
      pricing_facts: [],
      branding_facts: [],
      customer_job_facts: [],
      ui_presentation: { theme_key: "field_notebook", component_set_key: "standard" },
    });
    expect(parsed.success).toBe(true);
  });
});
