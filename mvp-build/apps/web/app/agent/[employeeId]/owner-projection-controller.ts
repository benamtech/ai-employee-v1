import {
  installOwnerSnapshot,
  validateScopedFrame,
  type OwnerStreamScope,
} from "./owner-stream-state";
import type { ResourcePayload } from "./surface-types";

export type OwnerProjectionState = "connecting" | "live" | "reconnecting" | "offline";
export type OwnerProjectionEventKind =
  | "assistant_delta"
  | "work_progress"
  | "run_completed"
  | "work_event"
  | "approval_update";

export interface OwnerProjectionControllerOptions {
  employeeId: string;
  eventKinds: readonly OwnerProjectionEventKind[];
  onState: (state: OwnerProjectionState) => void;
  onSnapshot: (snapshot: ResourcePayload, scope: OwnerStreamScope) => void;
  onEvent: (kind: OwnerProjectionEventKind, payload: Record<string, unknown>, scope: OwnerStreamScope) => void;
  onDenied: (reason: string) => void;
  initialReconnectDelayMs?: number;
  maximumReconnectDelayMs?: number;
}

/**
 * The single owner-stream projection controller. Talk and Workspace may render
 * different presentation policies, but they share snapshot installation, exact
 * scope validation, reconnect behavior, and the rule that reconnect never
 * replays owner intent.
 */
export function openOwnerProjectionController(options: OwnerProjectionControllerOptions): () => void {
  let source: EventSource | null = null;
  let scope: OwnerStreamScope | null = null;
  let closed = false;
  let reconnectTimer: number | null = null;
  let reconnectDelay = options.initialReconnectDelayMs ?? 500;
  const maximumReconnectDelay = options.maximumReconnectDelayMs ?? 15_000;

  function deny(reason: string) {
    source?.close();
    source = null;
    scope = null;
    options.onState("offline");
    options.onDenied(reason);
  }

  function consume(kind: OwnerProjectionEventKind, event: Event) {
    try {
      const payload = JSON.parse((event as MessageEvent).data) as Record<string, unknown>;
      if (!scope || !validateScopedFrame(payload, scope, kind)) {
        deny(`${kind}_scope_mismatch`);
        return;
      }
      options.onEvent(kind, payload, scope);
    } catch {
      deny(`${kind}_parse_failed`);
    }
  }

  function connect() {
    if (closed) return;
    scope = null;
    options.onState(source ? "reconnecting" : "connecting");
    source?.close();
    source = new EventSource(`/api/employee/${options.employeeId}/events`);
    source.addEventListener("open", () => {
      reconnectDelay = options.initialReconnectDelayMs ?? 500;
    });
    source.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        const installed = installOwnerSnapshot(payload, options.employeeId);
        if (!installed.ok) {
          deny(installed.reason);
          return;
        }
        scope = installed.scope;
        options.onSnapshot(installed.snapshot, installed.scope);
        options.onState("live");
      } catch {
        deny("snapshot_parse_failed");
      }
    });
    for (const kind of options.eventKinds) {
      source.addEventListener(kind, (event) => consume(kind, event));
    }
    source.onerror = () => {
      source?.close();
      source = null;
      scope = null;
      if (closed) return;
      options.onState("reconnecting");
      reconnectTimer = window.setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, maximumReconnectDelay);
    };
  }

  connect();
  return () => {
    closed = true;
    scope = null;
    source?.close();
    source = null;
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
  };
}
