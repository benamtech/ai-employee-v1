import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  matchTaskCapabilities,
  resolveOwnerManagedConnectorSetup,
  type ToolCapabilityDescriptor,
} from "../../packages/shared/src/index";

const capabilities: ToolCapabilityDescriptor[] = [
  {
    id: "toolcap:manager:create-email-draft",
    capability_key: "manager_tool:create_email_draft",
    server_id: "amtech-manager",
    server_label: "AMTECH Manager",
    transport: "manager_mcp",
    tool_name: "create_email_draft",
    label: "Draft customer email",
    summary: "Prepare a customer email draft while sending remains gated.",
    category: "communication",
    availability: "ready",
    can_run_now: true,
    read_only: false,
    risk: "write",
    requires_approval: false,
    evidence: { level: "control_plane_contract", source_refs: ["manager_mcp:tools/create_email_draft"] },
  },
  {
    id: "toolcap:runtime:browser",
    capability_key: "browser",
    server_id: "hermes:browser",
    server_label: "Hermes Browser",
    transport: "runtime_native",
    tool_name: "browser",
    label: "Browser research",
    summary: "Research a website in an isolated browser session.",
    category: "research",
    availability: "unverified",
    can_run_now: false,
    read_only: false,
    risk: "unknown",
    requires_approval: true,
    setup_requirement: "Live browser probe required",
    evidence: { level: "runtime_report", failed_dimensions: ["live_probe_passed"], source_refs: ["effective_capability_evidence:test"] },
  },
];

describe("task-aware capability matching", () => {
  it("maps a relevant Manager MCP tool to customer work without granting execution", () => {
    const matches = matchTaskCapabilities([{ id: "task-1", title: "Draft the customer follow-up email", type: "work" }], capabilities);
    expect(matches[0]).toMatchObject({
      task_id: "task-1",
      loop_id: "loop:task-1",
      capability_id: "toolcap:manager:create-email-draft",
      role: "primary",
    });
    expect(matches.some((match) => match.capability_id === "toolcap:runtime:browser")).toBe(false);
  });

  it("shows a relevant runtime capability as blocked until live evidence passes", () => {
    const matches = matchTaskCapabilities([{ id: "task-2", title: "Research and revise the website", type: "work" }], capabilities);
    expect(matches).toContainEqual(expect.objectContaining({
      task_id: "task-2",
      capability_id: "toolcap:runtime:browser",
      role: "blocked",
    }));
  });

  it("is deterministic for the same task and catalog", () => {
    const task = [{ id: "task-1", title: "Research and revise the website", type: "work" }];
    expect(matchTaskCapabilities(task, capabilities)).toEqual(matchTaskCapabilities(task, capabilities));
  });
});

describe("owner managed connector registry", () => {
  it("binds shipped connectors to explicit protocols, tools, scopes, and authorization hosts", () => {
    expect(resolveOwnerManagedConnectorSetup("email")).toMatchObject({
      key: "gmail",
      authorization_protocol: "oauth2_authorization_code",
      start_tool: "connect_email",
      allowed_authorization_hosts: ["accounts.google.com"],
    });
    expect(resolveOwnerManagedConnectorSetup("qbo")).toMatchObject({
      key: "quickbooks",
      authorization_protocol: "oauth2_authorization_code",
      start_tool: "connect_quickbooks",
      allowed_authorization_hosts: ["appcenter.intuit.com"],
    });
    expect(resolveOwnerManagedConnectorSetup("stripe")).toMatchObject({
      key: "stripe",
      authorization_protocol: "provider_managed_onboarding",
      start_tool: "connect_stripe",
      allowed_authorization_hosts: ["connect.stripe.com"],
    });
  });

  it("fails closed for an unknown MCP or connector identity", () => {
    expect(resolveOwnerManagedConnectorSetup("arbitrary-mcp-server")).toBeNull();
  });
});

describe("product source contracts", () => {
  it("exposes the same tool catalog through owner HTTP and MCP resources", async () => {
    const ownerRoute = await readFile("apps/manager/src/lib/onboarding-identity-routes.ts", "utf8");
    const mcp = await readFile("apps/manager/src/lib/mcp-server.ts", "utf8");
    expect(ownerRoute).toContain("buildToolCapabilityCatalog");
    expect(ownerRoute).toContain("task_capability_matches");
    expect(mcp).toContain("amtech://manager/tool-catalog");
    expect(mcp).toContain("amtech://manager/task-capabilities");
  });

  it("stages an editable instruction instead of executing a browser-selected tool", async () => {
    const drawer = await readFile("apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx", "utf8");
    expect(drawer).toContain("Stage, don&rsquo;t execute");
    expect(drawer).toContain("/message");
    expect(drawer).not.toContain("/manager/mcp");
    expect(drawer).not.toContain("tools/call");
  });

  it("uses one shared managed descriptor for copy, tool selection, scopes, and host validation", async () => {
    const manager = await readFile("apps/manager/src/lib/artifact-workbench-routes.ts", "utf8");
    const web = await readFile("apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts", "utf8");
    const consent = await readFile("apps/web/app/agent/[employeeId]/connect/[connector]/page.tsx", "utf8");
    expect(manager).toContain("resolveOwnerManagedConnectorSetup");
    expect(web).toContain("resolveOwnerManagedConnectorSetup");
    expect(consent).toContain("resolveOwnerManagedConnectorSetup");
    expect(web).toContain("allowed_authorization_hosts");
  });
});
