/** Event, reminder, entitlement & usage tools.
 *  - send_employee_event (Phase 3+): normalize+deliver a provider event to the owner.
 *  - set_internal_reminder / get_reminders (Phase 5): internal job reminders; Google
 *    Calendar is an offer/fast-follow, not required. SMS is the default channel.
 *  - entitlement/usage: default-allow scaffolding active from Phase 1 — the checks
 *    are wired into the operational tools now so the later paywall flip is config,
 *    not a rewrite.
 *  Spec: 04-manager-tools.md, 09-event-mesh-v1.md. */
import {
  ID_PREFIX,
  REMINDER_ACTION_KEY,
  failed,
  newId,
  ok,
  type DispatchDueRemindersInput,
  type DispatchDailyBriefsInput,
  type GetRemindersInput,
  type SendEmployeeEventInput,
  type SetInternalReminderInput,
  type ToolName,
  type WorkEventDescriptor,
} from "@amtech/shared";
import { stub, type ToolContext, type ToolHandler } from "./types.js";
import { checkFeature, recordUsage } from "../lib/entitlements.js";
import { writeAudit } from "../lib/audit.js";
import { deliverEmployeeEvent } from "../lib/employee-events.js";
import { ingestEvent } from "../events/ingress.js";
import { orThrow, mustWrite } from "../lib/db.js";

/** Input-validation bounds (tools take trusted internal input, but loose values
 *  still flow into delivery routing / persisted columns, so we pin the enums). */
const ALLOWED_CHANNELS = new Set(["sms", "web", "voice"]);
const ALLOWED_ROUTING_MODES = new Set(["deliver_only", "wake_employee"]);
const MAX_SAFE_SUMMARY = 2000;
const DEFAULT_TIMEZONE = "America/New_York";
/** Lookback window for the "deposits paid" line on the daily brief — bounds the
 *  figure to the last day instead of re-summing every historical paid invoice. */
const DAILY_BRIEF_WINDOW_MS = 24 * 60 * 60_000;

async function employeeBelongsToAccount(ctx: ToolContext, account_id: string, employee_id: string): Promise<boolean> {
  // orThrow: a DB fault must NOT be swallowed as `false` (which masquerades as an
  // auth denial). Fail loud instead — the tool boundary turns it into a clean 500.
  const data = orThrow(
    await ctx.db.from("employees").select("id").eq("id", employee_id).eq("account_id", account_id).maybeSingle(),
    "employees.ownership",
  );
  return Boolean(data);
}

/** Account timezone (defaults to ET) — drives owner-facing date/time rendering. */
async function loadAccountTimezone(ctx: ToolContext, accountId: string): Promise<string> {
  const data = orThrow(
    await ctx.db.from("accounts").select("timezone").eq("id", accountId).maybeSingle(),
    "accounts.timezone",
  );
  return (data as { timezone?: string | null } | null)?.timezone ?? DEFAULT_TIMEZONE;
}

/** Render an instant in the owner's timezone — never the server's locale. */
function formatInTimezone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString();
  }
}

/** Local calendar date (YYYY-MM-DD) in the owner's timezone — used as the daily
 *  brief idempotency key so the "day" rolls at local midnight, not UTC midnight. */
