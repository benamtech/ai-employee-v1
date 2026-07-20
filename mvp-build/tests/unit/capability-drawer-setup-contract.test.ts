import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("CapabilityDrawer connector setup action", () => {
  it("keeps the connection href and label in one null-safe action", async () => {
    const drawer = await readFile("apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx", "utf8");

    expect(drawer).toContain("function capabilitySetupAction");
    expect(drawer).toContain("if (capability.availability !== \"needs_connection\") return null;");
    expect(drawer).toContain("if (!setup) return null;");
    expect(drawer).toContain("setupAction ? <Link href={setupAction.href}>Connect {setupAction.label}</Link> : null");
    expect(drawer).not.toContain("setupHref ? <Link href={setupHref}>Connect {setup.label}</Link>");
  });
});
