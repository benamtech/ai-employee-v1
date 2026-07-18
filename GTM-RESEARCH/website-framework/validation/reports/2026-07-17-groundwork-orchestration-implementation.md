# Groundwork Orchestration Implementation — Validation Report

Date: 2026-07-17  
Branch: `agent/ui-metaprogramming-pass-1`  
Status: source-level pass; external relevance, provider, browser, runtime, and field acceptance pending

## Scope

Implement and wire:

```text
ProjectInput and ledgers
-> independent ContextCorpus and frozen splits
-> explicit primary prototypes
-> calibrated compatibility
-> typed graph paths
-> candidate PageCoordinates
-> SelectedCorpusPlan
-> PageGenerationJobs
-> specialized agent runner
-> framework validation/preview UX
```

No production page was published. All fixture pages and candidate artifacts remain research-only.

## Files reviewed and implemented

```text
reference/src/validation-contracts.ts
reference/src/project-input.ts
reference/src/context-corpus.ts
reference/src/typed-graph.ts
reference/src/page-coordinate.ts
reference/src/corpus-plan.ts
reference/src/page-generation.ts
reference/src/framework-preview.ts
reference/src/framework-orchestrator.ts
reference/scripts/framework-cli.mjs
reference/scripts/run-orchestration.mjs
reference/fixtures/orchestration-fixture.mjs
reference/test/orchestration.test.mjs
reference/package.json
.github/workflows/website-framework-reference.yml
```

## Validation/pass/fail disposition

| Feature | Validation | Pass | Fail prevented | State |
|---|---|---|---|---|
| ProjectInput | Typed business/brand/technical/goals | Stable canonical hash and complete hard fields | Prompt-only project truth | Pass |
| Source ledger | Unique IDs, provenance, dates, applicability, confidence | Deterministic ledger | Claims supported only by chat context | Pass |
| Asset ledger | IDs, purpose, rights, hash | Explicit rights state | Untracked or invented asset | Pass for fixture |
| Context independence | Provenance class, generator separation, assessors | Self-authored acceptance case rejected | Circular page justification | Pass |
| Frozen splits | Seed, split/hash stability | Train/validation/test stable under reorder | Re-splitting after generation | Pass |
| Graded labels | Perfect/Good/Fair/Bad plus rationale/disagreement | Multiple assessors retained | Binary self-label | Pass |
| Calibration | Train-only isotonic fit, validation/test metrics | Monotonic mapping; ineligible zero | Shifted cosine treated as probability | Pass for synthetic fixture |
| Primary prototype | Explicit ID and membership | Reorder-stable primary and candidate hash | Array-first primary drift | Pass in new orchestration path |
| Eligibility | Required shared dimensions and exclusions before score | Ineligible fit exactly zero | Similarity overrides policy | Pass |
| Page specificity | Question, intent, evidence, information/utility, conversion | Accepted coordinates carry distinct utility state | Noun-swapped vector-only page | Pass for fixture |
| Corpus selection | Budgeted calibrated facility objective | Two useful candidates selected under budget | Full Cartesian emission | Pass for fixture |
| Duplicate control | Selected-corpus similarity and rejection reasons | Exact duplicate rejected at 1.000 | Silent cannibalization | Pass |
| Balance controls | Coverage/information/rare/diversity components | Component objectives exposed | One opaque objective | Pass; external study pending |
| Typed graph | Edge taxonomy, rationale, sources, eligibility, priority | Deterministic graph and paths | Raw similarity link publication | Pass for generated fixture |
| Generation job | Typed noindex contract and stable hash | Selected coordinate becomes bounded job | Free-form publish prompt | Pass |
| Agent runner | Ordered passes, source constraints, findings, repair cap | Failure repairs or rejects deterministically | Unbounded loop or ignored failure | Pass |
| Preview | Selected/rejected pages, reasons, validations, hashes | JavaScript-free review artifact | Silent mass generation | Pass |
| Operator UX | doctor/plan/generate/preview/validate/build semantics | CI exercises validate and preview | Only internal APIs and stack traces | Source-wired pass |

## Exact proof

Validated source head before documentation: `ad3c81cfc202ba94f63f08b54649cfaaf71b00d7`  
Workflow: `Website Framework Reference`  
Run: `29624909676`  
Conclusion: success

```text
30 tests
30 pass
0 fail
```

CI stages passed:

```text
npm install
npm test
npm run manifest:emit
npm run ui:emit
npm run orchestration:check
npm run framework:validate
npm run framework:preview
npm run browser:check
npm run ui:r3f:build
artifact upload
```

## Generated orchestration proof

```text
contexts: 6
train: 2
validation: 2
test: 2
candidate coordinates: 3
selected pages: 2
rejected pages: 1
jobs completed: 2/2
validation coverage: 1.0
fixture test coverage: 1.0
preview hard failures: 0
```

Selected:
- `candidate:landscape-leads`
- `candidate:painting-estimate`

Rejected:
- `candidate:painting-estimate-copy` — `redundant with selected corpus (1.000)`

Hashes:

```text
project: 3b695e0952f0c346eeb8a6d5736ecf266531f8c558254d127017d37bc27cba2d
context corpus: e99f20fb92f2b5729ae91fde99acf21ed33c2bae5934116baeff873880289e81
prepared: 388c70fe0116512375c4e73c3df00d84a74e707a51f18870befa0d9ac22cb454
execution: 1f42528d8a9f8d93db43983ffbd0335f157d588d78b95fbbeca88676508ecb91
preview: 1b7c0a0697f8da3e55fc0ac575e92ded15c11b22ddf97cba8191445d8b85d1d4
preview validation: 5dae8aa49c335a5a4a062acdd2e9434181ba150dfaf2c4f11f30759d0155f1a9
```

## Academic interpretation

- Kong et al. supports separate context/document relevance and graded judgments. This implementation adopts that evaluation shape but the fixture is not independently collected field data.
- HDC/VSA supports compositional structured vectors. It does not validate page quality.
- Facility location supplies a finite coverage objective. CSI remains a comparison/batch arm and is not the single-page gate.
- Isotonic regression supplies a monotonic calibration method; real threshold acceptance still requires a larger independent dataset.

## Hard boundaries

This pass does not prove:

- that real business inputs can yet be extracted automatically from arbitrary repositories;
- that the calibration transfers to real queries or prospects;
- that any generated page should be indexed;
- that a real coding-agent provider obeys the executor contract;
- that generated modules can yet transact into the unified manifest;
- that browser/accessibility/Core Web Vitals pass;
- that Zig/Wasm improves the full loop;
- that search, citation, conversion, or revenue improves.

## Next gate

```text
repository/source ingestion adapters
-> independent context collection and assessor workflow
-> lexical/learned-semantic/facet/graph prefilter comparison
-> provider adapter and generated-module transaction
-> legacy manifest primary/typed-edge migration
-> first 20–40 real noindex jobs and reviewed page artifacts
-> browser/accessibility/performance acceptance
-> matched field publication
```
