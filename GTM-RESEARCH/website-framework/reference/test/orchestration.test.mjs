import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildValidationReport,
  compilePageCoordinates,
  compileTypedGraph,
  coordinateSimilarity,
  executeFrameworkProject,
  findTypedPaths,
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
  assert.equal(first.validation.complete, true);
  assert.equal(first.sourceLedger.length, 1);
  assert.equal(first.evidenceLedger.length, 1);
  assert.equal(first.assetLedger.length, 1);
});

test("hard pending validation is incomplete and cannot pass", () => {
  const report = buildValidationReport("hard-pending", [{
    id: "required.check",
    feature: "Required check",
    workflowStep: "validate",
    algorithmChoice: "explicit",
    userEffect: "visible status",
    developerEffect: "cannot skip gate",
    validationVector: ["run"],
    passVector: ["passed"],
    failVector: ["not run"],
    simplerBaseline: "implicit success",
    severity: "hard",
  }], []);
  assert.equal(report.complete, false);
  assert.equal(report.passes, false);
  assert.deepEqual(report.hardPending, ["required.check"]);
});

test("ContextCorpus freezes independent graded train validation test splits", () => {
  const first = freezeContextCorpus(fixture.contextCorpus.id, fixture.contextCorpus.version, fixture.contextCorpus.cases, fixture.contextCorpus.splitPolicy, fixture.contextCorpus.generationAgentId);
  const second = freezeContextCorpus(fixture.contextCorpus.id, fixture.contextCorpus.version, [...fixture.contextCorpus.cases].reverse(), fixture.contextCorpus.splitPolicy, fixture.contextCorpus.generationAgentId);
  assert.equal(first.corpusHash, second.corpusHash);
  assert.deepEqual(first.splitHashes, second.splitHashes);
  assert.deepEqual(first.sliceSplitCounts, second.sliceSplitCounts);
  assert.equal(new Set(first.cases.map((item) => item.split)).size, 3);
  assert.ok(first.cases.every((item) => item.judgments.length >= 2));
});

test("ContextCorpus rejects acceptance cases authored by the generation agent", () => {
  const cases = fixture.contextCorpus.cases.map((item, index) => index === 0
    ? { ...item, provenance: { ...item.provenance, createdBy: "generation-agent", authorClass: "agent-generated" } }
    : item);
  assert.throws(() => freezeContextCorpus(fixture.contextCorpus.id, fixture.contextCorpus.version, cases, fixture.contextCorpus.splitPolicy, "generation-agent"), /authored by the generation agent/);
});

test("isotonic compatibility is monotonic, scorer-bound, and ineligible fit is zero", () => {
  const calibration = fitIsotonicCalibration("fixture", fixture.calibrationObservations);
  assert.equal(calibration.validationReport.passes, true);
  assert.equal(calibration.model.scorerId, "hrr-positive-cosine-v1");
  assert.equal(calibration.model.probabilities.every((value, index, values) => index === 0 || value >= values[index - 1]), true);
  assert.equal(predictCompatibility(calibration.model, 0, false), 0);
  assert.ok(predictCompatibility(calibration.model, 0.95, true) > predictCompatibility(calibration.model, 0.05, true));
  const mixed = fixture.calibrationObservations.map((item, index) => index === 0 ? { ...item, scorerId: "different-scorer" } : item);
  assert.throws(() => fitIsotonicCalibration("mixed", mixed), /exactly one scorerId/);
});

test("orchestrator rejects calibration observations with unknown or mismatched provenance", () => {
  const badContext = createOrchestrationFixture(manifest);
  badContext.calibrationObservations = badContext.calibrationObservations.map((item, index) => index === 0 ? { ...item, contextId: "ctx:missing" } : item);
  assert.throws(() => prepareFrameworkProject(badContext), /unknown context/);
  const badSplit = createOrchestrationFixture(manifest);
  badSplit.calibrationObservations = badSplit.calibrationObservations.map((item, index) => index === 0 ? { ...item, split: "test" } : item);
  assert.throws(() => prepareFrameworkProject(badSplit), /disagrees with context/);
  const badSource = createOrchestrationFixture(manifest);
  badSource.calibrationObservations = badSource.calibrationObservations.map((item, index) => index === 0 ? { ...item, sourceIds: ["source:missing"] } : item);
  assert.throws(() => prepareFrameworkProject(badSource), /unknown source/);
});

test("pipeline compiles explicit primaries selected corpus typed graph and jobs", () => {
  const prepared = prepareFrameworkProject(fixture);
  assert.equal(prepared.project.validation.passes, true);
  assert.equal(prepared.contextCorpus.validation.passes, true);
  assert.equal(prepared.calibration.validationReport.passes, true);
  assert.equal(prepared.selectedCorpus.validation.passes, true);
  assert.equal(prepared.selectedCorpus.selected.length, 2);
  assert.equal(prepared.selectedCorpus.maximumPages, 2);
  assert.equal(prepared.selectedCorpus.rejected.length, 1);
  assert.equal(prepared.generationJobs.length, 2);
  const painting = prepared.generationJobs.find((item) => item.pageId === "candidate:painting-estimate");
  assert.ok(painting);
  assert.equal(painting.primaryPrototypeId, "owner-estimate");
  assert.equal(painting.targetPrototypes[0].id, "owner-estimate");
  assert.ok(painting.generationPlan.includes("ui"));
  assert.ok(painting.requiredGraphEdges.length > 0);
  assert.deepEqual(painting.sourceIds, ["source:fixture"]);
  assert.deepEqual(painting.evidenceIds, ["evidence:source:fixture"]);
  const paintingCoordinate = prepared.coordinates.find((item) => item.id === "candidate:painting-estimate");
  assert.ok(paintingCoordinate);
  for (const fit of paintingCoordinate.contextCompatibility.filter((item) => item.contextId.includes("landscape"))) {
    assert.equal(fit.eligible, false);
    assert.equal(fit.calibratedProbability, 0);
  }
});

