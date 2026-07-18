import type { VectorSpaceIdentity } from "./benchmark.js";
import { sha256 } from "./core.js";
import type { NormalizedProject } from "./project-input.js";
import type { ApprovedOntology } from "./ontology-discovery.js";
import type { CompiledOntologyGraph } from "./ontology-graph.js";
import { generateOpportunityRegionsOptimized } from "./opportunity-generation-optimized.js";
import { selectOpportunityRegionsIncremental } from "./opportunity-space-optimized.js";
import {
  mineFrequentClosedItemsets,
  OPPORTUNITY_VALIDATION,
  type CompiledOpportunitySpace,
  type OpportunitySpacePolicy,
  type SelectedOpportunitySpace,
} from "./opportunity-space.js";
import { buildValidationReport, finding, type ValidationState } from "./validation-contracts.js";

export function compileProductionOpportunitySpace(
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
  const candidates = generateOpportunityRegionsOptimized(ontology, graph, closedItemsets, policy);
  const selected = selectOpportunityRegionsIncremental(project, ontology, candidates, identity, {
    ...policy,
    minimumSelectedRegions: minimumSelected,
    maximumSelectedRegions: maximumSelected,
  });
  const findings = [
    finding("opportunity.seeds", closedItemsets.length > 0 ? "pass" : "fail", `${closedItemsets.length} bounded frequent closed itemsets`),
    finding("opportunity.expansion", candidates.length > 0 && candidates.length <= policy.maximumCandidateRegions ? "pass" : "fail", `${candidates.length}/${policy.maximumCandidateRegions} candidates from cached constrained expansion`),
    finding("opportunity.eligibility", candidates.every((item) => item.coherence >= policy.minimumCoherence && item.materialEffects.length >= policy.minimumMaterialEffects && item.anchorIds.length > 0) ? "pass" : "fail", "all emitted candidates satisfy region hard gates"),
    finding("opportunity.vsa", state(selected, "opportunity.vsa"), "packed HRR validation propagated"),
    finding("opportunity.novelty", state(selected, "opportunity.novelty"), "sparse novelty validation propagated"),
    finding("opportunity.selection", state(selected, "opportunity.selection"), "incremental concave coverage validation propagated"),
    finding("opportunity.scale", state(selected, "opportunity.scale"), "one-shot site-scale validation propagated"),
  ];
  const canonical = {
    ontologyId: ontology.id,
    closedItemsets,
    candidateHashes: candidates.map((item) => item.regionHash),
    selectionHash: selected.selectionHash,
    generator: "cached-constrained-v1",
    selector: "incremental-sparse-v1",
  };
  return {
    ontologyId: ontology.id,
    closedItemsets,
    candidates,
    selected,
    spaceHash: sha256(JSON.stringify(canonical)),
    validation: buildValidationReport(`production-opportunity-space:${ontology.id}`, OPPORTUNITY_VALIDATION, findings),
  };
}

function state(space: SelectedOpportunitySpace, id: string): ValidationState {
  return space.validation.findings.find((item) => item.attributeId === id)?.state ?? "fail";
}
