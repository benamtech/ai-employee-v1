import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  planAdaptiveOperatingLayout,
  type ActiveSave,
  type AdaptiveLayoutInput,
  type DelegatedWorkUnit,
  type OperatingSystemChange,
  type OperatingWorkLoop,
} from "@amtech/shared";
import { planAdaptiveOperatingLayout as planAdaptiveOperatingLayoutContract } from "../../packages/shared/src/operating-system";

const root = process.cwd();
const source = (path: string) => readFile(join(root, path), "utf8");

function activeLoop(id = "loop:primary", updatedAt = "2026-07-19T00:00:00.000Z"): OperatingWorkLoop {
  return {
    id,
    title: "Grow qualified pipeline",
    summary: "The employee is carrying the campaign across research, ads, and follow-up.",
    state: "active",
    horizon: "now",
    domain: "growth",
    updated_at: updatedAt,
    source_envelope_ids: [],
    proof: { assignment_id: "asn_test" },
  };
}

function changes(count: number): OperatingSystemChange[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `change:${index}`,
    title: `Low-risk event ${index}`,
    source: "event_ingress",
    state: "observed",
    proof: { assignment_id: "asn_test" },
  }));
}

function returnedSave(): ActiveSave {
  return {
    id: "save:returned",
    title: "Customer changed scope",
    why_held: "The employee was waiting for a material customer reply.",
    state: "needs_you",
    return_condition: {
      kind: "event",
      description: "Return when the customer changes scope.",
    },
    proof: { assignment_id: "asn_test" },
  };
}

function failedDelegation(): DelegatedWorkUnit {
  return {
    id: "delegation:failed",
    parent_loop_id: "loop:primary",
    title: "Verify source trail",
    purpose: "Trace a material claim to its primary source.",
    executor_kind: "specialist_agent",
    state: "failed",
    blocking_reason: "The primary source could not be retrieved.",
    proof: { assignment_id: "asn_test" },
  };
}

function layoutInput(overrides: Partial<AdaptiveLayoutInput> = {}): AdaptiveLayoutInput {
  return {
    generated_at: "2026-07-19T00:00:00.000Z",
    context_fingerprint: "sha256:test",
    owner_experience: "guided",
    preferred_density: "balanced",
    loops: [activeLoop()],
    active_saves: [],
    decisions: [],
    changes: [],
    delegated_work: [],
    evidence: [],
    connection_attention_count: 0,
    ...overrides,
  };
}

describe("AMTECH interface authority", () => {
  it("keeps one canonical visual, operating, and validation chain", async () => {
    const design = await source("../docs/AMTECH_WEB_DESIGN_SYSTEM.md");
    const agent = await source("../docs/AMTECH_AGENT_INTERFACE_STANDARD.md");
    const validation = await source("../docs/AMTECH_UI_VALIDATION_STANDARD.md");
    expect(design).toContain("Historical 369");
    expect(design).toContain("non-canonical");
    for (const primitive of ["Work loop", "Active save", "Decision", "System change", "Evidence", "Delegated work unit"]) {
      expect(agent).toContain(primitive);
    }
    expect(agent).toContain("not a chatbot shell");
    expect(validation).toContain("G10");
  });
});

describe("AMTECH runtime design tokens", () => {
  it("implements the canonical light palette, spacing, radii, focus, and motion", async () => {
    const css = await source("apps/web/app/globals.css");
    for (const token of [
      "--amtech-ink: #111111",
      "--amtech-white: #ffffff",
      "--amtech-canvas: #f7f9fc",
      "--amtech-red: #e11d2a",
      "--amtech-blue: #2563eb",
      "--amtech-cyan: #dff6ff",
      "--amtech-green: #168a57",
      "--amtech-space-1: 8px",
      "--amtech-radius-card: 20px",
      ":focus-visible",
      "prefers-reduced-motion",
    ]) expect(css.toLowerCase()).toContain(token.toLowerCase());
    expect(css).not.toContain("border-radius: 0;");
    expect(css).not.toContain("--font-plex-mono");
  });
});

