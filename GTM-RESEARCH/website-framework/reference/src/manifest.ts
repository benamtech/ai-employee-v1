import { parse } from "yaml";
import {
  compileHrrFeatures,
  DESIGN_CAPABILITIES,
  type DesignCapability,
  type FeatureMap,
  type VectorSpaceIdentity,
} from "./benchmark.js";
import { facilityLocationComplementInformation } from "./csi.js";
import { cosine, sha256, type Vector } from "./core.js";
import {
  compileSite,
  type ClaimSource,
  type CompiledSite,
  type EvidenceSource,
  type InformationObjectSource,
  type LayoutRole,
  type ModuleKind,
  type ModuleSource,
  type PageSource,
  type SiteSource,
} from "./framework.js";

export interface ManifestAxis {
  description: string;
  allowed_values?: string[];
}

export interface ManifestFeatureAtom {
  dimension: string;
  value: string;
  source_id: string;
  provenance: "authored" | "researched" | "synthetic" | "agent_proposed";
}

export interface ManifestPrototype {
  id: string;
  feature_atoms: ManifestFeatureAtom[];
}

export interface ManifestProfile {
  purpose: string;
  index_policy: "noindex,nofollow" | "gated" | "index,follow";
  page_ids: string[];
}

export interface ManifestModule {
  id: string;
  kind: ModuleKind;
  layout_role: LayoutRole;
  heading?: string;
  body?: string;
  claim_ids: string[];
  information_object_ids: string[];
  required_capabilities: DesignCapability[];
  source_ids: string[];
}

export interface ManifestPage {
  id: string;
  route: string;
  canonical_question: string;
  title: string;
  description: string;
  profile_ids: string[];
  feature_atoms: ManifestFeatureAtom[];
  prototypes?: ManifestPrototype[];
  module_ids: string[];
  internal_page_ids: string[];
  auto_link?: boolean;
  required_capabilities: DesignCapability[];
  instruction_pointers?: string[];
  variant_axes?: string[];
  publication_gate: "research" | "reviewed" | "approved";
  indexable: boolean;
}

export interface AgentCoverageContext {
  id: string;
  weight: number;
  feature_atoms: ManifestFeatureAtom[];
  source_ids: string[];
  relevance_label?: "perfect" | "good" | "fair" | "bad";
}

export interface AgentCoveragePolicy {
  minimum_contexts: number;
  minimum_normalized_marginal_gain: number;
  minimum_improving_contexts: number;
  maximum_existing_similarity: number;
}

export interface AgentHarnessConfig {
  mode: "propose_validate_compile";
  publication_default: "noindex";
  required_stages: string[];
  required_outputs: string[];
  prohibited_outputs: string[];
  coverage_policy: AgentCoveragePolicy;
}

export interface FrameworkManifest {
  version: string;
  status: "research_only" | "source_wired_research" | "field_candidate" | "production";
  production_ready: boolean;
  updated_at: string;
  base_url: string;
  framework: {
    authority: "unified_manifest";
    compiler_entrypoint: string;
    agent_first: true;
    default_profile: string;
  };
  vector_space: {
    first_class: true;
    namespace: string;
    symbol_version: string;
    vector_dimensions: number;
    axes: Record<string, ManifestAxis>;
    link_policy: {
      mode: "explicit" | "vector_nearest" | "hybrid";
      nearest_neighbors: number;
      minimum_cosine: number;
      require_profile_overlap: boolean;
    };
  };
  agent_harness: AgentHarnessConfig;
  profiles: Record<string, ManifestProfile>;
  evidence: EvidenceSource[];
  claims: ClaimSource[];
  information_objects: InformationObjectSource[];
  modules: ManifestModule[];
  pages: ManifestPage[];
}

export interface HyperVectorPrototypeIR {
  id: string;
  featureAtoms: ManifestFeatureAtom[];
  vector: Vector;
}

export interface HyperVectorPageIR {
  pageId: string;
  profileIds: string[];
  prototypes: HyperVectorPrototypeIR[];
  nearestPageIds: string[];
}

export interface CompiledHyperVectorSpace {
  firstClass: true;
  namespace: string;
  symbolVersion: string;
  dimensions: number;
  axes: Record<string, ManifestAxis>;
  featureVocabulary: string[];
  pages: HyperVectorPageIR[];
  spaceHash: string;
}

