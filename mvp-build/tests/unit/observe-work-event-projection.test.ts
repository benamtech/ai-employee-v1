import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { materializeEmployeeSnapshot } from "../../apps/manager/src/lib/materialization.js";
import type { EmployeeSnapshot } from "../../apps/manager/src/lib/employee-stream.js";

const accountId = "acct_observe_projection";
const employeeId = "emp_observe_projection";
const assignmentId = "asn_observe_projection";

function event(id: string, move: "observe" | "question") {
  return {
    id,
    event_type: move === "observe" ? "inventory.level_changed" : "owner.input_needed",
    provider_id: "provider_fixture",
    status: "delivered",
    created_at: "2026-07-19T08:00:00.000Z",
    work_event_descriptor: {
      account_id: accountId,
      employee_id: employeeId,
      source_event_id: id,
      move,
      title: move === "observe" ? "Inventory level changed" : "Confirm reorder quantity",
      summary: move === "observe"
        ? "A connected system reported a low-risk inventory change."
        : "Owner judgment is required before the purchase plan can continue.",
    },
  };
}

function snapshot(): EmployeeSnapshot {
  return {
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    employee: {
      id: employeeId,
      name: "Avery",
      status: "live",
      profile_id: "profile_fixture",
      web_route: `/agent/${employeeId}`,
      created_at: "2026-07-19T07:00:00.000Z",
    },
    artifacts: [],
    approvals: [],
    messages: [],
    connectors: [],
    stripe_connections: [],
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: [event("evt_observe", "observe"), event("evt_question", "question")],
    abilities: [],
    capabilities: [],
    surface_envelopes: [],
    connection_surfaces: [],
    resurface_items: [],
    outputs: [],
    tasks: [
      {
        id: "work:evt_observe",
        type: "work",
        title: "Inventory level changed",
        status: "in_progress",
        summary: "A connected system reported a low-risk inventory change.",
        created_at: "2026-07-19T08:00:00.000Z",
        target_id: "evt_observe",
      },
      {
        id: "work:evt_question",
        type: "question",
        title: "Confirm reorder quantity",
        status: "needs_you",
        summary: "Owner judgment is required before the purchase plan can continue.",
        created_at: "2026-07-19T08:00:00.000Z",
        target_id: "evt_question",
      },
    ],
    runtime_health: {
      status: "healthy",
      checked_at: "2026-07-19T08:00:00.000Z",
      backend_type: "docker",
      api_ok: true,
      sms_number_present: false,
      message: "Employee runtime is reachable.",
    },
  } as unknown as EmployeeSnapshot;
}

describe("quiet work-event projection", () => {
  it("keeps observe events as evidence without manufacturing active work", () => {
    const input = snapshot();
    const materialized = materializeEmployeeSnapshot(input);

    expect(materialized.tasks.map((task) => task.id)).toEqual(["work:evt_question"]);
    expect(input.tasks?.map((task) => task.id)).toEqual(["work:evt_question"]);
    expect(materialized.surface_envelopes.some((envelope) => envelope.proof.inbound_event_id === "evt_observe")).toBe(true);
  });

  it("bounds owner stream authorization lifetime and disables proxy buffering", async () => {
    const route = await readFile(join(process.cwd(), "apps/web/app/api/employee/[employeeId]/events/route.ts"), "utf8");

    expect(route).toContain("OWNER_STREAM_REAUTH_MS");
    expect(route).toContain("AbortController");
    expect(route).toContain('cache: "no-store"');
    expect(route).toContain('"X-Accel-Buffering": "no"');
  });
});
