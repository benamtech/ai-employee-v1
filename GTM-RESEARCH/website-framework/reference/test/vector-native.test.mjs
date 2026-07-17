import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  compileFrameworkManifest,
  compileHrrFeatures,
  cosine,
  facilityLocationComplementInformation,
  greedyFacilityLocationComplementSelection,
  parseFrameworkManifest,
} from "../dist/index.js";

const manifestText = readFileSync(new URL("../../site-manifest.yaml", import.meta.url), "utf8");

test("vector namespace and symbol version are semantic identity, not metadata only", () => {
  const features = { industry: "painting-contractor", problem: "estimate-backlog", use_case: "estimate-followup" };
  const first = compileHrrFeatures(features, 512, { namespace: "space-a", symbolVersion: "1" });
  const repeated = compileHrrFeatures(features, 512, { namespace: "space-a", symbolVersion: "1" });
  const namespaceRotated = compileHrrFeatures(features, 512, { namespace: "space-b", symbolVersion: "1" });
  const versionRotated = compileHrrFeatures(features, 512, { namespace: "space-a", symbolVersion: "2" });
  assert.deepEqual(Array.from(first), Array.from(repeated));
  assert.ok(cosine(first, namespaceRotated) < 0.3);
  assert.ok(cosine(first, versionRotated) < 0.3);
});

test("broad vector-space hash is stable under source collection reordering", () => {
  const parsed = parseFrameworkManifest(manifestText);
  const first = compileFrameworkManifest(parsed);
  const reordered = {
    ...parsed,
    pages: [...parsed.pages].reverse(),
    modules: [...parsed.modules].reverse(),
    information_objects: [...parsed.information_objects].reverse(),
    claims: [...parsed.claims].reverse(),
    evidence: [...parsed.evidence].reverse(),
  };
  const second = compileFrameworkManifest(reordered);
  assert.equal(first.vectorSpace.spaceHash, second.vectorSpace.spaceHash);
  assert.equal(first.site.buildHash, second.site.buildHash);
});

test("facility-location complement information preserves head and tail while rejecting an isolated outlier", () => {
  const candidateIds = ["head-a", "head-b", "tail-a", "tail-b", "isolated-noise"];
  const kernel = [
    [1, .92, .12, .10, .01],
    [.92, 1, .10, .12, .01],
    [.12, .10, 1, .90, .01],
    [.10, .12, .90, 1, .01],
    [.01, .01, .01, .01, 1],
  ];
  assert.equal(facilityLocationComplementInformation(kernel, []), 0);
  assert.equal(facilityLocationComplementInformation(kernel, [0, 1, 2, 3, 4]), 0);
  const selected = greedyFacilityLocationComplementSelection({ candidateIds, similarityKernel: kernel, budget: 2 });
  assert.equal(selected.selectedIds.length, 2);
  assert.equal(selected.selectedIds.includes("isolated-noise"), false);
  assert.equal(selected.selectedIds.some((id) => id.startsWith("head")), true);
  assert.equal(selected.selectedIds.some((id) => id.startsWith("tail")), true);
  assert.ok(selected.objective > facilityLocationComplementInformation(kernel, [4]));
});
