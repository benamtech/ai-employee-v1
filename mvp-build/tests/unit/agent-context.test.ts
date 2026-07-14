import { describe, expect, it } from "vitest";
import { buildAgentContext, claimAgentContextPrimer, deriveNextAction, estimatedTokens } from "../../apps/manager/src/lib/agent-context";
import { makeFakeDb, SCHEMA_UNIQUES } from "./_helpers/fake-supabase";
import type { EmployeeSnapshot } from "../../apps/manager/src/lib/employee-stream";

const asClient = (db: unknown) => db as import("@amtech/db").SupabaseClient;

const snapshot: EmployeeSnapshot = {
  account_id: "acct_1",
  employee_id: "emp_1",
  employee: { id: "emp_1", name: "Sage", status: "live" },
  artifacts: [],
  approvals: [{ id: "appr_1", action_key: "send_estimate_email", summary: "Send estimate", risk_level: "medium" }],
  messages: [],
  connectors: [],
  stripe_connections: [],
  stripe_invoices: [],
  reminders: [],
  job_commitments: [],
  work_events: [],
  runtime_health: { status: "healthy", message: "Employee runtime is reachable." },
  tasks: [{ id: "task_1", type: "approval", title: "Decision needed", status: "needs_you", target_id: "appr_1" }],
  outputs: [],
  abilities: [],
  capabilities: [],
  surface_envelopes: [],
  connection_surfaces: [{ id: "connection:email", label: "Email", category: "communication", state: "connected", what_employee_can_do: "Draft emails.", capability_keys: [], proof: { source_table: "connector_accounts", source_id: "conn_1" } }],
  resurface_items: [{ id: "resurface:appr_1", kind: "approval", title: "Send estimate", why: "Owner approval needed", status: "needs_you", channel: "both", target: { kind: "approval", id: "appr_1" }, proof: { approval_id: "appr_1" } }],
};

const brain = {
  brain_index: {
    profile_package: "contractor_estimator",
    employee_status: "live",
    context_slots: [{ key: "business_identity", title: "Business identity", fact_count: 3 }],
    native_memory: {
      status: "rendered",
      memory_md: "memories/MEMORY.md",
      user_md: "memories/USER.md",
      generated_path: "/profiles/client_emp_1",
      validation_status: "passed",
    },
    live_state_pointers: ["amtech://manager/work-queue"],
    recall: { session_search: "Use Hermes session_search." },
  },
  resources: {
    brain: "amtech://manager/business-brain",
    facts: "amtech://manager/business-facts",
    connector_status: "amtech://manager/connector-status",
    work_queue: "amtech://manager/work-queue",
    artifacts: "amtech://manager/artifacts",
    approvals: "amtech://manager/approvals",
    capability_registry: "amtech://manager/capability-registry",
    runtime_health: "amtech://manager/runtime-health",
  },
  proof: {
    fact_count: 1,
    connector_count: 1,
    artifact_count: 0,
    open_approval_count: 1,
    work_queue_count: 1,
    capability_count: 0,
  },
};

describe("agent context primer", () => {
  it("is reference-shaped and capped at 2k estimated tokens", () => {
    const text = buildAgentContext({ snapshot, brain });
    expect(estimatedTokens(text)).toBeLessThanOrEqual(2000);
    expect(text).toContain("Business brain index: amtech://manager/business-brain");
    expect(text).toContain("Explicit facts resource: amtech://manager/business-facts");
    expect(text).toContain("Session budget target: stay under 400000 total tokens");
    expect(text).not.toContain("normalized_payload");
    expect(text).not.toContain("sealed:");
  });

  it("adds a CE-3 carryover handoff only when pending", () => {
    const withCarry = buildAgentContext({ snapshot, brain, carryover: { pending: true, last_decision: "Approved deposit invoice", next_action: "Resolve approval send_estimate_email (appr_1)" } });
    expect(withCarry).toContain("Continuing from a rotated session");
    expect(withCarry).toContain("Last decision: Approved deposit invoice");
    expect(withCarry).toContain("Next action: Resolve approval send_estimate_email (appr_1)");

    const noCarry = buildAgentContext({ snapshot, brain, carryover: { pending: false } });
    expect(noCarry).not.toContain("Continuing from a rotated session");
  });
});

describe("deriveNextAction", () => {
  it("prefers the first open approval", () => {
    expect(deriveNextAction(snapshot)).toBe("Resolve approval send_estimate_email (appr_1)");
  });

  it("returns null with nothing pending", () => {
    const empty = { ...snapshot, approvals: [], resurface_items: [], tasks: [] } as EmployeeSnapshot;
    expect(deriveNextAction(empty)).toBeNull();
  });
});

describe("claimAgentContextPrimer (once-per-transcript gate)", () => {
  it("returns 'primed' on first claim for a transcript", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    const r = await claimAgentContextPrimer(asClient(db), { account_id: "acct_1", employee_id: "emp_1", transcript_session_id: "t1" });
    expect(r).toBe("primed");
  });

  it("returns 'already_primed' on a duplicate (PK conflict), not a claim failure", async () => {
    const db = makeFakeDb({}, { uniques: SCHEMA_UNIQUES });
    await claimAgentContextPrimer(asClient(db), { account_id: "acct_1", employee_id: "emp_1", transcript_session_id: "t1" });
    const again = await claimAgentContextPrimer(asClient(db), { account_id: "acct_1", employee_id: "emp_1", transcript_session_id: "t1" });
    expect(again).toBe("already_primed");
  });

  it("distinguishes 'claim_failed' (e.g. unapplied 0029 / non-conflict error) from already_primed", async () => {
    const failing = { from: () => ({ insert: async () => ({ error: { code: "42P01", message: "relation does not exist" } }) }) };
    const r = await claimAgentContextPrimer(asClient(failing), { account_id: "acct_1", employee_id: "emp_1", transcript_session_id: "t1" });
    expect(r).toBe("claim_failed");
  });
});