export interface CompiledFrameworkManifest {
  manifest: FrameworkManifest;
  source: SiteSource;
  vectorSpace: CompiledHyperVectorSpace;
  site: CompiledSite;
  profiles: Record<string, ManifestProfile>;
  defaultProfile: string;
}

export interface AgentPageProposal {
  generation: {
    agent_id: string;
    model: string;
    prompt_hash: string;
    source_ids: string[];
    marginal_coverage_hypothesis: string;
    coverage_contexts: AgentCoverageContext[];
  };
  evidence: EvidenceSource[];
  claims: ClaimSource[];
  information_objects: InformationObjectSource[];
  modules: ManifestModule[];
  page: ManifestPage;
}

export interface ProposalCoverageReport {
  proposalPageId: string;
  contextCount: number;
  totalContextWeight: number;
  baselineObjective: number;
  proposedObjective: number;
  marginalGain: number;
  normalizedMarginalGain: number;
  maximumExistingSimilarity: number;
  improvingContextIds: string[];
  csiSingletonInformation: number;
  passes: boolean;
  reasons: string[];
}

export function parseFrameworkManifest(text: string): FrameworkManifest {
  const parsed = parse(text) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("framework manifest must be an object");
  const manifest = parsed as FrameworkManifest;
  validateManifest(manifest);
  return manifest;
}

export function compileFrameworkManifest(textOrManifest: string | FrameworkManifest): CompiledFrameworkManifest {
  const manifest = typeof textOrManifest === "string" ? parseFrameworkManifest(textOrManifest) : validateAndReturn(textOrManifest);
  const dimensions = manifest.vector_space.vector_dimensions;
  const geometries = [...manifest.pages]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((page) => compilePageGeometry(manifest, page, dimensions));
  const geometryById = new Map(geometries.map((geometry) => [geometry.pageId, geometry]));
  const pageById = new Map(manifest.pages.map((page) => [page.id, page]));

  const sourcePages: PageSource[] = [...manifest.pages].sort((a, b) => a.id.localeCompare(b.id)).map((page) => {
    const geometry = required(geometryById, page.id, "vector geometry");
    const explicitLinks = new Set(page.internal_page_ids);
    const autoLinks = deriveNearestPages(manifest, page, geometry, geometries);
    geometry.nearestPageIds = [...autoLinks];
    for (const linkedId of autoLinks) explicitLinks.add(linkedId);
    explicitLinks.delete(page.id);
    const profilePolicies = page.profile_ids.map((profileId) => required(new Map(Object.entries(manifest.profiles)), profileId, `profile policy for ${page.id}`).index_policy);
    const profileAllowsIndex = profilePolicies.includes("index,follow") && !profilePolicies.includes("noindex,nofollow");
    const publicationAllowed = manifest.production_ready && page.publication_gate === "approved" && profileAllowsIndex;
    return {
      id: page.id,
      route: page.route,
      canonicalQuestion: page.canonical_question,
      title: page.title,
      description: page.description,
      features: atomsToFeatureMap(manifest, geometry.prototypes[0].featureAtoms),
      vectorPrototypes: geometry.prototypes.map((prototype) => ({
        id: prototype.id,
        features: atomsToFeatureMap(manifest, prototype.featureAtoms),
      })),
      moduleIds: [...page.module_ids],
      internalPageIds: [...explicitLinks].sort(),
      requiredCapabilities: uniqueSorted(page.required_capabilities),
      ...(page.instruction_pointers ? { instructionPointers: uniqueSorted(page.instruction_pointers) } : {}),
      indexable: Boolean(page.indexable && publicationAllowed),
    };
  });

  for (const page of sourcePages) for (const link of page.internalPageIds) required(pageById, link, `internal links for ${page.id}`);
  const source: SiteSource = {
    baseUrl: manifestBaseUrl(manifest),
    vectorIdentity: vectorIdentity(manifest),
    evidence: [...manifest.evidence],
    claims: [...manifest.claims],
    informationObjects: [...manifest.information_objects],
    modules: manifest.modules.map(toModuleSource),
    pages: sourcePages,
  };
  const site = compileSite(source, dimensions);
  assertAllPrototypeParity(site, geometries);
  const vectorSpace = finalizeVectorSpace(manifest, geometries);
  return { manifest, source, vectorSpace, site, profiles: manifest.profiles, defaultProfile: manifest.framework.default_profile };
}

