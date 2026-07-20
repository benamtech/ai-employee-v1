/**
 * The Work Surface live-stream vocabulary. Manager emits this transport-neutral,
 * owner-safe union and Web/AG-UI/MCP hosts project it without becoming authority.
 * Raw provider payloads, credentials, tool arguments, and hidden prompts never enter
 * these frames.
 */
import type { ResourcePayload, WorkEventRow } from "./resource-payload.js";

export type WorkProgressState = "started" | "step" | "completed";

export interface WorkStreamCursor {
  created_at: string;
  id: string;
}

export interface WorkStreamAssignmentScope {
  assignment_id: string;
  account_id: string;
  employee_id: string;
  authority_version: string;
}

export type WorkStreamEvent =
  /** Full read-model — sent on connect and on reconnect catch-up gaps. */
  | { kind: "snapshot"; snapshot: ResourcePayload; cursor: WorkStreamCursor }
  /** A newly persisted work event (delta merged only after scope + tuple-cursor validation). */
  | { kind: "work_event"; event: WorkEventRow }
  /** Live "doing it now" — a safe work-verb, never a raw tool name. */
  | { kind: "work_progress"; run_id: string; verb: string; state: WorkProgressState }
  /** First-token streaming from Hermes. Deltas are presentation only. */
  | { kind: "assistant_delta"; run_id: string; message_id: string; sequence: number; delta: string }
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
