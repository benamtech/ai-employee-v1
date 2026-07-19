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

  it("projects Manager-compiled generated UI into a durable approval resource", async () => {
    const input = snapshot();
    input.work_events.push({
      id: "evt_generated",
      event_type: "proposal.ready",
      provider_id: "provider_fixture",
      status: "delivered",
      created_at: "2026-07-19T08:01:00.000Z",
      work_event_descriptor: {
        account_id: accountId,
        employee_id: employeeId,
        source_event_id: "evt_generated",
        move: "review",
        title: "Send customer proposal",
        summary: "A customer-facing proposal is ready for owner review.",
        deliverable: {
          type: "outbound_message",
          title: "Customer proposal",
          refs: { approval_id: "apr_generated" },
          leaves_business: true,
          acceptance: ["approve", "reject", "respond"],
          ui_resource: {
            type: "resource",
            resource: {
              uri: "ui://amtech/outbound_message/apr_generated",
              mimeType: "text/html",
              text: "<!doctype html><html><body><button data-intent='accept'>Approve</button></body></html>",
            },
          },
        },
      },
    });

    const materialized = materializeEmployeeSnapshot(input);
    const envelope = materialized.surface_envelopes.find((candidate) => candidate.proof.inbound_event_id === "evt_generated");
    expect(envelope?.render_hints.tier).toBe("mcp_ui");
    expect(envelope?.assignment_id).toBe(assignmentId);
    expect(envelope?.resource?.assignment_id).toBe(assignmentId);
    expect(envelope?.resource?.resource_type).toBe("approval");
    expect(envelope?.resource?.resource_id).toBe("apr_generated");
    expect(envelope?.resource?.ui_resource?.resource.uri).toBe("ui://amtech/outbound_message/apr_generated");
    expect(envelope?.resource?.actions.map((action) => action.action)).toEqual(["approve", "reject", "respond"]);

    const renderer = await readFile(join(process.cwd(), "apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx"), "utf8");
    expect(renderer).toContain("resource.ui_resource");
    expect(renderer).toContain("<McpUiResource");
    expect(renderer).toContain('candidate.action === action');
    expect(renderer).toContain('intent === "accept" || intent === "accept_all"');
  });

  it("does not expose terminal approval controls without a durable approval id", () => {
    const input = snapshot();
    input.work_events.push({
      id: "evt_unscoped_gate",
      event_type: "proposal.unscoped",
      provider_id: "provider_fixture",
      status: "delivered",
      created_at: "2026-07-19T08:02:00.000Z",
      work_event_descriptor: {
        account_id: accountId,
        employee_id: employeeId,
        source_event_id: "evt_unscoped_gate",
        move: "review",
        title: "Unscoped proposal",
        summary: "The descriptor claims a consequential action but has no durable approval.",
        deliverable: {
          type: "outbound_message",
          title: "Unscoped proposal",
          refs: {},
          leaves_business: true,
          acceptance: ["approve", "reject", "respond"],
        },
      },
    });

    const materialized = materializeEmployeeSnapshot(input);
    const envelope = materialized.surface_envelopes.find((candidate) => candidate.proof.inbound_event_id === "evt_unscoped_gate");
    expect(envelope?.resource?.resource_type).toBe("work_event");
    expect(envelope?.resource?.actions.map((action) => action.action)).toEqual(["respond"]);
  });

  it("bounds owner stream authorization lifetime and disables proxy buffering", async () => {
    const route = await readFile(join(process.cwd(), "apps/web/app/api/employee/[employeeId]/events/route.ts"), "utf8");

    expect(route).toContain("OWNER_STREAM_REAUTH_MS");
    expect(route).toContain("AbortController");
    expect(route).toContain('cache: "no-store"');
    expect(route).toContain('"X-AMTECH-Owner-Session": token');
    expect(route).toContain('"X-Accel-Buffering": "no"');
    expect(route).not.toContain("owner_session_token=");
  });
});
