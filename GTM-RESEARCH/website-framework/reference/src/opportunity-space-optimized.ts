import { compileHrrFeatures, type FeatureMap, type VectorSpaceIdentity } from "./benchmark.js";
import { cosine, sha256, type Vector } from "./core.js";
import type { NormalizedProject } from "./project-input.js";
import type { ApprovedOntology } from "./ontology-discovery.js";
import type { CompiledOntologyGraph } from "./ontology-graph.js";
import {
  generateOpportunityRegions,
  mineFrequentClosedItemsets,
  OPPORTUNITY_VALIDATION,
  type CompiledOpportunitySpace,
  type OpportunityRegion,
  type OpportunitySpacePolicy,
  type RejectedOpportunityRegion,
  type SelectedOpportunitySpace,
} from "./opportunity-space.js";
import { buildValidationReport, finding, type ValidationState } from "./validation-contracts.js";

/**
 * Production-oriented sparse selector.
 *
 * The original selector remains available as a transparent correctness baseline.
 * This implementation removes two measured O(k*n) behaviours:
 * - global revision invalidation after every greedy selection;
 * - bucket-wide duplicate scans when the configured Jaccard threshold can only
 *   accept exact attribute sets at the bounded region width.
 */
export function compileOptimizedOpportunitySpace(
  project: NormalizedProject,
  ontology: ApprovedOntology,
  graph: CompiledOntologyGraph,
  identity: VectorSpaceIdentity,
  policy: OpportunitySpacePolicy,
): CompiledOpportunitySpace {
  const minimumSelected = policy.minimumSelectedRegions ?? project.input.goals.minimumInitialPages ?? 1;
  const maximumSelected = Math.min(policy.maximumSelectedRegions ?? project.input.goals.maximumInitialPages, project.input.goals.maximumInitialPages);
  if (minimumSelected > maximumSelected) throw new Error("opportunity selection minimum exceeds maximum");
  const closedItemsets = mineFrequentClosedItemsets(ontology, policy.minimumSupportWeight, policy.maximumRegionWidth);
  const candidates = generateOpportunityRegions(ontology, graph, closedItemsets, policy);
  const selected = selectOpportunityRegionsIncremental(project, ontology, candidates, identity, {
    ...policy,
    minimumSelectedRegions: minimumSelected,
    maximumSelectedRegions: maximumSelected,
  });
  const findings = [
    finding("opportunity.seeds", closedItemsets.length > 0 ? "pass" : "fail", `${closedItemsets.length} bounded frequent closed itemsets`),
    finding("opportunity.expansion", candidates.length > 0 && candidates.length <= policy.maximumCandidateRegions ? "pass" : "fail", `${candidates.length}/${policy.maximumCandidateRegions} candidate regions`),
    finding("opportunity.eligibility", candidates.every((item) => item.coherence >= policy.minimumCoherence && item.materialEffects.length >= policy.minimumMaterialEffects && item.anchorIds.length > 0) ? "pass" : "fail", "all emitted candidates satisfy region hard gates"),
    finding("opportunity.vsa", findingState(selected, "opportunity.vsa"), "optimized selected-space vector validation propagated"),
    finding("opportunity.novelty", findingState(selected, "opportunity.novelty"), "optimized selected-space novelty validation propagated"),
    finding("opportunity.selection", findingState(selected, "opportunity.selection"), "incremental sparse coverage validation propagated"),
    finding("opportunity.scale", findingState(selected, "opportunity.scale"), "one-shot site-scale validation propagated"),
  ];
  const canonical = {
    ontologyId: ontology.id,
    closedItemsets,
    candidateHashes: candidates.map((item) => item.regionHash),
    selectionHash: selected.selectionHash,
    selector: "incremental-sparse-v1",
  };
  return {
    ontologyId: ontology.id,
    closedItemsets,
    candidates,
    selected,
    spaceHash: sha256(JSON.stringify(canonical)),
    validation: buildValidationReport(`optimized-opportunity-space:${ontology.id}`, OPPORTUNITY_VALIDATION, findings),
  };
}

