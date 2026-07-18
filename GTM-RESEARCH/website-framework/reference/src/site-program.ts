import { sha256 } from "./core.js";
import type { DesignCapability } from "./benchmark.js";
import type { LayoutRole, ModuleKind } from "./framework.js";
import type { ManifestFeatureAtom, ManifestPrototype } from "./manifest.js";
import type { CandidatePageSeed } from "./page-coordinate.js";
import type { NormalizedProject } from "./project-input.js";
import type { ApprovedOntology, ApprovedOntologyAttribute, MaterialEffect } from "./ontology-discovery.js";
import type { OpportunityRegion, SelectedOpportunitySpace } from "./opportunity-space.js";
import type { TypedGraphEdge } from "./typed-graph.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export interface SiteGenerationPolicy {
  pageConceptBatchSize: number;
  nearbyRegionLimit: number;
  minimumSharedCoverageKeys: number;
  requireUtilityOrInformationObject: boolean;
}

export interface PageConceptJobAttribute {
  id: string;
  dimension: string;
  label: string;
  description: string;
  materialEffects: readonly MaterialEffect[];
  anchorKind?: ApprovedOntologyAttribute["anchorKind"];
}

export interface PageConceptJob {
  id: string;
  siteRunId: string;
  regionId: string;
  regionHash: string;
  attributes: readonly PageConceptJobAttribute[];
  anchorIds: readonly string[];
  nearbyRegionIds: readonly string[];
  materialEffects: readonly MaterialEffect[];
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  requiredOutputs: readonly ("canonical-question" | "intent" | "route" | "information-object" | "utility-task" | "graph-role" | "conversion-path" | "semantic-modules" | "ui-capabilities")[];
  publicationGate: "research";
  jobHash: string;
}

export interface SiteGenerationBatch {
  id: string;
  index: number;
  pageConceptJobIds: readonly string[];
  batchHash: string;
}

export interface SiteGenerationPlan {
  id: string;
  projectId: string;
  ontologyId: string;
  opportunitySelectionHash: string;
  minimumPages: number;
  maximumPages: number;
  pageConceptJobs: readonly PageConceptJob[];
  batches: readonly SiteGenerationBatch[];
  planHash: string;
  validation: ValidationReport;
}

export interface PageConceptProposal {
  jobId: string;
  pageId: string;
  route: string;
  canonicalQuestion: string;
  intent: string;
  expressedAttributeIds: readonly string[];
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  informationObjectIds: readonly string[];
  utilityOrTaskContractIds: readonly string[];
  conversionPathId: string;
  requiredModuleKinds: readonly ModuleKind[];
  requiredLayoutRoles: readonly LayoutRole[];
  requiredCapabilities: readonly DesignCapability[];
  graphEdges: readonly TypedGraphEdge[];
  commercialValue: number;
  lifecycleCost: number;
}

export interface CompiledPageConcepts {
  candidateSeeds: readonly CandidatePageSeed[];
  rejectedProposalIds: readonly { id: string; reasons: readonly string[] }[];
  compilationHash: string;
  validation: ValidationReport;
}

