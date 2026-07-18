# Hyper-Targeted Search-Distribution Framework

Status: vector-native research compiler and deterministic UI scaffold; agent orchestration, proposal relevance, and field acceptance pending
Updated: 2026-07-17

## Product interface

This framework is intended to be operated by a repository-aware coding agent such as Codex, Claude Code, Pi, or an equivalent agentic developer.

```text
user supplies
  business/purpose + offers/services + audiences/locations + workflows/integrations
  + proof/constraints + brand/assets/style + repository/deployment goals
        |
        v
agentic developer
  inspect -> normalize -> research -> construct context/vector space
  -> propose finite page corpus -> generate typed content/UI/task contracts
  -> compile -> validate -> repair -> emit -> measure
        |
        v
complete website
  hundreds or thousands of stable, evidence-bounded, hyper-targeted pages
  + optional bounded public AI Employee utilities
```

The user should not hand-author the manifest, page matrix, prototypes, semantic modules, or renderer plans. `site-manifest.yaml` is compiled project state and corpus authority generated and maintained by the agent under deterministic validation.

Read `20-agent-operated-vector-site-generation-and-wasm.md` for the canonical usage and execution model.

## Current reality

Implemented and source-tested:

- one unified declarative manifest;
- namespaced and symbol-versioned HRR/VSA symbols;
- typed evidence, claims, information objects, semantic modules, pages, and prototype sets;
- every declared prototype preserved through `CompiledHyperVectorSpace`, `SiteSource`, `PageIR`, packed offsets/IDs/vectors, and agent context;
- deterministic broad vector-space/site hashes under source collection reordering;
- mechanically computed current-versus-proposed context coverage;
- duplicate-similarity rejection;
- Facility Location Complement Information as a batch/split research arm;
- deterministic neutral and AMTECH static HTML/CSS emissions;
- Tier-2 browser/CSS source checks and optional noncanonical R3F build;
- synthetic scale fixtures through 2,000 pages;
- scaffolds for Zig/Wasm, Cloudflare, resolver, field cohorts, and conversion metrics.

Not implemented or accepted:

- the agent-facing `ProjectInput -> generated manifest` orchestration layer;
- explicit primary-prototype semantics in the manifest;
- calibrated/independently judged proposal relevance;
- typed semantic prospect-path edges;
- public AI Employee task-surface IR;
- production-safe resolver/Worker/Wasm/distribution paths;
- browser visual/accessibility/Core Web Vitals acceptance;
- a reviewed indexed 200–2,000-page corpus;
- real search, citation, conversion, gross-profit, or revenue lift.

Synthetic scale and green source CI prove compiler behavior only.

## Why the vector system exists

The possible combinations of service, problem, role, stage, location, integration, constraint, proof requirement, and offer are much larger than the number of pages a site should publish.

The vector information space is used to:

1. represent coherent prospect situations and page compatibility regions;
2. measure what the existing corpus already covers;
3. identify uncovered but supported regions;
4. reject redundant, noisy, thin, or prohibited combinations;
5. select a finite maintainable page corpus;
6. generate bounded context packets for content and UI agents;
7. preserve geometry through final emissions and measurement.

The objective is not maximum page count. It is maximum useful context coverage per maintainable canonical node.

## Why Wasm may exist

Wasm is a candidate execution substrate for repeated data-parallel vector work, not a requirement for serving pages.

Strong candidate kernels:

- binding, superposition, normalization, and dot products;
- multi-prototype context/page scoring and top-k;
- duplicate/cannibalization matrices;
- facility-location and CSI marginal calculations;
- clustering, validation sweeps, and packed-vector parity.

Recommended controls:

```text
TypeScript typed-array oracle
Zig native CLI
Zig Wasm scalar
Zig Wasm SIMD
```

Native Zig may be fastest inside a local coding-agent environment. Wasm's architectural value is a portable, sandboxed, deterministic kernel across CI, agent sandboxes, browsers, and compatible edge runtimes. It is retained only after realistic end-to-end benchmarks.

Canonical pages remain complete static assets. Wasm must not be required for HTML delivery.

## Single authority

`site-manifest.yaml` controls:

- vector namespace, symbol version, dimensions, axes, and link policy;
- proposal coverage policy and publication gates;
- evidence, claims, information objects, modules, pages, and prototypes;
- Request Mirror, UI, geometry, and field profiles;
- current noindex state.

HTML, schema, sitemaps, instruction projections, UI plans, agent context, and packed artifacts are emissions.

## Framework model

Read `18-vector-node-path-web-framework-model.md`.

