import { compileHrrFeatures, type FeatureMap, type VectorSpaceIdentity } from "./benchmark.js";
import { cosine, hash32, sha256, type Vector } from "./core.js";
import type { ManifestFeatureAtom } from "./manifest.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export type RelevanceLabel = "perfect" | "good" | "fair" | "bad";
export type CorpusSplit = "train" | "validation" | "test";
export interface ContextJudgment { assessorId: string; label: RelevanceLabel; rationale: string; }
export interface ContextCorpusCase {
  id: string; query: string; task: string; weight: number;
  featureAtoms: readonly ManifestFeatureAtom[]; sourceIds: readonly string[];
  judgments: readonly ContextJudgment[]; hiddenSliceIds?: readonly string[]; explicitSplit?: CorpusSplit;
  provenance: { createdBy: string; authorClass: "independent-research" | "customer-source" | "field-observation" | "agent-generated"; createdAt: string; };
}
export interface FrozenContextCase extends ContextCorpusCase { split: CorpusSplit; consensusLabel: RelevanceLabel; disagreement: number; }
export interface ContextCorpus { id: string; version: string; seed: string; cases: readonly FrozenContextCase[]; corpusHash: string; splitHashes: Readonly<Record<CorpusSplit, string>>; validation: ValidationReport; }
export interface SplitPolicy { train: number; validation: number; test: number; seed: string; minimumAssessors: number; forbidGeneratorAuthoredAcceptance: boolean; }
export interface CalibrationObservation { id: string; split: CorpusSplit; rawScore: number; label: RelevanceLabel; weight: number; }
export interface IsotonicCalibrationModel { id: string; thresholds: readonly number[]; probabilities: readonly number[]; trainingObservationIds: readonly string[]; modelHash: string; }
export interface CalibrationMetrics { count: number; brier: number; meanAbsoluteError: number; expectedCalibrationError: number; monotonic: boolean; }
export interface CompatibilityCalibration { model: IsotonicCalibrationModel; train: CalibrationMetrics; validation: CalibrationMetrics; test: CalibrationMetrics; validationReport: ValidationReport; }

export const CONTEXT_VALIDATION: readonly ValidationAttribute[] = [
  { id: "context.independence", feature: "Independent context corpus", workflowStep: "research", algorithmChoice: "provenance-class and assessor separation", userEffect: "page opportunities are justified by reviewable customer/search contexts rather than self-authored prompts", developerEffect: "generation agents cannot create their own acceptance evidence", validationVector: ["author class", "source IDs", "assessor IDs", "generator separation"], passVector: ["accepted cases have independent or field provenance", "minimum assessor count met"], failVector: ["same agent proposes page and sole validation context", "missing sources", "no judgments"], simplerBaseline: "agent-written opportunity list", severity: "hard" },
  { id: "context.splits", feature: "Frozen train/validation/test splits", workflowStep: "research", algorithmChoice: "seeded deterministic stratification by hidden slice", userEffect: "evaluation results remain comparable across generation runs", developerEffect: "threshold tuning cannot silently leak test cases", validationVector: ["split membership", "seed", "split hashes", "hidden-slice balance"], passVector: ["same corpus+seed yields identical splits", "all three splits exist when corpus size permits"], failVector: ["split changes after page generation", "test cases used for fitting", "missing split hash"], simplerBaseline: "random split on every run", severity: "hard" },
  { id: "context.labels", feature: "Graded contextual relevance", workflowStep: "research", algorithmChoice: "Perfect/Good/Fair/Bad consensus with disagreement tracking", userEffect: "the framework distinguishes excellent fit from merely related content", developerEffect: "ranking arms can be compared against graded external labels", validationVector: ["label validity", "consensus", "disagreement", "rationale"], passVector: ["consensus is deterministic", "disagreement is preserved", "rationales non-empty"], failVector: ["binary self-label only", "discarded disagreement", "empty rationale"], simplerBaseline: "positive/negative label", severity: "hard" },
  { id: "compatibility.calibration", feature: "Calibrated compatibility", workflowStep: "plan", algorithmChoice: "typed eligibility + raw positive cosine + isotonic calibration", userEffect: "page selection uses interpretable compatibility probabilities instead of arbitrary cosine thresholds", developerEffect: "thresholds are fit on train and evaluated on untouched validation/test cases", validationVector: ["monotonic mapping", "Brier score", "ECE", "held-out metrics", "zero for ineligible"], passVector: ["monotonic model", "finite held-out metrics", "orthogonal/ineligible cases do not receive shifted 0.5 credit"], failVector: ["shifted cosine treated as probability", "fit uses test labels", "ineligible candidate receives positive fit"], simplerBaseline: "max(0, cosine) threshold", severity: "hard" },
];

