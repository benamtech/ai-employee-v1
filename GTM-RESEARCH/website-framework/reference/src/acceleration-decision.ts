import { sha256 } from "./core.js";
import { buildValidationReport, finding, type ValidationAttribute, type ValidationReport } from "./validation-contracts.js";

export interface SitePlanningPerformanceProfile {
  id: string;
  pageCount: number;
  baselineMilliseconds: number;
  optimizedMilliseconds: number;
  performanceBudgetMilliseconds: number;
  candidateGenerationMilliseconds: number;
  sparseSelectionMilliseconds: number;
  siteProgramMilliseconds: number;
  denseNumericKernelMilliseconds: number;
  denseNumericKernelName: string;
  denseNumericInputBytes: number;
  contiguousTypedArrayBoundary: boolean;
}

export interface WasmKernelBenchmark {
  id: string;
  kernelName: string;
  javascriptMilliseconds: number;
  wasmMilliseconds: number;
  bridgeMilliseconds: number;
  parityCosine?: number;
  exactParity?: boolean;
  benchmarkRuns: number;
}

export type AccelerationDisposition = "keep-typescript" | "benchmark-wasm-kernel" | "promote-wasm-kernel" | "reject-wasm-kernel";

export interface AccelerationDecision {
  disposition: AccelerationDisposition;
  algorithmicSpeedup: number;
  denseNumericShare: number;
  projectedWasmSavingsMilliseconds: number | null;
  reasons: readonly string[];
  requiredNextEvidence: readonly string[];
  decisionHash: string;
  validation: ValidationReport;
}

export interface AccelerationPolicy {
  minimumAlgorithmicSpeedup: number;
  minimumDenseNumericShare: number;
  minimumDenseNumericMilliseconds: number;
  minimumWasmSpeedup: number;
  minimumAbsoluteWasmSavingsMilliseconds: number;
  minimumParityCosine: number;
  minimumBenchmarkRuns: number;
}

export const DEFAULT_ACCELERATION_POLICY: AccelerationPolicy = {
  minimumAlgorithmicSpeedup: 1.25,
  minimumDenseNumericShare: 0.25,
  minimumDenseNumericMilliseconds: 1_500,
  minimumWasmSpeedup: 1.25,
  minimumAbsoluteWasmSavingsMilliseconds: 500,
  minimumParityCosine: 0.999999,
  minimumBenchmarkRuns: 20,
};

export const ACCELERATION_VALIDATION: readonly ValidationAttribute[] = [
  { id: "acceleration.profile", feature: "Stage-level build profile", workflowStep: "profile", algorithmChoice: "one-shot wall-clock stage decomposition", userEffect: "the user sees which part of a 10,000-page site build is actually slow", developerEffect: "runtime choices are based on measured stage cost rather than language preference", validationVector: ["page count", "baseline", "optimized", "stage times", "budget"], passVector: ["finite non-negative times", "stage profile names the dense kernel"], failVector: ["Wasm selected from intuition", "serving throughput substituted for one-shot build cost", "missing baseline"], simplerBaseline: "total duration only", severity: "hard" },
  { id: "acceleration.algorithm-first", feature: "Algorithm-before-runtime gate", workflowStep: "optimize", algorithmChoice: "compare algorithmic sparse implementation against original TypeScript baseline", userEffect: "the user receives the largest safe speedup before toolchain complexity is added", developerEffect: "poor complexity is not frozen into native code", validationVector: ["baseline milliseconds", "optimized milliseconds", "speedup"], passVector: ["algorithmic speedup meets floor or baseline already meets budget"], failVector: ["same O(k*n) loop ported to Wasm", "ANN/native layer added before sparse baseline"], simplerBaseline: "port hotspot immediately", severity: "hard" },
  { id: "acceleration.kernel-isolation", feature: "Dense-kernel isolation", workflowStep: "profile", algorithmChoice: "separate typed-array numeric work from maps, sets, strings, graph traversal, hashing, and heaps", userEffect: "only work that can benefit from SIMD/native execution crosses the boundary", developerEffect: "the JS/Wasm ABI stays coarse and bounded", validationVector: ["kernel name", "numeric milliseconds", "numeric share", "contiguous bytes"], passVector: ["kernel has sufficient absolute/share cost", "boundary is contiguous typed arrays"], failVector: ["object graph passed through ABI", "string-heavy compiler stage moved to Wasm", "kernel too small"], simplerBaseline: "whole compiler in Rust/Wasm", severity: "hard" },
  { id: "acceleration.wasm-benefit", feature: "Measured Wasm benefit", workflowStep: "benchmark", algorithmChoice: "JavaScript oracle versus Wasm kernel including bridge time", userEffect: "Wasm is promoted only when it improves the complete site build", developerEffect: "microbenchmark wins cannot hide copying, startup, or call overhead", validationVector: ["JS time", "Wasm time", "bridge time", "runs", "absolute savings", "speedup"], passVector: ["speedup and absolute savings meet floors after bridge costs"], failVector: ["near-native claim without local benchmark", "bridge cost excluded", "single-run result"], simplerBaseline: "kernel-only benchmark", severity: "soft" },
  { id: "acceleration.parity", feature: "Numeric parity", workflowStep: "benchmark", algorithmChoice: "exact or cosine-bounded comparison against TypeScript oracle", userEffect: "acceleration cannot alter selected regions or vector meaning", developerEffect: "the TypeScript implementation remains the semantic oracle", validationVector: ["exact parity", "cosine", "selection hashes"], passVector: ["exact parity or cosine above threshold"], failVector: ["faster output changes page coordinates", "precision drift unmeasured"], simplerBaseline: "smoke test", severity: "hard" },
  { id: "acceleration.fallback", feature: "Portable fallback", workflowStep: "integrate", algorithmChoice: "TypeScript oracle and feature-detected optional acceleration", userEffect: "site generation remains available when Wasm/native tooling is unavailable", developerEffect: "CI and local generation do not depend on one compiler/runtime", validationVector: ["oracle retained", "feature detection", "fallback path"], passVector: ["TypeScript path remains complete"], failVector: ["Wasm is sole authority", "fallback produces different hashes"], simplerBaseline: "mandatory native binary", severity: "hard" },
];

