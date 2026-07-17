# CODEGRAPH.md — Adaptive Experience Compiler Map

Status: Phase 1 specification complete; Phase 2 implementation pending
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## Read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `AGENTS.md`
5. `README.md`
6. numbered specifications in order, including the canonical Phase 2 first-pass plan in `14-phase-2-experience-materialization-engine-plan.md`
7. `../../docs/amtech-website-rewrite-brief.md`
8. `../../docs/AMTECH_WEB_DESIGN_SYSTEM.md`
9. `../../docs/AMTECH_AGENTIC_GENERATIVE_WEB_DESIGN_ADDENDUM.md`

## What this software is

Primary category: **adaptive experience compiler and edge decisioning runtime**.

It compiles approved company knowledge, offers, proof, design grammar, routes, and experiment policy into a stable canonical website plus finite context-resolved experiences and channel artifacts.

It combines parts of:

- typed/headless content infrastructure;
- static-site and landing-page generation;
- adaptive hypermedia;
- feature-flag and experimentation systems;
- recommendation/decisioning engines;
- edge middleware/runtime;
- agentic and generative UI infrastructure;
- SEO knowledge graphs and structured-data compilers.

It is not a covert CDP, fingerprinting product, arbitrary AI page generator, ad cloaking system, OSINT identity-resolution pipeline, or replacement for human brand judgment.

## System graph

```text
COMPANY SOURCE LAYER
knowledge + offers + claims + evidence + entities + brand/design tokens
                     |
                     v
TYPED CONTENT IR
routes + questions + audiences + modules + CTAs + proof + visual grammar
                     |
          +----------+-----------+
          |                      |
          v                      v
CANONICAL COMPILER          VARIANT COMPILER
pages + metadata            finite slices + eligibility
schema + links              context facets + experiment IDs
          |                      |
          +----------+-----------+
                     v
BUILD ARTIFACTS
manifest + vectors + graph priors + checksums + structured data + channel outputs
                     |
                     v
EDGE RESOLVER / REQUEST MIRROR
allowlisted ephemeral context -> candidate coverage -> exact score -> policy gate
                     |
          +----------+-----------+
          |                      |
          v                      v
BASELINE A                 MATERIALIZED Z
complete canonical page    approved slice/layout/component selection
          |                      |
          +----------+-----------+
                     v
A/Z VALIDATION SUITE
relevance + effort + conversion + latency + privacy + SEO + accessibility + truth
```

## File map

### Orientation and authority

- `README.md`: mission, stack hypothesis, invariants, targets, phase state, and Phase 2 authority.
- `identity.md`: scoped mathematical, metaprogramming, quantum-boundary, and interaction-design operating identity.
- `AGENTS.md`: implementation and editing rules.
- `CODEGRAPH.md`: this structural map.

### Scientific and architecture foundation

- `00-scientific-and-feasibility-validation.md`: validated foundation, unsupported hypotheses, math, runtime/tool corrections.
- `01-system-architecture.md`: build-time/request-time/experiment-time architecture.
- `02-shape-model-and-hrr-core.md`: feature ontology, deterministic vectors, HRR core, candidate retrieval, graph and ABI.
- `03-agentic-seo-system.md`: canonical knowledge graph, specialized page policy, AI-answer/search constraints.

### Test, evidence, and release authority

- `04-feature-validation-vectors.md`: scenario-based validation matrix.
- `05-pass-fail-vectors.md`: quantitative P0/P1/P2 gates and graduation stages, with theory/academic/normative/engineering basis labels.
- `06-experimentation-privacy-operations.md`: A/Z causal design, privacy, telemetry, rollback, and operations.
- `12-compiler-design-and-autonomy-validation-addendum.md`: compiler, design, distributed-content, effort, autonomy, and coverage/replication gates.
- `13-academic-and-normative-basis-for-validation-vectors.md`: source ledger and threshold-evidence boundary.
- `validation/reports/2026-07-17-synthetic-persona-matrix.md`: generator execution, constraints, and output hash.

### v0.1 and execution

- `07-v0.1-request-mirror-lab.md`: transparent noindex diagnostic product.
- `08-implementation-plan.md`: original v0.1 Request Mirror build sequence and detailed component scaffold.
- `14-phase-2-experience-materialization-engine-plan.md`: canonical Phase 2 first-pass plan; prioritizes the deterministic materialization engine and defines five two-part workstreams with explicit validation/pass/fail vectors.
- `site-manifest.yaml`: machine-readable initial feature/candidate/fixture/headers/budget contract.
- `scripts/generate-synthetic-persona-matrix.mjs`: deterministic 100-entry synthetic benchmark generator.
- `fixtures/synthetic-persona-matrix.toon`: reproducible generated output when materialized; never hand-edit and do not require committing it while the validation report records its hash.

### Phase synthesis and product definition