export const SITE_PROGRAM_VALIDATION: readonly ValidationAttribute[] = [
  { id: "site-program.stage-boundary", feature: "Second agentic stage boundary", workflowStep: "map-regions-to-pages", algorithmChoice: "one typed PageConceptJob per selected opportunity region", userEffect: "the agent receives the exact high-dimensional region it must satisfy instead of inventing pages independently", developerEffect: "ontology discovery and page concept generation remain separate, replayable stages", validationVector: ["region hash", "attribute set", "sources/evidence", "required outputs"], passVector: ["one job per selected region", "job hash stable"], failVector: ["page concept invented without region", "region state lost in prompt", "user hand-authors page matrix"], simplerBaseline: "generic page prompt", severity: "hard" },
  { id: "site-program.neighborhood", feature: "Local corpus awareness", workflowStep: "map-regions-to-pages", algorithmChoice: "sparse shared-coverage-key neighbor retrieval", userEffect: "the page agent sees adjacent concepts and can create a distinct answer", developerEffect: "cannibalization context is available without a dense all-pairs matrix", validationVector: ["nearby IDs", "shared keys", "limit", "determinism"], passVector: ["neighbors belong to same site plan", "limit respected"], failVector: ["agent writes each page in isolation", "global O(n²) neighbor scan"], simplerBaseline: "previous page only", severity: "hard" },
  { id: "site-program.batch", feature: "One-site agent generation batching", workflowStep: "generate-site", algorithmChoice: "deterministic bounded batches over all page concept jobs", userEffect: "one user operation creates one complete site project containing the declared 10,000+ pages", developerEffect: "API/local inference work can be scheduled and retried without becoming an always-on serving system", validationVector: ["site run ID", "batch size", "job coverage", "batch hashes"], passVector: ["every job appears exactly once", "minimum page contract reached"], failVector: ["10k interpreted as live concurrent users", "job omitted or duplicated", "always-on VPS required"], simplerBaseline: "one API request per manually listed page", severity: "hard" },
  { id: "site-program.expression", feature: "Region expression validation", workflowStep: "compile-page-concepts", algorithmChoice: "explicit expressed-attribute IDs plus bounded evidence and output contracts", userEffect: "generated page concepts must actually express the region that justified them", developerEffect: "agent prose cannot silently drift away from the selected point", validationVector: ["all region attributes expressed", "source/evidence subset", "question", "intent", "route"], passVector: ["required attributes covered", "references bounded"], failVector: ["missing region attribute", "undeclared evidence", "generic question"], simplerBaseline: "trust the model output", severity: "hard" },
  { id: "site-program.distinctness", feature: "Page concept distinctness", workflowStep: "compile-page-concepts", algorithmChoice: "unique route/question plus region-specific information or utility object", userEffect: "nearby pages provide materially different answers or tools", developerEffect: "noun-swapped proposals fail before content generation", validationVector: ["route uniqueness", "question uniqueness", "information object", "utility task", "neighbor overlap"], passVector: ["unique canonical concept", "distinct object or task"], failVector: ["duplicate route", "same question", "no information/utility object"], simplerBaseline: "unique title only", severity: "hard" },
  { id: "site-program.seed", feature: "Page-coordinate seed compilation", workflowStep: "compile-page-concepts", algorithmChoice: "validated proposal -> explicit-primary CandidatePageSeed", userEffect: "accepted page concepts enter the existing vector/compiler pipeline without manual YAML", developerEffect: "the new Stage-1/Stage-2 flow converges with current PageCoordinate and PageGenerationJob machinery", validationVector: ["primary prototype", "feature atoms", "modules", "graph", "conversion"], passVector: ["one deterministic seed per accepted proposal"], failVector: ["parallel page authority", "prototype discarded", "manual manifest edit required"], simplerBaseline: "hand-authored CandidatePageSeed", severity: "hard" },
];

export const DEFAULT_SITE_GENERATION_POLICY: SiteGenerationPolicy = {
  pageConceptBatchSize: 25,
  nearbyRegionLimit: 8,
  minimumSharedCoverageKeys: 2,
  requireUtilityOrInformationObject: true,
};

