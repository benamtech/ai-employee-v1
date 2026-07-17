import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyAgentPageProposal,
  buildHyperAwareAgentContext,
  compileFrameworkManifest,
  deriveUiScaffoldPlan,
} from "../dist/index.js";

const manifestText = readFileSync(new URL("../../site-manifest.yaml", import.meta.url), "utf8");

test("unified manifest makes hyper-vector geometry the first-class compiler input", () => {
  const compiled = compileFrameworkManifest(manifestText);
  assert.equal(compiled.manifest.framework.authority, "unified_manifest");
  assert.equal(compiled.vectorSpace.firstClass, true);
  assert.equal(compiled.vectorSpace.dimensions, 512);
  assert.equal(compiled.site.pages.length, 6);
  assert.equal(compiled.site.sitemapXml.includes("<url>"), false);
  assert.equal(compiled.vectorSpace.pages.every((page) => page.prototypes.length > 0), true);
  assert.equal(compiled.site.pages.every((artifact) => artifact.html.includes('name="robots" content="noindex,nofollow"')), true);
});

test("vector geometry derives graph edges, agent context, and UI scaffold inputs", () => {
  const compiled = compileFrameworkManifest(manifestText);
  const contractor = compiled.site.pages.find((artifact) => artifact.page.id === "page:contractor-estimate-followup");
  assert.ok(contractor);
  assert.ok(contractor.page.internalPageIds.includes("page:technical-security"));

  const ui = deriveUiScaffoldPlan(compiled, "ui-scaffold");
  assert.deepEqual(ui.moduleKinds, ["answer", "comparison", "cta", "faq", "hero", "instruction", "proof", "workflow"]);
  assert.ok(ui.requiredCapabilities.includes("comparison-table"));
  assert.ok(ui.requiredCapabilities.includes("workflow-steps"));
  assert.equal(ui.pages.length, 2);

  const context = buildHyperAwareAgentContext(compiled, "ui-scaffold");
  assert.equal(context.currentPages.length, 2);
  assert.equal(context.vectorSpace.spaceHash, compiled.vectorSpace.spaceHash);
  assert.ok(context.currentPages.every((page) => page.targetAtoms.length >= 8));
});

test("agent proposals enter through vector-region, evidence, information-gain, and noindex gates", () => {
  const compiled = compileFrameworkManifest(manifestText);
  const proposal = {
    generation: {
      agent_id: "fixture-agent",
      model: "deterministic-test",
      prompt_hash: "prompt:001",
      source_ids: ["source:agent-proposal:001"],
      marginal_coverage_hypothesis: "Adds a distinct landscaping missed-call recovery region not covered by current pages.",
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
  const next = applyAgentPageProposal(compiled.manifest, proposal);
  const nextCompiled = compileFrameworkManifest(next);
  assert.equal(nextCompiled.site.pages.length, 7);
  const emitted = nextCompiled.site.pages.find((artifact) => artifact.page.id === proposal.page.id);
  assert.ok(emitted);
  assert.equal(emitted.page.indexable, false);
  assert.ok(next.profiles["ui-scaffold"].page_ids.includes(proposal.page.id));
});
