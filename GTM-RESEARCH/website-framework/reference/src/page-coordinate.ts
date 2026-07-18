import { compileHrrFeatures, type DesignCapability, type FeatureMap, type VectorSpaceIdentity } from "./benchmark.js";
import { contextVector, predictCompatibility, rawPositiveCosine, type CompatibilityCalibration, type ContextCorpus } from "./context-corpus.js";
import { sha256 } from "./core.js";
import type { LayoutRole, ModuleKind } from "./framework.js";
import type { FrameworkManifest, ManifestFeatureAtom, ManifestPrototype } from "./manifest.js";
import type { TypedGraphEdge } from "./typed-graph.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationFinding, type ValidationReport } from "./validation-contracts.js";

export interface CandidateEligibility {
  requiredSharedDimensions: readonly string[];
  excludedAtomSets: readonly (readonly ManifestFeatureAtom[])[];
  allowedContextIds?: readonly string[];
}

export interface CandidatePageSeed {
  id: string;
  route: string;
  canonicalQuestion: string;
  intent: string;
  serviceOfferIds: readonly string[];
  topicProblemIds: readonly string[];
  workflowIntegrationIds: readonly string[];
  desiredOutcomeIds: readonly string[];
  primaryPrototypeId: string;
  prototypes: readonly ManifestPrototype[];
  evidenceIds: readonly string[];
  sourceIds: readonly string[];
  informationObjectIds: readonly string[];
  utilityOrTaskContractIds: readonly string[];
  requiredModuleKinds: readonly ModuleKind[];
  requiredLayoutRoles: readonly LayoutRole[];
  requiredCapabilities: readonly DesignCapability[];
  graphEdges: readonly TypedGraphEdge[];
  conversionPathId: string;
  commercialValue: number;
  lifecycleCost: number;
  rareGroupIds: readonly string[];
  eligibility: CandidateEligibility;
}

export interface ContextCompatibility {
  contextId: string;
  eligible: boolean;
  bestPrototypeId: string | null;
  rawCosine: number;
  calibratedProbability: number;
}

export interface PageCoordinate extends CandidatePageSeed {
  contextCompatibility: readonly ContextCompatibility[];
  candidateHash: string;
  validation: ValidationReport;
}

