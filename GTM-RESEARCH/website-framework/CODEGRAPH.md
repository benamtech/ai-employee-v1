# CODEGRAPH.md — Agent-Operated Vector-Native Website Generation Compiler

Status: vector-native research compiler/UI scaffold; agent orchestration, generation jobs, relevance, runtime, and field acceptance pending
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## Product reality

The intended product is not a manifest editor or a hand-authored static-site generator. It is a website generation compiler operated by a repository-aware coding agent.

The agent is integral at both ends of the pipeline:

```text
user business + brand + assets + sources + goals
        |
        v
agent project formation [target; not implemented]
  inspect/normalize/research
  -> source/evidence/asset ledgers
  -> independent context corpus
  -> ontology + candidate page coordinates
  -> selected corpus plan
        |
        v
vector-to-generation job compiler [specified; not implemented]
  accepted vectors/coordinates
  -> PageGenerationJobs
        |
        v
agent page generation [target; not implemented]
  research + concept + content + utility/task
  + SEO/graph + UI + critic + repair passes
        |
        v
current vector-native compiler [source-wired]
  manifest -> SiteSource -> PageIR -> packed artifacts -> emissions
        |
        v
complete static site + optional bounded public AI Employee utilities
```

The user should not need to hand-author `site-manifest.yaml`. The agent generates and maintains it as the single compiled-project/corpus authority.

Canonical authorities:

- `20-agent-operated-vector-site-generation-and-wasm.md`
- `21-vector-to-generation-job-compiler.md`
- `22-agent-operated-framework-workflow-validation-matrix.md`

## Expected framework operation

Internally complex; externally legible:

```text
init -> inspect/doctor -> research -> plan -> generate -> dev/preview
-> validate -> build -> publish -> measure
```

The implementation may use CLI commands, agent skills, scripts, or adapters, but each phase requires typed state, resumability, machine-readable failures, human-readable plans, and explicit publication boundaries.

## Source-wired and CI-proven

- namespace/version-bound HRR/VSA symbols;
- unified manifest and noindex proposal schema;
- all prototypes through geometry, `SiteSource`, `PageIR`, packed offsets/IDs/vectors, agent context, and UI inputs;
- source-order-stable broad vector-space/site hashes;
- mechanical current-versus-proposed coverage and duplicate fixtures;
- CSI facility-location batch control;
- deterministic neutral/AMTECH static emissions;
- browser/CSS/UI source checks and optional R3F build;
- resolver, Worker, Zig/Wasm, field, and conversion scaffolds.

## Not implemented or accepted

- `ProjectInput` and source/evidence/asset intake contracts;
- coding-agent orchestration/checkpoint/repair lifecycle;
- generated ontology and manifest composition from raw business inputs;
- independent context-corpus workflow and frozen splits;
- candidate page-coordinate compiler;
- `PageGenerationJob` compiler;
- specialized research/content/utility/SEO/UI/critic agent runner;
- framework preview/corpus-review UX;
- explicit primary-prototype semantics;
- calibrated independent proposal relevance;
- typed semantic graph paths;
- public AI Employee task IR;
- production vector-kernel benchmark and native/Wasm acceptance;
- resolver/Worker/Wasm/distribution correctness;
- browser/accessibility/Core Web Vitals;
- reviewed indexed corpus, search, conversion, or revenue proof.

## Authority and generation graph

```text
user/project input [target]
  business + purpose + offers/services
  prospect knowledge + roles/locations/stages
  workflows/integrations/constraints
  proof/sources/limitations/pricing
  brand/assets/design/copy rules
  stack/browsers/deployment/budgets
        |
        v
agent orchestrator [target]
  +-> ProjectInput
  +-> source/evidence/asset ledgers
  +-> existing URL/content inventory
  +-> independent ContextCorpus + frozen splits
  +-> ontology/axes/values/synonyms/exclusions
  +-> candidate PageCoordinates
        |
        v
hybrid candidate/selection system [partial controls]
  +-> hard eligibility/policy
  +-> lexical + learned semantic + facet + graph prefilter
  +-> multi-prototype HRR/HDC compatibility
  +-> duplicate/cannibalization checks
  +-> facility-location coverage
  +-> CSI/random/stratified/diversity batch controls
  +-> lifecycle/business value
        |
        v
SelectedCorpusPlan [target]
  accepted/rejected/consolidated coordinates + rationale
        |
        v
PageGenerationJob compiler [specified in 21]
  +-> target prototypes + canonical question
  +-> service/offer/topic/problem/workflow/integration/outcome
  +-> evidence + allowed/prohibited claims
  +-> information/utility/task objects
  +-> graph/path + cannibalization constraints
  +-> brand/assets/UI capabilities + conversion path
  +-> generation passes + validation gates
        |
        v
specialized agent passes [target]
  research -> concept -> content -> utility/task -> SEO/graph
  -> UI -> critic -> compiler repair
        |
        v
site-manifest.yaml [implemented compiled state]
  +-> namespace + symbol version + dimensions + axes
  +-> context/page atoms + multi-prototype regions
  +-> evidence + claims + information/utility objects
  +-> modules + pages + profiles + publication gates
  +-> browser/design/task requirements
        |
        v
reference/src/manifest.ts
  +-> CompiledHyperVectorSpace
  +-> canonical spaceHash
  +-> computed-but-uncalibrated proposal report
  +-> noindex proposal gate
  +-> untyped neighbor page IDs
        |
        v
reference/src/framework.ts
  +-> SiteSource/PageIR all-prototype state
  +-> packed prototype offsets/IDs/vectors
  +-> single primary-vector compatibility alias
  +-> CSR page-ID graph
  +-> static emissions
        |
        +-> agent-harness.ts -> bounded generation context
        +-> csi.ts / optimizer.ts -> corpus selection controls
        +-> ui-scaffold.ts / ui-metaprogramming.ts / ui-renderer.ts
        +-> three-scene.ts / R3F -> optional noncanonical visualization
        +-> resolver.ts / worker/ -> finite runtime research
        +-> zig/ / wasm.ts -> portable vector-kernel research
        +-> distribution.ts -> field-analysis scaffold
```

