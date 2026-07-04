/** Phase 6 repair tools. Operator-only surface for replay, relink, duplicate,
 * redelivery, source suppression, and Stripe onboarding-link regeneration. */
import {
  ID_PREFIX,
  failed,
  newId,
  ok,
  type MarkEventDuplicateInput,
  type RedeliverEmployeeEventInput,
  type RegenerateStripeOnboardingLinkInput,
  type RelinkEmailThreadInput,
  type ReplayGmailHistoryRangeInput,
  type ReplayStripeEventInput,
  type SuppressEventSourceInput,
  type ToolName,
  type WorkEventDescriptor,
} from "@amtech/shared";
import { writeAudit } from "../lib/audit.js";
import { deliverEmployeeEvent } from "../lib/employee-events.js";
import { recordAndProcessStripeEvent, type StripeEvent } from "../webhooks/stripe.js";
import { gmailTools } from "./gmail.stub.js";
import { stripeTools } from "./stripe.stub.js";
import type { ToolContext, ToolHandler } from "./types.js";

function stripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing.");
  if (key.startsWith("sk_live_") && process.env.STRIPE_ALLOW_LIVE !== "true") throw new Error("stripe_live_mode_disabled");
  return key;
}

async function fetchStripeEvent(stripeEventId: string): Promise<StripeEvent> {
  const res = await fetch(`https://api.stripe.com/v1/events/${encodeURIComponent(stripeEventId)}`, {
    headers: { Authorization: `Bearer ${stripeKey()}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? `stripe_${res.status}`);
  return json as StripeEvent;
}

const replayGmailHistoryRange: ToolHandler = async (ctx, raw) => {
  const input = raw as ReplayGmailHistoryRangeInput;
  if (!input?.account_id || !input?.employee_id || !input?.connector_id || !input?.start_history_id) {
    return failed("validation_failed", "account_id, employee_id, connector_id, and start_history_id are required.");
  }
  const handler = gmailTools.sync_gmail_history;
  if (!handler) return failed("provider_error", "Gmail history sync unavailable.");
  const res = await handler(ctx, {
    account_id: input.account_id,
    employee_id: input.employee_id,
    connector_id: input.connector_id,
    start_history_id: input.start_history_id,
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "repair:replay_gmail_history_range", result: res.status === "ok" ? "ok" : "failed",
    details: { connector_id: input.connector_id, start_history_id: input.start_history_id, end_history_id: input.end_history_id ?? null },
  });
  return res.status === "ok" ? { ...res, audit_id } : res;
};

const replayStripeEvent: ToolHandler = async (ctx, raw) => {
  const input = raw as ReplayStripeEventInput;
  if (!input?.stripe_event_id) return failed("validation_failed", "stripe_event_id is required.");
  try {
    const event = await fetchStripeEvent(input.stripe_event_id);
    if (Boolean(event.livemode) && process.env.STRIPE_ALLOW_LIVE !== "true") {
      return failed("unauthorized", "Live Stripe event replay is disabled.");
    }
    const result = await recordAndProcessStripeEvent(ctx.db, event);
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: null, actor: ctx.actor,
      action: "repair:replay_stripe_event", resource: input.stripe_event_id, result: "ok",
      details: { stripe_event_id: input.stripe_event_id, normalized_type: result.normalized_type, duplicate: result.duplicate, delivered: result.delivered },
    });
    return ok({
      account_id: null, employee_id: null,
      changed_resources: result.stored_id ? [`stripe_webhook_event:${result.stored_id}`] : [],
      proof: { stripe_event_id: input.stripe_event_id, normalized_type: result.normalized_type, duplicate: result.duplicate, delivered: result.delivered },
      user_facing_summary_hint: "Stripe event replay processed.",
      audit_id,
    });
  } catch (err) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: null, actor: ctx.actor,
      action: "repair:replay_stripe_event", resource: input.stripe_event_id, result: "failed",
      details: { reason: "stripe_replay_failed", message: String((err as Error).message ?? err) },
    });
    return failed("provider_error", "Stripe event replay failed.", { audit_id });
  }
};

const relinkEmailThread: ToolHandler = async (ctx, raw) => {
  const input = raw as RelinkEmailThreadInput;
  if (!input?.account_id || !input?.employee_id || !input?.gmail_thread_id || !input?.estimate_artifact_id) {
    return failed("validation_failed", "account_id, employee_id, gmail_thread_id, and estimate_artifact_id are required.");
  }
  const { data: connector } = await ctx.db.from("connector_accounts").select("id").eq("account_id", input.account_id).eq("employee_id", input.employee_id).eq("connector_key", "email").maybeSingle();
  if (!connector) return failed("validation_failed", "Gmail connector not found.", { account_id: input.account_id, employee_id: input.employee_id });
  await ctx.db.from("email_threads").upsert({
    id: newId(ID_PREFIX.emailThread),
    connector_id: (connector as { id: string }).id,
    gmail_thread_id: input.gmail_thread_id,
    customer_email: input.customer_email ?? null,
    estimate_artifact_id: input.estimate_artifact_id,
  }, { onConflict: "connector_id,gmail_thread_id" });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "repair:relink_email_thread", resource: input.gmail_thread_id, result: "ok",
    details: { estimate_artifact_id: input.estimate_artifact_id },
  });
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    changed_resources: [`email_thread:${input.gmail_thread_id}`],
    proof: { gmail_thread_id: input.gmail_thread_id, estimate_artifact_id: input.estimate_artifact_id },
    user_facing_summary_hint: "Email thread relinked.",
    audit_id,
  });
};

const markEventDuplicate: ToolHandler = async (ctx, raw) => {
  const input = raw as MarkEventDuplicateInput;
  if (!input?.event_id) return failed("validation_failed", "event_id is required.");
  const trace = { duplicate_of_event_id: input.duplicate_of_event_id ?? null, reason: input.reason ?? "operator_marked_duplicate" };
  const updateRes = await ctx.db.from("inbound_events").update({ status: "duplicate", trace }).eq("id", input.event_id) as { data?: unknown[] | null };
  const changed = Array.isArray(updateRes.data) && updateRes.data.length > 0;
  if (!changed) return failed("validation_failed", "Event not found.", { proof: { event_id: input.event_id } });
  const audit_id = await writeAudit(ctx.db, {
    account_id: null, employee_id: null, actor: ctx.actor,
    action: "repair:mark_event_duplicate", resource: input.event_id, result: "ok", details: trace,
  });
  return ok({
    account_id: null, employee_id: null,
    changed_resources: [`inbound_event:${input.event_id}`],
    proof: { event_id: input.event_id, duplicate: true },
    user_facing_summary_hint: "Event marked duplicate.",
    audit_id,
  });
};

const redeliverEmployeeEvent: ToolHandler = async (ctx, raw) => {
  const input = raw as RedeliverEmployeeEventInput;
  if (!input?.event_id) return failed("validation_failed", "event_id is required.");
  const { data: eventRaw } = await ctx.db.from("inbound_events").select("*").eq("id", input.event_id).maybeSingle();
  const event = eventRaw as {
    id: string; account_id?: string | null; employee_id?: string | null; event_type: string; provider_id?: string | null;
    normalized_payload?: Record<string, unknown>; source?: string;
  } | null;
  const descriptor = event?.normalized_payload?.work_event_descriptor as WorkEventDescriptor | undefined;
  if (!event?.account_id || !event.employee_id) return failed("validation_failed", "Event does not have account/employee context.", { proof: { event_id: input.event_id } });
  const suffix = Date.now().toString(36);
  const res = await deliverEmployeeEvent(ctx.db, {
    account_id: event.account_id,
    employee_id: event.employee_id,
    event_type: `${event.event_type}.redelivered`,
    provider_id: event.provider_id ?? event.id,
    idempotency_key: `redeliver:${event.id}#${suffix}`,
    normalized_payload: event.normalized_payload ?? {},
    work_event_descriptor: descriptor,
    safe_summary: descriptor?.summary ?? "Re-delivered employee event.",
    channel: input.channel ?? "sms",
    actor: ctx.actor,
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: event.account_id, employee_id: event.employee_id, actor: ctx.actor,
    action: "repair:redeliver_employee_event", resource: input.event_id, result: "ok",
    details: { redelivered_event_id: res.event_id, duplicate: res.duplicate },
  });
  return ok({
    account_id: event.account_id, employee_id: event.employee_id,
    changed_resources: [`inbound_event:${res.event_id}`, `employee_message:${res.message_id}`],
    proof: { original_event_id: input.event_id, redelivered_event_id: res.event_id, message_id: res.message_id, duplicate: res.duplicate },
    user_facing_summary_hint: "Employee event redelivered.",
    audit_id,
  });
};

const suppressEventSource: ToolHandler = async (ctx, raw) => {
  const input = raw as SuppressEventSourceInput;
  if (!input?.source || !input?.reason) return failed("validation_failed", "source and reason are required.");
  const id = newId(ID_PREFIX.repairQueue);
  await ctx.db.from("event_source_suppressions").insert({
    id,
    account_id: input.account_id ?? null,
    source: input.source,
    event_type: input.event_type ?? null,
    reason: input.reason,
    expires_at: input.expires_at ?? null,
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id ?? null, employee_id: null, actor: ctx.actor,
    action: "repair:suppress_event_source", resource: id, result: "ok",
    details: { source: input.source, event_type: input.event_type ?? null, expires_at: input.expires_at ?? null },
  });
  return ok({
    account_id: input.account_id ?? null, employee_id: null,
    changed_resources: [`event_source_suppression:${id}`],
    proof: { suppression_id: id, source: input.source, event_type: input.event_type ?? null },
    user_facing_summary_hint: "Event source suppressed.",
    audit_id,
  });
};

const regenerateStripeOnboardingLink: ToolHandler = async (ctx, raw) => {
  const input = raw as RegenerateStripeOnboardingLinkInput;
  const handler = stripeTools.create_stripe_account_link;
  if (!handler) return failed("provider_error", "Stripe account-link tool unavailable.");
  const res = await handler(ctx, input);
  const audit_id = await writeAudit(ctx.db, {
    account_id: input?.account_id ?? null, employee_id: input?.employee_id ?? null, actor: ctx.actor,
    action: "repair:regenerate_stripe_onboarding_link", resource: input?.stripe_connection_id, result: res.status === "ok" ? "ok" : "failed",
    details: { stripe_connection_id: input?.stripe_connection_id },
  });
  return res.status === "ok" ? { ...res, audit_id } : res;
};

export const repairTools: Partial<Record<ToolName, ToolHandler>> = {
  replay_gmail_history_range: replayGmailHistoryRange,
  replay_stripe_event: replayStripeEvent,
  relink_email_thread: relinkEmailThread,
  mark_event_duplicate: markEventDuplicate,
  redeliver_employee_event: redeliverEmployeeEvent,
  suppress_event_source: suppressEventSource,
  regenerate_stripe_onboarding_link: regenerateStripeOnboardingLink,
};