export const ORCHESTRATION_VALIDATION: readonly ValidationAttribute[] = [
  { id: "coordinate.primary", feature: "Explicit primary prototype semantics", workflowStep: "plan", algorithmChoice: "required primaryPrototypeId", userEffect: "one declared canonical entry region with secondary regions retained", developerEffect: "primary identity cannot drift with array ordering", validationVector: ["primary ID", "membership", "reorder parity"], passVector: ["primary exists", "all prototypes retained"], failVector: ["first item silently wins", "unknown primary"], simplerBaseline: "first prototype wins", severity: "hard" },
  { id: "coordinate.eligibility", feature: "Candidate eligibility", workflowStep: "plan", algorithmChoice: "typed gates before scoring", userEffect: "unsafe or irrelevant combinations do not become pages", developerEffect: "similarity cannot override policy", validationVector: ["required dimensions", "exclusions", "allowed contexts"], passVector: ["one prototype satisfies every required dimension", "ineligible fit is zero"], failVector: ["cross-prototype dimension mixing", "similarity bypasses policy"], simplerBaseline: "cosine threshold", severity: "hard" },
  { id: "coordinate.specificity", feature: "Context-specific page concept", workflowStep: "plan", algorithmChoice: "coordinate plus information/utility object", userEffect: "pages differ in answer, workflow, proof, utility, or conversion", developerEffect: "jobs are not noun swaps", validationVector: ["question", "intent", "evidence", "utility", "conversion"], passVector: ["distinct object", "non-empty question"], failVector: ["vector only", "no utility", "title substitution"], simplerBaseline: "keyword row", severity: "hard" },
  { id: "selection.coverage", feature: "Selected corpus coverage", workflowStep: "plan", algorithmChoice: "calibrated facility location", userEffect: "finite corpus covers supported contexts", developerEffect: "selection has objective, budget, and held-out scores", validationVector: ["train objective", "validation", "test", "budget"], passVector: ["budget respected", "held-out reported"], failVector: ["Cartesian emission", "test optimization"], simplerBaseline: "top-N", severity: "hard" },
  { id: "selection.balance", feature: "Corpus balance", workflowStep: "plan", algorithmChoice: "information, rare-tail, diversity comparison arms", userEffect: "head and useful tail regions remain represented", developerEffect: "selection tradeoffs are inspectable", validationVector: ["coverage", "information", "rare tail", "diversity"], passVector: ["component objectives reported"], failVector: ["outlier diversity", "head-only coverage"], simplerBaseline: "facility only", severity: "soft" },
  { id: "job.contract", feature: "PageGenerationJob", workflowStep: "generate", algorithmChoice: "typed job from coordinate", userEffect: "exact page work is reviewable", developerEffect: "agents receive bounded evidence, design, graph, and pass plans", validationVector: ["job hash", "sources", "passes", "gate"], passVector: ["research/noindex", "deterministic"], failVector: ["free-form prompt", "silent publish"], simplerBaseline: "single prompt", severity: "hard" },
  { id: "runner.checkpoints", feature: "Agent runner checkpoints", workflowStep: "generate", algorithmChoice: "ordered state machine with bounded repair", userEffect: "progress and failures are visible", developerEffect: "passes are retryable and hashable", validationVector: ["order", "attempts", "hashes", "sources"], passVector: ["passes complete", "repair bounded"], failVector: ["unbounded loop", "failure ignored"], simplerBaseline: "one agent run", severity: "hard" },
  { id: "preview.operator", feature: "Preview and validation UX", workflowStep: "preview", algorithmChoice: "static review model", userEffect: "selected and rejected pages are inspectable", developerEffect: "CI and agents share one artifact", validationVector: ["page table", "rejections", "reports", "no JS"], passVector: ["all pages visible", "reasons visible"], failVector: ["silent generation", "raw stack only"], simplerBaseline: "console logs", severity: "hard" },
];

export const COORDINATE_VALIDATION = ORCHESTRATION_VALIDATION.slice(0, 3);
export const SELECTION_VALIDATION = ORCHESTRATION_VALIDATION.slice(0, 5);
export const JOB_VALIDATION = ORCHESTRATION_VALIDATION.slice(0, 6);
export const RUN_VALIDATION = ORCHESTRATION_VALIDATION.slice(0, 7);
export const PREVIEW_VALIDATION = ORCHESTRATION_VALIDATION;

