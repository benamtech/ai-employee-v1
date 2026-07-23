import type { WorkEventDescriptor, WorkMove } from "./work-events.js";

export type EmployeeIntentMove = WorkMove | "silent";
export type DeliveryChannel = "web" | "sms" | "none";

export interface EmployeeIntent {
  account_id: string;
  employee_id: string;
  /** Current assignment scope when already known by the producer. */
  assignment_id?: string | null;
  intent_key: string;
  move: EmployeeIntentMove;
  text: string;
  descriptor?: WorkEventDescriptor;
  message_id?: string;
  /** Metering correlation id threaded through the work chain (Phase 6). */
  run_id?: string | null;
}

export interface DeliveryDecision {
  id: string;
  account_id: string;
  employee_id: string;
  assignment_id?: string | null;
  intent_key: string;
  move: EmployeeIntentMove;
  chosen_channel: DeliveryChannel;
  reason: string;
  proof?: Record<string, unknown>;
  fallback?: Record<string, unknown>;
}
