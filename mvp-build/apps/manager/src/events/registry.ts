import type { SupabaseClient } from "@amtech/db";
import type { WorkEventDescriptor } from "@amtech/shared";

export interface NormalizedEvent {
  account_id?: string | null;
  employee_id?: string | null;
  event_type: string;
  provider_id?: string | null;
  idempotency_key: string;
  normalized_payload: Record<string, unknown>;
  safe_summary: string;
  suggested_next_action?: string;
  triage_hint?: "silent";
  work_event_descriptor?: WorkEventDescriptor;
  routing_mode?: "deliver_only" | "wake_employee";
  channel?: "sms" | "web" | "voice";
}

export interface EventSourceAdapter<T = unknown> {
  source: "gmail" | "stripe" | "twilio" | "manager" | string;
  verify(input: T): Promise<{ ok: true } | { ok: false; reason: string }>;
  normalize(db: SupabaseClient, input: T): Promise<NormalizedEvent | null>;
  dedupeKey(event: NormalizedEvent): string;
}

const adapters = new Map<string, EventSourceAdapter>();

export function registerEventSource(adapter: EventSourceAdapter): void {
  adapters.set(adapter.source, adapter);
}

export function getEventSource(source: string): EventSourceAdapter | undefined {
  return adapters.get(source);
}

export function listEventSources(): string[] {
  return [...adapters.keys()].sort();
}

// The `manager` source adapter is registered once, in ./adapters/manager.ts (strict
// field verification). It is intentionally NOT registered here — a second inline
// registration made behavior depend on import order.
