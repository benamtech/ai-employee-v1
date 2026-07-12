/**
 * Event mesh normalized envelope + required event types.
 * Spec: 03-data-model.md ("Events And Notifications"), 09-event-mesh-v1.md,
 * wiki/product-agent-platform-architecture.md ("The event mesh").
 *
 * Phase 0 defines the contract so later phases (Gmail reply, Stripe webhook)
 * are one more sender on the same rail — no new owner surface. The chosen
 * ingress is the Hermes webhook adapter; Manager owns normalization/dedup/triage.
 */

export type EventSource = "gmail" | "stripe" | "twilio" | "manager" | "quickbooks";

/** Required event types the rail must carry (03-data-model.md). */
export const EVENT_TYPES = {
  gmailReplyReceived: "gmail.reply_received",
  stripeInvoiceSent: "stripe.invoice_sent",
  stripeInvoicePaid: "stripe.invoice_paid",
  managerConnectorConnected: "manager.connector_connected",
  managerConnectorFailed: "manager.connector_failed",
  quickbooksEntityChanged: "quickbooks.entity_changed",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/** Normalized inbound event (one row in `inbound_events`). */
export interface NormalizedEvent {
  source: EventSource;
  event_type: string;
  /** Provider id (Gmail history/message id, Stripe event id, Twilio SID). */
  provider_id: string;
  /** Idempotency key for dedup at the account/business layer. */
  idempotency_key: string;
  /** Compact, structured payload (intelligence is spent at the edge, not here). */
  normalized_payload: Record<string, unknown>;
}

/** Owner-facing channel by importance (SMS default). */
export type NotificationChannel = "sms" | "web" | "voice";
export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = "sms";

/**
 * CE-2 turn routing. Whether a normalized event needs a reasoning turn
 * (`wake_employee`) or can be delivered/rendered/batched without occupying the
 * employee's serialized turn lane (`deliver_only`).
 */
export type RoutingMode = "deliver_only" | "wake_employee";

/**
 * Data-driven routing policy keyed by event type — adding a connector never
 * touches router logic, only this table. Default (below) is `deliver_only`; only
 * owner-actionable / customer-reply events wake the employee. Future wake
 * candidates: inbound customer SMS, a QBO write-needs-decision variant.
 */
export const EVENT_ROUTING_POLICY: Record<string, RoutingMode> = {
  [EVENT_TYPES.gmailReplyReceived]: "wake_employee",
  [EVENT_TYPES.stripeInvoiceSent]: "deliver_only",
  [EVENT_TYPES.stripeInvoicePaid]: "deliver_only",
  [EVENT_TYPES.managerConnectorConnected]: "deliver_only",
  [EVENT_TYPES.managerConnectorFailed]: "deliver_only",
  [EVENT_TYPES.quickbooksEntityChanged]: "deliver_only",
};

/** Route for an event type; unknown/informational events default to deliver_only. */
export function routeForEventType(eventType: string): RoutingMode {
  return EVENT_ROUTING_POLICY[eventType] ?? "deliver_only";
}
