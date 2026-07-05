/**
 * Connector lifecycle as a first-class work event.
 *
 * A connector action (start OAuth, connected, error) is not a Gmail-only concern
 * and must not be a footer string. It is authored as a typed `WorkEventDescriptor`
 * (deliverable type `external_system_action`) and delivered through the internal
 * event door (`deliverEmployeeEvent`), so it materializes on every surface — web
 * Work Surface card + SMS line — through the one spine, and is reusable by every
 * connector (Gmail today; Stripe, Drive, future connectors unchanged).
 *
 * Realness: emitting a connector event that carries a consent URL is NOT provider
 * acceptance. Only the real OAuth callback + token flips status to "connected".
 * This layer is best-effort visibility: it never breaks the connector action.
 */
import type { SupabaseClient } from "@amtech/db";
import type { WorkEventDescriptor } from "@amtech/shared";
import { deliverEmployeeEvent } from "./employee-events.js";

export type ConnectorStatus = "pending_oauth" | "connected" | "error" | "disconnected";

export interface ConnectorEventParams {
  account_id: string;
  employee_id: string;
  /** Connector provider slug, e.g. "gmail", "stripe", "gdrive". */
  provider: string;
  connector_id: string;
  status: ConnectorStatus;
  /** Only meaningful for pending_oauth; the owner-clickable consent link. */
  consent_url?: string | null;
  run_id?: string | null;
}

const PROVIDER_LABEL: Record<string, string> = {
  gmail: "Gmail",
  stripe: "Stripe",
  gdrive: "Google Drive",
};

function providerLabel(provider: string): string {
  return PROVIDER_LABEL[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Build the typed descriptor for a connector-lifecycle event. Connector-start is
 * ungated (`acknowledge`) — it neither leaves the business nor moves money, so it
 * must NOT trip `workDeliverableNeedsGate`. The consent link rides in
 * `deliverable.refs.consent_url` (the web card) and, for pending, also in
 * `suggested_next_action` (the SMS line).
 */
export function buildConnectorDescriptor(params: ConnectorEventParams): WorkEventDescriptor {
  const name = providerLabel(params.provider);
  const pending = params.status === "pending_oauth";
  const connected = params.status === "connected";

  const refs: Record<string, string> = {
    connector_id: params.connector_id,
    provider: params.provider,
    status: params.status,
  };
  if (params.consent_url) refs.consent_url = params.consent_url;

  const title = connected
    ? `${name} connected`
    : pending
      ? `Connect ${name}`
      : params.status === "error"
        ? `${name} needs attention`
        : `${name} disconnected`;

  const summary = connected
    ? `${name} is connected. I can work in it for you now — nothing customer-facing goes out without your approval.`
    : pending
      ? `${name} isn't connected yet. Authorize access so I can work in it for you — nothing is sent without your approval.`
      : params.status === "error"
        ? `${name} hit a problem and may need reconnecting.`
        : `${name} was disconnected.`;

  const suggested = pending
    ? params.consent_url
      ? `Open the secure link to connect ${name}: ${params.consent_url}`
      : `Open your Work Surface to finish connecting ${name}.`
    : undefined;

  return {
    account_id: params.account_id,
    employee_id: params.employee_id,
    move: pending ? "question" : "notify",
    title,
    summary,
    deliverable: {
      type: "external_system_action",
      title,
      refs,
      leaves_business: false,
      money: { involved: false },
      reversible: true,
      acceptance: ["acknowledge"],
    },
    suggested_next_action: suggested,
    proof: { connector_id: params.connector_id, provider: params.provider, status: params.status },
  };
}

/**
 * Deliver a connector-lifecycle work event through the internal door. Best-effort:
 * swallows its own errors so a visibility failure never fails the connector action.
 * Idempotency is per (provider, status, connector) so we surface exactly one card
 * per lifecycle state instead of spamming on retries.
 */
export async function emitConnectorEvent(db: SupabaseClient, params: ConnectorEventParams): Promise<void> {
  try {
    const descriptor = buildConnectorDescriptor(params);
    await deliverEmployeeEvent(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      event_type: `connector.${params.provider}.${params.status}`,
      provider_id: params.connector_id,
      idempotency_key: `connector.${params.provider}.${params.status}:${params.connector_id}`,
      work_event_descriptor: descriptor,
      safe_summary: descriptor.summary,
      suggested_next_action: descriptor.suggested_next_action,
      channel: "web",
      actor: "manager",
      routing_mode: "deliver_only",
      run_id: params.run_id ?? null,
    });
  } catch {
    // Visibility layer only — the connector row + returned consent_url are the
    // source of truth; never let a delivery hiccup break connect/complete.
  }
}