export function freezeContextCorpus(id: string, version: string, cases: readonly ContextCorpusCase[], policy: SplitPolicy, generationAgentId?: string): ContextCorpus {
  validateSplitPolicy(policy);
  if (!id.trim() || !version.trim()) throw new Error("context corpus id and version are required");
  if (cases.length < 3) throw new Error("context corpus requires at least three cases");
  const ids = new Set<string>();
  const normalized = [...cases].map((item) => {
    if (!item.id.trim() || ids.has(item.id)) throw new Error(`invalid or duplicate context case ${item.id}`); ids.add(item.id);
    if (!item.query.trim() || !item.task.trim()) throw new Error(`context ${item.id} requires query and task`);
    if (!Number.isFinite(item.weight) || item.weight <= 0) throw new Error(`context ${item.id} requires positive weight`);
    if (item.featureAtoms.length === 0 || item.sourceIds.length === 0) throw new Error(`context ${item.id} requires atoms and source IDs`);
    if (item.judgments.length < policy.minimumAssessors) throw new Error(`context ${item.id} requires ${policy.minimumAssessors} assessors`);
    const assessorIds = new Set<string>();
    for (const judgment of item.judgments) { if (!judgment.assessorId.trim() || assessorIds.has(judgment.assessorId)) throw new Error(`context ${item.id} has invalid assessor`); if (!judgment.rationale.trim()) throw new Error(`context ${item.id} has empty judgment rationale`); assessorIds.add(judgment.assessorId); }
    if (policy.forbidGeneratorAuthoredAcceptance && generationAgentId && item.provenance.createdBy === generationAgentId && item.provenance.authorClass === "agent-generated") throw new Error(`context ${item.id} was authored by the generation agent`);
    return canonicalCase(item);
  });
  const splitAssignments = assignSplits(normalized, policy);
  const frozen = normalized.map((item) => { const consensus = consensusLabel(item.judgments); return { ...item, split: item.explicitSplit ?? required(splitAssignments, item.id), consensusLabel: consensus.label, disagreement: consensus.disagreement } satisfies FrozenContextCase; }).sort((left, right) => left.id.localeCompare(right.id));
  const splitCounts = countSplits(frozen);
  const findings = [
    finding("context.independence", "pass", `${frozen.length} contexts preserve provenance and assessor identities`),
    finding("context.splits", Object.values(splitCounts).every((count) => count > 0) ? "pass" : "fail", `split counts train=${splitCounts.train}, validation=${splitCounts.validation}, test=${splitCounts.test}`),
    finding("context.labels", "pass", `graded judgments retained; mean disagreement=${mean(frozen.map((item) => item.disagreement)).toFixed(4)}`),
    finding("compatibility.calibration", "pending", "calibration model is fit after page/context scoring"),
  ];
  const splitHashes = { train: hashSplit(frozen, "train"), validation: hashSplit(frozen, "validation"), test: hashSplit(frozen, "test") };
  const canonical = { id, version, seed: policy.seed, cases: frozen, splitHashes };
  return { ...canonical, corpusHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`context-corpus:${id}`, CONTEXT_VALIDATION, findings) };
}

export function fitIsotonicCalibration(id: string, observations: readonly CalibrationObservation[]): CompatibilityCalibration {
  const ids = new Set<string>(); for (const item of observations) { if (!item.id.trim() || ids.has(item.id)) throw new Error(`invalid or duplicate calibration observation ${item.id}`); ids.add(item.id); }
  const train = observations.filter((item) => item.split === "train"); const validation = observations.filter((item) => item.split === "validation"); const test = observations.filter((item) => item.split === "test");
  if (train.length < 2 || validation.length === 0 || test.length === 0) throw new Error("calibration requires train observations and non-empty validation/test splits");
  const model = fitPav(id, train); const trainMetrics = calibrationMetrics(model, train); const validationMetrics = calibrationMetrics(model, validation); const testMetrics = calibrationMetrics(model, test);
  const finite = [trainMetrics, validationMetrics, testMetrics].every((metrics) => Number.isFinite(metrics.brier) && Number.isFinite(metrics.expectedCalibrationError) && metrics.monotonic);
  const report = buildValidationReport(`compatibility:${id}`, CONTEXT_VALIDATION, [
    finding("context.independence", "pass", "calibration consumes frozen labeled observations"), finding("context.splits", "pass", "model fit uses train only; validation and test are evaluation-only"), finding("context.labels", "pass", "graded labels map to ordered numeric targets"), finding("compatibility.calibration", finite ? "pass" : "fail", `validation Brier=${validationMetrics.brier.toFixed(4)}, ECE=${validationMetrics.expectedCalibrationError.toFixed(4)}; test Brier=${testMetrics.brier.toFixed(4)}`),
  ]);
  return { model, train: trainMetrics, validation: validationMetrics, test: testMetrics, validationReport: report };
}

