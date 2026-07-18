import { compileHrrFeatures, type FeatureMap, type VectorSpaceIdentity } from "./benchmark.js";
import { cosine, sha256, type Vector } from "./core.js";
import type { NormalizedProject } from "./project-input.js";
import type { ApprovedOntology, ApprovedOntologyAttribute, MaterialEffect } from "./ontology-discovery.js";
import { graphEdgeWeight, violatesOntologyConstraints, type CompiledOntologyGraph } from "./ontology-graph.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export interface OpportunitySpacePolicy {
  minimumSupportWeight: number;
  minimumRegionWidth: number;
  maximumRegionWidth: number;
  minimumCoherence: number;
  minimumMaterialEffects: number;
  neighborExpansionLimit: number;
  maximumCandidateRegions: number;
  minimumSelectedRegions?: number;
  maximumSelectedRegions?: number;
  minimumMarginalGain: number;
  duplicateJaccardThreshold: number;
  duplicateHrrThreshold: number;
  hrrDimensions: number;
}

export interface FrequentClosedItemset {
  attributeIds: readonly string[];
  supportWeight: number;
  observationIds: readonly string[];
}

export interface OpportunityRegion {
  id: string;
  attributeIds: readonly string[];
  dimensionValues: Readonly<Record<string, string>>;
  anchorIds: readonly string[];
  communityIds: readonly string[];
  materialEffects: readonly MaterialEffect[];
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  observationIds: readonly string[];
  supportWeight: number;
  supportRatio: number;
  coherence: number;
  eligibilityScore: number;
  coverageKeys: readonly string[];
  regionHash: string;
}

export interface RejectedOpportunityRegion {
  id: string;
  attributeIds: readonly string[];
  reasons: readonly string[];
}

export interface SelectedOpportunitySpace {
  ontologyId: string;
  candidateCount: number;
  selectedRegions: readonly OpportunityRegion[];
  rejectedRegions: readonly RejectedOpportunityRegion[];
  packedVectors: Float32Array;
  vectorOffsets: Readonly<Record<string, number>>;
  vectorDimensions: number;
  coverageCounts: Readonly<Record<string, number>>;
  selectionHash: string;
  validation: ValidationReport;
}

export interface CompiledOpportunitySpace {
  ontologyId: string;
  closedItemsets: readonly FrequentClosedItemset[];
  candidates: readonly OpportunityRegion[];
  selected: SelectedOpportunitySpace;
  spaceHash: string;
  validation: ValidationReport;
}

