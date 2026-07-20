import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const capabilityRegistry = new URL("../../apps/manager/src/lib/capability-registry.ts", import.meta.url);
const toolCatalog = new URL("../../apps/manager/src/lib/tool-capability-catalog.ts", import.meta.url);
const setupManifest = new URL("../../packages/shared/src/connector-setup.ts", import.meta.url);

describe("connector-agnostic capability binding", () => {
  it("uses exact managed-manifest tool ownership instead of category-to-provider branches", async () => {
    const [registry, catalog, manifest] = await Promise.all([
      readFile(capabilityRegistry, "utf8"),
      readFile(toolCatalog, "utf8"),
      readFile(setupManifest, "utf8"),
    ]);

    expect(manifest).toContain("managed_tool_names: ToolName[]");
    expect(manifest).toContain("readiness_source: ManagedConnectorReadinessSource");
    expect(registry).toContain("resolveManagedSetupForCapability({ tool_name: name, category })");
    expect(registry).toContain("managedConnectorStatus(snapshot, setup)");
    expect(catalog).toContain("connectorIdForTool(snapshot, toolName, node.category)");

    // Why: broad domains such as communication/accounting are not provider
    // identities and must never select scopes, credentials, or account rows.
    expect(registry).not.toContain("CONNECTOR_BACKED_CATEGORIES");
    expect(registry).not.toContain('category === "money"');
    expect(catalog).not.toContain('item.provider === "gmail"');
    expect(catalog).not.toContain('item.provider === "quickbooks"');
  });
});
