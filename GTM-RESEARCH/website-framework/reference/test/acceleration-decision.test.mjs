import assert from "node:assert/strict";
import test from "node:test";
import { decideWasmAcceleration } from "../dist/index.js";

test("measured 10k profile keeps TypeScript and fails Wasm promotion gates", () => {
  const decision = decideWasmAcceleration({
    id: "profile:10k-production-2026-07-18",
    pageCount: 10_000,
    baselineMilliseconds: 29_000,
    optimizedMilliseconds: 6_635.654275,
    performanceBudgetMilliseconds: 30_000,
    candidateGenerationMilliseconds: 2_657.69063,
    sparseSelectionMilliseconds: 2_205.877052,
    siteProgramMilliseconds: 1_133.43862,
    denseNumericKernelMilliseconds: 953.14134,
    denseNumericKernelName: "hrr-region-compilation",
    denseNumericInputBytes: 2_560_000,
    contiguousTypedArrayBoundary: true,
  });
  assert.equal(decision.disposition, "keep-typescript");
  assert.ok(decision.algorithmicSpeedup > 4);
  assert.ok(decision.denseNumericShare < 0.25);
  assert.equal(decision.projectedWasmSavingsMilliseconds, null);
  assert.ok(decision.validation.hardFailures.includes("acceleration.kernel-isolation"));
  assert.ok(decision.validation.hardPending.includes("acceleration.parity"));
  assert.ok(decision.reasons.some((reason) => reason.includes("already meets")));
});

test("Wasm promotion requires repeated bridge-inclusive speedup and parity", () => {
  const decision = decideWasmAcceleration({
    id: "profile:hypothetical-dense-kernel",
    pageCount: 50_000,
    baselineMilliseconds: 60_000,
    optimizedMilliseconds: 20_000,
    performanceBudgetMilliseconds: 25_000,
    candidateGenerationMilliseconds: 3_000,
    sparseSelectionMilliseconds: 11_000,
    siteProgramMilliseconds: 2_000,
    denseNumericKernelMilliseconds: 6_000,
    denseNumericKernelName: "hrr-region-compilation",
    denseNumericInputBytes: 25_600_000,
    contiguousTypedArrayBoundary: true,
  }, {
    id: "benchmark:hrr-wasm",
    kernelName: "hrr-region-compilation",
    javascriptMilliseconds: 6_000,
    wasmMilliseconds: 3_500,
    bridgeMilliseconds: 250,
    parityCosine: 0.9999999,
    exactParity: false,
    benchmarkRuns: 30,
  });
  assert.equal(decision.disposition, "promote-wasm-kernel");
  assert.ok(decision.projectedWasmSavingsMilliseconds >= 2_000);
  assert.equal(decision.validation.passes, true);
});
