import type { ResourcePayload, WorkEventRow } from "./surface-types";

export interface OwnerStreamCursor {
  created_at: string;
  id: string;
}

export interface OwnerStreamScope {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  authority_version: string;
  cursor: OwnerStreamCursor;
}

export type SnapshotInstallResult =
  | { ok: true; snapshot: ResourcePayload; scope: OwnerStreamScope }
  | { ok: false; reason: string };

export type WorkEventApplyResult =
  | { accepted: true; resources: ResourcePayload; scope: OwnerStreamScope }
  | { accepted: false; reason: "scope_mismatch" | "invalid_event" | "duplicate" | "stale_or_reordered" };

const ZERO_CURSOR: OwnerStreamCursor = { created_at: "1970-01-01T00:00:00.000Z", id: "" };
const REQUIRED_ARRAYS: Array<keyof ResourcePayload> = [
  "artifacts",
  "approvals",
  "messages",
  "connectors",
  "stripe_invoices",
  "reminders",
  "job_commitments",
  "work_events",
];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cursor(value: unknown): OwnerStreamCursor | null {
  const row = record(value);
  if (!row || !nonempty(row.created_at) || typeof row.id !== "string") return null;
  if (Number.isNaN(Date.parse(row.created_at))) return null;
  return { created_at: row.created_at, id: row.id };
}

function compareCursor(left: OwnerStreamCursor, right: OwnerStreamCursor): number {
  if (left.created_at !== right.created_at) return left.created_at.localeCompare(right.created_at);
  return left.id.localeCompare(right.id);
}

function maxSnapshotCursor(snapshot: ResourcePayload): OwnerStreamCursor {
  const approvals = (snapshot.approvals ?? []).map((approval) => ({
    created_at: approval.created_at ?? "",
    id: approval.id,
  }));
  return [...(snapshot.work_events ?? []), ...approvals].reduce<OwnerStreamCursor>((highest, row) => {
    if (!nonempty(row.created_at) || !nonempty(row.id)) return highest;
    const candidate = { created_at: row.created_at, id: row.id };
    return compareCursor(candidate, highest) > 0 ? candidate : highest;
  }, ZERO_CURSOR);
}

function exactScope(frame: Record<string, unknown>, scope: Omit<OwnerStreamScope, "cursor">): boolean {
  return frame.account_id === scope.account_id
    && frame.employee_id === scope.employee_id
    && frame.assignment_id === scope.assignment_id
    && frame.authority_version === scope.authority_version;
}

function operatingContextMatches(snapshot: ResourcePayload, scope: Omit<OwnerStreamScope, "cursor">): boolean {
  const context = snapshot.operating_state?.context;
  if (!context) return true;
  return context.account_id === scope.account_id
    && context.employee_id === scope.employee_id
    && context.assignment_id === scope.assignment_id;
}

export function installOwnerSnapshot(input: unknown, expectedEmployeeId: string): SnapshotInstallResult {
  const frame = record(input);
  const snapshot = record(frame?.snapshot) as ResourcePayload | null;
  const initialCursor = cursor(frame?.cursor);
  if (!frame || frame.kind !== "snapshot" || !snapshot || !initialCursor) {
    return { ok: false, reason: "snapshot_contract_invalid" };
  }
  if (![frame.account_id, frame.employee_id, frame.assignment_id, frame.authority_version].every(nonempty)) {
    return { ok: false, reason: "snapshot_scope_incomplete" };
  }
  const scope = {
    account_id: frame.account_id as string,
    employee_id: frame.employee_id as string,
    assignment_id: frame.assignment_id as string,
    authority_version: frame.authority_version as string,
  };
  if (scope.employee_id !== expectedEmployeeId) return { ok: false, reason: "snapshot_employee_mismatch" };
  if (snapshot.account_id !== scope.account_id
    || snapshot.employee_id !== scope.employee_id
    || snapshot.assignment_id !== scope.assignment_id
    || (snapshot.employee?.id && snapshot.employee.id !== scope.employee_id)) {
    return { ok: false, reason: "snapshot_scope_mismatch" };
  }
  if (!operatingContextMatches(snapshot, scope)) return { ok: false, reason: "snapshot_context_mismatch" };
  if (REQUIRED_ARRAYS.some((key) => !Array.isArray(snapshot[key]))) {
    return { ok: false, reason: "snapshot_read_model_incomplete" };
  }
  if (compareCursor(initialCursor, maxSnapshotCursor(snapshot)) !== 0) {
    return { ok: false, reason: "snapshot_cursor_mismatch" };
  }
  return { ok: true, snapshot, scope: { ...scope, cursor: initialCursor } };
}

export function validateScopedFrame(input: unknown, scope: OwnerStreamScope, kind?: string): boolean {
  const frame = record(input);
  return Boolean(frame && (!kind || frame.kind === kind) && exactScope(frame, scope));
}

export function applyOwnerWorkEvent(
  current: ResourcePayload,
  input: unknown,
  scope: OwnerStreamScope,
): WorkEventApplyResult {
  const frame = record(input);
  if (!frame || frame.kind !== "work_event" || !exactScope(frame, scope)) {
    return { accepted: false, reason: "scope_mismatch" };
  }
  const event = record(frame.event) as WorkEventRow | null;
  if (!event || !nonempty(event.id) || !nonempty(event.created_at) || Number.isNaN(Date.parse(event.created_at))) {
    return { accepted: false, reason: "invalid_event" };
  }
  const descriptor = event.work_event_descriptor;
  if ((descriptor?.account_id && descriptor.account_id !== scope.account_id)
    || (descriptor?.employee_id && descriptor.employee_id !== scope.employee_id)) {
    return { accepted: false, reason: "scope_mismatch" };
  }
  if (current.work_events.some((row) => row.id === event.id)) {
    return { accepted: false, reason: "duplicate" };
  }
  const nextCursor = { created_at: event.created_at, id: event.id };
  if (compareCursor(nextCursor, scope.cursor) <= 0) {
    return { accepted: false, reason: "stale_or_reordered" };
  }
  return {
    accepted: true,
    resources: {
      ...current,
      work_events: [event, ...current.work_events],
    },
    scope: { ...scope, cursor: nextCursor },
  };
}

export function protocolAuthority(scope: OwnerStreamScope | null): {
  protocol_assignment_id: string;
  protocol_authority_version: string;
} | null {
  if (!scope) return null;
  return {
    protocol_assignment_id: scope.assignment_id,
    protocol_authority_version: scope.authority_version,
  };
}