export function predictCompatibility(model: IsotonicCalibrationModel, rawScore: number, eligible = true): number { if (!eligible) return 0; const score = clamp(rawScore, -1, 1); for (let index = 0; index < model.thresholds.length; index += 1) if (score <= model.thresholds[index]) return model.probabilities[index]; return model.probabilities[model.probabilities.length - 1] ?? 0; }
export function contextVector(item: Pick<ContextCorpusCase, "featureAtoms">, dimensions: number, identity: VectorSpaceIdentity): Vector { return compileHrrFeatures(atomsToFeatures(item.featureAtoms), dimensions, identity); }
export function rawPositiveCosine(left: Vector, right: Vector, eligible = true): number { return eligible ? Math.max(0, cosine(left, right)) : 0; }
export function relevanceTarget(label: RelevanceLabel): number { switch (label) { case "perfect": return 1; case "good": return 0.75; case "fair": return 0.35; case "bad": return 0; } }

function fitPav(id: string, observations: readonly CalibrationObservation[]): IsotonicCalibrationModel {
  const sorted = [...observations].sort((left, right) => left.rawScore - right.rawScore || left.id.localeCompare(right.id));
  type Block = { min: number; max: number; weightedTarget: number; weight: number; ids: string[] }; const blocks: Block[] = [];
  for (const observation of sorted) {
    if (!Number.isFinite(observation.rawScore) || !Number.isFinite(observation.weight) || observation.weight <= 0) throw new Error(`invalid calibration observation ${observation.id}`);
    blocks.push({ min: observation.rawScore, max: observation.rawScore, weightedTarget: relevanceTarget(observation.label) * observation.weight, weight: observation.weight, ids: [observation.id] });
    while (blocks.length >= 2) { const right = blocks[blocks.length - 1]; const left = blocks[blocks.length - 2]; if (left.weightedTarget / left.weight <= right.weightedTarget / right.weight) break; blocks.splice(blocks.length - 2, 2, { min: left.min, max: right.max, weightedTarget: left.weightedTarget + right.weightedTarget, weight: left.weight + right.weight, ids: [...left.ids, ...right.ids].sort() }); }
  }
  const thresholds = blocks.map((block) => block.max); const probabilities = blocks.map((block) => clamp(block.weightedTarget / block.weight, 0, 1)); const canonical = { id, thresholds, probabilities, trainingObservationIds: sorted.map((item) => item.id) };
  return { ...canonical, modelHash: sha256(JSON.stringify(canonical)) };
}
function calibrationMetrics(model: IsotonicCalibrationModel, observations: readonly CalibrationObservation[]): CalibrationMetrics {
  if (observations.length === 0) return { count: 0, brier: 0, meanAbsoluteError: 0, expectedCalibrationError: 0, monotonic: true };
  const predictions = observations.map((item) => ({ predicted: predictCompatibility(model, item.rawScore), target: relevanceTarget(item.label), weight: item.weight })); const totalWeight = predictions.reduce((sum, item) => sum + item.weight, 0);
  const brier = predictions.reduce((sum, item) => sum + item.weight * (item.predicted - item.target) ** 2, 0) / totalWeight; const meanAbsoluteError = predictions.reduce((sum, item) => sum + item.weight * Math.abs(item.predicted - item.target), 0) / totalWeight;
  const bins = Array.from({ length: 10 }, () => ({ weight: 0, predicted: 0, target: 0 })); for (const item of predictions) { const index = Math.min(9, Math.floor(item.predicted * 10)); bins[index].weight += item.weight; bins[index].predicted += item.weight * item.predicted; bins[index].target += item.weight * item.target; }
  const expectedCalibrationError = bins.reduce((sum, bin) => bin.weight === 0 ? sum : sum + (bin.weight / totalWeight) * Math.abs(bin.predicted / bin.weight - bin.target / bin.weight), 0); const monotonic = model.probabilities.every((value, index) => index === 0 || value >= model.probabilities[index - 1]);
  return { count: observations.length, brier, meanAbsoluteError, expectedCalibrationError, monotonic };
}
function assignSplits(cases: readonly ContextCorpusCase[], policy: SplitPolicy): Map<string, CorpusSplit> { const output = new Map<string, CorpusSplit>(); for (const item of cases.filter((item) => !item.explicitSplit)) { const normalized = (hash32(`${policy.seed}\0${primarySlice(item)}\0${item.id}`) % 10_000) / 10_000; output.set(item.id, normalized < policy.train ? "train" : normalized < policy.train + policy.validation ? "validation" : "test"); } const all = new Map(cases.map((item) => [item.id, item.explicitSplit ?? required(output, item.id)])); rebalanceMissingSplits(cases, all); return all; }
function rebalanceMissingSplits(cases: readonly ContextCorpusCase[], assignments: Map<string, CorpusSplit>): void { const counts = { train: 0, validation: 0, test: 0 }; for (const split of assignments.values()) counts[split] += 1; const ordered = [...cases].filter((item) => !item.explicitSplit).sort((left, right) => left.id.localeCompare(right.id)); for (const split of ["train", "validation", "test"] as const) { if (counts[split] > 0) continue; const donor = (["train", "validation", "test"] as CorpusSplit[]).sort((left, right) => counts[right] - counts[left]).find((candidate) => counts[candidate] > 1); const item = ordered.find((candidate) => assignments.get(candidate.id) === donor); if (!donor || !item) throw new Error("unable to create non-empty deterministic splits"); assignments.set(item.id, split); counts[donor] -= 1; counts[split] += 1; } }
function consensusLabel(judgments: readonly ContextJudgment[]): { label: RelevanceLabel; disagreement: number } { const targets = judgments.map((item) => relevanceTarget(item.label)); const average = mean(targets); return { label: average >= 0.875 ? "perfect" : average >= 0.575 ? "good" : average >= 0.175 ? "fair" : "bad", disagreement: Math.sqrt(mean(targets.map((target) => (target - average) ** 2))) }; }
function canonicalCase(item: ContextCorpusCase): ContextCorpusCase { return { ...item, featureAtoms: [...item.featureAtoms].sort(compareAtoms), sourceIds: [...new Set(item.sourceIds)].sort(), judgments: [...item.judgments].sort((left, right) => left.assessorId.localeCompare(right.assessorId)), ...(item.hiddenSliceIds === undefined ? {} : { hiddenSliceIds: [...new Set(item.hiddenSliceIds)].sort() }) }; }
function atomsToFeatures(atoms: readonly ManifestFeatureAtom[]): FeatureMap { const output: FeatureMap = {}; for (const atom of atoms) { const current = output[atom.dimension]; if (current && current !== atom.value) throw new Error(`context prototype has multiple ${atom.dimension} values`); output[atom.dimension] = atom.value; } return output; }
function primarySlice(item: ContextCorpusCase): string { return item.hiddenSliceIds?.[0] ?? item.featureAtoms.find((atom) => atom.dimension === "industry")?.value ?? "general"; }
function hashSplit(cases: readonly FrozenContextCase[], split: CorpusSplit): string { return sha256(JSON.stringify(cases.filter((item) => item.split === split).map((item) => item.id).sort())); }
function countSplits(cases: readonly FrozenContextCase[]): Record<CorpusSplit, number> { const result: Record<CorpusSplit, number> = { train: 0, validation: 0, test: 0 }; for (const item of cases) result[item.split] += 1; return result; }
function validateSplitPolicy(policy: SplitPolicy): void { const total = policy.train + policy.validation + policy.test; if (Math.abs(total - 1) > 1e-9 || [policy.train, policy.validation, policy.test].some((value) => value <= 0)) throw new Error("split ratios must be positive and sum to 1"); if (!policy.seed.trim() || !Number.isInteger(policy.minimumAssessors) || policy.minimumAssessors < 1) throw new Error("split policy requires seed and minimumAssessors >= 1"); }
function compareAtoms(left: ManifestFeatureAtom, right: ManifestFeatureAtom): number { return left.dimension.localeCompare(right.dimension) || left.value.localeCompare(right.value) || left.source_id.localeCompare(right.source_id) || left.provenance.localeCompare(right.provenance); }
function mean(values: readonly number[]): number { return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length; }
function clamp(value: number, minimum: number, maximum: number): number { return Math.max(minimum, Math.min(maximum, value)); }
function required<K, V>(map: ReadonlyMap<K, V>, key: K): V { const value = map.get(key); if (value === undefined) throw new Error(`missing ${String(key)}`); return value; }