describe("adaptive operating surface", () => {
  it("uses stable intents and operating primitives through the single projection controller without a fixed tab shell", async () => {
    const surface = await source("apps/web/app/agent/[employeeId]/AgentSurface.tsx");
    const controller = await source("apps/web/app/agent/[employeeId]/owner-projection-controller.ts");
    const contracts = await source("packages/shared/src/operating-system.ts");
    for (const marker of ["intent_id", "OperatingSurfaceState", "ActiveSave", "DelegatedWorkUnit", "OperatingEvidence"]) {
      expect(surface + contracts).toContain(marker);
    }
    for (const marker of ["EventSource", "snapshot", "installOwnerSnapshot", "validateScopedFrame"]) {
      expect(controller).toContain(marker);
    }
    expect(surface).toContain("openOwnerProjectionController");
    expect(surface).toContain("WorkObjectRenderer");
    expect(surface).not.toContain("type PrimaryView");
    expect(surface).not.toContain('role="tablist"');
    expect(surface).not.toContain("amber-");
  });

  it("produces the same layout for the same bounded context", () => {
    const input = layoutInput({ changes: changes(12) });
    expect(planAdaptiveOperatingLayout(input)).toEqual(planAdaptiveOperatingLayout(input));
  });

  it("keeps package and contract-module planner exports identical", () => {
    const input = layoutInput({
      loops: [
        activeLoop("loop:older", "2026-07-18T22:00:00.000Z"),
        activeLoop("loop:newer", "2026-07-19T01:00:00.000Z"),
      ],
      active_saves: [returnedSave()],
      delegated_work: [failedDelegation()],
      changes: changes(100),
    });
    expect(planAdaptiveOperatingLayoutContract(input)).toEqual(planAdaptiveOperatingLayout(input));
  });

  it("keeps focus stable when equivalent loop input ordering changes", () => {
    const older = activeLoop("loop:older", "2026-07-18T22:00:00.000Z");
    const newer = activeLoop("loop:newer", "2026-07-19T01:00:00.000Z");
    const forward = planAdaptiveOperatingLayout(layoutInput({ loops: [older, newer] }));
    const reverse = planAdaptiveOperatingLayout(layoutInput({ loops: [newer, older] }));
    expect(forward).toEqual(reverse);
    expect(forward.focus_loop_id).toBe("loop:newer");
  });

  it("puts an owner decision before high-volume low-risk activity", () => {
    const plan = planAdaptiveOperatingLayout(layoutInput({
      changes: changes(10_000),
      decisions: [{
        id: "decision:send",
        title: "Send campaign change",
        consequence: "This changes customer-visible spend and messaging.",
        risk: "high",
        proof: { assignment_id: "asn_test", approval_id: "apr_test" },
      }],
    }));
    expect(plan.primary_region).toBe("attention");
    expect(plan.rationale_codes).toContain("high_risk_owner_decision");
  });

  it("returns a reached active save ahead of routine active work", () => {
    const plan = planAdaptiveOperatingLayout(layoutInput({ active_saves: [returnedSave()] }));
    expect(plan.primary_region).toBe("active_saves");
    expect(plan.rationale_codes).toContain("return_condition_reached");
  });

  it("surfaces a material delegated failure ahead of routine active work", () => {
    const plan = planAdaptiveOperatingLayout(layoutInput({ delegated_work: [failedDelegation()] }));
    expect(plan.primary_region).toBe("delegated_work");
    expect(plan.rationale_codes).toContain("delegated_failure_material");
  });

  it("dampens event volume so active work remains structurally visible", () => {
    const plan = planAdaptiveOperatingLayout(layoutInput({ changes: changes(10_000) }));
    expect(plan.primary_region).not.toBe("system_changes");
    expect(plan.ordered_regions.find((region) => region.kind === "system_changes")?.priority)
      .toBeLessThan(plan.ordered_regions.find((region) => region.kind === "guidance")?.priority ?? 0);
  });
});

describe("context compiler", () => {
  it("uses bounded manifest/profile/runtime/session doctrine without exposing raw files", async () => {
    const compiler = await source("apps/manager/src/lib/operating-surface.ts");
    for (const marker of ["employee_manifests", "employee_profile_builds", "readBusinessFactsResource", "agent_context_primer_sessions", "doctrine_versions", "context_fingerprint"]) {
      expect(compiler).toContain(marker);
    }
    for (const forbidden of ["raw_agents_md", "raw_codegraph", "raw_soul", "chain_of_thought", "provider_secret"]) {
      expect(compiler).not.toContain(forbidden);
    }
  });
});

describe("MCP Apps boundary", () => {
  it("keeps generated UI sandboxed, content-bound, and host-mediated", async () => {
    const mcp = await source("apps/web/app/agent/[employeeId]/components/McpUiResource.tsx");
    expect(mcp).toContain('sandbox="allow-scripts"');
    expect(mcp).toContain("e.source !== ref.current.contentWindow");
    expect(mcp).toContain('e.origin !== "null"');
    expect(mcp).toContain("validateMcpAppSecurityMetadata");
    expect(mcp).toContain("metadata.resource_hash");
    expect(mcp).toContain('message.method !== "tools/call"');
    expect(mcp).not.toContain("allow-same-origin");
  });
});

describe("verified onboarding activation", () => {
  it("attaches secure identity UI and fails provisioning closed until verified", async () => {
    const page = await source("apps/web/app/create-ai-employee/page.tsx");
    const gate = await source("apps/web/app/create-ai-employee/OnboardingIdentityGate.tsx");
    const identity = await source("apps/web/app/create-ai-employee/BusinessIdentityControl.tsx");
    const route = await source("apps/web/app/api/front-door/provision/route.ts");
    expect(page).toContain("OnboardingIdentityGate");
    expect(gate).toContain("BusinessIdentityControl");
    expect(identity).toContain("identityState");
    expect(identity).toContain("taxId");
    expect(identity).toContain("/api/front-door/identity/verify");
    expect(route).toContain("cookies");
    expect(route).toContain("owner_session_token");
    expect(route).toContain("identity/status");
    expect(route).toContain("identity_unverified");
  });
});

describe("evidence integrity", () => {
  it("marks the estimator as non-canonical", async () => {
    const estimatorPage = await source("apps/web/app/free-estimator/page.tsx");
    expect(estimatorPage).toContain("Non-canonical preview");
  });
});
