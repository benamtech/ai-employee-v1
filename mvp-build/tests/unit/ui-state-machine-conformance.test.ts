import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compileOperatingProjection, type ResourcePayload } from "@amtech/shared";
import {
  applyOwnerWorkEvent,
  installOwnerSnapshot,
} from "../../apps/web/app/agent/[employeeId]/owner-stream-state";

const matrix = JSON.parse(readFileSync(resolve("validation/ui-state-machine-cases.json"), "utf8")) as {
  cases: Array<{ id: string; S: object; A: string[]; O_positive: string[]; O_negative: string[]; D: string; E: string }>;
};

function payload(): ResourcePayload {
  return {
    account_id: "acct_A",
    assignment_id: "asn_A",
    employee_id: "employee_A",
    employee: { id: "employee_A", name: "Avery", status: "live" },
    artifacts: [], approvals: [], messages: [], connectors: [], stripe_invoices: [], reminders: [], job_commitments: [], work_events: [], tasks: [], outputs: [], resurface_items: [], connection_surfaces: [],
  };
}

function snapshotFrame(overrides: Record<string, unknown> = {}) {
  return {
    kind: "snapshot",
    account_id: "acct_A",
    employee_id: "employee_A",
    assignment_id: "asn_A",
    authority_version: "auth_v1",
    cursor: { created_at: "1970-01-01T00:00:00.000Z", id: "" },
    snapshot: payload(),
    ...overrides,
  };
}

describe("Trace009 consequential UI state machine", () => {
  it("declares the complete case oracle shape and every consequential family", () => {
    expect(matrix.cases.length).toBeGreaterThanOrEqual(19);
    for (const entry of matrix.cases) {
      expect(entry.A.length).toBeGreaterThan(0);
      expect(entry.O_positive.length).toBeGreaterThan(0);
      expect(entry.O_negative.length).toBeGreaterThan(0);
      expect(entry.D.length).toBeGreaterThan(0);
      expect(entry.E.length).toBeGreaterThan(0);
    }
    for (const family of ["AUTH", "APPROVAL", "EFFECT", "AMBIGUITY", "RETRY", "RECEIPT", "PROOF", "ISOLATION", "EXPERIMENT"]) {
      expect(matrix.cases.some((entry) => entry.id.startsWith(`${family}-`))).toBe(true);
    }
  });

  it("installs only an exact scoped snapshot before live projection", () => {
    const accepted = installOwnerSnapshot(snapshotFrame(), "employee_A");
    expect(accepted.ok).toBe(true);
    const crossAssignment = installOwnerSnapshot(snapshotFrame({ assignment_id: "asn_B" }), "employee_A");
    expect(crossAssignment).toEqual({ ok: false, reason: "snapshot_scope_mismatch" });
    const wrongEmployee = installOwnerSnapshot(snapshotFrame({ employee_id: "employee_B" }), "employee_A");
    expect(wrongEmployee).toEqual({ ok: false, reason: "snapshot_employee_mismatch" });
  });

  it("rejects cross-scope, duplicate, and reordered work events without advancing durable projection", () => {
    const installed = installOwnerSnapshot(snapshotFrame(), "employee_A");
    if (!installed.ok) throw new Error(installed.reason);
    const event = {
      kind: "work_event",
      account_id: "acct_A",
      employee_id: "employee_A",
      assignment_id: "asn_A",
      authority_version: "auth_v1",
      event: { id: "evt_1", event_type: "work.updated", status: "recorded", created_at: "2026-07-21T10:00:00.000Z" },
    };
    const applied = applyOwnerWorkEvent(installed.snapshot, event, installed.scope);
    expect(applied.accepted).toBe(true);
    if (!applied.accepted) return;
    expect(applyOwnerWorkEvent(applied.resources, event, applied.scope)).toEqual({ accepted: false, reason: "duplicate" });
    expect(applyOwnerWorkEvent(applied.resources, { ...event, event: { ...event.event, id: "evt_0", created_at: "2026-07-21T09:00:00.000Z" } }, applied.scope)).toEqual({ accepted: false, reason: "stale_or_reordered" });
    expect(applyOwnerWorkEvent(applied.resources, { ...event, assignment_id: "asn_B" }, applied.scope)).toEqual({ accepted: false, reason: "scope_mismatch" });
  });

  it("keeps experiment truth and authority fixed while presentation policy varies", () => {
    const source = payload();
    const calm = compileOperatingProjection(source, { evidence_class: "fixture_demonstration", employee_id: "employee_A", generated_at: "2026-07-21T10:00:00.000Z", preferred_density: "calm" });
    const dense = compileOperatingProjection(source, { evidence_class: "fixture_demonstration", employee_id: "employee_A", generated_at: "2026-07-21T10:00:00.000Z", preferred_density: "dense" });
    expect(calm.context.account_id).toBe(dense.context.account_id);
    expect(calm.context.assignment_id).toBe(dense.context.assignment_id);
    expect(calm.context.employee_id).toBe(dense.context.employee_id);
    expect(calm.decisions).toEqual(dense.decisions);
    expect(calm.evidence).toEqual(dense.evidence);
    expect(calm.layout.density).not.toBe(dense.layout.density);
  });
});
