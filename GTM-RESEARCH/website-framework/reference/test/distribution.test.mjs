import assert from "node:assert/strict";
import test from "node:test";
import { aggregateDistribution, createConversionEvent, deterministicExperimentArm, manifestFingerprint } from "../dist/index.js";

test("field cohort and conversion metrics are deterministic and deduplicated", () => {
  const pages = ["conventional", "graph", "hyperdimensional"].flatMap((arm, armIndex) => Array.from({ length: 2 }, (_, i) => ({
    pageId: `${arm}-${i}`, route: `/${arm}/${i}`, arm, publishedAt: "2026-08-01", opportunityId: `o${armIndex}${i}`,
    targetContextIds: [`c${armIndex}${i}`], informationObjectIds: [`info${armIndex}${i}`], productionCostUsd: 100,
  })));
  const manifest = { experimentId: "field-1", version: "1", observationStart: "2026-08-01", observationEnd: "2026-10-01", primaryMetric: "gross-profit-per-page", pages, exclusions: ["branded", "internal"] };
  assert.equal(manifestFingerprint(manifest), manifestFingerprint({ ...manifest, pages: [...pages].reverse() }));
  const search = pages.map((page, i) => ({ date: "2026-08-10", pageId: page.pageId, query: `query-${i}`, impressions: 10 + i, clicks: i + 1, branded: false, compatible: true, indexed: true }));
  const event = createConversionEvent({ occurredAt: "2026-08-12", pageId: "hyperdimensional-0", variantId: "canonical", experimentId: "field-1", arm: "hyperdimensional", kind: "closed-won", valueUsd: 1200, grossProfitUsd: 800 });
  const metrics = aggregateDistribution(manifest, search, [event, event]);
  assert.equal(metrics.find((item) => item.arm === "hyperdimensional").grossProfitPerPage, 400);
  assert.equal(deterministicExperimentArm("e", "s", [1, 1, 1]), deterministicExperimentArm("e", "s", [1, 1, 1]));
});
