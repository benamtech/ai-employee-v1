import assert from "node:assert/strict";
import test from "node:test";
import { compileSite, createReferenceDesignContract, generateSyntheticSite, generateVariantPlans, runScaleCompilation, validateDesignSystemSuperset } from "../dist/index.js";

test("packed IR and emissions are deterministic under source reordering", () => {
  const source = generateSyntheticSite(200);
  const first = compileSite(source, 256);
  const second = compileSite({ ...source, pages: [...source.pages].reverse(), modules: [...source.modules].reverse(), informationObjects: [...source.informationObjects].reverse() }, 256);
  assert.equal(first.buildHash, second.buildHash);
  assert.equal(first.pages.length, 200);
  assert.equal(first.packed.pageVectors.length, 200 * 256);
  assert.equal(generateVariantPlans(source, 3).length, 600);
  assert.ok(first.pages.every((artifact) => artifact.html.includes('<link rel="canonical"')));
});

test("reference design contract is a satisfiable UI superset", () => {
  const compiled = compileSite(generateSyntheticSite(40), 128);
  const result = validateDesignSystemSuperset(compiled, createReferenceDesignContract());
  assert.equal(result.ok, true);
});

test("scale compilation reports deterministic 500-page corpus", () => {
  let clock = 0;
  const report = runScaleCompilation(500, () => ++clock);
  assert.equal(report.pageCount, 500);
  assert.equal(report.variantCount, 1500);
  assert.equal(report.deterministic, true);
  assert.ok(report.htmlBytes > 0 && report.packedVectorBytes > 0);
});
