/**
 * The employee Work Surface read-model. Manager builds it
 * (apps/manager/src/lib/employee-stream.ts `buildEmployeeSnapshot`) and the web
 * surface consumes it. Rendering is descriptor-driven — never raw provider
 * payloads (wiki/MVP/phase-3-generative-ui-reframe.md). Shared so the Manager
 * snapshot builder and the browser agree on one shape.
 */
import type { WorkEventDescriptor } from "./work-events.js";

export interface ArtifactRow {
  id: string;
  kind: string;
  storage_ref?: string | null;
  payload?: { customer_name?: string; job_description?: string; recommended_total?: number };
  created_at: string;
}

export interface ApprovalRow {
  id: string;
  action_key: string;
  summary: string;
  risk_level: string;
  refs?: Record<string, string>;
  expires_at?: string | null;
}

export interface MessageRow {
  id: string;
  direction: string;
  body: string;
  status: string;
  provider_id?: string | null;
  created_at: string;
}

export interface ConnectorRow {
  id: string;
  connector_key: string;
  provider: string;
  status: string;
  external_email?: string | null;
  last_error?: string | null;
}

export interface StripeInvoiceRow {
  id: string;
  estimate_id?: string | null;
  stripe_invoice_id?: string | null;
  deposit_amount?: number | null;
  hosted_invoice_url?: string | null;
  status: string;
}

export interface ReminderRow {
  id: string;
  job_id?: string | null;
  scheduled_at: string;
  channel: string;
  status: string;
  message?: string | null;
  sent_at?: string | null;
  provider_id?: string | null;
}

export interface JobCommitmentRow {
  id: string;
  estimate_id?: string | null;
  customer_ref?: string | null;
  start_at?: string | null;
  start_window?: string | null;
  notes?: string | null;
  source_ref?: string | null;
  created_at: string;
}

export interface WorkEventRow {
  id: string;
  event_type: string;
  provider_id?: string | null;
  status: string;
  work_event_descriptor?: WorkEventDescriptor;
  created_at: string;
}

export interface ResourcePayload {
  account_id: string;
  artifacts: ArtifactRow[];
  approvals: ApprovalRow[];
  messages: MessageRow[];
  connectors: ConnectorRow[];
  stripe_invoices: StripeInvoiceRow[];
  reminders: ReminderRow[];
  job_commitments: JobCommitmentRow[];
  work_events: WorkEventRow[];
}
