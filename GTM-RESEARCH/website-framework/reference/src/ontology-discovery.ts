import { sha256 } from "./core.js";
import type { NormalizedProject } from "./project-input.js";
import { buildSparseLexicalIndex, lexicalNeighbors, tokenizeLexical, type SparseLexicalIndex } from "./sparse-lexical.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export type OntologySensitivity = "operational" | "business" | "lifestyle" | "demographic" | "protected" | "private" | "inferred-sensitive";
export type MaterialEffect = "problem-framing" | "workflow" | "offer-fit" | "proof" | "utility" | "conversion" | "vocabulary" | "ui";
export type OntologyRelationType = "compatible" | "requires" | "excludes" | "cooccurs" | "broader" | "narrower" | "supports-offer" | "supports-topic" | "supports-workflow";

export interface OntologyAttributeProposal {
  id: string;
  label: string;
  description: string;
  dimensionHint: string;
  sourceIds: readonly string[];
  evidenceIds: readonly string[];
  confidence: number;
  sensitivity: OntologySensitivity;
  publicTargetingAllowed: boolean;
  reviewerApproved: boolean;
  materialEffects: readonly MaterialEffect[];
  anchorKind?: "service" | "offer" | "problem" | "topic" | "intent" | "workflow" | "outcome" | "location";
}

export interface OntologyRelationProposal {
  id: string;
  fromAttributeId: string;
  toAttributeId: string;
  type: OntologyRelationType;
  weight: number;
  sourceIds: readonly string[];
  evidenceIds: readonly string[];
  rationale: string;
}

export interface OntologyObservationProposal {
  id: string;
  attributeIds: readonly string[];
  sourceIds: readonly string[];
  evidenceIds: readonly string[];
  weight: number;
  description: string;
}

export interface AgentOntologyProposal {
  id: string;
  version: string;
  generatedBy: string;
  generatedAt: string;
  sourceIds: readonly string[];
  attributes: readonly OntologyAttributeProposal[];
  relations: readonly OntologyRelationProposal[];
  observations: readonly OntologyObservationProposal[];
}

export interface OntologyCompilerPolicy {
  minimumConfidence: number;
  minimumMaterialEffects: number;
  demographicMinimumMaterialEffects: number;
  lexicalDuplicateThreshold: number;
  lexicalNeighborLimit: number;
  requireReviewerApprovalForDemographic: boolean;
  prohibitedSensitivities: readonly OntologySensitivity[];
}

export interface ApprovedOntologyAttribute extends OntologyAttributeProposal {
  dimension: string;
  normalizedLabel: string;
  tokens: readonly string[];
}

export interface RejectedOntologyAttribute {
  id: string;
  reasons: readonly string[];
}

export interface ApprovedOntology {
  id: string;
  version: string;
  generatedBy: string;
  sourceIds: readonly string[];
  attributes: readonly ApprovedOntologyAttribute[];
  rejectedAttributes: readonly RejectedOntologyAttribute[];
  relations: readonly OntologyRelationProposal[];
  observations: readonly OntologyObservationProposal[];
  dimensions: Readonly<Record<string, readonly string[]>>;
  lexicalIndex: SparseLexicalIndex;
  ontologyHash: string;
  validation: ValidationReport;
}

