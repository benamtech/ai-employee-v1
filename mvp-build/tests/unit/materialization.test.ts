import { describe, expect, it } from "vitest";
import { TOOL_NAMES } from "@amtech/shared";
import type { EmployeeSnapshot } from "../../apps/manager/src/lib/employee-stream";
import { materializeEmployeeSnapshot } from "../../apps/manager/src/lib/materialization";

function snapshot(): EmployeeSnapshot {
  return {
    account_id: "acct_1",
    employee_id: "emp_1",
    employee: { id: "emp_1", name: "Sage", status: "live" },
    runtime_health: { status: "healthy", message: "Employee runtime is reachable." },
    artifacts: [],
    approvals: [{ id: "appr_1", action_key: "send_deposit_invoice", summary: "Send a $500 deposit invoice.", risk_level: "high", refs: { amount_cents: "50000" }, created_at: "2026-07-04T00:00:00Z" }],
    messages: [],
    connectors: [{ id: "conn_1", connector_key: "gmail", provider: "gmail", status: "connected", external_email: "owner@example.com" }],
    stripe_connections: [{ charges_enabled: false }],
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: [{
      id: "evt_1",
      event_type: "manager.tool",
      status: "received",
      created_at: "2026-07-04T00:00:01Z",
      work_event_descriptor: {
        account_id: "acct_1",
        employee_id: "emp_1",
        move: "review",
        title: "Tool result",
        summary: "Prepared a customer-facing send.",
        deliverable: {
          type: "outbound_message",
          title: "Email",
          refs: { approval_id: "appr_1" },
          leaves_business: true,
          acceptance: ["approve", "reject", "respond"],
        },
      },
    }],
  };
}

describe("Phase 4 materialization", () => {
  it("preserves approval gates across native and generic renderer tiers", () => {
    const out = materializeEmployeeSnapshot(snapshot());
    const approval = out.surface_envelopes.find((e) => e.kind === "approval")!;
    const event = out.surface_envelopes.find((e) => e.kind === "work_event")!;
    expect(approval.safety.requires_approval).toBe(true);
    expect(approval.actions?.filter((a) => a.gated).map((a) => a.action)).toEqual(["approve", "reject"]);
    expect(event.safety.requires_approval).toBe(true);
    expect(event.actions?.some((a) => a.action === "approve" && a.gated)).toBe(true);
  });

  it("maps connector and runtime state into capability statuses", () => {
    const out = materializeEmployeeSnapshot(snapshot());
    expect(out.capabilities.find((c) => c.key === "manager_tool:send_email_draft")?.status).toBe("ready");
    expect(out.capabilities.find((c) => c.key === "manager_tool:send_deposit_invoice")?.status).toBe("needs_connection");
    expect(out.abilities.find((a) => a.id === "ability:payments")?.status).toBe("needs_connection");
  });

  it("projects a read-only MCP connector as a direct connector capability", () => {
    const s = snapshot();
    s.connectors.push({
      id: "conn_ref",
      connector_key: "reference_data",
      provider: "readonly_mcp",
      status: "connected",
      external_label: "Reference catalog",
    });
    const out = materializeEmployeeSnapshot(s);
    expect(out.capabilities.find((c) => c.key === "connector:reference_data")).toMatchObject({
      label: "Reference Data",
      category: "research",
      status: "ready",
      trust_level: "connector",
      can_run_now: true,
      sources: ["connector", "policy"],
    });
  });

  it("does not expose raw Manager tool names as owner ability labels", () => {
    const out = materializeEmployeeSnapshot(snapshot());
    const toolNodes = out.capabilities.filter((c) => c.key.startsWith("manager_tool:"));
    expect(toolNodes).toHaveLength(TOOL_NAMES.length);
    expect(toolNodes.every((c) => !c.label.includes("_"))).toBe(true);
    expect(toolNodes.every((c) => c.label !== c.key.replace("manager_tool:", ""))).toBe(true);
  });
});
