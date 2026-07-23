import { planAdaptiveOperatingLayoutV2 } from "./operating-layout.js";
import type { ResourcePayload } from "./resource-payload.js";
import type {
  ActiveSave,
  OperatingContextManifest,
  OperatingDecision,
  OperatingEvidence,
  OperatingSurfaceState,
  OperatingSystemChange,
  OperatingWorkLoop,
} from "./operating-system.js";

export interface OperatingProjectionPolicy {
  evidence_class: "production" | "fixture_demonstration";
  employee_id: string;
  generated_at?: string;
  business_name?: string | null;
  business_kind?: string | null;
  profile_version?: string | null;
  owner_experience?: OperatingContextManifest["owner_experience"];
  preferred_density?: OperatingContextManifest["preferred_density"];
  context_fingerprint?: string;
}

/**
 * Canonical presentation semantic compiler. Production accepts only the
 * authoritative Manager-supplied operating state with exact account, employee,
 * and assignment scope. Fixture demonstrations use the same bounded compiler
 * to derive projection-only semantics without adding authority or durable truth.
 */
export function compileOperatingProjection(
  payload: ResourcePayload,
  policy: OperatingProjectionPolicy,
): OperatingSurfaceState {
  const supplied = payload.operating_state;
  if (policy.evidence_class === "production") {
    if (!supplied) throw new Error("operating_projection_authoritative_state_required");
    if (!exactContext(supplied.context, payload, policy.employee_id)) {
      throw new Error("operating_projection_scope_mismatch");
    }
    return supplied;
  }
  if (supplied && exactContext(supplied.context, payload, policy.employee_id)) return supplied;

  const now = policy.generated_at ?? new Date().toISOString();
  const assignmentId = payload.assignment_id ?? `unbound:${policy.employee_id}`;
  const loops: OperatingWorkLoop[] = (payload.tasks ?? []).map((task) => ({
    id: `loop:${task.id}`,
    title: task.title,
    summary: task.summary,
    state: task.status === "in_progress" ? "active" : task.status === "scheduled" ? "waiting" : task.status,
    horizon: task.status === "scheduled" ? "later" : task.status === "done" ? "next" : "now",
    domain: "custom",
    updated_at: task.created_at ?? null,
    next_step: task.status === "needs_you" ? "Owner input" : task.status === "blocked" ? "Clear the dependency" : "Continue",
    return_condition: task.status === "scheduled"
      ? { kind: "time", description: task.summary ?? "Return at the scheduled time", due_at: task.created_at ?? null }
      : null,
    source_envelope_ids: [],
    target: task.target_id ? { kind: task.type, id: task.target_id } : null,
    proof: { assignment_id: assignmentId, source_table: `${policy.evidence_class}_tasks`, source_id: task.id },
  }));
  const saves: ActiveSave[] = (payload.resurface_items ?? []).map((item) => ({
    id: `save:${item.id}`,
    title: item.title,
    why_held: item.why,
    state: item.status === "scheduled" ? "scheduled" : item.status === "needs_you" ? "needs_you" : item.status === "blocked" || item.status === "failed" ? "blocked" : "waiting",
    return_condition: {
      kind: item.status === "scheduled" ? "time" : item.status === "needs_you" ? "owner" : item.kind === "connector" ? "dependency" : "event",
      description: item.why,
      due_at: item.resurface_at ?? null,
      source: item.channel,
    },
    target: item.target ?? null,
    proof: { ...item.proof, assignment_id: assignmentId },
  }));
  const decisions: OperatingDecision[] = payload.approvals.map((approval) => ({
    id: `decision:${approval.id}`,
    title: approval.summary,
    consequence: "This branch is simulated. No provider, customer, monetary, publishing, or runtime effect occurs.",
    risk: approval.risk_level === "low" ? "low" : approval.risk_level === "medium" ? "medium" : "high",
    target: { kind: "approval", id: approval.id },
    proof: { approval_id: approval.id, assignment_id: assignmentId },
  }));
  const changes: OperatingSystemChange[] = payload.work_events.map((event) => ({
    id: `change:${event.id}`,
    title: event.work_event_descriptor?.title ?? ownerize(event.event_type),
    summary: event.work_event_descriptor?.summary,
    source: policy.evidence_class,
    state: event.status === "failed" ? "failed" : "observed",
    occurred_at: event.created_at,
    proof: { inbound_event_id: event.id, assignment_id: assignmentId },
  }));
  const evidence: OperatingEvidence[] = (payload.outputs ?? []).map((output) => ({
    id: `evidence:${output.id}`,
    title: output.title,
    summary: output.summary,
    state: output.status === "failed" ? "failed" : output.status === "draft" ? "draft" : "recorded",
    recorded_at: output.created_at ?? null,
    href: output.href ?? null,
    proof: { artifact_id: output.artifact_id ?? null, assignment_id: assignmentId },
  }));
  const context: OperatingContextManifest = {
    version: 1,
    generated_at: now,
    account_id: payload.account_id,
    assignment_id: assignmentId,
    employee_id: payload.employee_id ?? policy.employee_id,
    employee_name: payload.employee?.name ?? "Employee",
    business_name: policy.business_name ?? null,
    business_kind: policy.business_kind ?? null,
    profile_key: payload.employee?.profile_id ?? policy.evidence_class,
    profile_version: policy.profile_version ?? policy.evidence_class,
    session_id: null,
    session_last_active: now,
    runtime_context_version: policy.evidence_class,
    doctrine_versions: { design_system: policy.evidence_class, agent_interface: policy.evidence_class },
    dominant_domains: ["customer", "finance", "operations"],
    owner_experience: policy.owner_experience ?? "guided",
    preferred_density: policy.preferred_density ?? "balanced",
    signals: [],
  };
  const layout = planAdaptiveOperatingLayoutV2({
    generated_at: now,
    context_fingerprint: policy.context_fingerprint ?? `projection:${policy.evidence_class}:${payload.account_id}:${assignmentId}:${policy.employee_id}`,
    owner_experience: context.owner_experience,
    preferred_density: context.preferred_density,
    loops,
    active_saves: saves,
    decisions,
    changes,
    delegated_work: [],
    evidence,
    connection_attention_count: (payload.connection_surfaces ?? []).filter((connection) => connection.state === "needs_you").length,
  });
  return {
    version: 1,
    generated_at: now,
    guidance: decisions.length
      ? {
          headline: `${context.employee_name} has ${decisions.length} decisions ready`,
          summary: "The production projection path is rendering simulated work. No external effect or production proof exists.",
          suggested_prompt: "Explain the most important decision and the next safe action.",
          mode: "needs_you",
        }
      : {
          headline: `${context.employee_name} is ready`,
          summary: "Give the employee a business outcome to carry across time and systems.",
          suggested_prompt: "Here is the outcome I need next...",
          mode: "quiet",
        },
    focus_loop_id: layout.focus_loop_id,
    loops,
    active_saves: saves,
    decisions,
    changes,
    delegated_work: [],
    evidence,
    context,
    layout,
  };
}

function exactContext(context: OperatingContextManifest, payload: ResourcePayload, employeeId: string): boolean {
  return context.account_id === payload.account_id
    && context.employee_id === (payload.employee_id ?? employeeId)
    && context.assignment_id === payload.assignment_id;
}

function ownerize(value: string): string {
  return value.replace(/[_:-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
