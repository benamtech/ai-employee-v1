import type {
  AdaptiveLayoutInput,
  AdaptiveLayoutPlan,
  AdaptiveLayoutRegion,
  AdaptiveRegionKind,
  OperatingContextManifest,
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

/**
 * Canonical adaptive planner. Volume changes priority logarithmically but is
 * capped so event floods can never outrank owner attention or active work.
 */
export function planAdaptiveOperatingLayoutV2(input: AdaptiveLayoutInput): AdaptiveLayoutPlan {
  const blockedLoops = input.loops.filter((loop) => loop.state === "blocked" || loop.state === "failed").length;
  const activeLoops = input.loops.filter((loop) => ["forming", "active", "repairing"].includes(loop.state)).length;
  const delegatedActive = input.delegated_work.filter((unit) => ["queued", "working", "blocked", "failed"].includes(unit.state)).length;
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
  add("attention", input.decisions.length + blockedLoops, input.decisions.length ? 40 : blockedLoops ? 28 : 0, [
    ...(input.decisions.length ? ["owner_decision_required"] : []),
    ...(blockedLoops ? ["blocked_or_failed_work"] : []),
  ]);
  add("work_loops", input.loops.length, activeLoops ? 16 : 0, activeLoops ? ["active_work_present"] : ["durable_work_context"]);
  add("active_saves", input.active_saves.length, input.active_saves.some((save) => save.state === "needs_you") ? 18 : 6, ["future_intention_held"]);
  add("system_changes", input.changes.length, 0, ["meaningful_state_change", "bounded_event_volume"]);
  add("delegated_work", input.delegated_work.length, delegatedActive ? 10 : 0, ["delegated_execution_visible_when_material"]);
  add("evidence", input.evidence.length, 0, ["durable_outcomes"]);
  add("connections", input.connection_attention_count, input.connection_attention_count ? 12 : 0, ["connection_affects_work"]);
  add("context", 1, 0, ["inspectable_context_manifest"]);

  regions.sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind));
  const focusLoop = input.loops.find((loop) => loop.state === "needs_you")
    ?? input.loops.find((loop) => loop.state === "blocked" || loop.state === "failed")
    ?? input.loops.find((loop) => loop.state === "active" || loop.state === "repairing")
    ?? input.loops[0];
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
