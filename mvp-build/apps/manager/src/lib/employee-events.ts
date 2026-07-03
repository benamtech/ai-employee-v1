/**
 * Employee event delivery (09-event-mesh-v1.md, product-agent-platform-architecture
 * "The event mesh"). Real provider events (Gmail reply, Stripe invoice) are
 * normalized by Manager, then handed to the employee as a STRUCTURED fact — the
 * employee writes the owner-facing message in its own voice. This module owns the
 * shared delivery primitive used by send_employee_event, the Gmail reply pipeline,
 * and the Stripe webhook pipeline.
 *
 * Delivery rules: dedupe by idempotency key; persist a normalized `inbound_events`
 * row + a `to_owner` `employee_messages` row; SMS is the default important-event
 * channel. The runtime hop (employee phrasing) and SMS transport are env-gated so
 * the primitive is deterministic and testable; both leave provider proof when live.
 */
import { ID_PREFIX, assertWorkEventDescriptor, newId, renderWorkEventSms, workDeliverableNeedsGate, type EventSource, type WorkEventDescriptor } from "@amtech/shared";
import type { SupabaseClient } from "@amtech/db";
import { writeAudit } from "./audit.js";
import { orThrow, mustWrite, insertDedup } from "./db.js";
import { sendSms } from "./twilio.js";
import { decideTriage, enqueueRepair, recordBatchCandidate } from "./event-triage.js";
import { wakeEmployeeForEvent } from "./runtime.js";

export interface DeliverEmployeeEventParams {
  account_id: string;
  employee_id: string;
  event_type: string;
  provider_id?: string | null;
  idempotency_key?: string | null;
  normalized_payload?: Record<string, unknown>;
  work_event_descriptor?: WorkEventDescriptor;
  /** Safe, owner-facing summary — never raw email/payment body. */
  safe_summary: string;
  suggested_next_action?: string;
  channel?: "sms" | "web" | "voice";
  /** When set + Twilio configured, the owner is texted (proof = MessageSid). */
  owner_phone?: string | null;
  actor: "front_door" | "employee" | "manager" | "owner" | "scheduler";
  routing_mode?: "deliver_only" | "wake_employee";
  /** "silent" routes to the batch surface without interrupting the owner — passed
   *  through to triage instead of being smuggled into safe_summary as `[SILENT]`. */
  triage_hint?: "silent";
}

export interface DeliverEmployeeEventResult {
  event_id: string;
  message_id: string;
  sms_sid?: string;
  delivery_status: "pending" | "delivered" | "duplicate";
  duplicate: boolean;
}

function eventSource(eventType: string): EventSource {
  if (eventType.startsWith("gmail")) return "gmail";
  if (eventType.startsWith("stripe")) return "stripe";
  if (eventType.startsWith("twilio")) return "twilio";
  return "manager";
}

async function loadOwnerPhone(db: SupabaseClient, accountId: string): Promise<string | null> {
  const data = orThrow(
    await db.from("verified_phones").select("phone_e164").eq("account_id", accountId).order("verified_at", { ascending: false }).limit(1).maybeSingle(),
    "verified_phones.lookup",
  );
  return (data as { phone_e164?: string } | null)?.phone_e164 ?? null;
}

async function loadRuntimeApiUrl(db: SupabaseClient, employeeId: string): Promise<string | null> {
  const data = orThrow(
    await db.from("runtime_endpoints").select("webchat_api_url").eq("employee_id", employeeId).maybeSingle(),
    "runtime_endpoints.lookup",
  );
  return (data as { webchat_api_url?: string | null } | null)?.webchat_api_url ?? null;
}

function approvalActionKey(descriptor: WorkEventDescriptor): string {
  const refs = descriptor.deliverable?.refs ?? {};
  if (refs.action_key) return refs.action_key;
  if (descriptor.deliverable?.type === "outbound_message") return "send_email";
  if (descriptor.deliverable?.type === "money_movement") return "send_deposit_invoice";
  if (descriptor.deliverable?.type === "schedule_mutation" || descriptor.deliverable?.type === "job_folder") return "set_job_reminder";
  return "external_system_action";
}

