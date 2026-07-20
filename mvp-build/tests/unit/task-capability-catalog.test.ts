import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildToolCapabilityCatalog,
  resolveTaskCapabilities,
} from "../../apps/manager/src/lib/tool-capability-catalog.js";

const baseContext = {
  account_id: "acct_alpha",
  employee_id: "emp_alpha",
  assignment_id: "asn_alpha",
  authority: {
    actor: "owner" as const,
    principal_id: "hpr_alpha",
    principal_class: "human" as const,
    authenticated_by: "owner_web_session:sess_alpha",
  },
};

describe("task capability catalog", () => {
  it("resolves semantically related governed tools without granting execution", () => {
    const matches = resolveTaskCapabilities("send a customer estimate by email and collect a deposit", baseContext);
    expect(matches.map((match) => match.tool_name)).toEqual(expect.arrayContaining([
      "create_email_draft",
      "send_email_draft",
      "create_deposit_invoice",
      "send_deposit_invoice",
    ]));
    expect(matches.every((match) => match.assignment_id === "asn_alpha")).toBe(true);
    expect(matches.every((match) => match.execution_authority === false)).toBe(true);
  });

  it("requires approval metadata for consequential customer-facing and money tools", () => {
    const catalog = buildToolCapabilityCatalog(baseContext);
    const sendEmail = catalog.find((tool) => tool.tool_name === "send_email_draft");
    const sendInvoice = catalog.find((tool) => tool.tool_name === "send_deposit_invoice");
    expect(sendEmail).toMatchObject({ requires_approval: true, customer_facing: true });
    expect(sendInvoice).toMatchObject({ requires_approval: true, money: true, customer_facing: true });
  });

  it("keeps read-only capability discovery distinct from write authority", () => {
    const matches = resolveTaskCapabilities("show current bookkeeping balances", baseContext);
    expect(matches.some((match) => match.tool_name === "get_balance_sheet")).toBe(true);
    expect(matches.every((match) => match.execution_authority === false)).toBe(true);
  });

  it("returns no invented tool for an unsupported task", () => {
    expect(resolveTaskCapabilities("launch a nuclear reactor", baseContext)).toEqual([]);
  });

  it("binds every catalog row to one assignment and principal context", () => {
    const catalog = buildToolCapabilityCatalog(baseContext);
    expect(catalog.length).toBeGreaterThan(0);
    for (const row of catalog) {
      expect(row.account_id).toBe("acct_alpha");
      expect(row.employee_id).toBe("emp_alpha");
      expect(row.assignment_id).toBe("asn_alpha");
      expect(row.authority).toEqual(baseContext.authority);
    }
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

  it("uses one shared managed-connector descriptor for copy, tool selection, scopes, and host validation", async () => {
    const manager = await readFile("apps/manager/src/lib/artifact-workbench-routes.ts", "utf8");
    const web = await readFile("apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts", "utf8");
    const consent = await readFile("apps/web/app/agent/[employeeId]/connect/[connector]/page.tsx", "utf8");
    expect(manager).toContain("resolveOwnerManagedConnectorSetup");
    expect(web).toContain("resolveOwnerManagedConnectorSetup");
    expect(consent).toContain("resolveOwnerManagedConnectorSetup");
    expect(web).toContain("allowed_authorization_hosts");
    expect(manager).not.toMatch(/category\s*===\s*["'](?:accounting|communication|money)["']/);
    expect(web).not.toMatch(/category\s*===\s*["'](?:accounting|communication|money)["']/);
  });
});
