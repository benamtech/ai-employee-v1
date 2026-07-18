import type { ContextCase } from "./core.js";
import type { ContextCorpus, FrozenContextCase } from "./context-corpus.js";
import { greedyCompositeSelection, type CompositeCandidate } from "./optimizer.js";
import type { NormalizedProject } from "./project-input.js";
import { compileTypedGraph, type TypedPageGraph } from "./typed-graph.js";
import { buildValidationReport, finding, type ValidationReport } from "./validation-contracts.js";
import { SELECTION_VALIDATION, coordinateSimilarity, type PageCoordinate } from "./page-coordinate.js";
import { sha256 } from "./core.js";

export interface RejectedCoordinate { id: string; reasons: readonly string[]; }
export interface SelectedCorpusPlan {
  projectId: string;
  corpusId: string;
  selected: readonly PageCoordinate[];
  rejected: readonly RejectedCoordinate[];
  typedGraph: TypedPageGraph;
  objective: number;
  coverageObjective: number;
  informationObjective: number;
  rareTailObjective: number;
  diversityObjective: number;
  validationCoverage: number;
  testCoverage: number;
  budget: number;
  spent: number;
  maximumPages: number;
  planHash: string;
  validation: ValidationReport;
}
export interface CorpusSelectionOptions { budget: number; informationWeight: number; rareTailWeight: number; diversityWeight: number; minimumValidationCoverage: number; minimumTestCoverage: number; maximumPages?: number; }

export function selectCorpusPlan(
  project: NormalizedProject,
  corpus: ContextCorpus,
  coordinates: readonly PageCoordinate[],
  options: CorpusSelectionOptions,
): SelectedCorpusPlan {
  if (!Number.isFinite(options.budget) || options.budget <= 0) throw new Error("selection budget must be positive");
  const maximumPages = Math.min(options.maximumPages ?? project.input.goals.maximumInitialPages, project.input.goals.maximumInitialPages);
  if (!Number.isInteger(maximumPages) || maximumPages < 1) throw new Error("selection maximumPages must be a positive integer");
  const effectiveBudget = Math.min(options.budget, maximumPages);
  validateCoordinateLedgers(project, coordinates);

  const train = corpus.cases.filter((item) => item.split === "train");
  const candidateIds = coordinates.map((item) => item.id);
  const similarities = train.map((context) => coordinates.map((coordinate) => coordinate.contextCompatibility.find((item) => item.contextId === context.id)?.calibratedProbability ?? 0));
  const contexts: ContextCase[] = train.map((item) => ({ id: item.id, weight: item.weight, ...(item.hiddenSliceIds?.[0] ? { group: item.hiddenSliceIds[0] } : {}) }));
  const candidates: CompositeCandidate[] = coordinates.map((item) => ({ id: item.id, cost: item.lifecycleCost, informationObjectIds: item.informationObjectIds, rareGroups: item.rareGroupIds }));
  const kernel = coordinates.map((left) => coordinates.map((right) => coordinateSimilarity(left, right)));
  const result = greedyCompositeSelection({
    facility: { contexts, candidateIds, similarities, costs: coordinates.map((item) => item.lifecycleCost), budget: effectiveBudget },
    candidates,
    informationWeight: options.informationWeight,
    rareTailWeight: options.rareTailWeight,
    diversityWeight: options.diversityWeight,
    ...(options.diversityWeight === 0 ? {} : { similarityKernel: kernel }),
  });

  const ids = new Set(result.selectedIds.slice(0, maximumPages));
  const selected = coordinates.filter((item) => ids.has(item.id)).sort((left, right) => left.id.localeCompare(right.id));
  const rejected = coordinates.filter((item) => !ids.has(item.id)).map((item) => ({ id: item.id, reasons: rejectionReasons(item, selected) })).sort((left, right) => left.id.localeCompare(right.id));
  const validationCoverage = meanCoverage(corpus.cases.filter((item) => item.split === "validation"), selected);
  const testCoverage = meanCoverage(corpus.cases.filter((item) => item.split === "test"), selected);
  const spent = selected.reduce((sum, item) => sum + item.lifecycleCost, 0);
  const graph = compileTypedGraph(selected.map((item) => item.id), selected.flatMap((item) => item.graphEdges.filter((edge) => ids.has(edge.fromPageId) && ids.has(edge.toPageId))));
  const pass = selected.length > 0 && selected.length <= maximumPages && spent <= effectiveBudget && validationCoverage >= options.minimumValidationCoverage && testCoverage >= options.minimumTestCoverage;
  const findings = [
    finding("coordinate.primary", selected.every((item) => item.prototypes.some((prototype) => prototype.id === item.primaryPrototypeId)) ? "pass" : "fail", "selected coordinates preserve primary prototypes"),
    finding("coordinate.eligibility", selected.every((item) => item.contextCompatibility.some((fit) => fit.eligible)) ? "pass" : "fail", "selected coordinates have eligible contexts"),
    finding("coordinate.specificity", selected.every((item) => item.informationObjectIds.length > 0 && item.evidenceIds.length > 0) ? "pass" : "fail", "selected coordinates retain information objects and evidence"),
    finding("selection.coverage", pass ? "pass" : "fail", `selected=${selected.length}/${maximumPages}, spent=${spent}/${effectiveBudget}, validation=${validationCoverage.toFixed(4)}, test=${testCoverage.toFixed(4)}`, { measured: Math.min(validationCoverage, testCoverage), threshold: Math.min(options.minimumValidationCoverage, options.minimumTestCoverage) }),
    finding("selection.balance", "pass", `coverage=${result.coverageObjective.toFixed(4)}, information=${result.informationObjective.toFixed(4)}, rare=${result.rareTailObjective.toFixed(4)}, diversity=${result.diversityObjective.toFixed(4)}`),
  ];
  const canonical = { projectId: project.input.id, corpusId: corpus.id, selectedIds: selected.map((item) => item.id), rejected, graphHash: graph.graphHash, objective: result.objective, coverageObjective: result.coverageObjective, informationObjective: result.informationObjective, rareTailObjective: result.rareTailObjective, diversityObjective: result.diversityObjective, validationCoverage, testCoverage, budget: effectiveBudget, spent, maximumPages };
  return { projectId: project.input.id, corpusId: corpus.id, selected, rejected, typedGraph: graph, objective: result.objective, coverageObjective: result.coverageObjective, informationObjective: result.informationObjective, rareTailObjective: result.rareTailObjective, diversityObjective: result.diversityObjective, validationCoverage, testCoverage, budget: effectiveBudget, spent, maximumPages, planHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`selected-corpus:${project.input.id}`, SELECTION_VALIDATION, findings) };
}