function localDateKey(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

const sendEmployeeEvent: ToolHandler = async (ctx, raw) => {
  const input = raw as SendEmployeeEventInput;
  const failValidation = async (reason: string, message: string) => {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null, employee_id: input?.employee_id ?? null, actor: ctx.actor,
      action: "tool:send_employee_event", result: "failed", details: { reason },
    });
    return failed("validation_failed", message, { audit_id });
  };
  if (!input?.account_id || !input?.employee_id || !input?.event_type || !input?.safe_summary) {
    return failValidation("missing_required", "account_id, employee_id, event_type, and safe_summary are required.");
  }
  if (typeof input.event_type !== "string" || input.event_type.length > 120) {
    return failValidation("bad_event_type", "event_type must be a string of at most 120 characters.");
  }
  if (input.safe_summary.length > MAX_SAFE_SUMMARY) {
    return failValidation("summary_too_long", `safe_summary must be at most ${MAX_SAFE_SUMMARY} characters.`);
  }
  if (input.channel && !ALLOWED_CHANNELS.has(input.channel)) {
    return failValidation("bad_channel", "channel must be one of sms, web, voice.");
  }
  if (input.routing_mode && !ALLOWED_ROUTING_MODES.has(input.routing_mode)) {
    return failValidation("bad_routing_mode", "routing_mode must be deliver_only or wake_employee.");
  }

  const entitlement = await checkFeature(ctx.db, { account_id: input.account_id, employee_id: input.employee_id }, "send_employee_event");
  if (entitlement.decision === "deny") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_employee_event", result: "denied", details: { reason: "entitlement_denied", feature_key: entitlement.feature_key },
    });
    return failed("entitlement_denied", "This capability is not enabled for this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:send_employee_event", result: "denied", details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  // Delivery routing resolves the owner phone from the account's verified phone
  // inside deliverEmployeeEvent — we deliberately do NOT forward a caller-supplied
  // owner_phone from normalized_payload, which would let payload content misroute.
  const result = await ingestEvent(ctx.db, {
    source: "manager",
    payload: {
    account_id: input.account_id, employee_id: input.employee_id, event_type: input.event_type,
    provider_id: input.provider_id ?? null, idempotency_key: input.idempotency_key ?? `${input.event_type}:${input.provider_id ?? newId(ID_PREFIX.event)}`,
    normalized_payload: input.normalized_payload ?? {}, work_event_descriptor: input.work_event_descriptor,
    safe_summary: input.safe_summary,
    suggested_next_action: input.suggested_next_action, channel: input.channel,
    routing_mode: input.routing_mode,
    },
  });
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "tool:send_employee_event", resource: result.event_id, result: "ok",
    details: { event_type: input.event_type, channel: input.channel ?? "sms", duplicate: result.duplicate },
  });
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    changed_resources: [`inbound_event:${result.event_id}`, `employee_message:${result.message_id}`],
    proof: { event_id: result.event_id, message_id: result.message_id, sms_sid: result.sms_sid ?? null, delivery_status: result.delivery_status, duplicate: result.duplicate },
    user_facing_summary_hint: input.safe_summary,
    next_suggested_action: input.suggested_next_action ?? "",
    audit_id,
  });
};