export function compilePageCoordinates(
  manifest: FrameworkManifest,
  corpus: ContextCorpus,
  calibration: CompatibilityCalibration,
  seeds: readonly CandidatePageSeed[],
): PageCoordinate[] {
  const identity: VectorSpaceIdentity = { namespace: manifest.vector_space.namespace, symbolVersion: manifest.vector_space.symbol_version };
  const dimensions = manifest.vector_space.vector_dimensions;
  const contextVectors = new Map(corpus.cases.map((item) => [item.id, contextVector(item, dimensions, identity)]));
  const seedIds = new Set(seeds.map((seed) => seed.id));
  if (seedIds.size !== seeds.length) throw new Error("candidate IDs must be unique");
  const routes = new Set<string>();

  return [...seeds].sort((left, right) => left.id.localeCompare(right.id)).map((seed) => {
    if (!seed.id.trim()) throw new Error("candidate ID is required");
    if (!seed.route.startsWith("/") || routes.has(seed.route)) throw new Error(`invalid or duplicate candidate route ${seed.route}`);
    routes.add(seed.route);
    if (!Number.isFinite(seed.lifecycleCost) || seed.lifecycleCost < 1 || !Number.isFinite(seed.commercialValue)) throw new Error(`candidate ${seed.id} has invalid cost/value`);
    const prototypeIds = new Set<string>();
    for (const prototype of seed.prototypes) {
      if (prototypeIds.has(prototype.id)) throw new Error(`candidate ${seed.id} has duplicate prototype ${prototype.id}`);
      prototypeIds.add(prototype.id);
      validatePrototype(manifest, seed.id, prototype);
    }
    if (!prototypeIds.has(seed.primaryPrototypeId)) throw new Error(`candidate ${seed.id} primary prototype is missing`);
    for (const edge of seed.graphEdges) {
      if (!seedIds.has(edge.fromPageId) || !seedIds.has(edge.toPageId)) throw new Error(`candidate ${seed.id} graph edge ${edge.id} references an unknown candidate`);
    }

    const vectors = seed.prototypes.map((prototype) => ({ id: prototype.id, vector: compileHrrFeatures(atomsToFeatures(prototype.feature_atoms), dimensions, identity) }));
    const compatibility = corpus.cases.map((context) => {
      const eligible = coordinateEligible(seed, context.featureAtoms, context.id);
      let best = 0;
      let prototypeId: string | null = null;
      if (eligible) {
        for (const prototype of vectors) {
          const raw = rawPositiveCosine(required(contextVectors, context.id), prototype.vector, true);
          if (raw > best || (raw === best && prototype.id < (prototypeId ?? "\uffff"))) {
            best = raw;
            prototypeId = prototype.id;
          }
        }
      }
      return { contextId: context.id, eligible, bestPrototypeId: prototypeId, rawCosine: eligible ? best : 0, calibratedProbability: predictCompatibility(calibration.model, best, eligible) };
    });

    const specific = Boolean(seed.canonicalQuestion.trim() && seed.intent.trim() && seed.conversionPathId.trim() && seed.evidenceIds.length && seed.informationObjectIds.length && seed.requiredModuleKinds.length);
    const findings: ValidationFinding[] = [
      finding("coordinate.primary", "pass", `primary ${seed.primaryPrototypeId} retained`),
      finding("coordinate.eligibility", compatibility.some((item) => item.eligible) ? "pass" : "fail", `${compatibility.filter((item) => item.eligible).length}/${compatibility.length} contexts eligible`),
      finding("coordinate.specificity", specific ? "pass" : "fail", specific ? "question, evidence, utility, modules, and conversion bound" : "coordinate specificity incomplete"),
    ];

    const canonical: Omit<PageCoordinate, "candidateHash" | "validation"> = {
      ...seed,
      serviceOfferIds: sorted(seed.serviceOfferIds),
      topicProblemIds: sorted(seed.topicProblemIds),
      workflowIntegrationIds: sorted(seed.workflowIntegrationIds),
      desiredOutcomeIds: sorted(seed.desiredOutcomeIds),
      prototypes: primaryFirst(seed.prototypes, seed.primaryPrototypeId),
      evidenceIds: sorted(seed.evidenceIds),
      sourceIds: sorted(seed.sourceIds),
      informationObjectIds: sorted(seed.informationObjectIds),
      utilityOrTaskContractIds: sorted(seed.utilityOrTaskContractIds),
      requiredModuleKinds: [...new Set(seed.requiredModuleKinds)].sort(),
      requiredLayoutRoles: [...new Set(seed.requiredLayoutRoles)].sort(),
      requiredCapabilities: [...new Set(seed.requiredCapabilities)].sort(),
      graphEdges: [...seed.graphEdges].sort((left, right) => left.id.localeCompare(right.id)),
      rareGroupIds: sorted(seed.rareGroupIds),
      eligibility: canonicalEligibility(seed.eligibility),
      contextCompatibility: [...compatibility].sort((left, right) => left.contextId.localeCompare(right.contextId)),
    };
    return {
      ...canonical,
      candidateHash: sha256(JSON.stringify(canonical)),
      validation: buildValidationReport(`coordinate:${seed.id}`, COORDINATE_VALIDATION, findings),
    };
  });
}