```text
publication plane
  independent contexts + vector chunks -> candidate stable nodes
  -> coverage/distinctness/evidence review -> canonical page emissions

navigation plane
  stable nodes + typed semantic edges -> useful prospect/agent paths

interaction plane
  complete canonical page + explicit task
  -> secure controls + streamed employee work
  -> typed artifact + approval/proof
```

A vector chunk is a reusable situation, not a hidden person profile. Hyper-targeting should use non-sensitive prospect context such as industry, task, stage, integration, constraint, and location—not protected traits or covert identity inference.

## Current compiler path

```text
site-manifest.yaml
-> namespace/version-bound symbols
-> all-prototype CompiledHyperVectorSpace
-> untyped vector-neighbor suggestions
-> evidence-bounded modules
-> SiteSource with all prototypes
-> PageIR with all prototypes
-> packed prototype offsets/IDs/vectors + primary alias + CSR page IDs
-> static/UI/agent emissions
```

### Primary alias limitation

All prototypes survive. The legacy `pageVectors` alias still uses one ordered prototype. The manifest does not yet declare `primary_prototype_id`; authoritative multi-region retrieval must use packed prototype arrays.

### Proposal coverage limitation

Admission computes baseline and proposed weighted context coverage, improving contexts, and existing-page similarity. This closes the prose-only defect mechanically.

It is not yet an external relevance gate because:

- proposal agents can supply their own context cases;
- `relevance_label` is not yet used;
- shifted cosine gives orthogonal vectors approximately `0.5` coverage;
- thresholds are uncalibrated;
- no independent graded train/validation/test collection exists.

No real content cohort should be generated from this gate alone.

### CSI boundary

CSI is a batch-selection and train/validation/test splitting arm for preserving coherent head/tail structure while suppressing isolated noise. It is not the single-page admission oracle and remains based on a new 2026 preprint.

## Public AI Employee relationship

Product/interaction authority:

- `../../mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md`
- `../../mvp-build/docs/public-interaction-standard.md`
- `../../mvp-build/docs/ux/05-generative-ui-frontier.md`

A page such as “create a painting estimate with AI” should combine complete static content with a bounded task, secure controls, session streaming, typed output, approval/proof, fallback, and Start Free transition. A shared generic chatbot with noun-swapped copy is not distinct page utility.

## Exact source proof

Validated code head: `9ef48b97308e09d5a97f4978820255e3c8b53c7e`

Workflow run: `29576487817`

```text
strict TypeScript build: pass
Node tests: 22/22
manifest emission: pass
UI emission: pass
browser resolution: pass
R3F build: pass
pages: 6
indexable pages: 0
packed prototypes: 7
namespace: amtech-hyper-site-v1
symbol version: 1
build hash: ae16957209827c1fbbc295992ab0aceeaf648b250521b03695b4f663cf6d241a
space hash: 934ac02b434b0d583c131a15bbff79492ea8e27ca13a5ea2d07367b4fa8b6978
```

This does not include browser/accessibility, Zig/Wasm, Cloudflare, search, or commercial proof.

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

1. root/scoped `identity.md`, `AGENTS.md`, and `CODEGRAPH.md`;
2. this README;
3. `memory/MEMORY.md`;
4. newest immutable memory handoff;
5. `20-agent-operated-vector-site-generation-and-wasm.md`;
6. `18-vector-node-path-web-framework-model.md`;
7. `19-vector-native-corrections-and-csi-validation.md`;
8. comprehensive review and newest proof reports;
9. `site-manifest.yaml`;
10. `reference/README.md` and UI handoff;
11. older numbered specifications for their domain.

## Research floor

- Context relevance: https://arxiv.org/abs/2309.05113
- HDC/VSA applications: https://arxiv.org/abs/2112.15424
- Complement-aware batch selection: https://arxiv.org/abs/2605.24779
- WebAssembly core/SIMD: https://www.w3.org/TR/wasm-core/
- Cloudflare Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- Google AI content guidance: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google AI-search guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

These justify evaluation designs, execution options, and external constraints—not ranking or commercial claims.

## Immediate path

```text
ProjectInput/source/asset/evidence intake contracts
-> agent orchestration and checkpoint lifecycle
-> P0 primary-prototype semantics
-> P0 calibrated compatibility + independent graded context corpus
-> P0 typed graph edges/node paths
-> TS vs Zig native vs Wasm scalar/SIMD benchmark harness
-> candidate funnel + facility-location/CSI corpus optimizer
-> bounded content-generation and repair loop
-> public employee task-surface contract
-> first 20–40 noindex agent-generated pages
-> browser/accessibility/performance validation
-> separate matched field publication
```

Green source CI is necessary but insufficient for proposal generation or publication.