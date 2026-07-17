import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyAgentPageProposal,
  buildHyperAwareAgentContext,
  compileFrameworkManifest,
  deriveUiScaffoldPlan,
  evaluateAgentPageProposalCoverage,
  parseFrameworkManifest,
} from "../dist/index.js";

const manifestText = readFileSync(new URL("../../site-manifest.yaml", import.meta.url), "utf8");

function proposalFixture(overrides = {}) {
  const proposal = {
    generation: {
      agent_id: "fixture-agent",
      model: "deterministic-test",
      prompt_hash: "prompt:001",
      source_ids: ["source:agent-proposal:001"],
      marginal_coverage_hypothesis: "Adds a distinct landscaping missed-call recovery region not covered by current pages.",
      coverage_contexts: [{
        id: "context:landscaping-missed-call-owner",
        weight: 3,
        source_ids: ["source:agent-proposal:001"],
        relevance_label: "perfect",
        feature_atoms: [
          { dimension: "industry", value: "landscaping", source_id: "source:agent-proposal:001", provenance: "researched" },
          { dimension: "problem", value: "missed-calls", source_id: "source:agent-proposal:001", provenance: "researched" },
          { dimension: "use_case", value: "lead-recovery", source_id: "source:agent-proposal:001", provenance: "researched" },
          { dimension: "audience", value: "owner-operator", source_id: "source:agent-proposal:001", provenance: "researched" },
          { dimension: "stage", value: "implement", source_id: "source:agent-proposal:001", provenance: "researched" },
          { dimension: "proof", value: "workflow", source_id: "source:agent-proposal:001", provenance: "researched" },
          { dimension: "surface", value: "canonical-page", source_id: "source:agent-proposal:001", provenance: "researched" },
        ],
      }],
    },
    evidence: [],
    claims: [],
    information_objects: [{
      id: "info:agent-proposal:001",
      kind: "workflow",
      title: "Missed-call recovery fixture",
      body: "A bounded fixture describing intake, owner escalation, scheduling, and recovery.",
      evidenceIds: ["evidence:synthetic-workflow"],
    }],
    modules: [{
      id: "module:agent-proposal:001",
      kind: "workflow",
      layout_role: "lead",
      heading: "Missed-call recovery",
      claim_ids: [],
      information_object_ids: ["info:agent-proposal:001"],
      required_capabilities: ["workflow-steps", "responsive-grid", "mobile-priority"],
      source_ids: ["source:agent-proposal:001"],
    }],
    page: {
      id: "page:agent-proposal:001",
      route: "/lab/landscaping/missed-call-recovery",
      canonical_question: "How can a landscaping owner recover missed calls without losing owner control?",
      title: "Landscaping Missed-Call Recovery Fixture | AMTECH",
      description: "A generated noindex fixture entering through the hyper-aware harness.",
      profile_ids: ["ui-scaffold"],
      feature_atoms: [
        { dimension: "industry", value: "landscaping", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
        { dimension: "problem", value: "missed-calls", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
        { dimension: "use_case", value: "lead-recovery", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
        { dimension: "audience", value: "owner-operator", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
        { dimension: "stage", value: "implement", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
        { dimension: "proof", value: "workflow", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
        { dimension: "surface", value: "canonical-page", source_id: "source:agent-proposal:001", provenance: "agent_proposed" },
      ],
      module_ids: ["module:agent-proposal:001", "module:cta"],
      internal_page_ids: [],
      auto_link: true,
      required_capabilities: ["semantic-hierarchy", "workflow-steps", "responsive-grid", "mobile-priority", "conversion-panel"],
      instruction_pointers: ["/lab/landscaping/missed-call-recovery/use.md"],
      variant_axes: ["density", "module-order"],
      publication_gate: "research",
      indexable: false,
    },
  };
  return { ...proposal, ...overrides };
}

test("unified manifest makes versioned hyper-vector geometry the first-class compiler input", () => {
  const compiled = compileFrameworkManifest(manifestText);
  assert.equal(compiled.manifest.framework.authority, "unified_manifest");
  assert.equal(compiled.vectorSpace.firstClass, true);
  assert.equal(compiled.vectorSpace.namespace, "amtech-hyper-site-v1");
  assert.equal(compiled.vectorSpace.symbolVersion, "1");
  assert.equal(compiled.vectorSpace.dimensions, 512);
  assert.equal(compiled.site.pages.length, 6);
  assert.equal(compiled.site.sitemapXml.includes("<url>"), false);
  assert.equal(compiled.vectorSpace.pages.every((page) => page.prototypes.length > 0), true);
  assert.equal(compiled.site.pages.every((artifact) => artifact.html.includes('name="robots" content="noindex,nofollow"')), true);
});

test("all page prototypes survive into PageIR, packed vectors, agent context, and UI inputs", () => {
  const compiled = compileFrameworkManifest(manifestText);
  const geometry = compiled.vectorSpace.pages.find((page) => page.pageId === "page:contractor-estimate-followup");
  const artifact = compiled.site.pages.find((item) => item.page.id === "page:contractor-estimate-followup");
  assert.ok(geometry);
  assert.ok(artifact);
  assert.equal(geometry.prototypes.length, 2);
  assert.equal(artifact.page.vectorPrototypes.length, 2);
  const pageIndex = compiled.site.packed.pageIds.indexOf(artifact.page.id);
  assert.notEqual(pageIndex, -1);
  assert.equal(compiled.site.packed.prototypeOffsets[pageIndex + 1] - compiled.site.packed.prototypeOffsets[pageIndex], 2);
  assert.equal(compiled.site.packed.prototypeVectors.length, compiled.site.packed.prototypeIds.length * compiled.site.packed.dimensions);

  const ui = deriveUiScaffoldPlan(compiled, "ui-scaffold");
  assert.deepEqual(ui.moduleKinds, ["answer", "comparison", "cta", "faq", "hero", "instruction", "proof", "workflow"]);
  assert.ok(ui.requiredCapabilities.includes("comparison-table"));
  assert.ok(ui.requiredCapabilities.includes("workflow-steps"));
  assert.equal(ui.pages.length, 2);

  const context = buildHyperAwareAgentContext(compiled, "ui-scaffold");
  assert.equal(context.currentPages.length, 2);
  assert.equal(context.vectorSpace.spaceHash, compiled.vectorSpace.spaceHash);
  assert.equal(context.vectorSpace.symbolVersion, "1");
  const contractor = context.currentPages.find((page) => page.pageId === artifact.page.id);
  assert.ok(contractor);
  assert.equal(contractor.prototypes.length, 2);
  assert.ok(contractor.prototypes.every((prototype) => prototype.targetAtoms.length >= 7));
});

test("computed marginal coverage admits a distinct proposal and rejects a duplicate", () => {
  const manifest = parseFrameworkManifest(manifestText);
  const proposal = proposalFixture();
  const report = evaluateAgentPageProposalCoverage(manifest, proposal);
  assert.equal(report.passes, true, report.reasons.join("; "));
  assert.ok(report.marginalGain > 0);
  assert.ok(report.improvingContextIds.includes("context:landscaping-missed-call-owner"));

  const next = applyAgentPageProposal(manifest, proposal);
  const nextCompiled = compileFrameworkManifest(next);
  assert.equal(nextCompiled.site.pages.length, 7);
  const emitted = nextCompiled.site.pages.find((artifact) => artifact.page.id === proposal.page.id);
  assert.ok(emitted);
  assert.equal(emitted.page.indexable, false);
  assert.ok(next.profiles["ui-scaffold"].page_ids.includes(proposal.page.id));

  const existing = manifest.pages.find((page) => page.id === "page:contractor-estimate-followup");
  assert.ok(existing);
  const duplicate = proposalFixture({
    generation: {
      ...proposal.generation,
      prompt_hash: "prompt:duplicate",
      marginal_coverage_hypothesis: "Duplicates the existing estimate page for rejection testing.",
      coverage_contexts: [{
        id: "context:duplicate-estimate",
        weight: 1,
        source_ids: ["source:agent-proposal:001"],
        relevance_label: "perfect",
        feature_atoms: existing.prototypes[0].feature_atoms,
      }],
    },
    page: {
      ...proposal.page,
      id: "page:agent-proposal:duplicate",
      route: "/lab/painting-contractors/estimate-followup-copy",
      canonical_question: "How can a painting contractor prepare, approve, send, and follow up on estimates again?",
      title: "Duplicate Estimate Fixture | AMTECH",
      feature_atoms: existing.prototypes[0].feature_atoms.map((atom) => ({ ...atom, source_id: "source:agent-proposal:001", provenance: "agent_proposed" })),
      instruction_pointers: ["/lab/painting-contractors/estimate-followup-copy/use.md"],
    },
  });
  const duplicateReport = evaluateAgentPageProposalCoverage(manifest, duplicate);
  assert.equal(duplicateReport.passes, false);
  assert.ok(duplicateReport.normalizedMarginalGain < manifest.agent_harness.coverage_policy.minimum_normalized_marginal_gain);
  assert.throws(() => applyAgentPageProposal(manifest, duplicate), /computed coverage gate/);
});