export function compileSiteGenerationPlan(
  project: NormalizedProject,
  ontology: ApprovedOntology,
  opportunity: SelectedOpportunitySpace,
  policy: SiteGenerationPolicy = DEFAULT_SITE_GENERATION_POLICY,
): SiteGenerationPlan {
  validatePolicy(policy);
  const minimumPages = project.input.goals.minimumInitialPages ?? 1;
  const maximumPages = project.input.goals.maximumInitialPages;
  if (opportunity.selectedRegions.length < minimumPages || opportunity.selectedRegions.length > maximumPages) throw new Error(`selected opportunity space count ${opportunity.selectedRegions.length} violates project bounds ${minimumPages}..${maximumPages}`);
  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const regionById = new Map(opportunity.selectedRegions.map((item) => [item.id, item]));
  const postings = buildCoveragePostings(opportunity.selectedRegions);
  const siteRunId = `site-run:${project.input.id}:${opportunity.selectionHash.slice(0, 16)}`;
  const pageConceptJobs = opportunity.selectedRegions.map((region) => {
    const nearbyRegionIds = nearestRegions(region, regionById, postings, policy);
    const attributes = region.attributeIds.map((id) => {
      const attribute = required(attributeById, id);
      return { id, dimension: attribute.dimension, label: attribute.label, description: attribute.description, materialEffects: attribute.materialEffects, ...(attribute.anchorKind === undefined ? {} : { anchorKind: attribute.anchorKind }) };
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
    return { ...canonical, jobHash: sha256(JSON.stringify(canonical)) };
  }).sort((left, right) => left.id.localeCompare(right.id));
  const batches: SiteGenerationBatch[] = [];
  for (let offset = 0, index = 0; offset < pageConceptJobs.length; offset += policy.pageConceptBatchSize, index += 1) {
    const ids = pageConceptJobs.slice(offset, offset + policy.pageConceptBatchSize).map((item) => item.id);
    const canonical = { id: `site-batch:${String(index + 1).padStart(5, "0")}`, index, pageConceptJobIds: ids };
    batches.push({ ...canonical, batchHash: sha256(JSON.stringify(canonical)) });
  }
  const assignedIds = batches.flatMap((batch) => batch.pageConceptJobIds);
  const findings = [
    finding("site-program.stage-boundary", pageConceptJobs.length === opportunity.selectedRegions.length ? "pass" : "fail", `${pageConceptJobs.length} region-bound page concept jobs`),
    finding("site-program.neighborhood", pageConceptJobs.every((job) => job.nearbyRegionIds.length <= policy.nearbyRegionLimit && job.nearbyRegionIds.every((id) => regionById.has(id))) ? "pass" : "fail", `sparse local neighbors limited to ${policy.nearbyRegionLimit}`),
    finding("site-program.batch", assignedIds.length === pageConceptJobs.length && new Set(assignedIds).size === pageConceptJobs.length && pageConceptJobs.length >= minimumPages ? "pass" : "fail", `${batches.length} deterministic batches cover ${pageConceptJobs.length} jobs exactly once`),
    finding("site-program.expression", "pending", "page concept agent has not returned proposals"),
    finding("site-program.distinctness", "pending", "page concept proposals have not been compared"),
    finding("site-program.seed", "pending", "CandidatePageSeeds have not been compiled"),
  ];
  const canonical = { id: siteRunId, projectId: project.input.id, ontologyId: ontology.id, opportunitySelectionHash: opportunity.selectionHash, minimumPages, maximumPages, pageConceptJobs, batches };
  return { ...canonical, planHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`site-generation-plan:${siteRunId}`, SITE_PROGRAM_VALIDATION.slice(0, 3), findings.slice(0, 3)) };
}

export function compilePageConceptProposals(
  plan: SiteGenerationPlan,
  ontology: ApprovedOntology,
  proposals: readonly PageConceptProposal[],
  policy: SiteGenerationPolicy = DEFAULT_SITE_GENERATION_POLICY,
): CompiledPageConcepts {
  validatePolicy(policy);
  const jobById = new Map(plan.pageConceptJobs.map((item) => [item.id, item]));
  const proposalIds = new Set<string>();
  const pageIds = new Set<string>();
  const routes = new Set<string>();
  const questions = new Set<string>();
  const accepted: CandidatePageSeed[] = [];
  const rejected: { id: string; reasons: string[] }[] = [];
  for (const proposal of [...proposals].sort((left, right) => left.jobId.localeCompare(right.jobId))) {
    const reasons: string[] = [];
    if (proposalIds.has(proposal.jobId)) reasons.push("duplicate job proposal");
    proposalIds.add(proposal.jobId);
    const job = jobById.get(proposal.jobId);
    if (!job) { rejected.push({ id: proposal.jobId, reasons: ["unknown page concept job"] }); continue; }
    if (!proposal.pageId.trim() || pageIds.has(proposal.pageId)) reasons.push("invalid or duplicate page ID");
    pageIds.add(proposal.pageId);
    if (!proposal.route.startsWith("/") || routes.has(proposal.route)) reasons.push("invalid or duplicate route");
    routes.add(proposal.route);
    const normalizedQuestion = proposal.canonicalQuestion.trim().toLowerCase();
    if (!normalizedQuestion || questions.has(normalizedQuestion)) reasons.push("empty or duplicate canonical question");
    questions.add(normalizedQuestion);
    const expressed = new Set(proposal.expressedAttributeIds);
    for (const attribute of job.attributes) if (!expressed.has(attribute.id)) reasons.push(`missing required attribute ${attribute.id}`);
    const allowedEvidence = new Set(job.evidenceIds);
    const allowedSources = new Set(job.sourceIds);
    if (proposal.evidenceIds.length === 0 || proposal.sourceIds.length === 0) reasons.push("evidence and source references are required");
    for (const id of proposal.evidenceIds) if (!allowedEvidence.has(id)) reasons.push(`undeclared evidence ${id}`);
    for (const id of proposal.sourceIds) if (!allowedSources.has(id)) reasons.push(`undeclared source ${id}`);
    if (!proposal.intent.trim() || !proposal.conversionPathId.trim()) reasons.push("intent and conversion path are required");
    if (proposal.requiredModuleKinds.length === 0 || proposal.requiredLayoutRoles.length === 0 || proposal.requiredCapabilities.length === 0) reasons.push("semantic modules, layout roles, and UI capabilities are required");
    if (policy.requireUtilityOrInformationObject && proposal.informationObjectIds.length === 0 && proposal.utilityOrTaskContractIds.length === 0) reasons.push("distinct information object or utility task is required");
    if (!Number.isFinite(proposal.lifecycleCost) || proposal.lifecycleCost <= 0 || !Number.isFinite(proposal.commercialValue)) reasons.push("invalid lifecycle cost or commercial value");
    if (reasons.length > 0) { rejected.push({ id: proposal.jobId, reasons: [...new Set(reasons)].sort() }); continue; }
    accepted.push(proposalToSeed(job, proposal, ontology));
  }
  for (const job of plan.pageConceptJobs) if (!proposalIds.has(job.id)) rejected.push({ id: job.id, reasons: ["missing page concept proposal"] });
  const complete = accepted.length === plan.pageConceptJobs.length && rejected.length === 0;
  const findings = [
    finding("site-program.stage-boundary", "pass", "all proposals are evaluated against region-bound jobs"),
    finding("site-program.neighborhood", "pass", "neighbor context remains attached to source jobs"),
    finding("site-program.batch", "pass", "site plan batching identity preserved"),
    finding("site-program.expression", complete ? "pass" : "fail", `${accepted.length}/${plan.pageConceptJobs.length} proposals express all required attributes and bounded references`),
    finding("site-program.distinctness", complete ? "pass" : "fail", `${new Set(accepted.map((item) => item.route)).size} unique routes; rejected=${rejected.length}`),
    finding("site-program.seed", complete ? "pass" : "fail", `${accepted.length} deterministic CandidatePageSeeds compiled`),
  ];
  const canonical = { planId: plan.id, candidateSeedIds: accepted.map((item) => item.id), rejected: rejected.sort((left, right) => left.id.localeCompare(right.id)) };
  return { candidateSeeds: accepted.sort((left, right) => left.id.localeCompare(right.id)), rejectedProposalIds: canonical.rejected, compilationHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`page-concept-compilation:${plan.id}`, SITE_PROGRAM_VALIDATION, findings) };
}