const setInternalReminder: ToolHandler = async (ctx, raw) => {
  const input = raw as SetInternalReminderInput;
  const when = input?.scheduled_at ? new Date(input.scheduled_at) : null;
  if (!input?.account_id || !input?.employee_id || !when || Number.isNaN(when.getTime())) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input?.account_id ?? null, employee_id: input?.employee_id ?? null, actor: ctx.actor,
      action: "tool:set_internal_reminder", result: "failed", details: { reason: "validation_failed" },
    });
    return failed("validation_failed", "account_id, employee_id, and a valid scheduled_at are required.", { audit_id });
  }
  if (input.channel && !ALLOWED_CHANNELS.has(input.channel)) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:set_internal_reminder", result: "failed", details: { reason: "bad_channel" },
    });
    return failed("validation_failed", "channel must be one of sms, web, voice.", { audit_id });
  }

  const entitlement = await checkFeature(ctx.db, { account_id: input.account_id, employee_id: input.employee_id }, "set_internal_reminder");
  if (entitlement.decision === "deny") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:set_internal_reminder", result: "denied", details: { reason: "entitlement_denied", feature_key: entitlement.feature_key },
    });
    return failed("entitlement_denied", "This capability is not enabled for this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:set_internal_reminder", result: "denied", details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }

  // Optional owner-confirmation gate (close-the-loop). When an approval_id is given
  // it must be a resolved+approved `set_job_reminder` approval; without one, the
  // reminder is treated as internal/reversible and the employee may set it directly.
  if (input.approval_id) {
    const approvalRaw = orThrow(
      await ctx.db.from("approvals").select("resolution,action_key").eq("id", input.approval_id).eq("account_id", input.account_id).eq("employee_id", input.employee_id).maybeSingle(),
      "approvals.gate",
    );
    const approval = approvalRaw as { resolution: string | null; action_key: string } | null;
    if (!approval || approval.resolution !== "approved" || approval.action_key !== REMINDER_ACTION_KEY) {
      const audit_id = await writeAudit(ctx.db, {
        account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
        action: "tool:set_internal_reminder", result: "denied",
        details: { reason: "approval_not_satisfied", action_key: approval?.action_key ?? null, resolution: approval?.resolution ?? null },
      });
      return failed("unauthorized", "A resolved owner approval is required to set this reminder.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
    }
  }

  // Idempotency: same employee + scheduled time + still-scheduled → reuse. The
  // app-level check below is backstopped by a partial unique index (migration 0009)
  // so a concurrent racer that slips past the check fails its insert rather than
  // creating a duplicate scheduled reminder.
  const dup = orThrow(
    await ctx.db.from("reminders").select("id,job_id").eq("employee_id", input.employee_id).eq("scheduled_at", when.toISOString()).eq("status", "scheduled").maybeSingle(),
    "reminders.idempotency",
  );
  if (dup) {
    const existing = dup as { id: string; job_id: string | null };
    return ok({
      account_id: input.account_id, employee_id: input.employee_id,
      proof: { reminder_id: existing.id, scheduled_at: when.toISOString(), status: "scheduled", job_id: existing.job_id ?? null, idempotent: true },
      user_facing_summary_hint: "Reminder already set for that time.",
      audit_id: null,
    });
  }

  let jobId: string | null = null;
  if (input.job) {
    jobId = newId(ID_PREFIX.jobCommitment);
    await mustWrite(
      ctx.db.from("job_commitments").insert({
        id: jobId, account_id: input.account_id, employee_id: input.employee_id, estimate_id: input.job.estimate_artifact_id ?? null,
        customer_ref: input.job.customer_ref ?? null, start_at: input.job.start_at ?? null,
        start_window: input.job.start_window ?? null, notes: input.job.notes ?? null, source_ref: input.job.source_ref ?? null,
      }),
      "job_commitments.insert",
    );
  }
  const reminderId = newId(ID_PREFIX.reminder);
  await mustWrite(
    ctx.db.from("reminders").insert({
      id: reminderId, account_id: input.account_id, employee_id: input.employee_id, job_id: jobId,
      scheduled_at: when.toISOString(), channel: input.channel ?? "sms", status: "scheduled",
      message: input.message ?? null,
    }),
    "reminders.insert",
  );
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "tool:set_internal_reminder", resource: reminderId, result: "ok",
    details: { scheduled_at: when.toISOString(), channel: input.channel ?? "sms", job_id: jobId },
  });
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    changed_resources: jobId ? [`reminder:${reminderId}`, `job_commitment:${jobId}`] : [`reminder:${reminderId}`],
    proof: { reminder_id: reminderId, scheduled_at: when.toISOString(), status: "scheduled", job_id: jobId },
    user_facing_summary_hint: "Internal reminder set.",
    next_suggested_action: "Offer the owner a Google Calendar connection as a later add-on.",
    audit_id,
  });
};

