import { bind, cosine, deterministicSymbol, hash32, weightedSuperposition, type Vector } from "./core.js";

export const FEATURE_ROLES = ["vertical", "task", "stage", "proof", "constraint", "geography", "device", "surface"] as const;
export type FeatureRole = typeof FEATURE_ROLES[number];
export type FeatureMap = Partial<Record<FeatureRole, string>>;

export const DESIGN_CAPABILITIES = [
  "semantic-hierarchy", "responsive-grid", "evidence-dense", "comparison-table", "workflow-steps",
  "progressive-disclosure", "conversion-panel", "media-slot", "reduced-motion", "long-form-reading",
  "mobile-priority", "structured-data-visible", "instruction-pointer",
] as const;
export type DesignCapability = typeof DESIGN_CAPABILITIES[number];

export interface SearchContextPrototype {
  id: string;
  query: string;
  queryTokens: string[];
  features: FeatureMap;
  graphNodes: string[];
  demandWeight: number;
  zeroMatch: boolean;
  expectedPageId: string | null;
  expectedDesignCapabilities: DesignCapability[];
}

export interface CandidatePagePrototype {
  id: string;
  route: string;
  title: string;
  queryTokens: string[];
  features: FeatureMap;
  graphNodes: string[];
  evidenceLevel: number;
  informationObjectIds: string[];
  designCapabilities: DesignCapability[];
  eligible: boolean;
}

export interface ScoreBreakdown {
  lexical: number;
  semantic: number;
  facets: number;
  graph: number;
  hrr: number;
  design: number;
  evidence: number;
  total: number;
  eligible: boolean;
}

export interface RankedPage { pageId: string; score: number; breakdown: ScoreBreakdown; }
export type ScoringArm = "lexical" | "semantic" | "facets" | "hrr" | "hybrid";

export interface BenchmarkFixture {
  contexts: SearchContextPrototype[];
  pages: CandidatePagePrototype[];
}

export interface BenchmarkMetrics {
  arm: ScoringArm;
  ndcgAt5: number;
  ndcgAt10: number;
  top1Accuracy: number;
  zeroMatchAccuracy: number;
  badFitRate: number;
  meanReciprocalRank: number;
}

const VERTICALS = ["painting", "landscaping", "hvac", "roofing", "plumbing"];
const TASKS = ["estimate-followup", "missed-call-intake", "invoice-reminders", "change-orders", "scheduling", "review-request", "document-collection", "job-proof"];
const STAGES = ["diagnose", "compare", "implement"];
const PROOFS = ["workflow", "security"];
const CONSTRAINTS = ["no-api-keys", "owner-approval", "low-technical-burden"];
const GEOGRAPHIES = ["us-west", "us-south", "us-midwest", "us-east"];
const DEVICES = ["mobile", "desktop"];

export function generateBenchmarkFixture(contextCount = 500): BenchmarkFixture {
  const pages: CandidatePagePrototype[] = [];
  for (const vertical of VERTICALS) for (const task of TASKS) for (const stage of STAGES) for (const proof of PROOFS) {
    const id = `page:${vertical}:${task}:${stage}:${proof}`;
    pages.push({
      id,
      route: `/${vertical}/${task}/${stage}-${proof}`,
      title: `${humanize(task)} for ${humanize(vertical)} contractors: ${humanize(stage)} with ${humanize(proof)} proof`,
      queryTokens: tokenize(`${vertical} contractor ${task} ai employee ${stage} ${proof}`),
      features: { vertical, task, stage, proof, constraint: "owner-approval", surface: "canonical-page" },
      graphNodes: [`vertical:${vertical}`, `task:${task}`, `stage:${stage}`, `proof:${proof}`, "offer:ai-employee"],
      evidenceLevel: proof === "security" ? 4 : 3,
      informationObjectIds: [`info:${vertical}:${task}`, `info:${stage}:${proof}`],
      designCapabilities: designNeeds(stage, proof, task),
      eligible: true,
    });
  }

  const contexts: SearchContextPrototype[] = [];
  for (let index = 0; index < contextCount; index += 1) {
    const zeroMatch = index % 17 === 0;
    const vertical = VERTICALS[index % VERTICALS.length];
    const task = TASKS[(index * 3 + Math.floor(index / 7)) % TASKS.length];
    const stage = STAGES[(index * 5 + 1) % STAGES.length];
    const proof = PROOFS[(index * 7 + 1) % PROOFS.length];
    const constraint = CONSTRAINTS[(index * 11) % CONSTRAINTS.length];
    const geography = GEOGRAPHIES[(index * 13) % GEOGRAPHIES.length];
    const device = DEVICES[(index * 17) % DEVICES.length];
    const expectedPageId = zeroMatch ? null : `page:${vertical}:${task}:${stage}:${proof}`;
    const query = zeroMatch
      ? `consumer recipe for ${humanize(task)}`
      : queryPhrase(task, stage, proof, index);
    contexts.push({
      id: `context:${String(index + 1).padStart(4, "0")}`,
      query,
      queryTokens: tokenize(query),
      features: zeroMatch ? { task: "unsupported-consumer-task", stage } : { vertical, task, stage, proof, constraint, geography, device, surface: "search-result" },
      graphNodes: zeroMatch ? ["domain:consumer"] : [`vertical:${vertical}`, `task:${task}`, `stage:${stage}`, `proof:${proof}`, `constraint:${constraint}`],
      demandWeight: 1 + ((index * 19) % 7) / 2,
      zeroMatch,
      expectedPageId,
      expectedDesignCapabilities: zeroMatch ? ["semantic-hierarchy"] : designNeeds(stage, proof, task),
    });
  }
  return { contexts, pages };
}

