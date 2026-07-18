# 23 — Groundwork Orchestration Implementation

Status: controlling source-level implementation authority; production and external-relevance acceptance pending  
Updated: 2026-07-17

## Result

The framework now has one executable groundwork path from normalized project inputs through an agent-generation preview:

```text
ProjectInput
-> source/evidence/asset ledgers
-> independent ContextCorpus
-> frozen train/validation/test splits
-> isotonic compatibility calibration
-> explicit-primary PageCoordinates
-> typed eligibility + calibrated multi-prototype scoring
-> composite finite-corpus selection
-> typed page graph
-> PageGenerationJobs
-> bounded specialized-agent runner and repair
-> static framework preview and validation artifact
```

The existing manifest, semantic compiler, UI renderer, browser policy, and optional R3F build remain downstream controls. This implementation does not yet call Codex, Claude Code, Pi, or another model provider. It defines the provider-neutral typed orchestration boundary those agents must implement.

## Source map

| Layer | Source | Effect |
|---|---|---|
| Validation contracts | `reference/src/validation-contracts.ts` | Every implemented layer reports purpose, algorithm, user/developer effect, validation, pass, fail, baseline, severity, findings, and stable report hash. |
| Project intake | `reference/src/project-input.ts` | Normalizes business, brand, technical, goal, source, evidence, and asset state into deterministic ledgers. |
| Context ground truth | `reference/src/context-corpus.ts` | Preserves independent provenance, multiple assessors, graded labels, frozen splits, split hashes, and calibration data. |
| Compatibility | `reference/src/context-corpus.ts` | Fits train-only pool-adjacent-violators isotonic calibration; evaluates validation/test Brier, MAE, and ECE; ineligible cases receive zero. |
| Typed navigation | `reference/src/typed-graph.ts` | Compiles stable semantic edges with type, rationale, sources, eligibility, priority, incoming/outgoing indexes, paths, and graph hash. |
| Page opportunities | `reference/src/page-coordinate.ts` | Converts candidate conjunctions into explicit-primary, multi-prototype, evidence/utility/conversion-bound coordinates. |
| Corpus planning | `reference/src/corpus-plan.ts` | Selects a finite corpus under budget using calibrated facility coverage plus inspectable information, rare-tail, and diversity components. |
| Generation jobs | `reference/src/page-generation.ts` | Compiles selected coordinates into deterministic noindex jobs with sources, evidence, graph, design, conversion, pass plan, and validation plan. |
| Agent execution | `reference/src/page-generation.ts` | Runs ordered research/concept/content/utility/SEO/UI/critic passes with source enforcement, checkpoint hashes, bounded repair, and rejection. |
| Preview UX | `reference/src/framework-preview.ts` | Emits a JavaScript-free selected/rejected page review with validation reports and explicit rejection reasons. |
| Orchestrator | `reference/src/framework-orchestrator.ts` | Wires the complete sequence and stops at any hard validation failure. |
| Operator commands | `reference/scripts/framework-cli.mjs` | Provides `doctor`, `plan`, `generate`, `preview`, `validate`, and `build` semantic operations over one project module. |
| Fixture and proof | `reference/fixtures/orchestration-fixture.mjs`, `reference/test/orchestration.test.mjs` | Proves the path with explicit independent fixtures and adversarial failure tests. |

## Algorithm choices

### Canonical project state

Stable sorted serialization and SHA-256 are used for project, ledger, corpus, split, candidate, plan, job, run, preview, and validation identities.

Pass:
- logical source/asset reordering preserves identity;
- truth changes alter downstream hashes;
- checkpoints are inspectable.

Fail:
- conversational state is the only authority;
- array ordering changes meaning accidentally;
- an agent silently replaces prior truth.

### Independent ContextCorpus

Each context case requires query/task, feature atoms, source IDs, positive weight, provenance class, assessor identities, graded judgments, and rationale. The generation agent cannot be the accepted context author when independence enforcement is enabled.