export const OPPORTUNITY_VALIDATION: readonly ValidationAttribute[] = [
  { id: "opportunity.seeds", feature: "Observed conjunction seeds", workflowStep: "construct-space", algorithmChoice: "bounded frequent closed itemsets over object-attribute observations", userEffect: "the first regions originate from researched situations rather than an unrestricted Cartesian product", developerEffect: "seed conjunctions are deterministic and support-weighted", validationVector: ["support", "closure", "maximum width", "observation IDs"], passVector: ["closed sets preserve observed conjunctions", "bounded width"], failVector: ["all combinations emitted", "observation support discarded", "exponential unbounded lattice"], simplerBaseline: "single attributes only", severity: "hard" },
  { id: "opportunity.expansion", feature: "Constrained region expansion", workflowStep: "construct-space", algorithmChoice: "best-first graph expansion with one value per dimension", userEffect: "the system explores reasonable unobserved combinations while remaining tied to approved graph structure", developerEffect: "candidate count and branching are bounded", validationVector: ["graph neighbors", "one value per dimension", "hard constraints", "candidate cap"], passVector: ["all candidates are connected expansions", "no dimension conflicts", "cap respected"], failVector: ["full Cartesian product", "cross-community random combination", "constraint violation"], simplerBaseline: "nested loops over all values", severity: "hard" },
  { id: "opportunity.eligibility", feature: "Region eligibility", workflowStep: "construct-space", algorithmChoice: "anchor + materiality + graph coherence + evidence + hard constraints", userEffect: "a page region must be both relevant to attribute nodes and capable of changing the page", developerEffect: "agents cannot create pages from mathematically possible but commercially meaningless points", validationVector: ["anchor", "material effects", "coherence", "evidence", "constraints"], passVector: ["all selected regions satisfy every hard gate"], failVector: ["unsupported tail point", "no page-changing effect", "weakly connected nodes"], simplerBaseline: "vector cosine threshold", severity: "hard" },
  { id: "opportunity.vsa", feature: "Compositional structural representation", workflowStep: "construct-space", algorithmChoice: "namespaced HRR role-filler vectors after sparse pruning", userEffect: "the accepted conjunction remains available as a fixed-width structural object", developerEffect: "all selected regions have packed vector parity and deterministic offsets", validationVector: ["namespace/version", "dimensions", "packed parity", "finite values"], passVector: ["one vector per selected region", "recompiled vectors match packed slices"], failVector: ["VSA used before eligibility", "missing region vector", "non-finite vector"], simplerBaseline: "attribute ID set only", severity: "hard" },
  { id: "opportunity.novelty", feature: "Nonredundant region admission", workflowStep: "select-space", algorithmChoice: "local weighted-Jaccard screen plus HRR confirmation", userEffect: "new pages occupy meaningfully different attribute space", developerEffect: "duplicate checks avoid global dense all-pairs comparison", validationVector: ["anchor bucket", "Jaccard", "HRR cosine", "rejection reason"], passVector: ["near duplicates rejected", "different structural regions retained"], failVector: ["same page concept repeated", "HNSW required before baseline", "O(n²) global scan"], simplerBaseline: "exact set equality", severity: "hard" },
  { id: "opportunity.selection", feature: "Sparse feature-coverage selection", workflowStep: "select-space", algorithmChoice: "lazy greedy concave-over-modular feature coverage", userEffect: "the finite site covers many useful nodes, pairs, communities, anchors, and material effects", developerEffect: "selection scales with sparse coverage keys rather than a dense candidate matrix", validationVector: ["minimum pages", "maximum pages", "marginal gain", "coverage counts", "determinism"], passVector: ["minimum site count reached", "maximum respected", "selected IDs stable"], failVector: ["page count below project contract", "dense quadratic facility matrix at 10k", "selection order changes output"], simplerBaseline: "sort by static score", severity: "hard" },
  { id: "opportunity.scale", feature: "One-shot large-site planning", workflowStep: "plan-site", algorithmChoice: "bounded sparse build producing page-region jobs for one site run", userEffect: "the user can request a complete 10,000+ page site generation project", developerEffect: "planning is separated from runtime serving and model execution", validationVector: ["selected count", "packed bytes", "candidate cap", "build timing", "single-site identity"], passVector: ["declared minimum reached", "artifacts remain bounded", "no request-time dependency"], failVector: ["10k means concurrent live sessions", "always-on VPS assumed", "page minimum silently reduced"], simplerBaseline: "small demo corpus", severity: "hard" },
];

export const DEFAULT_OPPORTUNITY_POLICY: OpportunitySpacePolicy = {
  minimumSupportWeight: 1,
  minimumRegionWidth: 3,
  maximumRegionWidth: 7,
  minimumCoherence: 0.12,
  minimumMaterialEffects: 2,
  neighborExpansionLimit: 24,
  maximumCandidateRegions: 30_000,
  minimumMarginalGain: 0,
  duplicateJaccardThreshold: 0.88,
  duplicateHrrThreshold: 0.96,
  hrrDimensions: 128,
};

