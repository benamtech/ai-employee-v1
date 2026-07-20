import { EventEmitter } from "node:events";
import type { WorkProgressState } from "@amtech/shared";

export interface ProgressScope {
  account_id: string;
  employee_id: string;
  assignment_id: string;
}

/**
 * Ephemeral low-latency projection. Durable state remains authoritative on reconnect.
 * Every owner-visible frame is keyed by account, employee, and assignment so a shared
 * employee identity cannot leak activity across assignments.
 */
export interface ProgressEvent {
  kind?: "work_progress" | "assistant_delta" | "run_completed";
  run_id: string;
  verb?: string;
  state?: WorkProgressState;
  message_id?: string;
  sequence?: number;
  delta?: string;
  status?: string;
}

const bus = new EventEmitter();
bus.setMaxListeners(0);

function progressChannel(scope: ProgressScope): string {
  return `progress:${scope.account_id}:${scope.employee_id}:${scope.assignment_id}`;
}

/** Publish only assignment-scoped owner-visible progress. */
export function publishProgress(scope: ProgressScope, event: ProgressEvent): void;
/**
 * Compatibility boundary for legacy producers that do not yet possess assignment
 * authority. Their progress is deliberately not broadcast; durable work remains visible.
 */
export function publishProgress(employeeId: string, event: ProgressEvent): void;
export function publishProgress(scopeOrEmployee: ProgressScope | string, event: ProgressEvent): void {
  if (typeof scopeOrEmployee === "string") return;
  const normalized: ProgressEvent = { ...event, kind: event.kind ?? "work_progress" };
  bus.emit(progressChannel(scopeOrEmployee), normalized);
}

/** Subscribe to one exact owner/employee assignment projection. */
export function subscribeProgress(scope: ProgressScope, handler: (event: ProgressEvent) => void): () => void {
  const channel = progressChannel(scope);
  bus.on(channel, handler);
  return () => { bus.off(channel, handler); };
}

function changeChannel(employeeId: string): string {
  return `change:${employeeId}`;
}

export function signalEmployeeChange(employeeId: string): void {
  bus.emit(changeChannel(employeeId));
}

/** Resolve when durable employee state changes, or after timeout for catch-up polling. */
export function waitForEmployeeChange(employeeId: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const channel = changeChannel(employeeId);
    const onChange = () => { cleanup(); resolve(); };
    const timer = setTimeout(() => { cleanup(); resolve(); }, timeoutMs);
    function cleanup() { bus.off(channel, onChange); clearTimeout(timer); }
    bus.on(channel, onChange);
  });
}
