import { describe, expect, it } from "vitest";
import { rotateAtTokens, resolveContextPolicy } from "@amtech/shared";
import { buildAgentContext } from "../../apps/manager/src/lib/agent-context";
import type { EmployeeSnapshot } from "../../apps/manager/src/lib/employee-stream";

const snapshot = {
  account_id: "acct_1",
  employee_id: "emp_1",
  employee: { id: "emp_1", name: "Sage", status: "live" },
  artifacts: [],
  approvals: [],
  messages: [],
  connectors: [],
  stripe_connections: [],
  stripe_invoices: [],
  reminders: [],
  job_commitments: [],
  work_events: [],
  runtime_health: { status: "healthy", message: "ok" },
  tasks: [],
  outputs: [],
  abilities: [],
  capabilities: [],
  surface_envelopes: [],
  connection_surfaces: [],
  resurface_items: [],
} as unknown as EmployeeSnapshot;

const brain = {
  brain_index: { profile_package: "contractor_estimator", employee_status: "live", context_slots: [], native_memory: {}, live_state_pointers: [], recall: {} },
  resources: { brain: "amtech://manager/business-brain", facts: "amtech://manager/business-facts" },
  proof: { fact_count: 0, connector_count: 0, artifact_count: 0, open_approval_count: 0, work_queue_count: 0, capability_count: 0 },
} as unknown as Parameters<typeof buildAgentContext>[0]["brain"];

describe("CE-4 operator-mode / business-type context policy (seam)", () => {
  it("primer with no policy = today's behavior (custody line, no emphasis)", () => {
    const text = buildAgentContext({ snapshot, brain });
    expect(text).toContain("Custody: money and customer-facing actions are prepared for owner approval");
    expect(text).not.toContain("Lead with estimates");
  });

  it("a contractor policy prepends its emphasis line", () => {
    const policy = resolveContextPolicy({ business_type: "painting contractor" });
    const text = buildAgentContext({ snapshot, brain, policy });
    expect(text).toContain("Lead with estimates");
    // custody framing is always present regardless of policy
    expect(text).toContain("Custody: money and customer-facing actions are prepared for owner approval");
  });

  it("owner_plus_secretary adds the owner-approval delegation note", () => {
    const policy = resolveContextPolicy({ business_type: "bookkeeper", operator_mode: "owner_plus_secretary" });
    const text = buildAgentContext({ snapshot, brain, policy });
    expect(text).toMatch(/owner approval/i);
  });

  it("a policy rotate_ratio flows into the rotation trip point", () => {
    const base = rotateAtTokens("claude-opus-4-8"); // default 0.40 of 200k = 80k
    const eager = rotateAtTokens("claude-opus-4-8", 0.25); // policy override rotates earlier
    expect(base).toBe(80_000);
    expect(eager).toBe(50_000);
    expect(eager).toBeLessThan(base);
  });
});