export function compileOpportunitySpace(
  project: NormalizedProject,
  ontology: ApprovedOntology,
  graph: CompiledOntologyGraph,
  identity: VectorSpaceIdentity,
  policy: OpportunitySpacePolicy = DEFAULT_OPPORTUNITY_POLICY,
): CompiledOpportunitySpace {
  validatePolicy(policy);
  const minimumSelected = policy.minimumSelectedRegions ?? project.input.goals.minimumInitialPages ?? 1;
  const maximumSelected = Math.min(policy.maximumSelectedRegions ?? project.input.goals.maximumInitialPages, project.input.goals.maximumInitialPages);
  if (minimumSelected > maximumSelected) throw new Error("opportunity selection minimum exceeds maximum");
  const closedItemsets = mineFrequentClosedItemsets(ontology, policy.minimumSupportWeight, policy.maximumRegionWidth);
  const candidates = generateOpportunityRegions(ontology, graph, closedItemsets, policy);
  const selected = selectOpportunityRegions(project, ontology, graph, candidates, identity, { ...policy, minimumSelectedRegions: minimumSelected, maximumSelectedRegions: maximumSelected });
  const findings = [
    finding("opportunity.seeds", closedItemsets.length > 0 ? "pass" : "fail", `${closedItemsets.length} bounded frequent closed itemsets`),
    finding("opportunity.expansion", candidates.length <= policy.maximumCandidateRegions && candidates.length > 0 ? "pass" : "fail", `${candidates.length}/${policy.maximumCandidateRegions} candidate regions`),
    finding("opportunity.eligibility", candidates.every((item) => item.coherence >= policy.minimumCoherence && item.materialEffects.length >= policy.minimumMaterialEffects && item.anchorIds.length > 0) ? "pass" : "fail", "all emitted candidates satisfy region hard gates"),
    finding("opportunity.vsa", selected.validation.findings.find((item) => item.attributeId === "opportunity.vsa")?.state ?? "fail", "selected-space vector validation propagated"),
    finding("opportunity.novelty", selected.validation.findings.find((item) => item.attributeId === "opportunity.novelty")?.state ?? "fail", "selected-space novelty validation propagated"),
    finding("opportunity.selection", selected.validation.findings.find((item) => item.attributeId === "opportunity.selection")?.state ?? "fail", "selected-space coverage validation propagated"),
    finding("opportunity.scale", selected.validation.findings.find((item) => item.attributeId === "opportunity.scale")?.state ?? "fail", "selected-space scale validation propagated"),
  ];
  const canonical = { ontologyId: ontology.id, closedItemsets, candidateHashes: candidates.map((item) => item.regionHash), selectionHash: selected.selectionHash };
  return { ontologyId: ontology.id, closedItemsets, candidates, selected, spaceHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`opportunity-space:${ontology.id}`, OPPORTUNITY_VALIDATION, findings) };
}

export function mineFrequentClosedItemsets(
  ontology: ApprovedOntology,
  minimumSupportWeight: number,
  maximumWidth: number,
): FrequentClosedItemset[] {
  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const support = new Map<string, { attributeIds: string[]; supportWeight: number; observationIds: Set<string> }>();
  for (const observation of ontology.observations) {
    const ids = observation.attributeIds.filter((id) => attributeById.has(id)).sort();
    for (let width = 1; width <= Math.min(maximumWidth, ids.length); width += 1) {
      for (const combination of combinations(ids, width)) {
        if (hasDimensionConflict(combination, attributeById)) continue;
        const key = combination.join("\0");
        const current = support.get(key) ?? { attributeIds: combination, supportWeight: 0, observationIds: new Set<string>() };
        current.supportWeight += observation.weight;
        current.observationIds.add(observation.id);
        support.set(key, current);
      }
    }
  }
  const frequent = [...support.values()].filter((item) => item.supportWeight >= minimumSupportWeight)
    .map((item) => ({ attributeIds: item.attributeIds, supportWeight: item.supportWeight, observationIds: [...item.observationIds].sort() }));
  return frequent.filter((item) => !frequent.some((other) => other.attributeIds.length > item.attributeIds.length && Math.abs(other.supportWeight - item.supportWeight) < 1e-9 && isSubset(item.attributeIds, other.attributeIds)))
    .sort((left, right) => right.supportWeight - left.supportWeight || right.attributeIds.length - left.attributeIds.length || left.attributeIds.join("\0").localeCompare(right.attributeIds.join("\0")));
}