const getReminders: ToolHandler = async (ctx, raw) => {
  const input = raw as GetRemindersInput;
  if (!input?.account_id || !input?.employee_id) return failed("validation_failed", "account_id and employee_id are required.");
  // Consistent with the other reminder tools: verify ownership at the tool layer
  // even though RLS + the account/employee filters also protect the query.
  if (!(await employeeBelongsToAccount(ctx, input.account_id, input.employee_id))) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
      action: "tool:get_reminders", result: "denied", details: { reason: "employee_account_mismatch" },
    });
    return failed("unauthorized", "Employee does not belong to this account.", { account_id: input.account_id, employee_id: input.employee_id, audit_id });
  }
  let query = ctx.db.from("reminders").select("id,scheduled_at,channel,status,job_id").eq("account_id", input.account_id).eq("employee_id", input.employee_id);
  if (input.status) query = query.eq("status", input.status);
  if (input.upcoming_only) query = query.gte("scheduled_at", new Date().toISOString());
  const data = orThrow(await query.order("scheduled_at", { ascending: true }).limit(50), "reminders.list");
  const reminders = (data ?? []) as Array<{ id: string; scheduled_at: string; channel: string; status: string; job_id: string | null }>;
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id, employee_id: input.employee_id, actor: ctx.actor,
    action: "tool:get_reminders", result: "ok", details: { count: reminders.length },
  });
  return ok({
    account_id: input.account_id, employee_id: input.employee_id,
    proof: { count: reminders.length, next_scheduled_at: reminders[0]?.scheduled_at ?? null, reminders_json: JSON.stringify(reminders) },
    user_facing_summary_hint: reminders.length ? `${reminders.length} reminder(s).` : "No reminders.",
    audit_id,
  });
};

/**
 * Fire due reminders (Phase 5 close-the-loop). Driven by the scheduler — Hermes's
 * cron in prod, `scheduler:tick` in dev — never the owner. Selects `scheduled`
 * reminders whose time has arrived, atomically CLAIMS each one
 * (`scheduled` → `dispatching` via a conditional update), and only the worker that
 * wins the claim delivers it (SMS default + Work Surface card + audit + Twilio
 * MessageSid proof). Idempotent at three layers: the actor guard, the atomic claim,
 * and deliverEmployeeEvent's idempotency key.
 */
