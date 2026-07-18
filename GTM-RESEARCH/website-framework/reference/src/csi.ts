export interface ComplementSelectionInput {
  candidateIds: readonly string[];
  similarityKernel: readonly (readonly number[])[];
  budget: number;
  costs?: readonly number[];
}

export interface ComplementSelectionStep {
  candidateId: string;
  candidateIndex: number;
  marginalGain: number;
  gainPerCost: number;
  cost: number;
  cumulativeObjective: number;
}

export interface ComplementSelectionResult {
  selectedIds: string[];
  selectedIndexes: number[];
  objective: number;
  steps: ComplementSelectionStep[];
}

/**
 * Facility Location Complement Information (FLCI):
 * sum_i min(max_{j in A} s_ij, max_{j in V\A} s_ij).
 *
 * This is the complement-aware facility-location objective from
 * Iyer, "Complement Submodular Information Measures for Balanced and Robust Data Selection"
 * (arXiv:2605.24779). It is used here as a deterministic research/control arm.
 */
export function facilityLocationComplementInformation(
  similarityKernel: readonly (readonly number[])[],
  selectedIndexes: readonly number[],
): number {
  validateKernel(similarityKernel);
  const size = similarityKernel.length;
  const selected = new Set(selectedIndexes);
  for (const index of selected) if (!Number.isInteger(index) || index < 0 || index >= size) throw new RangeError(`invalid selected index ${index}`);
  if (selected.size === 0 || selected.size === size) return 0;

  let objective = 0;
  for (let row = 0; row < size; row += 1) {
    let selectedBest = 0;
    let complementBest = 0;
    for (let column = 0; column < size; column += 1) {
      const similarity = clamp01(similarityKernel[row][column]);
      if (selected.has(column)) selectedBest = Math.max(selectedBest, similarity);
      else complementBest = Math.max(complementBest, similarity);
    }
    objective += Math.min(selectedBest, complementBest);
  }
  return objective;
}

/**
 * Deterministic greedy maximization under a budget. CSI is generally non-monotone,
 * so the algorithm stops when no positive marginal gain remains. The paper's
 * near-(1-1/e) statement depends on bounded curvature/approximate monotonicity;
 * this implementation does not claim that condition without a separate diagnostic.
 */
export function greedyFacilityLocationComplementSelection(input: ComplementSelectionInput): ComplementSelectionResult {
  validateInput(input);
  const costs = input.costs ?? input.candidateIds.map(() => 1);
  const selected: number[] = [];
  const steps: ComplementSelectionStep[] = [];
  let spent = 0;
  let objective = facilityLocationComplementInformation(input.similarityKernel, selected);

  while (true) {
    let winner = -1;
    let winnerGain = 0;
    let winnerRatio = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < input.candidateIds.length; index += 1) {
      if (selected.includes(index)) continue;
      const cost = costs[index];
      if (spent + cost > input.budget) continue;
      const nextObjective = facilityLocationComplementInformation(input.similarityKernel, [...selected, index]);
      const gain = nextObjective - objective;
      const ratio = gain / cost;
      const winnerId = winner >= 0 ? input.candidateIds[winner] : "\uffff";
      if (ratio > winnerRatio || (ratio === winnerRatio && gain > winnerGain) ||
          (ratio === winnerRatio && gain === winnerGain && input.candidateIds[index] < winnerId)) {
        winner = index;
        winnerGain = gain;
        winnerRatio = ratio;
      }
    }
    if (winner < 0 || winnerGain <= 0) break;
    selected.push(winner);
    spent += costs[winner];
    objective += winnerGain;
    steps.push({ candidateId: input.candidateIds[winner], candidateIndex: winner, marginalGain: winnerGain,
      gainPerCost: winnerRatio, cost: costs[winner], cumulativeObjective: objective });
  }

  return {
    selectedIds: selected.map((index) => input.candidateIds[index]),
    selectedIndexes: selected,
    objective,
    steps,
  };
}

export function complementSelectionFingerprint(input: ComplementSelectionInput): string {
  validateInput(input);
  return JSON.stringify({
    candidateIds: [...input.candidateIds],
    similarityKernel: input.similarityKernel.map((row) => [...row]),
    budget: input.budget,
    costs: input.costs ? [...input.costs] : null,
  });
}

function validateInput(input: ComplementSelectionInput): void {
  validateKernel(input.similarityKernel);
  if (input.candidateIds.length !== input.similarityKernel.length) throw new RangeError("candidate/kernel size mismatch");
  if (!Number.isFinite(input.budget) || input.budget < 0) throw new RangeError("budget must be finite and nonnegative");
  if (input.costs && input.costs.length !== input.candidateIds.length) throw new RangeError("cost mismatch");
  if (input.costs?.some((cost) => !Number.isFinite(cost) || cost <= 0)) throw new RangeError("costs must be finite and positive");
}

function validateKernel(kernel: readonly (readonly number[])[]): void {
  if (kernel.some((row) => row.length !== kernel.length)) throw new RangeError("similarity kernel must be square");
  for (let row = 0; row < kernel.length; row += 1) {
    for (let column = 0; column < kernel.length; column += 1) {
      const value = kernel[row][column];
      if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(`invalid similarity at ${row},${column}`);
      if (Math.abs(value - kernel[column][row]) > 1e-9) throw new RangeError("similarity kernel must be symmetric");
    }
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError("similarity must be finite");
  return Math.max(0, Math.min(1, value));
}
