import type { ProofEnvelope, SurfaceEnvelope } from "./materialization.js";

export type OperatingLoopState =
  | "forming"
  | "active"
  | "waiting"
  | "needs_you"
  | "blocked"
  | "repairing"
  | "done"
  | "failed";

export type OperatingHorizon = "now" | "next" | "later" | "ongoing";

export type OperatingDomain =
  | "customer"
  | "commerce"
  | "finance"
  | "growth"
  | "operations"
  | "research"
  | "people"
  | "system"
  | "custom";

export type ReturnConditionKind = "event" | "time" | "state" | "threshold" | "dependency" | "owner";

export interface ReturnCondition {
  kind: ReturnConditionKind;
  description: string;
  due_at?: string | null;
  source?: string | null;
}

export interface OperatingWorkLoop {
  id: string;
  title: string;
  summary?: string;
  state: OperatingLoopState;
  horizon: OperatingHorizon;
  domain: OperatingDomain;
  updated_at?: string | null;
  next_step?: string | null;
  return_condition?: ReturnCondition | null;
  source_envelope_ids: string[];
  target?: { kind: string; id: string } | null;
  proof: ProofEnvelope;
}

export interface ActiveSave {
  id: string;
  title: string;
  why_held: string;
  state: "watching" | "scheduled" | "waiting" | "blocked" | "needs_you";
  return_condition: ReturnCondition;
  loop_id?: string | null;
  target?: { kind: string; id: string } | null;
  proof: ProofEnvelope;
}

export interface OperatingDecision {
  id: string;
  title: string;
  consequence: string;
  risk: "low" | "medium" | "high";
  source_envelope_id?: string | null;
  target?: { kind: string; id: string } | null;
  proof: ProofEnvelope;
}

export interface OperatingSystemChange {
  id: string;
  title: string;
  summary?: string;
  source: string;
  state: "observed" | "prepared" | "accepted" | "failed" | "repaired";
  occurred_at?: string | null;
  loop_id?: string | null;
  source_envelope_id?: string | null;
  proof: ProofEnvelope;
}

export type DelegatedExecutorKind = "hermes_subagent" | "specialist_agent" | "tool" | "human" | "system";

export interface DelegatedWorkUnit {
  id: string;
  parent_loop_id?: string | null;
  title: string;
  purpose: string;
  executor_kind: DelegatedExecutorKind;
  executor_label?: string | null;
  state: "queued" | "working" | "waiting" | "blocked" | "done" | "failed";
  result_summary?: string | null;
  blocking_reason?: string | null;
  started_at?: string | null;
  updated_at?: string | null;
  source_envelope_id?: string | null;
  proof: ProofEnvelope;
}

export interface OperatingEvidence {
  id: string;
  title: string;
  summary?: string;
  state: "accepted" | "failed" | "recorded" | "draft";
  recorded_at?: string | null;
  href?: string | null;
  source_envelope_id?: string | null;
  proof: ProofEnvelope;
}

export interface OperatingGuidance {
  headline: string;
  summary: string;
  suggested_prompt?: string | null;
  mode: "quiet" | "working" | "needs_you" | "blocked" | "degraded";
}

export type OperatingContextSource =
  | "manifest"
  | "profile"
  | "generated_soul"
  | "business_brain"
  | "session_history"
  | "runtime"
  | "event_ingress"
  | "connector"
  | "materialized_work"
  | "owner_preference"
  | "agents_doctrine"
  | "codegraph_doctrine";

export interface OperatingContextSignal {
  id: string;
  source: OperatingContextSource;
  key: string;
  label: string;
  value?: string | null;
  confidence: "high" | "medium" | "low";
  freshness: "live" | "current" | "stale" | "static";
  authority: "runtime_fact" | "owner_fact" | "profile_fact" | "product_doctrine" | "derived";
  owner_safe: boolean;
  updated_at?: string | null;
}

export interface OperatingContextManifest {
  version: 1;
  generated_at: string;
  account_id: string;
  assignment_id: string;
  employee_id: string;
  employee_name: string;
  business_name?: string | null;
  business_kind?: string | null;
  profile_key?: string | null;
  profile_version?: string | null;
  session_id?: string | null;
  session_last_active?: string | null;
  runtime_context_version?: string | null;
  doctrine_versions: {
    agents?: string | null;
    codegraph?: string | null;
    design_system?: string | null;
    agent_interface?: string | null;
  };
  dominant_domains: OperatingDomain[];
  owner_experience: "guided" | "standard" | "expert";
  preferred_density: "calm" | "balanced" | "dense";
  signals: OperatingContextSignal[];
}

export type AdaptiveRegionKind =
  | "guidance"
  | "attention"
  | "work_loops"
  | "active_saves"
  | "system_changes"
  | "delegated_work"
  | "evidence"
  | "connections"
  | "context";

export interface AdaptiveLayoutRegion {
  kind: AdaptiveRegionKind;
  priority: number;
  collapsed: boolean;
  limit: number;
  rationale: string[];
}

export interface AdaptiveLayoutPlan {
  version: 1;
  layout_id: "guided_operating_surface_v1";
  generated_at: string;
  primary_region: AdaptiveRegionKind;
  ordered_regions: AdaptiveLayoutRegion[];
  focus_loop_id?: string | null;
  command_position: "anchored_bottom" | "inline_focus";
  density: "calm" | "balanced" | "dense";
  rationale_codes: string[];
  context_fingerprint: string;
}

export interface OperatingSurfaceState {
  version: 1;
  generated_at: string;
  guidance: OperatingGuidance;
  focus_loop_id?: string | null;
  loops: OperatingWorkLoop[];
  active_saves: ActiveSave[];
  decisions: OperatingDecision[];
  changes: OperatingSystemChange[];
  delegated_work: DelegatedWorkUnit[];
  evidence: OperatingEvidence[];
  context: OperatingContextManifest;
  layout: AdaptiveLayoutPlan;
}

export interface AdaptiveLayoutInput {
  generated_at: string;
  context_fingerprint: string;
  owner_experience: OperatingContextManifest["owner_experience"];
  preferred_density: OperatingContextManifest["preferred_density"];
  loops: OperatingWorkLoop[];
  active_saves: ActiveSave[];
  decisions: OperatingDecision[];
  changes: OperatingSystemChange[];
  delegated_work: DelegatedWorkUnit[];
  evidence: OperatingEvidence[];
  connection_attention_count: number;
}

/**
 * Keep the contract module and package root on one implementation. The canonical
 * planner lives in operating-layout.ts; this re-export prevents direct-module
 * consumers from drifting onto a second scoring/focus algorithm.
 */
export { planAdaptiveOperatingLayoutV2 as planAdaptiveOperatingLayout } from "./operating-layout.js";

export function envelopeDelegationIdentity(envelope: SurfaceEnvelope): string | null {
  return envelope.proof.delegation_id ?? envelope.proof.child_run_id ?? null;
}
