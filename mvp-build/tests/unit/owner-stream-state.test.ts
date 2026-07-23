import { describe, expect, it } from "vitest";
import type { ResourcePayload, WorkEventRow } from "../../apps/web/app/agent/[employeeId]/surface-types";
import {
  applyOwnerWorkEvent,
  installOwnerSnapshot,
  protocolAuthority,
  validateScopedFrame,
  type OwnerStreamScope,
} from "../../apps/web/app/agent/[employeeId]/owner-stream-state";

const employeeId = "emp_owner";
const accountId = "acct_owner";
const assignmentId = "asn_owner";
const authorityVersion = "auth-v7";

function event(id: string, createdAt: string): WorkEventRow {
  return {
    id,
    event_type: "work.updated",
    status: "processed",
    created_at: createdAt,
    work_event_descriptor: {
      account_id: accountId,
      employee_id: employeeId,
      source_event_id: id,
      move: "notify",
      title: id,
    },
  };
}

function snapshot(): ResourcePayload {
  return {
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    employee: { id: employeeId, name: "Avery", status: "active" },
    artifacts: [],
    approvals: [{
      id: "apr_2",
      action_key: "send",
      summary: "Approve send",
      risk_level: "high",
      created_at: "2026-07-20T10:00:02.000Z",
    }],
    messages: [],
    connectors: [],
    stripe_invoices: [],
    reminders: [],
    job_commitments: [],
    work_events: [event("evt_1", "2026-07-20T10:00:01.000Z")],
  };
}

function frame(overrides: Record<string, unknown> = {}) {
  return {
    kind: "snapshot",
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    authority_version: authorityVersion,
    cursor: { created_at: "2026-07-20T10:00:02.000Z", id: "apr_2" },
    snapshot: snapshot(),
    ...overrides,
  };
}

function scope(): OwnerStreamScope {
  return {
    account_id: accountId,
    employee_id: employeeId,
    assignment_id: assignmentId,
    authority_version: authorityVersion,
    cursor: { created_at: "2026-07-20T10:00:02.000Z", id: "apr_2" },
  };
}

describe("owner stream state", () => {
  it("installs the validated full snapshot with exact scope and cursor", () => {
    const result = installOwnerSnapshot(frame(), employeeId);
    expect(result).toEqual({ ok: true, snapshot: snapshot(), scope: scope() });
  });

  it.each([
    ["route employee", { employee_id: "emp_other" }],
    ["snapshot account", { snapshot: { ...snapshot(), account_id: "acct_other" } }],
    ["snapshot assignment", { snapshot: { ...snapshot(), assignment_id: "asn_other" } }],
    ["cursor", { cursor: { created_at: "2026-07-20T10:00:01.000Z", id: "evt_1" } }],
  ])("rejects a mismatched %s before state installation", (_label, override) => {
    expect(installOwnerSnapshot(frame(override), employeeId).ok).toBe(false);
  });

  it("accepts only a strictly newer exact-scope work event", () => {
    const current = snapshot();
    const newer = event("evt_3", "2026-07-20T10:00:03.000Z");
    const result = applyOwnerWorkEvent(current, { kind: "work_event", ...scope(), event: newer }, scope());
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.resources.work_events.map((row) => row.id)).toEqual(["evt_3", "evt_1"]);
    expect(result.scope.cursor).toEqual({ created_at: newer.created_at, id: newer.id });
  });

  it("rejects duplicate, stale, reordered, and cross-account deltas without mutation", () => {
    const current = snapshot();
    const duplicate = applyOwnerWorkEvent(current, { kind: "work_event", ...scope(), event: current.work_events[0] }, scope());
    const stale = applyOwnerWorkEvent(current, { kind: "work_event", ...scope(), event: event("evt_0", "2026-07-20T10:00:00.000Z") }, scope());
    const crossAccount = applyOwnerWorkEvent(current, { kind: "work_event", ...scope(), account_id: "acct_other", event: event("evt_3", "2026-07-20T10:00:03.000Z") }, scope());
    expect(duplicate).toEqual({ accepted: false, reason: "duplicate" });
    expect(stale).toEqual({ accepted: false, reason: "stale_or_reordered" });
    expect(crossAccount).toEqual({ accepted: false, reason: "scope_mismatch" });
    expect(current.work_events.map((row) => row.id)).toEqual(["evt_1"]);
  });

  it("binds owner commands and approval decisions to the installed assignment authority", () => {
    expect(protocolAuthority(null)).toBeNull();
    expect(protocolAuthority(scope())).toEqual({
      protocol_assignment_id: assignmentId,
      protocol_authority_version: authorityVersion,
    });
    expect(validateScopedFrame({ kind: "approval_update", ...scope() }, scope(), "approval_update")).toBe(true);
    expect(validateScopedFrame({ kind: "approval_update", ...scope(), authority_version: "stale" }, scope(), "approval_update")).toBe(false);
  });
});
