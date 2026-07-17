import assert from "node:assert/strict";
import test from "node:test";
import { greedyCompositeSelection, greedyFacilityLocation, lazyGreedyFacilityLocation, leaveOneOutMarginals, logDeterminantForSelection } from "../dist/index.js";

test("lazy facility selection matches exact greedy control", () => {
  const input = {
    contexts: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, weight: 1 + i % 3 })),
    candidateIds: Array.from({ length: 18 }, (_, i) => `p${String(i).padStart(2, "0")}`),
    similarities: Array.from({ length: 12 }, (_, c) => Array.from({ length: 18 }, (_, p) => Math.max(0, 1 - Math.abs((p % 12) - c) / 8))),
    budget: 6,
  };
  const exact = greedyFacilityLocation(input);
  const lazy = lazyGreedyFacilityLocation(input);
  assert.deepEqual(lazy.selectedIds, exact.selectedIds);
  assert.ok(Math.abs(lazy.objective - exact.objective) < 1e-12);
});

test("composite optimizer preserves coherent rare group but not isolated noise", () => {
  const facility = { contexts: [{ id: "main", weight: 5 }, { id: "rare", weight: 1 }], candidateIds: ["hub", "rare-a", "rare-b", "noise"], similarities: [[1, .1, .1, 0], [.1, .8, .8, .2]], budget: 3 };
  const result = greedyCompositeSelection({
    facility,
    candidates: [
      { id: "hub", cost: 1, informationObjectIds: ["hub"], rareGroups: [] },
      { id: "rare-a", cost: 1, informationObjectIds: ["ra"], rareGroups: ["rare"] },
      { id: "rare-b", cost: 1, informationObjectIds: ["rb"], rareGroups: ["rare"] },
      { id: "noise", cost: 1, informationObjectIds: ["noise"], rareGroups: ["noise"] },
    ],
    informationWeight: .1, rareTailWeight: 1, diversityWeight: 0,
  });
  assert.ok(result.selectedIds.includes("hub"));
  assert.ok(result.selectedIds.includes("rare-a") && result.selectedIds.includes("rare-b"));
  assert.ok(!result.selectedIds.includes("noise"));
  const marginals = leaveOneOutMarginals(facility, result.selectedIndexes);
  assert.ok(marginals.get("hub") > 0);
  assert.ok(logDeterminantForSelection([[1, .2], [.2, 1]], [0, 1]) > 0);
});