export const ONTOLOGY_VALIDATION: readonly ValidationAttribute[] = [
  { id: "ontology.provenance", feature: "Agent-generated ontology provenance", workflowStep: "discover-ontology", algorithmChoice: "typed proposal bound to approved project ledgers", userEffect: "the user can review which agent proposed each attribute and what sources support it", developerEffect: "ontology state is not reconstructed from prompt history", validationVector: ["proposal ID/version", "agent ID", "source/evidence IDs", "stable hash"], passVector: ["all references resolve", "proposal identity is stable"], failVector: ["anonymous ontology", "unknown evidence", "prompt-only attributes"], simplerBaseline: "free-form brainstorming", severity: "hard" },
  { id: "ontology.dimensions", feature: "Discovered dimension normalization", workflowStep: "discover-ontology", algorithmChoice: "agent dimension hints normalized into governed dimensions", userEffect: "the framework discovers prospect and business dimensions from supplied truth rather than requiring the user to author a matrix", developerEffect: "later vector roles are deterministic and inspectable", validationVector: ["non-empty dimension", "one normalized label per dimension", "anchor coverage"], passVector: ["every approved attribute has one dimension", "at least one business anchor"], failVector: ["user must hand-author vector axes", "empty dimension", "duplicate value in one dimension"], simplerBaseline: "fixed global schema", severity: "hard" },
  { id: "ontology.materiality", feature: "Page-changing materiality", workflowStep: "discover-ontology", algorithmChoice: "explicit material-effect taxonomy", userEffect: "attributes survive only when they can change the answer, workflow, proof, utility, conversion, vocabulary, or UI", developerEffect: "page generation cannot use cosmetic demographics as filler", validationVector: ["material effects", "confidence", "anchor kind"], passVector: ["minimum material effect count", "business anchors retained"], failVector: ["stereotype-only attribute", "zero page effect", "confidence below floor"], simplerBaseline: "agent intuition only", severity: "hard" },
  { id: "ontology.safety", feature: "Targeting safety boundary", workflowStep: "discover-ontology", algorithmChoice: "sensitivity classes plus reviewer gate", userEffect: "private, protected, or covertly inferred traits do not become public targeting axes", developerEffect: "unsafe combinations fail before vector construction", validationVector: ["sensitivity", "public-targeting flag", "review approval", "material effects"], passVector: ["prohibited sensitivities rejected", "demographic/lifestyle attributes explicitly approved and materially justified"], failVector: ["protected/private targeting", "fingerprint-derived identity", "unreviewed demographic axis"], simplerBaseline: "allow every agent suggestion", severity: "hard" },
  { id: "ontology.lexical", feature: "Sparse lexical baseline", workflowStep: "compile-ontology", algorithmChoice: "tokenization + TF-IDF cosine + BM25", userEffect: "obvious duplicate and related concepts are inspectable without relying on an opaque embedding model", developerEffect: "learned semantic and VSA arms have a deterministic baseline", validationVector: ["tokenization", "IDF", "neighbor list", "source-order determinism"], passVector: ["stable lexical index", "near duplicates flagged within dimension"], failVector: ["embedding-only ontology", "duplicate labels survive", "order-dependent vocabulary"], simplerBaseline: "lowercased string equality", severity: "hard" },
  { id: "ontology.relations", feature: "Evidence-bound ontology relations", workflowStep: "compile-ontology", algorithmChoice: "typed relation graph", userEffect: "compatibility, requirements, exclusions, hierarchy, and offer/topic/workflow relationships remain explainable", developerEffect: "candidate generation uses explicit edge semantics instead of model intuition alone", validationVector: ["known endpoints", "relation type", "weight", "rationale", "sources/evidence"], passVector: ["all edges resolve", "exclusion and requirement state is explicit"], failVector: ["unknown endpoint", "untyped edge", "evidence-free compatibility"], simplerBaseline: "cosine-only graph", severity: "hard" },
  { id: "ontology.observations", feature: "Small object-attribute evidence table", workflowStep: "compile-ontology", algorithmChoice: "weighted observations for co-occurrence and closed-conjunction seeds", userEffect: "candidate combinations are grounded in observed or researched situations", developerEffect: "frequent/closed-itemset and graph controls have a deterministic input table", validationVector: ["known attributes", "source/evidence", "positive weight", "minimum width"], passVector: ["all observations resolve", "at least one observation"], failVector: ["combination space has no supporting objects", "unknown attribute", "zero-weight observation"], simplerBaseline: "unrestricted Cartesian product", severity: "hard" },
];

export const DEFAULT_ONTOLOGY_POLICY: OntologyCompilerPolicy = {
  minimumConfidence: 0.6,
  minimumMaterialEffects: 1,
  demographicMinimumMaterialEffects: 2,
  lexicalDuplicateThreshold: 0.94,
  lexicalNeighborLimit: 12,
  requireReviewerApprovalForDemographic: true,
  prohibitedSensitivities: ["protected", "private", "inferred-sensitive"],
};