export function evaluateAgentPageProposalCoverage(
  manifest: FrameworkManifest,
  proposal: AgentPageProposal,
): ProposalCoverageReport {
  const policy = manifest.agent_harness.coverage_policy;
  const identity = vectorIdentity(manifest);
  const dimensions = manifest.vector_space.vector_dimensions;
  const contexts = [...proposal.generation.coverage_contexts].sort((left, right) => left.id.localeCompare(right.id));
  const contextVectors = contexts.map((context) => compileHrrFeatures(
    atomsToFeatureMap(manifest, normalizedAtoms(manifest, context.feature_atoms, `coverage context ${context.id}`)),
    dimensions,
    identity,
  ));
  const existingGeometries = [...manifest.pages]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((page) => compilePageGeometry(manifest, page, dimensions));
  const proposedGeometry = compilePageGeometry(manifest, proposal.page, dimensions);
  const totalContextWeight = contexts.reduce((sum, context) => sum + context.weight, 0);

  let baselineObjective = 0;
  let proposedObjective = 0;
  const improvingContextIds: string[] = [];
  for (let index = 0; index < contexts.length; index += 1) {
    const currentBest = bestContextPageSimilarity(contextVectors[index], existingGeometries);
    const proposedFit = bestContextPageSimilarity(contextVectors[index], [proposedGeometry]);
    baselineObjective += contexts[index].weight * currentBest;
    proposedObjective += contexts[index].weight * Math.max(currentBest, proposedFit);
    if (proposedFit > currentBest + 1e-9) improvingContextIds.push(contexts[index].id);
  }
  const marginalGain = proposedObjective - baselineObjective;
  const normalizedMarginalGain = totalContextWeight > 0 ? marginalGain / totalContextWeight : 0;
  const maximumExistingSimilarity = existingGeometries.length === 0
    ? 0
    : Math.max(...existingGeometries.map((geometry) => maxPrototypeCosine(proposedGeometry, geometry)));

  const allGeometries = [...existingGeometries, proposedGeometry];
  const kernel = allGeometries.map((left) => allGeometries.map((right) => boundedCosine(maxPrototypeCosine(left, right))));
  const csiSingletonInformation = facilityLocationComplementInformation(kernel, [allGeometries.length - 1]);

  const reasons: string[] = [];
  if (contexts.length < policy.minimum_contexts) reasons.push(`requires at least ${policy.minimum_contexts} coverage contexts`);
  if (totalContextWeight <= 0) reasons.push("coverage context weight must be positive");
  if (normalizedMarginalGain < policy.minimum_normalized_marginal_gain) {
    reasons.push(`normalized marginal gain ${normalizedMarginalGain.toFixed(6)} is below ${policy.minimum_normalized_marginal_gain}`);
  }
  if (improvingContextIds.length < policy.minimum_improving_contexts) {
    reasons.push(`improves ${improvingContextIds.length} contexts; requires ${policy.minimum_improving_contexts}`);
  }
  if (maximumExistingSimilarity > policy.maximum_existing_similarity) {
    reasons.push(`maximum existing-page similarity ${maximumExistingSimilarity.toFixed(6)} exceeds ${policy.maximum_existing_similarity}`);
  }

  return {
    proposalPageId: proposal.page.id,
    contextCount: contexts.length,
    totalContextWeight,
    baselineObjective,
    proposedObjective,
    marginalGain,
    normalizedMarginalGain,
    maximumExistingSimilarity,
    improvingContextIds,
    csiSingletonInformation,
    passes: reasons.length === 0,
    reasons,
  };
}

