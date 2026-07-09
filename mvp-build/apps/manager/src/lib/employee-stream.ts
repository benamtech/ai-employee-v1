/**
 * Work Surface read-model + live deltas (Phase 5). `buildEmployeeSnapshot` is the
 * single source of the owner's snapshot — used by the /resources endpoint (full
 * poll), the SSE stream (initial frame + reconnect catch-up), and tests.
 * `fetchWorkEventsSince` returns only what is new past a cursor so the stream can
 * push deltas instead of re-sending everything.
 *
 * Everything here is descriptor-driven and account-scoped; no raw provider payload
 * reaches the surface.
 */
import type { SupabaseClient } from "@amtech/db";
import type {
  AbilitySummary,
  ResourcePayload,
  RuntimeHealthSummary,
  WorkEventRow,
  WorkOutput,
  WorkTask,
} from "@amtech/shared";

export type EmployeeSnapshot = ResourcePayload & {
  employee_id: string;
  stripe_connections: Array<Record<string, unknown>>;
};

type EmployeeRow = { id: string; name?: string | null; status?: string | null; profile_id?: string | null; web_route?: string | null; created_at?: string | null };
type RuntimeEndpointRow = { id: string; backend_type?: string | null; health?: Record<string, unknown> | null; sms_number_e164?: string | null };
type RuntimeHealthRow = { status?: string | null; checked_at?: string | null; backend_type?: string | null; details?: Record<string, unknown> | null };

function toWorkEvents(inboundEvents: Array<Record<string, unknown>>, employeeId: string, accountId: string): WorkEventRow[] {
  return inboundEvents
    .map((event) => ({
      ...event,
      work_event_descriptor: (event.normalized_payload as { work_event_descriptor?: unknown } | undefined)?.work_event_descriptor,
    }))
    .filter((event: { work_event_descriptor?: unknown }) =>
      (event.work_event_descriptor as { employee_id?: string; account_id?: string } | undefined)?.employee_id === employeeId &&
      (event.work_event_descriptor as { employee_id?: string; account_id?: string } | undefined)?.account_id === accountId,
    ) as unknown as WorkEventRow[];
}