export function compileHrrFeatures(features: FeatureMap, dimensions = 512): Vector {
  const parts = Object.entries(features)
    .filter((entry): entry is [FeatureRole, string] => Boolean(entry[1]))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([role, value]) => ({
      vector: bind(deterministicSymbol(`role:${role}`, dimensions), deterministicSymbol(`value:${role}:${value}`, dimensions)),
      weight: roleWeight(role),
    }));
  if (parts.length === 0) return deterministicSymbol("empty-context", dimensions);
  return weightedSuperposition(parts);
}

export function hashedSemanticVector(tokens: readonly string[], dimensions = 512): Vector {
  const unique = [...new Set(tokens)].sort();
  if (unique.length === 0) return deterministicSymbol("empty-query", dimensions);
  return weightedSuperposition(unique.map((token) => ({ vector: deterministicSymbol(`token:${token}`, dimensions), weight: 1 })));
}

export function scoreContextPage(context: SearchContextPrototype, page: CandidatePagePrototype, arm: ScoringArm, dimensions = 512): ScoreBreakdown {
  const eligible = page.eligible && !context.zeroMatch && hardCompatible(context, page);
  if (!eligible) return { lexical: 0, semantic: 0, facets: 0, graph: 0, hrr: 0, design: 0, evidence: 0, total: Number.NEGATIVE_INFINITY, eligible: false };

  const lexical = jaccard(context.queryTokens, page.queryTokens);
  const semantic = boundedCosine(hashedSemanticVector(context.queryTokens, dimensions), hashedSemanticVector(page.queryTokens, dimensions));
  const facets = weightedFacetFit(context.features, page.features);
  const graph = jaccard(context.graphNodes, page.graphNodes);
  const hrr = boundedCosine(compileHrrFeatures(context.features, dimensions), compileHrrFeatures(page.features, dimensions));
  const design = jaccard(context.expectedDesignCapabilities, page.designCapabilities);
  const evidence = Math.min(1, page.evidenceLevel / (context.features.proof === "security" ? 4 : 3));
  let total: number;
  switch (arm) {
    case "lexical": total = lexical; break;
    case "semantic": total = semantic; break;
    case "facets": total = 0.55 * facets + 0.25 * lexical + 0.2 * graph; break;
    case "hrr": total = 0.7 * hrr + 0.2 * lexical + 0.1 * graph; break;
    case "hybrid": total = 0.28 * hrr + 0.22 * facets + 0.18 * lexical + 0.12 * semantic + 0.08 * graph + 0.07 * evidence + 0.05 * design; break;
  }
  return { lexical, semantic, facets, graph, hrr, design, evidence, total, eligible: true };
}

export function rankPages(context: SearchContextPrototype, pages: readonly CandidatePagePrototype[], arm: ScoringArm, dimensions = 512): RankedPage[] {
  return pages.map((page) => {
    const breakdown = scoreContextPage(context, page, arm, dimensions);
    return { pageId: page.id, breakdown, score: breakdown.total };
  }).filter((ranked) => ranked.breakdown.eligible)
    .sort((left, right) => right.score - left.score || left.pageId.localeCompare(right.pageId));
}

