import assert from "node:assert/strict";
import test from "node:test";
import {
  bind, buildInvalidationIndex, circularConvolve, circularConvolveNaive, cosine, deterministicSymbol,
  emitCorpus, exhaustiveFacilityLocation, greedyFacilityLocation, normalize, scorePageShape, unbind, weightedSuperposition,
} from "../dist/index.js";

test("FFT circular convolution matches naive oracle", () => {
  const left = deterministicSymbol("left", 64);
  const right = deterministicSymbol("right", 64);
  const fft = circularConvolve(left, right);
  const naive = circularConvolveNaive(left, right);
  let maxError = 0;
  for (let i = 0; i < fft.length; i += 1) maxError = Math.max(maxError, Math.abs(fft[i] - naive[i]));
  assert.ok(maxError < 1e-10, `max error ${maxError}`);
});

test("deterministic symbols and HRR retrieval are reproducible", () => {
  const dimensions = 512;
  const role = deterministicSymbol("role:industry", dimensions);
  const value = deterministicSymbol("value:painting-contractor", dimensions);
  const distractor = deterministicSymbol("value:restaurant-owner", dimensions);
  assert.deepEqual(role, deterministicSymbol("role:industry", dimensions));
  const recovered = normalize(unbind(bind(role, value), role));
  assert.ok(cosine(recovered, value) > cosine(recovered, distractor) + 0.5);
});

test("multi-prototype page shape selects the compatible context", () => {
  const dimensions = 256;
  const audienceRole = deterministicSymbol("role:audience", dimensions);
  const taskRole = deterministicSymbol("role:task", dimensions);
  const contractorContext = weightedSuperposition([
    { vector: bind(audienceRole, deterministicSymbol("audience:contractor", dimensions)), weight: 1 },
    { vector: bind(taskRole, deterministicSymbol("task:estimate-followup", dimensions)), weight: 1 },
  ]);
  const founderPrototype = weightedSuperposition([
    { vector: bind(audienceRole, deterministicSymbol("audience:founder", dimensions)), weight: 1 },
    { vector: bind(taskRole, deterministicSymbol("task:architecture", dimensions)), weight: 1 },
  ]);
  const result = scorePageShape(contractorContext, { id: "page:estimate-followup", eligible: true,
    prototypes: [{ id: "contractor", vector: contractorContext }, { id: "founder", vector: founderPrototype }] });
  assert.equal(result.prototypeId, "contractor"); assert.ok(result.score > 0.99);
});

test("facility greedy rejects redundant page and matches exhaustive optimum", () => {
  const input = {
    contexts: [{ id: "painting", weight: 3 }, { id: "landscape", weight: 2 }, { id: "hvac", weight: 2 }, { id: "roofing", weight: 1 }],
    candidateIds: ["estimate-hub", "estimate-copy", "dispatch", "claims"],
    similarities: [[1, .98, .05, .05], [.9, .88, .05, .05], [.05, .05, 1, .1], [.05, .05, .1, 1]],
    budget: 3,
  };
  const greedy = greedyFacilityLocation(input);
  const exact = exhaustiveFacilityLocation(input);
  assert.deepEqual(greedy.selectedIds, ["estimate-hub", "dispatch", "claims"]);
  assert.equal(greedy.objective, exact.objective);
});

test("neutral emissions are order-independent and invalidation bounded", () => {
  const atoms = [
    { id: "hero", semanticHtml: "<h1>AI Employee for estimates</h1>", sourceIds: ["claim:category"] },
    { id: "price", semanticHtml: "<p>Managed from $400.</p>", sourceIds: ["offer:managed-price"] },
    { id: "proof", semanticHtml: "<section><h2>Approval before sending</h2></section>", sourceIds: ["proof:approval"] },
  ];
  const plans = [
    { id: "page:painting-estimates", route: "/painting/estimates", title: "Painting estimate AI employee", description: "Prepare and follow up.", canonicalUrl: "https://amtechai.com/painting/estimates", atomIds: ["hero", "price", "proof"], sourceIds: ["route:painting"], instructionPointers: ["/painting/estimates/use.md"] },
    { id: "page:approval-control", route: "/approval", title: "Approval control", description: "Approval boundary.", canonicalUrl: "https://amtechai.com/approval", atomIds: ["hero", "proof"], sourceIds: ["route:approval"] },
  ];
  const first = emitCorpus(plans, atoms); const second = emitCorpus([...plans].reverse(), [...atoms].reverse());
  assert.deepEqual(first, second);
  const index = buildInvalidationIndex(first);
  assert.deepEqual(index.get("offer:managed-price"), ["page:painting-estimates"]);
  assert.deepEqual(index.get("proof:approval"), ["page:approval-control", "page:painting-estimates"]);
});