export function coordinateSimilarity(left: PageCoordinate, right: PageCoordinate): number {
  const leftByContext = new Map(left.contextCompatibility.map((item) => [item.contextId, item.calibratedProbability]));
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  const contextIds = new Set([...left.contextCompatibility.map((item) => item.contextId), ...right.contextCompatibility.map((item) => item.contextId)]);
  for (const contextId of contextIds) {
    const leftValue = leftByContext.get(contextId) ?? 0;
    const rightValue = right.contextCompatibility.find((item) => item.contextId === contextId)?.calibratedProbability ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }
  return leftNorm > 0 && rightNorm > 0 ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}

function coordinateEligible(seed: CandidatePageSeed, atoms: readonly ManifestFeatureAtom[], contextId: string): boolean {
  if (seed.eligibility.allowedContextIds && !seed.eligibility.allowedContextIds.includes(contextId)) return false;
  const context = atomsToFeatures(atoms);
  const candidates = seed.prototypes.map((prototype) => atomsToFeatures(prototype.feature_atoms));
  const onePrototypeMatchesAllRequiredDimensions = candidates.some((candidate) => seed.eligibility.requiredSharedDimensions.every((dimension) => Boolean(candidate[dimension]) && candidate[dimension] === context[dimension]));
  if (!onePrototypeMatchesAllRequiredDimensions) return false;
  return !seed.eligibility.excludedAtomSets.some((set) => Object.entries(atomsToFeatures(set)).every(([dimension, value]) => context[dimension] === value));
}

function canonicalEligibility(eligibility: CandidateEligibility): CandidateEligibility {
  return {
    requiredSharedDimensions: sorted(eligibility.requiredSharedDimensions),
    excludedAtomSets: [...eligibility.excludedAtomSets].map((set) => [...set].sort(compareAtoms)).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    ...(eligibility.allowedContextIds === undefined ? {} : { allowedContextIds: sorted(eligibility.allowedContextIds) }),
  };
}

function validatePrototype(manifest: FrameworkManifest, pageId: string, prototype: ManifestPrototype): void {
  if (!prototype.id.trim() || prototype.feature_atoms.length === 0) throw new Error(`candidate ${pageId} has invalid prototype`);
  const seen = new Map<string, string>();
  for (const atom of prototype.feature_atoms) {
    if (!manifest.vector_space.axes[atom.dimension]) throw new Error(`candidate ${pageId}/${prototype.id} uses undeclared dimension ${atom.dimension}`);
    const current = seen.get(atom.dimension);
    if (current && current !== atom.value) throw new Error(`candidate ${pageId}/${prototype.id} has multiple ${atom.dimension} values`);
    seen.set(atom.dimension, atom.value);
  }
}

function primaryFirst(prototypes: readonly ManifestPrototype[], primaryId: string): ManifestPrototype[] {
  const primary = prototypes.find((item) => item.id === primaryId);
  if (!primary) throw new Error(`missing primary prototype ${primaryId}`);
  return [canonicalPrototype(primary), ...prototypes.filter((item) => item.id !== primaryId).map(canonicalPrototype).sort((left, right) => left.id.localeCompare(right.id))];
}
function canonicalPrototype(prototype: ManifestPrototype): ManifestPrototype { return { id: prototype.id, feature_atoms: [...prototype.feature_atoms].sort(compareAtoms) }; }
function atomsToFeatures(atoms: readonly ManifestFeatureAtom[]): FeatureMap { const output: FeatureMap = {}; for (const atom of atoms) { if (output[atom.dimension] && output[atom.dimension] !== atom.value) throw new Error(`multiple values for ${atom.dimension}`); output[atom.dimension] = atom.value; } return output; }
function compareAtoms(left: ManifestFeatureAtom, right: ManifestFeatureAtom): number { return left.dimension.localeCompare(right.dimension) || left.value.localeCompare(right.value) || left.source_id.localeCompare(right.source_id) || left.provenance.localeCompare(right.provenance); }
function sorted(values: readonly string[]): string[] { return [...new Set(values)].sort(); }
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V { const value = map.get(key); if (value === undefined) throw new Error(`missing ${String(key)}`); return value; }
