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
}

export function envelopeDelegationIdentity(envelope: SurfaceEnvelope): string | null {
  return envelope.proof.delegation_id ?? envelope.proof.child_run_id ?? null;
}
