import type { AdaptiveLayoutRegion } from "@amtech/shared";

export const PRODUCTION_OPERATING_REGION_KINDS = Object.freeze([
  "guidance",
  "attention",
  "work_loops",
  "active_saves",
  "system_changes",
  "delegated_work",
  "evidence",
  "connections",
  "context",
] as const satisfies readonly AdaptiveLayoutRegion["kind"][]);

const KINDS = new Set<string>(PRODUCTION_OPERATING_REGION_KINDS);

/** The only registry that admits layout-planner regions to production rendering. */
export function registeredOperatingRegions(regions: readonly AdaptiveLayoutRegion[]): AdaptiveLayoutRegion[] {
  const seen = new Set<string>();
  return regions.filter((region) => {
    if (!KINDS.has(region.kind) || seen.has(region.kind)) return false;
    seen.add(region.kind);
    return true;
  });
}