export function generateOpportunityRegions(
  ontology: ApprovedOntology,
  graph: CompiledOntologyGraph,
  seeds: readonly FrequentClosedItemset[],
  policy: OpportunitySpacePolicy,
): OpportunityRegion[] {
  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const communityByAttribute = new Map<string, string>();
  for (const community of graph.communities) for (const id of community.attributeIds) communityByAttribute.set(id, community.id);
  const anchorIds = new Set(ontology.attributes.filter((item) => item.anchorKind).map((item) => item.id));
  const totalObservationWeight = ontology.observations.reduce((sum, item) => sum + item.weight, 0) || 1;
  const heap = new MaxHeap<SearchState>((left, right) => left.score - right.score || right.signature.localeCompare(left.signature));
  const visited = new Set<string>();
  const output = new Map<string, OpportunityRegion>();

  const seedSets = [
    ...seeds.filter((item) => item.attributeIds.some((id) => anchorIds.has(id))).map((item) => item.attributeIds),
    ...[...anchorIds].sort().map((id) => [id]),
  ];
  for (const ids of seedSets) pushState(ids);

  while (heap.size > 0 && output.size < policy.maximumCandidateRegions) {
    const state = heap.pop()!;
    if (isEligibleState(state.attributeIds)) {
      const region = materializeRegion(state.attributeIds);
      output.set(region.id, region);
    }
    if (state.attributeIds.length >= policy.maximumRegionWidth) continue;
    const candidates = expansionCandidates(state.attributeIds)
      .map((id) => ({ id, score: incrementalScore(state.attributeIds, id) }))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
      .slice(0, policy.neighborExpansionLimit);
    for (const candidate of candidates) pushState([...state.attributeIds, candidate.id]);
  }
  return [...output.values()].sort((left, right) => right.eligibilityScore - left.eligibilityScore || left.id.localeCompare(right.id));

  function pushState(inputIds: readonly string[]): void {
    const ids = [...new Set(inputIds)].sort();
    if (ids.length === 0 || ids.length > policy.maximumRegionWidth || hasDimensionConflict(ids, attributeById)) return;
    if (violatesOntologyConstraints(graph, ids).length > 0) return;
    const signature = ids.join("\0");
    if (visited.has(signature)) return;
    visited.add(signature);
    const region = summarize(ids);
    heap.push({ attributeIds: ids, signature, score: region.score });
  }
  function expansionCandidates(ids: readonly string[]): string[] {
    const used = new Set(ids);
    const usedDimensions = new Set(ids.map((id) => required(attributeById, id).dimension));
    const candidates = new Set<string>();
    for (const id of ids) for (const neighbor of graph.adjacency[id] ?? []) if (graph.activeNodeIds.includes(neighbor)) candidates.add(neighbor);
    return [...candidates].filter((id) => !used.has(id) && !usedDimensions.has(required(attributeById, id).dimension));
  }
  function incrementalScore(ids: readonly string[], candidateId: string): number {
    const weights = ids.map((id) => graphEdgeWeight(graph, id, candidateId));
    const average = weights.length === 0 ? 0 : weights.reduce((sum, value) => sum + value, 0) / weights.length;
    const attribute = required(attributeById, candidateId);
    return 0.65 * average + 0.2 * Math.min(1, attribute.materialEffects.length / 4) + 0.15 * attribute.confidence;
  }
  function isEligibleState(ids: readonly string[]): boolean {
    if (ids.length < policy.minimumRegionWidth) return false;
    const summary = summarize(ids);
    return summary.anchorIds.length > 0
      && summary.materialEffects.length >= policy.minimumMaterialEffects
      && summary.coherence >= policy.minimumCoherence
      && summary.evidenceIds.length > 0
      && violatesOntologyConstraints(graph, ids).length === 0;
  }
  function summarize(ids: readonly string[]): RegionSummary {
    const attributes = ids.map((id) => required(attributeById, id));
    const anchorIdsLocal = attributes.filter((item) => item.anchorKind).map((item) => item.id).sort();
    const materialEffects = [...new Set(attributes.flatMap((item) => item.materialEffects))].sort() as MaterialEffect[];
    const evidenceIds = [...new Set(attributes.flatMap((item) => item.evidenceIds))].sort();
    const sourceIds = [...new Set(attributes.flatMap((item) => item.sourceIds))].sort();
    const observationMatches = ontology.observations.filter((observation) => isSubset(ids, observation.attributeIds));
    const supportWeight = observationMatches.reduce((sum, observation) => sum + observation.weight, 0);
    const supportRatio = supportWeight / totalObservationWeight;
    const pairWeights: number[] = [];
    for (let left = 0; left < ids.length; left += 1) for (let right = left + 1; right < ids.length; right += 1) pairWeights.push(graphEdgeWeight(graph, ids[left], ids[right]));
    const coherence = pairWeights.length === 0 ? 0 : pairWeights.reduce((sum, value) => sum + value, 0) / pairWeights.length;
    const score = 0.4 * coherence + 0.2 * Math.min(1, supportRatio) + 0.2 * Math.min(1, materialEffects.length / 5) + 0.1 * Math.min(1, anchorIdsLocal.length / 2) + 0.1 * mean(attributes.map((item) => item.confidence));
    return { attributes, anchorIds: anchorIdsLocal, materialEffects, evidenceIds, sourceIds, observationIds: observationMatches.map((item) => item.id).sort(), supportWeight, supportRatio, coherence, score };
  }
  function materializeRegion(ids: readonly string[]): OpportunityRegion {
    const summary = summarize(ids);
    const dimensionValues = Object.fromEntries(summary.attributes.map((item) => [item.dimension, item.id]).sort(([left], [right]) => left.localeCompare(right)));
    const communityIds = [...new Set(ids.map((id) => communityByAttribute.get(id)).filter((id): id is string => Boolean(id)))].sort();
    const coverageKeys = regionCoverageKeys(ids, summary.materialEffects, summary.anchorIds, communityIds, graph);
    const canonical = { attributeIds: [...ids], dimensionValues, anchorIds: summary.anchorIds, communityIds, materialEffects: summary.materialEffects, evidenceIds: summary.evidenceIds, sourceIds: summary.sourceIds, observationIds: summary.observationIds, supportWeight: summary.supportWeight, supportRatio: summary.supportRatio, coherence: summary.coherence, eligibilityScore: summary.score, coverageKeys };
    const regionHash = sha256(JSON.stringify(canonical));
    return { id: `region:${regionHash.slice(0, 20)}`, ...canonical, regionHash };
  }
}

