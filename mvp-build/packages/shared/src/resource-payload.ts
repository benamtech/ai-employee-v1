/**
 * The employee Work Surface read-model. Manager builds it
 * (apps/manager/src/lib/employee-stream.ts `buildEmployeeSnapshot`) and the web
 * surface consumes it. Rendering is descriptor-driven — never raw provider
 * payloads (wiki/MVP/phase-3-generative-ui-reframe.md). Shared so the Manager
 * snapshot builder and the browser agree on one shape.
 */
import type { WorkEventDescriptor } from "./work-events.js";
import type { CapabilityCategory, CapabilityGraphNode, ProofEnvelope, SurfaceEnvelope } from "./materialization.js";

export interface ArtifactRow {
  id: string;
  kind: string;
  mime_type?: string | null;
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
  created_at?: string | null;
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
  external_label?: string | null;
  last_connector_test_at?: string | null;
  last_error?: string | null;
  created_at?: string | null;
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

export interface EmployeeSummary {
  id: string;
  name: string;
  status: string;
  profile_id?: string | null;
  web_route?: string | null;
  created_at?: string | null;
}

export interface RuntimeHealthSummary {
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  checked_at?: string | null;
  backend_type?: string | null;
  api_ok?: boolean | null;
  sms_number_present?: boolean | null;
  message: string;
}

export interface AbilitySummary {
  id: string;
  label: string;
  category: "communication" | "money" | "office" | "documents" | "automation" | "research" | "system" | "accounting";
  status: "ready" | "needs_connection" | "degraded" | "policy_gated" | "unavailable";
  summary: string;
  source: "manager" | "connector" | "runtime" | "profile" | "policy";
}

export interface WorkOutput {
  id: string;
  type: "artifact" | "invoice" | "message" | "generic";
  title: string;
  status: string;
  created_at?: string | null;
  href?: string;
  artifact_id?: string;
  summary?: string;
}

export interface WorkTask {
  id: string;
  type: "approval" | "question" | "reminder" | "job" | "connector" | "runtime" | "work";
  title: string;
  status: "needs_you" | "in_progress" | "blocked" | "done" | "failed" | "scheduled";
  summary?: string;
  created_at?: string | null;
  target_id?: string;
}

export type ConnectionSurfaceState = "not_connected" | "needs_you" | "connected" | "working";

export interface ConnectionSurface {
  id: string;
  label: string;
  category: CapabilityCategory | "calendar" | "store" | "custom";
  state: ConnectionSurfaceState;
  account_label?: string | null;
  health?: string | null;
  last_event?: string | null;
  last_action?: string | null;
  what_employee_can_do: string;
  setup_requirement?: string | null;
  connector_id?: string | null;
  capability_keys: string[];
  proof: ProofEnvelope;
}

export interface ResurfaceItem {
  id: string;
  kind: "approval" | "question" | "review" | "failure" | "reminder" | "connector" | "runtime" | "work";
  title: string;
  why: string;
  status: "needs_you" | "blocked" | "failed" | "scheduled" | "waiting";
  resurface_at?: string | null;
  channel: "web" | "sms" | "both" | "admin";
  source_envelope_id?: string | null;
  target?: { kind: "approval" | "work_event" | "task" | "connection" | "connector" | "ability" | "message" | "job" | "output"; id: string } | null;
  proof: ProofEnvelope;
}

export interface ResourcePayload {
  account_id: string;
  employee_id?: string;
  employee?: EmployeeSummary;
  runtime_health?: RuntimeHealthSummary | null;
  artifacts: ArtifactRow[];
  approvals: ApprovalRow[];
  messages: MessageRow[];
  connectors: ConnectorRow[];
  stripe_invoices: StripeInvoiceRow[];
  reminders: ReminderRow[];
  job_commitments: JobCommitmentRow[];
  work_events: WorkEventRow[];
  abilities?: AbilitySummary[];
  capabilities?: CapabilityGraphNode[];
  surface_envelopes?: SurfaceEnvelope[];
  connection_surfaces?: ConnectionSurface[];
  resurface_items?: ResurfaceItem[];
  outputs?: WorkOutput[];
  tasks?: WorkTask[];
}