export function compileApprovedOntology(
  project: NormalizedProject,
  proposal: AgentOntologyProposal,
  policy: OntologyCompilerPolicy = DEFAULT_ONTOLOGY_POLICY,
): ApprovedOntology {
  validatePolicy(policy);
  if (!proposal.id.trim() || !proposal.version.trim() || !proposal.generatedBy.trim() || !proposal.generatedAt.trim()) throw new Error("ontology proposal requires identity, generator, and timestamp");
  const projectSources = new Set(project.sourceLedger.map((item) => item.id));
  const projectEvidence = new Set(project.evidenceLedger.map((item) => item.id));
  validateReferences(proposal.sourceIds, projectSources, "ontology proposal source");

  const ids = new Set<string>();
  const candidates: ApprovedOntologyAttribute[] = [];
  const rejected: RejectedOntologyAttribute[] = [];
  for (const item of [...proposal.attributes].sort((left, right) => left.id.localeCompare(right.id))) {
    if (!item.id.trim() || ids.has(item.id)) throw new Error(`invalid or duplicate ontology attribute ${item.id}`);
    ids.add(item.id);
    validateReferences(item.sourceIds, projectSources, `attribute ${item.id} source`);
    validateReferences(item.evidenceIds, projectEvidence, `attribute ${item.id} evidence`);
    const reasons = attributeRejectionReasons(item, policy);
    const dimension = slug(item.dimensionHint);
    const normalizedLabel = slug(item.label);
    if (!dimension) reasons.push("missing normalized dimension");
    if (!normalizedLabel) reasons.push("missing normalized label");
    if (reasons.length > 0) {
      rejected.push({ id: item.id, reasons: [...new Set(reasons)].sort() });
      continue;
    }
    candidates.push({ ...item, dimension, normalizedLabel, sourceIds: sorted(item.sourceIds), evidenceIds: sorted(item.evidenceIds), materialEffects: [...new Set(item.materialEffects)].sort(), tokens: tokenizeLexical(`${item.label} ${item.description} ${dimension}`) });
  }

  const exactKeys = new Map<string, string>();
  const exactFiltered: ApprovedOntologyAttribute[] = [];
  for (const item of candidates) {
    const key = `${item.dimension}:${item.normalizedLabel}`;
    const existing = exactKeys.get(key);
    if (existing) {
      rejected.push({ id: item.id, reasons: [`exact duplicate of ${existing}`] });
      continue;
    }
    exactKeys.set(key, item.id);
    exactFiltered.push(item);
  }

  const preliminaryIndex = buildSparseLexicalIndex(exactFiltered.map((item) => ({ id: item.id, text: `${item.label} ${item.description} ${item.dimension} ${item.materialEffects.join(" ")}` })));
  const lexicalRejected = new Set<string>();
  for (const item of exactFiltered) {
    if (lexicalRejected.has(item.id)) continue;
    for (const neighbor of lexicalNeighbors(preliminaryIndex, item.id, policy.lexicalNeighborLimit)) {
      if (neighbor.cosine < policy.lexicalDuplicateThreshold) continue;
      const other = exactFiltered.find((candidate) => candidate.id === neighbor.documentId);
      if (!other || other.dimension !== item.dimension || lexicalRejected.has(other.id)) continue;
      const reject = chooseDuplicate(item, other);
      const keep = reject.id === item.id ? other : item;
      lexicalRejected.add(reject.id);
      rejected.push({ id: reject.id, reasons: [`lexical near-duplicate of ${keep.id} (${neighbor.cosine.toFixed(4)})`] });
    }
  }
  const attributes = exactFiltered.filter((item) => !lexicalRejected.has(item.id)).sort((left, right) => left.id.localeCompare(right.id));
  if (attributes.length === 0) throw new Error("ontology proposal produced no approved attributes");
  const approvedIds = new Set(attributes.map((item) => item.id));

  const relationIds = new Set<string>();
  const relations = [...proposal.relations].map((relation) => {
    if (!relation.id.trim() || relationIds.has(relation.id)) throw new Error(`invalid or duplicate ontology relation ${relation.id}`);
    relationIds.add(relation.id);
    if (!approvedIds.has(relation.fromAttributeId) || !approvedIds.has(relation.toAttributeId)) throw new Error(`relation ${relation.id} references rejected or unknown attribute`);
    if (relation.fromAttributeId === relation.toAttributeId) throw new Error(`relation ${relation.id} is a self-loop`);
    if (!Number.isFinite(relation.weight) || relation.weight <= 0 || relation.weight > 1) throw new Error(`relation ${relation.id} has invalid weight`);
    if (!relation.rationale.trim()) throw new Error(`relation ${relation.id} requires rationale`);
    validateReferences(relation.sourceIds, projectSources, `relation ${relation.id} source`);
    validateReferences(relation.evidenceIds, projectEvidence, `relation ${relation.id} evidence`);
    return { ...relation, sourceIds: sorted(relation.sourceIds), evidenceIds: sorted(relation.evidenceIds) };
  }).sort(compareRelations);

  const observationIds = new Set<string>();
  const observations = [...proposal.observations].map((observation) => {
    if (!observation.id.trim() || observationIds.has(observation.id)) throw new Error(`invalid or duplicate ontology observation ${observation.id}`);
    observationIds.add(observation.id);
    const attributeIds = sorted(observation.attributeIds);
    if (attributeIds.length < 2) throw new Error(`observation ${observation.id} requires at least two attributes`);
    for (const id of attributeIds) if (!approvedIds.has(id)) throw new Error(`observation ${observation.id} references rejected or unknown attribute ${id}`);
    if (!Number.isFinite(observation.weight) || observation.weight <= 0) throw new Error(`observation ${observation.id} requires positive weight`);
    if (!observation.description.trim()) throw new Error(`observation ${observation.id} requires description`);
    validateReferences(observation.sourceIds, projectSources, `observation ${observation.id} source`);
    validateReferences(observation.evidenceIds, projectEvidence, `observation ${observation.id} evidence`);
    return { ...observation, attributeIds, sourceIds: sorted(observation.sourceIds), evidenceIds: sorted(observation.evidenceIds) };
  }).sort((left, right) => left.id.localeCompare(right.id));
  if (observations.length === 0) throw new Error("ontology proposal requires at least one object-attribute observation");

  const dimensionsMutable = new Map<string, string[]>();
  for (const attribute of attributes) {
    const values = dimensionsMutable.get(attribute.dimension) ?? [];
    values.push(attribute.id);
    dimensionsMutable.set(attribute.dimension, values);
  }
  const dimensions = Object.fromEntries([...dimensionsMutable.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([dimension, values]) => [dimension, [...values].sort()]));
  const lexicalIndex = buildSparseLexicalIndex(attributes.map((item) => ({ id: item.id, text: `${item.label} ${item.description} ${item.dimension} ${item.materialEffects.join(" ")}` })));
  const hasAnchor = attributes.some((item) => Boolean(item.anchorKind));
  const findings = [
    finding("ontology.provenance", "pass", `${attributes.length} approved attributes resolve to project source/evidence ledgers`),
    finding("ontology.dimensions", hasAnchor ? "pass" : "fail", `${Object.keys(dimensions).length} discovered dimensions; anchors=${attributes.filter((item) => item.anchorKind).length}`),
    finding("ontology.materiality", attributes.every((item) => item.materialEffects.length >= (isDemographic(item.sensitivity) ? policy.demographicMinimumMaterialEffects : policy.minimumMaterialEffects)) ? "pass" : "fail", "all approved attributes satisfy materiality floors"),
    finding("ontology.safety", attributes.every((item) => !policy.prohibitedSensitivities.includes(item.sensitivity)) ? "pass" : "fail", `${rejected.filter((item) => item.reasons.some((reason) => reason.includes("sensitivity"))).length} unsafe attributes rejected`),
    finding("ontology.lexical", "pass", `${lexicalIndex.documents.length} sparse lexical documents; ${lexicalRejected.size} near duplicates rejected`),
    finding("ontology.relations", relations.length > 0 ? "pass" : "fail", `${relations.length} typed evidence-bound relations compiled`),
    finding("ontology.observations", observations.length > 0 ? "pass" : "fail", `${observations.length} weighted object-attribute observations compiled`),
  ];
  const canonical = { id: proposal.id, version: proposal.version, generatedBy: proposal.generatedBy, sourceIds: sorted(proposal.sourceIds), attributes, rejectedAttributes: [...rejected].sort((left, right) => left.id.localeCompare(right.id)), relations, observations, dimensions, lexicalIndexHash: lexicalIndex.indexHash };
  return { ...canonical, lexicalIndex, ontologyHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`ontology:${proposal.id}`, ONTOLOGY_VALIDATION, findings) };
}