export function evaluateBenchmark(fixture: BenchmarkFixture, arm: ScoringArm, dimensions = 512, noMatchThreshold = 0.3): BenchmarkMetrics {
  let ndcg5 = 0; let ndcg10 = 0; let top1 = 0; let zeroCorrect = 0; let zeroCount = 0; let bad = 0; let reciprocal = 0;
  for (const context of fixture.contexts) {
    const ranking = rankPages(context, fixture.pages, arm, dimensions);
    const topScore = ranking[0]?.score ?? Number.NEGATIVE_INFINITY;
    if (context.zeroMatch) {
      zeroCount += 1;
      if (topScore < noMatchThreshold || ranking.length === 0) zeroCorrect += 1;
      continue;
    }
    const expected = context.expectedPageId;
    const expectedIndex = ranking.findIndex((item) => item.pageId === expected);
    if (expectedIndex === 0) top1 += 1;
    if (expectedIndex < 0 || expectedIndex >= 10) bad += 1;
    if (expectedIndex >= 0) reciprocal += 1 / (expectedIndex + 1);
    ndcg5 += singleRelevantNdcg(expectedIndex, 5);
    ndcg10 += singleRelevantNdcg(expectedIndex, 10);
  }
  const nonZero = fixture.contexts.length - zeroCount;
  return { arm, ndcgAt5: ndcg5 / nonZero, ndcgAt10: ndcg10 / nonZero, top1Accuracy: top1 / nonZero,
    zeroMatchAccuracy: zeroCount === 0 ? 1 : zeroCorrect / zeroCount, badFitRate: bad / nonZero, meanReciprocalRank: reciprocal / nonZero };
}

export function benchmarkAllArms(fixture: BenchmarkFixture, dimensions = 512): BenchmarkMetrics[] {
  return (["lexical", "semantic", "facets", "hrr", "hybrid"] as const).map((arm) => evaluateBenchmark(fixture, arm, dimensions));
}

function hardCompatible(context: SearchContextPrototype, page: CandidatePagePrototype): boolean {
  if (context.features.task && page.features.task !== context.features.task) return false;
  if (context.features.vertical && page.features.vertical !== context.features.vertical) return false;
  return true;
}
function weightedFacetFit(left: FeatureMap, right: FeatureMap): number {
  let numerator = 0; let denominator = 0;
  for (const role of FEATURE_ROLES) {
    const leftValue = left[role]; if (!leftValue) continue;
    const weight = roleWeight(role); denominator += weight;
    if (right[role] === leftValue) numerator += weight;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}
function roleWeight(role: FeatureRole): number {
  switch (role) {
    case "task": return 1.4;
    case "vertical": return 1.25;
    case "stage": return 1.0;
    case "proof": return 0.9;
    case "constraint": return 0.75;
    case "geography": return 0.35;
    case "device": return 0.2;
    case "surface": return 0.15;
  }
}
function queryPhrase(task: string, stage: string, proof: string, index: number): string {
  const verbs = stage === "diagnose" ? ["why", "how to fix", "what causes"] : stage === "compare" ? ["best", "versus", "compare"] : ["how to automate", "setup", "implementation"];
  const proofPhrase = proof === "security" ? "with owner approval and security" : "with a real workflow example";
  return `${verbs[index % verbs.length]} ${humanize(task)} ${proofPhrase}`;
}
function designNeeds(stage: string, proof: string, task: string): DesignCapability[] {
  const needs = new Set<DesignCapability>(["semantic-hierarchy", "responsive-grid", "mobile-priority", "structured-data-visible", "conversion-panel"]);
  if (stage === "diagnose") needs.add("long-form-reading");
  if (stage === "compare") needs.add("comparison-table");
  if (stage === "implement" || task.includes("followup") || task.includes("scheduling")) needs.add("workflow-steps");
  if (proof === "security") { needs.add("evidence-dense"); needs.add("progressive-disclosure"); }
  needs.add("instruction-pointer");
  return [...needs].sort();
}
function singleRelevantNdcg(index: number, cutoff: number): number { return index >= 0 && index < cutoff ? 1 / Math.log2(index + 2) : 0; }
function boundedCosine(left: Vector, right: Vector): number { return Math.max(0, Math.min(1, (cosine(left, right) + 1) / 2)); }
function jaccard(left: readonly string[], right: readonly string[]): number {
  const a = new Set(left); const b = new Set(right); if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0; for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}
function tokenize(value: string): string[] { return [...new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean))].sort(); }
function humanize(value: string): string { return value.replaceAll("-", " "); }

export function fixtureFingerprint(fixture: BenchmarkFixture): string {
  return String(hash32(JSON.stringify(fixture)));
}
