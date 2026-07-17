import assert from "node:assert/strict";
import test from "node:test";
import { benchmarkAllArms, fixtureFingerprint, generateBenchmarkFixture } from "../dist/index.js";

test("500-case benchmark is deterministic and hybrid exceeds lexical control", () => {
  const first = generateBenchmarkFixture(500);
  const second = generateBenchmarkFixture(500);
  assert.equal(fixtureFingerprint(first), fixtureFingerprint(second));
  assert.equal(first.contexts.length, 500);
  assert.equal(first.pages.length, 240);
  const metrics = benchmarkAllArms(first, 256);
  const lexical = metrics.find((item) => item.arm === "lexical");
  const hybrid = metrics.find((item) => item.arm === "hybrid");
  assert.ok(hybrid.ndcgAt10 >= lexical.ndcgAt10);
  assert.ok(hybrid.badFitRate <= lexical.badFitRate);
  assert.equal(hybrid.zeroMatchAccuracy, 1);
});
