# Unified Manifest and UI Readiness Validation

Date: 2026-07-17
Branch: `agent/phase-2-materialization-engine-plan`
Status: source-wired and repository-CI validated for the declared reference scope; not production accepted

## Change validated

- removed the architectural split between the five-slice Request Mirror manifest and the synthetic compiler;
- made `site-manifest.yaml` the unified declarative authority;
- added `compileFrameworkManifest()`;
- made page prototype geometry precede graph links, agent context, UI scaffold, and page emissions;
- added typed `AgentPageProposal` validation and noindex research entry;
- added `deriveUiScaffoldPlan()` and `buildHyperAwareAgentContext()`;
- added GitHub Actions compilation, tests, manifest emission, and artifact upload.

## Repository CI evidence

Workflow: `Website Framework Reference`

```text
run: 29570420797
run number: 27
head: 72637e1e60179f9bac115b8b0c55c2b9f01d05f3
conclusion: success
```

Passed workflow steps:

```text
npm install --no-audit --no-fund
npm test
npm run manifest:emit
actions/upload-artifact
```

Emitted artifact:

```text
name: website-framework-manifest-emissions
artifact id: 8402827141
size: 17,149 bytes
sha256: 0a2e6d843ac671913bed4c39efbab28a84b81affa0013bd29e765702e9b3b735
retention: through 2026-07-24
```

An earlier workflow run correctly failed because `manifest:emit` resolved the manifest one directory too high. The package command was corrected from `../../site-manifest.yaml` to `../site-manifest.yaml`; the succeeding workflow validates the corrected path and actual repository manifest.

## Local structural checks

```text
JSON-compatible YAML parse: passed
TypeScript 5.8.3 structural typecheck against current public interfaces: passed
Unified manifest runtime check with deterministic local stubs: passed
Agent proposal insertion/recompile runtime check with deterministic local stubs: passed
```

Observed fixture state:

```text
manifest pages: 6
ui-scaffold pages: 2
agent-context pages: 2
agent proposal after insertion: 7 pages
current indexable pages: 0
publication state: noindex research
```

## Validation vector result

- one manifest authority: passed;
- every page has prototype geometry: passed;
- primary geometry feeds packed vectors with parity checking: passed;
- vector similarity feeds deterministic link derivation: passed;
- UI scaffold includes module kinds, roles, capabilities, variants, and vector-space hash: passed;
- agent context includes target atoms, neighbors, information objects, and design requirements: passed;
- agent proposal requires provenance, target region, marginal-coverage hypothesis, and information gain: passed;
- no page becomes indexable while `production_ready=false`: passed;
- CI compiles, tests, emits, and uploads the unified fixture corpus: passed.

## Pass vector

The unified manifest/composer architecture and first UI-pass handoff pass the declared source/reference gate.

This means the repository is ready to receive a supplied design system and implement the first renderer adapter against the `ui-scaffold` profile.

It does not mean the framework, emitted content, search strategy, or UI is production accepted.

## Fail vector retained

The next phase fails if:

- the UI renderer bypasses the manifest or creates separate page truth;
- geometry no longer drives graph, agent, UI, or emission artifacts;
- renderer output changes claims, evidence, canonical questions, links, structured data, or publication state;
- agent-generated proposals bypass noindex/research entry;
- synthetic scale or fixture pages are described as live SEO results.

## Not validated

- production UI renderer and design-system fidelity;
- browser, accessibility, reduced-motion, JS-disabled, Core Web Vitals, and layout behavior;
- Cloudflare deployment and cache/runtime behavior;
- Zig native, scalar Wasm, or SIMD Wasm parity/performance;
- real Search Console/Bing ingestion;
- indexing, ranking, citations, qualified leads, conversion, gross profit, or revenue;
- quality and business value of real hyper-aware agent-generated proposals.
