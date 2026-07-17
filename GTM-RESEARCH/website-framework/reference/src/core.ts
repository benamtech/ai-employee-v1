import { createHash } from "node:crypto";

export type Vector = Float64Array;
export interface WeightedVector { vector: Vector; weight: number; }
export interface ContextCase { id: string; weight: number; group?: string; }
export interface FacilitySelectionInput {
  contexts: readonly ContextCase[];
  candidateIds: readonly string[];
  similarities: readonly (readonly number[])[];
  costs?: readonly number[];
  budget: number;
}
export interface FacilitySelectionStep {
  candidateId: string;
  candidateIndex: number;
  marginalGain: number;
  gainPerCost: number;
  cost: number;
  cumulativeObjective: number;
}
export interface FacilitySelectionResult {
  selectedIds: string[];
  selectedIndexes: number[];
  objective: number;
  bestSimilarityByContext: number[];
  steps: FacilitySelectionStep[];
}
export interface PagePrototype { id: string; vector: Vector; }
export interface PageShape { id: string; prototypes: readonly PagePrototype[]; eligible: boolean; }
export interface PageCompatibilityScore { pageId: string; prototypeId: string | null; score: number; eligible: boolean; }
export interface ContentAtom { id: string; semanticHtml: string; sourceIds: readonly string[]; }
export interface PagePlan {
  id: string;
  route: string;
  title: string;
  description: string;
  canonicalUrl: string;
  atomIds: readonly string[];
  sourceIds: readonly string[];
  instructionPointers?: readonly string[];
}
export interface EmittedPage { id: string; route: string; html: string; sha256: string; dependencies: string[]; }

export function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function xorshift32(state: number): number {
  let next = state >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}

export function deterministicSymbol(seed: string, dimensions: number): Vector {
  assertPowerOfTwo(dimensions);
  if (dimensions < 8) throw new RangeError("dimensions must be at least 8");
  let state = hash32(seed) || 0x9e3779b9;
  const scale = 1 / Math.sqrt(dimensions);
  const vector = new Float64Array(dimensions);
  for (let index = 0; index < dimensions; index += 1) {
    state = xorshift32(state);
    vector[index] = (state & 1) === 0 ? -scale : scale;
  }
  return vector;
}

export function dot(left: Vector, right: Vector): number {
  assertSameLength(left, right);
  let value = 0;
  for (let index = 0; index < left.length; index += 1) value += left[index] * right[index];
  return value;
}

export function norm(vector: Vector): number {
  const squared = dot(vector, vector);
  if (!Number.isFinite(squared) || squared <= 0) throw new RangeError("vector norm must be finite and positive");
  return Math.sqrt(squared);
}

export function normalize(vector: Vector): Vector {
  const magnitude = norm(vector);
  const output = new Float64Array(vector.length);
  for (let index = 0; index < vector.length; index += 1) output[index] = vector[index] / magnitude;
  return output;
}

export function cosine(left: Vector, right: Vector): number { return dot(left, right) / (norm(left) * norm(right)); }

export function weightedSuperposition(parts: readonly WeightedVector[]): Vector {
  if (parts.length === 0) throw new RangeError("at least one vector is required");
  const dimensions = parts[0].vector.length;
  const output = new Float64Array(dimensions);
  for (const part of parts) {
    if (!Number.isFinite(part.weight)) throw new RangeError("weight must be finite");
    if (part.vector.length !== dimensions) throw new RangeError("vector length mismatch");
    for (let index = 0; index < dimensions; index += 1) output[index] += part.weight * part.vector[index];
  }
  return normalize(output);
}

export function involution(vector: Vector): Vector {
  const output = new Float64Array(vector.length);
  output[0] = vector[0];
  for (let index = 1; index < vector.length; index += 1) output[index] = vector[vector.length - index];
  return output;
}

export function circularConvolveNaive(left: Vector, right: Vector): Vector {
  assertSameLength(left, right);
  const output = new Float64Array(left.length);
  for (let target = 0; target < left.length; target += 1) {
    let sum = 0;
    for (let source = 0; source < left.length; source += 1) {
      const rightIndex = (target - source + left.length) % left.length;
      sum += left[source] * right[rightIndex];
    }
    output[target] = sum;
  }
  return output;
}

export function circularConvolve(left: Vector, right: Vector): Vector {
  assertSameLength(left, right);
  assertPowerOfTwo(left.length);
  const leftReal = new Float64Array(left);
  const leftImaginary = new Float64Array(left.length);
  const rightReal = new Float64Array(right);
  const rightImaginary = new Float64Array(right.length);
  fftInPlace(leftReal, leftImaginary, false);
  fftInPlace(rightReal, rightImaginary, false);
  for (let index = 0; index < left.length; index += 1) {
    const real = leftReal[index] * rightReal[index] - leftImaginary[index] * rightImaginary[index];
    const imaginary = leftReal[index] * rightImaginary[index] + leftImaginary[index] * rightReal[index];
    leftReal[index] = real;
    leftImaginary[index] = imaginary;
  }
  fftInPlace(leftReal, leftImaginary, true);
  return leftReal;
}