## Prospect-context and page-coordinate model

Prospect context may combine seemingly unrelated attributes when their conjunction changes useful page behavior:

```text
occupation + property status + household/life-stage constraint + pet/interest
+ location + schedule + software environment + task + risk + desired outcome
```

A page coordinate is broader than a demographic vector:

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
```

Attributes belong only when they materially affect useful content, proof, workflow, utility/task, conversion, or UI. Protected/sensitive targeting, named-person profiling, private history, fingerprinting, and unsupported stereotypes are prohibited.

One page may serve several prototypes when the answer/utility/proof/path are the same. One prototype may produce multiple pages when intent or information objects differ. The optimizer must decide split versus consolidate.

## Agent-operated lifecycle

Canonical authorities: `20`, `21`, and `22`.

```text
1. inspect project/business/brand/assets
2. normalize ProjectInput, sources, evidence, claims, workflows, offers, constraints
3. build independently reviewable context/demand corpus and splits
4. generate governed ontology and vector identity
5. propose many candidate context × intent × offer/topic coordinates
6. prune with typed eligibility, evidence, and policy
7. prefilter with lexical/semantic/facets/graph
8. score multi-prototype compatibility
9. reject duplicates, stereotypes, and unsupported combinations
10. select finite corpus with facility-location/CSI controls
11. compile PageGenerationJobs
12. agent writes content and builds utilities/tasks/SEO/graph/UI
13. compile, validate, criticize, repair, and preview
14. human review and separate publication
15. measure search/task/commercial outcomes and update topology
```

## Three planes

```text
publication
  independent contexts + vector chunks -> candidate coordinates
  -> selected jobs -> agent-generated stable nodes -> reviewed corpus

navigation
  typed semantic edges -> useful node paths

interaction
  canonical page + explicit task -> secure streamed employee work
  -> typed artifact/approval/proof
```

Publication compiler mechanics are partially implemented. Generation jobs are specified but not implemented. Navigation remains raw similarity. Interaction is absent from website IR.

## Validation authority graph

`22-agent-operated-framework-workflow-validation-matrix.md` maps every major system feature to:

```text
purpose/effect
user-visible contract
developer/agent contract
simpler baseline
validation vector
pass vector
fail vector
current implementation state
proof artifact
```

Coverage includes:

- agent interface and ProjectInput;
- independent research/context corpus;
- ontology, identity, prototypes, and candidate generation;
- relevance, facility location, CSI, and generation jobs;
- specialized agent passes and content specificity;
- evidence, graph, public tasks, UI, CSS, R3F, Wasm;
- deterministic compiler, framework DX, user review UX, preview;
- publication, measurement, and memory.

Existing scientific and normative authorities remain in `04`, `05`, `12`, `13`, `15`, `16`, `17`, `18`, `19`, and `20`. `22` is the cross-cutting operational matrix tying them together.

## Why Wasm exists

The vector system can create large repeated data-parallel workloads during agent generation and repair loops. Wasm is a candidate portable execution substrate, not a requirement created merely by using vectors.

```text
shared Zig kernel [target]
  +-> native scalar/SIMD: local agent and CI bulk builds
  +-> Wasm scalar/SIMD: portable sandbox, CI, browser diagnostics, edge

TypeScript typed-array oracle [implemented]
  -> correctness and fallback
