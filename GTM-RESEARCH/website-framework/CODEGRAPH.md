# CODEGRAPH.md — Unified Hyper-Vector Publishing Framework

Status: source-wired research reference; UI renderer and field acceptance pending
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## Reality

This subtree is not yet a production web framework. It is an executable research package plus specifications.

Source-wired:

- TypeScript HRR/VSA algebra and comparison fixtures;
- corpus optimizers;
- typed semantic compiler and packed artifacts;
- synthetic scale and deterministic emission tests;
- source scaffolds for resolver, Zig/Wasm, Worker distribution, search cohorts, and conversion attribution;
- unified manifest composer, hyper-aware agent contract, and UI-scaffold plan.

Not accepted:

- production renderer/application;
- live public corpus;
- search indexing/ranking/citation lift;
- conversion/revenue lift;
- Zig/Wasm parity/performance;
- Cloudflare deployment, browser, accessibility, Core Web Vitals, and load behavior.

## Authority graph

```text
site-manifest.yaml
  |
  +-> vector-space axes + prototype sets
  +-> agent harness + publication gates
  +-> evidence + claims + information objects
  +-> semantic modules + page definitions
  +-> profiles: request-mirror / UI / geometry / field
  |
  v
reference/src/manifest.ts
  |
  +-> compiled hyper-vector space
  +-> vector-derived nearest neighbors/internal edges
  +-> SiteSource
  |
  v
reference/src/framework.ts
  |
  +-> PageIR
  +-> packed vectors + CSR graph
  +-> HTML + schema + sitemap + instructions
  |
  +-> reference/src/agent-harness.ts -> agent-context.json
  +-> reference/src/ui-scaffold.ts  -> ui-scaffold.json
  +-> reference/src/resolver.ts     -> finite resolver fixtures
  +-> reference/worker/             -> asset-first Worker scaffold
  +-> reference/zig/                -> scalar/SIMD source scaffold
```

There is no longer a separate five-slice architecture. The old Request Mirror candidates are manifest pages in the `request-mirror-lab` profile and pass through the same compiler.

## Current read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `AGENTS.md`
5. `README.md`
6. `16-unified-hypervector-manifest-agent-harness.md`
7. `site-manifest.yaml`
8. `reference/README.md`
9. `reference/UI-DESIGN-SYSTEM-HANDOFF.md`
10. `RESEARCH-NOTES-CURRENT.md`
11. newest file under `memory/`
12. historical numbered specifications when changing their domain

## First-class state

The durable state is:

```text
source/evidence
+ feature atoms
+ page prototype sets
+ compatibility-space vocabulary
+ semantic modules
+ graph/dependencies
+ profile/publication policy
```

HTML, instruction Markdown, sitemaps, UI scaffolds, and resolver artifacts are deterministic emissions.

## Agent-first rule

Agents receive the compiled space, current page neighborhoods, evidence inventory, uncovered-region hypothesis, design capabilities, and publication rules. They propose typed page additions. They do not write production HTML or create indexable routes directly.

## UI pass boundary

The first UI pass consumes the `ui-scaffold` profile. Its inputs are module kinds, layout roles, capability vectors, vector prototype IDs, variant axes, semantic content, and fixture routes.

The design system must be a satisfactory superset of these requirements. The renderer cannot alter vector geometry, evidence, page intent, graph edges, or publication state.

## Validation authority

- `04-feature-validation-vectors.md`
- `05-pass-fail-vectors.md`
- `12-compiler-design-and-autonomy-validation-addendum.md`
- `13-academic-and-normative-basis-for-validation-vectors.md`
- `15-hyper-targeted-search-distribution-workstreams.md`
- `16-unified-hypervector-manifest-agent-harness.md`
- `validation/reports/2026-07-17-hyper-targeted-production-pass.md`
- `validation/reports/2026-07-17-unified-manifest-ui-readiness.md`
- CI workflow `.github/workflows/website-framework-reference.yml`

## Immediate next code path

```text
unified manifest + CI pass
-> ingest supplied design system
-> derive and implement semantic renderer superset
-> browser/accessibility/metadata/JS-disabled validation
-> generate first hyper-aware agent page proposals
-> review 20–40 field candidates
-> publish matched cohorts only after explicit gate
-> measure indexing, compatible discovery, qualified pipeline, gross profit, and lifecycle return
```