function attributeRejectionReasons(item: OntologyAttributeProposal, policy: OntologyCompilerPolicy): string[] {
  const reasons: string[] = [];
  if (!item.label.trim() || !item.description.trim()) reasons.push("missing label or description");
  if (!Number.isFinite(item.confidence) || item.confidence < policy.minimumConfidence || item.confidence > 1) reasons.push("confidence below policy floor or invalid");
  const materialEffects = new Set(item.materialEffects);
  const minimumEffects = isDemographic(item.sensitivity) ? policy.demographicMinimumMaterialEffects : policy.minimumMaterialEffects;
  if (materialEffects.size < minimumEffects && !item.anchorKind) reasons.push(`requires at least ${minimumEffects} material effects`);
  if (policy.prohibitedSensitivities.includes(item.sensitivity)) reasons.push(`prohibited sensitivity ${item.sensitivity}`);
  if (isDemographic(item.sensitivity)) {
    if (!item.publicTargetingAllowed) reasons.push("demographic/lifestyle attribute not approved for public targeting");
    if (policy.requireReviewerApprovalForDemographic && !item.reviewerApproved) reasons.push("demographic/lifestyle attribute requires reviewer approval");
  }
  return reasons;
}
function chooseDuplicate(left: ApprovedOntologyAttribute, right: ApprovedOntologyAttribute): ApprovedOntologyAttribute {
  if (left.confidence !== right.confidence) return left.confidence < right.confidence ? left : right;
  if (left.evidenceIds.length !== right.evidenceIds.length) return left.evidenceIds.length < right.evidenceIds.length ? left : right;
  return left.id.localeCompare(right.id) <= 0 ? right : left;
}
function validatePolicy(policy: OntologyCompilerPolicy): void {
  if (![policy.minimumConfidence, policy.lexicalDuplicateThreshold].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error("ontology confidence and lexical thresholds must be within [0,1]");
  if (!Number.isInteger(policy.minimumMaterialEffects) || policy.minimumMaterialEffects < 0 || !Number.isInteger(policy.demographicMinimumMaterialEffects) || policy.demographicMinimumMaterialEffects < 1) throw new Error("ontology material-effect floors are invalid");
  if (!Number.isInteger(policy.lexicalNeighborLimit) || policy.lexicalNeighborLimit < 1) throw new Error("ontology lexical neighbor limit must be positive");
}
function validateReferences(ids: readonly string[], allowed: ReadonlySet<string>, label: string): void {
  if (ids.length === 0) throw new Error(`${label} requires at least one reference`);
  for (const id of ids) if (!allowed.has(id)) throw new Error(`${label} references unknown ${id}`);
}
function isDemographic(sensitivity: OntologySensitivity): boolean { return sensitivity === "demographic" || sensitivity === "lifestyle"; }
function slug(value: string): string { return value.normalize("NFKC").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, ""); }
function sorted(values: readonly string[]): string[] { return [...new Set(values)].sort(); }
function compareRelations(left: OntologyRelationProposal, right: OntologyRelationProposal): number { return left.fromAttributeId.localeCompare(right.fromAttributeId) || left.type.localeCompare(right.type) || left.toAttributeId.localeCompare(right.toAttributeId) || left.id.localeCompare(right.id); }