export function decideWasmAcceleration(
  profile: SitePlanningPerformanceProfile,
  benchmark?: WasmKernelBenchmark,
  policy: AccelerationPolicy = DEFAULT_ACCELERATION_POLICY,
): AccelerationDecision {
  validateInputs(profile, benchmark, policy);
  const algorithmicSpeedup = profile.baselineMilliseconds / Math.max(profile.optimizedMilliseconds, Number.EPSILON);
  const denseNumericShare = profile.denseNumericKernelMilliseconds / Math.max(profile.optimizedMilliseconds, Number.EPSILON);
  const reasons: string[] = [];
  const requiredNextEvidence: string[] = [];
  const profilePass = profile.pageCount > 0
    && profile.baselineMilliseconds > 0
    && profile.optimizedMilliseconds > 0
    && profile.performanceBudgetMilliseconds > 0;
  const algorithmFirstPass = algorithmicSpeedup >= policy.minimumAlgorithmicSpeedup
    || profile.baselineMilliseconds <= profile.performanceBudgetMilliseconds;
  const kernelLargeEnough = profile.denseNumericKernelMilliseconds >= policy.minimumDenseNumericMilliseconds
    && denseNumericShare >= policy.minimumDenseNumericShare
    && profile.contiguousTypedArrayBoundary;
  const benchmarkSpeedup = benchmark ? benchmark.javascriptMilliseconds / Math.max(benchmark.wasmMilliseconds + benchmark.bridgeMilliseconds, Number.EPSILON) : null;
  const projectedWasmSavingsMilliseconds = benchmark
    ? benchmark.javascriptMilliseconds - benchmark.wasmMilliseconds - benchmark.bridgeMilliseconds
    : null;
  const parityPass = benchmark
    ? benchmark.exactParity === true || (benchmark.parityCosine ?? Number.NEGATIVE_INFINITY) >= policy.minimumParityCosine
    : false;
  const benchmarkPass = benchmark
    ? benchmark.benchmarkRuns >= policy.minimumBenchmarkRuns
      && (benchmarkSpeedup ?? 0) >= policy.minimumWasmSpeedup
      && (projectedWasmSavingsMilliseconds ?? Number.NEGATIVE_INFINITY) >= policy.minimumAbsoluteWasmSavingsMilliseconds
    : false;

  let disposition: AccelerationDisposition;
  if (!profilePass || !algorithmFirstPass) {
    disposition = "reject-wasm-kernel";
    reasons.push("The performance profile or algorithm-first gate is incomplete; a runtime port would encode an unvalidated baseline.");
  } else if (!kernelLargeEnough) {
    disposition = "keep-typescript";
    reasons.push(`The isolated dense kernel is ${profile.denseNumericKernelMilliseconds.toFixed(1)}ms (${(denseNumericShare * 100).toFixed(1)}% of optimized time), below the promotion floor.`);
    reasons.push("The remaining dominant work is sparse graph/compiler data-structure work rather than a contiguous SIMD kernel.");
  } else if (!benchmark) {
    disposition = "benchmark-wasm-kernel";
    reasons.push("A sufficiently large contiguous numeric kernel exists, but no bridge-inclusive Wasm benchmark has been supplied.");
    requiredNextEvidence.push("20+ repeated JavaScript versus Wasm runs on the exact production kernel");
    requiredNextEvidence.push("bridge/copy/startup time included in the Wasm measurement");
    requiredNextEvidence.push("exact selection-hash parity and vector cosine parity");
  } else if (!parityPass || !benchmarkPass) {
    disposition = "reject-wasm-kernel";
    reasons.push("The Wasm benchmark does not meet parity, speedup, repeated-run, or absolute-savings thresholds.");
  } else {
    disposition = "promote-wasm-kernel";
    reasons.push(`The isolated kernel achieves ${(benchmarkSpeedup ?? 0).toFixed(2)}x speedup and ${(projectedWasmSavingsMilliseconds ?? 0).toFixed(1)}ms savings after bridge costs with accepted parity.`);
  }
  if (profile.optimizedMilliseconds <= profile.performanceBudgetMilliseconds) {
    reasons.push(`The optimized TypeScript planner already meets the ${profile.performanceBudgetMilliseconds.toFixed(0)}ms one-shot build budget.`);
  }

  const findings = [
    finding("acceleration.profile", profilePass ? "pass" : "fail", `pages=${profile.pageCount}, baseline=${profile.baselineMilliseconds.toFixed(1)}ms, optimized=${profile.optimizedMilliseconds.toFixed(1)}ms`),
    finding("acceleration.algorithm-first", algorithmFirstPass ? "pass" : "fail", `algorithmicSpeedup=${algorithmicSpeedup.toFixed(2)}x`),
    finding("acceleration.kernel-isolation", kernelLargeEnough ? "pass" : "fail", `kernel=${profile.denseNumericKernelName}, numeric=${profile.denseNumericKernelMilliseconds.toFixed(1)}ms, share=${(denseNumericShare * 100).toFixed(1)}%, contiguous=${profile.contiguousTypedArrayBoundary}`),
    finding("acceleration.wasm-benefit", benchmark ? (benchmarkPass ? "pass" : "fail") : "not-run", benchmark ? `speedup=${(benchmarkSpeedup ?? 0).toFixed(2)}x, savings=${(projectedWasmSavingsMilliseconds ?? 0).toFixed(1)}ms, runs=${benchmark.benchmarkRuns}` : "no bridge-inclusive Wasm kernel benchmark supplied"),
    finding("acceleration.parity", benchmark ? (parityPass ? "pass" : "fail") : "not-run", benchmark ? `exact=${benchmark.exactParity === true}, cosine=${benchmark.parityCosine ?? "not supplied"}` : "parity awaits a candidate Wasm kernel"),
    finding("acceleration.fallback", "pass", "TypeScript remains the complete semantic oracle and production fallback"),
  ];
  const canonical = { disposition, algorithmicSpeedup, denseNumericShare, projectedWasmSavingsMilliseconds, reasons, requiredNextEvidence, profile, benchmark: benchmark ?? null, policy };
  return { disposition, algorithmicSpeedup, denseNumericShare, projectedWasmSavingsMilliseconds, reasons, requiredNextEvidence, decisionHash: sha256(JSON.stringify(canonical)), validation: buildValidationReport(`acceleration:${profile.id}`, ACCELERATION_VALIDATION, findings) };
}

