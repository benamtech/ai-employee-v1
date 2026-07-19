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

const REGION_BASE: Record<AdaptiveRegionKind, number> = {
  guidance: 100,
  attention: 90,
  work_loops: 75,
  active_saves: 68,
  system_changes: 54,
  delegated_work: 50,
  evidence: 35,
  connections: 28,
  context: 10,
};

const MAX_VOLUME_BONUS = 24;

const FOCUS_STATE_PRIORITY: Record<OperatingLoopState, number> = {
  needs_you: 0,
  blocked: 1,
  failed: 1,
  active: 2,
  repairing: 2,
  forming: 3,
  waiting: 4,
  done: 5,
};

function timestampScore(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectFocusLoop(loops: OperatingWorkLoop[]): OperatingWorkLoop | undefined {
  return [...loops].sort((a, b) => {
    const stateDelta = FOCUS_STATE_PRIORITY[a.state] - FOCUS_STATE_PRIORITY[b.state];
    if (stateDelta !== 0) return stateDelta;
    const recencyDelta = timestampScore(b.updated_at) - timestampScore(a.updated_at);
    if (recencyDelta !== 0) return recencyDelta;
    return a.id.localeCompare(b.id);
  })[0];
}

export function planAdaptiveOperatingLayout(input: AdaptiveLayoutInput): AdaptiveLayoutPlan {
  const blockedLoops = input.loops.filter((loop) => loop.state === "blocked" || loop.state === "failed").length;
  const activeLoops = input.loops.filter((loop) => ["forming", "active", "repairing"].includes(loop.state)).length;
  const highRiskDecisions = input.decisions.filter((decision) => decision.risk === "high").length;
  const returnedSaves = input.active_saves.filter((save) => save.state === "needs_you").length;
  const delegatedActive = input.delegated_work.filter((unit) => ["queued", "working", "blocked", "failed"].includes(unit.state)).length;
  const delegatedFailures = input.delegated_work.filter((unit) => unit.state === "blocked" || unit.state === "failed").length;
  const regions: AdaptiveLayoutRegion[] = [];
  const add = (kind: AdaptiveRegionKind, count: number, bonus: number, rationale: string[]) => {
    if (count <= 0 && kind !== "guidance" && kind !== "context") return;
    const volume = count > 0 ? Math.min(MAX_VOLUME_BONUS, Math.round(Math.log1p(count) * 8)) : 0;
    regions.push({
      kind,
      priority: REGION_BASE[kind] + bonus + volume,
      collapsed: kind === "context" || (kind === "evidence" && input.owner_experience === "guided"),
      limit: regionLimit(kind, input.owner_experience, input.preferred_density),
      rationale,
    });
  };

  add("guidance", 1, input.decisions.length ? 18 : blockedLoops ? 14 : activeLoops ? 8 : 0, ["stable_operating_point"]);
  add("attention", input.decisions.length + blockedLoops, highRiskDecisions ? 48 : input.decisions.length ? 40 : blockedLoops ? 28 : 0, [
    ...(highRiskDecisions ? ["high_risk_owner_decision"] : input.decisions.length ? ["owner_decision_required"] : []),
    ...(blockedLoops ? ["blocked_or_failed_work"] : []),
  ]);
  add("work_loops", input.loops.length, activeLoops ? 16 : 0, activeLoops ? ["active_work_present"] : ["durable_work_context"]);
  add("active_saves", input.active_saves.length, returnedSaves ? 52 : 6, returnedSaves ? ["return_condition_reached"] : ["future_intention_held"]);
  add("system_changes", input.changes.length, 0, ["meaningful_state_change"]);
  add("delegated_work", input.delegated_work.length, delegatedFailures ? 64 : delegatedActive ? 10 : 0, delegatedFailures ? ["delegated_failure_material"] : ["delegated_execution_visible_when_material"]);
  add("evidence", input.evidence.length, 0, ["durable_outcomes"]);
  add("connections", input.connection_attention_count, input.connection_attention_count ? 12 : 0, ["connection_affects_work"]);
  add("context", 1, 0, ["inspectable_context_manifest"]);

  regions.sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind));
  const primary = regions[0]?.kind ?? "guidance";
  const focusLoop = selectFocusLoop(input.loops);

  return {
    version: 1,
    layout_id: "guided_operating_surface_v1",
    generated_at: input.generated_at,
    primary_region: primary,
    ordered_regions: regions,
    focus_loop_id: focusLoop?.id ?? null,
    command_position: primary === "work_loops" && input.owner_experience === "expert" ? "inline_focus" : "anchored_bottom",
    density: input.preferred_density,
    rationale_codes: regions.flatMap((region) => region.rationale),
    context_fingerprint: input.context_fingerprint,
  };
}

function regionLimit(
  kind: AdaptiveRegionKind,
  experience: OperatingContextManifest["owner_experience"],
  density: OperatingContextManifest["preferred_density"],
): number {
  const base = experience === "guided" ? 3 : experience === "expert" ? 8 : 5;
  const densityDelta = density === "dense" ? 2 : density === "calm" ? -1 : 0;
  if (kind === "guidance" || kind === "context") return 1;
  if (kind === "attention") return Math.max(2, base + 1 + densityDelta);
  return Math.max(2, base + densityDelta);
}

export function envelopeDelegationIdentity(envelope: SurfaceEnvelope): string | null {
  return envelope.proof.delegation_id ?? envelope.proof.child_run_id ?? null;
}
