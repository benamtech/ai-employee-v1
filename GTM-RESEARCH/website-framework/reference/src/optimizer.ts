import { facilityObjective, type FacilitySelectionInput, type FacilitySelectionResult, type FacilitySelectionStep } from "./core.js";

interface HeapEntry { candidateIndex: number; upperGain: number; ratio: number; stamp: number; }

export function lazyGreedyFacilityLocation(input: FacilitySelectionInput): FacilitySelectionResult {
  validate(input);
  const costs = input.costs ?? input.candidateIds.map(() => 1);
  const best = input.contexts.map(() => 0);
  const selected = new Set<number>();
  const steps: FacilitySelectionStep[] = [];
  const heap: HeapEntry[] = [];
  let spent = 0;
  let objective = 0;
  let stamp = 0;

  for (let candidateIndex = 0; candidateIndex < input.candidateIds.length; candidateIndex += 1) {
    const gain = marginalFacilityGain(input, best, candidateIndex);
    heapPush(heap, { candidateIndex, upperGain: gain, ratio: gain / costs[candidateIndex], stamp });
  }

  while (heap.length > 0) {
    const entry = heapPop(heap)!;
    if (selected.has(entry.candidateIndex)) continue;
    const cost = costs[entry.candidateIndex];
    if (spent + cost > input.budget) continue;
    const exactGain = marginalFacilityGain(input, best, entry.candidateIndex);
    const exactRatio = exactGain / cost;
    const next = heap[0];
    const nextRatio = next?.ratio ?? Number.NEGATIVE_INFINITY;
    if (entry.stamp !== stamp && exactRatio < nextRatio) {
      heapPush(heap, { candidateIndex: entry.candidateIndex, upperGain: exactGain, ratio: exactRatio, stamp });
      continue;
    }
    if (exactGain <= 0) break;
    selected.add(entry.candidateIndex);
    spent += cost;
    objective += exactGain;
    for (let contextIndex = 0; contextIndex < input.contexts.length; contextIndex += 1) {
      best[contextIndex] = Math.max(best[contextIndex], clamp01(input.similarities[contextIndex][entry.candidateIndex]));
    }
    steps.push({ candidateId: input.candidateIds[entry.candidateIndex], candidateIndex: entry.candidateIndex,
      marginalGain: exactGain, gainPerCost: exactRatio, cost, cumulativeObjective: objective });
    stamp += 1;
    for (const queued of heap) queued.stamp = Math.min(queued.stamp, stamp - 1);
  }

  return { selectedIds: steps.map((step) => step.candidateId), selectedIndexes: steps.map((step) => step.candidateIndex),
    objective, bestSimilarityByContext: best, steps };
}

export interface CompositeCandidate {
  id: string;
  cost: number;
  informationObjectIds: readonly string[];
  rareGroups: readonly string[];
}

export interface CompositeObjectiveInput {
  facility: FacilitySelectionInput;
  candidates: readonly CompositeCandidate[];
  informationWeights?: Readonly<Record<string, number>>;
  rareGroupWeights?: Readonly<Record<string, number>>;
  similarityKernel?: readonly (readonly number[])[];
  informationWeight: number;
  rareTailWeight: number;
  diversityWeight: number;
}

export interface CompositeSelectionResult extends FacilitySelectionResult {
  coverageObjective: number;
  informationObjective: number;
  rareTailObjective: number;
  diversityObjective: number;
}

export function greedyCompositeSelection(input: CompositeObjectiveInput): CompositeSelectionResult {
  if (input.candidates.length !== input.facility.candidateIds.length) throw new RangeError("candidate metadata mismatch");
  const selected: number[] = [];
  const steps: FacilitySelectionStep[] = [];
  let spent = 0;
  let current = compositeObjective(input, selected);

  while (true) {
    let winner = -1;
    let winnerGain = 0;
    let winnerRatio = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < input.candidates.length; index += 1) {
      if (selected.includes(index)) continue;
      const candidate = input.candidates[index];
      if (spent + candidate.cost > input.facility.budget) continue;
      const objective = compositeObjective(input, [...selected, index]);
      const gain = objective.total - current.total;
      const ratio = gain / candidate.cost;
      const winnerId = winner >= 0 ? input.candidates[winner].id : "\uffff";
      if (ratio > winnerRatio || (ratio === winnerRatio && gain > winnerGain) ||
          (ratio === winnerRatio && gain === winnerGain && candidate.id < winnerId)) {
        winner = index; winnerGain = gain; winnerRatio = ratio;
      }
    }
    if (winner < 0 || winnerGain <= 0) break;
    selected.push(winner); spent += input.candidates[winner].cost; current = compositeObjective(input, selected);
    steps.push({ candidateId: input.candidates[winner].id, candidateIndex: winner, marginalGain: winnerGain,
      gainPerCost: winnerRatio, cost: input.candidates[winner].cost, cumulativeObjective: current.total });
  }

  const best = input.facility.contexts.map((_, contextIndex) => selected.reduce((value, candidateIndex) =>
    Math.max(value, clamp01(input.facility.similarities[contextIndex][candidateIndex])), 0));
  return { selectedIds: selected.map((index) => input.candidates[index].id), selectedIndexes: selected,
    objective: current.total, bestSimilarityByContext: best, steps, coverageObjective: current.coverage,
    informationObjective: current.information, rareTailObjective: current.rareTail, diversityObjective: current.diversity };
}

