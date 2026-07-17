import { hash32, sha256 } from "./core.js";

export type CohortArm = "conventional" | "graph" | "hyperdimensional";
export type OutcomeKind = "search-impression" | "search-click" | "qualified-start" | "managed-interest" | "closed-won";

export interface FieldPageCohortEntry {
  pageId: string;
  route: string;
  arm: CohortArm;
  publishedAt: string;
  opportunityId: string;
  targetContextIds: string[];
  informationObjectIds: string[];
  productionCostUsd: number;
}
export interface FieldExperimentManifest {
  experimentId: string;
  version: string;
  observationStart: string;
  observationEnd: string;
  primaryMetric: "qualified-starts-per-page" | "gross-profit-per-page";
  pages: FieldPageCohortEntry[];
  exclusions: string[];
}
export interface SearchObservation {
  date: string;
  pageId: string;
  query: string;
  impressions: number;
  clicks: number;
  branded: boolean;
  compatible: boolean;
  indexed: boolean;
}
export interface ConversionEvent {
  eventId: string;
  occurredAt: string;
  pageId: string;
  variantId: string;
  experimentId: string;
  arm: CohortArm | "canonical";
  kind: OutcomeKind;
  valueUsd: number;
  grossProfitUsd: number;
  sessionScopeId?: string;
}
export interface DistributionMetrics {
  arm: CohortArm;
  pageCount: number;
  indexedRate: number;
  nonBrandedImpressionsPerPage: number;
  compatibleClicksPerPage: number;
  queryDiversityPerPage: number;
  qualifiedStartsPerPage: number;
  closedWonPerPage: number;
  revenuePerPage: number;
  grossProfitPerPage: number;
  lifecycleReturn: number;
}

export function validateFieldManifest(manifest: FieldExperimentManifest): void {
  if (manifest.pages.length < 3) throw new Error("field manifest requires at least three pages");
  const pageIds = new Set<string>();
  const routes = new Set<string>();
  const arms = new Set<CohortArm>();
  for (const page of manifest.pages) {
    if (pageIds.has(page.pageId)) throw new Error(`duplicate page in field cohort: ${page.pageId}`);
    if (routes.has(page.route)) throw new Error(`duplicate route in field cohort: ${page.route}`);
    if (page.informationObjectIds.length === 0) throw new Error(`page ${page.pageId} has no information object`);
    if (page.targetContextIds.length === 0) throw new Error(`page ${page.pageId} has no target contexts`);
    if (!Number.isFinite(page.productionCostUsd) || page.productionCostUsd < 0) throw new Error(`invalid production cost for ${page.pageId}`);
    pageIds.add(page.pageId); routes.add(page.route); arms.add(page.arm);
  }
  for (const arm of ["conventional", "graph", "hyperdimensional"] as const) if (!arms.has(arm)) throw new Error(`missing field arm: ${arm}`);
  if (Date.parse(manifest.observationStart) >= Date.parse(manifest.observationEnd)) throw new Error("invalid observation window");
}

export function aggregateDistribution(
  manifest: FieldExperimentManifest,
  search: readonly SearchObservation[],
  events: readonly ConversionEvent[],
): DistributionMetrics[] {
  validateFieldManifest(manifest);
  const dedupedEvents = dedupeEvents(events);
  return (["conventional", "graph", "hyperdimensional"] as const).map((arm) => {
    const pages = manifest.pages.filter((page) => page.arm === arm);
    const ids = new Set(pages.map((page) => page.pageId));
    const observations = search.filter((item) => ids.has(item.pageId));
    const armEvents = dedupedEvents.filter((event) => ids.has(event.pageId));
    const indexed = new Set(observations.filter((item) => item.indexed).map((item) => item.pageId));
    const nonBranded = observations.filter((item) => !item.branded);
    const compatibleClicks = nonBranded.reduce((sum, item) => sum + (item.compatible ? item.clicks : 0), 0);
    const queries = new Set(nonBranded.filter((item) => item.compatible && item.impressions > 0).map((item) => item.query.toLowerCase()));
    const qualifiedStarts = armEvents.filter((event) => event.kind === "qualified-start").length;
    const closedWon = armEvents.filter((event) => event.kind === "closed-won").length;
    const revenue = armEvents.filter((event) => event.kind === "closed-won").reduce((sum, event) => sum + event.valueUsd, 0);
    const grossProfit = armEvents.filter((event) => event.kind === "closed-won").reduce((sum, event) => sum + event.grossProfitUsd, 0);
    const productionCost = pages.reduce((sum, page) => sum + page.productionCostUsd, 0);
    return {
      arm,
      pageCount: pages.length,
      indexedRate: pages.length === 0 ? 0 : indexed.size / pages.length,
      nonBrandedImpressionsPerPage: pages.length === 0 ? 0 : nonBranded.reduce((sum, item) => sum + item.impressions, 0) / pages.length,
      compatibleClicksPerPage: pages.length === 0 ? 0 : compatibleClicks / pages.length,
      queryDiversityPerPage: pages.length === 0 ? 0 : queries.size / pages.length,
      qualifiedStartsPerPage: pages.length === 0 ? 0 : qualifiedStarts / pages.length,
      closedWonPerPage: pages.length === 0 ? 0 : closedWon / pages.length,
      revenuePerPage: pages.length === 0 ? 0 : revenue / pages.length,
      grossProfitPerPage: pages.length === 0 ? 0 : grossProfit / pages.length,
      lifecycleReturn: productionCost === 0 ? 0 : grossProfit / productionCost,
    };
  });
}

export function deterministicExperimentArm(experimentId: string, sessionScopeId: string, weights: readonly number[]): number {
  if (weights.length === 0 || weights.some((weight) => !Number.isFinite(weight) || weight < 0)) throw new RangeError("invalid experiment weights");
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) throw new RangeError("experiment weights must have positive total");
  const bucket = hash32(`${experimentId}\0${sessionScopeId}`) / 0xffffffff;
  let cumulative = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index] / total;
    if (bucket <= cumulative) return index;
  }
  return weights.length - 1;
}

export function createConversionEvent(input: Omit<ConversionEvent, "eventId">): ConversionEvent {
  const stable = JSON.stringify({ occurredAt: input.occurredAt, pageId: input.pageId, variantId: input.variantId,
    experimentId: input.experimentId, arm: input.arm, kind: input.kind, valueUsd: input.valueUsd,
    grossProfitUsd: input.grossProfitUsd, sessionScopeId: input.sessionScopeId ?? null });
  return { ...input, eventId: sha256(stable) };
}

export function dedupeEvents(events: readonly ConversionEvent[]): ConversionEvent[] {
  const byId = new Map<string, ConversionEvent>();
  for (const event of events) {
    if (!Number.isFinite(event.valueUsd) || !Number.isFinite(event.grossProfitUsd)) throw new Error(`invalid event value: ${event.eventId}`);
    if (!byId.has(event.eventId)) byId.set(event.eventId, event);
  }
  return [...byId.values()].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId));
}

export function manifestFingerprint(manifest: FieldExperimentManifest): string {
  validateFieldManifest(manifest);
  return sha256(JSON.stringify({ ...manifest, pages: [...manifest.pages].sort((a, b) => a.pageId.localeCompare(b.pageId)) }));
}
