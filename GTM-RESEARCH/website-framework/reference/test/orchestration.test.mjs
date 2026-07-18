import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  executeFrameworkProject,
  fitIsotonicCalibration,
  freezeContextCorpus,
  normalizeProjectInput,
  parseFrameworkManifest,
  predictCompatibility,
  prepareFrameworkProject,
  renderFrameworkPreviewHtml,
  runPageGenerationJob,
} from "../dist/index.js";
import { createFixtureExecutor, createOrchestrationFixture } from "../fixtures/orchestration-fixture.mjs";

const manifestText = readFileSync(new URL("../../site-manifest.yaml", import.meta.url), "utf8");
const manifest = parseFrameworkManifest(manifestText);
const fixture = createOrchestrationFixture(manifest);

test("ProjectInput and ledgers are canonical under reordering", () => {
  const first = normalizeProjectInput(fixture.project);
  const second = normalizeProjectInput({ ...fixture.project, sources: [...fixture.project.sources].reverse(), assets: [...fixture.project.assets].reverse() });
  assert.equal(first.projectHash, second.projectHash);
  assert.equal(first.validation.passes, true);
  assert.equal(first.sourceLedger.length, 1);
  assert.equal(first.assetLedger.length, 1);
});

test("ContextCorpus freezes independent graded train validation test splits", () => {
  const first = freezeContextCorpus(fixture.contextCorpus.id, fixture.contextCorpus.version, fixture.contextCorpus.cases, fixture.contextCorpus.splitPolicy, fixture.contextCorpus.generationAgentId);
  const second = freezeContextCorpus(fixture.contextCorpus.id, fixture.contextCorpus.version, [...fixture.contextCorpus.cases].reverse(), fixture.contextCorpus.splitPolicy, fixture.contextCorpus.generationAgentId);
  assert.equal(first.corpusHash, second.corpusHash);
  assert.deepEqual(first.splitHashes, second.splitHashes);
  assert.equal(new Set(first.cases.map((item) => item.split)).size, 3);
  assert.ok(first.cases.every((item) => item.judgments.length >= 2));
});

test("ContextCorpus rejects acceptance cases authored by the generation agent", () => {
  const cases = fixture.contextCorpus.cases.map((item, index) => index === 0
    ? { ...item, provenance: { ...item.provenance, createdBy: "generation-agent", authorClass: "agent-generated" } }
    : item);
  assert.throws(() => freezeContextCorpus(fixture.contextCorpus.id, fixture.contextCorpus.version, cases, fixture.contextCorpus.splitPolicy, "generation-agent"), /authored by the generation agent/);
});

test("isotonic compatibility is monotonic and ineligible fit is zero", () => {
  const calibration = fitIsotonicCalibration("fixture", fixture.calibrationObservations);
  assert.equal(calibration.validationReport.passes, true);
  assert.equal(calibration.model.probabilities.every((value, index, values) => index === 0 || value >= values[index - 1]), true);
  assert.equal(predictCompatibility(calibration.model, 0, false), 0);
  assert.ok(predictCompatibility(calibration.model, 0.95, true) > predictCompatibility(calibration.model, 0.05, true));
});

test("pipeline compiles explicit primaries selected corpus typed graph and jobs", () => {
  const prepared = prepareFrameworkProject(fixture);
  assert.equal(prepared.project.validation.passes, true);
  assert.equal(prepared.contextCorpus.validation.passes, true);
  assert.equal(prepared.calibration.validationReport.passes, true);
  assert.equal(prepared.selectedCorpus.validation.passes, true);
  assert.equal(prepared.selectedCorpus.selected.length, 2);
  assert.equal(prepared.selectedCorpus.rejected.length, 1);
  assert.equal(prepared.generationJobs.length, 2);
  const painting = prepared.generationJobs.find((item) => item.pageId === "candidate:painting-estimate");
  assert.ok(painting);
  assert.equal(painting.primaryPrototypeId, "owner-estimate");
  assert.equal(painting.targetPrototypes[0].id, "owner-estimate");
  assert.ok(painting.generationPlan.includes("ui"));
  assert.ok(painting.requiredGraphEdges.length > 0);
  const paintingCoordinate = prepared.coordinates.find((item) => item.id === "candidate:painting-estimate");
  assert.ok(paintingCoordinate);
  for (const fit of paintingCoordinate.contextCompatibility.filter((item) => item.contextId.includes("landscape"))) {
    assert.equal(fit.eligible, false);
    assert.equal(fit.calibratedProbability, 0);
  }
});

test("explicit primary identity is invariant to prototype source ordering", () => {
  const reversed = createOrchestrationFixture(manifest);
  reversed.candidateSeeds = reversed.candidateSeeds.map((seed) => seed.id === "candidate:painting-estimate"
    ? { ...seed, prototypes: [...seed.prototypes].reverse() }
    : seed);
  const first = prepareFrameworkProject(fixture);
  const second = prepareFrameworkProject(reversed);
  const firstPage = first.coordinates.find((item) => item.id === "candidate:painting-estimate");
  const secondPage = second.coordinates.find((item) => item.id === "candidate:painting-estimate");
  assert.ok(firstPage && secondPage);
  assert.equal(firstPage.primaryPrototypeId, secondPage.primaryPrototypeId);
  assert.equal(firstPage.candidateHash, secondPage.candidateHash);
  assert.deepEqual(firstPage.prototypes.map((item) => item.id), secondPage.prototypes.map((item) => item.id));
});

test("agent runner performs bounded repair and preview exposes rejection reasons", async () => {
  const prepared = prepareFrameworkProject(fixture);
  const executed = await executeFrameworkProject(prepared, createFixtureExecutor(), { maximumRepairAttempts: 1 });
  assert.equal(executed.generationRuns.every((run) => run.status === "completed"), true);
  assert.ok(executed.generationRuns.some((run) => run.events.some((event) => event.state === "repair-started")));
  assert.equal(executed.preview.pages.length, prepared.generationJobs.length);
  assert.equal(executed.preview.rejectedPages.length, prepared.selectedCorpus.rejected.length);
  assert.ok(executed.preview.rejectedPages.every((item) => item.reasons.length > 0));
  assert.equal(executed.preview.validation.passes, true);
  const html = renderFrameworkPreviewHtml(executed.preview);
  assert.match(html, /Page generation jobs/);
  assert.match(html, /Rejected coordinates/);
  assert.match(html, /Validation reports/);
  assert.match(html, /candidate:painting-estimate/);
  assert.doesNotMatch(html, /<script/i);
});

test("agent runner rejects a job when the repair budget is exhausted", async () => {
  const prepared = prepareFrameworkProject(fixture);
  const job = prepared.generationJobs[0];
  const executor = {
    id: "always-fail",
    async execute(request) {
      return {
        pass: request.pass,
        status: "fail",
        summary: "hard validation failure",
        artifacts: {},
        usedSourceIds: [request.job.sourceIds[0]],
        findings: [{ attributeId: "job.contract", state: "fail", detail: "fixture hard failure" }],
      };
    },
  };
  const result = await runPageGenerationJob(job, executor, { maximumRepairAttempts: 0 });
  assert.equal(result.status, "rejected");
  assert.ok(result.events.some((event) => event.state === "rejected"));
  assert.equal(result.validation.passes, false);
});
