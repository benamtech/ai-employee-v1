# Unified Manifest and UI Readiness Validation

Date: 2026-07-17
Branch: `agent/phase-2-materialization-engine-plan`
Status: locally structure-checked; repository CI pending at time of commit

## Change validated

- replaced the architectural split between the five-slice Request Mirror manifest and the synthetic compiler;
- made `site-manifest.yaml` the unified declarative authority;
- added `compileFrameworkManifest()`;
- made page prototype geometry precede graph links, agent context, UI scaffold, and page emissions;
- added typed `AgentPageProposal` validation and noindex research entry;
- added `deriveUiScaffoldPlan()` and `buildHyperAwareAgentContext()`;
- added GitHub Actions validation and emitted fixture artifacts.

## Local checks run

```text
JSON-compatible YAML parse: passed
TypeScript 5.8.3 structural typecheck against current public interfaces: passed
Unified manifest runtime check with deterministic local stubs: passed
Agent proposal insertion/recompile runtime check with deterministic local stubs: passed
```

Observed local structural results:

```text
manifest pages: 6
ui-scaffold pages: 2
agent-context pages: 2
agent proposal after insertion: 7 pages
all publication gates: noindex research
```

## Validation vector

- one manifest authority;
- all pages have prototype geometry;
- primary geometry feeds packed vectors;
- vector similarity feeds deterministic link derivation;
- UI scaffold contains module kinds, roles, capabilities, variants, and vector-space hash;
- agent context contains target atoms, neighbors, information objects, and design requirements;
- agent proposal requires provenance, target region, marginal-coverage hypothesis, and information gain;
- no page becomes indexable while `production_ready=false`.

## Pass vector

Pending full repository CI. Local structural checks satisfy the declared composer/handoff behavior.

## Fail vector

This update fails if repository CI does not compile the actual package, if manifest emissions differ from the local structural assumptions, if packed-vector parity fails, or if any current page becomes indexable.

## Not validated

- actual GitHub Actions result at commit time;
- production UI renderer;
- browser/accessibility/Core Web Vitals;
- Cloudflare and Zig/Wasm;
- real search indexing, ranking, citations, leads, conversion, or revenue;
- quality of real agent-generated content proposals.