export function leaveOneOutMarginals(input: FacilitySelectionInput, selectedIndexes: readonly number[]): ReadonlyMap<string, number> {
  const full = facilityObjective(input, selectedIndexes);
  return new Map(selectedIndexes.map((index) => {
    const without = selectedIndexes.filter((candidateIndex) => candidateIndex !== index);
    return [input.candidateIds[index], full - facilityObjective(input, without)] as const;
  }));
}

export function logDeterminantForSelection(kernel: readonly (readonly number[])[], selectedIndexes: readonly number[], tau = 1): number {
  if (selectedIndexes.length === 0) return 0;
  const matrix = selectedIndexes.map((rowIndex, row) => selectedIndexes.map((columnIndex, column) =>
    (row === column ? 1 : 0) + tau * kernel[rowIndex][columnIndex]));
  return logDeterminantPositiveDefinite(matrix);
}

function compositeObjective(input: CompositeObjectiveInput, selected: readonly number[]): { total: number; coverage: number; information: number; rareTail: number; diversity: number } {
  const coverage = facilityObjective(input.facility, selected);
  const informationCounts = new Map<string, number>();
  const rareCounts = new Map<string, number>();
  for (const index of selected) {
    for (const id of input.candidates[index].informationObjectIds) informationCounts.set(id, (informationCounts.get(id) ?? 0) + 1);
    for (const group of input.candidates[index].rareGroups) rareCounts.set(group, (rareCounts.get(group) ?? 0) + 1);
  }
  let information = 0;
  for (const [id, count] of informationCounts) information += (input.informationWeights?.[id] ?? 1) * Math.sqrt(count);
  let rareTail = 0;
  for (const [group, count] of rareCounts) {
    if (count >= 2) rareTail += (input.rareGroupWeights?.[group] ?? 1) * Math.log1p(count - 1);
  }
  const diversity = input.similarityKernel ? logDeterminantForSelection(input.similarityKernel, selected) : 0;
  return { coverage, information, rareTail, diversity,
    total: coverage + input.informationWeight * information + input.rareTailWeight * rareTail + input.diversityWeight * diversity };
}

function marginalFacilityGain(input: FacilitySelectionInput, best: readonly number[], candidateIndex: number): number {
  let gain = 0;
  for (let contextIndex = 0; contextIndex < input.contexts.length; contextIndex += 1) {
    const fit = clamp01(input.similarities[contextIndex][candidateIndex]);
    gain += input.contexts[contextIndex].weight * Math.max(0, fit - best[contextIndex]);
  }
  return gain;
}
function logDeterminantPositiveDefinite(matrix: number[][]): number {
  const length = matrix.length;
  const lower = Array.from({ length }, () => Array<number>(length).fill(0));
  let result = 0;
  for (let row = 0; row < length; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      let sum = matrix[row][column];
      for (let k = 0; k < column; k += 1) sum -= lower[row][k] * lower[column][k];
      if (row === column) {
        if (sum <= 1e-12 || !Number.isFinite(sum)) throw new RangeError("kernel selection is not positive definite");
        lower[row][column] = Math.sqrt(sum);
        result += 2 * Math.log(lower[row][column]);
      } else lower[row][column] = sum / lower[column][column];
    }
  }
  return result;
}
function heapPush(heap: HeapEntry[], entry: HeapEntry): void { heap.push(entry); siftUp(heap, heap.length - 1); }
function heapPop(heap: HeapEntry[]): HeapEntry | undefined {
  if (heap.length === 0) return undefined;
  const top = heap[0]; const last = heap.pop()!;
  if (heap.length > 0) { heap[0] = last; siftDown(heap, 0); }
  return top;
}
function siftUp(heap: HeapEntry[], index: number): void {
  while (index > 0) { const parent = (index - 1) >> 1; if (higher(heap[parent], heap[index])) break;
    [heap[parent], heap[index]] = [heap[index], heap[parent]]; index = parent; }
}
function siftDown(heap: HeapEntry[], index: number): void {
  while (true) { let best = index; const left = index * 2 + 1; const right = left + 1;
    if (left < heap.length && higher(heap[left], heap[best])) best = left;
    if (right < heap.length && higher(heap[right], heap[best])) best = right;
    if (best === index) break; [heap[index], heap[best]] = [heap[best], heap[index]]; index = best; }
}
function higher(left: HeapEntry, right: HeapEntry): boolean {
  return left.ratio > right.ratio || (left.ratio === right.ratio && left.upperGain > right.upperGain) ||
    (left.ratio === right.ratio && left.upperGain === right.upperGain && left.candidateIndex < right.candidateIndex);
}
function validate(input: FacilitySelectionInput): void {
  if (input.similarities.length !== input.contexts.length) throw new RangeError("context row mismatch");
  if ((input.costs?.length ?? input.candidateIds.length) !== input.candidateIds.length) throw new RangeError("cost mismatch");
}
function clamp01(value: number): number { if (!Number.isFinite(value)) throw new RangeError("similarity must be finite"); return Math.max(0, Math.min(1, value)); }