function proposalToSeed(job: PageConceptJob, proposal: PageConceptProposal, ontology: ApprovedOntology): CandidatePageSeed {
  const attributeById = new Map(ontology.attributes.map((item) => [item.id, item]));
  const atoms: ManifestFeatureAtom[] = job.attributes.map((item) => {
    const attribute = required(attributeById, item.id);
    return { dimension: attribute.dimension, value: attribute.id, source_id: proposal.sourceIds[0], provenance: "agent_proposed" as const };
  }).sort((left, right) => left.dimension.localeCompare(right.dimension) || left.value.localeCompare(right.value));
  const prototype: ManifestPrototype = { id: `${job.regionId}:primary`, feature_atoms: atoms };
  const anchorAttributes = job.attributes.filter((item) => item.anchorKind);
  return {
    id: proposal.pageId,
    route: proposal.route,
    canonicalQuestion: proposal.canonicalQuestion,
    intent: proposal.intent,
    serviceOfferIds: anchorAttributes.filter((item) => item.anchorKind === "service" || item.anchorKind === "offer").map((item) => item.id).sort(),
    topicProblemIds: anchorAttributes.filter((item) => item.anchorKind === "topic" || item.anchorKind === "problem").map((item) => item.id).sort(),
    workflowIntegrationIds: anchorAttributes.filter((item) => item.anchorKind === "workflow").map((item) => item.id).sort(),
    desiredOutcomeIds: anchorAttributes.filter((item) => item.anchorKind === "outcome").map((item) => item.id).sort(),
    primaryPrototypeId: prototype.id,
    prototypes: [prototype],
    evidenceIds: [...proposal.evidenceIds].sort(),
    sourceIds: [...proposal.sourceIds].sort(),
    informationObjectIds: [...proposal.informationObjectIds].sort(),
    utilityOrTaskContractIds: [...proposal.utilityOrTaskContractIds].sort(),
    requiredModuleKinds: [...new Set(proposal.requiredModuleKinds)].sort(),
    requiredLayoutRoles: [...new Set(proposal.requiredLayoutRoles)].sort(),
    requiredCapabilities: [...new Set(proposal.requiredCapabilities)].sort(),
    graphEdges: [...proposal.graphEdges].sort((left, right) => left.id.localeCompare(right.id)),
    conversionPathId: proposal.conversionPathId,
    commercialValue: proposal.commercialValue,
    lifecycleCost: proposal.lifecycleCost,
    rareGroupIds: job.attributes.filter((item) => item.anchorKind === undefined && (item.materialEffects.includes("problem-framing") || item.materialEffects.includes("workflow"))).map((item) => item.id).sort(),
    eligibility: { requiredSharedDimensions: job.attributes.map((item) => item.dimension).sort(), excludedAtomSets: [] },
  };
}