function validateCoordinateLedgers(project: NormalizedProject, coordinates: readonly PageCoordinate[]): void {
  const sourceIds = new Set(project.sourceLedger.map((item) => item.id));
  const evidenceIds = new Set(project.evidenceLedger.map((item) => item.id));
  for (const coordinate of coordinates) {
    for (const sourceId of coordinate.sourceIds) if (!sourceIds.has(sourceId)) throw new Error(`coordinate ${coordinate.id} references unknown source ${sourceId}`);
    for (const evidenceId of coordinate.evidenceIds) if (!evidenceIds.has(evidenceId)) throw new Error(`coordinate ${coordinate.id} references unknown evidence ${evidenceId}`);
  }
}
function meanCoverage(contexts: readonly FrozenContextCase[], coordinates: readonly PageCoordinate[]): number { const total = contexts.reduce((sum, item) => sum + item.weight, 0); return total === 0 ? 0 : contexts.reduce((sum, context) => sum + context.weight * coordinates.reduce((best, page) => Math.max(best, page.contextCompatibility.find((item) => item.contextId === context.id)?.calibratedProbability ?? 0), 0), 0) / total; }
function rejectionReasons(item: PageCoordinate, selected: readonly PageCoordinate[]): string[] { const output: string[] = []; if (item.contextCompatibility.every((fit) => fit.calibratedProbability === 0)) output.push("zero eligible calibrated coverage"); const closest = selected.reduce((best, page) => Math.max(best, coordinateSimilarity(item, page)), 0); if (closest >= 0.9) output.push(`redundant with selected corpus (${closest.toFixed(3)})`); if (item.lifecycleCost > 1) output.push(`higher lifecycle cost ${item.lifecycleCost}`); if (output.length === 0) output.push("lower marginal objective under current budget/page cap"); return output; }