export function bind(role: Vector, value: Vector): Vector { return circularConvolve(role, value); }
export function unbind(composite: Vector, role: Vector): Vector { return circularConvolve(composite, involution(role)); }

export function scorePageShape(context: Vector, page: PageShape): PageCompatibilityScore {
  if (!page.eligible || page.prototypes.length === 0) {
    return { pageId: page.id, prototypeId: null, score: Number.NEGATIVE_INFINITY, eligible: false };
  }
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestPrototypeId: string | null = null;
  for (const prototype of page.prototypes) {
    const score = cosine(context, prototype.vector);
    if (score > bestScore || (score === bestScore && prototype.id < (bestPrototypeId ?? "\uffff"))) {
      bestScore = score;
      bestPrototypeId = prototype.id;
    }
  }
  return { pageId: page.id, prototypeId: bestPrototypeId, score: bestScore, eligible: true };
}

export function facilityObjective(input: FacilitySelectionInput, selectedIndexes: readonly number[]): number {
  let objective = 0;
  for (let contextIndex = 0; contextIndex < input.contexts.length; contextIndex += 1) {
    let best = 0;
    for (const candidateIndex of selectedIndexes) best = Math.max(best, clamp01(input.similarities[contextIndex][candidateIndex]));
    objective += input.contexts[contextIndex].weight * best;
  }
  return objective;
}

export function greedyFacilityLocation(input: FacilitySelectionInput): FacilitySelectionResult {
  validateFacilityInput(input);
  const costs = input.costs ?? input.candidateIds.map(() => 1);
  const best = input.contexts.map(() => 0);
  const selected = new Set<number>();
  const steps: FacilitySelectionStep[] = [];
  let spent = 0;
  let objective = 0;
  while (true) {
    let winner = -1;
    let winnerGain = 0;
    let winnerRatio = Number.NEGATIVE_INFINITY;
    for (let candidateIndex = 0; candidateIndex < input.candidateIds.length; candidateIndex += 1) {
      if (selected.has(candidateIndex)) continue;
      const cost = costs[candidateIndex];
      if (spent + cost > input.budget) continue;
      let gain = 0;
      for (let contextIndex = 0; contextIndex < input.contexts.length; contextIndex += 1) {
        const fit = clamp01(input.similarities[contextIndex][candidateIndex]);
        gain += input.contexts[contextIndex].weight * Math.max(0, fit - best[contextIndex]);
      }
      const ratio = gain / cost;
      const winnerId = winner >= 0 ? input.candidateIds[winner] : "\uffff";
      if (ratio > winnerRatio || (ratio === winnerRatio && gain > winnerGain) ||
          (ratio === winnerRatio && gain === winnerGain && input.candidateIds[candidateIndex] < winnerId)) {
        winner = candidateIndex;
        winnerGain = gain;
        winnerRatio = ratio;
      }
    }
    if (winner < 0 || winnerGain <= 0) break;
    selected.add(winner);
    spent += costs[winner];
    objective += winnerGain;
    for (let contextIndex = 0; contextIndex < input.contexts.length; contextIndex += 1) {
      best[contextIndex] = Math.max(best[contextIndex], clamp01(input.similarities[contextIndex][winner]));
    }
    steps.push({ candidateId: input.candidateIds[winner], candidateIndex: winner, marginalGain: winnerGain,
      gainPerCost: winnerRatio, cost: costs[winner], cumulativeObjective: objective });
  }
  return { selectedIds: steps.map((step) => step.candidateId), selectedIndexes: steps.map((step) => step.candidateIndex),
    objective, bestSimilarityByContext: best, steps };
}

export function exhaustiveFacilityLocation(input: FacilitySelectionInput): FacilitySelectionResult {
  validateFacilityInput(input);
  if (input.candidateIds.length > 24) throw new RangeError("exhaustive control supports at most 24 candidates");
  const costs = input.costs ?? input.candidateIds.map(() => 1);
  let bestIndexes: number[] = [];
  let bestObjective = 0;
  const total = 1 << input.candidateIds.length;
  for (let mask = 0; mask < total; mask += 1) {
    const indexes: number[] = [];
    let cost = 0;
    for (let index = 0; index < input.candidateIds.length; index += 1) {
      if ((mask & (1 << index)) !== 0) { indexes.push(index); cost += costs[index]; }
    }
    if (cost > input.budget) continue;
    const objective = facilityObjective(input, indexes);
    const ids = indexes.map((index) => input.candidateIds[index]);
    const bestIds = bestIndexes.map((index) => input.candidateIds[index]);
    if (objective > bestObjective || (objective === bestObjective && ids.join("\0") < bestIds.join("\0"))) {
      bestObjective = objective;
      bestIndexes = indexes;
    }
  }
  const bestByContext = input.contexts.map((_, contextIndex) =>
    bestIndexes.reduce((best, candidateIndex) => Math.max(best, clamp01(input.similarities[contextIndex][candidateIndex])), 0));
  return { selectedIds: bestIndexes.map((index) => input.candidateIds[index]), selectedIndexes: bestIndexes,
    objective: bestObjective, bestSimilarityByContext: bestByContext, steps: [] };
}