const dispatchDueReminders: ToolHandler = async (ctx, raw) => {
  if (ctx.actor !== "scheduler") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: null, actor: ctx.actor,
      action: "tool:dispatch_due_reminders", result: "denied", details: { reason: "scheduler_only" },
    });
    return failed("unauthorized", "Only the scheduler can dispatch reminders.", { audit_id });
  }
  const input = (raw ?? {}) as DispatchDueRemindersInput;
  const nowIso = input.now ?? new Date().toISOString();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  let query = ctx.db
    .from("reminders")
    .select("id,account_id,employee_id,job_id,scheduled_at,channel,message,status")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso);
  if (input.account_id) query = query.eq("account_id", input.account_id);
  if (input.employee_id) query = query.eq("employee_id", input.employee_id);
  const data = orThrow(await query.order("scheduled_at", { ascending: true }).limit(limit), "reminders.due");
  const due = (data ?? []) as Array<{
    id: string; account_id: string; employee_id: string; job_id: string | null;
    scheduled_at: string; channel: string | null; message: string | null;
  }>;

  const tzCache = new Map<string, string>();
  const accountTimezone = async (accountId: string): Promise<string> => {
    const cached = tzCache.get(accountId);
    if (cached) return cached;
    const tz = await loadAccountTimezone(ctx, accountId);
    tzCache.set(accountId, tz);
    return tz;
  };

  const results: Array<{ reminder_id: string; status: "sent" | "failed" | "skipped"; sms_sid: string | null }> = [];
  for (const r of due) {
    // Atomic claim: flip scheduled → dispatching only if still scheduled. The row
    // count tells us whether THIS worker won; a racer that lost gets zero rows.
    const claimed = await mustWrite(
      ctx.db.from("reminders").update({ status: "dispatching" }).eq("id", r.id).eq("status", "scheduled").select("id"),
      "reminders.claim",
    );
    if (!claimed || (claimed as unknown[]).length === 0) {
      results.push({ reminder_id: r.id, status: "skipped", sms_sid: null });
      continue;
    }

    // Owner-facing text: the employee's written message, else derived from the job.
    let text = (r.message ?? "").trim();
    const refs: Record<string, string> = { reminder_id: r.id };
    if (r.job_id) {
      refs.job_commitment_id = r.job_id;
      const jobRaw = orThrow(
        await ctx.db.from("job_commitments").select("estimate_id,customer_ref,start_at,start_window").eq("id", r.job_id).maybeSingle(),
        "job_commitments.lookup",
      );
      const job = jobRaw as { estimate_id: string | null; customer_ref: string | null; start_at: string | null; start_window: string | null } | null;
      if (job) {
        if (job.estimate_id) refs.estimate_artifact_id = job.estimate_id;
        if (job.customer_ref) refs.customer_ref = job.customer_ref;
        if (!text) {
          const tz = await accountTimezone(r.account_id);
          const window = job.start_window ?? (job.start_at ? formatInTimezone(job.start_at, tz) : "the scheduled time");
          const who = job.customer_ref ? ` for ${job.customer_ref}` : "";
          text = `Reminder: the job${who} is set for ${window}.`;
        }
      }
    }
    if (!text) text = "Reminder: you have a scheduled job coming up.";

    const descriptor: WorkEventDescriptor = {
      account_id: r.account_id, employee_id: r.employee_id, source_event_id: r.id,
      move: "notify", title: "Job reminder", summary: text,
      deliverable: { type: "job_folder", title: "Job follow-through", refs, money: { involved: false }, reversible: true, acceptance: ["acknowledge"] },
      proof: { reminder_id: r.id },
    };

    try {
      const res = await deliverEmployeeEvent(ctx.db, {
        account_id: r.account_id, employee_id: r.employee_id, event_type: "manager.reminder_due",
        provider_id: r.id, idempotency_key: `reminder_due:${r.id}`,
        work_event_descriptor: descriptor, safe_summary: text,
        channel: (r.channel as "sms" | "web" | "voice" | undefined) ?? "sms", actor: "manager",
      });
      // SMS may stay pending if Twilio is unconfigured; the owner still sees it on
      // the Work Surface and provider_id captures the SID when live.
      await mustWrite(
        ctx.db.from("reminders").update({ status: "sent", sent_at: nowIso, provider_id: res.sms_sid ?? null }).eq("id", r.id),
        "reminders.mark_sent",
      );
      results.push({ reminder_id: r.id, status: "sent", sms_sid: res.sms_sid ?? null });
    } catch (err) {
      await mustWrite(
        ctx.db.from("reminders").update({ status: "failed", last_error: String((err as Error).message ?? err) }).eq("id", r.id),
        "reminders.mark_failed",
      );
      results.push({ reminder_id: r.id, status: "failed", sms_sid: null });
    }
  }

  const sent = results.filter((x) => x.status === "sent");
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id ?? null, employee_id: input.employee_id ?? null, actor: ctx.actor,
    action: "tool:dispatch_due_reminders", result: "ok", details: { due: due.length, fired: sent.length },
  });
  return ok({
    account_id: input.account_id ?? null, employee_id: input.employee_id ?? null,
    changed_resources: sent.map((x) => `reminder:${x.reminder_id}`),
    proof: { due: due.length, fired: sent.length, results_json: JSON.stringify(results) },
    user_facing_summary_hint: `${sent.length} reminder(s) fired.`,
    audit_id,
  });
};

