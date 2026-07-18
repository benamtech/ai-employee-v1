import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";
import {
  buildSparseLexicalIndex,
  compileAgentSiteProgram,
  compileApprovedOntology,
  compileOntologyGraph,
  compileOptimizedOpportunitySpace,
  compileSparseSiteGenerationPlan,
  normalizeProjectInput,
  prepareAgentSiteProgram,
  tfIdfCosine,
} from "../dist/index.js";
import { createAgentSiteFixture, createPageConceptProposals, createScaleAgentSiteFixture } from "../fixtures/agent-site-fixture.mjs";

test("sparse lexical baseline is deterministic and exposes related terms", () => {
  const documents = [
    { id: "a", text: "painting contractor estimate workflow" },
    { id: "b", text: "painting company estimating workflow" },
    { id: "c", text: "landscaping missed call intake" },
  ];
  const first = buildSparseLexicalIndex(documents);
  const second = buildSparseLexicalIndex([...documents].reverse());
  assert.equal(first.indexHash, second.indexHash);
  assert.ok(tfIdfCosine(first, "a", "b") > tfIdfCosine(first, "a", "c"));
});

test("stage-one agent proposal compiles into a governed ontology", () => {
  const fixture = createAgentSiteFixture();
  const project = normalizeProjectInput(fixture.project);
  const ontology = compileApprovedOntology(project, fixture.ontologyProposal);
  assert.equal(ontology.validation.passes, true);
  assert.ok(Object.keys(ontology.dimensions).length >= 8);
  assert.ok(ontology.attributes.some((item) => item.anchorKind === "service"));
  assert.ok(ontology.rejectedAttributes.some((item) => item.id === "attr:unsafe:medical"));
  assert.ok(ontology.rejectedAttributes.some((item) => item.id === "attr:unreviewed:age"));
  assert.ok(ontology.rejectedAttributes.some((item) => item.id === "attr:duplicate:painting"));
  assert.equal(ontology.attributes.some((item) => item.id === "attr:pet:dog"), true);
});

test("ontology graph keeps constraints separate and produces deterministic macro-regions", () => {
  const fixture = createAgentSiteFixture();
  const project = normalizeProjectInput(fixture.project);
  const ontology = compileApprovedOntology(project, fixture.ontologyProposal);
  const graph = compileOntologyGraph(ontology);
  assert.equal(graph.validation.passes, true);
  assert.ok(graph.edges.length > 0);
  assert.ok(graph.constraints.some((edge) => edge.type === "excludes"));
  assert.ok(graph.communities.length >= 1);
  assert.equal(graph.activeNodeIds.includes("attr:service:estimate-ai"), true);
});

test("agent-discovered ontology becomes vector regions and one site generation plan", () => {
  const fixture = createAgentSiteFixture();
  const prepared = prepareAgentSiteProgram(fixture);
  assert.equal(prepared.project.validation.passes, true);
  assert.equal(prepared.ontology.validation.passes, true);
  assert.equal(prepared.graph.validation.passes, true);
  assert.equal(prepared.opportunitySpace.validation.passes, true);
  assert.equal(prepared.siteGenerationPlan.validation.passes, true);
  assert.ok(prepared.opportunitySpace.candidates.length >= prepared.siteGenerationPlan.minimumPages);
  assert.ok(prepared.siteGenerationPlan.pageConceptJobs.length >= 8);
  assert.ok(prepared.siteGenerationPlan.pageConceptJobs.every((job) => job.attributes.length >= 4));
  assert.equal(new Set(prepared.siteGenerationPlan.batches.flatMap((batch) => batch.pageConceptJobIds)).size, prepared.siteGenerationPlan.pageConceptJobs.length);
});

test("second agentic stage compiles region-bound page concepts into CandidatePageSeeds", () => {
  const fixture = createAgentSiteFixture();
  const prepared = prepareAgentSiteProgram(fixture);
  const proposals = createPageConceptProposals(prepared.siteGenerationPlan);
  const compiled = compileAgentSiteProgram(prepared, proposals, fixture.siteGenerationPolicy);
  assert.equal(compiled.pageConcepts.validation.passes, true);
  assert.equal(compiled.pageConcepts.candidateSeeds.length, prepared.siteGenerationPlan.pageConceptJobs.length);
  assert.ok(compiled.pageConcepts.candidateSeeds.every((seed) => seed.prototypes.length === 1 && seed.primaryPrototypeId === seed.prototypes[0].id));
  assert.ok(compiled.pageConcepts.candidateSeeds.every((seed) => seed.informationObjectIds.length > 0 && seed.utilityOrTaskContractIds.length > 0));
});

test("page concept compiler rejects a proposal that does not express its selected region", () => {
  const fixture = createAgentSiteFixture();
  const prepared = prepareAgentSiteProgram(fixture);
  const proposals = createPageConceptProposals(prepared.siteGenerationPlan);
  proposals[0] = { ...proposals[0], expressedAttributeIds: proposals[0].expressedAttributeIds.slice(1) };
  assert.throws(() => compileAgentSiteProgram(prepared, proposals, fixture.siteGenerationPolicy), /validation failed/);
});

test("one-shot optimized sparse planner produces a 10,000-page site program without serving runtime", { timeout: 120_000 }, () => {
  const fixture = createScaleAgentSiteFixture(10_000);
  const totalStarted = performance.now();
  const projectStarted = performance.now();
  const project = normalizeProjectInput(fixture.project);
  const projectMilliseconds = performance.now() - projectStarted;
  const ontologyStarted = performance.now();
  const ontology = compileApprovedOntology(project, fixture.ontologyProposal, fixture.ontologyPolicy);
  const ontologyMilliseconds = performance.now() - ontologyStarted;
  const graphStarted = performance.now();
  const graph = compileOntologyGraph(ontology, fixture.graphPolicy);
  const graphMilliseconds = performance.now() - graphStarted;
  const opportunityStarted = performance.now();
  const opportunitySpace = compileOptimizedOpportunitySpace(project, ontology, graph, fixture.vectorIdentity, fixture.opportunityPolicy);
  const opportunityMilliseconds = performance.now() - opportunityStarted;
  const siteProgramStarted = performance.now();
  const siteGenerationPlan = compileSparseSiteGenerationPlan(project, ontology, opportunitySpace.selected, fixture.siteGenerationPolicy);
  const siteProgramMilliseconds = performance.now() - siteProgramStarted;
  const elapsedMilliseconds = performance.now() - totalStarted;
  const profile = {
    projectMilliseconds,
    ontologyMilliseconds,
    graphMilliseconds,
    opportunityMilliseconds,
    siteProgramMilliseconds,
    elapsedMilliseconds,
    candidates: opportunitySpace.candidates.length,
    selected: siteGenerationPlan.pageConceptJobs.length,
    packedVectorBytes: opportunitySpace.selected.packedVectors.byteLength,
    batches: siteGenerationPlan.batches.length,
  };
  console.log(`10k-site-profile-optimized ${JSON.stringify(profile)}`);
  assert.equal(siteGenerationPlan.pageConceptJobs.length, 10_000);
  assert.equal(siteGenerationPlan.batches.length, 400);
  assert.equal(opportunitySpace.selected.packedVectors.byteLength, 10_000 * 64 * 4);
  assert.equal(opportunitySpace.selected.validation.passes, true);
  assert.ok(opportunitySpace.candidates.length >= 10_000);
  assert.ok(elapsedMilliseconds < fixture.project.technical.performanceBudgets.planningMilliseconds, `planning took ${elapsedMilliseconds.toFixed(1)}ms`);
});