function artifactTitle(row: { kind?: string; payload?: { customer_name?: string; job_description?: string; recommended_total?: number } }): string {
  const kind = row.kind ? row.kind.replace(/_/g, " ") : "Output";
  const customer = row.payload?.customer_name;
  return customer ? `${kind} for ${customer}` : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function runtimeHealthSummary(runtime: RuntimeEndpointRow | null, latest: RuntimeHealthRow | null): RuntimeHealthSummary {
  if (!runtime && !latest) {
    return { status: "unknown", message: "No runtime signal yet." };
  }
  const status = (latest?.status ?? (runtime?.health?.status as string | undefined) ?? "unknown") as RuntimeHealthSummary["status"];
  const apiOk = latest?.details?.api_ok ?? runtime?.health?.api_ok;
  const smsPresent = latest?.details?.sms_number_present ?? Boolean(runtime?.sms_number_e164);
  const message =
    status === "healthy" ? "Employee runtime is reachable." :
      status === "degraded" ? "Employee is reachable with a degraded setup." :
        status === "unhealthy" ? "Employee runtime needs attention." :
          "Runtime health has not been checked yet.";
  return {
    status,
    checked_at: latest?.checked_at ?? (runtime?.health?.checked_at as string | undefined) ?? null,
    backend_type: latest?.backend_type ?? runtime?.backend_type ?? null,
    api_ok: typeof apiOk === "boolean" ? apiOk : null,
    sms_number_present: typeof smsPresent === "boolean" ? smsPresent : null,
    message,
  };
}

function buildOutputs(input: {
  employeeId: string;
  artifacts: EmployeeSnapshot["artifacts"];
  stripeInvoices: EmployeeSnapshot["stripe_invoices"];
  messages: EmployeeSnapshot["messages"];
}): WorkOutput[] {
  const artifactOutputs: WorkOutput[] = input.artifacts.map((a) => ({
    id: `artifact:${a.id}`,
    type: "artifact",
    title: artifactTitle(a),
    status: a.storage_ref ? "ready" : "draft",
    created_at: a.created_at,
    href: `/agent/${input.employeeId}/output/${a.id}`,
    artifact_id: a.id,
    summary: a.payload?.job_description,
  }));
  const invoiceOutputs: WorkOutput[] = input.stripeInvoices.map((inv) => ({
    id: `invoice:${inv.id}`,
    type: "invoice",
    title: inv.deposit_amount ? `Deposit invoice $${(Number(inv.deposit_amount) / 100).toFixed(2)}` : "Deposit invoice",
    status: inv.status,
    href: inv.hosted_invoice_url ?? undefined,
    summary: inv.stripe_invoice_id ? "Stripe invoice is tracked." : undefined,
  }));
  const receiptOutputs: WorkOutput[] = input.messages
    .filter((m) => m.direction === "to_owner" && m.provider_id)
    .slice(-5)
    .map((m) => ({
      id: `message:${m.id}`,
      type: "message",
      title: "Delivered message",
      status: m.status,
      created_at: m.created_at,
      summary: m.body,
    }));
  return [...artifactOutputs, ...invoiceOutputs, ...receiptOutputs];
}

function buildTasks(input: {
  approvals: EmployeeSnapshot["approvals"];
  reminders: EmployeeSnapshot["reminders"];
  jobCommitments: EmployeeSnapshot["job_commitments"];
  workEvents: EmployeeSnapshot["work_events"];
  connectors: EmployeeSnapshot["connectors"];
  runtimeHealth: RuntimeHealthSummary;
}): WorkTask[] {
  const approvalTasks: WorkTask[] = input.approvals.map((a) => ({
    id: `approval:${a.id}`,
    type: "approval",
    title: "Decision needed",
    status: "needs_you",
    summary: a.summary,
    created_at: a.expires_at ?? null,
    target_id: a.id,
  }));
  const eventTasks: WorkTask[] = input.workEvents
    .filter((e) => e.work_event_descriptor?.move && e.work_event_descriptor.move !== "notify")
    .map((e) => ({
      id: `work:${e.id}`,
      type: e.work_event_descriptor?.move === "question" ? "question" : "work",
      title: e.work_event_descriptor?.title ?? e.event_type,
      status: e.work_event_descriptor?.move === "question" ? "needs_you" : "in_progress",
      summary: e.work_event_descriptor?.summary,
      created_at: e.created_at,
      target_id: e.id,
    }));
  const reminderTasks: WorkTask[] = input.reminders.map((r) => ({
    id: `reminder:${r.id}`,
    type: "reminder",
    title: r.message ?? "Scheduled reminder",
    status: r.status === "sent" ? "done" : r.status === "failed" ? "failed" : "scheduled",
    summary: r.scheduled_at ? `Scheduled for ${r.scheduled_at}` : undefined,
    created_at: r.scheduled_at,
    target_id: r.id,
  }));
  const jobTasks: WorkTask[] = input.jobCommitments.map((j) => ({
    id: `job:${j.id}`,
    type: "job",
    title: j.customer_ref ? `Job for ${j.customer_ref}` : "Job commitment",
    status: "scheduled",
    summary: j.notes ?? j.start_window ?? undefined,
    created_at: j.start_at ?? j.created_at,
    target_id: j.id,
  }));
  const connectorTasks: WorkTask[] = input.connectors
    .filter((c) => !["connected", "active", "ok"].includes(String(c.status).toLowerCase()))
    .map((c) => ({
      id: `connector:${c.id}`,
      type: "connector",
      title: `${c.provider} needs attention`,
      status: "blocked",
      summary: c.last_error ?? "Reconnect or test this connection.",
      target_id: c.id,
    }));
  const runtimeTask: WorkTask[] = ["unhealthy", "degraded"].includes(input.runtimeHealth.status)
    ? [{ id: "runtime:health", type: "runtime", title: "Employee runtime needs attention", status: input.runtimeHealth.status === "unhealthy" ? "failed" : "blocked", summary: input.runtimeHealth.message }]
    : [];
  return [...approvalTasks, ...eventTasks, ...runtimeTask, ...connectorTasks, ...reminderTasks, ...jobTasks];
}

function buildAbilities(input: {
  runtimeHealth: RuntimeHealthSummary;
  connectors: EmployeeSnapshot["connectors"];
  stripeConnections: Array<Record<string, unknown>>;
}): AbilitySummary[] {
  const email = input.connectors.find((c) => c.connector_key === "gmail" || c.provider === "gmail");
  const stripe = input.stripeConnections[0] as { charges_enabled?: boolean; onboarding_status?: string } | undefined;
  return [
    {
      id: "ability:estimate",
      label: "Create estimates and documents",
      category: "documents",
      status: input.runtimeHealth.status === "unhealthy" ? "degraded" : "ready",
      summary: "Draft structured estimates, save artifacts, and prepare owner-safe previews.",
      source: "manager",
    },
    {
      id: "ability:email",
      label: "Draft and send email",
      category: "communication",
      status: email?.status === "connected" ? "ready" : "needs_connection",
      summary: email?.status === "connected" ? "Email is connected and customer-facing sends stay approval-gated." : "Connect email before sending customer messages.",
      source: "connector",
    },
    {
      id: "ability:payments",
      label: "Collect deposits",
      category: "money",
      status: stripe?.charges_enabled ? "ready" : "needs_connection",
      summary: stripe?.charges_enabled ? "Stripe deposits can be drafted and sent after approval." : "Connect payments before sending deposit invoices.",
      source: "connector",
    },
    {
      id: "ability:reminders",
      label: "Track follow-ups and reminders",
      category: "automation",
      status: "ready",
      summary: "Schedule internal reminders and surface them in the job timeline.",
      source: "manager",
    },
    {
      id: "ability:broad-work",
      label: "Help with broad business work",
      category: "office",
      status: "policy_gated",
      summary: "The employee should take a real swing at owner work while asking before sending, spending, or changing external systems.",
      source: "policy",
    },
  ];
}

export async function buildEmployeeSnapshot(db: SupabaseClient, employeeId: string, accountId: string): Promise<EmployeeSnapshot> {
  const { data: employeeRaw } = await db
    .from("employees")
    .select("id,name,status,profile_id,web_route,created_at")
    .eq("id", employeeId).eq("account_id", accountId)
    .maybeSingle();
  const employee = (employeeRaw ?? { id: employeeId, name: "Employee", status: "unknown" }) as EmployeeRow;
  const { data: artifacts } = await db
    .from("artifacts")
    .select("id,kind,mime_type,storage_ref,payload,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId)
    .order("created_at", { ascending: false }).limit(10);
  const { data: approvals } = await db
    .from("approvals")
    .select("id,action_key,summary,risk_level,refs,resolution,expires_at,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId)
    .is("resolution", null)
    .order("created_at", { ascending: false }).limit(10);
  const { data: messages } = await db
    .from("employee_messages")
    .select("id,direction,source,channel,body,provider_id,status,created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false }).limit(20);
  const { data: connectors } = await db
    .from("connector_accounts")
    .select("id,connector_key,provider,status,external_email,last_connector_test_at,last_error,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId);
  const { data: stripeConnections } = await db
    .from("stripe_connections")
    .select("id,connected_account_id,onboarding_status,charges_enabled,payouts_enabled,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId);
  const stripeConnectionIds = (stripeConnections ?? []).map((row: { id: string }) => row.id);
  const { data: stripeInvoices } = stripeConnectionIds.length
    ? await db
      .from("stripe_invoices")
      .select("id,stripe_connection_id,estimate_id,stripe_invoice_id,deposit_amount,hosted_invoice_url,invoice_pdf,status,created_at")
      .in("stripe_connection_id", stripeConnectionIds)
      .order("created_at", { ascending: false }).limit(10)
    : { data: [] };
  const { data: reminders } = await db
    .from("reminders")
    .select("id,job_id,scheduled_at,channel,status,message,sent_at,provider_id,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId)
    .order("scheduled_at", { ascending: true }).limit(20);
  const { data: jobCommitments } = await db
    .from("job_commitments")
    .select("id,estimate_id,customer_ref,start_at,start_window,notes,source_ref,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId)
    .order("created_at", { ascending: false }).limit(20);
  const { data: inboundEvents } = await db
    .from("inbound_events")
    .select("id,source,event_type,provider_id,normalized_payload,status,trace,created_at")
    .order("created_at", { ascending: false }).limit(50);
  const { data: runtimeRaw } = await db
    .from("runtime_endpoints")
    .select("id,backend_type,health,sms_number_e164")
    .eq("employee_id", employeeId)
    .maybeSingle();
  const runtime = runtimeRaw as RuntimeEndpointRow | null;
  const { data: latestHealthRaw } = runtime?.id
    ? await db
      .from("runtime_health_checks")
      .select("status,checked_at,backend_type,details")
      .eq("runtime_endpoint_id", runtime.id)
      .order("checked_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const latestHealth = latestHealthRaw as RuntimeHealthRow | null;

  const snapshotBase = {
    employee_id: employeeId,
    account_id: accountId,
    employee: {
      id: employee.id,
      name: employee.name ?? "Employee",
      status: employee.status ?? "unknown",
      profile_id: employee.profile_id ?? null,
      web_route: employee.web_route ?? null,
      created_at: employee.created_at ?? null,
    },
    artifacts: (artifacts ?? []) as EmployeeSnapshot["artifacts"],
    approvals: (approvals ?? []) as EmployeeSnapshot["approvals"],
    messages: ((messages ?? []) as EmployeeSnapshot["messages"]).slice().reverse(),
    connectors: (connectors ?? []) as EmployeeSnapshot["connectors"],
    stripe_connections: (stripeConnections ?? []) as Array<Record<string, unknown>>,
    stripe_invoices: (stripeInvoices ?? []) as EmployeeSnapshot["stripe_invoices"],
    reminders: (reminders ?? []) as EmployeeSnapshot["reminders"],
    job_commitments: (jobCommitments ?? []) as EmployeeSnapshot["job_commitments"],
    work_events: toWorkEvents((inboundEvents ?? []) as Array<Record<string, unknown>>, employeeId, accountId).slice(0, 10),
  };
  const runtime_health = runtimeHealthSummary(runtime, latestHealth);

  return {
    ...snapshotBase,
    runtime_health,
    outputs: buildOutputs({ employeeId, artifacts: snapshotBase.artifacts, stripeInvoices: snapshotBase.stripe_invoices, messages: snapshotBase.messages }),
    tasks: buildTasks({
      approvals: snapshotBase.approvals,
      reminders: snapshotBase.reminders,
      jobCommitments: snapshotBase.job_commitments,
      workEvents: snapshotBase.work_events,
      connectors: snapshotBase.connectors,
      runtimeHealth: runtime_health,
    }),
    abilities: buildAbilities({ runtimeHealth: runtime_health, connectors: snapshotBase.connectors, stripeConnections: snapshotBase.stripe_connections }),
  };
}

export interface WorkEventDelta {
  workEvents: WorkEventRow[];
  approvals: Array<{ id: string; resolution: string | null }>;
  nextCursor: string;
}

/** New work events + approvals created strictly after `cursor` (ISO). Used by the
 *  stream loop to push deltas. */
export async function fetchWorkEventsSince(db: SupabaseClient, employeeId: string, accountId: string, cursor: string): Promise<WorkEventDelta> {
  const { data: inboundEvents } = await db
    .from("inbound_events")
    .select("id,source,event_type,provider_id,normalized_payload,status,trace,created_at")
    .gt("created_at", cursor)
    .order("created_at", { ascending: true }).limit(50);
  const rows = (inboundEvents ?? []) as Array<Record<string, unknown> & { created_at?: string }>;
  const workEvents = toWorkEvents(rows, employeeId, accountId);

  const { data: newApprovals } = await db
    .from("approvals")
    .select("id,resolution,created_at")
    .eq("employee_id", employeeId).eq("account_id", accountId)
    .gt("created_at", cursor)
    .order("created_at", { ascending: true }).limit(20);
  const approvals = ((newApprovals ?? []) as Array<{ id: string; resolution: string | null }>)
    .map((a) => ({ id: a.id, resolution: a.resolution ?? null }));

  const approvalRows = (newApprovals ?? []) as Array<{ created_at?: string }>;
  const maxCreated = [...rows, ...approvalRows].reduce((max, r) => (r.created_at && r.created_at > max ? r.created_at : max), cursor);
  return { workEvents, approvals, nextCursor: maxCreated };
}
