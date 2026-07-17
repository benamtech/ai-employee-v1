# Hyper-Targeted Search-Distribution Framework

Status: vector-native research compiler and deterministic UI scaffold; field acceptance pending
Updated: 2026-07-17

## Current reality

The repository now contains a TypeScript research package for:

- deterministic HDC/VSA/HRR feature composition;
- namespaced and symbol-versioned vector identity;
- one unified declarative manifest;
- typed evidence, claims, information objects, semantic modules, pages, and prototype sets;
- preservation of every declared page prototype through `CompiledHyperVectorSpace`, `SiteSource`, `PageIR`, and packed prototype vectors;
- one explicit primary-vector alias per page for compatibility with current resolver interfaces;
- deterministic broad vector-space and site hashes under source collection reordering;
- computed facility-location-style marginal coverage for agent proposal admission;
- duplicate/cannibalization rejection using existing-page prototype similarity;
- Complement Submodular Information facility-location controls for batch balance and outlier rejection;
- deterministic neutral and AMTECH static HTML/CSS emissions;
- source-level browser/CSS/UI validation;
- optional noncanonical R3F visualization;
- synthetic scale tests through 2,000 fixtures;
- scaffolds for Zig/Wasm, Cloudflare, search cohorts, and conversion metrics.

It does not yet contain or prove:

- typed semantic prospect-path edges;
- an independently judged external context-relevance benchmark;
- a first-class public AI Employee task-surface contract;
- production browser/accessibility/Core Web Vitals acceptance;
- a live indexed 200–2,000-page corpus;
- production Cloudflare or Zig/Wasm proof;
- real search-distribution, conversion, or revenue lift.

Synthetic scale and source tests prove compiler behavior only. They do not prove that candidate pages deserve canonical URLs or will populate useful search results.

## Single authority

`site-manifest.yaml` is the unified declarative corpus authority.

It contains:

- vector-space namespace, symbol version, dimensions, axes, and link policy;
- agent-generation rules, computed-coverage thresholds, and publication gates;
- evidence, claims, information objects, and semantic modules;
- page feature atoms and prototype sets;
- Request Mirror, UI-scaffold, geometry-fixture, and field-candidate profiles;
- current noindex publication state.

The old five-slice Request Mirror is a noindex profile inside the same compiler.

## Correct architecture model

Read `18-vector-node-path-web-framework-model.md` before creating pages.

The framework has three separate planes:

```text
1. publication plane
   approved source + demand evidence
   -> explicit context cases and vector chunks
   -> candidate canonical nodes
   -> computed coverage/distinctness gate
   -> reviewed stable pages

2. navigation plane
   canonical node + typed graph relationships
   -> next useful question, workflow, proof, integration, or offer node

3. interaction plane
   complete canonical page
   -> explicit user task
   -> secure controls + streamed employee work
   -> typed artifact + approval/proof
```

A vector chunk represents a reusable situation, not a hidden individual profile. A node is a stable canonical URL. A node path is a useful semantic transition. A public AI Employee is an explicit-session task surface attached to a node, not a dynamically generated SEO URL.

## Current compiled pipeline

```text
approved source and research
-> manifest feature atoms and page prototype sets
-> namespace/version-bound HRR symbols
-> CompiledHyperVectorSpace
-> vector-neighbor suggestions
-> evidence-bounded semantic modules
-> SiteSource with all prototypes
-> PageIR with all prototypes
-> packed prototype offsets/IDs/vectors + primary-vector alias + CSR page IDs
-> neutral/UI HTML, schema, sitemap, instruction, scaffold, and agent-context emissions
```

All declared prototypes are retained. The current compatibility alias still chooses one canonicalized prototype as the primary page vector. Explicit primary-prototype declaration is a remaining schema clarification before field publication; multi-prototype retrieval must use the packed prototype arrays rather than the alias.

## Agent boundary

Agents submit noindex `AgentPageProposal` objects with:

