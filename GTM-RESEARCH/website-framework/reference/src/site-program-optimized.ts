import { sha256 } from "./core.js";
import type { NormalizedProject } from "./project-input.js";
import type { ApprovedOntology } from "./ontology-discovery.js";
import type { OpportunityRegion, SelectedOpportunitySpace } from "./opportunity-space.js";
import {
  SITE_PROGRAM_VALIDATION,
  type PageConceptJob,
  type SiteGenerationBatch,
  type SiteGenerationPlan,
  type SiteGenerationPolicy,
} from "./site-program.js";
import { buildValidationReport, finding } from "./validation-contracts.js";

export interface SparseSiteGenerationPolicy extends SiteGenerationPolicy {
  /** Maximum unique neighbor candidates inspected per page region. */
  neighborCandidateBudget?: number;
  /** Ignore postings larger than this corpus ratio when rarer keys exist. */
  maximumNeighborPostingRatio?: number;
}

export const DEFAULT_SPARSE_SITE_GENERATION_POLICY: SparseSiteGenerationPolicy = {
  pageConceptBatchSize: 25,
  nearbyRegionLimit: 8,
  minimumSharedCoverageKeys: 2,
  requireUtilityOrInformationObject: true,
  neighborCandidateBudget: 512,
  maximumNeighborPostingRatio: 0.025,
};

/**
 * Builds the one-site generation plan using bounded sparse neighbor retrieval.
 *
 * Neighbor context is advisory input to the page-concept agent, not corpus
 * authority. Therefore the planner deliberately ignores universal/common
 * postings and caps the local candidate pool instead of performing an exact
 * all-pairs nearest-neighbor pass.
 */
export function compileSparseSiteGenerationPlan(
  project: NormalizedProject,
  ontology: ApprovedOntology,
  opportunity: SelectedOpportunitySpace,
  inputPolicy: SparseSiteGenerationPolicy = DEFAULT_SPARSE_SITE_GENERATION_POLICY,
): SiteGenerationPlan {
  const policy = normalizePolicy(inputPolicy);
  const minimumPages = project.input.goals.minimumInitialPages ?? 1;
  const maximumPages = project.input.goals.maximumInitialPages;
  if (opportunity.selectedRegions.length < minimumPages || opportunity.selectedRegions.length > maximumPages) {
    throw new Error(`selected opportunity space count ${opportunity.selectedRegions.length} violates project bounds ${minimumPages}..${maximumPages}`);
  }

  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const regionById = new Map(opportunity.selectedRegions.map((item) => [item.id, item]));
  const postings = buildCoveragePostings(opportunity.selectedRegions);
  const siteRunId = `site-run:${project.input.id}:${opportunity.selectionHash.slice(0, 16)}`;
  const pageConceptJobs: PageConceptJob[] = [];

  for (const region of opportunity.selectedRegions) {
    const nearbyRegionIds = nearestRegionsBounded(region, regionById, postings, opportunity.selectedRegions.length, policy);
    const attributes = region.attributeIds.map((id) => {
      const attribute = required(attributeById, id);
      return {
        id,
        dimension: attribute.dimension,
        label: attribute.label,
        description: attribute.description,
        materialEffects: attribute.materialEffects,
        ...(attribute.anchorKind === undefined ? {} : { anchorKind: attribute.anchorKind }),
      };
    }).sort((left, right) => left.dimension.localeCompare(right.dimension) || left.id.localeCompare(right.id));
    const canonical = {
      id: `page-concept-job:${region.id}`,
      siteRunId,
      regionId: region.id,
      regionHash: region.regionHash,
      attributes,
      anchorIds: region.anchorIds,
      nearbyRegionIds,
      materialEffects: region.materialEffects,
      evidenceIds: region.evidenceIds,
      sourceIds: region.sourceIds,
      requiredOutputs: ["canonical-question", "intent", "route", "information-object", "utility-task", "graph-role", "conversion-path", "semantic-modules", "ui-capabilities"] as const,
      publicationGate: "research" as const,
    };
    pageConceptJobs.push({ ...canonical, jobHash: sha256(JSON.stringify(canonical)) });
  }
  pageConceptJobs.sort((left, right) => left.id.localeCompare(right.id));

  const batches: SiteGenerationBatch[] = [];
  for (let offset = 0, index = 0; offset < pageConceptJobs.length; offset += policy.pageConceptBatchSize, index += 1) {
    const pageConceptJobIds = pageConceptJobs.slice(offset, offset + policy.pageConceptBatchSize).map((item) => item.id);
    const canonical = { id: `site-batch:${String(index + 1).padStart(5, "0")}`, index, pageConceptJobIds };
    batches.push({ ...canonical, batchHash: sha256(JSON.stringify(canonical)) });
  }

  const assignedIds = batches.flatMap((batch) => batch.pageConceptJobIds);
  const findings = [
    finding("site-program.stage-boundary", pageConceptJobs.length === opportunity.selectedRegions.length ? "pass" : "fail", `${pageConceptJobs.length} region-bound page concept jobs`),
    finding("site-program.neighborhood", pageConceptJobs.every((job) => job.nearbyRegionIds.length <= policy.nearbyRegionLimit && job.nearbyRegionIds.every((id) => regionById.has(id))) ? "pass" : "fail", `bounded sparse neighbors: limit=${policy.nearbyRegionLimit}, candidateBudget=${policy.neighborCandidateBudget}, postingRatio=${policy.maximumNeighborPostingRatio}`),
    finding("site-program.batch", assignedIds.length === pageConceptJobs.length && new Set(assignedIds).size === pageConceptJobs.length && pageConceptJobs.length >= minimumPages ? "pass" : "fail", `${batches.length} deterministic batches cover ${pageConceptJobs.length} jobs exactly once`),
  ];
  const canonical = {
    id: siteRunId,
    projectId: project.input.id,
    ontologyId: ontology.id,
    opportunitySelectionHash: opportunity.selectionHash,
    minimumPages,
    maximumPages,
    pageConceptJobs,
    batches,
    neighborPlanner: "bounded-sparse-v1",
  };
  return {
    id: siteRunId,
    projectId: project.input.id,
    ontologyId: ontology.id,
    opportunitySelectionHash: opportunity.selectionHash,
    minimumPages,
    maximumPages,
    pageConceptJobs,
    batches,
    planHash: sha256(JSON.stringify(canonical)),
    validation: buildValidationReport(`sparse-site-generation-plan:${siteRunId}`, SITE_PROGRAM_VALIDATION.slice(0, 3), findings),
  };
}

