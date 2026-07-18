# Memory — Agent-Operated Generation + Wasm Research

date: 2026-07-17T20:05:00-04:00
branch: agent/ui-metaprogramming-pass-1
status: documentation/research reorientation; source compiler unchanged; exact-head CI pending

## decision

The framework's primary interface is a repository-aware coding agent, not a human-authored manifest.

```text
user business/brand/assets/source/goals
-> agent inspect/research/normalize
-> independent context corpus + ontology + candidate site program
-> vector-native selection/content/UI/task compilation
-> deterministic emissions + validation + repair
```

`site-manifest.yaml` remains the single compiled-project/corpus authority, but it should be generated and maintained by the agent from higher-level project inputs.

## system verdict

The concept is coherent as a hybrid corpus compiler and optimizer for large combinatorial opportunity spaces.

It is not coherent as:

- exhaustive Cartesian page generation;
- hidden demographic/person personalization;
- HRR-only semantic understanding;
- page-count optimization;
- runtime generation of canonical SEO content.

Hyper-targeting means sourced non-sensitive prospect situations: industry, problem, task, role, stage, location, integration, constraint, proof, outcome, service/offer/task.

## wasm verdict

Wasm is relevant only for repeated data-parallel math and portability.

candidate kernels:
  HRR binding/superposition/normalization
  batched context/page multi-prototype scoring
  top-k and duplicate matrices
  facility-location/CSI marginals
  clustering/validation sweeps
  packed-vector serialization/parity

controls:
  TypeScript typed-array oracle
  Zig native scalar/SIMD
  Zig Wasm scalar/SIMD

Native Zig may win for local agent builds. Wasm's architectural value is one sandboxed deterministic kernel across CI, agent sandboxes, browser diagnostics, and compatible edge runtimes. Canonical pages remain static and must not require Wasm.

## scale intuition

- 1,000 pages × 500 contexts × 512 dimensions ≈ 256M scalar dimension operations per exact pass.
- 2,000 pages × 10,000 contexts × 512 dimensions ≈ 10.24B.
- repeated ablation, duplicate, optimization, and repair loops multiply the workload.
- typed eligibility + lexical/semantic/facet/graph prefilter must reduce dense vector scoring; never score all theoretical combinations.

## search boundary

Current Google guidance permits useful automation but warns against scaled low-value content, doorway behavior, and separate pages for every possible query variation.

The vector system's most important search function is rejection. Every indexable page needs a materially distinct information or utility object, such as a real public AI Employee task, calculator, template, integration workflow, original evidence, location-specific answer, or decision model.

## files

created:
  ../20-agent-operated-vector-site-generation-and-wasm.md

updated:
  ../README.md
  ../AGENTS.md
  ../CODEGRAPH.md

research:
  https://arxiv.org/abs/2309.05113
  https://arxiv.org/abs/2112.15424
  https://arxiv.org/abs/2605.24779
  https://www.w3.org/TR/wasm-core/
  https://developers.cloudflare.com/workers/runtime-apis/webassembly/
  https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
  https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  https://developers.google.com/search/docs/essentials/spam-policies

## validation not run

No new TypeScript, Zig, Wasm, browser, Cloudflare, search, or field implementation was added in this pass. Existing source proof remains 22/22 at code head `9ef48b97308e09d5a97f4978820255e3c8b53c7e`. Exact documentation-head CI is pending.

## next

1. define `ProjectInput` and source/evidence/asset ledger contracts;
2. implement agent orchestration/checkpoints/repair protocol;
3. formalize primary prototype and independent calibrated relevance;
4. benchmark TS vs Zig native vs Wasm scalar/SIMD on realistic candidate/context matrices;
5. implement staged candidate funnel and optimizer;
6. implement bounded content/UI/public-task generation packets;
7. generate first 20–40 noindex agent-operated pages only after P0 gates.