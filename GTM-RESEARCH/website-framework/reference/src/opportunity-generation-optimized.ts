import { sha256 } from "./core.js";
import type { ApprovedOntology, ApprovedOntologyAttribute, MaterialEffect } from "./ontology-discovery.js";
import { graphEdgeWeight, type CompiledOntologyGraph } from "./ontology-graph.js";
import type { FrequentClosedItemset, OpportunityRegion, OpportunitySpacePolicy } from "./opportunity-space.js";

/**
 * Algorithmically optimized equivalent of generateOpportunityRegions.
 *
 * It preserves the same eligibility and scoring model while removing measured
 * implementation waste: repeated observation scans, repeated summaries,
 * linear active-node membership checks, and repeated global constraint scans.
 */
export function generateOpportunityRegionsOptimized(
  ontology: ApprovedOntology,
  graph: CompiledOntologyGraph,
  seeds: readonly FrequentClosedItemset[],
  policy: OpportunitySpacePolicy,
): OpportunityRegion[] {
  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const activeNodeIds = new Set(graph.activeNodeIds);
  const communityByAttribute = new Map<string, string>();
  for (const community of graph.communities) for (const id of community.attributeIds) communityByAttribute.set(id, community.id);
  const anchorIds = new Set(ontology.attributes.filter((item) => item.anchorKind).map((item) => item.id));
  const totalObservationWeight = ontology.observations.reduce((sum, item) => sum + item.weight, 0) || 1;
  const observationSets = ontology.observations.map((item) => new Set(item.attributeIds));
  const observationPostings = new Map<string, number[]>();
  ontology.observations.forEach((observation, index) => {
    for (const id of observation.attributeIds) {
      const postings = observationPostings.get(id) ?? [];
      postings.push(index);
      observationPostings.set(id, postings);
    }
  });
  const excludes = new Map<string, Set<string>>();
  const requires = new Map<string, Set<string>>();
  for (const constraint of graph.constraints) {
    const target = constraint.type === "excludes" ? excludes : requires;
    const values = target.get(constraint.fromAttributeId) ?? new Set<string>();
    values.add(constraint.toAttributeId);
    target.set(constraint.fromAttributeId, values);
    if (constraint.type === "excludes") {
      const reverse = excludes.get(constraint.toAttributeId) ?? new Set<string>();
      reverse.add(constraint.fromAttributeId);
      excludes.set(constraint.toAttributeId, reverse);
    }
  }

  const heap = new MaxHeap<SearchState>((left, right) => left.score - right.score || right.signature.localeCompare(left.signature));
  const visited = new Set<string>();
  const output: OpportunityRegion[] = [];
  const seedSets = [
    ...seeds.filter((item) => item.attributeIds.some((id) => anchorIds.has(id))).map((item) => item.attributeIds),
    ...[...anchorIds].sort().map((id) => [id]),
  ];
  for (const ids of seedSets) pushState(ids);

  while (heap.size > 0 && output.length < policy.maximumCandidateRegions) {
    const state = heap.pop()!;
    if (isEligible(state)) output.push(materializeRegion(state));
    if (state.attributeIds.length >= policy.maximumRegionWidth) continue;
    const candidates = expansionCandidates(state)
      .map((id) => ({ id, score: incrementalScore(state.attributeIds, id) }))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, policy.neighborExpansionLimit);
    for (const candidate of candidates) pushState([...state.attributeIds, candidate.id]);
  }

  return output.sort((left, right) => right.eligibilityScore - left.eligibilityScore || left.id.localeCompare(right.id));

  function pushState(inputIds: readonly string[]): void {
    const ids = [...new Set(inputIds)].sort();
    if (ids.length === 0 || ids.length > policy.maximumRegionWidth) return;
    const dimensions = new Set<string>();
    for (const id of ids) {
      const dimension = required(attributeById, id).dimension;
      if (dimensions.has(dimension)) return;
      dimensions.add(dimension);
    }
    if (violatesConstraints(ids)) return;
    const signature = ids.join("\0");
    if (visited.has(signature)) return;
    visited.add(signature);
    const summary = summarize(ids);
    heap.push({ attributeIds: ids, signature, score: summary.score, dimensions, summary });
  }

  function expansionCandidates(state: SearchState): string[] {
    const used = new Set(state.attributeIds);
    const candidates = new Set<string>();
    for (const id of state.attributeIds) {
      for (const neighbor of graph.adjacency[id] ?? []) {
        if (activeNodeIds.has(neighbor)) candidates.add(neighbor);
      }
    }
    return [...candidates].filter((id) => !used.has(id) && !state.dimensions.has(required(attributeById, id).dimension));
  }

  function incrementalScore(ids: readonly string[], candidateId: string): number {
    let edgeWeightSum = 0;
    for (const id of ids) edgeWeightSum += graphEdgeWeight(graph, id, candidateId);
    const attribute = required(attributeById, candidateId);
    return 0.65 * (ids.length === 0 ? 0 : edgeWeightSum / ids.length)
      + 0.2 * Math.min(1, attribute.materialEffects.length / 4)
      + 0.15 * attribute.confidence;
  }

  function violatesConstraints(ids: readonly string[]): boolean {
    const set = new Set(ids);
    for (const id of ids) {
      for (const excluded of excludes.get(id) ?? []) if (set.has(excluded)) return true;
      for (const requiredId of requires.get(id) ?? []) if (!set.has(requiredId)) return true;
    }
    return false;
  }

  function summarize(ids: readonly string[]): RegionSummary {
    const attributes = ids.map((id) => required(attributeById, id));
    const anchorIdsLocal = attributes.filter((item) => item.anchorKind).map((item) => item.id).sort();
    const materialEffects = [...new Set(attributes.flatMap((item) => item.materialEffects))].sort() as MaterialEffect[];
    const evidenceIds = [...new Set(attributes.flatMap((item) => item.evidenceIds))].sort();
    const sourceIds = [...new Set(attributes.flatMap((item) => item.sourceIds))].sort();
    const observationIndexes = matchingObservationIndexes(ids);
    let supportWeight = 0;
    const observationIds: string[] = [];
    for (const index of observationIndexes) {
      supportWeight += ontology.observations[index].weight;
      observationIds.push(ontology.observations[index].id);
    }
    observationIds.sort();
    const supportRatio = supportWeight / totalObservationWeight;
    let pairWeightSum = 0;
    let pairCount = 0;
    for (let left = 0; left < ids.length; left += 1) {
      for (let right = left + 1; right < ids.length; right += 1) {
        pairWeightSum += graphEdgeWeight(graph, ids[left], ids[right]);
        pairCount += 1;
      }
    }
    const coherence = pairCount === 0 ? 0 : pairWeightSum / pairCount;
    const confidence = attributes.length === 0 ? 0 : attributes.reduce((sum, item) => sum + item.confidence, 0) / attributes.length;
    const score = 0.4 * coherence
      + 0.2 * Math.min(1, supportRatio)
      + 0.2 * Math.min(1, materialEffects.length / 5)
      + 0.1 * Math.min(1, anchorIdsLocal.length / 2)
      + 0.1 * confidence;
    return { attributes, anchorIds: anchorIdsLocal, materialEffects, evidenceIds, sourceIds, observationIds, supportWeight, supportRatio, coherence, score };
  }

  function matchingObservationIndexes(ids: readonly string[]): number[] {
    let rarest: readonly number[] | undefined;
    for (const id of ids) {
      const postings = observationPostings.get(id) ?? [];
      if (rarest === undefined || postings.length < rarest.length) rarest = postings;
    }
    if (!rarest || rarest.length === 0) return [];
    const matches: number[] = [];
    for (const index of rarest) {
      const set = observationSets[index];
      let includesAll = true;
      for (const id of ids) if (!set.has(id)) { includesAll = false; break; }
      if (includesAll) matches.push(index);
    }
    return matches;
  }

  function isEligible(state: SearchState): boolean {
    return state.attributeIds.length >= policy.minimumRegionWidth
      && state.summary.anchorIds.length > 0
      && state.summary.materialEffects.length >= policy.minimumMaterialEffects
      && state.summary.coherence >= policy.minimumCoherence
      && state.summary.evidenceIds.length > 0;
  }

  function materializeRegion(state: SearchState): OpportunityRegion {
    const { attributeIds: ids, summary } = state;
    const dimensionValues = Object.fromEntries(summary.attributes.map((item) => [item.dimension, item.id]).sort(([left], [right]) => left.localeCompare(right)));
    const communityIds = [...new Set(ids.map((id) => communityByAttribute.get(id)).filter((id): id is string => Boolean(id)))].sort();
    const coverageKeys = regionCoverageKeys(ids, summary.materialEffects, summary.anchorIds, communityIds, graph);
    const canonical = {
      attributeIds: [...ids],
      dimensionValues,
      anchorIds: summary.anchorIds,
      communityIds,
      materialEffects: summary.materialEffects,
      evidenceIds: summary.evidenceIds,
      sourceIds: summary.sourceIds,
      observationIds: summary.observationIds,
      supportWeight: summary.supportWeight,
      supportRatio: summary.supportRatio,
      coherence: summary.coherence,
      eligibilityScore: summary.score,
      coverageKeys,
    };
    const regionHash = sha256(JSON.stringify(canonical));
    return { id: `region:${regionHash.slice(0, 20)}`, ...canonical, regionHash };
  }
}

