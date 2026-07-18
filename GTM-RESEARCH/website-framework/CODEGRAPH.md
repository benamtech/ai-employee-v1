# CODEGRAPH.md — Agent-Operated Vector-Native Website Generation Compiler

Status: groundwork orchestration, deterministic compiler, and UI scaffold source-wired; real provider, external relevance, browser, runtime, and field acceptance pending  
Updated: 2026-07-17  
Scope: `GTM-RESEARCH/website-framework/`

## Product and source graph

```text
user business + brand + assets + sources + goals
        |
        v
ProjectInput + ledgers
  reference/src/project-input.ts
        |
        v
independent ContextCorpus + frozen splits
  reference/src/context-corpus.ts
        |
        +-> train-only isotonic calibration
        v
candidate PageCoordinates
  reference/src/page-coordinate.ts
  explicit primary + multi-prototypes
  typed eligibility -> calibrated compatibility
        |
        v
SelectedCorpusPlan
  reference/src/corpus-plan.ts
  facility coverage + information + rare-tail + diversity controls
        |
        +-> typed page graph
        |   reference/src/typed-graph.ts
        v
PageGenerationJobs
  reference/src/page-generation.ts
        |
        v
specialized agent runner
  research -> concept -> content -> utility/task
  -> SEO/graph -> UI -> critic -> bounded repair/reject
        |
        v
framework preview/validation UX
  reference/src/framework-preview.ts
  reference/scripts/framework-cli.mjs
        |
        v
existing unified manifest and compiler
  site-manifest.yaml
  reference/src/manifest.ts
  reference/src/framework.ts
        |
        +-> static HTML/schema/sitemap/instructions
        +-> packed prototype vectors + CSR graph
        +-> UI scaffold/AMTECH renderer
        +-> optional noncanonical R3F
```

`reference/src/framework-orchestrator.ts` is the single source-wired orchestration entrypoint. `reference/src/validation-contracts.ts` supplies the cross-layer validation/pass/fail report model.

## Source-wired now

- deterministic `ProjectInput`, business/brand/technical/goals, and source/evidence/asset ledgers;
- independent context provenance and generation-agent separation;
- multiple assessors and Perfect/Good/Fair/Bad judgments;
- deterministic frozen train/validation/test splits and hashes;
- train-only isotonic compatibility calibration with validation/test metrics;
- ineligible compatibility fixed at zero;
- explicit primary prototype semantics for generated coordinates;
- typed semantic graph edges and path queries;
- candidate coordinate compiler;
- budgeted composite selected-corpus plan;
- typed noindex generation-job compiler;
- provider-neutral ordered agent runner, source restrictions, checkpoint hashes, bounded repair, and rejection;
- static selected/rejected preview with validation reports;
- doctor/plan/validate/preview operator commands;
- 22 code-level validation attributes across the new layers;
- existing versioned HDC/VSA compiler, all-prototype packed IR, static renderer, browser policy, and R3F source build.

## Critical code paths

| Path | Role | Current boundary |
|---|---|---|
| `reference/src/validation-contracts.ts` | Stable validation attributes/findings/reports | Report quality depends on supplied measurements |
| `reference/src/project-input.ts` | Project and ledgers | No arbitrary repository scanner yet |
| `reference/src/context-corpus.ts` | Independent contexts, splits, calibration | Current proof corpus is synthetic |
| `reference/src/page-coordinate.ts` | Explicit-primary candidate compiler | No BM25/learned-semantic prefilter yet |
| `reference/src/corpus-plan.ts` | Finite corpus optimizer | Current selection study is small fixture proof |
| `reference/src/typed-graph.ts` | Typed navigation graph | Legacy manifest links remain untyped |
| `reference/src/page-generation.ts` | Job compiler and runner | No real model-provider adapter yet |
| `reference/src/framework-preview.ts` | Static review UX | Not a full interactive corpus editor |
| `reference/src/framework-orchestrator.ts` | Groundwork pipeline | Successful agent output is not yet transacted into manifest modules/pages |
| `reference/scripts/framework-cli.mjs` | Operator UX | Real projects must provide a project module |
| `reference/src/manifest.ts` | Existing manifest compiler | Legacy proposal path retains older relevance mechanics |
| `reference/src/framework.ts` | Semantic/persisted output compiler | Legacy hand-authored pages need explicit-primary migration |
| `reference/src/wasm.ts`, `reference/zig/` | Vector-kernel research | No full-loop native/Wasm acceptance |
| `reference/src/ui-*` | Static UI | Browser/accessibility field proof pending |

## Validation authorities

Read in this order:

1. `README.md`
2. `memory/MEMORY.md` and newest immutable handoff
3. `23-groundwork-orchestration-implementation.md`
4. `22-agent-operated-framework-workflow-validation-matrix.md`
5. `21-vector-to-generation-job-compiler.md`
6. `20-agent-operated-vector-site-generation-and-wasm.md`
7. `18-vector-node-path-web-framework-model.md`
8. `19-vector-native-corrections-and-csi-validation.md`
9. `validation/reports/2026-07-17-groundwork-orchestration-implementation.md`
10. `site-manifest.yaml`

Historical validation remains in `04`, `05`, `12`, `13`, `15`, `16`, and `17`.

## Exact source proof

```text
validated source head before documentation: ad3c81cfc202ba94f63f08b54649cfaaf71b00d7
workflow run: 29624909676
tests: 30/30
manifest emission: pass
UI emission: pass
orchestration emission: pass
framework validate/preview: pass
browser resolution: pass
R3F build: pass
```

Fixture result:

```text
6 contexts: 2 train / 2 validation / 2 test
3 candidates
2 selected
1 exact duplicate rejected with reason
2/2 generation jobs completed after bounded repair
validation/test fixture coverage: 1.0 / 1.0
```

## Not accepted

- real repository/source extraction;
- real independent search/customer context corpus;
- learned-semantic/BM25/facet/graph ranking comparison;
- real Codex/Claude/Pi executor;
- agent-output transaction into canonical manifest state;
- public AI Employee task IR/runtime;
- legacy manifest explicit-primary and typed-edge migration;
- browser/accessibility/Core Web Vitals;
- Zig-native/Wasm end-to-end benefit;
- indexed corpus, search lift, conversion, gross profit, or revenue.

## Next path

```text
repository/source ingestion adapters
-> independent context collection + assessor workflow
-> lexical/learned-semantic/facet/graph prefilter comparison
-> provider-neutral agent adapter
-> generated output transaction into unified manifest
-> first 20–40 real noindex jobs/pages
-> browser/accessibility/performance validation
-> separate matched field publication
```