function validateInputs(profile: SitePlanningPerformanceProfile, benchmark: WasmKernelBenchmark | undefined, policy: AccelerationPolicy): void {
  const profileNumbers = [profile.pageCount, profile.baselineMilliseconds, profile.optimizedMilliseconds, profile.performanceBudgetMilliseconds, profile.candidateGenerationMilliseconds, profile.sparseSelectionMilliseconds, profile.siteProgramMilliseconds, profile.denseNumericKernelMilliseconds, profile.denseNumericInputBytes];
  if (profileNumbers.some((value) => !Number.isFinite(value) || value < 0)) throw new Error("performance profile values must be finite and non-negative");
  if (!profile.id.trim() || !profile.denseNumericKernelName.trim()) throw new Error("performance profile identity and kernel name are required");
  if (benchmark) {
    const benchmarkNumbers = [benchmark.javascriptMilliseconds, benchmark.wasmMilliseconds, benchmark.bridgeMilliseconds, benchmark.benchmarkRuns];
    if (benchmarkNumbers.some((value) => !Number.isFinite(value) || value < 0) || !benchmark.id.trim() || !benchmark.kernelName.trim()) throw new Error("invalid Wasm benchmark");
    if (benchmark.kernelName !== profile.denseNumericKernelName) throw new Error("Wasm benchmark kernel does not match the profiled kernel");
  }
  const policyNumbers = [policy.minimumAlgorithmicSpeedup, policy.minimumDenseNumericShare, policy.minimumDenseNumericMilliseconds, policy.minimumWasmSpeedup, policy.minimumAbsoluteWasmSavingsMilliseconds, policy.minimumParityCosine, policy.minimumBenchmarkRuns];
  if (policyNumbers.some((value) => !Number.isFinite(value) || value < 0)) throw new Error("invalid acceleration policy");
}
