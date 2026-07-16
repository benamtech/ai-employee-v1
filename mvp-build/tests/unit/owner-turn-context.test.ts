import { describe, expect, it } from "vitest";
import { buildOwnerTurnSystemMessage } from "../../apps/manager/src/lib/owner-turn-context";
import { makeFakeDb } from "./_helpers/fake-supabase";
import type { OnboardingManifest } from "../../packages/shared/src/manifest";

const manifest: OnboardingManifest = {
  employee_type: "contractor_estimator",
  profile_package_key: "contractor_estimator",
  business_display_name: "North Star Painting",
  business_kind: "painting",
  timezone: "America/New_York",
  owner_name: "Riley",
  owner_email: "riley@example.com",
  verified_phone_e164: "+15555550123",
  verification_method: "twilio_verify",
  consent_channel: "web",
  employee_name: "Sage",
  top_workflows: ["estimate walk-throughs", "invoice follow-up"],
  tools_mentioned: ["QuickBooks", "Gmail"],
  seed_skills: ["estimate", "invoice"],
  pricing_facts: [{ key: "labor_rate", value: "$85/hour", confidence: "high" }],
  branding_facts: [{ key: "tone", value: "plainspoken", confidence: "medium" }],
  customer_job_facts: [{ key: "ideal_customer", value: "homeowners", confidence: "high" }],
  seven_question_answers: {
    business: "North Star Painting handles residential repainting.",
    repeat_computer_work: "Writing estimates after site visits.",
    tools_in_use: "Gmail and QuickBooks.",
  },
};

describe("owner turn context", () => {
  it("builds a compact hot-path prompt from the manifest", async () => {
    const db = makeFakeDb({
      employee_manifests: [{ employee_id: "emp_1", profile_package_key: "contractor_estimator", manifest, created_at: "2026-07-16T00:00:00.000Z" }],
    });

    const text = await buildOwnerTurnSystemMessage(db.asClient(), {
      account_id: "acct_1",
      employee_id: "emp_1",
      channel: "web",
    });

    expect(text).toContain("Owner chat hot path");
    expect(text).toContain("North Star Painting");
    expect(text).toContain("QuickBooks");
    expect(text).toContain("$85/hour");
    expect(text.length).toBeLessThan(2400);
  });
});