function buildCoveragePostings(regions: readonly OpportunityRegion[]): Map<string, string[]> {
  const postings = new Map<string, string[]>();
  for (const region of regions) for (const key of region.coverageKeys) { const ids = postings.get(key) ?? []; ids.push(region.id); postings.set(key, ids); }
  for (const ids of postings.values()) ids.sort();
  return postings;
}
function nearestRegions(
  region: OpportunityRegion,
  regionById: ReadonlyMap<string, OpportunityRegion>,
  postings: ReadonlyMap<string, readonly string[]>,
  policy: SiteGenerationPolicy,
): string[] {
  const sharedCounts = new Map<string, number>();
  const rareKeys = [...region.coverageKeys].sort((left, right) => (postings.get(left)?.length ?? 0) - (postings.get(right)?.length ?? 0) || left.localeCompare(right)).slice(0, 12);
  for (const key of rareKeys) for (const id of postings.get(key) ?? []) if (id !== region.id) sharedCounts.set(id, (sharedCounts.get(id) ?? 0) + 1);
  return [...sharedCounts.entries()]
    .filter(([, count]) => count >= policy.minimumSharedCoverageKeys)
    .map(([id, shared]) => ({ id, shared, jaccard: setJaccard(region.attributeIds, required(regionById, id).attributeIds) }))
    .sort((left, right) => right.shared - left.shared || right.jaccard - left.jaccard || left.id.localeCompare(right.id))
    .slice(0, policy.nearbyRegionLimit)
    .map((item) => item.id);
}
function setJaccard(left: readonly string[], right: readonly string[]): number { const leftSet = new Set(left); const rightSet = new Set(right); const intersection = [...leftSet].filter((value) => rightSet.has(value)).length; const union = new Set([...leftSet, ...rightSet]).size; return union === 0 ? 0 : intersection / union; }
function validatePolicy(policy: SiteGenerationPolicy): void { if (!Number.isInteger(policy.pageConceptBatchSize) || policy.pageConceptBatchSize < 1 || !Number.isInteger(policy.nearbyRegionLimit) || policy.nearbyRegionLimit < 0 || !Number.isInteger(policy.minimumSharedCoverageKeys) || policy.minimumSharedCoverageKeys < 1) throw new Error("invalid site generation policy"); }
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V { const value = map.get(key); if (value === undefined) throw new Error(`missing ${String(key)}`); return value; }
