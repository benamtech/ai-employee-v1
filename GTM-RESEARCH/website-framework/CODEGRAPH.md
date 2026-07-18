# CODEGRAPH.md — Agent-Operated Vector-Native Website Compiler

Status: vector-native research compiler/UI scaffold; agent orchestration, relevance, runtime, and field acceptance pending
Updated: 2026-07-17
Scope: `GTM-RESEARCH/website-framework/`

## Product reality

The intended product is not a manifest editor or a hand-authored static-site generator. It is a website compiler operated by a repository-aware coding agent.

```text
user business + brand + assets + source + goals
        |
        v
agentic developer orchestration [target; not implemented]
  inspect/normalize/research
  -> independent context corpus
  -> ontology + candidate page program
  -> content/UI/task proposals
  -> compile/validate/repair/emit
        |
        v
current vector-native compiler [source-wired]
        |
        v
complete static site + optional bounded public AI Employee utilities
```

The user should not need to hand-author `site-manifest.yaml`. The agent generates and maintains it as the single compiled-project/corpus authority.

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
  customers/roles/locations/stages
  workflows/integrations/constraints
  proof/sources/limitations
  brand/assets/design rules
  stack/browsers/deployment/budgets
        |
        v
agent orchestrator [target]
  +-> source/evidence/asset ledgers
  +-> existing URL/content inventory
  +-> independent context corpus
  +-> ontology/axes/values/synonyms/exclusions
  +-> candidate page and utility proposals
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

## Agent-operated lifecycle

Canonical authority: `20-agent-operated-vector-site-generation-and-wasm.md`.

```text
1. inspect project/business/brand/assets
2. normalize sources, evidence, claims, workflows, offers, constraints
3. build independently reviewable context/demand corpus
4. generate governed ontology and vector identity
5. propose many candidate context/page regions
6. prune with typed eligibility + evidence
7. prefilter with lexical/semantic/facets/graph
8. score multi-prototype compatibility
9. reject duplicates and unsupported combinations
10. select finite corpus with facility-location/CSI controls
11. generate bounded content/UI/task contracts
12. compile, validate, repair, and emit
13. human review and separate publication
14. measure search/task/commercial outcomes and update topology
```

## Three planes

```text
publication
  independent contexts + vector chunks -> candidate nodes -> reviewed corpus

navigation
  typed semantic edges -> useful node paths

interaction
  canonical page + explicit task -> secure streamed employee work -> artifact/approval/proof
```

Publication mechanics are partially implemented. Navigation remains raw similarity. Interaction is absent from website IR.

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

Keep orchestration, LLM/network calls, source parsing, policy, prose, HTML/CSS, and static delivery outside Wasm.

Canonical pages are static-asset-first. Edge Wasm is only for a measured finite resolver or computational utility.

## Computation funnel

```text
millions of theoretical combinations
-> typed/prohibited-combination pruning
-> plausible candidate set
-> lexical/semantic/facet/graph prefilter
-> bounded vector-scoring set
-> corpus optimizer
-> tens/hundreds/thousands of accepted stable nodes
-> static emissions
```

Do not dense-score the full Cartesian space. Page count is not success.

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
  primary-prototype-semantics
  shifted-cosine-coverage-calibration
  independent-graded-context-corpus
  typed-graph-paths
  synthetic-benchmark-validity
  public-employee-task-ir
  vector-kernel-performance-acceptance
  resolver-worker-wasm-safety
  experiment-event-correctness
  ontology-evidence-browser-field-acceptance

## Critical code paths

| Path | Current role | Boundary |
|---|---|---|
| `20-agent-operated-vector-site-generation-and-wasm.md` | canonical product/use/execution model | orchestration target, not code |
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

## Academic and platform controls

- context relevance: https://arxiv.org/abs/2309.05113
- HDC/VSA applications: https://arxiv.org/abs/2112.15424
- CSI batch selection: https://arxiv.org/abs/2605.24779
- WebAssembly core/SIMD: https://www.w3.org/TR/wasm-core/
- Cloudflare Wasm: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- Google scaled-content boundary: https://developers.google.com/search/docs/essentials/spam-policies
- full execution model: `20-agent-operated-vector-site-generation-and-wasm.md`

These support component methods and constraints. None proves SEO or commercial lift.

## Read order

1. `../../identity.md`
2. `identity.md`
3. `../../CODEGRAPH.md`
4. `AGENTS.md`
5. `README.md`
6. `memory/MEMORY.md`
7. newest immutable memory file
8. `20-agent-operated-vector-site-generation-and-wasm.md`
9. `18-vector-node-path-web-framework-model.md`
10. `19-vector-native-corrections-and-csi-validation.md`
11. comprehensive review report
12. newest exact proof report
13. `site-manifest.yaml`
14. `reference/README.md` and UI handoff
15. older domain specifications

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

## Next path

```text
ProjectInput + source/evidence/asset contracts
-> agent orchestration/checkpoint/repair lifecycle
-> primary prototype semantics
-> calibrated independent relevance corpus
-> typed node paths
-> TS/Zig-native/Wasm scalar+SIMD benchmark
-> candidate funnel + corpus optimizer
-> public task-surface IR
-> first 20–40 noindex agent-generated pages
-> browser/accessibility/performance proof
-> separate field publication
```