Pass:
- frozen train/validation/test membership;
- multiple assessors;
- disagreement retained;
- split hashes stable under source ordering.

Fail:
- the page-writing agent creates its own sole acceptance examples;
- test membership changes after generation;
- judgments lack rationale or provenance.

### Compatibility calibration

The source path replaces shifted-cosine-as-probability with:

```text
typed eligibility
-> raw positive cosine
-> train-only isotonic calibration
-> untouched validation/test metrics
```

Ineligible contexts always receive `0`. The calibration model is monotonic and stores its training observation IDs and hash.

Pass:
- fitting uses train observations only;
- validation/test metrics are finite;
- monotonic mapping;
- an ineligible or negative-cosine case receives no artificial 0.5 baseline.

Fail:
- `(cosine + 1) / 2` is interpreted as external relevance probability;
- test labels tune thresholds;
- semantic policy is bypassed by vector similarity.

Boundary: the included calibration data is synthetic fixture evidence. Real acceptance requires independently judged query/context/document data.

### Explicit primary prototypes

Every generated `PageCoordinate` requires `primaryPrototypeId`; compilation verifies membership and places that prototype first in the canonical job state while retaining every secondary prototype.

Pass:
- prototype input reordering preserves candidate hash and primary identity;
- all prototypes remain available for compatibility.

Fail:
- array position implicitly defines canonical meaning;
- the primary references a missing prototype;
- secondary compatibility regions are discarded.

Boundary: the new orchestration path is explicit-primary. Existing hand-authored manifest fixtures still use the older compiler path and must be migrated before field publication.

### Typed graph paths

Published graph proposals use a bounded taxonomy: broader, narrower, prerequisite, workflow step, integration dependency, proof/control, comparison, live task, Start Free, and managed service.

Pass:
- stable edge ID;
- known source and destination;
- non-empty rationale and sources;
- explicit eligibility and priority;
- orphan/path review visible.

Fail:
- raw vector proximity automatically becomes a published link;
- edge purpose is unknowable;
- self-loops or missing pages compile.

### Candidate and corpus planning

Candidate coordinates bind prospect context to intent, service/offer, topic/problem, workflow/integration, information or utility object, evidence, desired outcome, and conversion path. Hard eligibility runs before calibrated scoring. Selection is budgeted and trains on train contexts while separately reporting validation and test coverage.

Pass:
- no Cartesian emission;
- explicit page lifecycle cost;
- held-out coverage reported;
- redundant candidates receive rejection reasons;
- component objectives are inspectable.

Fail:
- page count is the objective;
- test cases drive selection;
- a vector without evidence, utility, intent, or conversion becomes a page;
- diversity rewards isolated noise without coverage value.

### PageGenerationJob and agent runner

A job is a deterministic typed contract, not a free-form prompt. It carries prototypes, context atoms, exclusions, evidence, allowed/prohibited claims, required modules/roles, typed edges, cannibalization exclusions, brand/assets, conversion path, noindex gate, generation passes, and validation attributes.

The runner:
- enforces pass order;
- restricts outputs to declared source IDs and validation attributes;
- hashes every checkpoint;
- permits a bounded repair count;
- rejects on exhausted hard failure.

Pass:
- complete ordered passes;
- all outputs reviewable;
- bounded repair succeeds or rejects;
- no silent publication.

Fail:
- unbounded agent loop;
- undeclared evidence use;
- compiler failure ignored;
- one generic prompt writes and publishes the site.

### Preview and framework UX

The source package now exposes:

```bash
npm run framework:doctor
npm run framework:plan
npm run framework:validate
npm run framework:preview
```

The generic CLI accepts a manifest plus a project module implementing the typed input/executor factory. The fixture is only a proof module.

The preview includes project identity, split counts, plan/objective, held-out coverage, selected pages, explicit primaries, generation status, rejected coordinates/reasons, and all validation reports. It contains no script tag.