export function validateAgentPageProposal(manifest: FrameworkManifest, proposal: AgentPageProposal): ProposalCoverageReport {
  if (!proposal.generation.agent_id.trim() || !proposal.generation.model.trim() || !proposal.generation.prompt_hash.trim()) {
    throw new Error("agent proposal requires agent, model, and prompt hash");
  }
  if (proposal.generation.source_ids.length === 0) throw new Error("agent proposal requires source IDs");
  if (!proposal.generation.marginal_coverage_hypothesis.trim()) throw new Error("agent proposal requires a marginal coverage hypothesis");
  if (proposal.generation.coverage_contexts.length === 0) throw new Error("agent proposal requires explicit coverage contexts");
  if (proposal.information_objects.length === 0) throw new Error("agent proposal requires at least one distinct information object");
  if (proposal.page.feature_atoms.length === 0) throw new Error("agent proposal requires a target hyper-vector region");
  if (proposal.page.indexable) throw new Error("agent proposals enter as noindex until separate publication approval");
  if (proposal.page.publication_gate !== "research") throw new Error("agent proposals must enter through the research gate");

  const existingIds = new Set([
    ...manifest.evidence.map((item) => item.id),
    ...manifest.claims.map((item) => item.id),
    ...manifest.information_objects.map((item) => item.id),
    ...manifest.modules.map((item) => item.id),
    ...manifest.pages.map((item) => item.id),
  ]);
  for (const item of [...proposal.evidence, ...proposal.claims, ...proposal.information_objects, ...proposal.modules, proposal.page]) {
    if (existingIds.has(item.id)) throw new Error(`agent proposal collides with existing ID: ${item.id}`);
    existingIds.add(item.id);
  }
  for (const sourceId of proposal.generation.source_ids) {
    if (!proposal.modules.some((module) => module.source_ids.includes(sourceId))) {
      throw new Error(`agent source ${sourceId} is not attached to a proposed module`);
    }
  }
  for (const context of proposal.generation.coverage_contexts) {
    if (!context.id.trim() || !Number.isFinite(context.weight) || context.weight <= 0) throw new Error("coverage contexts require ID and positive finite weight");
    if (context.source_ids.length === 0) throw new Error(`coverage context ${context.id} requires source IDs`);
    normalizedAtoms(manifest, context.feature_atoms, `coverage context ${context.id}`);
  }

  const coverage = evaluateAgentPageProposalCoverage(manifest, proposal);
  if (!coverage.passes) throw new Error(`agent proposal failed computed coverage gate: ${coverage.reasons.join("; ")}`);

  const trial = applyAgentPageProposalUnchecked(manifest, proposal);
  validateManifest(trial);
  compileFrameworkManifest(trial);
  return coverage;
}

export function applyAgentPageProposal(manifest: FrameworkManifest, proposal: AgentPageProposal): FrameworkManifest {
  validateAgentPageProposal(manifest, proposal);
  return applyAgentPageProposalUnchecked(manifest, proposal);
}

export function pagesForProfile(compiled: CompiledFrameworkManifest, profileId: string): string[] {
  const profile = required(new Map(Object.entries(compiled.profiles)), profileId, "profile");
  return [...profile.page_ids];
}

function applyAgentPageProposalUnchecked(manifest: FrameworkManifest, proposal: AgentPageProposal): FrameworkManifest {
  const profiles = Object.fromEntries(Object.entries(manifest.profiles).map(([profileId, profile]) => [profileId, {
    ...profile,
    page_ids: proposal.page.profile_ids.includes(profileId) ? uniqueSorted([...profile.page_ids, proposal.page.id]) : [...profile.page_ids],
  }]));
  return {
    ...manifest,
    profiles,
    evidence: [...manifest.evidence, ...proposal.evidence],
    claims: [...manifest.claims, ...proposal.claims],
    information_objects: [...manifest.information_objects, ...proposal.information_objects],
    modules: [...manifest.modules, ...proposal.modules],
    pages: [...manifest.pages, { ...proposal.page, indexable: false, publication_gate: "research" }],
  };
}