async function bindApprovalIfNeeded(db: SupabaseClient, descriptor: WorkEventDescriptor): Promise<WorkEventDescriptor> {
  const d = descriptor.deliverable;
  if (!d || !workDeliverableNeedsGate(d)) return descriptor;
  if (!d.acceptance.includes("approve")) return descriptor;
  if (d.refs.approval_id) return descriptor;

  const approvalId = newId(ID_PREFIX.approval);
  await mustWrite(
    db.from("approvals").insert({
      id: approvalId,
      account_id: descriptor.account_id,
      employee_id: descriptor.employee_id,
      action_key: approvalActionKey(descriptor),
      summary: descriptor.suggested_next_action ? `${descriptor.summary} ${descriptor.suggested_next_action}` : descriptor.summary,
      risk_level: d.money?.involved || d.leaves_business ? "high" : "medium",
      refs: { ...d.refs, source_event_id: descriptor.source_event_id ?? "" },
      channel: "web",
      expires_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    }),
    "approvals.insert",
  );

  return {
    ...descriptor,
    deliverable: {
      ...d,
      refs: { ...d.refs, approval_id: approvalId, action_key: approvalActionKey(descriptor) },
    },
  };
}

/** Build the duplicate result for an idempotency key whose row already exists —
 *  used both by the pre-check and by the 23505 backstop when an insert loses the race. */
async function duplicateResult(
  db: SupabaseClient,
  idempotencyKey: string,
): Promise<DeliverEmployeeEventResult> {
  const existing = orThrow(
    await db.from("inbound_events").select("id,trace").eq("idempotency_key", idempotencyKey).maybeSingle(),
    "inbound_events.dedupe.conflict",
  );
  return {
    event_id: existing?.id ?? "",
    message_id: (existing?.trace as { message_id?: string })?.message_id ?? "",
    delivery_status: "duplicate",
    duplicate: true,
  };
}