```

Candidate kernel operations:

- HRR binding/superposition/normalization;
- batched dot/cosine and multi-prototype top-k;
- duplicate/cannibalization matrices;
- facility-location and CSI marginals;
- clustering/validation sweeps;
- packed-vector serialization/parity.

Keep orchestration, LLM/network calls, source parsing, policy, prose, HTML/CSS, repository writes, and static delivery outside Wasm.

Canonical pages are static-asset-first. Edge Wasm is only for a measured finite resolver or computational utility.

## Computation funnel

```text
millions of theoretical combinations
-> typed/prohibited-combination pruning
-> plausible candidate coordinates
-> lexical/semantic/facet/graph prefilter
-> bounded multi-prototype vector scoring
-> duplicate/evidence/utility checks
-> corpus optimizer
-> accepted PageGenerationJobs
-> tens/hundreds/thousands of reviewed stable nodes
-> static emissions
```

Do not dense-score or publish the full Cartesian space. Page count is not success.

## Deep-review status

Original: `validation/reports/2026-07-17-vector-node-path-deep-code-review.md`

Correction proof: `validation/reports/2026-07-17-vector-native-corrections.md`

Current comprehensive review: `validation/reports/2026-07-17-comprehensive-codebase-reorientation-review.md`

closed[4]:
  F-01 namespace/version-symbol-identity
  F-02 broad-hash-order-stability
  F-03 all-prototype-packed-preservation
  F-06 all-prototype-agent-context

partial[1]:
  F-04 "coverage is computed; calibration and independent contexts remain P0"

open:
  project-input-and-agent-orchestration
  independent-context-corpus
  candidate-coordinate-compiler
  page-generation-job-compiler
  specialized-agent-pass-runner
  preview-review-ux
  primary-prototype-semantics
  shifted-cosine-coverage-calibration
  typed-graph-paths
  synthetic-benchmark-validity
  public-employee-task-ir
  vector-kernel-performance-acceptance
  resolver-worker-wasm-safety
  experiment-event-correctness
  ontology-evidence-browser-field-acceptance

## Critical code and authority paths

| Path | Current role | Boundary |
|---|---|---|
| `20-agent-operated-vector-site-generation-and-wasm.md` | product/use/execution model | orchestration target, not code |
| `21-vector-to-generation-job-compiler.md` | vector-to-agent page-generation bridge | specified, not implemented |
| `22-agent-operated-framework-workflow-validation-matrix.md` | whole-system validation/pass/fail matrix | authority, not implementation |
| `reference/src/benchmark.ts` | vector identity + synthetic controls | token-hash semantic; generated labels |
| `reference/src/manifest.ts` | composer + prototypes + proposal mechanics | shifted cosine; self-supplied contexts; untyped links |
| `reference/src/framework.ts` | semantic/all-prototype packed IR | primary alias implicit |
| `reference/src/csi.ts` | FLCI batch control | naive; no curvature diagnostic |
| `reference/src/optimizer.ts` | facility/composite/LogDet controls | research input validation only |
| `reference/src/resolver.ts` | finite variant fixture | no vector identity/hash; 32-bit mask |
| `reference/worker/src/index.ts` | asset-first Worker scaffold | diverges from TS resolver |
| `reference/src/wasm.ts` | Wasm ABI adapter | memory-grow view risk; no live parity |
| `reference/zig/kernel.zig` | native/Wasm math source scaffold | no exact-head compile/performance proof |
| `reference/src/distribution.ts` | field metrics scaffold | no experiment/window-safe aggregation |
| `reference/src/ui-*` | deterministic static UI | browser/accessibility field proof pending |

## Academic, platform, and framework-ergonomic controls

- context relevance: https://arxiv.org/abs/2309.05113
- HDC/VSA applications: https://arxiv.org/abs/2112.15424
- CSI batch selection: https://arxiv.org/abs/2605.24779
- WebAssembly core/SIMD: https://www.w3.org/TR/wasm-core/
- Cloudflare Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- R3F performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Vite lifecycle: https://vite.dev/guide/
- Next.js lifecycle: https://nextjs.org/docs/app/getting-started/installation
- Astro lifecycle: https://docs.astro.build/en/install-and-setup/
- Playwright user-facing tests: https://playwright.dev/docs/best-practices
- Google scaled-content boundary: https://developers.google.com/search/docs/essentials/spam-policies

These support component methods, expected framework ergonomics, and constraints. None proves SEO or commercial lift.

## Read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `AGENTS.md`
5. `README.md`
6. `memory/MEMORY.md`
7. newest immutable memory file
8. `20-agent-operated-vector-site-generation-and-wasm.md`
9. `21-vector-to-generation-job-compiler.md`
10. `22-agent-operated-framework-workflow-validation-matrix.md`
11. `18-vector-node-path-web-framework-model.md`
12. `19-vector-native-corrections-and-csi-validation.md`
13. comprehensive review report
14. newest exact proof report
15. `site-manifest.yaml`
16. `reference/README.md` and UI handoff
17. older domain specifications

## Exact source proof

```text
validated code head: 9ef48b97308e09d5a97f4978820255e3c8b53c7e
workflow run: 29576487817
Node tests: 22/22
pages: 6
indexable: 0
prototypes: 7
namespace: amtech-hyper-site-v1
symbol version: 1
```

This proof predates and does not include the target agent orchestration, generation-job, or framework UX layers.

## Next path

```text
ProjectInput + source/evidence/asset contracts
-> independent ContextCorpus + frozen split contracts
-> primary prototype semantics
-> calibrated compatibility
-> typed node paths
-> candidate coordinate compiler + staged funnel
-> PageGenerationJob compiler
-> specialized agent runner/checkpoints/repair
-> preview/corpus-review framework UX
-> TS/Zig-native/Wasm scalar+SIMD benchmark
-> public task-surface IR
-> first 20–40 noindex agent-generated pages
-> browser/accessibility/performance proof
-> separate field publication
```