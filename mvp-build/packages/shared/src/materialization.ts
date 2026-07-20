import type { AbilitySummary, WorkOutput, WorkTask } from "./resource-payload.js";
import type { WorkAction, WorkResource } from "./preview-links.js";

export type CapabilityStatus =
  | "ready"
  | "needs_connection"
  | "needs_info"
  | "degraded"
  | "policy_gated"
  | "unavailable";

export type CapabilityCategory =
  | "communication"
  | "money"
  | "office"
  | "documents"
  | "automation"
  | "research"
  | "system"
  | "accounting";

export interface RenderHints {
  tier: "native_card" | "mcp_ui" | "generic";
  component?: string;
  priority?: "low" | "normal" | "high";
  body_kind?: WorkResource["body_kind"];
}

export interface SafetyEnvelope {
  trust_level: "native_manager" | "manager_mcp" | "runtime" | "connector" | "derived";
  owner_safe: boolean;
  redacted: boolean;
  requires_approval: boolean;
  leaves_business?: boolean;
  money_involved?: boolean;
}

export interface ProofEnvelope {
  run_id?: string | null;
  parent_run_id?: string | null;
  child_run_id?: string | null;
  delegation_id?: string | null;
  receipt_id?: string | null;
  audit_id?: string | null;
  artifact_id?: string | null;
  approval_id?: string | null;
  inbound_event_id?: string | null;
  preview_link_id?: string | null;
  delivery_decision_id?: string | null;
  source_table?: string;
  source_id?: string;
  source_refs?: string[];
  /** S2/S3 receipt hook: every owner-facing consequential surface resolves through an assignment. */
  assignment_id?: string | null;
}

export interface SurfaceEnvelope {
  id: string;
  account_id: string;
  /** Authoritative assignment scope for owner/session/resource rendering. */
  assignment_id?: string | null;
  employee_id?: string;
  kind:
    | "message"
    | "artifact"
    | "approval"
    | "work_event"
    | "connector"
    | "reminder"
    | "invoice"
    | "runtime_health"
    | "tool_activity"
    | "task"
    | "output";
  title: string;
  summary?: string;
  status?: string;
  created_at?: string | null;
  render_hints: RenderHints;
  safety: SafetyEnvelope;
  proof: ProofEnvelope;
  resource?: WorkResource;
  actions?: WorkAction[];
}

export interface CapabilityGraphNode {
  id: string;
  account_id: string;
  /** Assignment-scoped capability visibility; account_id is compatibility, not authority. */
  assignment_id?: string | null;
  employee_id?: string;
  key: string;
  label: string;
  summary: string;
  category: CapabilityCategory;
  status: CapabilityStatus;
  setup_requirement?: string | null;
  trust_level: SafetyEnvelope["trust_level"];
  can_run_now: boolean;
  sources: Array<"manager_tool" | "manager_mcp" | "hermes" | "connector" | "runtime_health" | "entitlement" | "policy">;
  proof: ProofEnvelope;
}

export interface EmployeeEventStreamEvent {
  id: string;
  employee_id: string;
  account_id: string;
  /** Stream cursor visibility is assignment-scoped; employee/account are not authorization. */
  assignment_id?: string | null;
  created_at: string;
  event_name: string;
  cursor: { created_at: string; id: string };
  envelope?: SurfaceEnvelope;
}

export interface MaterializedWork {
  capabilities: CapabilityGraphNode[];
  surface_envelopes: SurfaceEnvelope[];
  work_resources: WorkResource[];
  work_actions: WorkAction[];
  abilities: AbilitySummary[];
  outputs: WorkOutput[];
  tasks: WorkTask[];
}
