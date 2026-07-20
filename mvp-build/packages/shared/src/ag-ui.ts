import type { AssignmentScopedWorkStreamEvent, WorkStreamEvent } from "./work-stream.js";

export const AMTECH_AG_UI_PROFILE = "amtech.ag-ui.v1" as const;

interface AgUiBaseEvent {
  type: string;
  timestamp: number;
  sequence: number;
  rawEvent?: never;
  amtech: {
    profile: typeof AMTECH_AG_UI_PROFILE;
    accountId: string;
    employeeId: string;
    assignmentId: string;
    authorityVersion: string;
    projectionOnly: true;
  };
}

export type AmtechAgUiEvent =
  | (AgUiBaseEvent & { type: "RUN_STARTED"; threadId: string; runId: string })
  | (AgUiBaseEvent & { type: "TEXT_MESSAGE_START"; messageId: string; role: "assistant" })
  | (AgUiBaseEvent & { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string })
  | (AgUiBaseEvent & { type: "TEXT_MESSAGE_END"; messageId: string })
  | (AgUiBaseEvent & { type: "RUN_FINISHED"; threadId: string; runId: string; result: Record<string, unknown> })
  | (AgUiBaseEvent & { type: "STATE_SNAPSHOT"; snapshot: unknown })
  | (AgUiBaseEvent & { type: "STATE_DELTA"; delta: Array<{ op: "add" | "replace"; path: string; value: unknown }> })
  | (AgUiBaseEvent & { type: "ACTIVITY_SNAPSHOT"; messageId: string; activityType: "AMTECH_WORK"; content: Record<string, unknown>; replace: true });

export interface AgUiProjectionContext {
  account_id: string;
  employee_id: string;
  assignment_id: string;
  authority_version: string;
  thread_id: string;
  sequence: number;
  timestamp?: number;
}

function base(context: AgUiProjectionContext, offset: number): AgUiBaseEvent {
  return {
    type: "",
    timestamp: context.timestamp ?? Date.now(),
    sequence: context.sequence + offset,
    amtech: {
      profile: AMTECH_AG_UI_PROFILE,
      accountId: context.account_id,
      employeeId: context.employee_id,
      assignmentId: context.assignment_id,
      authorityVersion: context.authority_version,
      projectionOnly: true,
    },
  };
}

/**
 * Convert AMTECH's durable/ephemeral work stream into AG-UI without forwarding raw
 * provider events or accepting AG-UI shared state as durable state. Client actions
 * travel back through a separate Manager command boundary.
 */
export function projectWorkStreamEventToAgUi(
  event: WorkStreamEvent | AssignmentScopedWorkStreamEvent,
  context: AgUiProjectionContext,
): AmtechAgUiEvent[] {
  switch (event.kind) {
    case "snapshot":
      return [{ ...base(context, 0), type: "STATE_SNAPSHOT", snapshot: event.snapshot }];
    case "work_event":
      return [{
        ...base(context, 0),
        type: "STATE_DELTA",
        delta: [{ op: "add", path: `/workEvents/${event.event.id}`, value: event.event }],
      }];
    case "approval_update":
      return [{
        ...base(context, 0),
        type: "STATE_DELTA",
        delta: [{ op: "replace", path: `/approvals/${event.approval_id}/resolution`, value: event.resolution }],
      }];
    case "work_progress":
      return [{
        ...base(context, 0),
        type: "ACTIVITY_SNAPSHOT",
        messageId: `activity:${event.run_id}`,
        activityType: "AMTECH_WORK",
        content: { runId: event.run_id, verb: event.verb, state: event.state },
        replace: true,
      }];
    case "assistant_delta": {
      const events: AmtechAgUiEvent[] = [];
      let offset = 0;
      if (event.sequence === 0) {
        events.push({ ...base(context, offset++), type: "RUN_STARTED", threadId: context.thread_id, runId: event.run_id });
        events.push({ ...base(context, offset++), type: "TEXT_MESSAGE_START", messageId: event.message_id, role: "assistant" });
      }
      events.push({ ...base(context, offset), type: "TEXT_MESSAGE_CONTENT", messageId: event.message_id, delta: event.delta });
      return events;
    }
    case "run_completed":
      return [
        { ...base(context, 0), type: "TEXT_MESSAGE_END", messageId: `assistant:${event.run_id}` },
        {
          ...base(context, 1),
          type: "RUN_FINISHED",
          threadId: context.thread_id,
          runId: event.run_id,
          result: { status: event.status },
        },
      ];
  }
}

export interface AgUiClientCommand {
  profile: typeof AMTECH_AG_UI_PROFILE;
  assignment_id: string;
  authority_version: string;
  resource_type: string;
  resource_id: string;
  action: string;
  idempotency_key: string;
  payload?: Record<string, unknown>;
}

export function validateAgUiClientCommandShape(value: unknown): value is AgUiClientCommand {
  if (!value || typeof value !== "object") return false;
  const command = value as Partial<AgUiClientCommand>;
  return command.profile === AMTECH_AG_UI_PROFILE
    && typeof command.assignment_id === "string"
    && typeof command.authority_version === "string"
    && typeof command.resource_type === "string"
    && typeof command.resource_id === "string"
    && typeof command.action === "string"
    && typeof command.idempotency_key === "string"
    && /^[A-Za-z0-9:_-]{8,160}$/.test(command.idempotency_key);
}
