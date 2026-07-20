import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  planAdaptiveOperatingLayout,
  type ResourcePayload,
} from "@amtech/shared";

async function source(path: string): Promise<string> {
  return readFile(path, "utf8");
}

const basePayload = (): ResourcePayload => ({
  account_id: "acct_ui",
  employee_id: "emp_ui",
  artifacts: [],
  approvals: [],
  messages: [],
  connectors: [],
  stripe_invoices: [],
  reminders: [],
  job_commitments: [],
  work_events: [],
  abilities: [],
  capabilities: [],
  surface_envelopes: [],
  outputs: [],
  tasks: [],
  connection_surfaces: [],
  resurface_items: [],
});

describe("AMTECH agent UI contracts", () => {
  it("uses one adaptive operating shell and one generated work grammar", async () => {
    const [surface, renderer, shell] = await Promise.all([
      source("apps/web/app/agent/[employeeId]/AgentSurface.tsx"),
      source("apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx"),
      source("apps/web/app/agent/[employeeId]/LiveEmployeeOperatingShell.tsx"),
    ]);
    expect(surface).toContain("AgentClient");
    expect(renderer).toContain("WorkResource");
    expect(renderer).toContain("WorkAction");
    expect(shell).toContain("Live work");
    expect(shell).toContain("assistant_delta");
  });

  it("keeps visible owner state distinct across loading, offline, empty, work, and recovery", async () => {
    const client = await source("apps/web/app/agent/[employeeId]/AgentClient.tsx");
    for (const marker of ["connecting", "reconnecting", "offline", "loading", "hasAnyWork"]) {
      expect(client).toContain(marker);
    }
  });

  it("keeps browser calls on first-party routes rather than provider endpoints", async () => {
    const client = await source("apps/web/app/agent/[employeeId]/AgentClient.tsx");
    expect(client).toContain("/api/employee/");
    for (const forbidden of ["accounts.google.com", "quickbooks.api.intuit.com", "api.stripe.com", "Authorization: `Bearer"]) {
      expect(client).not.toContain(forbidden);
    }
  });

  it("keeps approval decisions on exact native resources", async () => {
    const renderer = await source("apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx");
    expect(renderer).toContain('resource.resource_type === "approval"');
    expect(renderer).toContain("resolveApproval");
  });
});

describe("adaptive layout planner", () => {
  it("prioritizes current work and attention before system changes", () => {
    const payload = basePayload();
    payload.tasks = [{
      id: "task_1",
      source: "approval",
      target_id: "approval_1",
      task_type: "approval",
      title: "Approve estimate",
      summary: "Review the estimate before it is sent.",
      status: "ready",
      primary_action: "approve",
      proof: {},
    }];
    payload.resurface_items = [{
      id: "resurface_1",
      source: "approval",
      target_id: "approval_1",
      title: "Estimate needs approval",
      reason: "Customer-facing effect is blocked.",
      primary_action: "approve",
      proof: {},
    }];
    payload.connection_surfaces = [{
      id: "conn_1",
      connector_key: "gmail",
      provider: "gmail",
      category: "communication",
      status: "disconnected",
      label: "Email",
      can: [],
      cannot: [],
      safe_summary: "Email is not connected.",
      primary_action: "connect",
      secondary_action: null,
      required: true,
      blocking: true,
      blocked_reason: "Needs owner connection",
    }];
    const plan = planAdaptiveOperatingLayout(payload);
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
    expect(identity).toContain("owner-session");
    expect(route).toContain("owner_session_token");
  });
});