export function emitCorpus(plans: readonly PagePlan[], atoms: readonly ContentAtom[]): EmittedPage[] {
  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  const seenRoutes = new Set<string>();
  const seenIds = new Set<string>();
  return [...plans].sort((a, b) => a.id.localeCompare(b.id)).map((plan) => {
    if (seenIds.has(plan.id)) throw new Error(`duplicate page id: ${plan.id}`);
    if (seenRoutes.has(plan.route)) throw new Error(`duplicate route: ${plan.route}`);
    seenIds.add(plan.id); seenRoutes.add(plan.route);
    const selectedAtoms = plan.atomIds.map((atomId) => {
      const atom = atomById.get(atomId);
      if (!atom) throw new Error(`missing atom ${atomId} for page ${plan.id}`);
      return atom;
    });
    const dependencies = [...new Set([...plan.sourceIds, ...selectedAtoms.flatMap((atom) => atom.sourceIds)])].sort();
    const pointer = plan.instructionPointers?.[0]
      ? `<link rel="alternate" type="text/markdown" href="${escapeHtml(plan.instructionPointers[0])}">` : "";
    const html = ["<!doctype html>", '<html lang="en">', "<head>", '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">', `<title>${escapeHtml(plan.title)}</title>`,
      `<meta name="description" content="${escapeHtml(plan.description)}">`,
      `<link rel="canonical" href="${escapeHtml(plan.canonicalUrl)}">`, pointer, "</head>",
      `<body data-page-id="${escapeHtml(plan.id)}">`, "<main>", ...selectedAtoms.map((atom) => atom.semanticHtml),
      "</main>", "</body>", "</html>", ""].filter(Boolean).join("\n");
    return { id: plan.id, route: plan.route, html, sha256: sha256(html), dependencies };
  });
}

export function buildInvalidationIndex(pages: readonly EmittedPage[]): ReadonlyMap<string, readonly string[]> {
  const mutable = new Map<string, Set<string>>();
  for (const page of pages) for (const dependency of page.dependencies) {
    const pageIds = mutable.get(dependency) ?? new Set<string>(); pageIds.add(page.id); mutable.set(dependency, pageIds);
  }
  return new Map([...mutable.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([dependency, pageIds]) => [dependency, [...pageIds].sort()] as const));
}

export function sha256(value: string | Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }

function fftInPlace(real: Float64Array, imaginary: Float64Array, inverse: boolean): void {
  const length = real.length; assertPowerOfTwo(length);
  if (imaginary.length !== length) throw new RangeError("FFT arrays must have equal length");
  for (let index = 1, reversed = 0; index < length; index += 1) {
    let bit = length >> 1; for (; reversed & bit; bit >>= 1) reversed ^= bit; reversed ^= bit;
    if (index < reversed) { [real[index], real[reversed]] = [real[reversed], real[index]];
      [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]]; }
  }
  for (let size = 2; size <= length; size <<= 1) {
    const angle = (inverse ? 2 : -2) * Math.PI / size;
    const stepReal = Math.cos(angle); const stepImaginary = Math.sin(angle);
    for (let start = 0; start < length; start += size) {
      let twiddleReal = 1; let twiddleImaginary = 0; const half = size >> 1;
      for (let offset = 0; offset < half; offset += 1) {
        const even = start + offset; const odd = even + half;
        const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary;
        const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal;
        real[odd] = real[even] - oddReal; imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal; imaginary[even] += oddImaginary;
        const next = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal; twiddleReal = next;
      }
    }
  }
  if (inverse) for (let index = 0; index < length; index += 1) { real[index] /= length; imaginary[index] /= length; }
}

function validateFacilityInput(input: FacilitySelectionInput): void {
  if (!Number.isFinite(input.budget) || input.budget < 0) throw new RangeError("budget must be non-negative");
  if (input.similarities.length !== input.contexts.length) throw new RangeError("context/similarity row mismatch");
  const costs = input.costs ?? input.candidateIds.map(() => 1);
  if (costs.length !== input.candidateIds.length) throw new RangeError("candidate/cost mismatch");
  for (const cost of costs) if (!Number.isFinite(cost) || cost <= 0) throw new RangeError("candidate cost must be finite and positive");
  for (const row of input.similarities) if (row.length !== input.candidateIds.length) throw new RangeError("candidate/similarity column mismatch");
  for (const context of input.contexts) if (!Number.isFinite(context.weight) || context.weight < 0) throw new RangeError("context weight must be non-negative");
}
function clamp01(value: number): number { if (!Number.isFinite(value)) throw new RangeError("similarity must be finite"); return Math.max(0, Math.min(1, value)); }
function assertSameLength(left: Vector, right: Vector): void { if (left.length !== right.length) throw new RangeError("vector length mismatch"); if (left.length === 0) throw new RangeError("vectors must be non-empty"); }
function assertPowerOfTwo(value: number): void { if (!Number.isInteger(value) || value <= 0 || (value & (value - 1)) !== 0) throw new RangeError("value must be a positive power of two"); }
function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
