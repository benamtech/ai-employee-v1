# Hyper-Targeted Search-Distribution Framework

Status: vector-native research compiler and deterministic UI scaffold; agent orchestration, generation-job compiler, proposal relevance, and field acceptance pending
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
  -> propose finite page corpus -> compile PageGenerationJobs
  -> write content + build utilities/tasks + generate SEO/graph/UI state
  -> compile -> validate -> repair -> preview -> emit -> measure
        |
        v
complete website
  hundreds or thousands of stable, evidence-bounded, hyper-targeted pages
  + optional bounded public AI Employee utilities
```

The coding agent is integral twice:

1. **at project formation**, where it converts messy business/brand truth into governed source, context, ontology, vector, and corpus state; and
2. **during page generation**, where it executes vector-derived generation jobs to research, write, build utilities, compose UI, create graph relationships, criticize, and repair every page.

The vector system does not replace the agent. It gives the agent a mathematically mapped and validated page program.

The user should not hand-author the manifest, page matrix, prototypes, semantic modules, generation jobs, or renderer plans. `site-manifest.yaml` is compiled project state and corpus authority generated and maintained by the agent under deterministic validation.

Canonical operating documents:

- `20-agent-operated-vector-site-generation-and-wasm.md` — product and execution model;
- `21-vector-to-generation-job-compiler.md` — bridge from accepted vectors to actual page-writing/building agents;
- `22-agent-operated-framework-workflow-validation-matrix.md` — feature-, workflow-, algorithm-, UX-, UI-, runtime-, and publication-level validation/pass/fail authority.

## Expected user and developer workflow

The internal system is complex, but operation must remain as legible as a modern framework lifecycle:

```text
init -> inspect/doctor -> research -> plan -> generate -> dev/preview
-> validate -> build -> publish -> measure
```

The phases may be implemented as CLI commands, agent skills, scripts, or a combination. A user should always see current state, assumptions, candidate/accepted/rejected pages, evidence gaps, generation progress, validation failures, preview changes, publication scope, and rollback options.

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
- source/evidence/asset intake and contradiction workflow;
- independently governed context/demand corpus;
- candidate coordinate compiler;
- `PageGenerationJob` compiler and agent-pass runner;
- preview/review UX expected of a framework;
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

The possible combinations of prospect context, service, problem, role, stage, location, integration, constraint, proof requirement, topic, utility, and offer are much larger than the number of pages a site should publish.

The vector information space is used to:

1. represent coherent prospect situations and page compatibility regions;
2. combine many attributes that conventional keyword maps keep separate;
3. measure what the existing corpus already covers;
4. identify uncovered but supported regions;
5. reject redundant, noisy, stereotyped, thin, or prohibited combinations;
6. select a finite maintainable page corpus;
7. compile each accepted coordinate into a bounded page-generation job;
8. provide page-specific context to content, utility, SEO, graph, and UI agents;
9. preserve geometry through final emissions and measurement.

The objective is not maximum page count. It is maximum useful context coverage per maintainable canonical node.

A coordinate may contain attributes such as occupation, property status, household/life-stage constraints, pets, interests, location, schedule, software environment, task, risk, and desired outcome. An attribute belongs only when it materially changes useful content, utility, proof, workflow, interaction, or conversion. Protected/sensitive targeting, private history, named-person profiling, and unsupported stereotypes are prohibited.

## How vectors become pages

```text
ProspectContextPrototypeSet
× Intent
× ServiceOrOffer
× TopicOrProblem
× WorkflowOrIntegration
× InformationOrUtilityObject
× EvidenceBoundary
× DesiredOutcome
× ConversionPath
        |
        v
candidate PageCoordinate
        |
        v
eligibility + relevance + distinctness + coverage + cost selection
        |
        v
accepted PageGenerationJob
        |
        v
agent research/content/utility/SEO/UI/critic/repair passes
        |
        v
semantic project state -> SiteSource -> PageIR -> emissions
```

One page may serve multiple prototypes when the answer, utility, proof, and conversion path are materially the same. One prototype may create multiple pages when intent or information objects are genuinely different. The optimizer decides split versus consolidation; it must not emit the Cartesian product.

## Why Wasm may exist

Wasm is a candidate execution substrate for repeated data-parallel vector work across large agent generation and repair loops, not a requirement for serving pages.

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

Native Zig may be fastest inside a local coding-agent environment. Wasm's architectural value is a portable, sandboxed, deterministic kernel across CI, agent sandboxes, browsers, and compatible edge runtimes. It is retained only after realistic end-to-end benchmarks including startup, memory copying, serialization, binary size, and complete agent-loop wall time.

Canonical pages remain complete static assets. Wasm must not be required for HTML delivery.

## Single authority

`site-manifest.yaml` controls the current compiled corpus state:

- vector namespace, symbol version, dimensions, axes, and link policy;
- proposal coverage policy and publication gates;
- evidence, claims, information objects, modules, pages, and prototypes;
- Request Mirror, UI, geometry, and field profiles;
- current noindex state.

It is generated/maintained by the agent from earlier-stage project authorities. It is not the product's manual entry form.

HTML, schema, sitemaps, instruction projections, UI plans, agent context, generation prompts, and packed artifacts are emissions.

## Framework model

Read `18-vector-node-path-web-framework-model.md`.

```text
publication plane
  independent contexts + vector chunks -> candidate stable nodes
  -> coverage/distinctness/evidence review -> generation jobs -> canonical emissions