- `09-phase-1-synthesis-competitive-and-systems-positioning.md`: scientific synthesis, Orkas positioning, commitment elasticity, autonomous-company hypothesis, and Phase 1 exit.
- `10-software-category-and-commercial-use-cases.md`: product category, modules, buyers, and real company workflows.
- `11-hyper-distributed-content-generative-ui-and-design-collaboration.md`: multi-channel content fabric, compiler IR, graphic-design contract, and agentic/generative UI rules.
- `HANDOFF-LANDING-PAGES.md`: minimal next-session prompt for producing page families.
- `RESEARCH-NOTES-2026-07-17.md`: evidence ledger, narrowed assumptions, open questions, and negative results.

### External design/product authority

- `../../docs/amtech-website-rewrite-brief.md`: AMTECH website offer, category, narrative, page and copy strategy.
- `../../docs/AMTECH_WEB_DESIGN_SYSTEM.md`: canonical visual system.
- `../../docs/AMTECH_WEB_DESIGN_SYSTEM_IMPLEMENTATION.md`: surface status and implementation tracking.
- `../../docs/AMTECH_AGENTIC_GENERATIVE_WEB_DESIGN_ADDENDUM.md`: agentic interaction, generative UI, designer/compiler handshake, and landing-page grammar.

## Intermediate representation

The compiler IR should eventually expose at least:

```ts
interface ExperienceModule {
  id: string;
  type: "hero" | "proof" | "workflow" | "objection" | "comparison" | "cta" | "agentic_action";
  routeIds: string[];
  audienceFacets: string[];
  intentFacets: string[];
  offerIds: string[];
  claims: ClaimRef[];
  evidenceCeiling: EvidenceLevel;
  visualVariantIds: string[];
  interactionVariantIds: string[];
  allowedChannels: ChannelId[];
  eligibility: EligibilityRule;
  fallbackId?: string;
}
```

The IR, not any vendor package, is the durable contract.

The Phase 2 materialization plan extends the runtime shape contract into five explicit views:

```text
HRR hypervector
+ low-dimensional auditable facet point
+ graph/hypergraph relationship state
+ hard eligibility state
+ provenance/confidence state
```

High-dimensional convex hulls, graph transport, spectral partitions, and point-set distances are offline benchmark arms until they beat the exact simpler controls.

## Runtime invariants

- no arbitrary copy generation in the default edge path;
- no dynamic symbol creation;
- no remote database call in the default hot path;
- no browser fingerprint or named-person profile;
- no covert cross-site identity resolution or OSINT enrichment of arbitrary visitors;
- raw Google/Bing/Reddit/search/place/history data cannot enter request-time artifacts;
- canonical baseline always available;
- signed/bounded variant IDs only;
- evidence and CTA eligibility are hard gates;
- failure returns baseline;
- exact scan remains the first benchmark;
- candidate clustering must measure coverage versus replication;
- external experimentation platforms cannot become a page-availability dependency.

## Phase state

### Complete

- research/specification packet;
- privacy and SEO boundary;
- TypeScript-first/Zig-second architecture;
- v0.1 Request Mirror definition;
- finite-slice and deterministic-artifact model;
- A/Z causal framework;
- deterministic synthetic benchmark generator;
- local generator execution and independent constraint/hash validation record;
- software category and design/content operating model;
- academic/normative evidence map and revised pass/fail gates;
- canonical Phase 2 first-pass execution plan.

### Not complete

- TypeScript HRR reference implementation;
- compiler/content IR implementation;
- two real compiled AMTECH landing-page families;
- flat exact resolver benchmark;
- candidate coverage/replication benchmark;
- consented context observability implementation;
- Worker Request Mirror app;
- Zig/WASM implementation;
- Cloudflare deployment;
- Next.js integration;
- browser/accessibility/load/SEO testing;
- conversion or autonomy evidence.

## Editing map

- Change math or feature encoding -> update `00`, `02`, `04`, `05`, `13`, `14`, `site-manifest.yaml`, fixtures, and research notes.
- Change architecture/runtime -> update `01`, `07`, `08`, `14`, `CODEGRAPH.md`, validation vectors, and notes.
- Change privacy/experiments -> update `06`, `04`, `05`, `14`, manifest, and notes.
- Change page/content/design model -> update `03`, `10`, `11`, `12`, `14`, design addendum, and handoff.
- Change canonical AMTECH offer/product truth -> update root CODEGRAPH, rewrite brief, GTM authority, manifest candidates, truth gates, and compiled page fixtures.
- Add implementation -> update phase state, scripts/tests, research notes, and record the exact validation run.

## Next code path

```text
1A materialize fixture + implement deterministic TypeScript kernel
-> 1B formalize typed multi-view shape + benchmark correspondence arms
-> 2A implement owned content/design IR and deterministic compiler
-> 2B compile two real AMTECH landing-page families
-> 3A implement flat exact resolver and hard policy/confidence gate
-> 3B quantify candidate coverage/replication frontier
-> 5A implement consented context mirror and source ablation fixtures
-> 4A deploy noindex Worker in shadow/baseline-only mode
-> 4B compare Zig scalar/SIMD and integrate signed finite variants with Next.js
-> 5B add OpenFeature boundary and optional GrowthBook adapter
```

The older v0.1 scaffold in `08-implementation-plan.md` remains useful implementation detail, but `14-phase-2-experience-materialization-engine-plan.md` controls first-pass priority and acceptance boundaries.
