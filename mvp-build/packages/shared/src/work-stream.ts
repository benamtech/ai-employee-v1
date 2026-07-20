/**
 * The Work Surface live-stream vocabulary (Phase 5). A small, AG-UI-shaped event
 * union that the Manager SSE endpoint emits and web/SMS/voice render as thin
 * clients. Intentionally ~5 events, not the full AG-UI 16 — MVP scope, room to
 * grow. Everything owner-facing here is already safe (descriptors + work-verbs);
 * raw provider payloads and tool names never enter these frames.
 */
import type { ResourcePayload, WorkEventRow } from "./resource-payload.js";

export type WorkProgressState = "started" | "step" | "completed";

export interface WorkStreamAssignmentScope {
  assignment_id: string;
  account_id: string;
  employee_id: string;
}

export type WorkStreamEvent =
  /** Full read-model — sent on connect and on reconnect catch-up gaps. */
  | { kind: "snapshot"; snapshot: ResourcePayload }
  /** A newly persisted work event (delta merged by id). */
  | { kind: "work_event"; event: WorkEventRow }
  /** Live "doing it now" — a safe work-verb, never a tool name. */
  | { kind: "work_progress"; run_id: string; verb: string; state: WorkProgressState }
  /** An approval was bound or resolved. */
  | { kind: "approval_update"; approval_id: string; resolution: string | null }
  /** A wake/turn run reached a terminal state. */
  | { kind: "run_completed"; run_id: string; status: string };

export type AssignmentScopedWorkStreamEvent = WorkStreamEvent & WorkStreamAssignmentScope;

/** SSE `event:` name used on the wire for a given stream event. */
export function workStreamEventName(event: WorkStreamEvent): string {
  return event.kind;
}

export function withAssignmentStreamScope(event: WorkStreamEvent, scope: WorkStreamAssignmentScope): AssignmentScopedWorkStreamEvent {
  return { ...event, ...scope };
}