function buildCoveragePostings(regions: readonly OpportunityRegion[]): Map<string, string[]> {
  const postings = new Map<string, string[]>();
  for (const region of regions) {
    for (const key of region.coverageKeys) {
      const ids = postings.get(key) ?? [];
      ids.push(region.id);
      postings.set(key, ids);
    }
  }
  for (const ids of postings.values()) ids.sort();
  return postings;
}

function nearestRegionsBounded(
  region: OpportunityRegion,
  regionById: ReadonlyMap<string, OpportunityRegion>,
  postings: ReadonlyMap<string, readonly string[]>,
  corpusSize: number,
  policy: Required<SparseSiteGenerationPolicy>,
): string[] {
  if (policy.nearbyRegionLimit === 0) return [];
  const maximumPostingLength = Math.max(
    policy.nearbyRegionLimit * 4,
    Math.floor(corpusSize * policy.maximumNeighborPostingRatio),
  );
  const keys = [...region.coverageKeys].sort((left, right) => {
    const leftLength = postings.get(left)?.length ?? 0;
    const rightLength = postings.get(right)?.length ?? 0;
    return leftLength - rightLength || left.localeCompare(right);
  });
  const eligibleKeys = keys.filter((key) => (postings.get(key)?.length ?? 0) <= maximumPostingLength);
  const searchKeys = eligibleKeys.length > 0 ? eligibleKeys : keys.slice(0, 1);
  const sharedCounts = new Map<string, number>();
  let postingsVisited = 0;

  for (const key of searchKeys) {
    const ids = postings.get(key) ?? [];
    if (postingsVisited > 0 && postingsVisited + ids.length > policy.neighborCandidateBudget * 2) break;
    postingsVisited += ids.length;
    for (const id of ids) {
      if (id === region.id) continue;
      if (!sharedCounts.has(id) && sharedCounts.size >= policy.neighborCandidateBudget) continue;
      sharedCounts.set(id, (sharedCounts.get(id) ?? 0) + 1);
    }
    if (sharedCounts.size >= policy.neighborCandidateBudget) break;
  }

  const ranked: NeighborScore[] = [];
  for (const [id, shared] of sharedCounts) {
    if (shared < policy.minimumSharedCoverageKeys) continue;
    const other = required(regionById, id);
    ranked.push({ id, shared, jaccard: sortedJaccard(region.attributeIds, other.attributeIds) });
  }
  ranked.sort((left, right) => right.shared - left.shared || right.jaccard - left.jaccard || left.id.localeCompare(right.id));
  return ranked.slice(0, policy.nearbyRegionLimit).map((item) => item.id);
}

function normalizePolicy(input: SparseSiteGenerationPolicy): Required<SparseSiteGenerationPolicy> {
  const policy = {
    ...DEFAULT_SPARSE_SITE_GENERATION_POLICY,
    ...input,
  } as Required<SparseSiteGenerationPolicy>;
  if (!Number.isInteger(policy.pageConceptBatchSize) || policy.pageConceptBatchSize < 1) throw new Error("pageConceptBatchSize must be a positive integer");
  if (!Number.isInteger(policy.nearbyRegionLimit) || policy.nearbyRegionLimit < 0) throw new Error("nearbyRegionLimit must be a non-negative integer");
  if (!Number.isInteger(policy.minimumSharedCoverageKeys) || policy.minimumSharedCoverageKeys < 1) throw new Error("minimumSharedCoverageKeys must be positive");
  if (!Number.isInteger(policy.neighborCandidateBudget) || policy.neighborCandidateBudget < Math.max(1, policy.nearbyRegionLimit)) throw new Error("neighborCandidateBudget must be at least nearbyRegionLimit");
  if (!Number.isFinite(policy.maximumNeighborPostingRatio) || policy.maximumNeighborPostingRatio <= 0 || policy.maximumNeighborPostingRatio > 1) throw new Error("maximumNeighborPostingRatio must be within (0,1]");
  return policy;
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
type NeighborScore = { id: string; shared: number; jaccard: number };
