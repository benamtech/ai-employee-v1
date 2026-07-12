import { describe, expect, it } from "vitest";
import {
  connectorAllowsDirectMcp,
  custodyFor,
  knownConnectors,
  renderableDirectMcpConnectors,
  resolveConnectorMeta,
  resolveContextPolicy,
} from "@amtech/shared";

describe("CE-4 connector registry", () => {
  it("resolves the real connectors by provider or connector_key hints", () => {
    expect(resolveConnectorMeta("gmail").key).toBe("gmail");
    expect(resolveConnectorMeta("email").key).toBe("gmail");
    expect(resolveConnectorMeta("stripe").category).toBe("money");
    expect(resolveConnectorMeta("quickbooks").category).toBe("accounting");
    expect(resolveConnectorMeta("qbo").key).toBe("quickbooks");
    expect(resolveConnectorMeta("readonly_mcp").key).toBe("reference_data");
  });

  it("all shipped write/money/customer-facing connectors are Manager-mediated", () => {
    for (const c of knownConnectors().filter((x) => x.writes || x.money || x.customer_facing)) {
      expect(custodyFor(c)).toBe("manager_mediated");
      expect(connectorAllowsDirectMcp(c)).toBe(false);
    }
  });

  it("a declared read-only connector is allowed direct-MCP from metadata", () => {
    const meta = resolveConnectorMeta("readonly_mcp");
    expect(meta.known).toBe(true);
    expect(meta.writes).toBe(false);
    expect(custodyFor(meta)).toBe("direct_mcp");
    expect(connectorAllowsDirectMcp(meta)).toBe(true);
  });

  it("an unknown connector is representable and DEFAULT-DENY (manager_mediated)", () => {
    const meta = resolveConnectorMeta("acme_widgets_mcp");
    expect(meta.known).toBe(false);
    expect(meta.category).toBe("system");
    expect(custodyFor(meta)).toBe("manager_mediated");
    expect(connectorAllowsDirectMcp(meta)).toBe(false);
  });

  it("a read-only connector (no writes/money/customer) is allowed direct-MCP", () => {
    const readonly = { writes: false, money: false, customer_facing: false };
    expect(custodyFor(readonly)).toBe("direct_mcp");
    expect(connectorAllowsDirectMcp(readonly)).toBe(true);
  });

  it("custody is derived, not asserted: any risk axis forces manager_mediated", () => {
    expect(custodyFor({ writes: true, money: false, customer_facing: false })).toBe("manager_mediated");
    expect(custodyFor({ writes: false, money: true, customer_facing: false })).toBe("manager_mediated");
    expect(custodyFor({ writes: false, money: false, customer_facing: true })).toBe("manager_mediated");
  });

  it("render-time direct MCP filtering only keeps read-only specs", () => {
    expect(renderableDirectMcpConnectors([
      { name: "catalog", url: "http://catalog.test/mcp" },
      { name: "stripe_direct", url: "http://stripe.test/mcp", money: true },
      { name: "mailer", url: "http://mail.test/mcp", customer_facing: true },
      { name: "writer", url: "http://writer.test/mcp", writes: true },
    ])).toEqual([{ name: "catalog", url: "http://catalog.test/mcp" }]);
  });

  it("empty/nullish input still resolves to a safe generic meta", () => {
    const meta = resolveConnectorMeta("");
    expect(meta.known).toBe(false);
    expect(custodyFor(meta)).toBe("manager_mediated");
    expect(resolveConnectorMeta(null).known).toBe(false);
  });

  it("context policy is a seam with today's defaults, tuned by business + operator", () => {
    const base = resolveContextPolicy({});
    expect(base.business_type).toBe("generic");
    expect(base.operator_mode).toBe("solo_owner");
    expect(base.rotate_ratio).toBeUndefined(); // rotateAtTokens' 0.40 default holds

    const contractor = resolveContextPolicy({ business_type: "painting contractor" });
    expect(contractor.business_type).toBe("contractor");
    expect(contractor.primer_emphasis).toMatch(/estimate/i);

    const delegated = resolveContextPolicy({ business_type: "bookkeeper", operator_mode: "owner_plus_secretary" });
    expect(delegated.operator_mode).toBe("owner_plus_secretary");
    expect(delegated.primer_emphasis).toMatch(/owner approval/i);
  });
});