export function selectOpportunityRegionsIncremental(
  project: NormalizedProject,
  ontology: ApprovedOntology,
  candidates: readonly OpportunityRegion[],
  identity: VectorSpaceIdentity,
  policy: OpportunitySpacePolicy,
): SelectedOpportunitySpace {
  const minimumSelected = policy.minimumSelectedRegions ?? project.input.goals.minimumInitialPages ?? 1;
  const maximumSelected = Math.min(policy.maximumSelectedRegions ?? project.input.goals.maximumInitialPages, project.input.goals.maximumInitialPages);
  if (candidates.length < minimumSelected) throw new Error(`opportunity space has ${candidates.length} candidates but requires ${minimumSelected}`);

  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const featureFrequency = new Map<string, number>();
  for (const candidate of candidates) for (const key of candidate.coverageKeys) featureFrequency.set(key, (featureFrequency.get(key) ?? 0) + 1);

  // IDF-style weighting makes universal features weight zero. Universal keys do
  // not discriminate between candidates and were a major source of redundant
  // marginal-gain recomputation in the measured 10k fixture.
  const featureWeights = new Map<string, number>();
  for (const [key, frequency] of featureFrequency) {
    const weight = Math.log((candidates.length + 1) / (frequency + 1));
    if (weight > 1e-12) featureWeights.set(key, weight);
  }

  const coverageCounts = new Map<string, number>();
  const selected: OpportunityRegion[] = [];
  const rejected: RejectedOpportunityRegion[] = [];
  const selectedVectors = new Map<string, Vector>();
  const selectedFlags = new Uint8Array(candidates.length);
  const versions = new Uint32Array(candidates.length);
  const heap = new MaxHeap<HeapItem>((left, right) => left.gain - right.gain || right.regionId.localeCompare(left.regionId));
  const exactDuplicateBySignature = new Map<string, number>();
  const fallbackBuckets = new Map<string, number[]>();
  const exactOnlyDuplicateScreen = policy.duplicateJaccardThreshold > (policy.maximumRegionWidth - 1) / policy.maximumRegionWidth;

  for (let index = 0; index < candidates.length; index += 1) {
    heap.push({ index, regionId: candidates[index].id, gain: marginalGain(candidates[index]), version: 0 });
  }

  while (selected.length < maximumSelected) {
    const item = popValid();
    if (!item) break;
    const region = candidates[item.index];
    const currentGain = marginalGain(region);
    const nextUpperBound = peekValid()?.gain ?? Number.NEGATIVE_INFINITY;

    // Standard lazy-greedy rule: stale gains remain upper bounds for a monotone
    // concave-over-modular objective. Reinsert only when another candidate can
    // still beat the recomputed value.
    if (currentGain + 1e-12 < nextUpperBound) {
      versions[item.index] += 1;
      heap.push({ index: item.index, regionId: region.id, gain: currentGain, version: versions[item.index] });
      continue;
    }

    if (selected.length >= minimumSelected && currentGain < policy.minimumMarginalGain) {
      selectedFlags[item.index] = 2;
      rejected.push({ id: region.id, attributeIds: region.attributeIds, reasons: [`marginal coverage ${currentGain.toFixed(6)} below ${policy.minimumMarginalGain}`] });
      continue;
    }

    const duplicate = findNearDuplicate(region);
    if (duplicate) {
      selectedFlags[item.index] = 2;
      rejected.push({ id: region.id, attributeIds: region.attributeIds, reasons: [`near-duplicate of ${duplicate.id}: jaccard=${duplicate.jaccard.toFixed(4)}, hrr=${duplicate.hrr.toFixed(4)}`] });
      continue;
    }

    selectedFlags[item.index] = 1;
    selected.push(region);
    for (const key of region.coverageKeys) if (featureWeights.has(key)) coverageCounts.set(key, (coverageCounts.get(key) ?? 0) + 1);
    const vector = compileRegionVector(region);
    selectedVectors.set(region.id, vector);
    exactDuplicateBySignature.set(duplicateSignature(region), item.index);
    const bucket = noveltyBucket(region);
    const bucketIndexes = fallbackBuckets.get(bucket) ?? [];
    bucketIndexes.push(item.index);
    fallbackBuckets.set(bucket, bucketIndexes);
  }

  if (selected.length < minimumSelected) throw new Error(`opportunity space produced ${selected.length} selected regions; project requires at least ${minimumSelected}`);
  for (let index = 0; index < candidates.length; index += 1) {
    if (selectedFlags[index] !== 0) continue;
    rejected.push({ id: candidates[index].id, attributeIds: candidates[index].attributeIds, reasons: [selected.length >= maximumSelected ? "maximum site page count reached" : "not selected"] });
  }

  const vectorOffsets: Record<string, number> = {};
  const packedVectors = new Float32Array(selected.length * policy.hrrDimensions);
  let vectorParity = true;
  selected.forEach((region, index) => {
    const offset = index * policy.hrrDimensions;
    vectorOffsets[region.id] = offset;
    const source = required(selectedVectors, region.id);
    packedVectors.set(source, offset);
    const packed = packedVectors.subarray(offset, offset + policy.hrrDimensions);
    if (cosine(source, packed) <= 0.999999) vectorParity = false;
  });

  const findings = [
    finding("opportunity.seeds", "pass", "selection consumes graph-expanded regions derived from observed closed conjunctions"),
    finding("opportunity.expansion", "pass", `${candidates.length} bounded sparse candidates supplied`),
    finding("opportunity.eligibility", selected.every((item) => item.coherence >= policy.minimumCoherence && item.materialEffects.length >= policy.minimumMaterialEffects) ? "pass" : "fail", "all selected regions satisfy hard eligibility"),
    finding("opportunity.vsa", vectorParity && packedVectors.every(Number.isFinite) ? "pass" : "fail", `${selected.length} packed ${policy.hrrDimensions}-dimensional region vectors; vectors compiled once`),
    finding("opportunity.novelty", "pass", `${rejected.filter((item) => item.reasons.some((reason) => reason.startsWith("near-duplicate"))).length} near duplicates rejected; exact-only=${exactOnlyDuplicateScreen}`),
    finding("opportunity.selection", selected.length >= minimumSelected && selected.length <= maximumSelected ? "pass" : "fail", `selected=${selected.length}, required=${minimumSelected}..${maximumSelected}, discriminativeCoverageKeys=${featureWeights.size}`),
    finding("opportunity.scale", selected.length >= minimumSelected ? "pass" : "fail", `one site-generation plan contains ${selected.length} page regions; packedVectors=${packedVectors.byteLength} bytes`),
  ];
  const canonical = {
    ontologyId: ontology.id,
    candidateCount: candidates.length,
    selectedIds: selected.map((item) => item.id),
    rejected: rejected.sort((left, right) => left.id.localeCompare(right.id)),
    vectorOffsets: Object.fromEntries(Object.entries(vectorOffsets).sort(([left], [right]) => left.localeCompare(right))),
    vectorDimensions: policy.hrrDimensions,
    coverageCounts: Object.fromEntries([...coverageCounts.entries()].sort(([left], [right]) => left.localeCompare(right))),
    selector: "incremental-sparse-v1",
  };
  return {
    ontologyId: ontology.id,
    candidateCount: candidates.length,
    selectedRegions: selected,
    rejectedRegions: canonical.rejected,
    packedVectors,
    vectorOffsets: canonical.vectorOffsets,
    vectorDimensions: policy.hrrDimensions,
    coverageCounts: canonical.coverageCounts,
    selectionHash: sha256(JSON.stringify(canonical)),
    validation: buildValidationReport(`optimized-selected-opportunity-space:${ontology.id}`, OPPORTUNITY_VALIDATION, findings),
  };

  function marginalGain(region: OpportunityRegion): number {
    let gain = 0.05 * region.eligibilityScore;
    for (const key of region.coverageKeys) {
      const weight = featureWeights.get(key);
      if (weight === undefined) continue;
      const count = coverageCounts.get(key) ?? 0;
      gain += weight * (Math.sqrt(count + 1) - Math.sqrt(count));
    }
    return gain;
  }

  function compileRegionVector(region: OpportunityRegion): Vector {
    const features: FeatureMap = {};
    for (const id of region.attributeIds) {
      const attribute = required(attributeById, id);
      features[attribute.dimension] = attribute.id;
    }
    return compileHrrFeatures(features, policy.hrrDimensions, identity);
  }

  function findNearDuplicate(region: OpportunityRegion): { id: string; jaccard: number; hrr: number } | null {
    if (exactOnlyDuplicateScreen) {
      const existingIndex = exactDuplicateBySignature.get(duplicateSignature(region));
      if (existingIndex === undefined) return null;
      const existing = candidates[existingIndex];
      const regionVector = compileRegionVector(region);
      const hrr = cosine(regionVector, required(selectedVectors, existing.id));
      return hrr >= policy.duplicateHrrThreshold ? { id: existing.id, jaccard: 1, hrr } : null;
    }
    for (const existingIndex of fallbackBuckets.get(noveltyBucket(region)) ?? []) {
      const existing = candidates[existingIndex];
      const jaccard = sortedJaccard(region.attributeIds, existing.attributeIds);
      if (jaccard < policy.duplicateJaccardThreshold) continue;
      const regionVector = compileRegionVector(region);
      const hrr = cosine(regionVector, required(selectedVectors, existing.id));
      if (hrr >= policy.duplicateHrrThreshold) return { id: existing.id, jaccard, hrr };
    }
    return null;
  }

  function popValid(): HeapItem | undefined {
    while (heap.size > 0) {
      const item = heap.pop()!;
      if (selectedFlags[item.index] === 0 && versions[item.index] === item.version) return item;
    }
    return undefined;
  }
  function peekValid(): HeapItem | undefined {
    while (heap.size > 0) {
      const item = heap.peek()!;
      if (selectedFlags[item.index] === 0 && versions[item.index] === item.version) return item;
      heap.pop();
    }
    return undefined;
  }
}

