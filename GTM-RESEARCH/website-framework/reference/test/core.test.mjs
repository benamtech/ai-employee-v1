import assert from "node:assert/strict";
import test from "node:test";

import {
  bind,
  buildInvalidationIndex,
  cosine,
  deterministicSymbol,
  emitCorpus,
  greedyFacilityLocation,
  normalize,
  scorePageShape,
  unbind,
  weightedSuperposition,
} from "../dist/core.js";

test("deterministic symbols and HRR retrieval are reproducible", () => {
  const dimensions = 512;
  const role = deterministicSymbol("role:industry", dimensions);
  const value = deterministicSymbol("value:painting-contractor", dimensions);
  const distractor = deterministicSymbol("value:restaurant-owner", dimensions);

  assert.deepEqual(role, deterministicSymbol("role:industry", dimensions));

  const composite = bind(role, value);
  const recovered = normalize(unbind(composite, role));
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

  const result = scorePageShape(contractorContext, {
    id: "page:estimate-followup",
    eligible: true,
    prototypes: [
      { id: "contractor", vector: contractorContext },
      { id: "founder", vector: founderPrototype },
    ],
  });

  assert.equal(result.prototypeId, "contractor");
  assert.ok(result.score > 0.99);
});

test("facility-location optimizer rejects a redundant page under budget", () => {
  const result = greedyFacilityLocation({
    contexts: [
      { id: "painting-estimate", weight: 3 },
      { id: "landscape-estimate", weight: 2 },
      { id: "hvac-dispatch", weight: 2 },
      { id: "roofing-claims", weight: 1 },
    ],
    candidateIds: ["estimate-hub", "estimate-copy", "dispatch", "claims"],
    similarities: [
      [1.0, 0.98, 0.05, 0.05],
      [0.9, 0.88, 0.05, 0.05],
      [0.05, 0.05, 1.0, 0.1],
      [0.05, 0.05, 0.1, 1.0],
    ],
    budget: 3,
  });

  assert.deepEqual(result.selectedIds, ["estimate-hub", "dispatch", "claims"]);
  assert.equal(result.objective, 7.8);
});

test("emissions are byte-identical and invalidation is dependency-bounded", () => {
  const atoms = [
    { id: "hero", semanticHtml: "<h1>AI Employee for estimates</h1>", sourceIds: ["claim:category"] },
    { id: "price", semanticHtml: "<p>Managed from $400.</p>", sourceIds: ["offer:managed-price"] },
    { id: "proof", semanticHtml: "<section><h2>Approval before sending</h2></section>", sourceIds: ["proof:approval"] },
  ];
  const plans = [
    {
      id: "page:painting-estimates",
      route: "/painting/estimates",
      title: "Painting estimate AI employee",
      description: "Prepare and follow up on painting estimates.",
      canonicalUrl: "https://amtechai.com/painting/estimates",
      atomIds: ["hero", "price", "proof"],
      sourceIds: ["route:painting-estimates"],
      instructionPointers: ["/painting/estimates/use.md"],
    },
    {
      id: "page:approval-control",
      route: "/ai-employee/approval-control",
      title: "AI employee approval control",
      description: "See where an AI employee asks before acting.",
      canonicalUrl: "https://amtechai.com/ai-employee/approval-control",
      atomIds: ["hero", "proof"],
      sourceIds: ["route:approval-control"],
    },
  ];

  const first = emitCorpus(plans, atoms);
  const second = emitCorpus([...plans].reverse(), [...atoms].reverse());
  assert.deepEqual(first, second);

  const index = buildInvalidationIndex(first);
  assert.deepEqual(index.get("offer:managed-price"), ["page:painting-estimates"]);
  assert.deepEqual(index.get("proof:approval"), ["page:approval-control", "page:painting-estimates"]);
});