const dispatchDailyBriefs: ToolHandler = async (ctx, raw) => {
  if (ctx.actor !== "scheduler") {
    const audit_id = await writeAudit(ctx.db, {
      account_id: null, employee_id: null, actor: ctx.actor,
      action: "tool:dispatch_daily_briefs", result: "denied", details: { reason: "scheduler_only" },
    });
    return failed("unauthorized", "Only the scheduler can dispatch daily briefs.", { audit_id });
  }
  const input = (raw ?? {}) as DispatchDailyBriefsInput;
  const nowIso = input.now ?? new Date().toISOString();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const periodStartIso = new Date(Date.parse(nowIso) - DAILY_BRIEF_WINDOW_MS).toISOString();
  let employeeQuery = ctx.db.from("employees").select("id,account_id,status").eq("status", "live");
  if (input.account_id) employeeQuery = employeeQuery.eq("account_id", input.account_id);
  if (input.employee_id) employeeQuery = employeeQuery.eq("id", input.employee_id);
  const employeeData = orThrow(await employeeQuery.limit(limit), "employees.live");
  const employees = (employeeData ?? []) as Array<{ id: string; account_id: string }>;
  const changed: string[] = [];

  for (const emp of employees) {
    const timeZone = await loadAccountTimezone(ctx, emp.account_id);
    const [approvalsRes, remindersRes, connectionsRes] = await Promise.all([
      ctx.db.from("approvals").select("id").eq("account_id", emp.account_id).eq("employee_id", emp.id).is("resolution", null),
      ctx.db.from("reminders").select("id").eq("account_id", emp.account_id).eq("employee_id", emp.id).eq("status", "scheduled").gte("scheduled_at", nowIso),
      ctx.db.from("stripe_connections").select("id").eq("account_id", emp.account_id).eq("employee_id", emp.id),
    ]);
    const approvals = orThrow(approvalsRes, "approvals.pending");
    const reminders = orThrow(remindersRes, "reminders.upcoming");
    const connections = orThrow(connectionsRes, "stripe_connections.list");
    const connectionIds = ((connections ?? []) as Array<{ id: string }>).map((c) => c.id);
    // Window the deposits figure to the brief period (status=paid in the last day)
    // so the brief reflects "today", not every historical paid invoice.
    const invoices = connectionIds.length
      ? orThrow(
        await ctx.db.from("stripe_invoices").select("id,deposit_amount,status,created_at").in("stripe_connection_id", connectionIds).eq("status", "paid").gte("created_at", periodStartIso),
        "stripe_invoices.window",
      )
      : [];
    const pendingApprovals = (approvals as unknown[] | null)?.length ?? 0;
    const upcomingReminders = (reminders as unknown[] | null)?.length ?? 0;
    const paidCents = ((invoices ?? []) as Array<{ deposit_amount?: number | null }>)
      .reduce((sum, i) => sum + Number(i.deposit_amount ?? 0), 0);
    // Clean, owner-facing summary. The "don't interrupt" routing is carried by
    // triage_hint:"silent" below — NOT by a marker smuggled into this string.
    const summary = pendingApprovals || upcomingReminders || paidCents
      ? `${pendingApprovals} item(s) need approval, ${upcomingReminders} reminder(s) are upcoming, and $${(paidCents / 100).toFixed(2)} in deposits is marked paid.`
      : "Nothing needs the owner right now.";
    const briefDate = localDateKey(nowIso, timeZone);
    const descriptor: WorkEventDescriptor = {
      account_id: emp.account_id,
      employee_id: emp.id,
      move: "notify",
      title: "Daily brief",
      summary,
      deliverable: {
        type: "plan",
        title: "Daily brief",
        refs: { generated_at: nowIso, brief_date_local: briefDate, timezone: timeZone },
        money: { involved: false },
        reversible: true,
        acceptance: ["acknowledge"],
      },
      proof: { generated_at: nowIso, brief_date_local: briefDate },
    };
    const res = await deliverEmployeeEvent(ctx.db, {
      account_id: emp.account_id,
      employee_id: emp.id,
      event_type: "manager.daily_brief",
      provider_id: `${emp.id}:${briefDate}`,
      idempotency_key: `daily_brief:${emp.id}:${briefDate}`,
      normalized_payload: { generated_at: nowIso, brief_date_local: briefDate, timezone: timeZone, pending_approvals: pendingApprovals, upcoming_reminders: upcomingReminders, paid_deposit_cents: paidCents },
      work_event_descriptor: descriptor,
      safe_summary: summary,
      channel: "web",
      actor: "manager",
      triage_hint: "silent",
    });
    if (!res.duplicate) changed.push(`inbound_event:${res.event_id}`);
  }
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id ?? null, employee_id: input.employee_id ?? null, actor: ctx.actor,
    action: "tool:dispatch_daily_briefs", result: "ok", details: { employees: employees.length, emitted: changed.length },
  });
  return ok({
    account_id: input.account_id ?? null, employee_id: input.employee_id ?? null,
    changed_resources: changed,
    proof: { employees: employees.length, emitted: changed.length },
    user_facing_summary_hint: `${changed.length} daily brief(s) emitted.`,
    audit_id,
  });
};

