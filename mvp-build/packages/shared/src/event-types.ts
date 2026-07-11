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