Pass:
- user and developer see selected and rejected work;
- exact failures and hashes are shared by local agent and CI;
- static review works without JavaScript.

Fail:
- only raw stack traces or chat history exist;
- rejected combinations disappear silently;
- preview requires the production runtime.

## Validation inventory

Implemented code-level attributes:

```text
ProjectInput/ledgers: 7
Context/calibration: 4
Typed graph: 3
Coordinate/selection/job/runner/preview: 8
Total new attributes: 22
```

These complement the broader 27-feature operational matrix in `22-agent-operated-framework-workflow-validation-matrix.md` and the existing compiler/UI validation authorities.

## Exact source proof

Validated source head: `ad3c81cfc202ba94f63f08b54649cfaaf71b00d7`  
GitHub Actions run: `29624909676`

Passed stages:

```text
strict TypeScript build
30/30 Node tests
legacy unified-manifest emission
legacy deterministic UI emission
new orchestration emission
framework validate command
framework preview command
browser-target resolution
React/R3F/Three.js build
artifact upload
```

Workflow artifact digest: `sha256:60e79249efa0a7e6f5119ce7bf70fe5ab5742b6b907ab2aa1d851747b61cfef2` from the first identical implementation run; the final run also uploaded all four emission groups.

Groundwork fixture outputs:

```text
Project hash: 3b695e0952f0c346eeb8a6d5736ecf266531f8c558254d127017d37bc27cba2d
Context corpus hash: e99f20fb92f2b5729ae91fde99acf21ed33c2bae5934116baeff873880289e81
Prepared hash: 388c70fe0116512375c4e73c3df00d84a74e707a51f18870befa0d9ac22cb454
Execution hash: 1f42528d8a9f8d93db43983ffbd0335f157d588d78b95fbbeca88676508ecb91
Preview hash: 1b7c0a0697f8da3e55fc0ac575e92ded15c11b22ddf97cba8191445d8b85d1d4
Selected: candidate:landscape-leads, candidate:painting-estimate
Rejected: candidate:painting-estimate-copy — redundant with selected corpus (1.000)
Generation jobs completed: 2/2
Validation/test fixture coverage: 1.0 / 1.0
```

These scores demonstrate deterministic wiring against constructed fixtures, not external search relevance.

## Adversarial proof

The tests explicitly verify:
- self-authored acceptance contexts are rejected;
- ineligible context compatibility is exactly zero;
- primary identity and candidate hash survive prototype reordering;
- duplicate candidate is rejected with a reason;
- content failure triggers bounded repair;
- exhausted repair rejects the job;
- the preview exposes rejection and validation state;
- the preview contains no executable JavaScript.

## Still pending

- Real repository scanning and automatic `ProjectInput` creation.
- Real independent customer/search context collection and assessor workflow.
- Learned semantic/BM25/facet/graph comparison in the candidate funnel.
- CSI curvature/scale diagnostics in this orchestration path.
- Provider adapters for Codex, Claude Code, Pi, or another agent.
- Conversion of successful agent outputs into `ManifestModule`, evidence, claim, task, and page records.
- Public AI Employee task-surface IR and runtime.
- Migration of legacy manifest pages to explicit primary prototype fields and typed graph edges.
- Browser screenshot, accessibility-tree, Core Web Vitals, and mobile GPU acceptance.
- Native Zig versus Wasm scalar/SIMD full-loop benchmarks.
- Real indexed page cohort and search/commercial evidence.

## Next implementation gate

```text
real repository/project intake adapters
-> independent context research/assessment tooling
-> lexical + learned-semantic + facet + graph candidate prefilter
-> provider-neutral agent adapter and module-output contract
-> generated proposal -> unified manifest transaction
-> review UI against first 20–40 real noindex pages
-> browser/accessibility/performance gate
-> separate matched field publication
```
