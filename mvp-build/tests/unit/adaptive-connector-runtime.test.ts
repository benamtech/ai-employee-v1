import { describe, expect, it } from "vitest";
import {
  approvalInteractionForEffect,
  compileAdaptiveConnectorPlan,
  genericConnectorRuntimeManifest,
  resolveConnectorRuntimeManifest,
  resolveConnectorSetupActionForCapability,
} from "../../packages/shared/src/adaptive-connector-runtime";

describe("adaptive connector operating substrate", () => {
  it("activates Shopify for a clothing brand that named Shopify and order work", () => {
    const plan = compileAdaptiveConnectorPlan({
      business_kind: "clothing production brand",
      business_description: "We manufacture apparel and sell through our online store.",
      tools_mentioned: ["Shopify", "Telegram"],
      top_workflows: ["watch orders", "inventory exceptions", "fulfillment updates"],
    });
    const shopify = plan.recommendations.find((item) => item.connector_key === "shopify");
    expect(shopify?.recommendation_class).toBe("activate_now");
    expect(shopify?.event_driven).toBe(true);
    expect(shopify?.next_steps).toContain("enable_events");
    expect(plan.runtime_posture.owner_interaction).toBe("natural_language_across_surfaces");
  });

  it("uses AMTECH-managed authorization for established providers", () => {
    expect(resolveConnectorRuntimeManifest("Gmail")?.setup_experience).toBe("amtech_managed_oauth");
    expect(resolveConnectorRuntimeManifest("qbo")?.setup_experience).toBe("amtech_managed_oauth");
    expect(resolveConnectorRuntimeManifest("payments")?.setup_experience).toBe("amtech_managed_provider_onboarding");
  });

  it("keeps unknown business systems guided and fail-closed instead of blocking the owner", () => {
    const manifest = genericConnectorRuntimeManifest("Acme Production ERP");
    expect(manifest.setup_experience).toBe("guided_business_credentials");
    expect(manifest.custody).toBe("manager_mediated");
    expect(manifest.self_service_setup).toBe(false);

    const action = resolveConnectorSetupActionForCapability({
      connector_id: "acme-production-erp",
      server_id: "remote-acme",
      server_label: "Acme Production ERP",
      tool_name: "lookup_work_order",
      category: "office",
    });
    expect(action?.label).toBe("Acme Production ERP");
    expect(action?.self_service).toBe(false);
  });

  it("uses conversational approval for customer effects and explicit confirmation for money", () => {
    expect(approvalInteractionForEffect("read")).toBe("none");
    expect(approvalInteractionForEffect("internal_write")).toBe("none");
    expect(approvalInteractionForEffect("customer_facing")).toBe("conversational");
    expect(approvalInteractionForEffect("money_movement")).toBe("explicit");
  });

  it("treats SMS as a normal owner session rather than a challenge protocol", () => {
    const sms = resolveConnectorRuntimeManifest("sms");
    expect(sms?.capabilities.find((item) => item.key === "sms.owner_session")?.summary).toMatch(/without repeated authentication challenges/i);
    expect(sms?.capabilities.find((item) => item.key === "sms.owner_decisions")?.actions).toEqual(["approve", "edit", "reject", "respond"]);
  });
});