export function selectOpportunityRegions(
  project: NormalizedProject,
  ontology: ApprovedOntology,
  graph: CompiledOntologyGraph,
  candidates: readonly OpportunityRegion[],
  identity: VectorSpaceIdentity,
  policy: OpportunitySpacePolicy,
): SelectedOpportunitySpace {
  const minimumSelected = policy.minimumSelectedRegions ?? project.input.goals.minimumInitialPages ?? 1;
  const maximumSelected = Math.min(policy.maximumSelectedRegions ?? project.input.goals.maximumInitialPages, project.input.goals.maximumInitialPages);
  const featureFrequency = new Map<string, number>();
  for (const candidate of candidates) for (const key of candidate.coverageKeys) featureFrequency.set(key, (featureFrequency.get(key) ?? 0) + 1);
  const featureWeights = new Map([...featureFrequency.entries()].map(([key, frequency]) => [key, Math.log(1 + candidates.length / frequency)]));
  const selected: OpportunityRegion[] = [];
  const rejected: RejectedOpportunityRegion[] = [];
  const coverageCounts = new Map<string, number>();
  const selectedVectors = new Map<string, Vector>();
  const buckets = new Map<string, OpportunityRegion[]>();
  const heap = new MaxHeap<ScoredCandidate>((left, right) => left.gain - right.gain || right.region.id.localeCompare(left.region.id));
  for (const region of candidates) heap.push({ region, gain: marginalGain(region), revision: 0 });
  let revision = 0;

  while (heap.size > 0 && selected.length < maximumSelected) {
    const item = heap.pop()!;
    const currentGain = marginalGain(item.region);
    const next = heap.peek();
    if (item.revision !== revision || Math.abs(currentGain - item.gain) > 1e-12) {
      heap.push({ region: item.region, gain: currentGain, revision });
      continue;
    }
    if (selected.length >= minimumSelected && currentGain < policy.minimumMarginalGain) {
      rejected.push({ id: item.region.id, attributeIds: item.region.attributeIds, reasons: [`marginal coverage ${currentGain.toFixed(6)} below ${policy.minimumMarginalGain}`] });
      continue;
    }
    const duplicate = findNearDuplicate(item.region);
    if (duplicate) {
      rejected.push({ id: item.region.id, attributeIds: item.region.attributeIds, reasons: [`near-duplicate of ${duplicate.id}: jaccard=${duplicate.jaccard.toFixed(4)}, hrr=${duplicate.hrr.toFixed(4)}`] });
      continue;
    }
    selected.push(item.region);
    for (const key of item.region.coverageKeys) coverageCounts.set(key, (coverageCounts.get(key) ?? 0) + 1);
    const vector = compileRegionVector(item.region, ontology, policy.hrrDimensions, identity);
    selectedVectors.set(item.region.id, vector);
    const bucket = noveltyBucket(item.region);
    const bucketRegions = buckets.get(bucket) ?? [];
    bucketRegions.push(item.region);
    buckets.set(bucket, bucketRegions);
    revision += 1;
  }
  while (heap.size > 0) {
    const item = heap.pop()!;
    rejected.push({ id: item.region.id, attributeIds: item.region.attributeIds, reasons: [selected.length >= maximumSelected ? "maximum site page count reached" : "not selected"] });
  }
  if (selected.length < minimumSelected) {
    throw new Error(`opportunity space produced ${selected.length} selected regions; project requires at least ${minimumSelected}`);
  }

  const vectorOffsets: Record<string, number> = {};
  const packedVectors = new Float32Array(selected.length * policy.hrrDimensions);
  selected.forEach((region, index) => {
    vectorOffsets[region.id] = index * policy.hrrDimensions;
    const vector = required(selectedVectors, region.id);
    packedVectors.set(vector, index * policy.hrrDimensions);
  });
  const vectorParity = selected.every((region) => {
    const expected = compileRegionVector(region, ontology, policy.hrrDimensions, identity);
    const offset = vectorOffsets[region.id];
    const actual = packedVectors.subarray(offset, offset + policy.hrrDimensions);
    return cosine(expected, actual) > 0.999999;
  });
  const findings = [
    finding("opportunity.seeds", "pass", "selection consumes graph-expanded regions derived from observed closed conjunctions"),
    finding("opportunity.expansion", "pass", `${candidates.length} bounded sparse candidates supplied`),
    finding("opportunity.eligibility", selected.every((item) => item.coherence >= policy.minimumCoherence && item.materialEffects.length >= policy.minimumMaterialEffects) ? "pass" : "fail", "all selected regions satisfy hard eligibility"),
    finding("opportunity.vsa", vectorParity && packedVectors.every(Number.isFinite) ? "pass" : "fail", `${selected.length} packed ${policy.hrrDimensions}-dimensional region vectors`),
    finding("opportunity.novelty", "pass", `${rejected.filter((item) => item.reasons.some((reason) => reason.startsWith("near-duplicate"))).length} near duplicates rejected with local sparse+HRR confirmation`),
    finding("opportunity.selection", selected.length >= minimumSelected && selected.length <= maximumSelected ? "pass" : "fail", `selected=${selected.length}, required=${minimumSelected}..${maximumSelected}, coverageKeys=${coverageCounts.size}`),
    finding("opportunity.scale", selected.length >= minimumSelected ? "pass" : "fail", `one site-generation plan contains ${selected.length} page regions; packedVectors=${packedVectors.byteLength} bytes`),
  ];
  const canonical = { ontologyId: ontology.id, candidateCount: candidates.length, selectedIds: selected.map((item) => item.id), rejected, vectorOffsets: Object.fromEntries(Object.entries(vectorOffsets).sort(([left], [right]) => left.localeCompare(right))), vectorDimensions: policy.hrrDimensions, coverageCounts: Object.fromEntries([...coverageCounts.entries()].sort(([left], [right]) => left.localeCompare(right))) };
  return { ontologyId: ontology.id, candidateCount: candidates.length, selectedRegions: selected, rejectedRegions: rejected.sort((left, right) => left.id.localeCompare(right.id)), packedVectors, vectorOffsets: canonical.vectorOffsets, vectorDimensions: policy.hrrDimensions, coverageCounts: canonical.coverageCounts, selectionHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`selected-opportunity-space:${ontology.id}`, OPPORTUNITY_VALIDATION, findings) };

  function marginalGain(region: OpportunityRegion): number {
    return region.coverageKeys.reduce((sum, key) => {
      const count = coverageCounts.get(key) ?? 0;
      const weight = featureWeights.get(key) ?? 0;
      return sum + weight * (Math.sqrt(count + 1) - Math.sqrt(count));
    }, 0) + 0.05 * region.eligibilityScore;
  }
  function findNearDuplicate(region: OpportunityRegion): { id: string; jaccard: number; hrr: number } | null {
    const bucket = buckets.get(noveltyBucket(region)) ?? [];
    for (const existing of bucket) {
      const jaccard = setJaccard(region.attributeIds, existing.attributeIds);
      if (jaccard < policy.duplicateJaccardThreshold) continue;
      const regionVector = compileRegionVector(region, ontology, policy.hrrDimensions, identity);
      const existingVector = required(selectedVectors, existing.id);
      const hrr = cosine(regionVector, existingVector);
      if (hrr >= policy.duplicateHrrThreshold) return { id: existing.id, jaccard, hrr };
    }
    return null;
  }
}