- target atoms and page geometry;
- explicit sourced coverage contexts;
- canonical question;
- marginal-coverage hypothesis;
- distinct information object;
- evidence and claim bindings;
- semantic modules;
- graph/link rationale;
- design capabilities;
- generation provenance.

Admission now computes:

- baseline weighted context coverage by the current corpus;
- proposed weighted context coverage;
- normalized marginal gain;
- count of improved context cases;
- maximum similarity to an existing page;
- CSI singleton information as a diagnostic only.

The proposal fails when computed marginal gain or improving-context count is below policy, or when an existing page is too similar. CSI is not used as the single-page gate; it is a batch-selection and validation-split comparison arm.

## Public AI Employee relationship

Canonical product and interaction authority lives in:

- `../../mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md`
- `../../mvp-build/docs/public-interaction-standard.md`
- `../../mvp-build/docs/ux/05-generative-ui-frontier.md`

Pages such as “how to create an estimate with AI” or “how to use AI with QuickBooks” should eventually combine:

- complete static search-safe content;
- a bounded public task;
- secure deterministic controls for secrets or risky data;
- session-level streaming states;
- a typed artifact;
- approval and proof where needed;
- a natural Start Free transition.

That task-surface contract is not implemented in this package yet.

## Validation proof

Exact validated head before this documentation sync: `9ef48b97308e09d5a97f4978820255e3c8b53c7e`.

GitHub Actions run `29576487817` passed:

- clean install and strict TypeScript build;
- `22/22` Node tests;
- unified manifest emission;
- deterministic UI emission;
- browser target resolution;
- pinned React/R3F/Three.js build;
- diagnostic and emission artifact upload.

Current emitted manifest facts:

```text
pages: 6
indexable pages: 0
prototypes: 7
vector namespace: amtech-hyper-site-v1
symbol version: 1
build hash: ae16957209827c1fbbc295992ab0aceeaf648b250521b03695b4f663cf6d241a
vector-space hash: 934ac02b434b0d583c131a15bbff79492ea8e27ca13a5ea2d07367b4fa8b6978
```

The proof covers source behavior, not browser visual/accessibility or field search outcomes.

## Commands

```bash
cd GTM-RESEARCH/website-framework/reference
npm install
npm test
npm run manifest:emit
npm run ui:emit
npm run browser:check
npm run ui:r3f:build
npm run benchmark:scale
```

## Read order

1. root and scoped `identity.md`, `AGENTS.md`, and `CODEGRAPH.md`;
2. this README;
3. `memory/MEMORY.md`;
4. `18-vector-node-path-web-framework-model.md`;
5. `19-vector-native-corrections-and-csi-validation.md`;
6. newest report under `validation/reports/`;
7. `16-unified-hypervector-manifest-agent-harness.md`;
8. `site-manifest.yaml`;
9. `17-agentic-ui-metaprogramming-standard.md`;
10. `reference/README.md` and UI handoff;
11. historical numbered specifications for their domains.

## External research floor

Context-document compatibility baseline:

https://arxiv.org/abs/2309.05113

HDC/VSA applications survey:

https://arxiv.org/abs/2112.15424

Complement-aware batch selection preprint:

https://arxiv.org/abs/2605.24779

The first paper supports separately evaluating query-document and explicit context-document relevance with graded labels. The HDC/VSA literature supports compositional distributed representations. CSI supports a research arm for balanced batch selection across latent head/tail structure while suppressing isolated outliers. None validates SEO lift, automatic corpus quality, UI quality, or revenue.

## Immediate next path

```text
passing vector-native source/compiler gate
-> formalize explicit primary-prototype schema and typed graph-edge semantics
-> build independently judged train/validation/test context collections
-> compare lexical, learned semantic, facets, graph, HRR, hybrid, facility-location, and CSI arms
-> define the public task-surface boundary against existing product standards
-> browser/accessibility/metadata/JS-disabled validation
-> generate the first noindex hyper-aware proposals
-> review 20–40 field candidates
-> publish matched cohorts through explicit gate
-> measure indexing, compatible discovery, qualified pipeline, gross profit, and lifecycle return
```

Green source CI is necessary but insufficient for proposal publication.