function compilePageGeometry(manifest: FrameworkManifest, page: ManifestPage, dimensions: number): HyperVectorPageIR {
  const identity = vectorIdentity(manifest);
  const prototypes = (page.prototypes?.length ? page.prototypes : [{ id: "primary", feature_atoms: page.feature_atoms }])
    .map((prototype) => {
      const featureAtoms = normalizedAtoms(manifest, prototype.feature_atoms, `${page.id}/${prototype.id}`);
      return {
        id: prototype.id,
        featureAtoms,
        vector: compileHrrFeatures(atomsToFeatureMap(manifest, featureAtoms), dimensions, identity),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  return { pageId: page.id, profileIds: uniqueSorted(page.profile_ids), prototypes, nearestPageIds: [] };
}

function deriveNearestPages(
  manifest: FrameworkManifest,
  page: ManifestPage,
  geometry: HyperVectorPageIR,
  all: HyperVectorPageIR[],
): string[] {
  const policy = manifest.vector_space.link_policy;
  if (policy.mode === "explicit" || page.auto_link === false || policy.nearest_neighbors === 0) return [];
  const profileSet = new Set(page.profile_ids);
  return all.filter((candidate) => candidate.pageId !== page.id)
    .filter((candidate) => !policy.require_profile_overlap || candidate.profileIds.some((profileId) => profileSet.has(profileId)))
    .map((candidate) => ({ pageId: candidate.pageId, score: maxPrototypeCosine(geometry, candidate) }))
    .filter((candidate) => candidate.score >= policy.minimum_cosine)
    .sort((left, right) => right.score - left.score || left.pageId.localeCompare(right.pageId))
    .slice(0, policy.nearest_neighbors)
    .map((candidate) => candidate.pageId);
}

function bestContextPageSimilarity(context: Vector, pages: readonly HyperVectorPageIR[]): number {
  let best = 0;
  for (const page of pages) for (const prototype of page.prototypes) best = Math.max(best, boundedCosine(cosine(context, prototype.vector)));
  return best;
}

function maxPrototypeCosine(left: HyperVectorPageIR, right: HyperVectorPageIR): number {
  let best = Number.NEGATIVE_INFINITY;
  for (const a of left.prototypes) for (const b of right.prototypes) best = Math.max(best, cosine(a.vector, b.vector));
  return best;
}

function finalizeVectorSpace(manifest: FrameworkManifest, pages: HyperVectorPageIR[]): CompiledHyperVectorSpace {
  const sortedPages = [...pages].sort((left, right) => left.pageId.localeCompare(right.pageId));
  const featureVocabulary = uniqueSorted(sortedPages.flatMap((page) => page.prototypes.flatMap((prototype) =>
    prototype.featureAtoms.map((atom) => `${atom.dimension}:${atom.value}`))));
  const pageSummary = sortedPages.map((page) => ({
    pageId: page.pageId,
    profileIds: [...page.profileIds].sort(),
    prototypes: [...page.prototypes].sort((left, right) => left.id.localeCompare(right.id)).map((prototype) => ({
      id: prototype.id,
      atoms: [...prototype.featureAtoms].sort(compareAtoms),
      vector: Array.from(prototype.vector),
    })),
    nearestPageIds: [...page.nearestPageIds].sort(),
  }));
  const axes = Object.fromEntries(Object.entries(manifest.vector_space.axes).sort(([left], [right]) => left.localeCompare(right)));
  const spaceHash = sha256(JSON.stringify({
    namespace: manifest.vector_space.namespace,
    symbolVersion: manifest.vector_space.symbol_version,
    dimensions: manifest.vector_space.vector_dimensions,
    axes,
    featureVocabulary,
    pageSummary,
  }));
  return {
    firstClass: true,
    namespace: manifest.vector_space.namespace,
    symbolVersion: manifest.vector_space.symbol_version,
    dimensions: manifest.vector_space.vector_dimensions,
    axes,
    featureVocabulary,
    pages: sortedPages,
    spaceHash,
  };
}

function atomsToFeatureMap(manifest: FrameworkManifest, atoms: ManifestFeatureAtom[]): FeatureMap {
  const features: FeatureMap = {};
  for (const atom of normalizedAtoms(manifest, atoms, "feature map")) {
    if (features[atom.dimension] && features[atom.dimension] !== atom.value) {
      throw new Error(`multiple values for dimension ${atom.dimension} in one prototype`);
    }
    features[atom.dimension] = atom.value;
  }
  return features;
}

function normalizedAtoms(manifest: FrameworkManifest, atoms: ManifestFeatureAtom[], context: string): ManifestFeatureAtom[] {
  if (atoms.length === 0) throw new Error(`${context} has no feature atoms`);
  return [...atoms].map((atom) => {
    const axis = manifest.vector_space.axes[atom.dimension];
    if (!axis) throw new Error(`${context} uses undeclared vector dimension ${atom.dimension}`);
    if (!atom.value.trim() || !atom.source_id.trim()) throw new Error(`${context} contains incomplete feature atom`);
    if (axis.allowed_values?.length && !axis.allowed_values.includes(atom.value)) {
      throw new Error(`${context} uses undeclared value ${atom.dimension}:${atom.value}`);
    }
    return { ...atom };
  }).sort(compareAtoms);
}

function assertAllPrototypeParity(site: CompiledSite, geometries: HyperVectorPageIR[]): void {
  const geometryById = new Map(geometries.map((geometry) => [geometry.pageId, geometry]));
  const dimensions = site.packed.dimensions;
  site.packed.pageIds.forEach((pageId, pageIndex) => {
    const expectedPrototypes = required(geometryById, pageId, "packed vector parity").prototypes;
    const start = site.packed.prototypeOffsets[pageIndex];
    const end = site.packed.prototypeOffsets[pageIndex + 1];
    if (end - start !== expectedPrototypes.length) throw new Error(`packed prototype count drift for ${pageId}`);
    expectedPrototypes.forEach((prototype, prototypeIndex) => {
      const packedIndex = start + prototypeIndex;
      if (site.packed.prototypeIds[packedIndex] !== `${pageId}\0${prototype.id}`) throw new Error(`packed prototype ID drift for ${pageId}/${prototype.id}`);
      for (let dimension = 0; dimension < dimensions; dimension += 1) {
        const actual = site.packed.prototypeVectors[packedIndex * dimensions + dimension];
        if (Math.abs(actual - prototype.vector[dimension]) > 1e-6) throw new Error(`packed prototype drift for ${pageId}/${prototype.id} at ${dimension}`);
        if (prototypeIndex === 0) {
          const primaryActual = site.packed.pageVectors[pageIndex * dimensions + dimension];
          if (Math.abs(primaryActual - prototype.vector[dimension]) > 1e-6) throw new Error(`packed primary vector drift for ${pageId} at ${dimension}`);
        }
      }
    });
  });
}

function toModuleSource(module: ManifestModule): ModuleSource {
  for (const capability of module.required_capabilities) {
    if (!DESIGN_CAPABILITIES.includes(capability)) throw new Error(`unknown design capability ${capability} in ${module.id}`);
  }
  return {
    id: module.id,
    kind: module.kind,
    layoutRole: module.layout_role,
    ...(module.heading ? { heading: module.heading } : {}),
    ...(module.body ? { body: module.body } : {}),
    claimIds: [...module.claim_ids],
    informationObjectIds: [...module.information_object_ids],
    requiredCapabilities: uniqueSorted(module.required_capabilities),
    sourceIds: uniqueSorted(module.source_ids),
  };
}

function validateManifest(manifest: FrameworkManifest): void {
  if (!manifest.version || !manifest.updated_at) throw new Error("manifest version and updated_at are required");
  if (manifest.framework.authority !== "unified_manifest") throw new Error("site manifest must be the unified framework authority");
  if (!manifest.framework.agent_first || !manifest.vector_space.first_class) throw new Error("agent-first and first-class vector-space flags are required");
  if (!manifest.vector_space.namespace.trim() || !manifest.vector_space.symbol_version.trim()) throw new Error("vector namespace and symbol_version are required");
  if (!Number.isInteger(manifest.vector_space.vector_dimensions) || manifest.vector_space.vector_dimensions < 8 ||
      (manifest.vector_space.vector_dimensions & (manifest.vector_space.vector_dimensions - 1)) !== 0) {
    throw new Error("vector_dimensions must be a power of two >= 8");
  }
  if (Object.keys(manifest.vector_space.axes).length < 4) throw new Error("at least four vector axes are required");
  if (!manifest.profiles[manifest.framework.default_profile]) throw new Error("default profile does not exist");
  if (manifest.agent_harness.mode !== "propose_validate_compile" || manifest.agent_harness.publication_default !== "noindex") {
    throw new Error("agent harness must use propose/validate/compile with noindex default");
  }
  validateCoveragePolicy(manifest.agent_harness.coverage_policy);
  if (manifest.pages.length === 0 || manifest.modules.length === 0) throw new Error("manifest requires pages and modules");
  assertUnique(manifest.evidence, "evidence"); assertUnique(manifest.claims, "claim"); assertUnique(manifest.information_objects, "information object");
  assertUnique(manifest.modules, "module"); assertUnique(manifest.pages, "page");
  const pageIds = new Set(manifest.pages.map((page) => page.id));
  for (const [profileId, profile] of Object.entries(manifest.profiles)) {
    for (const pageId of profile.page_ids) if (!pageIds.has(pageId)) throw new Error(`profile ${profileId} references missing page ${pageId}`);
  }
  for (const page of manifest.pages) {
    if (page.profile_ids.length === 0) throw new Error(`page ${page.id} has no profile`);
    for (const profileId of page.profile_ids) {
      const profile = manifest.profiles[profileId];
      if (!profile) throw new Error(`page ${page.id} references missing profile ${profileId}`);
      if (!profile.page_ids.includes(page.id)) throw new Error(`profile ${profileId} does not include declared page ${page.id}`);
    }
    normalizedAtoms(manifest, page.feature_atoms, page.id);
    if (page.prototypes) {
      const prototypeIds = new Set<string>();
      for (const prototype of page.prototypes) {
        if (!prototype.id.trim() || prototypeIds.has(prototype.id)) throw new Error(`page ${page.id} has invalid or duplicate prototype ${prototype.id}`);
        prototypeIds.add(prototype.id);
        normalizedAtoms(manifest, prototype.feature_atoms, `${page.id}/${prototype.id}`);
      }
    }
    for (const capability of page.required_capabilities) if (!DESIGN_CAPABILITIES.includes(capability)) throw new Error(`unknown capability ${capability} in ${page.id}`);
    if (page.indexable && (!manifest.production_ready || page.publication_gate !== "approved")) {
      throw new Error(`page ${page.id} cannot be indexable before production approval`);
    }
  }
}

function validateCoveragePolicy(policy: AgentCoveragePolicy): void {
  if (!Number.isInteger(policy.minimum_contexts) || policy.minimum_contexts < 1) throw new Error("coverage policy minimum_contexts must be >= 1");
  if (!Number.isFinite(policy.minimum_normalized_marginal_gain) || policy.minimum_normalized_marginal_gain < 0 || policy.minimum_normalized_marginal_gain > 1) {
    throw new Error("coverage policy marginal threshold must be in [0,1]");
  }
  if (!Number.isInteger(policy.minimum_improving_contexts) || policy.minimum_improving_contexts < 1) throw new Error("coverage policy minimum_improving_contexts must be >= 1");
  if (!Number.isFinite(policy.maximum_existing_similarity) || policy.maximum_existing_similarity < -1 || policy.maximum_existing_similarity > 1) {
    throw new Error("coverage policy maximum_existing_similarity must be in [-1,1]");
  }
}

function vectorIdentity(manifest: FrameworkManifest): VectorSpaceIdentity {
  return { namespace: manifest.vector_space.namespace, symbolVersion: manifest.vector_space.symbol_version };
}
function boundedCosine(value: number): number { return Math.max(0, Math.min(1, (value + 1) / 2)); }
function compareAtoms(left: ManifestFeatureAtom, right: ManifestFeatureAtom): number {
  return left.dimension.localeCompare(right.dimension)
    || left.value.localeCompare(right.value)
    || left.source_id.localeCompare(right.source_id)
    || left.provenance.localeCompare(right.provenance);
}
function validateAndReturn(manifest: FrameworkManifest): FrameworkManifest { validateManifest(manifest); return manifest; }
function manifestBaseUrl(manifest: FrameworkManifest): string {
  const value = manifest.base_url;
  if (!value || !/^https:\/\//.test(value)) throw new Error("manifest base_url must be https");
  return value.replace(/\/$/, "");
}
function uniqueSorted<T extends string>(values: readonly T[]): T[] { return [...new Set(values)].sort() as T[]; }
function assertUnique(items: readonly { id: string }[], label: string): void { const seen = new Set<string>(); for (const item of items) { if (seen.has(item.id)) throw new Error(`duplicate ${label} id: ${item.id}`); seen.add(item.id); } }
function required<K, V>(map: ReadonlyMap<K, V>, key: K, context: string): V { const value = map.get(key); if (value === undefined) throw new Error(`missing ${String(key)} in ${context}`); return value; }
