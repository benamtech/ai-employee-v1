/**
 * In-process live-progress bus (Phase 5). A wake/turn runs inside a webhook or
 * scheduler handler, decoupled from whatever SSE stream the owner has open. This
 * EventEmitter bridges them: the wake publishes owner-safe work-verbs keyed by
 * employee, and any open Work Surface stream for that employee relays them as
 * `work_progress` frames.
 *
 * Scope: single Manager instance (one VPS) — an EventEmitter does not cross
 * processes. The seam to a Postgres LISTEN/NOTIFY (or Realtime) fan-out is
 * publish/subscribe-shaped here so multi-instance is a drop-in later.
 */
import { EventEmitter } from "node:events";
import type { WorkProgressState } from "@amtech/shared";

export interface ProgressEvent {
  run_id: string;
  verb: string;
  state: WorkProgressState;
}

const bus = new EventEmitter();
bus.setMaxListeners(0); // many concurrent owner streams

function channel(employeeId: string): string {
  return `progress:${employeeId}`;
}

export function publishProgress(employeeId: string, event: ProgressEvent): void {
  bus.emit(channel(employeeId), event);
}

/** Subscribe to an employee's progress; returns an unsubscribe fn. */
export function subscribeProgress(employeeId: string, handler: (e: ProgressEvent) => void): () => void {
  const ch = channel(employeeId);
  bus.on(ch, handler);
  return () => { bus.off(ch, handler); };
}

// ---------------------------------------------------------------------------
// Change signal — the wake side of the Work Surface stream. This is the testable
// realization of the "Supabase Realtime / LISTEN-NOTIFY" decision: an in-process
// NOTIFY. A writer signals after persisting; an open stream loop wakes immediately
// (low latency) and otherwise falls back to a timed re-query. Swap `signal`/`wait`
// for Postgres LISTEN/NOTIFY or Supabase Realtime to go multi-instance.
// ---------------------------------------------------------------------------

function changeChannel(employeeId: string): string {
  return `change:${employeeId}`;
}

export function signalEmployeeChange(employeeId: string): void {
  bus.emit(changeChannel(employeeId));
}

/** Resolve when the employee next changes, or after `timeoutMs` (fallback poll). */
export function waitForEmployeeChange(employeeId: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const ch = changeChannel(employeeId);
    const onChange = () => { cleanup(); resolve(); };
    const timer = setTimeout(() => { cleanup(); resolve(); }, timeoutMs);
    function cleanup() { bus.off(ch, onChange); clearTimeout(timer); }
    bus.on(ch, onChange);
  });
}
