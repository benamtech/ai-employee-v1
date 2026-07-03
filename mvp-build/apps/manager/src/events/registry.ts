import type { SupabaseClient } from "@amtech/db";

export interface NormalizedEvent {
  account_id?: string | null;
  employee_id?: string | null;
  event_type: string;
  provider_id?: string | null;
  idempotency_key: string;
  normalized_payload: Record<string, unknown>;
  safe_summary: string;
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

registerEventSource({
  source: "manager",
  async verify() { return { ok: true }; },
  async normalize(_db, input) { return input as NormalizedEvent; },
  dedupeKey(event) { return event.idempotency_key; },
});

for (const source of ["gmail", "stripe", "twilio"] as const) {
  registerEventSource({
    source,
    async verify(input) {
      const event = input as Partial<NormalizedEvent>;
      return event.event_type && event.idempotency_key
        ? { ok: true }
        : { ok: false, reason: "normalized_event_required" };
    },
    async normalize(_db, input) { return input as NormalizedEvent; },
    dedupeKey(event) { return event.idempotency_key; },
  });
}
