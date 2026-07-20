import { EventEmitter } from "node:events";
import type { WorkProgressState } from "@amtech/shared";

/**
 * Ephemeral low-latency projection. `kind` is optional at the producer boundary so
 * existing scheduler/wake progress producers remain compatible; publish normalizes
 * them to `work_progress`. Durable state remains authoritative on reconnect.
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

function channel(employeeId: string): string {
  return `progress:${employeeId}`;
}

export function publishProgress(employeeId: string, event: ProgressEvent): void {
  const normalized: ProgressEvent = { ...event, kind: event.kind ?? "work_progress" };
  bus.emit(channel(employeeId), normalized);
}

/** Subscribe to one employee's live projection; returns an unsubscribe function. */
export function subscribeProgress(employeeId: string, handler: (event: ProgressEvent) => void): () => void {
  const ch = channel(employeeId);
  bus.on(ch, handler);
  return () => { bus.off(ch, handler); };
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
    const ch = changeChannel(employeeId);
    const onChange = () => { cleanup(); resolve(); };
    const timer = setTimeout(() => { cleanup(); resolve(); }, timeoutMs);
    function cleanup() { bus.off(ch, onChange); clearTimeout(timer); }
    bus.on(ch, onChange);
  });
}
