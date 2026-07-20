import type {
  AdaptiveLayoutInput,
  AdaptiveLayoutPlan,
  AdaptiveLayoutRegion,
  AdaptiveRegionKind,
  OperatingContextManifest,
  OperatingDecision,
  OperatingWorkLoop,
} from "./operating-system.js";

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

const MAX_VOLUME_PRIORITY = 18;

const LOOP_STATE_PRIORITY: Record<OperatingWorkLoop["state"], number> = {
  needs_you: 80,
  failed: 70,
  blocked: 65,
  repairing: 55,
  active: 50,
  forming: 40,
  waiting: 30,
  done: 10,
};

const DECISION_RISK_PRIORITY: Record<OperatingDecision["risk"], number> = {
  high: 12,
  medium: 6,
  low: 0,
};

/**
 * Canonical adaptive planner. It adapts only from explicit owner preferences
 * and bounded typed operating state. Volume changes priority logarithmically
 * and is capped so event floods can never outrank owner attention or active
 * work. Identical semantic inputs produce stable focus independent of array
 * ordering.
 */
export function planAdaptiveOperatingLayoutV2(input: AdaptiveLayoutInput): AdaptiveLayoutPlan {
  const blockedLoops = input.loops.filter((loop) => loop.state === "blocked" || loop.state === "failed").length;
  const activeLoops = input.loops.filter((loop) => ["forming", "active", "repairing"].includes(loop.state)).length;
  const returnedSaves = input.active_saves.filter((save) => save.state === "needs_you").length;
  const delegatedFailures = input.delegated_work.filter((unit) => unit.state === "blocked" || unit.state === "failed").length;
  const delegatedActive = input.delegated_work.filter((unit) => ["queued", "working", "blocked", "failed"].includes(unit.state)).length;
  const highestDecisionRisk = highestRisk(input.decisions);
  const regions: AdaptiveLayoutRegion[] = [];

  const add = (kind: AdaptiveRegionKind, count: number, bonus: number, rationale: string[]) => {
    if (count <= 0 && kind !== "guidance" && kind !== "context") return;
    const volume = count > 0
      ? Math.min(MAX_VOLUME_PRIORITY, Math.round(Math.log1p(count) * 8))
      : 0;
    regions.push({
      kind,
      priority: REGION_BASE[kind] + bonus + volume,
      collapsed: kind === "context" || (kind === "evidence" && input.owner_experience === "guided"),
      limit: regionLimit(kind, input.owner_experience, input.preferred_density),
      rationale,
    });
  };

  add("guidance", 1, input.decisions.length ? 18 : blockedLoops ? 14 : activeLoops ? 8 : 0, ["stable_operating_point"]);
  add(
    "attention",
    input.decisions.length + blockedLoops,
    input.decisions.length
      ? 40 + DECISION_RISK_PRIORITY[highestDecisionRisk]
      : blockedLoops
        ? 28
        : 0,
    [
      ...(input.decisions.length ? ["owner_decision_required", `${highestDecisionRisk}_risk_owner_decision`] : []),
      ...(blockedLoops ? ["blocked_or_failed_work"] : []),
    ],
  );
  add("work_loops", input.loops.length, activeLoops ? 16 : 0, activeLoops ? ["active_work_present"] : ["durable_work_context"]);
  add(
    "active_saves",
    input.active_saves.length,
    returnedSaves ? 42 : 6,
    returnedSaves ? ["return_condition_reached", "owner_attention_required"] : ["future_intention_held"],
  );
  add("system_changes", input.changes.length, 0, ["meaningful_state_change", "bounded_event_volume"]);
  add(
    "delegated_work",
    input.delegated_work.length,
    delegatedFailures ? 62 : delegatedActive ? 10 : 0,
    delegatedFailures
      ? ["delegated_failure_material", "parent_work_blocked"]
      : ["delegated_execution_visible_when_material"],
  );
  add("evidence", input.evidence.length, 0, ["durable_outcomes"]);
  add("connections", input.connection_attention_count, input.connection_attention_count ? 12 : 0, ["connection_affects_work"]);
  add("context", 1, 0, ["inspectable_context_manifest"]);

  regions.sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind));
  const focusLoop = selectStableFocusLoop(input.loops);
  const primary = regions[0]?.kind ?? "guidance";

  return {
    version: 1,
    layout_id: "guided_operating_surface_v1",
    generated_at: input.generated_at,
    primary_region: primary,
    ordered_regions: regions,
    focus_loop_id: focusLoop?.id ?? null,
    command_position: primary === "work_loops" && input.owner_experience === "expert" ? "inline_focus" : "anchored_bottom",
    density: input.preferred_density,
    rationale_codes: [...new Set(regions.flatMap((region) => region.rationale))],
    context_fingerprint: input.context_fingerprint,
  };
}

function highestRisk(decisions: OperatingDecision[]): OperatingDecision["risk"] {
  if (decisions.some((decision) => decision.risk === "high")) return "high";
  if (decisions.some((decision) => decision.risk === "medium")) return "medium";
  return "low";
}

function selectStableFocusLoop(loops: OperatingWorkLoop[]): OperatingWorkLoop | undefined {
  return [...loops].sort((left, right) => {
    const stateDelta = LOOP_STATE_PRIORITY[right.state] - LOOP_STATE_PRIORITY[left.state];
    if (stateDelta !== 0) return stateDelta;

    const updatedDelta = timestamp(right.updated_at) - timestamp(left.updated_at);
    if (updatedDelta !== 0) return updatedDelta;

    return left.id.localeCompare(right.id);
  })[0];
}

function timestamp(value?: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