function regionCoverageKeys(
  attributeIds: readonly string[],
  materialEffects: readonly MaterialEffect[],
  anchorIds: readonly string[],
  communityIds: readonly string[],
  graph: CompiledOntologyGraph,
): string[] {
  const keys = new Set<string>();
  for (const id of attributeIds) keys.add(`node:${id}`);
  for (const effect of materialEffects) keys.add(`effect:${effect}`);
  for (const id of anchorIds) keys.add(`anchor:${id}`);
  for (const id of communityIds) keys.add(`community:${id}`);
  for (let left = 0; left < attributeIds.length; left += 1) {
    for (let right = left + 1; right < attributeIds.length; right += 1) {
      if (graphEdgeWeight(graph, attributeIds[left], attributeIds[right]) > 0) keys.add(`pair:${attributeIds[left]}|${attributeIds[right]}`);
    }
  }
  return [...keys].sort();
}
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`missing ${String(key)}`);
  return value;
}

type RegionSummary = {
  attributes: readonly ApprovedOntologyAttribute[];
  anchorIds: string[];
  materialEffects: MaterialEffect[];
  evidenceIds: string[];
  sourceIds: string[];
  observationIds: string[];
  supportWeight: number;
  supportRatio: number;
  coherence: number;
  score: number;
};
type SearchState = {
  attributeIds: readonly string[];
  signature: string;
  score: number;
  dimensions: ReadonlySet<string>;
  summary: RegionSummary;
};
class MaxHeap<T> {
  private readonly values: T[] = [];
  constructor(private readonly compare: (left: T, right: T) => number) {}
  get size(): number { return this.values.length; }
  push(value: T): void { this.values.push(value); this.bubbleUp(this.values.length - 1); }
  pop(): T | undefined {
    if (this.values.length === 0) return undefined;
    const top = this.values[0];
    const last = this.values.pop()!;
    if (this.values.length > 0) { this.values[0] = last; this.bubbleDown(0); }
    return top;
  }
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.values[index], this.values[parent]) <= 0) break;
      [this.values[index], this.values[parent]] = [this.values[parent], this.values[index]];
      index = parent;
    }
  }
  private bubbleDown(index: number): void {
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let best = index;
      if (left < this.values.length && this.compare(this.values[left], this.values[best]) > 0) best = left;
      if (right < this.values.length && this.compare(this.values[right], this.values[best]) > 0) best = right;
      if (best === index) break;
      [this.values[index], this.values[best]] = [this.values[best], this.values[index]];
      index = best;
    }
  }
}
