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
import type { ResourcePayload, WorkEventRow } from "@amtech/shared";

export type EmployeeSnapshot = ResourcePayload & {
  employee_id: string;
  stripe_connections: Array<Record<string, unknown>>;
};

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

export async function buildEmployeeSnapshot(db: SupabaseClient, employeeId: string, accountId: string): Promise<EmployeeSnapshot> {
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

  return {
    employee_id: employeeId,
    account_id: accountId,
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

  const maxCreated = rows.reduce((max, r) => (r.created_at && r.created_at > max ? r.created_at : max), cursor);
  return { workEvents, approvals, nextCursor: maxCreated };
}
