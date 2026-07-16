import { describe, expect, it } from "vitest";
import { buildProfileContext } from "../../apps/manager/src/lib/profile-context";
import { buildNativeMemoryFiles } from "../../apps/manager/src/lib/memory-seed";
import type { OnboardingManifest } from "../../packages/shared/src/manifest";

function manifest(overrides: Partial<OnboardingManifest> = {}): OnboardingManifest {
  return {
    employee_type: "contractor_estimator",
    profile_package_key: "contractor_estimator",
    business_display_name: "North Star Painting",
    business_kind: "painting",
    timezone: "America/New_York",
    owner_name: "Riley",
    verified_phone_e164: "+15555550123",
    verification_method: "twilio_verify",
    consent_channel: "web",
    employee_name: "Sage",
    top_workflows: ["estimate walk-throughs", "invoice follow-up"],
    tools_mentioned: ["QuickBooks", "Gmail"],
    seed_skills: ["estimate", "invoice"],
    pricing_facts: [{ key: "labor_rate", value: "$85/hour", confidence: "high", source_snippet: "raw onboarding quote" }],
    branding_facts: [{ key: "tone", value: "plainspoken", confidence: "medium" }],
    customer_job_facts: [{ key: "ideal_customer", value: "homeowners", confidence: "high" }],
    seven_question_answers: {
      business: "North Star Painting handles residential repainting.",
      repeat_computer_work: "Writing estimates after site visits.",
      tools_in_use: "Gmail and QuickBooks.",
    },
    ...overrides,
  };
}

describe("profile context and native memory seed", () => {
  it("normalizes contractor onboarding into generic context slots", () => {
    const context = buildProfileContext({ packageKey: "contractor_estimator", manifest: manifest() });
    expect(context.generated_from).toBe("onboarding_manifest");
    expect(context.slots.map((slot) => slot.key)).toContain("business_identity");
    expect(context.slots.map((slot) => slot.key)).toContain("durable_facts");
    expect(context.slots.find((slot) => slot.key === "tools")?.facts.map((fact) => fact.value).join("\n")).toContain("QuickBooks");
    expect(JSON.stringify(context)).not.toContain("raw onboarding quote");
  });

  it("renders Hermes MEMORY and USER files within the declared caps", () => {
    const context = buildProfileContext({ packageKey: "contractor_estimator", manifest: manifest() });
    const memories = buildNativeMemoryFiles(context);
    expect(memories.memory_md.length).toBeLessThanOrEqual(2200);
    expect(memories.user_md.length).toBeLessThanOrEqual(1375);
    expect(memories.memory_md).toContain("business_name: North Star Painting");
    expect(memories.memory_md).toContain("amtech://manager/business-brain");
    expect(memories.user_md).not.toContain("amtech://manager/business-brain");
  });

  it("defaults missing native memory limits instead of crashing malformed profile contexts", () => {
    const context = buildProfileContext({ packageKey: "contractor_estimator", manifest: manifest() });
    delete (context as Partial<typeof context>).memory_limits;
    const memories = buildNativeMemoryFiles(context);
    expect(memories.memory_md).toContain("business_name: North Star Painting");
    expect(memories.memory_md.length).toBeLessThanOrEqual(2200);
    expect(memories.user_md.length).toBeLessThanOrEqual(1375);
  });

  it("uses the generic package fallback without creating platform-specific types", () => {
    const context = buildProfileContext({ packageKey: "future_vertical", manifest: manifest({ profile_package_key: "future_vertical" }) });
    expect(context.package_key).toBe("future_vertical");
    expect(context.slots.map((slot) => slot.key)).toEqual(expect.arrayContaining(["business_identity", "workflows", "durable_facts"]));
  });
});
