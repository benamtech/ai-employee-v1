import { describe, it, expect } from "vitest";
import { TOOL_NAMES, TOOL_PHASE } from "../../packages/shared/src/tool-contracts";

// Guarantees the full 04-manager-tools.md surface is declared and phase-mapped.
describe("Manager tool contracts", () => {
  it("declares the complete tool surface", () => {
    // Phase 6 adds repair commands; Phase 5 adds daily brief scheduling.
    expect(TOOL_NAMES.length).toBe(45);
    expect(new Set(TOOL_NAMES).size).toBe(TOOL_NAMES.length); // no dupes
  });

  it("phase-maps every tool", () => {
    for (const name of TOOL_NAMES) {
      expect(TOOL_PHASE[name]).toBeGreaterThanOrEqual(1);
      expect(TOOL_PHASE[name]).toBeLessThanOrEqual(5);
    }
  });

  it("includes the Phase-1 identity + provisioning tools", () => {
    for (const t of [
      "send_phone_verification",
      "check_phone_code",
      "create_account",
      "provision_employee",
      "get_provisioning_status",
    ] as const) {
      expect(TOOL_NAMES).toContain(t);
      expect(TOOL_PHASE[t]).toBe(1);
    }
  });
});