const getEntitlements: ToolHandler = async (ctx, raw) => {
  const input = raw as { account_id?: string; employee_id?: string; feature_keys?: string[] };
  const features = input.feature_keys?.length ? input.feature_keys : ["default"];
  const decisions = [];
  for (const feature of features) {
    decisions.push(await checkFeature(ctx.db, {
      account_id: input.account_id ?? ctx.account_id ?? null,
      employee_id: input.employee_id ?? ctx.employee_id ?? null,
    }, feature));
  }
  // Report the REAL aggregate decision, not a hardcoded "allow" — so the proof stays
  // truthful the moment checkFeature starts denying a feature.
  const aggregate: "allow" | "deny" = decisions.every((d) => d.decision === "allow") ? "allow" : "deny";
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id ?? ctx.account_id ?? null,
    employee_id: input.employee_id ?? ctx.employee_id ?? null,
    actor: ctx.actor,
    action: "tool:get_entitlements",
    result: "ok",
    details: { decisions },
  });
  return ok({
    account_id: input.account_id ?? ctx.account_id ?? null,
    employee_id: input.employee_id ?? ctx.employee_id ?? null,
    proof: { decision: aggregate, feature_count: decisions.length, decisions_json: JSON.stringify(decisions) },
    user_facing_summary_hint: aggregate === "allow" ? "MVP entitlements allow this capability." : "One or more features are not entitled.",
    audit_id,
  });
};

const recordUsageTool: ToolHandler = async (ctx, raw) => {
  const input = raw as {
    account_id?: string;
    employee_id?: string;
    feature_key?: string;
    quantity?: number;
    unit?: string;
    metadata?: Record<string, unknown>;
  };
  const quantity = input.quantity ?? 1;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    const audit_id = await writeAudit(ctx.db, {
      account_id: input.account_id ?? ctx.account_id ?? null,
      employee_id: input.employee_id ?? ctx.employee_id ?? null,
      actor: ctx.actor,
      action: "tool:record_usage",
      result: "failed",
      details: { reason: "bad_quantity", feature_key: input.feature_key ?? "unknown" },
    });
    return failed("validation_failed", "quantity must be a positive number.", { audit_id });
  }
  await recordUsage(ctx.db, {
    account_id: input.account_id ?? ctx.account_id ?? null,
    employee_id: input.employee_id ?? ctx.employee_id ?? null,
  }, input.feature_key ?? "unknown", quantity, input.unit, input.metadata ?? {});
  const audit_id = await writeAudit(ctx.db, {
    account_id: input.account_id ?? ctx.account_id ?? null,
    employee_id: input.employee_id ?? ctx.employee_id ?? null,
    actor: ctx.actor,
    action: "tool:record_usage",
    result: "ok",
    details: { feature_key: input.feature_key ?? "unknown", quantity },
  });
  return ok({
    account_id: input.account_id ?? ctx.account_id ?? null,
    employee_id: input.employee_id ?? ctx.employee_id ?? null,
    proof: { usage_recorded: true, quantity },
    audit_id,
  });
};

export const eventTools: Partial<Record<ToolName, ToolHandler>> = {
  send_employee_event: sendEmployeeEvent,
  set_internal_reminder: setInternalReminder,
  get_reminders: getReminders,
  dispatch_due_reminders: dispatchDueReminders,
  dispatch_daily_briefs: dispatchDailyBriefs,
  get_entitlements: getEntitlements,
  record_usage: recordUsageTool,
  request_upgrade: stub("request_upgrade"),
};
