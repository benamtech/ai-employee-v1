import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  middeskBusinessDecision,
  verifyMiddeskWebhookSignature,
} from "../../apps/manager/src/lib/onboarding-identity-provider.js";
import {
  normalizeUsTaxId,
  taxIdFingerprint,
} from "../../apps/manager/src/lib/onboarding-identity.js";

process.env.ONBOARDING_IDENTITY_PEPPER = "test-onboarding-identity-pepper";
process.env.MIDDESK_WEBHOOK_SECRET = "test-middesk-webhook-secret";

describe("S10.1 onboarding identity source contracts", () => {
  it("normalizes and fingerprints TIN values without emitting the TIN", () => {
    const normalized = normalizeUsTaxId("12-3456789");
    const fingerprint = taxIdFingerprint(normalized);
    expect(normalized).toBe("123456789");
    expect(fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(fingerprint).not.toContain(normalized);
    expect(() => normalizeUsTaxId("1234")).toThrow(/9_digits/);
  });

  it("verifies Middesk signatures over the exact raw request body", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "business.updated" });
    const signature = createHmac("sha256", process.env.MIDDESK_WEBHOOK_SECRET!).update(payload).digest("hex");
    expect(verifyMiddeskWebhookSignature(payload, signature)).toBe(true);
    expect(verifyMiddeskWebhookSignature(`${payload} `, signature)).toBe(false);
    expect(verifyMiddeskWebhookSignature(payload, "bad")).toBe(false);
  });

  it("maps provider lifecycle states fail closed", () => {
    expect(middeskBusinessDecision({ status: "approved" }).decision).toBe("verified");
    expect(middeskBusinessDecision({ status: "rejected" }).decision).toBe("rejected");
    expect(middeskBusinessDecision({ status: "in_review" }).decision).toBe("pending");
    expect(middeskBusinessDecision({ status: "pending", tin: { status: "mismatch" } }).decision).toBe("rejected");
  });

  it("binds employee activation to verified identity, canonical assignment, and accepted C3 receipt", async () => {
    const [migration, completionFix, activationFix, registry, verifiedTool, ownerSession, template, generated] = await Promise.all([
      readFile(new URL("../../packages/db/migrations/0064_onboarding_identity_activation_authority.sql", import.meta.url), "utf8"),
      readFile(new URL("../../packages/db/migrations/0065_onboarding_identity_completion_status_qualification.sql", import.meta.url), "utf8"),
      readFile(new URL("../../packages/db/migrations/0066_onboarding_identity_activation_output_qualification.sql", import.meta.url), "utf8"),
      readFile(new URL("../../apps/manager/src/tools/registry.ts", import.meta.url), "utf8"),
      readFile(new URL("../../apps/manager/src/tools/verified-provisioning.stub.ts", import.meta.url), "utf8"),
      readFile(new URL("../../apps/manager/src/lib/owner-session.ts", import.meta.url), "utf8"),
      readFile(new URL("../../apps/manager/src/server.template.ts", import.meta.url), "utf8"),
      readFile(new URL("../../apps/manager/src/server.generated.ts", import.meta.url), "utf8"),
    ]);
    expect(migration).toContain("reserve_onboarding_identity_verification");
    expect(migration).toContain("amtech_activate_verified_employee");
    expect(migration).toContain("register_durable_command");
    expect(migration).toContain("record_effect_receipt");
    expect(migration).toContain("complete_durable_command");
    expect(migration).toContain("employee_assignments");
    expect(migration).not.toMatch(/tax_id\s+text/i);
    expect(completionFix).toContain("where oi.id = v_identity.id");
    expect(completionFix).toContain("and oi.status = 'pending'");
    expect(completionFix).toContain("oia_latest.status in ('requested','submitted')");
    expect(activationFix).toContain("update onboarding_identities as oi");
    expect(activationFix).toContain("oi.employee_principal_id is null");
    expect(registry).toContain("...verifiedProvisioningTools");
    expect(verifiedTool).toContain("onboardingIdentityDecision");
    expect(verifiedTool).toContain('receipt_status: "accepted"');
    expect(ownerSession).toContain("owner_account_membership_not_active");
    expect(ownerSession).not.toContain("owner_assignment_not_active");
    expect(template).toContain("registerOnboardingIdentityRoutes(app, denyInternal)");
    expect(generated).toContain("canonical_onboarding_activation_route_required");
  });
});