navigation plane
  stable nodes + typed semantic edges -> useful prospect/agent paths

interaction plane
  complete canonical page + explicit task
  -> secure controls + streamed employee work
  -> typed artifact + approval/proof
```

A vector chunk is a reusable situation, not a hidden person profile. Build-time cohort materialization is the core search-distribution mode. Optional visitor-time adaptation is finite, noncanonical, consented, low-risk, and may not change primary truth, evidence, pricing, limitations, or canonical intent.

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

The current compiler begins late in the intended product lifecycle. The missing orchestration spine is:

```text
ProjectInput + ledgers
-> independent ContextCorpus
-> ontology/vector space
-> CandidatePageCoordinates
-> SelectedCorpusPlan
-> PageGenerationJobs
-> agent-generated semantic/utility/UI/task state
-> current manifest/compiler path
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

A page such as “create a painting estimate with AI” should combine complete static content with a bounded task, secure controls, session streaming, typed output, approval/proof, fallback, and Start Free transition. The page-generation job may produce both the static page and the page-specific task contract. A shared generic chatbot with noun-swapped copy is not distinct page utility.

## Validation model

Every major feature and phase must expose:

```text
purpose/effect
user-visible contract
developer/agent contract
simpler baseline
validation vector
pass vector
fail vector
current state and proof
```

`22-agent-operated-framework-workflow-validation-matrix.md` is the cross-cutting authority for:

- agent interface and project intake;
- independent context research;
- ontology/vector identity and prototypes;
- candidate generation, ranking, facility location, and CSI;
- generation jobs and specialized agent passes;
- content/evidence/graph/public-task/UI generation;
- browser, R3F, Wasm, deterministic compilation, and preview;
- developer/user experience;
- publication, measurement, and memory.

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

This does not include agent orchestration, generation jobs, browser/accessibility, Zig/Wasm, Cloudflare, search, or commercial proof.

## Current commands

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

These are research-package commands, not yet the target framework operator experience.

## Target operator commands or equivalent agent skills

```text
framework init
framework doctor
framework research
framework plan
framework generate
framework dev
framework validate
framework build
framework publish
framework measure
```

## Read order

1. root/scoped `identity.md`, `AGENTS.md`, and `CODEGRAPH.md`;
2. this README;
3. `memory/MEMORY.md`;
4. newest immutable memory handoff;
5. `20-agent-operated-vector-site-generation-and-wasm.md`;
6. `21-vector-to-generation-job-compiler.md`;
7. `22-agent-operated-framework-workflow-validation-matrix.md`;
8. `18-vector-node-path-web-framework-model.md`;
9. `19-vector-native-corrections-and-csi-validation.md`;
10. comprehensive review and newest proof reports;
11. `site-manifest.yaml`;
12. `reference/README.md` and UI handoff;
13. older numbered specifications for their domain.

## Research floor

- Context relevance: https://arxiv.org/abs/2309.05113
- HDC/VSA applications: https://arxiv.org/abs/2112.15424
- Complement-aware batch selection: https://arxiv.org/abs/2605.24779
- WebAssembly core/SIMD: https://www.w3.org/TR/wasm-core/
- Cloudflare Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- R3F scaling: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Vite workflow: https://vite.dev/guide/
- Next.js workflow: https://nextjs.org/docs/app/getting-started/installation
- Astro workflow: https://docs.astro.build/en/install-and-setup/
- Playwright user-facing testing: https://playwright.dev/docs/best-practices
- Google AI content guidance: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google AI-search guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

These justify evaluation designs, execution options, expected framework ergonomics, and external constraints—not ranking or commercial claims.

## Immediate path

```text
ProjectInput/source/asset/evidence intake contracts
-> independent ContextCorpus and frozen split contracts
-> P0 primary-prototype semantics
-> P0 calibrated compatibility
-> P0 typed graph edges/node paths
-> candidate coordinate compiler and staged funnel
-> PageGenerationJob compiler
-> agent pass runner/checkpoints/repair loop
-> preview/review framework UX
-> TS vs Zig native vs Wasm scalar/SIMD benchmark harness
-> public employee task-surface contract
-> first 20–40 noindex agent-generated pages
-> browser/accessibility/performance validation
-> separate matched field publication
```

Green source CI is necessary but insufficient for page generation or publication.