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
import { decideTriage, enqueueRepair, recordBatchCandidate } from "./event-triage.js";
import { routeEmployeeIntent } from "./channel-router.js";
import { wakeEmployeeForDescriptor } from "./wake.js";
import { finishWorkRun, recordMeterEvent, startWorkRun, type WorkRunStatus, type WorkRunTrigger } from "./metering.js";

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
  /** Metering correlation id. When absent, deliverEmployeeEvent starts its own
   *  work_run (Phase 6); ingress passes one down so the whole chain shares an id. */
  run_id?: string | null;
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

  // Metering correlation: reuse the run ingress started, else open one here so
  // direct callers (reminders, daily brief, send_employee_event) are still correlated.
  const ownRun = !params.run_id;
  const runTrigger: WorkRunTrigger = params.actor === "scheduler" ? "scheduled_job" : params.actor === "employee" ? "owner_message" : "system";
  const runId = params.run_id ?? await startWorkRun(db, {
    account_id: params.account_id, employee_id: params.employee_id,
    trigger_type: runTrigger, trigger_ref: idempotencyKey, summary_safe: params.safe_summary,
  });
  const finishOwn = (status: WorkRunStatus) => ownRun ? finishWorkRun(db, runId, status) : Promise.resolve();
  const meterDelivered = (deliveredEventId: string) => recordMeterEvent(db, {
    run_id: runId, account_id: params.account_id, employee_id: params.employee_id,
    category: "manager_tool", provider: source, feature_key: params.event_type,
    quantity: 1, unit: "tool_call", provider_id: params.provider_id ?? null,
    status: "ok", metadata_safe: { event_id: deliveredEventId, routing_mode: routingMode },
  });

  // Dedupe — Pub/Sub and Stripe webhooks are at-least-once.
  const existing = orThrow(
    await db.from("inbound_events").select("id,trace").eq("idempotency_key", idempotencyKey).maybeSingle(),
    "inbound_events.dedupe",
  );
  if (existing) {
    await finishOwn("succeeded");
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
    await finishOwn("failed");
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
    if (ins.conflict) {
      await finishOwn("succeeded");
      return duplicateResult(db, idempotencyKey);
    }
    await finishOwn("succeeded");
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
    const eventId = newId(ID_PREFIX.event);
    const claimed = await insertDedup(
      db.from("inbound_events").insert({
        id: eventId,
        account_id: params.account_id,
        employee_id: params.employee_id,
        source,
        event_type: params.event_type,
        provider_id: params.provider_id ?? null,
        idempotency_key: idempotencyKey,
        normalized_payload: params.normalized_payload ?? {},
        status: "claimed",
        triage_decision: triage,
        routing_mode: routingMode,
        batch_key: batchId,
        run_id: runId,
      }),
      "inbound_events.insert.claimed",
    );
    if (claimed.conflict) {
      await finishOwn("succeeded");
      return duplicateResult(db, idempotencyKey);
    }
    try {
      descriptor = await wakeEmployeeForDescriptor(db, {
        account_id: params.account_id,
        employee_id: params.employee_id,
        source_event_id: eventId,
        event_type: params.event_type,
        provider_id: params.provider_id ?? null,
        safe_summary: params.safe_summary,
        normalized_payload: params.normalized_payload ?? {},
        suggested_next_action: params.suggested_next_action,
        run_id: runId,
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
        inbound_event_id: eventId,
        reason: `wake_employee_failed:${String((err as Error).message ?? err)}`,
      });
      await db.from("inbound_events").update({ status: "repair", trace: { repair_id: repairId } }).eq("id", eventId);
      await finishOwn("failed");
      return { event_id: repairId, message_id: "", delivery_status: "pending", duplicate: false };
    }
    descriptor = await bindApprovalIfNeeded(db, descriptor);
    const normalizedPayload = {
      ...(params.normalized_payload ?? {}),
      work_event_descriptor: descriptor,
    };
    const messageId = newId(ID_PREFIX.message);
    const ownerText = renderWorkEventSms(descriptor);
    await mustWrite(
      db.from("employee_messages").insert({
        id: messageId,
        employee_id: params.employee_id,
        direction: "to_owner",
        source: "employee",
        channel: "web",
        body: ownerText,
        status: "pending",
      }),
      "employee_messages.insert.wake",
    );
    const routed = await routeEmployeeIntent(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      intent_key: idempotencyKey,
      move: descriptor.move,
      text: ownerText,
      descriptor,
      message_id: messageId,
      run_id: runId,
    });
    await mustWrite(
      db
        .from("inbound_events")
        .update({
          normalized_payload: normalizedPayload,
          status: routed.delivery_status === "delivered" ? "delivered" : "received",
          trace: { message_id: messageId, sms_sid: routed.sms_sid ?? null, approval_id: descriptor.deliverable?.refs.approval_id ?? null, run_id: runId },
        })
        .eq("id", eventId),
      "inbound_events.trace_update.wake",
    );
    await meterDelivered(eventId);
    await finishOwn("succeeded");
    await writeAudit(db, {
      account_id: params.account_id,
      employee_id: params.employee_id,
      actor: params.actor,
      action: "event:wake_deliver",
      resource: eventId,
      result: "ok",
      details: { event_type: params.event_type, channel: routed.chosen_channel, delivered: routed.delivery_status === "delivered", has_sms: Boolean(routed.sms_sid) },
    });
    return { event_id: eventId, message_id: messageId, sms_sid: routed.sms_sid, delivery_status: routed.delivery_status === "delivered" ? "delivered" : "pending", duplicate: false };
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
      run_id: runId,
    }),
    "inbound_events.insert",
  );
  if (ins.conflict) {
    await finishOwn("succeeded");
    return duplicateResult(db, idempotencyKey);
  }

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

  const routed = await routeEmployeeIntent(db, {
    account_id: params.account_id,
    employee_id: params.employee_id,
    intent_key: idempotencyKey,
    move: triage === "batch" ? "silent" : (descriptor?.move ?? "notify"),
    text: ownerText,
    descriptor,
    message_id: messageId,
    run_id: runId,
  });
  const smsSid = routed.sms_sid;
  const deliveryStatus = routed.delivery_status === "delivered" ? "delivered" : "pending";

  await mustWrite(
    db
      .from("inbound_events")
      .update({ status: deliveryStatus === "delivered" ? "delivered" : "received", trace: { message_id: messageId, sms_sid: smsSid ?? null, approval_id: descriptor?.deliverable?.refs.approval_id ?? null, run_id: runId } })
      .eq("id", eventId),
    "inbound_events.trace_update",
  );
  await meterDelivered(eventId);
  await finishOwn("succeeded");

  await writeAudit(db, {
    account_id: params.account_id,
    employee_id: params.employee_id,
    actor: params.actor,
    action: "event:deliver",
    resource: eventId,
    result: "ok",
    details: { event_type: params.event_type, channel: routed.chosen_channel, delivered: deliveryStatus === "delivered", has_sms: Boolean(smsSid) },
  });

  return { event_id: eventId, message_id: messageId, sms_sid: smsSid, delivery_status: deliveryStatus, duplicate: false };
}
