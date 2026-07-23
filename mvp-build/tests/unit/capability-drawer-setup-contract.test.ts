import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("CapabilityDrawer connector setup action", () => {
  it("keeps the connection href and label in one null-safe action", async () => {
    const drawer = await readFile("apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx", "utf8");

    expect(drawer).toContain("function capabilitySetupAction");
    expect(drawer).toContain("if (capability.availability !== \"needs_connection\") return null;");
    expect(drawer).toContain("if (!setup) return null;");
    expect(drawer).toContain("setupAction ? <Link href={setupAction.href}>{setupAction.actionLabel}</Link> : null");
    expect(drawer).toContain("actionLabel: setup.self_service ? `Connect ${setup.label}` : `Set up ${setup.label}`");
    expect(drawer).not.toContain("setupHref ? <Link href={setupHref}>Connect {setup.label}</Link>");
  });

  it("delegates connector resolution to the shared manifest instead of provider/category branches", async () => {
    const drawer = await readFile("apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx", "utf8");
    const runtime = await readFile("packages/shared/src/adaptive-connector-runtime.ts", "utf8");

    expect(drawer).toContain("resolveConnectorSetupActionForCapability");
    expect(drawer).toContain("connector_id: capability.connector_id");
    expect(runtime).toContain("resolveManagedSetupForCapability");
    expect(runtime).toContain("const managed = resolveManagedSetupForCapability");
    expect(drawer).not.toContain("capability.tool_name.includes(\"quickbooks\")");
    expect(drawer).not.toContain("capability.tool_name.includes(\"email\")");
  });

  it("normalizes every provider redirect through the Manager setup URL contract", async () => {
    const browserRoute = await readFile("apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts", "utf8");
    const managerRoute = await readFile("apps/manager/src/lib/artifact-workbench-routes.ts", "utf8");

    expect(browserRoute).toContain("resolveOwnerManagedConnectorSetup");
    expect(browserRoute).toContain("providerSetupUrl");
    expect(browserRoute).toContain("managed.allowed_authorization_hosts");
    expect(managerRoute).toContain("setup_url: setupUrl");
    expect(managerRoute).toContain("setup.continuation");
    expect(managerRoute).toContain("caller cannot choose tools, scopes, continuation fields, or redirect hosts");
  });
});