export async function deliverEmployeeEvent(
  db: SupabaseClient,
  params: DeliverEmployeeEventParams,
): Promise<DeliverEmployeeEventResult> {
  const idempotencyKey =
    params.idempotency_key ?? `${params.event_type}:${params.provider_id ?? newId(ID_PREFIX.event)}`;
  const source = eventSource(params.event_type);
  const routingMode = params.routing_mode ?? "deliver_only";

  // Dedupe — Pub/Sub and Stripe webhooks are at-least-once.
  const existing = orThrow(
    await db.from("inbound_events").select("id,trace").eq("idempotency_key", idempotencyKey).maybeSingle(),
    "inbound_events.dedupe",
  );
  if (existing) {
    return {
      event_id: existing.id,
      message_id: (existing.trace as { message_id?: string })?.message_id ?? "",
      delivery_status: "duplicate",
      duplicate: true,
    };
  }

  const triage = await decideTriage(db, {
    account_id: params.account_id,
    employee_id: params.employee_id,
    source,
    event_type: params.event_type,
    provider_id: params.provider_id ?? null,
    normalized_payload: params.normalized_payload ?? {},
    safe_summary: params.safe_summary,
    triage_hint: params.triage_hint,
  });

  let descriptor = params.work_event_descriptor
    ? assertWorkEventDescriptor(params.work_event_descriptor)
    : undefined;
  if (triage === "repair") {
    const repairId = await enqueueRepair(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      source,
      event_type: params.event_type,
      provider_id: params.provider_id ?? null,
      normalized_payload: params.normalized_payload ?? {},
      safe_summary: params.safe_summary,
      reason: "triage_repair",
    });
    return { event_id: repairId, message_id: "", delivery_status: "pending", duplicate: false };
  }
  if (triage === "ignore") {
    const eventId = newId(ID_PREFIX.event);
    const ins = await insertDedup(
      db.from("inbound_events").insert({
        id: eventId,
        account_id: params.account_id,
        employee_id: params.employee_id,
        source,
        event_type: params.event_type,
        provider_id: params.provider_id ?? null,
        idempotency_key: idempotencyKey,
        normalized_payload: params.normalized_payload ?? {},
        status: "suppressed",
        triage_decision: triage,
        routing_mode: routingMode,
      }),
      "inbound_events.insert.suppressed",
    );
    if (ins.conflict) return duplicateResult(db, idempotencyKey);
    return { event_id: eventId, message_id: "", delivery_status: "pending", duplicate: false };
  }
  const batchId = triage === "batch"
    ? await recordBatchCandidate(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      source,
      event_type: params.event_type,
      provider_id: params.provider_id ?? null,
      normalized_payload: params.normalized_payload ?? {},
      safe_summary: params.safe_summary,
    })
    : null;

  if (routingMode === "wake_employee") {
    try {
      const apiUrl = await loadRuntimeApiUrl(db, params.employee_id);
      descriptor = await wakeEmployeeForEvent(apiUrl ?? "", {
        account_id: params.account_id,
        employee_id: params.employee_id,
        event_type: params.event_type,
        provider_id: params.provider_id ?? null,
        safe_summary: params.safe_summary,
        normalized_payload: params.normalized_payload ?? {},
        suggested_next_action: params.suggested_next_action,
      });
    } catch (err) {
      const repairId = await enqueueRepair(db, {
        account_id: params.account_id,
        employee_id: params.employee_id,
        source,
        event_type: params.event_type,
        provider_id: params.provider_id ?? null,
        normalized_payload: params.normalized_payload ?? {},
        safe_summary: params.safe_summary,
        reason: `wake_employee_failed:${String((err as Error).message ?? err)}`,
      });
      if (!descriptor) return { event_id: repairId, message_id: "", delivery_status: "pending", duplicate: false };
    }
  }
  if (descriptor) descriptor = await bindApprovalIfNeeded(db, descriptor);
  const normalizedPayload = {
    ...(params.normalized_payload ?? {}),
    ...(descriptor ? { work_event_descriptor: descriptor } : {}),
  };

  const eventId = newId(ID_PREFIX.event);
  // Race backstop: a concurrent at-least-once delivery may have slipped past the
  // pre-check dedupe above. The inbound_events idempotency_key unique index (0010)
  // makes the loser fail here; treat that as a duplicate and return before sending a
  // second owner notification. (Eliminating a redundant wake under this race is the
  // Phase 4 atomic-claim-before-wake seam.)
  const ins = await insertDedup(
    db.from("inbound_events").insert({
      id: eventId,
      account_id: params.account_id,
      employee_id: params.employee_id,
      source,
      event_type: params.event_type,
      provider_id: params.provider_id ?? null,
      idempotency_key: idempotencyKey,
      normalized_payload: normalizedPayload,
      status: "received",
      triage_decision: triage,
      routing_mode: routingMode,
      batch_key: batchId,
    }),
    "inbound_events.insert",
  );
  if (ins.conflict) return duplicateResult(db, idempotencyKey);

  const messageId = newId(ID_PREFIX.message);
  const ownerText = descriptor
    ? renderWorkEventSms(descriptor)
    : params.suggested_next_action
      ? `${params.safe_summary} ${params.suggested_next_action}`
      : params.safe_summary;
  const channel = params.channel ?? "sms";
  await mustWrite(
    db.from("employee_messages").insert({
      id: messageId,
      employee_id: params.employee_id,
      direction: "to_owner",
      source: "employee",
      channel,
      body: ownerText,
      status: "pending",
    }),
    "employee_messages.insert",
  );

  // Env-gated SMS transport (default important-event channel). Routing is anchored
  // to the account's verified phone — never a caller-supplied payload field — and
  // only falls back to params.owner_phone when no verified phone exists yet.
  let smsSid: string | undefined;
  let deliveryStatus: "pending" | "delivered" = "pending";
  const ownerPhone = (await loadOwnerPhone(db, params.account_id)) ?? params.owner_phone ?? null;
  if (ownerPhone && (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.EMPLOYEE_SMS_FROM)) {
    try {
      const res = await sendSms({ to: ownerPhone, from: process.env.EMPLOYEE_SMS_FROM, body: ownerText });
      smsSid = res.sid;
      deliveryStatus = "delivered";
      await db.from("employee_messages").update({ status: "delivered", provider_id: smsSid }).eq("id", messageId);
    } catch {
      // Stay pending; the owner can still see it on the web surface. Do not throw.
      deliveryStatus = "pending";
    }
  }

  await mustWrite(
    db
      .from("inbound_events")
      .update({ status: deliveryStatus === "delivered" ? "delivered" : "received", trace: { message_id: messageId, sms_sid: smsSid ?? null, approval_id: descriptor?.deliverable?.refs.approval_id ?? null } })
      .eq("id", eventId),
    "inbound_events.trace_update",
  );

  await writeAudit(db, {
    account_id: params.account_id,
    employee_id: params.employee_id,
    actor: params.actor,
    action: "event:deliver",
    resource: eventId,
    result: "ok",
    details: { event_type: params.event_type, channel, delivered: deliveryStatus === "delivered", has_sms: Boolean(smsSid) },
  });

  return { event_id: eventId, message_id: messageId, sms_sid: smsSid, delivery_status: deliveryStatus, duplicate: false };
}