test("coordinate ledger references and project page cap are enforced", () => {
  const badEvidence = createOrchestrationFixture(manifest);
  badEvidence.candidateSeeds = badEvidence.candidateSeeds.map((seed, index) => index === 0 ? { ...seed, evidenceIds: ["evidence:missing"] } : seed);
  assert.throws(() => prepareFrameworkProject(badEvidence), /unknown evidence/);

  const capped = createOrchestrationFixture(manifest);
  capped.project = { ...capped.project, goals: { ...capped.project.goals, maximumInitialPages: 1 } };
  capped.selection = { ...capped.selection, budget: 10, maximumPages: 10, minimumValidationCoverage: 0.4, minimumTestCoverage: 0.4 };
  const prepared = prepareFrameworkProject(capped);
  assert.equal(prepared.selectedCorpus.selected.length, 1);
  assert.equal(prepared.selectedCorpus.maximumPages, 1);
  assert.equal(prepared.selectedCorpus.spent, 1);
});

test("required dimensions must match within one prototype, not across prototypes", () => {
  const prepared = prepareFrameworkProject(fixture);
  const base = fixture.candidateSeeds[0];
  const atom = (dimension, value) => ({ dimension, value, source_id: "source:fixture", provenance: "researched" });
  const crossOnly = {
    ...base,
    id: "candidate:cross-prototype-only",
    route: "/research/cross-prototype-only",
    primaryPrototypeId: "industry-only-match",
    prototypes: [
      { id: "industry-only-match", feature_atoms: [atom("industry", "painting-contractor"), atom("problem", "missed-calls"), atom("use_case", "lead-recovery"), atom("audience", "owner-operator"), atom("stage", "evaluate"), atom("surface", "canonical-page")] },
      { id: "problem-only-match", feature_atoms: [atom("industry", "landscaping"), atom("problem", "estimate-backlog"), atom("use_case", "estimate-followup"), atom("audience", "owner-operator"), atom("stage", "evaluate"), atom("surface", "canonical-page")] },
    ],
    graphEdges: [],
    eligibility: { requiredSharedDimensions: ["industry", "problem"], excludedAtomSets: [] },
  };
  const [coordinate] = compilePageCoordinates(manifest, prepared.contextCorpus, prepared.calibration, [crossOnly]);
  assert.ok(coordinate.contextCompatibility.every((item) => item.eligible === false && item.calibratedProbability === 0));
  assert.equal(coordinate.validation.passes, false);
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

test("compatibility-vector similarity distinguishes unrelated and duplicate coordinates", () => {
  const prepared = prepareFrameworkProject(fixture);
  const painting = prepared.coordinates.find((item) => item.id === "candidate:painting-estimate");
  const landscape = prepared.coordinates.find((item) => item.id === "candidate:landscape-leads");
  const duplicate = prepared.coordinates.find((item) => item.id === "candidate:painting-estimate-copy");
  assert.ok(painting && landscape && duplicate);
  assert.ok(coordinateSimilarity(painting, landscape) < 0.25);
  assert.ok(coordinateSimilarity(painting, duplicate) > 0.99);
});

test("typed path search respects maximum depth", () => {
  const graph = compileTypedGraph(["a", "b", "c"], [
    { id: "a-b", fromPageId: "a", toPageId: "b", type: "next-workflow-step", rationale: "step one", sourceIds: ["source:fixture"], eligibility: [], priority: 1 },
    { id: "b-c", fromPageId: "b", toPageId: "c", type: "next-workflow-step", rationale: "step two", sourceIds: ["source:fixture"], eligibility: [], priority: 1 },
  ]);
  assert.deepEqual(findTypedPaths(graph, "a", (pageId) => pageId === "c", 1), []);
  assert.deepEqual(findTypedPaths(graph, "a", (pageId) => pageId === "c", 2), [["a", "b", "c"]]);
  assert.throws(() => findTypedPaths(graph, "a", () => true, -1), /non-negative integer/);
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
  assert.equal(executed.preview.validations.every((report) => report.hardPending.length === 0), true);
  const html = renderFrameworkPreviewHtml(executed.preview);
  assert.match(html, /Page generation jobs/);
  assert.match(html, /Rejected coordinates/);
  assert.match(html, /Validation reports/);
  assert.match(html, /candidate:painting-estimate/);
  assert.match(html, /<caption>/);
  assert.match(html, /<th scope="col">/);
  assert.doesNotMatch(html, /<script/i);
});

test("agent runner rejects a job when the repair budget is exhausted and preview preserves failure", async () => {
  const prepared = prepareFrameworkProject(fixture);
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
  const result = await runPageGenerationJob(prepared.generationJobs[0], executor, { maximumRepairAttempts: 0 });
  assert.equal(result.status, "rejected");
  assert.ok(result.events.some((event) => event.state === "rejected"));
  assert.equal(result.validation.passes, false);

  const executed = await executeFrameworkProject(prepared, executor, { maximumRepairAttempts: 0 });
  assert.equal(executed.preview.validation.passes, false);
  assert.ok(executed.preview.pages.every((item) => item.generationStatus === "rejected"));
  assert.ok(executed.preview.validation.hardFailures.includes("runner.checkpoints"));
});
