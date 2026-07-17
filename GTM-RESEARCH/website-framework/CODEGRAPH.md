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
6. numbered specifications in order
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

It is not a covert CDP, fingerprinting product, arbitrary AI page generator, ad cloaking system, or replacement for human brand judgment.

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

- `README.md`: mission, stack hypothesis, invariants, targets, and phase state.
- `identity.md`: scoped mathematical, metaprogramming, quantum-boundary, and interaction-design operating identity.
- `AGENTS.md`: implementation and editing rules.
- `CODEGRAPH.md`: this structural map.

### Scientific and architecture foundation

- `00-scientific-and-feasibility-validation.md`: validated foundation, unsupported hypotheses, math, runtime/tool corrections.
- `01-system-architecture.md`: build-time/request-time/experiment-time architecture.
- `02-shape-model-and-hrr-core.md`: feature ontology, deterministic vectors, HRR core, candidate retrieval, graph and ABI.
- `03-agentic-seo-system.md`: canonical knowledge graph, specialized page policy, AI-answer/search constraints.

### Test and release authority

- `04-feature-validation-vectors.md`: scenario-based validation matrix.
- `05-pass-fail-vectors.md`: quantitative P0/P1/P2 gates and graduation stages.
- `06-experimentation-privacy-operations.md`: A/Z causal design, privacy, telemetry, rollback, and operations.
- `12-compiler-design-and-autonomy-validation-addendum.md`: compiler, design, distributed-content, effort, autonomy, and coverage/replication gates.

### v0.1 and execution

- `07-v0.1-request-mirror-lab.md`: transparent noindex diagnostic product.
- `08-implementation-plan.md`: Phase 2 build sequence.
- `site-manifest.yaml`: machine-readable initial feature/candidate/fixture/headers/budget contract.
- `scripts/generate-synthetic-persona-matrix.mjs`: deterministic 100-entry synthetic benchmark generator.
- `fixtures/synthetic-persona-matrix.toon`: generated benchmark output when materialized; never hand-edit.

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

## Runtime invariants

- no arbitrary copy generation in the default edge path;
- no dynamic symbol creation;
- no remote database call in the default hot path;
- no browser fingerprint or named-person profile;
- canonical baseline always available;
- signed/bounded variant IDs only;
- evidence and CTA eligibility are hard gates;
- failure returns baseline;
- exact scan remains the first benchmark;
- candidate clustering must measure coverage versus replication.

## Phase state

### Complete

- research/specification packet;
- privacy and SEO boundary;
- TypeScript-first/Zig-second architecture;
- v0.1 Request Mirror definition;
- finite-slice and deterministic-artifact model;
- A/Z causal framework;
- synthetic benchmark generator;
- software category and design/content operating model.

### Not complete

- generated fixture committed from a verified run;
- TypeScript HRR reference implementation;
- compiler/content IR implementation;
- Worker Request Mirror app;
- Zig/WASM implementation;
- Cloudflare deployment;
- Next.js integration;
- actual landing-page compiler;
- browser/accessibility/load/SEO testing;
- conversion or autonomy evidence.

## Editing map

- Change math or feature encoding -> update `00`, `02`, `04`, `05`, `site-manifest.yaml`, fixtures, and research notes.
- Change architecture/runtime -> update `01`, `07`, `08`, `CODEGRAPH.md`, validation vectors, and notes.
- Change privacy/experiments -> update `06`, `04`, `05`, manifest, and notes.
- Change page/content/design model -> update `03`, `10`, `11`, design addendum, compiler validation addendum, and handoff.
- Change canonical AMTECH offer/product truth -> update root CODEGRAPH, rewrite brief, GTM authority, manifest candidates, and truth gates.
- Add implementation -> update phase state, scripts/tests, research notes, and record exact validation run.

## Next code path

```text
run 100-slice generator
-> validate output and constraints
-> implement TypeScript deterministic vectors/HRR
-> build typed content IR/compiler skeleton
-> benchmark flat rules/facets/HRR
-> quantify candidate coverage/replication
-> implement noindex Worker baseline
-> add shadow-only resolver diagnostics
-> consider Zig/WASM after correctness and performance evidence
```