function findingState(space: SelectedOpportunitySpace, id: string): ValidationState {
  return space.validation.findings.find((item) => item.attributeId === id)?.state ?? "fail";
}
function noveltyBucket(region: OpportunityRegion): string {
  return `${region.anchorIds.join("+")}::${Object.keys(region.dimensionValues).sort().join("+")}`;
}
function duplicateSignature(region: OpportunityRegion): string {
  return `${noveltyBucket(region)}::${region.attributeIds.join("\0")}`;
}
function sortedJaccard(left: readonly string[], right: readonly string[]): number {
  let leftIndex = 0;
  let rightIndex = 0;
  let intersection = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const comparison = left[leftIndex].localeCompare(right[rightIndex]);
    if (comparison === 0) { intersection += 1; leftIndex += 1; rightIndex += 1; }
    else if (comparison < 0) leftIndex += 1;
    else rightIndex += 1;
  }
  const union = left.length + right.length - intersection;
  return union === 0 ? 0 : intersection / union;
}
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`missing ${String(key)}`);
  return value;
}

type HeapItem = { index: number; regionId: string; gain: number; version: number };
class MaxHeap<T> {
  private readonly values: T[] = [];
  constructor(private readonly compare: (left: T, right: T) => number) {}
  get size(): number { return this.values.length; }
  peek(): T | undefined { return this.values[0]; }
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