function compileRegionVector(region: OpportunityRegion, ontology: ApprovedOntology, dimensions: number, identity: VectorSpaceIdentity): Vector {
  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const features: FeatureMap = {};
  for (const id of region.attributeIds) {
    const attribute = required(attributeById, id);
    features[attribute.dimension] = attribute.id;
  }
  return compileHrrFeatures(features, dimensions, identity);
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
function noveltyBucket(region: OpportunityRegion): string { return `${region.anchorIds.join("+")}::${Object.keys(region.dimensionValues).sort().join("+")}`; }
function hasDimensionConflict(ids: readonly string[], attributes: ReadonlyMap<string, ApprovedOntologyAttribute>): boolean { const dimensions = new Set<string>(); for (const id of ids) { const dimension = required(attributes, id).dimension; if (dimensions.has(dimension)) return true; dimensions.add(dimension); } return false; }
function setJaccard(left: readonly string[], right: readonly string[]): number { const leftSet = new Set(left); const rightSet = new Set(right); const intersection = [...leftSet].filter((value) => rightSet.has(value)).length; const union = new Set([...leftSet, ...rightSet]).size; return union === 0 ? 0 : intersection / union; }
function isSubset(left: readonly string[], right: readonly string[]): boolean { const rightSet = new Set(right); return left.every((value) => rightSet.has(value)); }
function combinations(values: readonly string[], width: number): string[][] { const output: string[][] = []; const visit = (start: number, chosen: string[]) => { if (chosen.length === width) { output.push([...chosen]); return; } for (let index = start; index <= values.length - (width - chosen.length); index += 1) { chosen.push(values[index]); visit(index + 1, chosen); chosen.pop(); } }; visit(0, []); return output; }
function mean(values: readonly number[]): number { return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length; }
function validatePolicy(policy: OpportunitySpacePolicy): void {
  if (![policy.minimumCoherence, policy.duplicateJaccardThreshold, policy.duplicateHrrThreshold].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error("opportunity similarity thresholds must be within [0,1]");
  if (!Number.isFinite(policy.minimumSupportWeight) || policy.minimumSupportWeight < 0 || !Number.isFinite(policy.minimumMarginalGain) || policy.minimumMarginalGain < 0) throw new Error("opportunity support/marginal policies are invalid");
  for (const value of [policy.minimumRegionWidth, policy.maximumRegionWidth, policy.minimumMaterialEffects, policy.neighborExpansionLimit, policy.maximumCandidateRegions, policy.hrrDimensions]) if (!Number.isInteger(value) || value < 1) throw new Error("opportunity integer policy is invalid");
  if (policy.minimumRegionWidth > policy.maximumRegionWidth) throw new Error("opportunity minimumRegionWidth exceeds maximumRegionWidth");
}
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V { const value = map.get(key); if (value === undefined) throw new Error(`missing ${String(key)}`); return value; }

type SearchState = { attributeIds: readonly string[]; signature: string; score: number };
type ScoredCandidate = { region: OpportunityRegion; gain: number; revision: number };
type RegionSummary = { attributes: readonly ApprovedOntologyAttribute[]; anchorIds: string[]; materialEffects: MaterialEffect[]; evidenceIds: string[]; sourceIds: string[]; observationIds: string[]; supportWeight: number; supportRatio: number; coherence: number; score: number };

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
  private bubbleUp(index: number): void { while (index > 0) { const parent = Math.floor((index - 1) / 2); if (this.compare(this.values[index], this.values[parent]) <= 0) break; [this.values[index], this.values[parent]] = [this.values[parent], this.values[index]]; index = parent; } }
  private bubbleDown(index: number): void { while (true) { const left = index * 2 + 1; const right = left + 1; let best = index; if (left < this.values.length && this.compare(this.values[left], this.values[best]) > 0) best = left; if (right < this.values.length && this.compare(this.values[right], this.values[best]) > 0) best = right; if (best === index) break; [this.values[index], this.values[best]] = [this.values[best], this.values[index]]; index = best; } }
}
